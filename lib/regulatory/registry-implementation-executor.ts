import { createHash } from "node:crypto";

import {
  isLiveAuthorizedRegulatoryRegistryImplementationPlan,
  validateRegulatoryRegistryImplementationPlan,
  type RegulatoryRegistryImplementationPlan,
} from "./registry-implementation-plan";
import {
  isLiveRegulatoryImplementationPullRequestBundle,
  validateRegulatoryImplementationPullRequestBundle,
  type RegulatoryImplementationFileChange,
  type RegulatoryImplementationPullRequestBundle,
} from "./registry-implementation-pr-bundle";
import { fingerprintRegulatoryRegistryValue } from "./registry-integrity";

const EXPECTED_REPOSITORY = "siricarsen-cmd/subshield";
const EXPECTED_DEFAULT_BRANCH = "main";
const SHA_RE = /^[a-f0-9]{40}$/;
const ALLOWED_TARGETS = new Set([
  "lib/regulatory/benchmark-applicability-mappings.ts",
  "lib/regulatory/historical-grounding-policy.ts",
  "lib/regulatory/source-coverage-citation-packages.ts",
]);
const LIVE_EXECUTION_RECEIPTS = new WeakSet<object>();

export interface RegulatoryImplementationRepositoryState {
  repositoryFullName: string;
  defaultBranch: string;
}

export interface RegulatoryImplementationCheckResult {
  command: string;
  commitSha: string;
  conclusion: "success" | "failure";
}

export interface RegulatoryImplementationPullRequestRecord {
  number: number;
  url: string;
  baseBranch: string;
  headBranch: string;
  headCommitSha: string;
  title: string;
  body: string;
  autoMergeEnabled: boolean;
}

/**
 * Deliberately narrow repository boundary. It contains no merge, deployment,
 * release, secret, environment, customer-record, database, payment,
 * authentication, or email operation.
 */
export interface RegulatoryImplementationRepositoryAdapter {
  inspectRepository(): Promise<RegulatoryImplementationRepositoryState>;
  commitExists(commitSha: string): Promise<boolean>;
  readFileAtCommit(commitSha: string, path: string): Promise<string>;
  branchExists(branch: string): Promise<boolean>;
  findPullRequestByHead(branch: string): Promise<RegulatoryImplementationPullRequestRecord | null>;
  createBranch(branch: string, baseCommitSha: string): Promise<void>;
  writeFile(branch: string, path: string, content: string): Promise<void>;
  listChangedFiles(branch: string): Promise<readonly string[]>;
  createCommit(branch: string, message: string): Promise<string>;
  listCommitChangedFiles(commitSha: string, baseCommitSha: string): Promise<readonly string[]>;
  readFileFromCommit(commitSha: string, path: string): Promise<string>;
  runCheck(command: string, commitSha: string): Promise<RegulatoryImplementationCheckResult>;
  pushBranch(branch: string, commitSha: string, force: false): Promise<void>;
  createPullRequest(request: {
    baseBranch: string;
    headBranch: string;
    headCommitSha: string;
    title: string;
    body: string;
    autoMergeEnabled: false;
  }): Promise<RegulatoryImplementationPullRequestRecord>;
}

export interface ExecuteRegulatoryImplementationRequest {
  executedAt: string;
  executedBy: string;
}

export interface RegulatoryImplementationExecutionReceiptFile {
  path: string;
  beforeChecksum: string;
  afterChecksum: string;
}

export interface RegulatoryImplementationExecutionReceipt {
  schemaVersion: 1;
  receiptId: string;
  repositoryFullName: string;
  planId: string;
  planChecksum: string;
  bundleId: string;
  bundleChecksum: string;
  baseCommitSha: string;
  targetBranch: string;
  commitSha: string;
  files: RegulatoryImplementationExecutionReceiptFile[];
  checks: RegulatoryImplementationCheckResult[];
  pullRequest: {
    number: number;
    url: string;
    baseBranch: string;
    headBranch: string;
    headCommitSha: string;
    title: string;
    bodyFingerprint: string;
    autoMergeEnabled: false;
  };
  executedAt: string;
  executedBy: string;
  authorizationStatus: "audit-evidence-only";
  applicationStatus: "not-applied";
  customerFacingStatus: "benchmark-only";
  mergeStatus: "not-authorized";
  receiptChecksum: string;
}

