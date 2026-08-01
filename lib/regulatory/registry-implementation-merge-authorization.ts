import {
  createHash,
  createHmac,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import { lstat, open, realpath } from "node:fs/promises";
import { isAbsolute, join, resolve } from "node:path";

import {
  isLiveRegulatoryImplementationExecutionReceipt,
  validateRegulatoryImplementationExecutionReceipt,
  type RegulatoryImplementationExecutionReceipt,
} from "./registry-implementation-executor";
import {
  isLiveAuthorizedRegulatoryRegistryImplementationPlan,
  validateRegulatoryRegistryImplementationPlan,
  type RegulatoryRegistryImplementationPlan,
} from "./registry-implementation-plan";
import {
  isLiveRegulatoryImplementationPullRequestBundle,
  validateRegulatoryImplementationPullRequestBundle,
  type RegulatoryImplementationPullRequestBundle,
} from "./registry-implementation-pr-bundle";
import {
  REGULATORY_MERGE_HOSTED_POLICY,
  isLiveRegulatoryImplementationMergeProductionAdapter,
  type RegulatoryImplementationMergeAdapter,
  type RegulatoryMergeHostedSnapshot,
  type RegulatoryMergeMutation,
  type RegulatoryMergeRuntimeIdentity,
} from "./registry-implementation-merge-production-adapter";

const FIVE_MINUTES_MS = 5 * 60 * 1000;
const FIVE_MINUTES_NS = BigInt(FIVE_MINUTES_MS) * BigInt(1_000_000);
const SHA_RE = /^[a-f0-9]{40}$/;
const SHA256_RE = /^sha256:[a-f0-9]{64}$/;
const KEY_ID_RE = /^regulatory-merge-hmac:[a-z0-9][a-z0-9._-]{2,63}$/;
const MAX_CANONICAL_DEPTH = 40;
const MAX_CANONICAL_KEYS = 500;

const CONTROLLED_BOUNDARY = Object.freeze({
  applicationStatus: "not-applied" as const,
  customerFacingStatus: "benchmark-only" as const,
  deploymentStatus: "not-authorized" as const,
});

type ControlledBoundary = typeof CONTROLLED_BOUNDARY;

interface RegulatoryImplementationMergeClock {
  wallNow(): number;
  monotonicNow(): bigint;
}

const SYSTEM_CLOCK: RegulatoryImplementationMergeClock = Object.freeze({
  wallNow: () => Date.now(),
  monotonicNow: () => process.hrtime.bigint(),
});

export interface RegulatoryImplementationMergeAuthorization
  extends ControlledBoundary {
  schemaVersion: 1;
  authorizationId: string;
  planId: string;
  planChecksum: string;
  bundleId: string;
  bundleChecksum: string;
  executionReceiptId: string;
  executionReceiptChecksum: string;
  repositoryFullName: "siricarsen-cmd/subshield";
  pullRequestNumber: number;
  pullRequestUrl: string;
  reviewedBaseSha: string;
  hostedHeadSha: string;
  headBranch: string;
  authenticatedLogin: "siricarsen-cmd";
  mergeMethod: "fast-forward";
  auditKeyId: string;
  authorizedAt: string;
  evidenceFingerprint: string;
  runtimeFingerprint: string;
  configFingerprint: string;
  repositoryFingerprint: string;
  confirmationFingerprint: string;
  authorizationChecksum: string;
}

export interface CreateRegulatoryImplementationMergeAuthorizationRequest {
  expectedGitHubLogin: string;
  authorizedAt: string;
  confirmation: string;
  auditDirectory: string;
  auditKeyId: string;
  auditKey: Uint8Array;
  adapter: RegulatoryImplementationMergeAdapter;
}

export type RegulatoryImplementationMergeAuthorizationResult = Readonly<
  | ({
      status: "authorization-created";
      authorization: Readonly<RegulatoryImplementationMergeAuthorization>;
    } & ControlledBoundary)
  | ({
      status: "authorization-refused";
      errors: readonly string[];
    } & ControlledBoundary)
>;

export interface RegulatoryImplementationMergeReceipt
  extends ControlledBoundary {
  schemaVersion: 1;
  receiptId: string;
  authorizationId: string;
  authorizationChecksum: string;
  planId: string;
  planChecksum: string;
  bundleId: string;
  bundleChecksum: string;
  executionReceiptId: string;
  executionReceiptChecksum: string;
  repositoryFullName: "siricarsen-cmd/subshield";
  authenticatedLogin: "siricarsen-cmd";
  pullRequestNumber: number;
  pullRequestUrl: string;
  baseBranch: "main";
  reviewedBaseSha: string;
  headBranch: string;
  premergeHeadSha: string;
  mergeMethod: "fast-forward";
  mergeRequestedAt: string;
  hostedVerifiedAt: string;
  mergeCommitSha: string;
  postmergeRemoteMainSha: string;
  fileEvidenceFingerprint: string;
  checkEvidenceFingerprint: string;
  reviewEvidenceFingerprint: string;
  status: "merge-completed-registry-not-applied";
  receiptChecksum: string;
}

export type RegulatoryImplementationMergeHostedOutcome = Readonly<
  {
    schemaVersion: 1;
    outcomeId: string;
    authorizationId: string;
    authorizationChecksum: string;
    status:
      | "authorization-refused"
      | "merge-refused-before-consumption"
      | "github-deterministic-refusal"
      | "already-merged-exact"
      | "ambiguous-hosted-mutation"
      | "merge-succeeded";
    code: string;
    mutation: "not-requested" | "refused" | "accepted" | "ambiguous";
    receipt?: Readonly<RegulatoryImplementationMergeReceipt>;
    outcomeChecksum: string;
  } & ControlledBoundary
>;

export interface RegulatoryImplementationMergeAuditRecord
  extends ControlledBoundary {
  schemaVersion: 1;
  auditId: string;
  keyId: string;
  recordedAt: string;
  authorization: Readonly<RegulatoryImplementationMergeAuthorization>;
  outcome: RegulatoryImplementationMergeHostedOutcome;
  auditChecksum: string;
  authentication: {
    algorithm: "HMAC-SHA-256";
    keyId: string;
    mac: string;
  };
}

export type RegulatoryImplementationMergeExecutionResult = Readonly<
  | ({
      status: "authorization-refused";
      errors: readonly string[];
      auditRetention: "not-available";
      resultChecksum: string;
    } & ControlledBoundary)
  | ({
      status: "terminal";
      outcome: RegulatoryImplementationMergeHostedOutcome;
      audit: Readonly<RegulatoryImplementationMergeAuditRecord>;
      auditRetention: "retained" | "failed";
      auditPath?: string;
      resultChecksum: string;
    } & ControlledBoundary)
>;

interface DirectoryIdentity {
  path: string;
  fingerprint: string;
}

interface AuthorizationBinding {
  plan: RegulatoryRegistryImplementationPlan;
  bundle: RegulatoryImplementationPullRequestBundle;
  executionReceipt: RegulatoryImplementationExecutionReceipt;
  adapter: RegulatoryImplementationMergeAdapter;
  snapshot: Readonly<RegulatoryMergeHostedSnapshot>;
  runtimeIdentity: RegulatoryMergeRuntimeIdentity;
  auditKey: Uint8Array;
  auditKeyId: string;
  auditDirectory: DirectoryIdentity;
  createdWallMs: number;
  createdMonotonicNs: bigint;
  clock: RegulatoryImplementationMergeClock;
}

const LIVE_BINDINGS = new WeakMap<object, AuthorizationBinding>();
const IN_FLIGHT_AUTHORIZATIONS = new WeakSet<object>();
const CONSUMED_AUTHORIZATIONS = new WeakSet<object>();
const ZEROED_AUTHORIZATIONS = new WeakSet<object>();

function canonicalJson(
  value: unknown,
  seen = new Set<object>(),
  depth = 0
): string {
  if (depth > MAX_CANONICAL_DEPTH) throw new Error("Noncanonical value");
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("Noncanonical value");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    if (seen.has(value)) throw new Error("Noncanonical value");
    seen.add(value);
    const result = `[${value
      .map((item) => canonicalJson(item, seen, depth + 1))
      .join(",")}]`;
    seen.delete(value);
    return result;
  }
  if (typeof value === "object") {
    if (seen.has(value)) throw new Error("Noncanonical value");
    if (
      Object.getPrototypeOf(value) !== Object.prototype &&
      Object.getPrototypeOf(value) !== null
    ) {
      throw new Error("Noncanonical value");
    }
    const symbols = Object.getOwnPropertySymbols(value);
    if (symbols.length > 0) throw new Error("Noncanonical value");
    const descriptors = Object.getOwnPropertyDescriptors(value);
    const keys = Object.keys(descriptors).sort();
    if (keys.length > MAX_CANONICAL_KEYS) throw new Error("Noncanonical value");
    for (const key of keys) {
      const descriptor = descriptors[key];
      if (
        !descriptor ||
        descriptor.get ||
        descriptor.set ||
        descriptor.enumerable !== true
      ) {
        throw new Error("Noncanonical value");
      }
    }
    seen.add(value);
    const result = `{${keys
      .map(
        (key) =>
          `${JSON.stringify(key)}:${canonicalJson(
            descriptors[key].value,
            seen,
            depth + 1
          )}`
      )
      .join(",")}}`;
    seen.delete(value);
    return result;
  }
  throw new Error("Noncanonical value");
}

