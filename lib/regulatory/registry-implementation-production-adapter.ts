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
import { isAbsolute, join, relative, resolve, sep } from "node:path";

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
const CANONICAL_GIT_ENDPOINT =
  "https://github.com/siricarsen-cmd/subshield.git";
const MAX_OUTPUT_BYTES = 256 * 1024;
const COMMIT_SHA_RE = /^[a-f0-9]{40}$/;
const RFC_3339_INSTANT_RE =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?Z$/;
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
const PRODUCTION_BOUNDARY = Object.freeze({
  applicationStatus: "not-applied" as const,
  customerFacingStatus: "benchmark-only" as const,
  mergeStatus: "not-authorized" as const,
});

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
type ProductionBoundaryFailureStage =
  | "execution"
  | "cleanup"
  | "execution-and-cleanup";

interface CommandResult {
  stdout: string;
  exitCode: number;
}

interface CommandRequest {
  executable: string;
  args: readonly string[];
  cwd: string;
  label: string;
  env: NodeJS.ProcessEnv;
  allowedExitCodes?: readonly number[];
}

interface GitHubRepositoryView {
  nameWithOwner?: string;
  defaultBranchRef?: { name?: string } | null;
  viewerPermission?: string;
  isFork?: boolean;
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

export type RegulatoryImplementationProductionExecutionResult =
  | RegulatoryImplementationExecutionResult
  | Readonly<{
      status: "production-boundary-failed";
      stage: ProductionBoundaryFailureStage;
      priorResult?: RegulatoryImplementationExecutionResult;
      errors: readonly string[];
      applicationStatus: "not-applied";
      customerFacingStatus: "benchmark-only";
      mergeStatus: "not-authorized";
    }>;

function productionBoundaryFailure(
  stage: ProductionBoundaryFailureStage,
  priorResult?: RegulatoryImplementationExecutionResult
): Extract<
  RegulatoryImplementationProductionExecutionResult,
  { status: "production-boundary-failed" }
> {
  const errors = Object.freeze([
    stage === "execution"
      ? "Controlled production adapter execution failed before a structured executor result was produced"
      : stage === "cleanup"
        ? "Controlled production adapter cleanup failed after the executor produced a structured result"
        : "Controlled production adapter execution and cleanup both failed before a structured executor result was produced",
  ]);
  return Object.freeze({
    status: "production-boundary-failed" as const,
    stage,
    ...(priorResult ? { priorResult } : {}),
    errors,
    ...PRODUCTION_BOUNDARY,
  });
}

/** Pure, non-mutating helpers exposed only for deterministic security tests. */
export const regulatoryImplementationProductionAdapterTestSurface =
  Object.freeze({
    allowedPaths: [...ALLOWED_PATHS],
    requiredChecks: [...REQUIRED_CHECKS],
    normalizeOriginUrl,
    normalizeRfc3339Instant,
    validateBranchName,
    validateRepositoryPath,
    checkInvocation,
    productionBoundaryFailure,
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

        const output =
          typeof stdout === "string" ? stdout : String(stdout ?? "");
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

function normalizeRfc3339Instant(value: unknown, label: string): string {
  const candidate = exactString(value, label);
  const match = RFC_3339_INSTANT_RE.exec(candidate);
  if (!match) {
    throw new Error(`Controlled production adapter ${label} is invalid`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  const millisecond = Number(`${match[7] ?? ""}000`.slice(0, 3));

  if (
    year < 1970 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59 ||
    second < 0 ||
    second > 59
  ) {
    throw new Error(`Controlled production adapter ${label} is invalid`);
  }

  const parsed = new Date(
    Date.UTC(year, month - 1, day, hour, minute, second, millisecond)
  );
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day ||
    parsed.getUTCHours() !== hour ||
    parsed.getUTCMinutes() !== minute ||
    parsed.getUTCSeconds() !== second ||
    parsed.getUTCMilliseconds() !== millisecond
  ) {
    throw new Error(`Controlled production adapter ${label} is invalid`);
  }

  return parsed.toISOString();
}

function normalizeOriginUrl(value: string): string {
  const candidate = value.trim();
  let parsed: URL;

  try {
    parsed = new URL(candidate);
  } catch {
    throw new Error("Controlled production adapter origin URL is invalid");
  }

  if (
    parsed.protocol !== "https:" ||
    parsed.hostname.toLowerCase() !== "github.com" ||
    parsed.port ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error(
      "Controlled production adapter origin must use canonical HTTPS"
    );
  }

  const pathname = parsed.pathname.replace(/\/+$/, "");
  if (
    pathname !== "/siricarsen-cmd/subshield" &&
    pathname !== "/siricarsen-cmd/subshield.git"
  ) {
    throw new Error(
      "Controlled production adapter origin repository is invalid"
    );
  }

  return EXPECTED_REPOSITORY;
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
    value
      .split("/")
      .some((segment) => !segment || segment === "." || segment === "..") ||
    /[\x00-\x1f\x7f]/.test(value)
  ) {
    throw new Error(
      `Controlled production adapter path is prohibited: ${value}`
    );
  }
  return value;
}

function checkInvocation(command: string): {
  executable: string;
  args: string[];
} {
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
      throw new Error(
        "Controlled production adapter required check is not allowlisted"
      );
  }
}

function sameOrderedStrings(
  left: readonly string[],
  right: readonly string[]
): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function preservedEnvironment(): NodeJS.ProcessEnv {
  const environment = {} as NodeJS.ProcessEnv;
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
    if (process.env[key]) environment[key] = process.env[key];
  }
  return environment;
}

function sanitizedGitEnvironment(
  hooksPath: string,
  authentication?: { token: string }
): NodeJS.ProcessEnv {
  const environment = preservedEnvironment();

  environment.GIT_CONFIG_NOSYSTEM = "1";
  environment.GIT_CONFIG_GLOBAL = `${hooksPath}.global-config`;
  environment.GIT_CONFIG_SYSTEM = `${hooksPath}.system-config`;
  environment.GIT_TERMINAL_PROMPT = "0";
  environment.GCM_INTERACTIVE = "Never";

  const configuration: Array<[string, string]> = [
    ["core.hooksPath", hooksPath],
    ["core.sshCommand", ""],
    ["core.fsmonitor", "false"],
    ["extensions.worktreeConfig", "false"],
    ["commit.gpgSign", "false"],
    ["tag.gpgSign", "false"],
    ["credential.helper", ""],
    ["credential.interactive", "never"],
    ["http.extraHeader", ""],
    ["http.proxy", ""],
    [`http.${CANONICAL_GIT_ENDPOINT}.proxy`, ""],
    ["http.sslVerify", "true"],
    [`http.${CANONICAL_GIT_ENDPOINT}.sslVerify`, "true"],
    ["http.followRedirects", "false"],
    [`http.${CANONICAL_GIT_ENDPOINT}.followRedirects`, "false"],
    ["http.cookieFile", ""],
    [`http.${CANONICAL_GIT_ENDPOINT}.cookieFile`, ""],
    ["protocol.allow", "never"],
    ["protocol.https.allow", "always"],
    ["protocol.file.allow", "never"],
    ["protocol.ext.allow", "never"],
    ["protocol.ssh.allow", "never"],
    ["protocol.git.allow", "never"],
  ];

  if (authentication) {
    const authorization = Buffer.from(
      `x-access-token:${authentication.token}`,
      "utf8"
    ).toString("base64");
    configuration.push([
      `http.${CANONICAL_GIT_ENDPOINT}.extraHeader`,
      `Authorization: Basic ${authorization}`,
    ]);
  }

  environment.GIT_CONFIG_COUNT = String(configuration.length);
  configuration.forEach(([key, value], index) => {
    environment[`GIT_CONFIG_KEY_${index}`] = key;
    environment[`GIT_CONFIG_VALUE_${index}`] = value;
  });

  return environment;
}

function sanitizedGitHubEnvironment(
  token?: string
): NodeJS.ProcessEnv {
  const environment = preservedEnvironment();
  if (token) {
    environment.GH_TOKEN = token;
    environment.GITHUB_TOKEN = token;
  }
  return environment;
}

function sanitizedCheckEnvironment(
  repositoryRoot: string
): NodeJS.ProcessEnv {
  const environment: NodeJS.ProcessEnv = {
    ...preservedEnvironment(),
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

  const binaryPath = join(repositoryRoot, "node_modules", ".bin");
  const pathKey = process.platform === "win32" ? "Path" : "PATH";
  environment[pathKey] =
    `${binaryPath}${process.platform === "win32" ? ";" : ":"}` +
    `${environment[pathKey] ?? ""}`;
  environment.NODE_PATH = join(repositoryRoot, "node_modules");

  return environment;
}

function splitNonemptyLines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

async function assertContainedPath(
  root: string,
  repositoryPath: string
): Promise<string> {
  const validated = validateRepositoryPath(repositoryPath);
  const canonicalRoot = await realpath(root);
  const target = resolve(canonicalRoot, ...validated.split("/"));
  const containment = relative(canonicalRoot, target);

  if (
    !containment ||
    containment.startsWith(`..${sep}`) ||
    containment === ".." ||
    isAbsolute(containment)
  ) {
    throw new Error(
      "Controlled production adapter path escaped its isolated worktree"
    );
  }

  let current = canonicalRoot;
  for (const segment of validated.split("/").slice(0, -1)) {
    current = join(current, segment);
    try {
      const stats = await lstat(current);
      if (!stats.isDirectory() || stats.isSymbolicLink()) {
        throw new Error(
          "Controlled production adapter path contains a prohibited filesystem object"
        );
      }
      const canonicalParent = await realpath(current);
      const parentContainment = relative(canonicalRoot, canonicalParent);
      if (
        parentContainment === ".." ||
        parentContainment.startsWith(`..${sep}`) ||
        isAbsolute(parentContainment)
      ) {
        throw new Error(
          "Controlled production adapter path escaped its isolated worktree"
        );
      }
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== "ENOENT") throw error;
      await mkdir(current, { recursive: false, mode: 0o700 });
      const created = await lstat(current);
      if (!created.isDirectory() || created.isSymbolicLink()) {
        throw new Error(
          "Controlled production adapter path contains a prohibited filesystem object"
        );
      }
    }
  }

  return target;
}

async function writeAtomicUtf8(
  target: string,
  content: string
): Promise<void> {
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
  private pullRequestCreatedAt?: string;
  private trustedPrincipal?: string;
  private githubToken?: string;
  private currentCommitSha?: string;
  private checkIndex = 0;
  private readonly branch: string;
  private readonly requiredChecks: readonly string[];
  private readonly baseCommitSha: string;
  private readonly hooksPath = join(
    tmpdir(),
    `.subshield-disabled-hooks-${randomUUID()}`
  );

  constructor(
    private readonly repositoryRoot: string,
    plan: RegulatoryRegistryImplementationPlan,
    bundle: RegulatoryImplementationPullRequestBundle
  ) {
    this.branch = validateBranchName(plan.targetBranch);
    this.baseCommitSha = plan.baseCommitSha;
    this.requiredChecks = [...bundle.requiredChecks];

    if (!COMMIT_SHA_RE.test(this.baseCommitSha)) {
      throw new Error(
        "Controlled production adapter reviewed base commit is invalid"
      );
    }
    if (!sameOrderedStrings(this.requiredChecks, REQUIRED_CHECKS)) {
      throw new Error(
        "Controlled production adapter requires the exact approved check sequence"
      );
    }
    if (
      !sameOrderedStrings(
        bundle.files.map((file) => file.path).sort(),
        [...ALLOWED_PATHS].sort()
      )
    ) {
      throw new Error(
        "Controlled production adapter requires the exact authorized file set"
      );
    }
  }

  private root(): string {
    if (!this.worktreeRoot) {
      throw new Error(
        "Controlled production adapter worktree is unavailable"
      );
    }
    return this.worktreeRoot;
  }

  private assertState(...allowed: AdapterState[]): void {
    if (!allowed.includes(this.state)) {
      throw new Error(
        "Controlled production adapter operation is out of sequence"
      );
    }
  }

  private gitEnvironment(authenticated = false): NodeJS.ProcessEnv {
    if (authenticated) {
      if (!this.githubToken) {
        throw new Error(
          "Controlled production adapter authenticated Git transport is unavailable"
        );
      }
      return sanitizedGitEnvironment(this.hooksPath, {
        token: this.githubToken,
      });
    }
    return sanitizedGitEnvironment(this.hooksPath);
  }

  private async git(
    args: readonly string[],
    options: {
      cwd?: string;
      label: string;
      allowedExitCodes?: readonly number[];
      authenticated?: boolean;
    }
  ): Promise<CommandResult> {
    return runCommand({
      executable: "git",
      args: [
        "-c",
        `core.hooksPath=${this.hooksPath}`,
        "-c",
        "commit.gpgSign=false",
        "-c",
        "tag.gpgSign=false",
        ...args,
      ],
      cwd: options.cwd ?? this.repositoryRoot,
      label: options.label,
      allowedExitCodes: options.allowedExitCodes,
      env: this.gitEnvironment(options.authenticated === true),
    });
  }

  private async gh(
    args: readonly string[],
    label: string,
    authenticated = true
  ): Promise<CommandResult> {
    if (authenticated && !this.githubToken) {
      throw new Error(
        "Controlled production adapter authenticated GitHub context is unavailable"
      );
    }
    return runCommand({
      executable: "gh",
      args,
      cwd: this.repositoryRoot,
      label,
      env: sanitizedGitHubEnvironment(
        authenticated ? this.githubToken : undefined
      ),
    });
  }

  private async rejectLocalIncludes(): Promise<void> {
    const includes = await this.git(
      ["config", "--local", "--name-only", "--get-regexp", "^include"],
      {
        label: "inspect prohibited local Git includes",
        allowedExitCodes: [0, 1],
      }
    );
    if (includes.exitCode === 0 && includes.stdout.trim()) {
      throw new Error(
        "Controlled production adapter local Git includes are prohibited"
      );
    }
  }

  private async readConfiguredUrls(
    key: string,
    label: string
  ): Promise<string[]> {
    const result = await this.git(
      ["config", "--local", "--includes", "--get-all", key],
      {
        label,
        allowedExitCodes: [0, 1],
      }
    );
    return result.exitCode === 0 ? splitNonemptyLines(result.stdout) : [];
  }

  async inspectRepository(): Promise<RegulatoryImplementationRepositoryState> {
    this.assertState("created");

    const configuredRoot = await realpath(this.repositoryRoot);
    const configuredStats = await lstat(configuredRoot);
    if (!configuredStats.isDirectory() || configuredStats.isSymbolicLink()) {
      throw new Error(
        "Controlled production adapter repository root is invalid"
      );
    }

    const observedRoot = await realpath(
      exactString(
        (
          await this.git(["rev-parse", "--show-toplevel"], {
            label: "inspect repository root",
          })
        ).stdout,
        "repository root"
      )
    );
    if (configuredRoot !== observedRoot) {
      throw new Error(
        "Controlled production adapter repository root does not match"
      );
    }

    await this.rejectLocalIncludes();

    const fetchUrls = await this.readConfiguredUrls(
      "remote.origin.url",
      "inspect every origin fetch URL"
    );
    const configuredPushUrls = await this.readConfiguredUrls(
      "remote.origin.pushurl",
      "inspect every origin push URL"
    );
    const effectivePushUrls =
      configuredPushUrls.length === 0 ? fetchUrls : configuredPushUrls;

    if (
      fetchUrls.length !== 1 ||
      effectivePushUrls.length !== 1 ||
      normalizeOriginUrl(fetchUrls[0]) !== EXPECTED_REPOSITORY ||
      normalizeOriginUrl(effectivePushUrls[0]) !== EXPECTED_REPOSITORY
    ) {
      throw new Error(
        "Controlled production adapter requires exactly one canonical HTTPS fetch and push endpoint"
      );
    }

    const rewrites = await this.git(
      [
        "config",
        "--local",
        "--includes",
        "--get-regexp",
        "^url\\..*\\.(insteadOf|pushInsteadOf)$",
      ],
      {
        label: "inspect Git URL rewrites",
        allowedExitCodes: [0, 1],
      }
    );
    if (rewrites.exitCode === 0 && rewrites.stdout.trim()) {
      throw new Error(
        "Controlled production adapter Git URL rewrites are prohibited"
      );
    }

    const token = exactString(
      (
        await this.gh(
          ["auth", "token", "--hostname", "github.com"],
          "read authenticated GitHub token",
          false
        )
      ).stdout,
      "authenticated GitHub token"
    );
    if (/[\x00-\x20\x7f]/.test(token)) {
      throw new Error(
        "Controlled production adapter authenticated GitHub token is invalid"
      );
    }
    this.githubToken = token;

    const login = exactString(
      (
        await this.gh(
          ["api", "--hostname", "github.com", "user", "--jq", ".login"],
          "read authenticated principal"
        )
      ).stdout,
      "authenticated principal"
    );
    if (
      !/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(login)
    ) {
      throw new Error(
        "Controlled production adapter authenticated principal is invalid"
      );
    }

    const repository = normalizedJson<GitHubRepositoryView>(
      (
        await this.gh(
          [
            "repo",
            "view",
            EXPECTED_REPOSITORY,
            "--json",
            "nameWithOwner,defaultBranchRef,viewerPermission,isFork",
          ],
          "inspect authenticated repository"
        )
      ).stdout,
      "repository response"
    );
    if (
      repository.nameWithOwner !== EXPECTED_REPOSITORY ||
      repository.isFork !== false
    ) {
      throw new Error(
        "Controlled production adapter authenticated repository is invalid"
      );
    }
    if (repository.defaultBranchRef?.name !== EXPECTED_DEFAULT_BRANCH) {
      throw new Error(
        "Controlled production adapter default branch is invalid"
      );
    }
    if (
      !repository.viewerPermission ||
      !SAFE_PERMISSION.has(repository.viewerPermission)
    ) {
      throw new Error(
        "Controlled production adapter principal lacks repository write permission"
      );
    }

    this.trustedPrincipal = `github-user:${login.toLowerCase()}`;
    return {
      repositoryFullName: EXPECTED_REPOSITORY,
      defaultBranch: EXPECTED_DEFAULT_BRANCH,
    };
  }

  async readDefaultBranchHead(): Promise<string> {
    this.assertState("created", "checked", "pushed");

    const output = (
      await this.git(
        [
          "ls-remote",
          "--exit-code",
          "--refs",
          CANONICAL_GIT_ENDPOINT,
          `refs/heads/${EXPECTED_DEFAULT_BRANCH}`,
        ],
        {
          label: "read authenticated default branch head",
          authenticated: true,
        }
      )
    ).stdout;

    const lines = splitNonemptyLines(output);
    if (lines.length !== 1) {
      throw new Error(
        "Controlled production adapter default branch response is invalid"
      );
    }

    const [sha, ref, ...extra] = lines[0].split(/\s+/);
    if (
      !COMMIT_SHA_RE.test(sha) ||
      ref !== `refs/heads/${EXPECTED_DEFAULT_BRANCH}` ||
      extra.length !== 0
    ) {
      throw new Error(
        "Controlled production adapter default branch head is invalid"
      );
    }

    return sha;
  }

  async commitExists(commitSha: string): Promise<boolean> {
    if (!COMMIT_SHA_RE.test(commitSha)) return false;

    const result = await this.git(
      ["cat-file", "-e", `${commitSha}^{commit}`],
      {
        label: "verify reviewed commit",
        allowedExitCodes: [0, 1, 128],
      }
    );
    return result.exitCode === 0;
  }

  async readFileAtCommit(
    commitSha: string,
    path: string
  ): Promise<string> {
    if (!COMMIT_SHA_RE.test(commitSha)) {
      throw new Error(
        "Controlled production adapter reviewed commit is invalid"
      );
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
    if (validated !== this.branch) {
      throw new Error(
        "Controlled production adapter branch inspection is unauthorized"
      );
    }

    const local = await this.git(
      ["show-ref", "--verify", "--quiet", `refs/heads/${validated}`],
      {
        label: "inspect local branch",
        allowedExitCodes: [0, 1],
      }
    );
    if (local.exitCode === 0) return true;

    const remote = await this.git(
      [
        "ls-remote",
        "--exit-code",
        "--refs",
        CANONICAL_GIT_ENDPOINT,
        `refs/heads/${validated}`,
      ],
      {
        label: "inspect authenticated remote branch",
        allowedExitCodes: [0, 2],
        authenticated: true,
      }
    );
    return remote.exitCode === 0;
  }

  async findPullRequestByHead(
    branch: string
  ): Promise<RegulatoryImplementationPullRequestRecord | null> {
    const validated = validateBranchName(branch);
    if (validated !== this.branch) {
      throw new Error(
        "Controlled production adapter pull-request inspection is unauthorized"
      );
    }

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
            "--limit",
            "2",
            "--json",
            "number,url,baseRefName,headRefName,headRefOid,title,body,state,isDraft,autoMergeRequest,createdAt",
          ],
          "inspect pull requests"
        )
      ).stdout,
      "pull-request list"
    );

    if (!Array.isArray(values) || values.length > 1) {
      throw new Error(
        "Controlled production adapter found duplicate pull requests"
      );
    }
    if (values.length === 0) return null;
    return this.pullRequestRecord(values[0]);
  }

  async createBranch(
    branch: string,
    baseCommitSha: string
  ): Promise<void> {
    this.assertState("created");
    if (
      validateBranchName(branch) !== this.branch ||
      baseCommitSha !== this.baseCommitSha
    ) {
      throw new Error(
        "Controlled production adapter branch request is not authorized"
      );
    }

    this.temporaryRoot = await mkdtemp(
      join(tmpdir(), "subshield-regulatory-")
    );
    this.worktreeRoot = join(this.temporaryRoot, "worktree");

    await this.git(
      [
        "worktree",
        "add",
        "--no-track",
        "-b",
        this.branch,
        this.worktreeRoot,
        baseCommitSha,
      ],
      { label: "create isolated worktree" }
    );

    const observed = await realpath(this.worktreeRoot);
    const temporary = await realpath(this.temporaryRoot);
    const containment = relative(temporary, observed);
    if (
      !containment ||
      containment.startsWith(`..${sep}`) ||
      containment === ".." ||
      isAbsolute(containment)
    ) {
      throw new Error(
        "Controlled production adapter worktree escaped its temporary root"
      );
    }

    const head = exactString(
      (
        await this.git(["rev-parse", "HEAD"], {
          cwd: observed,
          label: "verify isolated worktree base",
        })
      ).stdout,
      "isolated worktree base"
    );
    if (head !== baseCommitSha) {
      throw new Error(
        "Controlled production adapter isolated worktree base changed"
      );
    }

    this.state = "branch-created";
  }

  async writeFile(
    branch: string,
    path: string,
    content: string
  ): Promise<void> {
    this.assertState("branch-created", "files-written");
    if (branch !== this.branch || typeof content !== "string") {
      throw new Error(
        "Controlled production adapter file write is not authorized"
      );
    }

    const target = await assertContainedPath(this.root(), path);
    try {
      const stats = await lstat(target);
      if (stats.isSymbolicLink() || !stats.isFile()) {
        throw new Error(
          "Controlled production adapter target is not a regular file"
        );
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }

    await writeAtomicUtf8(target, content);
    const reproduced = await readFile(target, "utf8");
    if (reproduced !== content) {
      throw new Error(
        "Controlled production adapter written bytes do not reproduce"
      );
    }

    this.state = "files-written";
  }

  async listChangedFiles(branch: string): Promise<readonly string[]> {
    this.assertState("files-written");
    if (branch !== this.branch) {
      throw new Error(
        "Controlled production adapter worktree branch is invalid"
      );
    }

    const output = (
      await this.git(
        ["status", "--porcelain=v1", "--untracked-files=all"],
        {
          cwd: this.root(),
          label: "inspect isolated worktree",
        }
      )
    ).stdout;

    return output
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => {
        if (line.length < 4 || /^[RC]/.test(line.slice(0, 2))) {
          throw new Error(
            "Controlled production adapter observed an unsupported Git change"
          );
        }
        return validateRepositoryPath(line.slice(3));
      });
  }

  async createCommit(
    branch: string,
    message: string
  ): Promise<string> {
    this.assertState("files-written");
    if (
      branch !== this.branch ||
      !message.trim() ||
      /[\x00\x7f]/.test(message)
    ) {
      throw new Error(
        "Controlled production adapter commit request is invalid"
      );
    }

    const paths = [...ALLOWED_PATHS];
    await this.git(["add", "--", ...paths], {
      cwd: this.root(),
      label: "stage authorized files",
    });

    const staged = (
      await this.git(
        ["diff", "--cached", "--name-only", "--no-renames", "--"],
        {
          cwd: this.root(),
          label: "inspect staged files",
        }
      )
    ).stdout
      .split(/\r?\n/)
      .filter(Boolean)
      .sort();

    if (!sameOrderedStrings(staged, [...paths].sort())) {
      throw new Error(
        "Controlled production adapter staged file set is invalid"
      );
    }

    const commitDate = normalizeRfc3339Instant(
      (
        await this.git(
          ["show", "-s", "--format=%cI", this.baseCommitSha],
          {
            cwd: this.root(),
            label: "read deterministic commit date",
          }
        )
      ).stdout,
      "deterministic commit date"
    );

    const environment = this.gitEnvironment();
    environment.GIT_AUTHOR_NAME = "SubShield Regulatory Executor";
    environment.GIT_AUTHOR_EMAIL =
      "regulatory-executor@subshield.invalid";
    environment.GIT_COMMITTER_NAME =
      "SubShield Regulatory Executor";
    environment.GIT_COMMITTER_EMAIL =
      "regulatory-executor@subshield.invalid";
    environment.GIT_AUTHOR_DATE = commitDate;
    environment.GIT_COMMITTER_DATE = commitDate;

    await runCommand({
      executable: "git",
      args: [
        "-c",
        `core.hooksPath=${this.hooksPath}`,
        "-c",
        "commit.gpgSign=false",
        "-c",
        "tag.gpgSign=false",
        "commit",
        "--no-verify",
        "--no-gpg-sign",
        "-m",
        message,
        "--",
        ...paths,
      ],
      cwd: this.root(),
      label: "create authorized commit",
      env: environment,
    });

    const commitSha = exactString(
      (
        await this.git(["rev-parse", "HEAD"], {
          cwd: this.root(),
          label: "read created commit",
        })
      ).stdout,
      "created commit"
    );
    if (!COMMIT_SHA_RE.test(commitSha)) {
      throw new Error(
        "Controlled production adapter created commit is invalid"
      );
    }

    this.currentCommitSha = commitSha;
    this.state = "committed";
    return commitSha;
  }

  async inspectCommit(
    commitSha: string
  ): Promise<RegulatoryImplementationCommitRecord> {
    this.assertState(
      "committed",
      "checking",
      "checked",
      "pushed",
      "pr-created"
    );
    if (commitSha !== this.currentCommitSha) {
      throw new Error(
        "Controlled production adapter commit inspection is unauthorized"
      );
    }

    const raw = (
      await this.git(["cat-file", "commit", commitSha], {
        cwd: this.root(),
        label: "inspect created commit record",
      })
    ).stdout;
    const boundary = raw.indexOf("\n\n");
    if (boundary < 0) {
      throw new Error(
        "Controlled production adapter commit record is invalid"
      );
    }

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
    this.assertState(
      "committed",
      "checking",
      "checked",
      "pushed",
      "pr-created"
    );
    if (
      commitSha !== this.currentCommitSha ||
      baseCommitSha !== this.baseCommitSha
    ) {
      throw new Error(
        "Controlled production adapter commit diff is unauthorized"
      );
    }

    return (
      await this.git(
        [
          "diff",
          "--name-only",
          "--no-renames",
          baseCommitSha,
          commitSha,
          "--",
        ],
        {
          cwd: this.root(),
          label: "inspect created commit paths",
        }
      )
    ).stdout
      .split(/\r?\n/)
      .filter(Boolean)
      .map(validateRepositoryPath);
  }

  async readFileFromCommit(
    commitSha: string,
    path: string
  ): Promise<string> {
    this.assertState(
      "committed",
      "checking",
      "checked",
      "pushed",
      "pr-created"
    );
    if (commitSha !== this.currentCommitSha) {
      throw new Error(
        "Controlled production adapter committed file read is unauthorized"
      );
    }

    const validatedPath = validateRepositoryPath(path);
    return (
      await this.git(["show", `${commitSha}:${validatedPath}`], {
        cwd: this.root(),
        label: "read created commit file",
      })
    ).stdout;
  }

  private async assertImmutablePackageMetadata(): Promise<void> {
    const reviewed = (
      await this.git(
        ["show", `${this.baseCommitSha}:package.json`],
        {
          cwd: this.root(),
          label: "read reviewed package metadata",
        }
      )
    ).stdout;
    const current = await readFile(join(this.root(), "package.json"), "utf8");

    if (current !== reviewed) {
      throw new Error(
        "Controlled production adapter package metadata changed after review"
      );
    }
  }

  async runCheck(
    command: string,
    commitSha: string
  ): Promise<RegulatoryImplementationCheckResult> {
    this.assertState("committed", "checking");
    if (
      commitSha !== this.currentCommitSha ||
      command !== this.requiredChecks[this.checkIndex]
    ) {
      throw new Error(
        "Controlled production adapter required check is out of sequence"
      );
    }

    const head = exactString(
      (
        await this.git(["rev-parse", "HEAD"], {
          cwd: this.root(),
          label: "bind check to commit",
        })
      ).stdout,
      "check commit"
    );
    if (head !== commitSha) {
      throw new Error(
        "Controlled production adapter worktree moved before checks"
      );
    }

    await this.assertImmutablePackageMetadata();

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
    if (
      this.checkIndex === this.requiredChecks.length &&
      conclusion === "success"
    ) {
      this.state = "checked";
    }

    return { command, commitSha, conclusion };
  }

  async pushBranch(
    branch: string,
    commitSha: string,
    force: false
  ): Promise<void> {
    this.assertState("checked");
    if (
      branch !== this.branch ||
      commitSha !== this.currentCommitSha ||
      force !== false
    ) {
      throw new Error(
        "Controlled production adapter push request is unauthorized"
      );
    }

    if ((await this.readDefaultBranchHead()) !== this.baseCommitSha) {
      throw new Error(
        "Controlled production adapter default branch moved before push"
      );
    }

    const targetRef = `refs/heads/${branch}`;
    await this.git(
      [
        "push",
        "--porcelain",
        `--force-with-lease=${targetRef}:`,
        CANONICAL_GIT_ENDPOINT,
        `${commitSha}:${targetRef}`,
      ],
      {
        cwd: this.root(),
        label: "atomically create implementation branch",
        authenticated: true,
      }
    );

    const remoteOutput = (
      await this.git(
        [
          "ls-remote",
          "--exit-code",
          "--refs",
          CANONICAL_GIT_ENDPOINT,
          targetRef,
        ],
        {
          label: "verify pushed branch",
          authenticated: true,
        }
      )
    ).stdout;
    const remoteLines = splitNonemptyLines(remoteOutput);
    if (remoteLines.length !== 1) {
      throw new Error(
        "Controlled production adapter pushed branch response is invalid"
      );
    }

    const [remoteSha, remoteRef, ...extra] =
      remoteLines[0].split(/\s+/);
    if (
      remoteSha !== commitSha ||
      remoteRef !== targetRef ||
      extra.length !== 0
    ) {
      throw new Error(
        "Controlled production adapter pushed branch does not match the commit"
      );
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
      throw new Error(
        "Controlled production adapter pull-request request is unauthorized"
      );
    }

    if ((await this.readDefaultBranchHead()) !== this.baseCommitSha) {
      throw new Error(
        "Controlled production adapter default branch moved before pull request"
      );
    }
    if (await this.findPullRequestByHead(this.branch)) {
      throw new Error(
        "Controlled production adapter pull request already exists"
      );
    }

    const bodyPath = join(
      this.temporaryRoot ?? this.root(),
      `pr-body-${randomUUID()}.md`
    );
    const bodyHandle = await open(bodyPath, "wx", 0o600);
    try {
      await bodyHandle.writeFile(request.body, { encoding: "utf8" });
    } finally {
      await bodyHandle.close();
    }

    let createdUrl: string;
    try {
      createdUrl = exactString(
        (
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
          )
        ).stdout,
        "created pull-request URL"
      );
    } finally {
      await rm(bodyPath, { force: true });
    }

    const urlMatch =
      /^https:\/\/github\.com\/siricarsen-cmd\/subshield\/pull\/([1-9]\d*)$/.exec(
        createdUrl
      );
    if (!urlMatch) {
      throw new Error(
        "Controlled production adapter created pull-request URL is invalid"
      );
    }

    const pullRequestNumber = Number(urlMatch[1]);
    if (!Number.isSafeInteger(pullRequestNumber)) {
      throw new Error(
        "Controlled production adapter created pull-request number is invalid"
      );
    }

    const refetched = normalizedJson<GitHubPullRequestView>(
      (
        await this.gh(
          [
            "pr",
            "view",
            String(pullRequestNumber),
            "--repo",
            EXPECTED_REPOSITORY,
            "--json",
            "number,url,baseRefName,headRefName,headRefOid,title,body,state,isDraft,autoMergeRequest,createdAt",
          ],
          "refetch implementation pull request"
        )
      ).stdout,
      "pull-request refetch"
    );
    const record = this.pullRequestRecord(refetched);

    if (
      record.number !== pullRequestNumber ||
      record.url !== createdUrl ||
      record.baseBranch !== request.baseBranch ||
      record.headBranch !== request.headBranch ||
      record.headCommitSha !== request.headCommitSha ||
      record.title !== request.title ||
      record.body !== request.body ||
      record.state !== "OPEN" ||
      record.isDraft !== false ||
      record.autoMergeEnabled !== false
    ) {
      throw new Error(
        "Controlled production adapter refetched pull request does not match"
      );
    }

    this.pullRequestCreatedAt = record.createdAt;
    this.state = "pr-created";
    return record;
  }

  async readTrustedPrincipal(): Promise<string> {
    this.assertState(
      "created",
      "branch-created",
      "files-written",
      "committed",
      "checking",
      "checked",
      "pushed",
      "pr-created"
    );
    if (!this.trustedPrincipal) {
      throw new Error(
        "Controlled production adapter authenticated principal is unavailable"
      );
    }
    return this.trustedPrincipal;
  }

  async readTrustedClock(): Promise<string> {
    this.assertState("pr-created");
    if (!this.pullRequestCreatedAt) {
      throw new Error(
        "Controlled production adapter GitHub creation time is unavailable"
      );
    }
    return this.pullRequestCreatedAt;
  }

  async cleanup(): Promise<void> {
    if (this.state === "cleaned") return;

    this.githubToken = undefined;
    const worktree = this.worktreeRoot;
    const temporary = this.temporaryRoot;

    try {
      if (worktree) {
        await this.git(
          ["worktree", "remove", "--force", worktree],
          {
            label: "remove isolated worktree",
            allowedExitCodes: [0, 128],
          }
        );
        await this.git(["worktree", "prune"], {
          label: "prune isolated worktree metadata",
          allowedExitCodes: [0, 128],
        });
      }
    } finally {
      if (temporary) {
        await rm(temporary, { recursive: true, force: true });
      }
      this.state = "cleaned";
    }
  }

  private pullRequestRecord(
    value: GitHubPullRequestView
  ): RegulatoryImplementationPullRequestRecord {
    if (
      !Number.isSafeInteger(value.number) ||
      Number(value.number) <= 0
    ) {
      throw new Error(
        "Controlled production adapter pull-request number is invalid"
      );
    }

    const number = Number(value.number);
    const url = exactString(value.url, "pull-request URL");
    if (
      url !==
      `https://github.com/${EXPECTED_REPOSITORY}/pull/${number}`
    ) {
      throw new Error(
        "Controlled production adapter pull-request URL is invalid"
      );
    }

    const state = exactString(value.state, "pull-request state");
    if (typeof value.isDraft !== "boolean") {
      throw new Error(
        "Controlled production adapter pull-request draft state is invalid"
      );
    }

    return {
      number,
      url,
      baseBranch: exactString(
        value.baseRefName,
        "pull-request base"
      ),
      headBranch: exactString(
        value.headRefName,
        "pull-request head"
      ),
      headCommitSha: exactString(
        value.headRefOid,
        "pull-request head commit"
      ),
      title: exactString(value.title, "pull-request title"),
      body: typeof value.body === "string" ? value.body : "",
      autoMergeEnabled: value.autoMergeRequest != null,
      state,
      isDraft: value.isDraft,
      createdAt: normalizeRfc3339Instant(
        value.createdAt,
        "pull-request createdAt"
      ),
    };
  }
}

export async function executeRegulatoryImplementationWithProductionAdapter(
  plan: RegulatoryRegistryImplementationPlan,
  bundle: RegulatoryImplementationPullRequestBundle,
  options: RegulatoryImplementationProductionOptions
): Promise<RegulatoryImplementationProductionExecutionResult> {
  const repositoryRoot = await realpath(options.repositoryRoot);
  const adapter = new ProductionRegulatoryImplementationAdapter(
    repositoryRoot,
    plan,
    bundle
  );

  let result: RegulatoryImplementationExecutionResult | undefined;
  let executionFailed = false;
  try {
    result = await executeRegulatoryImplementationPullRequest(
      plan,
      bundle,
      adapter
    );
  } catch {
    executionFailed = true;
  }

  let cleanupFailed = false;
  try {
    await adapter.cleanup();
  } catch {
    cleanupFailed = true;
  }

  if (executionFailed || cleanupFailed) {
    return productionBoundaryFailure(
      executionFailed && cleanupFailed
        ? "execution-and-cleanup"
        : executionFailed
          ? "execution"
          : "cleanup",
      result
    );
  }

  if (!result) {
    return productionBoundaryFailure("execution");
  }
  return result;
}