export type RegulatoryImplementationExecutionResult =
  | Readonly<{
      status: "preflight-refused";
      errors: string[];
      applicationStatus: "not-applied";
      customerFacingStatus: "benchmark-only";
      mergeStatus: "not-authorized";
    }>
  | Readonly<{
      status: "execution-failed";
      stage: "branch" | "write" | "worktree-verification" | "commit" | "commit-verification";
      errors: string[];
      applicationStatus: "not-applied";
      customerFacingStatus: "benchmark-only";
      mergeStatus: "not-authorized";
    }>
  | Readonly<{
      status: "check-failed";
      checks: RegulatoryImplementationCheckResult[];
      errors: string[];
      applicationStatus: "not-applied";
      customerFacingStatus: "benchmark-only";
      mergeStatus: "not-authorized";
    }>
  | Readonly<{
      status: "push-failed";
      checks: RegulatoryImplementationCheckResult[];
      errors: string[];
      applicationStatus: "not-applied";
      customerFacingStatus: "benchmark-only";
      mergeStatus: "not-authorized";
    }>
  | Readonly<{
      status: "pull-request-failed";
      checks: RegulatoryImplementationCheckResult[];
      errors: string[];
      applicationStatus: "not-applied";
      customerFacingStatus: "benchmark-only";
      mergeStatus: "not-authorized";
    }>
  | Readonly<{
      status: "success";
      receipt: Readonly<RegulatoryImplementationExecutionReceipt>;
      applicationStatus: "not-applied";
      customerFacingStatus: "benchmark-only";
      mergeStatus: "not-authorized";
    }>;

function jsonClone<T>(value: T): T {
  const serialized = JSON.stringify(value);
  if (serialized === undefined) throw new Error("Executor value is not JSON serializable");
  return JSON.parse(serialized) as T;
}

function deepFreeze<T>(value: T): Readonly<T> {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const nested of Object.values(value as Record<string, unknown>)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value as Readonly<T>;
}

function sha256(value: string): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function fingerprint(value: unknown): string {
  return fingerprintRegulatoryRegistryValue(jsonClone(value));
}

function exactInstant(value: string, label: string): void {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString() !== value) {
    throw new Error(`${label} must be an exact ISO instant`);
  }
}

function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function sameStrings(left: readonly string[], right: readonly string[]): boolean {
  return fingerprint([...left]) === fingerprint([...right]);
}

function resultBoundary<T extends object>(value: T): Readonly<T> {
  return deepFreeze({
    ...value,
    applicationStatus: "not-applied" as const,
    customerFacingStatus: "benchmark-only" as const,
    mergeStatus: "not-authorized" as const,
  });
}

function receiptPayload(
  receipt:
    | Omit<RegulatoryImplementationExecutionReceipt, "receiptChecksum">
    | RegulatoryImplementationExecutionReceipt
): Omit<RegulatoryImplementationExecutionReceipt, "receiptChecksum"> {
  const { receiptChecksum: _ignored, ...payload } =
    receipt as RegulatoryImplementationExecutionReceipt;
  return jsonClone(payload);
}

function receiptChecksum(
  receipt:
    | Omit<RegulatoryImplementationExecutionReceipt, "receiptChecksum">
    | RegulatoryImplementationExecutionReceipt
): string {
  return fingerprint(receiptPayload(receipt));
}