function sha256Canonical(value: unknown): string {
  return `sha256:${createHash("sha256")
    .update(canonicalJson(value))
    .digest("hex")}`;
}

function omitKeys(
  value: Record<string, unknown>,
  keys: readonly string[]
): Record<string, unknown> {
  const excluded = new Set(keys);
  return Object.fromEntries(
    Object.entries(value).filter(([key]) => !excluded.has(key))
  );
}

function deepFreeze<T>(value: T, seen = new Set<object>()): Readonly<T> {
  if (value && typeof value === "object" && !seen.has(value)) {
    seen.add(value);
    for (const descriptor of Object.values(
      Object.getOwnPropertyDescriptors(value)
    )) {
      if (descriptor && "value" in descriptor) {
        deepFreeze(descriptor.value, seen);
      }
    }
    Object.freeze(value);
  }
  return value as Readonly<T>;
}

function exactRecord(value: unknown): Record<string, unknown> | null {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    (Object.getPrototypeOf(value) !== Object.prototype &&
      Object.getPrototypeOf(value) !== null)
  ) {
    return null;
  }
  return value as Record<string, unknown>;
}

function hasExactKeys(
  value: Record<string, unknown>,
  expectedKeys: readonly string[]
): boolean {
  return (
    Object.keys(value).sort().join("\0") ===
    [...expectedKeys].sort().join("\0")
  );
}

function parseExactIsoInstant(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value
    ? parsed
    : null;
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort((left, right) =>
    left.localeCompare(right)
  );
}

function stringArrayEquals(
  left: readonly string[],
  right: readonly string[]
): boolean {
  return (
    canonicalJson(uniqueSorted(left)) === canonicalJson(uniqueSorted(right))
  );
}

async function auditDirectoryIdentity(path: string): Promise<DirectoryIdentity> {
  if (!isAbsolute(path) || resolve(path) !== path) {
    throw new Error("Audit directory identity was invalid");
  }
  const [canonical, info] = await Promise.all([realpath(path), lstat(path)]);
  if (
    canonical !== path ||
    !info.isDirectory() ||
    info.isSymbolicLink() ||
    (info.mode & 0o077) !== 0
  ) {
    throw new Error("Audit directory identity was invalid");
  }
  return {
    path,
    fingerprint: sha256Canonical(
      `${canonical}\0${info.dev}\0${info.ino}\0${info.uid}\0${info.gid}\0${info.mode}`
    ),
  };
}

function provenanceErrors(
  plan: RegulatoryRegistryImplementationPlan,
  bundle: RegulatoryImplementationPullRequestBundle,
  receipt: RegulatoryImplementationExecutionReceipt
): string[] {
  const errors: string[] = [];
  if (
    bundle.planId !== plan.planId ||
    bundle.planChecksum !== plan.planChecksum ||
    bundle.baseCommitSha !== plan.baseCommitSha ||
    bundle.targetBranch !== plan.targetBranch
  ) {
    errors.push("bundle-plan-provenance-mismatch");
  }
  if (
    receipt.planId !== plan.planId ||
    receipt.planChecksum !== plan.planChecksum ||
    receipt.bundleId !== bundle.bundleId ||
    receipt.bundleChecksum !== bundle.bundleChecksum ||
    receipt.baseCommitSha !== plan.baseCommitSha ||
    receipt.targetBranch !== plan.targetBranch ||
    receipt.commitSha !== receipt.pullRequest.headCommitSha ||
    receipt.pullRequest.baseBranch !== REGULATORY_MERGE_HOSTED_POLICY.defaultBranch ||
    receipt.pullRequest.headBranch !== plan.targetBranch ||
    receipt.pullRequest.autoMergeEnabled !== false
  ) {
    errors.push("execution-receipt-provenance-mismatch");
  }
  const requiredChecks = bundle.requiredChecks;
  const receiptChecks = receipt.checks.map((check) => check.command);
  if (
    canonicalJson(requiredChecks) !== canonicalJson(plan.requiredChecks) ||
    canonicalJson(receiptChecks) !== canonicalJson(requiredChecks) ||
    receipt.checks.some(
      (check) =>
        check.commitSha !== receipt.commitSha || check.conclusion !== "success"
    )
  ) {
    errors.push("execution-check-provenance-mismatch");
  }
  const planFiles = uniqueSorted(plan.steps.map((step) => step.targetFile));
  const bundleFiles = uniqueSorted(bundle.files.map((file) => file.path));
  const receiptFiles = uniqueSorted(receipt.files.map((file) => file.path));
  if (
    !stringArrayEquals(planFiles, bundleFiles) ||
    !stringArrayEquals(bundleFiles, receiptFiles)
  ) {
    errors.push("file-provenance-mismatch");
  }
  return errors;
}

