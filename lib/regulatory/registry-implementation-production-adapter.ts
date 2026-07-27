import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import {
  lstat,
  mkdir,
  mkdtemp,
  open,
  readFile,
  realpath,
  rename,
  rm,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import {
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
  sep,
} from "node:path";

import {
  executeRegulatoryImplementationPullRequest,
  type RegulatoryImplementationCheckResult,
  type RegulatoryImplementationCommitRecord,
  type RegulatoryImplementationExecutionResult,
  type RegulatoryImplementationPullRequestRecord,
  type RegulatoryImplementationRepositoryAdapter,
  type RegulatoryImplementationRepositoryState,
} from "./registry-implementation-executor";
import type { RegulatoryRegistryImplementationPlan } from "./registry-implementation-plan";
import type { RegulatoryImplementationPullRequestBundle } from "./registry-implementation-pr-bundle";

const EXPECTED_REPOSITORY = "siricarsen-cmd/subshield";
const EXPECTED_DEFAULT_BRANCH = "main";
const MAX_OUTPUT_BYTES = 256 * 1024;
const COMMIT_SHA_RE = /^[a-f0-9]{40}$/;
const SAFE_PERMISSION = new Set(["ADMIN", "MAINTAIN", "WRITE"]);
const ALLOWED_PATHS = Object.freeze([
  "lib/regulatory/benchmark-applicability-mappings.ts",
  "lib/regulatory/historical-grounding-policy.ts",
  "lib/regulatory/source-coverage-citation-packages.ts",
] as const);
const ALLOWED_PATH_SET = new Set<string>(ALLOWED_PATHS);
const REQUIRED_CHECKS = Object.freeze([
  "npm run test:regulatory",
  "npm run test:accuracy",
  "npx tsc --noEmit",
  "npm run build",
] as const);

type AllowedCheck = (typeof REQUIRED_CHECKS)[number];
type AdapterState =
  | "created"
  | "branch-created"
  | "files-written"
  | "committed"
  | "checking"
  | "checked"
  | "pushed"
  | "pr-created"
  | "cleaned";

interface CommandResult {
  stdout: string;
  exitCode: number;
}

interface CommandRequest {
  executable: string;
  args: readonly string[];
  cwd: string;
  label: string;
  env?: NodeJS.ProcessEnv;
  allowedExitCodes?: readonly number[];
}

interface GitHubRepositoryView {
  nameWithOwner?: string;
  defaultBranchRef?: { name?: string } | null;
  viewerPermission?: string;
}

interface GitHubPullRequestView {
  number?: number;
  url?: string;
  baseRefName?: string;
  headRefName?: string;
  headRefOid?: string;
  title?: string;
  body?: string;
  state?: string;
  isDraft?: boolean;
  autoMergeRequest?: unknown;
  createdAt?: string;
}

export interface RegulatoryImplementationProductionOptions {
  repositoryRoot: string;
}

/** Pure, non-mutating helpers exposed only for deterministic security tests. */
export const regulatoryImplementationProductionAdapterTestSurface = Object.freeze({
  allowedPaths: [...ALLOWED_PATHS],
  requiredChecks: [...REQUIRED_CHECKS],
  normalizeOriginUrl,
  validateBranchName,
  validateRepositoryPath,
  checkInvocation,
});

function commandFailure(label: string): Error {
  return new Error(`Controlled production adapter command failed: ${label}`);
}

function runCommand(request: CommandRequest): Promise<CommandResult> {
  const allowed = new Set(request.allowedExitCodes ?? [0]);
  return new Promise((resolvePromise, rejectPromise) => {
    execFile(
      request.executable,
      [...request.args],
      {
        cwd: request.cwd,
        encoding: "utf8",
        env: request.env,
        maxBuffer: MAX_OUTPUT_BYTES,
        shell: false,
        windowsHide: true,
      },
      (error, stdout) => {
        const exitCode =
          error && typeof error.code === "number" ? error.code : error ? -1 : 0;
        if (!allowed.has(exitCode)) {
          rejectPromise(commandFailure(request.label));
          return;
        }
        const output = typeof stdout === "string" ? stdout : String(stdout ?? "");
        if (Buffer.byteLength(output, "utf8") > MAX_OUTPUT_BYTES) {
          rejectPromise(commandFailure(request.label));
          return;
        }
        resolvePromise({ stdout: output, exitCode });
      }
    );
  });
}

function normalizedJson<T>(value: string, label: string): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    throw new Error(`Controlled production adapter returned invalid ${label}`);
  }
}

