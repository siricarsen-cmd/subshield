import { execFile, type ExecFileException } from "node:child_process";
import { createHash } from "node:crypto";
import { lstat, readFile, realpath } from "node:fs/promises";
import { isAbsolute, resolve } from "node:path";

const EXPECTED_REPOSITORY = "siricarsen-cmd/subshield";
const EXPECTED_DEFAULT_BRANCH = "main";
const EXPECTED_ORIGIN = "https://github.com/siricarsen-cmd/subshield.git";
const MAX_OUTPUT_BYTES = 512 * 1024;
const COMMAND_TIMEOUT_MS = 30_000;
const COMMIT_SHA_RE = /^[a-f0-9]{40}$/;
const SHA256_RE = /^sha256:[a-f0-9]{64}$/;
const SAFE_PERMISSIONS = new Set(["ADMIN", "MAINTAIN", "WRITE"]);
const QUALIFYING_FINDING_RE = /\b(?:p1|p2|correctness|security|test[- ]quality)\b/i;
const CLEAN_REVIEW_RE = /codex review:\s*did(?:n't| not) find any major issues\.\s*bravo\./i;
const REVIEWED_COMMIT_RE = /reviewed commit:\s*([a-f0-9]{10,40})\b/i;

export const REGULATORY_MERGE_HOSTED_POLICY = Object.freeze({
  repository: EXPECTED_REPOSITORY,
  defaultBranch: EXPECTED_DEFAULT_BRANCH,
  canonicalOrigin: EXPECTED_ORIGIN,
  operatorLogin: "siricarsen-cmd",
  workflowId: 320336946,
  workflowName: "Regulatory Grounding Foundation",
  workflowPath: ".github/workflows/regulatory-grounding.yml",
  jobName: "Official sources / types / analyzer regression",
  workflowEvent: "pull_request",
  codexLogin: "chatgpt-codex-connector[bot]",
  codexAccountId: 199175422,
  codexReviewState: "COMMENTED",
  mergeMethod: "squash",
});

export interface RegulatoryMergeRuntimeIdentity {
  login: "siricarsen-cmd";
  permission: "ADMIN" | "MAINTAIN" | "WRITE";
  runtimeFingerprint: string;
  configFingerprint: string;
  repositoryFingerprint: string;
}

export interface RegulatoryMergeFileEvidence {
  path: string;
  baseChecksum: string;
  headChecksum: string;
}

export interface RegulatoryMergeCheckEvidence {
  workflowId: number;
  workflowName: string;
  workflowPath: string;
  workflowRunId: number;
  attempt: number;
  jobId: number;
  jobName: string;
  event: string;
  headSha: string;
  status: string;
  conclusion: string;
  completedAt: string;
}

export interface RegulatoryMergeCodexEvidence {
  login: string;
  accountId: number;
  reviewId: number;
  reviewState: string;
  reviewCommit: string;
  reviewSubmittedAt: string;
  attestationCommentId: number;
  attestationCreatedAt: string;
  reviewedCommit: string;
  clean: boolean;
}

export interface RegulatoryMergeHostedSnapshot {
  repositoryFullName: string;
  defaultBranch: string;
  viewerLogin: string;
  viewerPermission: string;
  number: number;
  url: string;
  state: string;
  draft: boolean;
  autoMergeEnabled: boolean;
  merged: boolean;
  baseBranch: string;
  baseSha: string;
  remoteMainSha: string;
  headBranch: string;
  headSha: string;
  headRefSha: string;
  headParents: string[];
  mergeCommitSha: string | null;
  files: RegulatoryMergeFileEvidence[];
  checks: RegulatoryMergeCheckEvidence[];
  codexEvidence: RegulatoryMergeCodexEvidence;
  unresolvedThreadCount: number;
  paginationComplete: true;
  runtimeFingerprint: string;
  configFingerprint: string;
  repositoryFingerprint: string;
}

export type RegulatoryMergeMutation = Readonly<
  | { kind: "accepted"; mergeCommitSha: string }
  | { kind: "refused" }
  | { kind: "ambiguous" }
>;

export interface RegulatoryImplementationMergeAdapter {
  authenticate(): Promise<RegulatoryMergeRuntimeIdentity>;
  inspectExactPullRequest(prNumber: number): Promise<Readonly<RegulatoryMergeHostedSnapshot>>;
  requestExpectedHeadSquashMerge(
    prNumber: number,
    expectedHeadSha: string
  ): Promise<RegulatoryMergeMutation>;
}

export interface RegulatoryImplementationMergeProductionOptions {
  repositoryRoot: string;
  gitExecutable: string;
  githubCliExecutable: string;
  githubCliConfigDir: string;
}

interface FileIdentity {
  path: string;
  fingerprint: string;
}

interface ProtectedIdentity {
  gitFingerprint: string;
  githubCliFingerprint: string;
  runtimeFingerprint: string;
  configFingerprint: string;
  repositoryFingerprint: string;
}

interface CommandResult {
  stdout: string;
  exitCode: number;
}

interface GitHubPageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

interface GitHubReviewThreadPage {
  unresolved: number;
  pageInfo: GitHubPageInfo;
}

function sha256(value: string | Buffer): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function deepFreeze<T>(value: T, seen = new Set<object>()): Readonly<T> {
  if (value && typeof value === "object" && !seen.has(value)) {
    seen.add(value);
    for (const nested of Object.values(value as Record<string, unknown>)) {
      deepFreeze(nested, seen);
    }
    Object.freeze(value);
  }
  return value as Readonly<T>;
}

function asRecord(value: unknown, label = "hosted response"): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} was invalid`);
  }
  return value as Record<string, unknown>;
}

function asArray(value: unknown, label = "hosted response"): unknown[] {
  if (!Array.isArray(value)) throw new Error(`${label} was invalid`);
  return value;
}

function asString(value: unknown, label = "hosted response"): string {
  if (typeof value !== "string" || !value) throw new Error(`${label} was invalid`);
  return value;
}

function asOptionalString(value: unknown, label = "hosted response"): string | null {
  if (value === null) return null;
  return asString(value, label);
}

function asSafeInteger(value: unknown, label = "hosted response"): number {
  if (!Number.isSafeInteger(value)) throw new Error(`${label} was invalid`);
  return value as number;
}

function asBoolean(value: unknown, label = "hosted response"): boolean {
  if (typeof value !== "boolean") throw new Error(`${label} was invalid`);
  return value;
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Hosted response was invalid");
  }
}

function normalizeLogin(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (normalized !== REGULATORY_MERGE_HOSTED_POLICY.operatorLogin) {
    throw new Error("Authenticated GitHub principal was not authorized");
  }
  return normalized;
}

function exactIsoInstant(value: unknown, label: string): string {
  const candidate = asString(value, label);
  const time = Date.parse(candidate);
  if (!Number.isFinite(time) || new Date(time).toISOString() !== candidate) {
    throw new Error(`${label} was invalid`);
  }
  return candidate;
}

function encodeRepositoryPath(path: string): string {
  if (
    !path ||
    path.startsWith("/") ||
    path.includes("\\") ||
    path.split("/").some((segment) => !segment || segment === "." || segment === "..")
  ) {
    throw new Error("Hosted file path was invalid");
  }
  return path.split("/").map(encodeURIComponent).join("/");
}

async function regularFileIdentity(path: string, executable: boolean): Promise<FileIdentity> {
  if (!isAbsolute(path) || resolve(path) !== path) {
    throw new Error("Protected runtime identity was invalid");
  }
  const [canonical, info, bytes] = await Promise.all([
    realpath(path),
    lstat(path),
    readFile(path),
  ]);
  if (
    canonical !== path ||
    !info.isFile() ||
    info.isSymbolicLink() ||
    (executable && (info.mode & 0o111) === 0)
  ) {
    throw new Error("Protected runtime identity was invalid");
  }
  return {
    path,
    fingerprint: sha256(
      `${canonical}\0${info.dev}\0${info.ino}\0${info.uid}\0${info.gid}\0${info.mode}\0${sha256(bytes)}`
    ),
  };
}

async function directoryIdentity(path: string, privateDirectory: boolean): Promise<FileIdentity> {
  if (!isAbsolute(path) || resolve(path) !== path) {
    throw new Error("Protected directory identity was invalid");
  }
  const [canonical, info] = await Promise.all([realpath(path), lstat(path)]);
  if (
    canonical !== path ||
    !info.isDirectory() ||
    info.isSymbolicLink() ||
    (privateDirectory && (info.mode & 0o077) !== 0)
  ) {
    throw new Error("Protected directory identity was invalid");
  }
  return {
    path,
    fingerprint: sha256(
      `${canonical}\0${info.dev}\0${info.ino}\0${info.uid}\0${info.gid}\0${info.mode}`
    ),
  };
}

function genericCommandError(): Error {
  return new Error("Protected repository command failed");
}

function runCommand(
  executable: string,
  args: readonly string[],
  cwd: string,
  env: NodeJS.ProcessEnv,
  allowedExitCodes: readonly number[] = [0]
): Promise<CommandResult> {
  const allowed = new Set(allowedExitCodes);
  return new Promise((resolvePromise, rejectPromise) => {
    execFile(
      executable,
      [...args],
      {
        cwd,
        env,
        shell: false,
        windowsHide: true,
        encoding: "utf8",
        timeout: COMMAND_TIMEOUT_MS,
        maxBuffer: MAX_OUTPUT_BYTES,
      },
      (error: ExecFileException | null, stdout: string | Buffer) => {
        const exitCode =
          error && typeof error.code === "number" ? error.code : error ? -1 : 0;
        if (!allowed.has(exitCode)) {
          rejectPromise(genericCommandError());
          return;
        }
        const output = typeof stdout === "string" ? stdout : stdout.toString("utf8");
        if (Buffer.byteLength(output, "utf8") > MAX_OUTPUT_BYTES) {
          rejectPromise(genericCommandError());
          return;
        }
        resolvePromise({ stdout: output, exitCode });
      }
    );
  });
}

function flattenSlurpedPages(value: unknown, key?: string): unknown[] {
  const pages = asArray(value, "hosted pagination");
  if (pages.length === 0 || pages.length > 500) {
    throw new Error("Hosted pagination was incomplete");
  }
  const flattened: unknown[] = [];
  for (const page of pages) {
    const selected = key ? asRecord(page, "hosted pagination")[key] : page;
    const items = asArray(selected, "hosted pagination");
    flattened.push(...items);
  }
  return flattened;
}

function permissionFromRepository(repository: Record<string, unknown>): "ADMIN" | "MAINTAIN" | "WRITE" {
  const permissions = asRecord(repository.permissions, "repository permissions");
  if (permissions.admin === true) return "ADMIN";
  if (permissions.maintain === true) return "MAINTAIN";
  if (permissions.push === true) return "WRITE";
  throw new Error("Authenticated GitHub permission was insufficient");
}

function compareIdentity(left: ProtectedIdentity, right: ProtectedIdentity): boolean {
  return (
    left.gitFingerprint === right.gitFingerprint &&
    left.githubCliFingerprint === right.githubCliFingerprint &&
    left.runtimeFingerprint === right.runtimeFingerprint &&
    left.configFingerprint === right.configFingerprint &&
    left.repositoryFingerprint === right.repositoryFingerprint
  );
}

function extractReviewPrefix(body: string): string | null {
  if (!CLEAN_REVIEW_RE.test(body)) return null;
  const match = REVIEWED_COMMIT_RE.exec(body);
  return match?.[1] ?? null;
}

function containsLaterFinding(body: string): boolean {
  if (!QUALIFYING_FINDING_RE.test(body)) return false;
  const normalized = body.toLowerCase();
  return !(
    normalized.includes("no p1") &&
    normalized.includes("no p2") &&
    normalized.includes("no correctness") &&
    normalized.includes("no security") &&
    normalized.includes("no test-quality")
  );
}

export async function createRegulatoryImplementationMergeProductionAdapter(
  options: RegulatoryImplementationMergeProductionOptions
): Promise<RegulatoryImplementationMergeAdapter> {
  const commandEnvironment: NodeJS.ProcessEnv = Object.freeze({
    NODE_ENV: "production",
    PATH: "",
    HOME: options.githubCliConfigDir,
    GH_CONFIG_DIR: options.githubCliConfigDir,
    LANG: "C",
    LC_ALL: "C",
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_TERMINAL_PROMPT: "0",
  });

  async function collectIdentity(): Promise<ProtectedIdentity> {
    const [git, githubCli, repository, config] = await Promise.all([
      regularFileIdentity(options.gitExecutable, true),
      regularFileIdentity(options.githubCliExecutable, true),
      directoryIdentity(options.repositoryRoot, false),
      directoryIdentity(options.githubCliConfigDir, true),
    ]);
    const [rootResult, originResult] = await Promise.all([
      runCommand(
        options.gitExecutable,
        ["-C", options.repositoryRoot, "rev-parse", "--show-toplevel"],
        options.repositoryRoot,
        commandEnvironment
      ),
      runCommand(
        options.gitExecutable,
        ["-C", options.repositoryRoot, "config", "--get", "remote.origin.url"],
        options.repositoryRoot,
        commandEnvironment
      ),
    ]);
    if (
      rootResult.stdout.trim() !== options.repositoryRoot ||
      originResult.stdout.trim() !== EXPECTED_ORIGIN
    ) {
      throw new Error("Protected repository identity was invalid");
    }
    return {
      gitFingerprint: git.fingerprint,
      githubCliFingerprint: githubCli.fingerprint,
      runtimeFingerprint: sha256(`${git.fingerprint}\0${githubCli.fingerprint}`),
      configFingerprint: config.fingerprint,
      repositoryFingerprint: sha256(
        `${repository.fingerprint}\0${rootResult.stdout.trim()}\0${originResult.stdout.trim()}`
      ),
    };
  }

  const baselineIdentity = await collectIdentity();

  async function revalidateIdentity(): Promise<ProtectedIdentity> {
    const current = await collectIdentity();
    if (!compareIdentity(current, baselineIdentity)) {
      throw new Error("Protected runtime identity changed");
    }
    return current;
  }

  async function githubApi(args: readonly string[]): Promise<unknown> {
    const result = await runCommand(
      options.githubCliExecutable,
      ["api", ...args],
      options.repositoryRoot,
      commandEnvironment
    );
    return parseJson(result.stdout);
  }

  async function paginated(path: string, key?: string): Promise<unknown[]> {
    return flattenSlurpedPages(
      await githubApi(["--paginate", "--slurp", path]),
      key
    );
  }

  async function authenticate(): Promise<RegulatoryMergeRuntimeIdentity> {
    const identity = await revalidateIdentity();
    const [userValue, repositoryValue] = await Promise.all([
      githubApi(["user"]),
      githubApi([`repos/${EXPECTED_REPOSITORY}`]),
    ]);
    const user = asRecord(userValue);
    const repository = asRecord(repositoryValue);
    const login = normalizeLogin(asString(user.login, "authenticated GitHub login"));
    if (
      asString(repository.full_name, "repository identity") !== EXPECTED_REPOSITORY ||
      asString(repository.default_branch, "repository default branch") !== EXPECTED_DEFAULT_BRANCH
    ) {
      throw new Error("Protected repository identity was invalid");
    }
    const permission = permissionFromRepository(repository);
    if (!SAFE_PERMISSIONS.has(permission)) {
      throw new Error("Authenticated GitHub permission was insufficient");
    }
    return deepFreeze({
      login: login as "siricarsen-cmd",
      permission,
      runtimeFingerprint: identity.runtimeFingerprint,
      configFingerprint: identity.configFingerprint,
      repositoryFingerprint: identity.repositoryFingerprint,
    });
  }

  async function readContentAtCommit(commitSha: string, path: string): Promise<string> {
    if (!COMMIT_SHA_RE.test(commitSha)) throw new Error("Hosted commit identity was invalid");
    const value = asRecord(
      await githubApi([
        `repos/${EXPECTED_REPOSITORY}/contents/${encodeRepositoryPath(path)}?ref=${commitSha}`,
      ]),
      "hosted file content"
    );
    if (
      value.type !== "file" ||
      value.encoding !== "base64" ||
      typeof value.content !== "string"
    ) {
      throw new Error("Hosted file content was invalid");
    }
    const compact = value.content.replace(/\s+/g, "");
    const bytes = Buffer.from(compact, "base64");
    if (bytes.length === 0 && compact !== "") {
      throw new Error("Hosted file content was invalid");
    }
    return sha256(bytes);
  }

  async function readReviewThreads(prNumber: number): Promise<number> {
    const query = [
      "query($number:Int!,$after:String){",
      'repository(owner:"siricarsen-cmd",name:"subshield"){',
      "pullRequest(number:$number){",
      "reviewThreads(first:100,after:$after){",
      "nodes{isResolved}",
      "pageInfo{hasNextPage endCursor}",
      "}}}}",
    ].join("");
    let cursor: string | null = null;
    let unresolved = 0;
    let pageCount = 0;
    do {
      pageCount += 1;
      if (pageCount > 500) throw new Error("Review thread pagination was incomplete");
      const args = [
        "graphql",
        "-f",
        `query=${query}`,
        "-F",
        `number=${prNumber}`,
        ...(cursor ? ["-f", `after=${cursor}`] : ["-f", "after="]),
      ];
      const value = asRecord(await githubApi(args));
      const data = asRecord(value.data, "review thread response");
      const repository = asRecord(data.repository, "review thread response");
      const pullRequest = asRecord(repository.pullRequest, "review thread response");
      const reviewThreads = asRecord(pullRequest.reviewThreads, "review thread response");
      const nodes = asArray(reviewThreads.nodes, "review thread response");
      for (const nodeValue of nodes) {
        const node = asRecord(nodeValue, "review thread");
        if (node.isResolved !== true) unresolved += 1;
      }
      const pageInfoValue = asRecord(reviewThreads.pageInfo, "review thread pagination");
      const hasNextPage = asBoolean(
        pageInfoValue.hasNextPage,
        "review thread pagination"
      );
      const endCursor =
        pageInfoValue.endCursor === null
          ? null
          : asString(pageInfoValue.endCursor, "review thread pagination");
      if (hasNextPage && !endCursor) {
        throw new Error("Review thread pagination was incomplete");
      }
      cursor = hasNextPage ? endCursor : null;
    } while (cursor);
    return unresolved;
  }

  async function inspectExactPullRequest(
    prNumber: number
  ): Promise<Readonly<RegulatoryMergeHostedSnapshot>> {
    if (!Number.isSafeInteger(prNumber) || prNumber < 1) {
      throw new Error("Pull request identity was invalid");
    }
    const identity = await revalidateIdentity();
    const pr = asRecord(
      await githubApi([`repos/${EXPECTED_REPOSITORY}/pulls/${prNumber}`]),
      "pull request"
    );
    const base = asRecord(pr.base, "pull request base");
    const head = asRecord(pr.head, "pull request head");
    const headBranch = asString(head.ref, "pull request head branch");
    const headSha = asString(head.sha, "pull request head commit");
    const baseSha = asString(base.sha, "pull request base commit");
    if (!COMMIT_SHA_RE.test(headSha) || !COMMIT_SHA_RE.test(baseSha)) {
      throw new Error("Pull request commit identity was invalid");
    }

    const [
      repositoryValue,
      mainReferenceValue,
      headReferenceValue,
      headCommitValue,
      fileValues,
      workflowRunValues,
      reviewValues,
      issueCommentValues,
      pullCommitValues,
      unresolvedThreadCount,
      actor,
    ] = await Promise.all([
      githubApi([`repos/${EXPECTED_REPOSITORY}`]),
      githubApi([`repos/${EXPECTED_REPOSITORY}/git/ref/heads/${EXPECTED_DEFAULT_BRANCH}`]),
      githubApi([
        `repos/${EXPECTED_REPOSITORY}/git/ref/heads/${encodeURIComponent(headBranch)}`,
      ]),
      githubApi([`repos/${EXPECTED_REPOSITORY}/commits/${headSha}`]),
      paginated(`repos/${EXPECTED_REPOSITORY}/pulls/${prNumber}/files?per_page=100`),
      paginated(
        `repos/${EXPECTED_REPOSITORY}/actions/workflows/${REGULATORY_MERGE_HOSTED_POLICY.workflowId}/runs?event=pull_request&head_sha=${headSha}&per_page=100`,
        "workflow_runs"
      ),
      paginated(`repos/${EXPECTED_REPOSITORY}/pulls/${prNumber}/reviews?per_page=100`),
      paginated(`repos/${EXPECTED_REPOSITORY}/issues/${prNumber}/comments?per_page=100`),
      paginated(`repos/${EXPECTED_REPOSITORY}/pulls/${prNumber}/commits?per_page=100`),
      readReviewThreads(prNumber),
      authenticate(),
    ]);

    const repository = asRecord(repositoryValue, "repository");
    const mainReference = asRecord(mainReferenceValue, "main reference");
    const mainObject = asRecord(mainReference.object, "main reference");
    const headReference = asRecord(headReferenceValue, "head reference");
    const headObject = asRecord(headReference.object, "head reference");
    const headCommit = asRecord(headCommitValue, "head commit");
    const parents = asArray(headCommit.parents, "head commit parents").map((value) =>
      asString(asRecord(value, "head commit parent").sha, "head commit parent")
    );

    const candidateRuns = workflowRunValues
      .map((value) => asRecord(value, "workflow run"))
      .filter(
        (run) =>
          run.workflow_id === REGULATORY_MERGE_HOSTED_POLICY.workflowId &&
          run.name === REGULATORY_MERGE_HOSTED_POLICY.workflowName &&
          run.path === REGULATORY_MERGE_HOSTED_POLICY.workflowPath &&
          run.event === REGULATORY_MERGE_HOSTED_POLICY.workflowEvent &&
          run.head_sha === headSha
      );
    if (candidateRuns.length === 0) {
      throw new Error("Required hosted workflow evidence was missing");
    }
    if (candidateRuns.length !== 1) {
      throw new Error("Required hosted workflow evidence was ambiguous");
    }
    const selectedRun = candidateRuns[0];
    const selectedRunId = asSafeInteger(selectedRun.id, "workflow run");
    const selectedAttempt = asSafeInteger(selectedRun.run_attempt, "workflow attempt");

    const jobValues = await paginated(
      `repos/${EXPECTED_REPOSITORY}/actions/runs/${selectedRunId}/attempts/${selectedAttempt}/jobs?per_page=100`,
      "jobs"
    );
    const matchingJobs = jobValues
      .map((value) => asRecord(value, "workflow job"))
      .filter((job) => job.name === REGULATORY_MERGE_HOSTED_POLICY.jobName);
    if (matchingJobs.length !== 1) {
      throw new Error("Required hosted job evidence was ambiguous");
    }
    const job = matchingJobs[0];
    const checkEvidence: RegulatoryMergeCheckEvidence = {
      workflowId: asSafeInteger(selectedRun.workflow_id, "workflow run"),
      workflowName: asString(selectedRun.name, "workflow run"),
      workflowPath: asString(selectedRun.path, "workflow run"),
      workflowRunId: selectedRunId,
      attempt: selectedAttempt,
      jobId: asSafeInteger(job.id, "workflow job"),
      jobName: asString(job.name, "workflow job"),
      event: asString(selectedRun.event, "workflow run"),
      headSha: asString(selectedRun.head_sha, "workflow run"),
      status: asString(job.status, "workflow job"),
      conclusion: asString(job.conclusion, "workflow job"),
      completedAt: exactIsoInstant(job.completed_at, "workflow completion"),
    };

    const pullCommits = pullCommitValues.map((value) =>
      asString(asRecord(value, "pull request commit").sha, "pull request commit")
    );
    if (!pullCommits.includes(headSha)) {
      throw new Error("Pull request commit pagination was incomplete");
    }

    const botReviews = reviewValues
      .map((value) => asRecord(value, "pull request review"))
      .filter((review) => {
        const user = asRecord(review.user, "review author");
        return (
          user.id === REGULATORY_MERGE_HOSTED_POLICY.codexAccountId &&
          user.login === REGULATORY_MERGE_HOSTED_POLICY.codexLogin &&
          review.state === REGULATORY_MERGE_HOSTED_POLICY.codexReviewState &&
          review.commit_id === headSha
        );
      });
    if (botReviews.length === 0) {
      throw new Error("Exact-head Codex review evidence was missing");
    }
    botReviews.sort(
      (left, right) =>
        Date.parse(asString(right.submitted_at, "review time")) -
        Date.parse(asString(left.submitted_at, "review time"))
    );
    const selectedReview = botReviews[0];
    const reviewSubmittedAt = exactIsoInstant(
      selectedReview.submitted_at,
      "review time"
    );

    const botComments = issueCommentValues
      .map((value) => asRecord(value, "issue comment"))
      .filter((comment) => {
        const user = asRecord(comment.user, "comment author");
        return (
          user.id === REGULATORY_MERGE_HOSTED_POLICY.codexAccountId &&
          user.login === REGULATORY_MERGE_HOSTED_POLICY.codexLogin
        );
      })
      .map((comment) => ({
        record: comment,
        body: asString(comment.body, "comment body"),
        createdAt: exactIsoInstant(comment.created_at, "comment time"),
      }))
      .sort((left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt));

    const cleanCandidates = botComments.filter((candidate) => {
      const prefix = extractReviewPrefix(candidate.body);
      if (!prefix || prefix.length < 10) return false;
      const matches = pullCommits.filter((commitSha) => commitSha.startsWith(prefix));
      return (
        matches.length === 1 &&
        matches[0] === headSha &&
        Date.parse(candidate.createdAt) >= Date.parse(reviewSubmittedAt) &&
        Date.parse(candidate.createdAt) >= Date.parse(checkEvidence.completedAt)
      );
    });
    if (cleanCandidates.length === 0) {
      throw new Error("Terminal Codex attestation was missing");
    }
    const selectedAttestation = cleanCandidates.at(-1);
    if (!selectedAttestation) {
      throw new Error("Terminal Codex attestation was missing");
    }
    const selectedIndex = botComments.indexOf(selectedAttestation);
    const laterFindings = botComments
      .slice(selectedIndex + 1)
      .some((candidate) => containsLaterFinding(candidate.body));
    if (laterFindings) {
      throw new Error("Terminal Codex attestation was superseded");
    }

    const files = await Promise.all(
      fileValues.map(async (value) => {
        const file = asRecord(value, "pull request file");
        const path = asString(file.filename, "pull request file");
        return {
          path,
          baseChecksum: await readContentAtCommit(baseSha, path),
          headChecksum: await readContentAtCommit(headSha, path),
        };
      })
    );

    const snapshot: RegulatoryMergeHostedSnapshot = {
      repositoryFullName: asString(repository.full_name, "repository"),
      defaultBranch: asString(repository.default_branch, "repository"),
      viewerLogin: actor.login,
      viewerPermission: actor.permission,
      number: asSafeInteger(pr.number, "pull request"),
      url: asString(pr.html_url, "pull request"),
      state: asString(pr.state, "pull request"),
      draft: pr.draft === true,
      autoMergeEnabled: pr.auto_merge !== null,
      merged: pr.merged === true,
      baseBranch: asString(base.ref, "pull request base branch"),
      baseSha,
      remoteMainSha: asString(mainObject.sha, "main reference"),
      headBranch,
      headSha,
      headRefSha: asString(headObject.sha, "head reference"),
      headParents: parents,
      mergeCommitSha: asOptionalString(pr.merge_commit_sha, "merge commit"),
      files: files.sort((left, right) => left.path.localeCompare(right.path)),
      checks: [checkEvidence],
      codexEvidence: {
        login: REGULATORY_MERGE_HOSTED_POLICY.codexLogin,
        accountId: REGULATORY_MERGE_HOSTED_POLICY.codexAccountId,
        reviewId: asSafeInteger(selectedReview.id, "review"),
        reviewState: asString(selectedReview.state, "review"),
        reviewCommit: asString(selectedReview.commit_id, "review"),
        reviewSubmittedAt,
        attestationCommentId: asSafeInteger(
          selectedAttestation.record.id,
          "attestation comment"
        ),
        attestationCreatedAt: selectedAttestation.createdAt,
        reviewedCommit: headSha,
        clean: true,
      },
      unresolvedThreadCount,
      paginationComplete: true,
      runtimeFingerprint: identity.runtimeFingerprint,
      configFingerprint: identity.configFingerprint,
      repositoryFingerprint: identity.repositoryFingerprint,
    };
    return deepFreeze(snapshot);
  }

  async function requestExpectedHeadSquashMerge(
    prNumber: number,
    expectedHeadSha: string
  ): Promise<RegulatoryMergeMutation> {
    if (
      !Number.isSafeInteger(prNumber) ||
      prNumber < 1 ||
      !COMMIT_SHA_RE.test(expectedHeadSha)
    ) {
      throw new Error("Merge identity was invalid");
    }
    await authenticate();
    try {
      const response = asRecord(
        await githubApi([
          "--method",
          "PUT",
          `repos/${EXPECTED_REPOSITORY}/pulls/${prNumber}/merge`,
          "-f",
          `merge_method=${REGULATORY_MERGE_HOSTED_POLICY.mergeMethod}`,
          "-f",
          `sha=${expectedHeadSha}`,
        ]),
        "merge response"
      );
      if (response.merged === true) {
        const mergeCommitSha = asString(response.sha, "merge response");
        if (!COMMIT_SHA_RE.test(mergeCommitSha)) {
          return deepFreeze({ kind: "ambiguous" });
        }
        return deepFreeze({ kind: "accepted", mergeCommitSha });
      }
      if (response.merged === false) {
        return deepFreeze({ kind: "refused" });
      }
      return deepFreeze({ kind: "ambiguous" });
    } catch {
      return deepFreeze({ kind: "ambiguous" });
    }
  }

  return deepFreeze({
    authenticate,
    inspectExactPullRequest,
    requestExpectedHeadSquashMerge,
  });
}

export const regulatoryImplementationMergeProductionAdapterTestSurface =
  Object.freeze({
    flattenSlurpedPages,
    extractReviewPrefix,
    containsLaterFinding,
    sha256,
    checksumPattern: SHA256_RE,
  });