export function validateRegulatoryImplementationExecutionReceipt(
  receipt: RegulatoryImplementationExecutionReceipt
): string[] {
  const errors: string[] = [];
  if (receipt.schemaVersion !== 1) errors.push("Implementation execution receipt schema is invalid");
  if (!receipt.receiptId.startsWith("regulatory-implementation-execution:")) {
    errors.push("Implementation execution receipt ID is invalid");
  }
  if (receipt.repositoryFullName !== EXPECTED_REPOSITORY) {
    errors.push("Implementation execution receipt repository is invalid");
  }
  if (!SHA_RE.test(receipt.baseCommitSha) || !SHA_RE.test(receipt.commitSha)) {
    errors.push("Implementation execution receipt commit identity is invalid");
  }
  if (
    receipt.files.length === 0 ||
    receipt.files.some(
      (file) =>
        !ALLOWED_TARGETS.has(file.path) ||
        !/^sha256:[a-f0-9]{64}$/.test(file.beforeChecksum) ||
        !/^sha256:[a-f0-9]{64}$/.test(file.afterChecksum) ||
        file.beforeChecksum === file.afterChecksum
    )
  ) {
    errors.push("Implementation execution receipt file evidence is invalid");
  }
  if (
    receipt.checks.length === 0 ||
    receipt.checks.some(
      (check) =>
        !check.command.trim() ||
        check.commitSha !== receipt.commitSha ||
        check.conclusion !== "success"
    )
  ) {
    errors.push("Implementation execution receipt check evidence is invalid");
  }
  if (
    receipt.pullRequest.number <= 0 ||
    !receipt.pullRequest.url.trim() ||
    receipt.pullRequest.baseBranch !== EXPECTED_DEFAULT_BRANCH ||
    receipt.pullRequest.headBranch !== receipt.targetBranch ||
    receipt.pullRequest.headCommitSha !== receipt.commitSha ||
    receipt.pullRequest.autoMergeEnabled !== false
  ) {
    errors.push("Implementation execution receipt pull-request evidence is invalid");
  }
  try {
    exactInstant(receipt.executedAt, "Implementation execution receipt executedAt");
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }
  if (!receipt.executedBy.trim()) errors.push("Implementation execution receipt executor is blank");
  if (
    receipt.authorizationStatus !== "audit-evidence-only" ||
    receipt.applicationStatus !== "not-applied" ||
    receipt.customerFacingStatus !== "benchmark-only" ||
    receipt.mergeStatus !== "not-authorized"
  ) {
    errors.push("Implementation execution receipt escaped its non-applied boundary");
  }
  if (receipt.receiptChecksum !== receiptChecksum(receipt)) {
    errors.push("Implementation execution receipt checksum does not reproduce");
  }
  return [...new Set(errors)];
}

export function isLiveRegulatoryImplementationExecutionReceipt(
  value: unknown
): value is RegulatoryImplementationExecutionReceipt {
  return Boolean(
    value &&
      typeof value === "object" &&
      LIVE_EXECUTION_RECEIPTS.has(value as object) &&
      validateRegulatoryImplementationExecutionReceipt(
        value as RegulatoryImplementationExecutionReceipt
      ).length === 0
  );
}