function exactString(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Controlled production adapter ${label} is invalid`);
  }
  return value.trim();
}

function exactIsoInstant(value: unknown, label: string): string {
  const candidate = exactString(value, label);
  const parsed = new Date(candidate);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString() !== candidate) {
    throw new Error(`Controlled production adapter ${label} is invalid`);
  }
  return candidate;
}

function normalizeOriginUrl(value: string): string {
  const candidate = value.trim();
  const scp = candidate.match(/^git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?$/i);
  if (scp) return `${scp[1]}/${scp[2]}`.toLowerCase();

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new Error("Controlled production adapter origin URL is invalid");
  }
  if (!['https:', 'ssh:'].includes(parsed.protocol)) {
    throw new Error("Controlled production adapter origin protocol is invalid");
  }
  if (parsed.hostname.toLowerCase() !== "github.com") {
    throw new Error("Controlled production adapter origin host is invalid");
  }
  if (parsed.protocol === "https:" && (parsed.username || parsed.password)) {
    throw new Error("Controlled production adapter origin credentials are prohibited");
  }
  if (parsed.protocol === "ssh:" && parsed.username !== "git") {
    throw new Error("Controlled production adapter SSH identity is invalid");
  }
  const segments = parsed.pathname.replace(/^\/+|\/+$/g, "").split("/");
  if (segments.length !== 2) {
    throw new Error("Controlled production adapter origin repository is invalid");
  }
  const repository = segments[1].replace(/\.git$/i, "");
  if (!segments[0] || !repository) {
    throw new Error("Controlled production adapter origin repository is invalid");
  }
  return `${segments[0]}/${repository}`.toLowerCase();
}

function validateBranchName(value: string): string {
  const branch = value.trim();
  if (
    !branch ||
    branch.length > 200 ||
    !/^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/.test(branch) ||
    branch.includes("..") ||
    branch.includes("//") ||
    branch.includes("@{") ||
    branch.endsWith("/") ||
    branch.endsWith(".") ||
    branch.endsWith(".lock") ||
    /[\x00-\x20\x7f~^:?*[\\]/.test(branch)
  ) {
    throw new Error("Controlled production adapter target branch is invalid");
  }
  return branch;
}

function validateRepositoryPath(value: string): string {
  if (
    !ALLOWED_PATH_SET.has(value) ||
    isAbsolute(value) ||
    value.includes("\\") ||
    value.includes("\0") ||
    value.split("/").some((segment) => !segment || segment === "." || segment === "..") ||
    /[\x00-\x1f\x7f]/.test(value)
  ) {
    throw new Error(`Controlled production adapter path is prohibited: ${value}`);
  }
  return value;
}

function checkInvocation(command: string): { executable: string; args: string[] } {
  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  const npx = process.platform === "win32" ? "npx.cmd" : "npx";
  switch (command as AllowedCheck) {
    case "npm run test:regulatory":
      return { executable: npm, args: ["run", "test:regulatory"] };
    case "npm run test:accuracy":
      return { executable: npm, args: ["run", "test:accuracy"] };
    case "npx tsc --noEmit":
      return { executable: npx, args: ["tsc", "--noEmit"] };
    case "npm run build":
      return { executable: npm, args: ["run", "build"] };
    default:
      throw new Error("Controlled production adapter required check is not allowlisted");
  }
}

function sameOrderedStrings(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function sanitizedCheckEnvironment(repositoryRoot: string): NodeJS.ProcessEnv {
  const inherited = process.env;
  const environment: NodeJS.ProcessEnv = {
    CI: "1",
    NODE_ENV: "production",
    NEXT_PUBLIC_BASE_URL: "http://localhost:3000",
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "ci-placeholder-anon-key",
    SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "ci-placeholder-service-role-key",
    STRIPE_SECRET_KEY: "sk_test_ci_placeholder",
    STRIPE_WEBHOOK_SECRET: "whsec_ci_placeholder",
    NEXT_PUBLIC_STRIPE_PRICE_SINGLE_REVIEW_CYCLE: "price_ci_single",
    NEXT_PUBLIC_STRIPE_PRICE_ACTIVE_BIDDER_PLAN: "price_ci_active",
    NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_PLAN: "price_ci_enterprise",
    OPENAI_API_KEY: "sk-ci-placeholder",
    RESEND_API_KEY: "re_ci_placeholder",
    CONTACT_FROM_EMAIL: "ci@example.com",
    CONTACT_TO_EMAIL: "ci@example.com",
  };
  for (const key of [
    "PATH",
    "Path",
    "PATHEXT",
    "HOME",
    "USERPROFILE",
    "SystemRoot",
    "SYSTEMROOT",
    "TEMP",
    "TMP",
    "TMPDIR",
    "ComSpec",
  ]) {
    if (inherited[key]) environment[key] = inherited[key];
  }
  const binaryPath = join(repositoryRoot, "node_modules", ".bin");
  const pathKey = process.platform === "win32" ? "Path" : "PATH";
  environment[pathKey] = `${binaryPath}${process.platform === "win32" ? ";" : ":"}${environment[pathKey] ?? ""}`;
  environment.NODE_PATH = join(repositoryRoot, "node_modules");
  return environment;
}

async function assertContainedPath(root: string, repositoryPath: string): Promise<string> {
  const validated = validateRepositoryPath(repositoryPath);
  const target = resolve(root, ...validated.split("/"));
  const containment = relative(root, target);
  if (!containment || containment.startsWith(`..${sep}`) || containment === ".." || isAbsolute(containment)) {
    throw new Error("Controlled production adapter path escaped its isolated worktree");
  }
  let current = root;
  for (const segment of validated.split("/").slice(0, -1)) {
    current = join(current, segment);
    try {
      const stats = await lstat(current);
      if (stats.isSymbolicLink() || (!stats.isDirectory() && !stats.isFile())) {
        throw new Error("Controlled production adapter path contains a prohibited filesystem object");
      }
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== "ENOENT") throw error;
      await mkdir(current, { recursive: false, mode: 0o700 });
    }
  }
  return target;
}

async function writeAtomicUtf8(target: string, content: string): Promise<void> {
  const temporary = `${target}.subshield-${randomUUID()}.tmp`;
  const handle = await open(temporary, "wx", 0o600);
  try {
    await handle.writeFile(content, { encoding: "utf8" });
    await handle.sync();
  } finally {
    await handle.close();
  }
  await rename(temporary, target);
}

class ProductionRegulatoryImplementationAdapter
  implements RegulatoryImplementationRepositoryAdapter
{
  private state: AdapterState = "created";
  private worktreeRoot?: string;
  private temporaryRoot?: string;
  private hooksRoot?: string;
  private pullRequestCreatedAt?: string;
  private trustedPrincipal?: string;
  private currentCommitSha?: string;
  private checkIndex = 0;
  private readonly branch: string;
  private readonly requiredChecks: readonly string[];
  private readonly baseCommitSha: string;

  constructor(
    private readonly repositoryRoot: string,
    plan: RegulatoryRegistryImplementationPlan,
    bundle: RegulatoryImplementationPullRequestBundle
  ) {
    this.branch = validateBranchName(plan.targetBranch);
    this.baseCommitSha = plan.baseCommitSha;
    this.requiredChecks = [...bundle.requiredChecks];
    if (!sameOrderedStrings(this.requiredChecks, REQUIRED_CHECKS)) {
      throw new Error("Controlled production adapter requires the exact approved check sequence");
    }
    if (!sameOrderedStrings(bundle.files.map((file) => file.path).sort(), [...ALLOWED_PATHS].sort())) {
      throw new Error("Controlled production adapter requires the exact authorized file set");
    }
  }

  private root(): string {
    if (!this.worktreeRoot) throw new Error("Controlled production adapter worktree is unavailable");
    return this.worktreeRoot;
  }

  private assertState(...allowed: AdapterState[]): void {
    if (!allowed.includes(this.state)) {
      throw new Error("Controlled production adapter operation is out of sequence");
    }
  }

  private async git(
    args: readonly string[],
    options: { cwd?: string; label: string; allowedExitCodes?: readonly number[]; env?: NodeJS.ProcessEnv }
  ): Promise<CommandResult> {
    return runCommand({
      executable: "git",
      args,
      cwd: options.cwd ?? this.repositoryRoot,
      label: options.label,
      allowedExitCodes: options.allowedExitCodes,
      env: options.env,
    });
  }

  private async gh(args: readonly string[], label: string): Promise<CommandResult> {
    return runCommand({
      executable: "gh",
      args,
      cwd: this.repositoryRoot,
      label,
      env: sanitizedCheckEnvironment(this.repositoryRoot),
    });
  }

  async inspectRepository(): Promise<RegulatoryImplementationRepositoryState> {
    this.assertState("created");
    const configuredRoot = await realpath(this.repositoryRoot);
    const observedRoot = await realpath(
      exactString(
        (await this.git(["rev-parse", "--show-toplevel"], { label: "inspect repository root" })).stdout,
        "repository root"
      )
    );
    if (configuredRoot !== observedRoot) {
      throw new Error("Controlled production adapter repository root does not match");
    }

    const origin = exactString(
      (await this.git(["remote", "get-url", "origin"], { label: "inspect origin URL" })).stdout,
      "origin URL"
    );
    const pushOrigin = exactString(
      (await this.git(["remote", "get-url", "--push", "origin"], { label: "inspect push origin URL" })).stdout,
      "push origin URL"
    );
    if (
      normalizeOriginUrl(origin) !== EXPECTED_REPOSITORY ||
      normalizeOriginUrl(pushOrigin) !== EXPECTED_REPOSITORY
    ) {
      throw new Error("Controlled production adapter origin is not the canonical repository");
    }

    const repository = normalizedJson<GitHubRepositoryView>(
      (
        await this.gh(
          [
            "repo",
            "view",
            EXPECTED_REPOSITORY,
            "--json",
            "nameWithOwner,defaultBranchRef,viewerPermission",
          ],
          "inspect authenticated repository"
        )
      ).stdout,
      "repository response"
    );
    if (repository.nameWithOwner !== EXPECTED_REPOSITORY) {
      throw new Error("Controlled production adapter authenticated repository is invalid");
    }
    if (repository.defaultBranchRef?.name !== EXPECTED_DEFAULT_BRANCH) {
      throw new Error("Controlled production adapter default branch is invalid");
    }
    if (!repository.viewerPermission || !SAFE_PERMISSION.has(repository.viewerPermission)) {
      throw new Error("Controlled production adapter principal lacks repository write permission");
    }

    const login = exactString(
      (await this.gh(["api", "user", "--jq", ".login"], "read authenticated principal")).stdout,
      "authenticated principal"
    );
    this.trustedPrincipal = `github-user:${login}`;
    return {
      repositoryFullName: EXPECTED_REPOSITORY,
      defaultBranch: EXPECTED_DEFAULT_BRANCH,
    };
  }

  async readDefaultBranchHead(): Promise<string> {
    this.assertState("created", "checked", "pushed");
    await this.git(
      [
        "fetch",
        "--quiet",
        "--no-tags",
        "origin",
        `refs/heads/${EXPECTED_DEFAULT_BRANCH}:refs/remotes/origin/${EXPECTED_DEFAULT_BRANCH}`,
      ],
      { label: "fetch default branch" }
    );
    const sha = exactString(
      (
        await this.git(
          ["rev-parse", `refs/remotes/origin/${EXPECTED_DEFAULT_BRANCH}`],
          { label: "read default branch head" }
        )
      ).stdout,
      "default branch head"
    );
    if (!COMMIT_SHA_RE.test(sha)) {
      throw new Error("Controlled production adapter default branch head is invalid");
    }
    return sha;
  }

  async commitExists(commitSha: string): Promise<boolean> {
    if (!COMMIT_SHA_RE.test(commitSha)) return false;
    const result = await this.git(["cat-file", "-e", `${commitSha}^{commit}`], {
      label: "verify reviewed commit",
      allowedExitCodes: [0, 1, 128],
    });
    return result.exitCode === 0;
  }

  async readFileAtCommit(commitSha: string, path: string): Promise<string> {
    if (!COMMIT_SHA_RE.test(commitSha)) {
      throw new Error("Controlled production adapter reviewed commit is invalid");
    }
    const validatedPath = validateRepositoryPath(path);
    return (
      await this.git(["show", `${commitSha}:${validatedPath}`], {
        label: "read reviewed file",
      })
    ).stdout;
  }

  async branchExists(branch: string): Promise<boolean> {
    const validated = validateBranchName(branch);
    const local = await this.git(["show-ref", "--verify", "--quiet", `refs/heads/${validated}`], {
      label: "inspect local branch",
      allowedExitCodes: [0, 1],
    });
    if (local.exitCode === 0) return true;
    const remote = await this.git(
      ["ls-remote", "--exit-code", "--heads", "origin", `refs/heads/${validated}`],
      { label: "inspect remote branch", allowedExitCodes: [0, 2] }
    );
    return remote.exitCode === 0;
  }

  async findPullRequestByHead(
    branch: string
  ): Promise<RegulatoryImplementationPullRequestRecord | null> {
    const validated = validateBranchName(branch);
    const values = normalizedJson<GitHubPullRequestView[]>(
      (
        await this.gh(
          [
            "pr",
            "list",
            "--repo",
            EXPECTED_REPOSITORY,
            "--head",
            validated,
            "--state",
            "all",
            "--json",
            "number,url,baseRefName,headRefName,headRefOid,title,body,state,isDraft,autoMergeRequest,createdAt",
          ],
          "inspect pull requests"
        )
      ).stdout,
      "pull-request list"
    );
    if (values.length > 1) {
      throw new Error("Controlled production adapter found duplicate pull requests");
    }
    if (values.length === 0) return null;
    return this.pullRequestRecord(values[0]);
  }

  async createBranch(branch: string, baseCommitSha: string): Promise<void> {
    this.assertState("created");
    if (validateBranchName(branch) !== this.branch || baseCommitSha !== this.baseCommitSha) {
      throw new Error("Controlled production adapter branch request is not authorized");
    }
    this.temporaryRoot = await mkdtemp(join(tmpdir(), "subshield-regulatory-"));
    this.worktreeRoot = join(this.temporaryRoot, "worktree");
    this.hooksRoot = join(this.temporaryRoot, "empty-hooks");
    await mkdir(this.hooksRoot, { mode: 0o700 });
    await this.git(
      ["worktree", "add", "--no-track", "-b", this.branch, this.worktreeRoot, baseCommitSha],
      { label: "create isolated worktree" }
    );
    const observed = await realpath(this.worktreeRoot);
    const temporary = await realpath(this.temporaryRoot);
    const containment = relative(temporary, observed);
    if (!containment || containment.startsWith(`..${sep}`) || containment === "..") {
      throw new Error("Controlled production adapter worktree escaped its temporary root");
    }
    this.state = "branch-created";
  }

  async writeFile(branch: string, path: string, content: string): Promise<void> {
    this.assertState("branch-created", "files-written");
    if (branch !== this.branch || typeof content !== "string") {
      throw new Error("Controlled production adapter file write is not authorized");
    }
    const target = await assertContainedPath(this.root(), path);
    try {
      const stats = await lstat(target);
      if (stats.isSymbolicLink() || !stats.isFile()) {
        throw new Error("Controlled production adapter target is not a regular file");
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    await writeAtomicUtf8(target, content);
    this.state = "files-written";
  }

  async listChangedFiles(branch: string): Promise<readonly string[]> {
    this.assertState("files-written");
    if (branch !== this.branch) {
      throw new Error("Controlled production adapter worktree branch is invalid");
    }
    const output = (
      await this.git(["status", "--porcelain=v1", "--untracked-files=all"], {
        cwd: this.root(),
        label: "inspect isolated worktree",
      })
    ).stdout;
    const paths = output
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => {
        if (line.length < 4 || /^[RC]/.test(line.slice(0, 2))) {
          throw new Error("Controlled production adapter observed an unsupported Git change");
        }
        return validateRepositoryPath(line.slice(3));
      });
    return paths;
  }

  async createCommit(branch: string, message: string): Promise<string> {
    this.assertState("files-written");
    if (branch !== this.branch || !message.trim() || /[\x00\x7f]/.test(message)) {
      throw new Error("Controlled production adapter commit request is invalid");
    }
    const paths = [...ALLOWED_PATHS];
    await this.git(["add", "--", ...paths], {
      cwd: this.root(),
      label: "stage authorized files",
    });
    const staged = (
      await this.git(["diff", "--cached", "--name-only", "--"], {
        cwd: this.root(),
        label: "inspect staged files",
      })
    ).stdout
      .split(/\r?\n/)
      .filter(Boolean)
      .sort();
    if (!sameOrderedStrings(staged, [...paths].sort())) {
      throw new Error("Controlled production adapter staged file set is invalid");
    }
    const commitDate = exactString(
      (
        await this.git(["show", "-s", "--format=%cI", this.baseCommitSha], {
          cwd: this.root(),
          label: "read deterministic commit date",
        })
      ).stdout,
      "deterministic commit date"
    );
    const environment = sanitizedCheckEnvironment(this.repositoryRoot);
    environment.GIT_AUTHOR_NAME = "SubShield Regulatory Executor";
    environment.GIT_AUTHOR_EMAIL = "regulatory-executor@subshield.invalid";
    environment.GIT_COMMITTER_NAME = environment.GIT_AUTHOR_NAME;
    environment.GIT_COMMITTER_EMAIL = environment.GIT_AUTHOR_EMAIL;
    environment.GIT_AUTHOR_DATE = commitDate;
    environment.GIT_COMMITTER_DATE = commitDate;
    await this.git(
      [
        "-c",
        `core.hooksPath=${this.hooksRoot}`,
        "-c",
        "commit.gpgSign=false",
        "commit",
        "--no-verify",
        "--no-gpg-sign",
        "-m",
        message,
        "--",
        ...paths,
      ],
      { cwd: this.root(), label: "create authorized commit", env: environment }
    );
    const commitSha = exactString(
      (await this.git(["rev-parse", "HEAD"], { cwd: this.root(), label: "read created commit" })).stdout,
      "created commit"
    );
    if (!COMMIT_SHA_RE.test(commitSha)) {
      throw new Error("Controlled production adapter created commit is invalid");
    }
    this.currentCommitSha = commitSha;
    this.state = "committed";
    return commitSha;
  }

  async inspectCommit(commitSha: string): Promise<RegulatoryImplementationCommitRecord> {
    this.assertState("committed", "checking", "checked", "pushed", "pr-created");
    if (commitSha !== this.currentCommitSha) {
      throw new Error("Controlled production adapter commit inspection is unauthorized");
    }
    const raw = (
      await this.git(["cat-file", "commit", commitSha], {
        cwd: this.root(),
        label: "inspect created commit record",
      })
    ).stdout;
    const boundary = raw.indexOf("\n\n");
    if (boundary < 0) throw new Error("Controlled production adapter commit record is invalid");
    const headers = raw.slice(0, boundary).split("\n");
    const body = raw.slice(boundary + 2).replace(/\n$/, "");
    return {
      parentCommitShas: headers
        .filter((line) => line.startsWith("parent "))
        .map((line) => line.slice("parent ".length)),
      message: body,
    };
  }

  async listCommitChangedFiles(
    commitSha: string,
    baseCommitSha: string
  ): Promise<readonly string[]> {
    this.assertState("committed", "checking", "checked", "pushed", "pr-created");
    if (commitSha !== this.currentCommitSha || baseCommitSha !== this.baseCommitSha) {
      throw new Error("Controlled production adapter commit diff is unauthorized");
    }
    return (
      await this.git(["diff", "--name-only", baseCommitSha, commitSha, "--"], {
        cwd: this.root(),
        label: "inspect created commit paths",
      })
    ).stdout
      .split(/\r?\n/)
      .filter(Boolean)
      .map(validateRepositoryPath);
  }

  async readFileFromCommit(commitSha: string, path: string): Promise<string> {
    this.assertState("committed", "checking", "checked", "pushed", "pr-created");
    if (commitSha !== this.currentCommitSha) {
      throw new Error("Controlled production adapter committed file read is unauthorized");
    }
    const validatedPath = validateRepositoryPath(path);
    return (
      await this.git(["show", `${commitSha}:${validatedPath}`], {
        cwd: this.root(),
        label: "read created commit file",
      })
    ).stdout;
  }

  async runCheck(
    command: string,
    commitSha: string
  ): Promise<RegulatoryImplementationCheckResult> {
    this.assertState("committed", "checking");
    if (commitSha !== this.currentCommitSha || command !== this.requiredChecks[this.checkIndex]) {
      throw new Error("Controlled production adapter required check is out of sequence");
    }
    const head = exactString(
      (await this.git(["rev-parse", "HEAD"], { cwd: this.root(), label: "bind check to commit" })).stdout,
      "check commit"
    );
    if (head !== commitSha) {
      throw new Error("Controlled production adapter worktree moved before checks");
    }
    this.state = "checking";
    const invocation = checkInvocation(command);
    let conclusion: "success" | "failure" = "success";
    try {
      await runCommand({
        executable: invocation.executable,
        args: invocation.args,
        cwd: this.root(),
        label: `run required check ${this.checkIndex + 1}`,
        env: sanitizedCheckEnvironment(this.repositoryRoot),
      });
    } catch {
      conclusion = "failure";
    }
    this.checkIndex += 1;
    if (this.checkIndex === this.requiredChecks.length && conclusion === "success") {
      this.state = "checked";
    }
    return { command, commitSha, conclusion };
  }

  async pushBranch(branch: string, commitSha: string, force: false): Promise<void> {
    this.assertState("checked");
    if (branch !== this.branch || commitSha !== this.currentCommitSha || force !== false) {
      throw new Error("Controlled production adapter push request is unauthorized");
    }
    if ((await this.readDefaultBranchHead()) !== this.baseCommitSha) {
      throw new Error("Controlled production adapter default branch moved before push");
    }
    await this.git(
      ["push", "--porcelain", "origin", `${commitSha}:refs/heads/${branch}`],
      { cwd: this.root(), label: "push implementation branch" }
    );
    const remote = exactString(
      (
        await this.git(["ls-remote", "--heads", "origin", `refs/heads/${branch}`], {
          label: "verify pushed branch",
        })
      ).stdout,
      "pushed branch"
    ).split(/\s+/)[0];
    if (remote !== commitSha) {
      throw new Error("Controlled production adapter pushed branch does not match the commit");
    }
    this.state = "pushed";
  }

  async createPullRequest(request: {
    baseBranch: string;
    headBranch: string;
    headCommitSha: string;
    title: string;
    body: string;
    autoMergeEnabled: false;
  }): Promise<RegulatoryImplementationPullRequestRecord> {
    this.assertState("pushed");
    if (
      request.baseBranch !== EXPECTED_DEFAULT_BRANCH ||
      request.headBranch !== this.branch ||
      request.headCommitSha !== this.currentCommitSha ||
      request.autoMergeEnabled !== false
    ) {
      throw new Error("Controlled production adapter pull-request request is unauthorized");
    }
    if ((await this.readDefaultBranchHead()) !== this.baseCommitSha) {
      throw new Error("Controlled production adapter default branch moved before pull request");
    }
    if (await this.findPullRequestByHead(this.branch)) {
      throw new Error("Controlled production adapter pull request already exists");
    }
    const bodyPath = join(this.temporaryRoot ?? this.root(), `pr-body-${randomUUID()}.md`);
    const bodyHandle = await open(bodyPath, "wx", 0o600);
    try {
      await bodyHandle.writeFile(request.body, { encoding: "utf8" });
    } finally {
      await bodyHandle.close();
    }
    try {
      await this.gh(
        [
          "pr",
          "create",
          "--repo",
          EXPECTED_REPOSITORY,
          "--base",
          request.baseBranch,
          "--head",
          request.headBranch,
          "--title",
          request.title,
          "--body-file",
          bodyPath,
        ],
        "create implementation pull request"
      );
    } finally {
      await rm(bodyPath, { force: true });
    }
    const record = await this.findPullRequestByHead(this.branch);
    if (!record) {
      throw new Error("Controlled production adapter could not refetch the pull request");
    }
    this.pullRequestCreatedAt = record.createdAt;
    this.state = "pr-created";
    return record;
  }

  async readTrustedPrincipal(): Promise<string> {
    this.assertState("created", "branch-created", "files-written", "committed", "checking", "checked", "pushed", "pr-created");
    if (!this.trustedPrincipal) {
      throw new Error("Controlled production adapter authenticated principal is unavailable");
    }
    return this.trustedPrincipal;
  }

  async readTrustedClock(): Promise<string> {
    this.assertState("pr-created");
    if (!this.pullRequestCreatedAt) {
      throw new Error("Controlled production adapter GitHub creation time is unavailable");
    }
    return this.pullRequestCreatedAt;
  }

  async cleanup(): Promise<void> {
    if (this.state === "cleaned") return;
    const worktree = this.worktreeRoot;
    const temporary = this.temporaryRoot;
    try {
      if (worktree) {
        await this.git(["worktree", "remove", "--force", worktree], {
          label: "remove isolated worktree",
          allowedExitCodes: [0, 128],
        });
      }
    } finally {
      if (temporary) await rm(temporary, { recursive: true, force: true });
      this.state = "cleaned";
    }
  }

  private pullRequestRecord(value: GitHubPullRequestView): RegulatoryImplementationPullRequestRecord {
    if (!Number.isSafeInteger(value.number) || Number(value.number) <= 0) {
      throw new Error("Controlled production adapter pull-request number is invalid");
    }
    const number = Number(value.number);
    const createdAt = exactIsoInstant(value.createdAt, "pull-request createdAt");
    return {
      number,
      url: exactString(value.url, "pull-request URL"),
      baseBranch: exactString(value.baseRefName, "pull-request base"),
      headBranch: exactString(value.headRefName, "pull-request head"),
      headCommitSha: exactString(value.headRefOid, "pull-request head commit"),
      title: exactString(value.title, "pull-request title"),
      body: typeof value.body === "string" ? value.body : "",
      autoMergeEnabled: value.autoMergeRequest != null,
      state: exactString(value.state, "pull-request state"),
      isDraft: value.isDraft === true,
      createdAt,
    };
  }
}

export async function executeRegulatoryImplementationWithProductionAdapter(
  plan: RegulatoryRegistryImplementationPlan,
  bundle: RegulatoryImplementationPullRequestBundle,
  options: RegulatoryImplementationProductionOptions
): Promise<RegulatoryImplementationExecutionResult> {
  const repositoryRoot = await realpath(options.repositoryRoot);
  const adapter = new ProductionRegulatoryImplementationAdapter(
    repositoryRoot,
    plan,
    bundle
  );
  try {
    return await executeRegulatoryImplementationPullRequest(plan, bundle, adapter);
  } finally {
    await adapter.cleanup();
  }
}