export function validateRegulatoryMergeHostedSnapshot(
  snapshot: RegulatoryMergeHostedSnapshot,
  plan: RegulatoryRegistryImplementationPlan,
  bundle: RegulatoryImplementationPullRequestBundle,
  receipt: RegulatoryImplementationExecutionReceipt
): string[] {
  const errors = provenanceErrors(plan, bundle, receipt);
  if (
    snapshot.repositoryFullName !== REGULATORY_MERGE_HOSTED_POLICY.repository ||
    snapshot.defaultBranch !== REGULATORY_MERGE_HOSTED_POLICY.defaultBranch
  ) {
    errors.push("repository-drift");
  }
  if (
    snapshot.viewerLogin !== REGULATORY_MERGE_HOSTED_POLICY.operatorLogin ||
    !["ADMIN", "MAINTAIN", "WRITE"].includes(snapshot.viewerPermission)
  ) {
    errors.push("principal-refused");
  }
  if (
    snapshot.number !== receipt.pullRequest.number ||
    snapshot.url !== receipt.pullRequest.url ||
    snapshot.url !==
      `https://github.com/${REGULATORY_MERGE_HOSTED_POLICY.repository}/pull/${snapshot.number}`
  ) {
    errors.push("pull-request-identity-drift");
  }
  if (
    snapshot.state !== "open" ||
    snapshot.draft ||
    snapshot.autoMergeEnabled ||
    snapshot.merged ||
    snapshot.deleteBranchOnMerge !== false ||
    typeof snapshot.repositoryNodeId !== "string" ||
    snapshot.repositoryNodeId.length < 1
  ) {
    errors.push("pull-request-state-refused");
  }
  if (
    snapshot.baseBranch !== REGULATORY_MERGE_HOSTED_POLICY.defaultBranch ||
    snapshot.baseSha !== plan.baseCommitSha ||
    snapshot.remoteMainSha !== plan.baseCommitSha
  ) {
    errors.push("reviewed-base-drift");
  }
  if (
    snapshot.headBranch !== plan.targetBranch ||
    snapshot.headSha !== receipt.commitSha ||
    snapshot.headRefSha !== receipt.commitSha ||
    !SHA_RE.test(snapshot.reviewedHeadTreeSha) ||
    snapshot.mergeCommitParents.length !== 0 ||
    snapshot.mergeCommitTreeSha !== null ||
    canonicalJson(snapshot.headParents) !==
      canonicalJson([plan.baseCommitSha])
  ) {
    errors.push("head-ref-drift");
  }

  const expectedFiles = bundle.files
    .map((file) => ({
      path: file.path,
      baseChecksum: file.beforeChecksum,
      headChecksum: file.afterChecksum,
    }))
    .sort((left, right) => left.path.localeCompare(right.path));
  const hostedFiles = [...snapshot.files].sort((left, right) =>
    left.path.localeCompare(right.path)
  );
  if (canonicalJson(expectedFiles) !== canonicalJson(hostedFiles)) {
    errors.push("file-evidence-drift");
  }
  for (const file of receipt.files) {
    const bundleFile = bundle.files.find((candidate) => candidate.path === file.path);
    if (
      !bundleFile ||
      bundleFile.beforeChecksum !== file.beforeChecksum ||
      bundleFile.afterChecksum !== file.afterChecksum
    ) {
      errors.push("file-receipt-provenance-mismatch");
      break;
    }
  }

  const checksValid =
    snapshot.checks.length === REGULATORY_MERGE_HOSTED_POLICY.workflows.length &&
    REGULATORY_MERGE_HOSTED_POLICY.workflows.every((policy) => {
      const matches = snapshot.checks.filter(
        (check) =>
          check.workflowId === policy.workflowId &&
          check.workflowName === policy.workflowName &&
          check.workflowPath === policy.workflowPath &&
          check.jobName === policy.jobName
      );
      const check = matches[0];
      return (
        matches.length === 1 &&
        check.event === REGULATORY_MERGE_HOSTED_POLICY.workflowEvent &&
        check.headSha === receipt.commitSha &&
        check.status === "completed" &&
        check.conclusion === "success" &&
        check.pullRequestNumber === receipt.pullRequest.number &&
        check.baseRef === REGULATORY_MERGE_HOSTED_POLICY.defaultBranch &&
        check.baseRepository === REGULATORY_MERGE_HOSTED_POLICY.repository &&
        check.headRef === plan.targetBranch &&
        check.headRepository === REGULATORY_MERGE_HOSTED_POLICY.repository &&
        parseExactIsoInstant(check.completedAt) !== null
      );
    });
  if (!checksValid) {
    errors.push("hosted-checks-refused");
  }

  const codex = snapshot.codexEvidence;
  if (
    !codex.clean ||
    codex.login !== REGULATORY_MERGE_HOSTED_POLICY.codexLogin ||
    codex.accountId !== REGULATORY_MERGE_HOSTED_POLICY.codexAccountId ||
    codex.reviewState !== REGULATORY_MERGE_HOSTED_POLICY.codexReviewState ||
    codex.reviewCommit !== receipt.commitSha ||
    codex.reviewedCommit !== receipt.commitSha ||
    parseExactIsoInstant(codex.reviewSubmittedAt) === null ||
    parseExactIsoInstant(codex.attestationCreatedAt) === null ||
    snapshot.unresolvedThreadCount !== 0 ||
    snapshot.paginationComplete !== true
  ) {
    errors.push("security-review-refused");
  }
  if (
    parseExactIsoInstant(codex.attestationCreatedAt)! <
      parseExactIsoInstant(codex.reviewSubmittedAt)! ||
    snapshot.checks.some(
      (check) =>
        parseExactIsoInstant(codex.attestationCreatedAt)! <
        parseExactIsoInstant(check.completedAt)!
    )
  ) {
    errors.push("security-review-stale");
  }

  if (!SHA256_RE.test(snapshot.runtimeFingerprint)) {
    errors.push("runtime-fingerprint-invalid");
  }
  if (!SHA256_RE.test(snapshot.configFingerprint)) {
    errors.push("config-fingerprint-invalid");
  }
  if (!SHA256_RE.test(snapshot.repositoryFingerprint)) {
    errors.push("repository-fingerprint-invalid");
  }
  return uniqueSorted(errors);
}

export function buildRegulatoryImplementationMergeConfirmation(
  plan: RegulatoryRegistryImplementationPlan,
  bundle: RegulatoryImplementationPullRequestBundle,
  receipt: RegulatoryImplementationExecutionReceipt,
  snapshot: RegulatoryMergeHostedSnapshot,
  auditKeyId: string
): string {
  return [
    "AUTHORIZE SUBSHIELD REGULATORY IMPLEMENTATION PR MERGE",
    `plan=${plan.planChecksum}`,
    `bundle=${bundle.bundleChecksum}`,
    `receipt=${receipt.receiptChecksum}`,
    `pr=${receipt.pullRequest.number}`,
    `url=${receipt.pullRequest.url}`,
    `base=${plan.baseCommitSha}`,
    `head=${receipt.commitSha}`,
    `branch=${plan.targetBranch}`,
    `login=${REGULATORY_MERGE_HOSTED_POLICY.operatorLogin}`,
    `method=${REGULATORY_MERGE_HOSTED_POLICY.mergeMethod}`,
    `audit-key=${auditKeyId}`,
    `evidence=${sha256Canonical(snapshot)}`,
    `runtime=${snapshot.runtimeFingerprint}`,
    `config=${snapshot.configFingerprint}`,
    `repository=${snapshot.repositoryFingerprint}`,
  ].join(" ");
}

export function validateRegulatoryImplementationMergeAuthorization(
  value: unknown
): string[] {
  try {
    const record = exactRecord(value);
    if (!record) return ["authorization-not-object"];
    const expectedKeys = [
      "schemaVersion",
      "authorizationId",
      "planId",
      "planChecksum",
      "bundleId",
      "bundleChecksum",
      "executionReceiptId",
      "executionReceiptChecksum",
      "repositoryFullName",
      "pullRequestNumber",
      "pullRequestUrl",
      "reviewedBaseSha",
      "hostedHeadSha",
      "headBranch",
      "authenticatedLogin",
      "mergeMethod",
      "auditKeyId",
      "authorizedAt",
      "evidenceFingerprint",
      "runtimeFingerprint",
      "configFingerprint",
      "repositoryFingerprint",
      "confirmationFingerprint",
      "authorizationChecksum",
      "applicationStatus",
      "customerFacingStatus",
      "deploymentStatus",
    ];
    const errors: string[] = [];
    if (!hasExactKeys(record, expectedKeys)) {
      errors.push("authorization-shape-invalid");
    }
    if (
      record.schemaVersion !== 1 ||
      record.repositoryFullName !== REGULATORY_MERGE_HOSTED_POLICY.repository ||
      record.authenticatedLogin !== REGULATORY_MERGE_HOSTED_POLICY.operatorLogin ||
      record.mergeMethod !== REGULATORY_MERGE_HOSTED_POLICY.mergeMethod ||
      !KEY_ID_RE.test(String(record.auditKeyId)) ||
      parseExactIsoInstant(record.authorizedAt) === null ||
      record.applicationStatus !== CONTROLLED_BOUNDARY.applicationStatus ||
      record.customerFacingStatus !== CONTROLLED_BOUNDARY.customerFacingStatus ||
      record.deploymentStatus !== CONTROLLED_BOUNDARY.deploymentStatus
    ) {
      errors.push("authorization-policy-invalid");
    }
    if (
      typeof record.authorizationId !== "string" ||
      !record.authorizationId.startsWith("regulatory-implementation-merge:") ||
      typeof record.planId !== "string" ||
      !record.planId.startsWith("regulatory-registry-implementation:") ||
      typeof record.bundleId !== "string" ||
      !record.bundleId.startsWith("regulatory-implementation-pr:") ||
      typeof record.executionReceiptId !== "string" ||
      !record.executionReceiptId.startsWith("regulatory-implementation-execution:") ||
      !Number.isSafeInteger(record.pullRequestNumber) ||
      Number(record.pullRequestNumber) < 1 ||
      record.pullRequestUrl !==
        `https://github.com/${REGULATORY_MERGE_HOSTED_POLICY.repository}/pull/${record.pullRequestNumber}` ||
      typeof record.headBranch !== "string" ||
      record.headBranch.length === 0 ||
      !SHA_RE.test(String(record.reviewedBaseSha)) ||
      !SHA_RE.test(String(record.hostedHeadSha))
    ) {
      errors.push("authorization-identity-invalid");
    }
    for (const key of [
      "planChecksum",
      "bundleChecksum",
      "executionReceiptChecksum",
      "evidenceFingerprint",
      "runtimeFingerprint",
      "configFingerprint",
      "repositoryFingerprint",
      "confirmationFingerprint",
      "authorizationChecksum",
    ]) {
      if (!SHA256_RE.test(String(record[key]))) {
        errors.push("authorization-provenance-invalid");
        break;
      }
    }
    if (
      record.authorizationChecksum !==
      sha256Canonical(omitKeys(record, ["authorizationChecksum"]))
    ) {
      errors.push("authorization-checksum-invalid");
    }
    return uniqueSorted(errors);
  } catch {
    return ["authorization-noncanonical"];
  }
}