async function preflight(
  plan: RegulatoryRegistryImplementationPlan,
  bundle: RegulatoryImplementationPullRequestBundle,
  adapter: RegulatoryImplementationRepositoryAdapter,
  request: ExecuteRegulatoryImplementationRequest
): Promise<string[]> {
  const errors: string[] = [];
  if (!isLiveAuthorizedRegulatoryRegistryImplementationPlan(plan)) {
    errors.push("Executor requires the original live-authorized implementation plan");
  }
  if (!isLiveRegulatoryImplementationPullRequestBundle(bundle)) {
    errors.push("Executor requires the original live implementation PR bundle");
  }
  errors.push(...validateRegulatoryRegistryImplementationPlan(plan));
  errors.push(...validateRegulatoryImplementationPullRequestBundle(bundle, plan));

  try {
    exactInstant(request.executedAt, "Implementation execution executedAt");
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }
  if (!request.executedBy.trim()) errors.push("Implementation execution executor must not be blank");

  try {
    const repository = await adapter.inspectRepository();
    if (repository.repositoryFullName !== EXPECTED_REPOSITORY) {
      errors.push(`Executor repository must be ${EXPECTED_REPOSITORY}`);
    }
    if (repository.defaultBranch !== EXPECTED_DEFAULT_BRANCH) {
      errors.push(`Executor default branch must be ${EXPECTED_DEFAULT_BRANCH}`);
    }
    if (!(await adapter.commitExists(plan.baseCommitSha))) {
      errors.push("Executor reviewed base commit does not exist");
    }
    if (bundle.baseCommitSha !== plan.baseCommitSha) {
      errors.push("Executor plan and bundle base commits do not match");
    }
    if (bundle.targetBranch !== plan.targetBranch) {
      errors.push("Executor plan and bundle target branches do not match");
    }
    if (await adapter.branchExists(plan.targetBranch)) {
      errors.push("Executor target branch already exists");
    }
    if (await adapter.findPullRequestByHead(plan.targetBranch)) {
      errors.push("Executor pull request already exists for the target branch");
    }

    const plannedPaths = sortedUnique(plan.steps.map((step) => step.targetFile));
    const bundlePaths = bundle.files.map((file) => file.path);
    if (
      bundlePaths.length !== new Set(bundlePaths).size ||
      !sameStrings(sortedUnique(bundlePaths), plannedPaths)
    ) {
      errors.push("Executor bundle file set does not exactly match the implementation plan");
    }

    for (const file of bundle.files) {
      if (!ALLOWED_TARGETS.has(file.path)) {
        errors.push(`Executor bundle contains a prohibited path: ${file.path}`);
        continue;
      }
      const baseContent = await adapter.readFileAtCommit(plan.baseCommitSha, file.path);
      if (sha256(baseContent) !== file.beforeChecksum) {
        errors.push(`Executor reviewed base content does not match bundle checksum: ${file.path}`);
      }
      if (sha256(file.content) !== file.afterChecksum) {
        errors.push(`Executor after content does not match bundle checksum: ${file.path}`);
      }
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }

  return [...new Set(errors)];
}

function verifyChangedPaths(
  actual: readonly string[],
  expectedFiles: readonly RegulatoryImplementationFileChange[]
): string[] {
  const expected = expectedFiles.map((file) => file.path).sort((a, b) => a.localeCompare(b));
  const observed = [...actual].sort((a, b) => a.localeCompare(b));
  return sameStrings(observed, expected)
    ? []
    : ["Executor observed extra, missing, duplicated, or reordered file changes"];
}

export async function executeRegulatoryImplementationPullRequest(
  plan: RegulatoryRegistryImplementationPlan,
  bundle: RegulatoryImplementationPullRequestBundle,
  adapter: RegulatoryImplementationRepositoryAdapter,
  request: ExecuteRegulatoryImplementationRequest
): Promise<RegulatoryImplementationExecutionResult> {
  const preflightErrors = await preflight(plan, bundle, adapter, request);
  if (preflightErrors.length > 0) {
    return resultBoundary({ status: "preflight-refused" as const, errors: preflightErrors });
  }

  try {
    await adapter.createBranch(plan.targetBranch, plan.baseCommitSha);
  } catch (error) {
    return resultBoundary({
      status: "execution-failed" as const,
      stage: "branch" as const,
      errors: [error instanceof Error ? error.message : String(error)],
    });
  }

  try {
    for (const file of bundle.files) {
      await adapter.writeFile(plan.targetBranch, file.path, file.content);
    }
  } catch (error) {
    return resultBoundary({
      status: "execution-failed" as const,
      stage: "write" as const,
      errors: [error instanceof Error ? error.message : String(error)],
    });
  }

  const worktreeErrors = verifyChangedPaths(
    await adapter.listChangedFiles(plan.targetBranch),
    bundle.files
  );
  if (worktreeErrors.length > 0) {
    return resultBoundary({
      status: "execution-failed" as const,
      stage: "worktree-verification" as const,
      errors: worktreeErrors,
    });
  }

  let commitSha: string;
  try {
    commitSha = await adapter.createCommit(plan.targetBranch, bundle.commitMessage);
    if (!SHA_RE.test(commitSha)) throw new Error("Executor created commit SHA is invalid");
  } catch (error) {
    return resultBoundary({
      status: "execution-failed" as const,
      stage: "commit" as const,
      errors: [error instanceof Error ? error.message : String(error)],
    });
  }

  try {
    const commitPathErrors = verifyChangedPaths(
      await adapter.listCommitChangedFiles(commitSha, plan.baseCommitSha),
      bundle.files
    );
    const contentErrors: string[] = [];
    for (const file of bundle.files) {
      const committedContent = await adapter.readFileFromCommit(commitSha, file.path);
      if (committedContent !== file.content || sha256(committedContent) !== file.afterChecksum) {
        contentErrors.push(`Executor commit content does not match bundle: ${file.path}`);
      }
    }
    const errors = [...commitPathErrors, ...contentErrors];
    if (errors.length > 0) {
      return resultBoundary({
        status: "execution-failed" as const,
        stage: "commit-verification" as const,
        errors,
      });
    }
  } catch (error) {
    return resultBoundary({
      status: "execution-failed" as const,
      stage: "commit-verification" as const,
      errors: [error instanceof Error ? error.message : String(error)],
    });
  }

  const checks: RegulatoryImplementationCheckResult[] = [];
  for (const command of bundle.requiredChecks) {
    try {
      const check = await adapter.runCheck(command, commitSha);
      checks.push(jsonClone(check));
      if (
        check.command !== command ||
        check.commitSha !== commitSha ||
        check.conclusion !== "success"
      ) {
        return resultBoundary({
          status: "check-failed" as const,
          checks,
          errors: [`Executor required check failed or was not bound to the created commit: ${command}`],
        });
      }
    } catch (error) {
      return resultBoundary({
        status: "check-failed" as const,
        checks,
        errors: [error instanceof Error ? error.message : String(error)],
      });
    }
  }

  try {
    await adapter.pushBranch(plan.targetBranch, commitSha, false);
  } catch (error) {
    return resultBoundary({
      status: "push-failed" as const,
      checks,
      errors: [error instanceof Error ? error.message : String(error)],
    });
  }

  let pullRequest: RegulatoryImplementationPullRequestRecord;
  try {
    pullRequest = await adapter.createPullRequest({
      baseBranch: EXPECTED_DEFAULT_BRANCH,
      headBranch: plan.targetBranch,
      headCommitSha: commitSha,
      title: bundle.pullRequestTitle,
      body: bundle.pullRequestBody,
      autoMergeEnabled: false,
    });
    if (
      pullRequest.baseBranch !== EXPECTED_DEFAULT_BRANCH ||
      pullRequest.headBranch !== plan.targetBranch ||
      pullRequest.headCommitSha !== commitSha ||
      pullRequest.title !== bundle.pullRequestTitle ||
      pullRequest.body !== bundle.pullRequestBody ||
      pullRequest.autoMergeEnabled !== false
    ) {
      throw new Error("Executor pull-request metadata does not reproduce the bundle");
    }
  } catch (error) {
    return resultBoundary({
      status: "pull-request-failed" as const,
      checks,
      errors: [error instanceof Error ? error.message : String(error)],
    });
  }

  const payload: Omit<RegulatoryImplementationExecutionReceipt, "receiptChecksum"> = {
    schemaVersion: 1,
    receiptId: `regulatory-implementation-execution:${bundle.bundleId}:${commitSha}`,
    repositoryFullName: EXPECTED_REPOSITORY,
    planId: plan.planId,
    planChecksum: plan.planChecksum,
    bundleId: bundle.bundleId,
    bundleChecksum: bundle.bundleChecksum,
    baseCommitSha: plan.baseCommitSha,
    targetBranch: plan.targetBranch,
    commitSha,
    files: bundle.files.map((file) => ({
      path: file.path,
      beforeChecksum: file.beforeChecksum,
      afterChecksum: file.afterChecksum,
    })),
    checks: jsonClone(checks),
    pullRequest: {
      number: pullRequest.number,
      url: pullRequest.url,
      baseBranch: pullRequest.baseBranch,
      headBranch: pullRequest.headBranch,
      headCommitSha: pullRequest.headCommitSha,
      title: pullRequest.title,
      bodyFingerprint: fingerprint(pullRequest.body),
      autoMergeEnabled: false,
    },
    executedAt: request.executedAt,
    executedBy: request.executedBy.replace(/\s+/g, " ").trim(),
    authorizationStatus: "audit-evidence-only",
    applicationStatus: "not-applied",
    customerFacingStatus: "benchmark-only",
    mergeStatus: "not-authorized",
  };
  const receipt: RegulatoryImplementationExecutionReceipt = {
    ...payload,
    receiptChecksum: receiptChecksum(payload),
  };
  const receiptErrors = validateRegulatoryImplementationExecutionReceipt(receipt);
  if (receiptErrors.length > 0) {
    return resultBoundary({
      status: "pull-request-failed" as const,
      checks,
      errors: receiptErrors,
    });
  }
  const frozenReceipt = deepFreeze(receipt);
  LIVE_EXECUTION_RECEIPTS.add(frozenReceipt as object);
  return resultBoundary({ status: "success" as const, receipt: frozenReceipt });
}