export function isLiveRegulatoryImplementationMergeAuthorization(
  value: unknown
): value is RegulatoryImplementationMergeAuthorization {
  return Boolean(
    value &&
      typeof value === "object" &&
      LIVE_BINDINGS.has(value as object) &&
      !IN_FLIGHT_AUTHORIZATIONS.has(value as object) &&
      !CONSUMED_AUTHORIZATIONS.has(value as object) &&
      validateRegulatoryImplementationMergeAuthorization(value).length === 0
  );
}

function refusalResult(errors: readonly string[]): RegulatoryImplementationMergeAuthorizationResult {
  return deepFreeze({
    status: "authorization-refused" as const,
    errors: uniqueSorted(errors),
    ...CONTROLLED_BOUNDARY,
  });
}

export async function createRegulatoryImplementationMergeAuthorization(
  plan: RegulatoryRegistryImplementationPlan,
  bundle: RegulatoryImplementationPullRequestBundle,
  executionReceipt: RegulatoryImplementationExecutionReceipt,
  request: CreateRegulatoryImplementationMergeAuthorizationRequest
): Promise<RegulatoryImplementationMergeAuthorizationResult> {
  const copiedKey = Uint8Array.from(request.auditKey);
  let keyTransferredToBinding = false;
  try {
    if (
      !isLiveAuthorizedRegulatoryRegistryImplementationPlan(plan) ||
      !isLiveRegulatoryImplementationPullRequestBundle(bundle) ||
      !isLiveRegulatoryImplementationExecutionReceipt(executionReceipt)
    ) {
      return refusalResult(["original-live-evidence-required"]);
    }
    if (!isLiveRegulatoryImplementationMergeProductionAdapter(request.adapter)) {
      return refusalResult(["original-production-adapter-required"]);
    }
    const validationErrors = [
      ...validateRegulatoryRegistryImplementationPlan(plan),
      ...validateRegulatoryImplementationPullRequestBundle(bundle, plan),
      ...validateRegulatoryImplementationExecutionReceipt(executionReceipt),
      ...provenanceErrors(plan, bundle, executionReceipt),
    ];
    if (validationErrors.length > 0) {
      return refusalResult(["live-evidence-invalid"]);
    }
    if (
      request.expectedGitHubLogin !==
        REGULATORY_MERGE_HOSTED_POLICY.operatorLogin ||
      !KEY_ID_RE.test(request.auditKeyId) ||
      copiedKey.length < 32
    ) {
      return refusalResult(["authorization-policy-invalid"]);
    }
    const clock = SYSTEM_CLOCK;
    const wallNow = clock.wallNow();
    const authorizedAtMs = parseExactIsoInstant(request.authorizedAt);
    if (
      authorizedAtMs === null ||
      authorizedAtMs < wallNow - FIVE_MINUTES_MS ||
      authorizedAtMs > wallNow + FIVE_MINUTES_MS
    ) {
      return refusalResult(["authorization-time-invalid"]);
    }
    const auditDirectory = await auditDirectoryIdentity(request.auditDirectory);
    const runtimeIdentity = await request.adapter.authenticate();
    const snapshot = await request.adapter.inspectExactPullRequest(
      executionReceipt.pullRequest.number
    );
    if (
      runtimeIdentity.login !==
        REGULATORY_MERGE_HOSTED_POLICY.operatorLogin ||
      runtimeIdentity.permission !== snapshot.viewerPermission ||
      runtimeIdentity.runtimeFingerprint !== snapshot.runtimeFingerprint ||
      runtimeIdentity.configFingerprint !== snapshot.configFingerprint ||
      runtimeIdentity.repositoryFingerprint !== snapshot.repositoryFingerprint
    ) {
      return refusalResult(["authenticated-runtime-mismatch"]);
    }
    const hostedErrors = validateRegulatoryMergeHostedSnapshot(
      snapshot,
      plan,
      bundle,
      executionReceipt
    );
    if (hostedErrors.length > 0) {
      return refusalResult(["hosted-evidence-refused"]);
    }
    const expectedConfirmation = buildRegulatoryImplementationMergeConfirmation(
      plan,
      bundle,
      executionReceipt,
      snapshot,
      request.auditKeyId
    );
    if (request.confirmation !== expectedConfirmation) {
      return refusalResult(["exact-confirmation-required"]);
    }
    const payload = {
      schemaVersion: 1 as const,
      authorizationId: `regulatory-implementation-merge:${randomUUID()}`,
      planId: plan.planId,
      planChecksum: plan.planChecksum,
      bundleId: bundle.bundleId,
      bundleChecksum: bundle.bundleChecksum,
      executionReceiptId: executionReceipt.receiptId,
      executionReceiptChecksum: executionReceipt.receiptChecksum,
      repositoryFullName: REGULATORY_MERGE_HOSTED_POLICY.repository,
      pullRequestNumber: executionReceipt.pullRequest.number,
      pullRequestUrl: executionReceipt.pullRequest.url,
      reviewedBaseSha: plan.baseCommitSha,
      hostedHeadSha: executionReceipt.commitSha,
      headBranch: plan.targetBranch,
      authenticatedLogin: REGULATORY_MERGE_HOSTED_POLICY.operatorLogin,
      mergeMethod: REGULATORY_MERGE_HOSTED_POLICY.mergeMethod,
      auditKeyId: request.auditKeyId,
      authorizedAt: request.authorizedAt,
      evidenceFingerprint: sha256Canonical(snapshot),
      runtimeFingerprint: snapshot.runtimeFingerprint,
      configFingerprint: snapshot.configFingerprint,
      repositoryFingerprint: snapshot.repositoryFingerprint,
      confirmationFingerprint: sha256Canonical(expectedConfirmation),
      ...CONTROLLED_BOUNDARY,
    };
    const authorization = deepFreeze({
      ...payload,
      authorizationChecksum: sha256Canonical(payload),
    }) as Readonly<RegulatoryImplementationMergeAuthorization>;
    LIVE_BINDINGS.set(authorization, {
      plan,
      bundle,
      executionReceipt,
      adapter: request.adapter,
      snapshot,
      runtimeIdentity,
      auditKey: copiedKey,
      auditKeyId: request.auditKeyId,
      auditDirectory,
      createdWallMs: wallNow,
      createdMonotonicNs: clock.monotonicNow(),
      clock,
    });
    keyTransferredToBinding = true;
    return deepFreeze({
      status: "authorization-created" as const,
      authorization,
      ...CONTROLLED_BOUNDARY,
    });
  } catch {
    return refusalResult(["authorization-construction-failed"]);
  } finally {
    if (!keyTransferredToBinding) copiedKey.fill(0);
  }
}

function buildHostedOutcome(
  authorization: RegulatoryImplementationMergeAuthorization,
  status: RegulatoryImplementationMergeHostedOutcome["status"],
  code: string,
  mutation: RegulatoryImplementationMergeHostedOutcome["mutation"],
  receipt?: RegulatoryImplementationMergeReceipt
): RegulatoryImplementationMergeHostedOutcome {
  const payload = {
    schemaVersion: 1 as const,
    outcomeId: `regulatory-implementation-merge-outcome:${randomUUID()}`,
    authorizationId: authorization.authorizationId,
    authorizationChecksum: authorization.authorizationChecksum,
    status,
    code,
    mutation,
    ...(receipt ? { receipt } : {}),
    ...CONTROLLED_BOUNDARY,
  };
  return deepFreeze({
    ...payload,
    outcomeChecksum: sha256Canonical(payload),
  }) as RegulatoryImplementationMergeHostedOutcome;
}

function receiptPayload(
  value: RegulatoryImplementationMergeReceipt
): Record<string, unknown> {
  return omitKeys(value as unknown as Record<string, unknown>, ["receiptChecksum"]);
}

export function validateRegulatoryImplementationMergeReceipt(
  value: unknown
): string[] {
  try {
    const record = exactRecord(value);
    if (!record) return ["receipt-not-object"];
    const expectedKeys = [
      "schemaVersion",
      "receiptId",
      "authorizationId",
      "authorizationChecksum",
      "planId",
      "planChecksum",
      "bundleId",
      "bundleChecksum",
      "executionReceiptId",
      "executionReceiptChecksum",
      "repositoryFullName",
      "authenticatedLogin",
      "pullRequestNumber",
      "pullRequestUrl",
      "baseBranch",
      "reviewedBaseSha",
      "headBranch",
      "premergeHeadSha",
      "mergeMethod",
      "mergeRequestedAt",
      "hostedVerifiedAt",
      "mergeCommitSha",
      "postmergeRemoteMainSha",
      "fileEvidenceFingerprint",
      "checkEvidenceFingerprint",
      "reviewEvidenceFingerprint",
      "status",
      "receiptChecksum",
      "applicationStatus",
      "customerFacingStatus",
      "deploymentStatus",
    ];
    const errors: string[] = [];
    if (!hasExactKeys(record, expectedKeys)) errors.push("receipt-shape-invalid");
    if (
      record.schemaVersion !== 1 ||
      record.repositoryFullName !== REGULATORY_MERGE_HOSTED_POLICY.repository ||
      record.authenticatedLogin !== REGULATORY_MERGE_HOSTED_POLICY.operatorLogin ||
      record.baseBranch !== REGULATORY_MERGE_HOSTED_POLICY.defaultBranch ||
      record.mergeMethod !== REGULATORY_MERGE_HOSTED_POLICY.mergeMethod ||
      record.status !== "merge-completed-registry-not-applied" ||
      record.applicationStatus !== CONTROLLED_BOUNDARY.applicationStatus ||
      record.customerFacingStatus !== CONTROLLED_BOUNDARY.customerFacingStatus ||
      record.deploymentStatus !== CONTROLLED_BOUNDARY.deploymentStatus
    ) {
      errors.push("receipt-policy-invalid");
    }
    if (
      typeof record.receiptId !== "string" ||
      !record.receiptId.startsWith("regulatory-implementation-merge-receipt:") ||
      typeof record.authorizationId !== "string" ||
      !record.authorizationId.startsWith("regulatory-implementation-merge:") ||
      typeof record.planId !== "string" ||
      !record.planId.startsWith("regulatory-registry-implementation:") ||
      typeof record.bundleId !== "string" ||
      !record.bundleId.startsWith("regulatory-implementation-pr:") ||
      typeof record.executionReceiptId !== "string" ||
      !record.executionReceiptId.startsWith("regulatory-implementation-execution:") ||
      !Number.isSafeInteger(record.pullRequestNumber) ||
      Number(record.pullRequestNumber) < 1 ||
      record.pullRequestUrl !==
        `https://github.com/${REGULATORY_MERGE_HOSTED_POLICY.repository}/pull/${record.pullRequestNumber}` ||
      typeof record.headBranch !== "string" || !record.headBranch ||
      !SHA_RE.test(String(record.reviewedBaseSha)) ||
      !SHA_RE.test(String(record.premergeHeadSha)) ||
      !SHA_RE.test(String(record.mergeCommitSha)) ||
      record.mergeCommitSha !== record.premergeHeadSha ||
      record.postmergeRemoteMainSha !== record.mergeCommitSha ||
      parseExactIsoInstant(record.mergeRequestedAt) === null ||
      parseExactIsoInstant(record.hostedVerifiedAt) === null
    ) {
      errors.push("receipt-hosted-identity-invalid");
    }
    for (const key of [
      "authorizationChecksum",
      "planChecksum",
      "bundleChecksum",
      "executionReceiptChecksum",
      "fileEvidenceFingerprint",
      "checkEvidenceFingerprint",
      "reviewEvidenceFingerprint",
      "receiptChecksum",
    ]) {
      if (!SHA256_RE.test(String(record[key]))) {
        errors.push("receipt-provenance-invalid");
        break;
      }
    }
    if (
      record.receiptChecksum !==
      sha256Canonical(omitKeys(record, ["receiptChecksum"]))
    ) {
      errors.push("receipt-checksum-invalid");
    }
    return uniqueSorted(errors);
  } catch {
    return ["receipt-noncanonical"];
  }
}

function validateHostedOutcome(value: unknown): string[] {
  try {
    const record = exactRecord(value);
    if (!record) return ["outcome-not-object"];
    const baseKeys = [
      "schemaVersion",
      "outcomeId",
      "authorizationId",
      "authorizationChecksum",
      "status",
      "code",
      "mutation",
      "outcomeChecksum",
      "applicationStatus",
      "customerFacingStatus",
      "deploymentStatus",
    ];
    const status = String(record.status);
    const successful = status === "merge-succeeded" || status === "already-merged-exact";
    if (!hasExactKeys(record, successful ? [...baseKeys, "receipt"] : baseKeys)) {
      return ["outcome-shape-invalid"];
    }
    const errors: string[] = [];
    if (
      record.schemaVersion !== 1 ||
      typeof record.code !== "string" ||
      !record.code ||
      record.applicationStatus !== CONTROLLED_BOUNDARY.applicationStatus ||
      record.customerFacingStatus !== CONTROLLED_BOUNDARY.customerFacingStatus ||
      record.deploymentStatus !== CONTROLLED_BOUNDARY.deploymentStatus
    ) {
      errors.push("outcome-policy-invalid");
    }
    const supportedStatuses = new Set([
      "authorization-refused",
      "merge-refused-before-consumption",
      "github-deterministic-refusal",
      "already-merged-exact",
      "ambiguous-hosted-mutation",
      "merge-succeeded",
    ]);
    const mutation = String(record.mutation);
    const supportedMutations = new Set(["not-requested", "refused", "accepted", "ambiguous"]);
    const relationshipValid =
      ((status === "authorization-refused" || status === "merge-refused-before-consumption") && mutation === "not-requested") ||
      (status === "github-deterministic-refusal" && mutation === "refused") ||
      (status === "already-merged-exact" && mutation === "refused") ||
      (status === "ambiguous-hosted-mutation" && (mutation === "accepted" || mutation === "ambiguous" || mutation === "refused")) ||
      (status === "merge-succeeded" && (mutation === "accepted" || mutation === "ambiguous"));
    if (
      !supportedStatuses.has(status) ||
      !supportedMutations.has(mutation) ||
      !relationshipValid ||
      typeof record.outcomeId !== "string" ||
      !record.outcomeId.startsWith("regulatory-implementation-merge-outcome:") ||
      typeof record.authorizationId !== "string" ||
      !record.authorizationId.startsWith("regulatory-implementation-merge:") ||
      !SHA256_RE.test(String(record.authorizationChecksum))
    ) {
      errors.push("outcome-identity-invalid");
    }
    const hasReceipt = record.receipt !== undefined;
    if ((status === "merge-succeeded" || status === "already-merged-exact") !== hasReceipt) {
      errors.push("outcome-receipt-relationship-invalid");
    }
    if (hasReceipt) {
      errors.push(...validateRegulatoryImplementationMergeReceipt(record.receipt));
      const receipt = exactRecord(record.receipt);
      if (
        !receipt ||
        receipt.authorizationId !== record.authorizationId ||
        receipt.authorizationChecksum !== record.authorizationChecksum
      ) {
        errors.push("outcome-receipt-relationship-invalid");
      }
    }
    if (
      record.outcomeChecksum !==
      sha256Canonical(omitKeys(record, ["outcomeChecksum"]))
    ) {
      errors.push("outcome-checksum-invalid");
    }
    return uniqueSorted(errors);
  } catch {
    return ["outcome-noncanonical"];
  }
}

function buildAuditRecord(
  authorization: RegulatoryImplementationMergeAuthorization,
  outcome: RegulatoryImplementationMergeHostedOutcome,
  keyId: string,
  key: Uint8Array,
  recordedAt: string
): Readonly<RegulatoryImplementationMergeAuditRecord> {
  const payload = {
    schemaVersion: 1 as const,
    auditId: `regulatory-implementation-merge-audit:${randomUUID()}`,
    keyId,
    recordedAt,
    authorization,
    outcome,
    ...CONTROLLED_BOUNDARY,
  };
  const auditChecksum = sha256Canonical(payload);
  const authenticatedPayload = { ...payload, auditChecksum };
  const authentication = {
    algorithm: "HMAC-SHA-256" as const,
    keyId,
    mac: createHmac("sha256", key)
      .update(canonicalJson(authenticatedPayload))
      .digest("hex"),
  };
  return deepFreeze({
    ...authenticatedPayload,
    authentication,
  }) as Readonly<RegulatoryImplementationMergeAuditRecord>;
}

export function validateRegulatoryImplementationMergeAuditRecord(
  value: unknown,
  key?: Uint8Array
): string[] {
  try {
    const record = exactRecord(value);
    if (!record) return ["audit-not-object"];
    const expectedKeys = [
      "schemaVersion",
      "auditId",
      "keyId",
      "recordedAt",
      "authorization",
      "outcome",
      "auditChecksum",
      "authentication",
      "applicationStatus",
      "customerFacingStatus",
      "deploymentStatus",
    ];
    if (!hasExactKeys(record, expectedKeys)) return ["audit-shape-invalid"];
    const authentication = exactRecord(record.authentication);
    if (!authentication) return ["audit-authentication-shape-invalid"];
    if (!hasExactKeys(authentication, ["algorithm", "keyId", "mac"])) {
      return ["audit-authentication-shape-invalid"];
    }
    const errors: string[] = [];
    errors.push(...validateRegulatoryImplementationMergeAuthorization(record.authorization));
    errors.push(...validateHostedOutcome(record.outcome));
    const authorization = exactRecord(record.authorization);
    const outcome = exactRecord(record.outcome);
    const outcomeReceipt = outcome ? exactRecord(outcome.receipt) : null;
    if (
      !authorization ||
      !outcome ||
      outcome.authorizationId !== authorization.authorizationId ||
      outcome.authorizationChecksum !== authorization.authorizationChecksum ||
      record.keyId !== authorization.auditKeyId ||
      authentication.keyId !== authorization.auditKeyId
    ) {
      errors.push("audit-relationship-invalid");
    }
    if (
      outcomeReceipt &&
      authorization &&
      (outcomeReceipt.authorizationId !== authorization.authorizationId ||
        outcomeReceipt.authorizationChecksum !== authorization.authorizationChecksum ||
        outcomeReceipt.planId !== authorization.planId ||
        outcomeReceipt.planChecksum !== authorization.planChecksum ||
        outcomeReceipt.bundleId !== authorization.bundleId ||
        outcomeReceipt.bundleChecksum !== authorization.bundleChecksum ||
        outcomeReceipt.executionReceiptId !== authorization.executionReceiptId ||
        outcomeReceipt.executionReceiptChecksum !==
          authorization.executionReceiptChecksum ||
        outcomeReceipt.pullRequestNumber !== authorization.pullRequestNumber ||
        outcomeReceipt.pullRequestUrl !== authorization.pullRequestUrl ||
        outcomeReceipt.reviewedBaseSha !== authorization.reviewedBaseSha ||
        outcomeReceipt.headBranch !== authorization.headBranch ||
        outcomeReceipt.premergeHeadSha !== authorization.hostedHeadSha)
    ) {
      errors.push("audit-receipt-relationship-invalid");
    }
    if (
      record.schemaVersion !== 1 ||
      typeof record.auditId !== "string" ||
      !record.auditId.startsWith("regulatory-implementation-merge-audit:") ||
      record.auditId.length <= "regulatory-implementation-merge-audit:".length ||
      !KEY_ID_RE.test(String(record.keyId)) ||
      parseExactIsoInstant(record.recordedAt) === null ||
      authentication.algorithm !== "HMAC-SHA-256" ||
      authentication.keyId !== record.keyId ||
      !/^[a-f0-9]{64}$/.test(String(authentication.mac)) ||
      record.applicationStatus !== CONTROLLED_BOUNDARY.applicationStatus ||
      record.customerFacingStatus !== CONTROLLED_BOUNDARY.customerFacingStatus ||
      record.deploymentStatus !== CONTROLLED_BOUNDARY.deploymentStatus
    ) {
      errors.push("audit-policy-invalid");
    }
    if (
      record.auditChecksum !==
      sha256Canonical(omitKeys(record, ["auditChecksum", "authentication"]))
    ) {
      errors.push("audit-checksum-invalid");
    }
    if (key) {
      const expectedMac = createHmac("sha256", key)
        .update(canonicalJson(omitKeys(record, ["authentication"])))
        .digest();
      const actualMac = Buffer.from(String(authentication.mac), "hex");
      if (
        actualMac.length !== expectedMac.length ||
        !timingSafeEqual(actualMac, expectedMac)
      ) {
        errors.push("audit-hmac-invalid");
      }
    }
    return uniqueSorted(errors);
  } catch {
    return ["audit-noncanonical"];
  }
}

async function retainAuditRecord(
  binding: AuthorizationBinding,
  auditRecord: RegulatoryImplementationMergeAuditRecord
): Promise<string> {
  const current = await auditDirectoryIdentity(binding.auditDirectory.path);
  if (current.fingerprint !== binding.auditDirectory.fingerprint) {
    throw new Error("Audit directory identity changed");
  }
  const filename = `${auditRecord.auditId.replaceAll(":", "-")}.json`;
  if (!/^regulatory-implementation-merge-audit-[a-f0-9-]+\.json$/.test(filename)) {
    throw new Error("Audit filename was invalid");
  }
  const target = join(current.path, filename);
  const file = await open(target, "wx", 0o600);
  try {
    await file.writeFile(`${JSON.stringify(auditRecord)}\n`, {
      encoding: "utf8",
    });
    await file.sync();
  } finally {
    await file.close();
  }
  const directory = await open(current.path, "r");
  try {
    await directory.sync();
  } finally {
    await directory.close();
  }
  return target;
}

function invalidExecutionResult(
  errors: readonly string[]
): RegulatoryImplementationMergeExecutionResult {
  const payload = {
    status: "authorization-refused" as const,
    errors: uniqueSorted(errors),
    auditRetention: "not-available" as const,
    ...CONTROLLED_BOUNDARY,
  };
  return deepFreeze({
    ...payload,
    resultChecksum: sha256Canonical(payload),
  });
}

async function terminalResult(
  authorization: RegulatoryImplementationMergeAuthorization,
  binding: AuthorizationBinding,
  outcome: RegulatoryImplementationMergeHostedOutcome
): Promise<RegulatoryImplementationMergeExecutionResult> {
  const recordedAt = new Date(binding.clock.wallNow()).toISOString();
  const audit = buildAuditRecord(
    authorization,
    outcome,
    binding.auditKeyId,
    binding.auditKey,
    recordedAt
  );
  let auditPath: string | undefined;
  try {
    auditPath = await retainAuditRecord(binding, audit);
  } catch {
    auditPath = undefined;
  }
  const payload = {
    status: "terminal" as const,
    outcome,
    audit,
    auditRetention: auditPath ? ("retained" as const) : ("failed" as const),
    ...(auditPath ? { auditPath } : {}),
    ...CONTROLLED_BOUNDARY,
  };
  return deepFreeze({
    ...payload,
    resultChecksum: sha256Canonical(payload),
  });
}

function authorizationFreshnessError(
  authorization: RegulatoryImplementationMergeAuthorization,
  binding: AuthorizationBinding
): string | null {
  const wallNow = binding.clock.wallNow();
  const monotonicNow = binding.clock.monotonicNow();
  const elapsedNs = monotonicNow - binding.createdMonotonicNs;
  if (elapsedNs < BigInt(0)) return "monotonic-clock-moved-backward";
  if (elapsedNs > FIVE_MINUTES_NS) return "authorization-expired";
  if (wallNow < binding.createdWallMs) return "wall-clock-moved-backward";
  const authorizedAt = parseExactIsoInstant(authorization.authorizedAt);
  if (
    authorizedAt === null ||
    wallNow - authorizedAt > FIVE_MINUTES_MS ||
    authorizedAt - binding.createdWallMs > FIVE_MINUTES_MS
  ) {
    return "authorization-expired";
  }
  return null;
}

function exactPostmergeState(
  snapshot: Readonly<RegulatoryMergeHostedSnapshot>,
  authorization: RegulatoryImplementationMergeAuthorization
): snapshot is Readonly<RegulatoryMergeHostedSnapshot> & { mergeCommitSha: string } {
  return Boolean(
    snapshot.merged &&
      snapshot.state === "closed" &&
      snapshot.number === authorization.pullRequestNumber &&
      snapshot.url === authorization.pullRequestUrl &&
      snapshot.baseBranch === REGULATORY_MERGE_HOSTED_POLICY.defaultBranch &&
      snapshot.headBranch === authorization.headBranch &&
      snapshot.headSha === authorization.hostedHeadSha &&
      snapshot.headRefSha === authorization.hostedHeadSha &&
      SHA_RE.test(snapshot.mergeCommitSha ?? "") &&
      snapshot.mergeCommitSha === authorization.hostedHeadSha &&
      snapshot.remoteMainSha === snapshot.mergeCommitSha &&
      snapshot.mergeCommitParents.length === 1 &&
      snapshot.mergeCommitParents[0] === authorization.reviewedBaseSha &&
      SHA_RE.test(snapshot.reviewedHeadTreeSha) &&
      snapshot.mergeCommitTreeSha === snapshot.reviewedHeadTreeSha
  );
}

function buildMergeReceipt(
  authorization: RegulatoryImplementationMergeAuthorization,
  binding: AuthorizationBinding,
  postmergeSnapshot: Readonly<RegulatoryMergeHostedSnapshot> & { mergeCommitSha: string },
  mergeRequestedAt: string,
  hostedVerifiedAt: string
): Readonly<RegulatoryImplementationMergeReceipt> {
  const payload = {
    schemaVersion: 1 as const,
    receiptId: `regulatory-implementation-merge-receipt:${randomUUID()}`,
    authorizationId: authorization.authorizationId,
    authorizationChecksum: authorization.authorizationChecksum,
    planId: binding.plan.planId,
    planChecksum: binding.plan.planChecksum,
    bundleId: binding.bundle.bundleId,
    bundleChecksum: binding.bundle.bundleChecksum,
    executionReceiptId: binding.executionReceipt.receiptId,
    executionReceiptChecksum: binding.executionReceipt.receiptChecksum,
    repositoryFullName: REGULATORY_MERGE_HOSTED_POLICY.repository,
    authenticatedLogin: REGULATORY_MERGE_HOSTED_POLICY.operatorLogin,
    pullRequestNumber: authorization.pullRequestNumber,
    pullRequestUrl: authorization.pullRequestUrl,
    baseBranch: REGULATORY_MERGE_HOSTED_POLICY.defaultBranch,
    reviewedBaseSha: authorization.reviewedBaseSha,
    headBranch: authorization.headBranch,
    premergeHeadSha: authorization.hostedHeadSha,
    mergeMethod: REGULATORY_MERGE_HOSTED_POLICY.mergeMethod,
    mergeRequestedAt,
    hostedVerifiedAt,
    mergeCommitSha: postmergeSnapshot.mergeCommitSha,
    postmergeRemoteMainSha: postmergeSnapshot.remoteMainSha,
    fileEvidenceFingerprint: sha256Canonical(binding.snapshot.files),
    checkEvidenceFingerprint: sha256Canonical(binding.snapshot.checks),
    reviewEvidenceFingerprint: sha256Canonical({
      codexEvidence: binding.snapshot.codexEvidence,
      unresolvedThreadCount: binding.snapshot.unresolvedThreadCount,
    }),
    status: "merge-completed-registry-not-applied" as const,
    ...CONTROLLED_BOUNDARY,
  };
  return deepFreeze({
    ...payload,
    receiptChecksum: sha256Canonical(payload),
  }) as Readonly<RegulatoryImplementationMergeReceipt>;
}

export async function executeRegulatoryImplementationMerge(
  plan: RegulatoryRegistryImplementationPlan,
  bundle: RegulatoryImplementationPullRequestBundle,
  executionReceipt: RegulatoryImplementationExecutionReceipt,
  authorization: RegulatoryImplementationMergeAuthorization
): Promise<RegulatoryImplementationMergeExecutionResult> {
  if (!isLiveRegulatoryImplementationMergeAuthorization(authorization)) {
    return invalidExecutionResult(["unused-original-live-authorization-required"]);
  }
  const binding = LIVE_BINDINGS.get(authorization);
  if (!binding) {
    return invalidExecutionResult(["unused-original-live-authorization-required"]);
  }

  // Claim synchronously before the first await so concurrent callers cannot
  // share one authorization or its copied audit key.
  IN_FLIGHT_AUTHORIZATIONS.add(authorization);

  let outcome: RegulatoryImplementationMergeHostedOutcome;
  try {
    if (
      binding.plan !== plan ||
      binding.bundle !== bundle ||
      binding.executionReceipt !== executionReceipt
    ) {
      outcome = buildHostedOutcome(
        authorization,
        "authorization-refused",
        "live-object-mismatch",
        "not-requested"
      );
      return await terminalResult(authorization, binding, outcome);
    }

    const freshnessError = authorizationFreshnessError(authorization, binding);
    if (freshnessError) {
      outcome = buildHostedOutcome(
        authorization,
        "authorization-refused",
        freshnessError,
        "not-requested"
      );
      return await terminalResult(authorization, binding, outcome);
    }

    let freshIdentity: RegulatoryMergeRuntimeIdentity;
    let freshSnapshot: Readonly<RegulatoryMergeHostedSnapshot>;
    try {
      freshSnapshot = await binding.adapter.inspectExactPullRequest(
        authorization.pullRequestNumber
      );
      // Authenticate after the complete hosted inspection so the final
      // freshness check follows the last protected-path/authentication await.
      freshIdentity = await binding.adapter.authenticate();
    } catch {
      outcome = buildHostedOutcome(
        authorization,
        "merge-refused-before-consumption",
        "premerge-inspection-failed",
        "not-requested"
      );
      return await terminalResult(authorization, binding, outcome);
    }

    const identityMatches =
      freshIdentity.login === authorization.authenticatedLogin &&
      freshIdentity.permission === binding.runtimeIdentity.permission &&
      freshIdentity.runtimeFingerprint === authorization.runtimeFingerprint &&
      freshIdentity.configFingerprint === authorization.configFingerprint &&
      freshIdentity.repositoryFingerprint === authorization.repositoryFingerprint;
    const snapshotMatches =
      sha256Canonical(freshSnapshot) === authorization.evidenceFingerprint &&
      validateRegulatoryMergeHostedSnapshot(
        freshSnapshot,
        plan,
        bundle,
        executionReceipt
      ).length === 0;
    if (!identityMatches || !snapshotMatches) {
      outcome = buildHostedOutcome(
        authorization,
        "merge-refused-before-consumption",
        "premerge-evidence-drift",
        "not-requested"
      );
      return await terminalResult(authorization, binding, outcome);
    }

    const immediateFreshnessError = authorizationFreshnessError(
      authorization,
      binding
    );
    if (immediateFreshnessError) {
      outcome = buildHostedOutcome(
        authorization,
        "merge-refused-before-consumption",
        immediateFreshnessError,
        "not-requested"
      );
      return await terminalResult(authorization, binding, outcome);
    }

    // Consumption is intentionally before the only hosted mutation.
    CONSUMED_AUTHORIZATIONS.add(authorization);
    LIVE_BINDINGS.delete(authorization);

    const mergeRequestedAt = new Date(binding.clock.wallNow()).toISOString();
    let mutation: RegulatoryMergeMutation;
    try {
      mutation = await binding.adapter.requestAtomicReviewedBaseHeadFastForward(
        freshSnapshot.repositoryNodeId,
        authorization.headBranch,
        authorization.reviewedBaseSha,
        authorization.hostedHeadSha
      );
    } catch {
      mutation = deepFreeze({ kind: "ambiguous" });
    }

    let postmergeSnapshot: Readonly<RegulatoryMergeHostedSnapshot>;
    try {
      postmergeSnapshot = await binding.adapter.inspectExactPullRequest(
        authorization.pullRequestNumber
      );
    } catch {
      outcome = buildHostedOutcome(
        authorization,
        "ambiguous-hosted-mutation",
        "postmerge-inspection-failed",
        mutation.kind
      );
      return await terminalResult(authorization, binding, outcome);
    }

    const hostedVerifiedAt = new Date(binding.clock.wallNow()).toISOString();
    if (mutation.kind === "refused") {
      if (exactPostmergeState(postmergeSnapshot, authorization)) {
        const receipt = buildMergeReceipt(
          authorization,
          binding,
          postmergeSnapshot,
          mergeRequestedAt,
          hostedVerifiedAt
        );
        outcome = buildHostedOutcome(
          authorization,
          "already-merged-exact",
          "already-merged-race",
          "refused",
          receipt
        );
      } else if (postmergeSnapshot.merged) {
        outcome = buildHostedOutcome(
          authorization,
          "ambiguous-hosted-mutation",
          "concurrent-non-fast-forward-merge",
          "refused"
        );
      } else {
        outcome = buildHostedOutcome(
          authorization,
          "github-deterministic-refusal",
          "deterministic-refusal",
          "refused"
        );
      }
      return await terminalResult(authorization, binding, outcome);
    }

    if (exactPostmergeState(postmergeSnapshot, authorization)) {
      if (
        mutation.kind === "accepted" &&
        mutation.mergeCommitSha !== postmergeSnapshot.mergeCommitSha
      ) {
        outcome = buildHostedOutcome(
          authorization,
          "ambiguous-hosted-mutation",
          "merge-response-mismatch",
          "accepted"
        );
        return await terminalResult(authorization, binding, outcome);
      }
      const receipt = buildMergeReceipt(
        authorization,
        binding,
        postmergeSnapshot,
        mergeRequestedAt,
        hostedVerifiedAt
      );
      outcome = buildHostedOutcome(
        authorization,
        "merge-succeeded",
        mutation.kind === "accepted"
          ? "verified-success"
          : "verified-after-ambiguous-response",
        mutation.kind,
        receipt
      );
      return await terminalResult(authorization, binding, outcome);
    }

    outcome = buildHostedOutcome(
      authorization,
      "ambiguous-hosted-mutation",
      "postmerge-state-mismatch",
      mutation.kind
    );
    return await terminalResult(authorization, binding, outcome);
  } catch {
    outcome = buildHostedOutcome(
      authorization,
      "ambiguous-hosted-mutation",
      "internal-terminal-failure",
      "ambiguous"
    );
    return await terminalResult(authorization, binding, outcome);
  } finally {
    IN_FLIGHT_AUTHORIZATIONS.delete(authorization);
    CONSUMED_AUTHORIZATIONS.add(authorization);
    LIVE_BINDINGS.delete(authorization);
    binding.auditKey.fill(0);
    ZEROED_AUTHORIZATIONS.add(authorization);
  }
}

export function validateRegulatoryImplementationMergeExecutionResult(
  value: unknown,
  auditKey?: Uint8Array
): string[] {
  try {
    const record = exactRecord(value);
    if (!record) return ["result-not-object"];
    const errors: string[] = [];
    if (record.status === "authorization-refused") {
      if (
        !hasExactKeys(record, [
          "status",
          "errors",
          "auditRetention",
          "applicationStatus",
          "customerFacingStatus",
          "deploymentStatus",
          "resultChecksum",
        ]) ||
        record.auditRetention !== "not-available" ||
        !Array.isArray(record.errors)
      ) {
        errors.push("result-shape-invalid");
      }
    } else if (record.status === "terminal") {
      const commonKeys = [
        "status",
        "outcome",
        "audit",
        "auditRetention",
        "applicationStatus",
        "customerFacingStatus",
        "deploymentStatus",
        "resultChecksum",
      ];
      const exactKeys =
        record.auditRetention === "retained"
          ? [...commonKeys, "auditPath"]
          : record.auditRetention === "failed"
            ? commonKeys
            : [];
      if (exactKeys.length === 0 || !hasExactKeys(record, exactKeys)) {
        errors.push("result-shape-invalid");
      }
      errors.push(...validateHostedOutcome(record.outcome));
      errors.push(
        ...validateRegulatoryImplementationMergeAuditRecord(record.audit, auditKey)
      );
      const audit = exactRecord(record.audit);
      const outcome = exactRecord(record.outcome);
      if (
        !audit ||
        !outcome ||
        (audit.outcome !== record.outcome &&
          canonicalJson(audit.outcome) !== canonicalJson(record.outcome))
      ) {
        errors.push("result-audit-relationship-invalid");
      }
      if (
        record.auditRetention === "retained" &&
        typeof record.auditPath !== "string"
      ) {
        errors.push("result-audit-retention-invalid");
      }
      if (
        record.auditRetention === "failed" &&
        record.auditPath !== undefined
      ) {
        errors.push("result-audit-retention-invalid");
      }
    } else {
      errors.push("result-status-invalid");
    }
    if (
      record.applicationStatus !== CONTROLLED_BOUNDARY.applicationStatus ||
      record.customerFacingStatus !== CONTROLLED_BOUNDARY.customerFacingStatus ||
      record.deploymentStatus !== CONTROLLED_BOUNDARY.deploymentStatus
    ) {
      errors.push("result-policy-invalid");
    }
    if (
      record.resultChecksum !==
      sha256Canonical(omitKeys(record, ["resultChecksum"]))
    ) {
      errors.push("result-checksum-invalid");
    }
    return uniqueSorted(errors);
  } catch {
    return ["result-noncanonical"];
  }
}

export const regulatoryImplementationMergeAuthorizationTestSurface =
  Object.freeze({
    sha256Canonical,
    validateRegulatoryMergeHostedSnapshot,
    fiveMinutesMs: FIVE_MINUTES_MS,
    fiveMinutesNs: FIVE_MINUTES_NS,
    wasKeyZeroed(
      authorization: RegulatoryImplementationMergeAuthorization
    ): boolean {
      return ZEROED_AUTHORIZATIONS.has(authorization);
    },
    hasLiveBinding(
      authorization: RegulatoryImplementationMergeAuthorization
    ): boolean {
      return LIVE_BINDINGS.has(authorization);
    },
  });
