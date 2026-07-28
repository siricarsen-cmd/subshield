import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { lstat, open, realpath } from "node:fs/promises";
import { isAbsolute, join, resolve } from "node:path";

import {
  executeRegulatoryImplementationWithProductionAdapter,
  type RegulatoryImplementationProductionOptions,
  type RegulatoryImplementationProductionResult,
} from "./registry-implementation-production-adapter";
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
import { fingerprintRegulatoryRegistryValue } from "./registry-integrity";
import {
  validateRegulatoryImplementationExecutionReceipt,
  type RegulatoryImplementationExecutionReceipt,
} from "./registry-implementation-executor";

const EXPECTED_REPOSITORY = "siricarsen-cmd/subshield";
const EXPECTED_DEFAULT_BRANCH = "main";
const CHECKSUM_RE = /^sha256:[a-f0-9]{64}$/;
const COMMIT_SHA_RE = /^[a-f0-9]{40}$/;
const GITHUB_LOGIN_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;
const AUDIT_FILENAME_RE = /^[a-f0-9]{24}-invocation-audit\.json$/;
const HMAC_TAG_RE = /^hmac-sha256:[a-f0-9]{64}$/;
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;
const MAX_AUTHORIZATION_AGE_MS = 5 * 60 * 1000;
const MAX_AUTHORIZATION_AGE_NS =
  BigInt(MAX_AUTHORIZATION_AGE_MS) * BigInt(1_000_000);
const monotonicNow = process.hrtime.bigint.bind(process.hrtime);
const REQUIRED_CHECKS = Object.freeze([
  "npm run test:regulatory",
  "npm run test:accuracy",
  "npx tsc --noEmit",
  "npm run build",
] as const);
const EXECUTION_FAILURE_STAGES = new Set([
  "branch",
  "write",
  "worktree-verification",
  "commit",
  "commit-verification",
]);
const PRODUCTION_BOUNDARY_STAGES = new Set([
  "execution",
  "cleanup",
  "execution-and-cleanup",
]);
const LIVE_AUTHORIZATIONS = new WeakSet<object>();
const CONSUMED_AUTHORIZATIONS = new WeakSet<object>();
const AUTHORIZATION_BINDINGS = new WeakMap<object, AuthorizationBinding>();
const INVOCATION_BOUNDARY = Object.freeze({
  applicationStatus: "not-applied" as const,
  customerFacingStatus: "benchmark-only" as const,
  mergeStatus: "not-authorized" as const,
});

type InvocationBoundary = typeof INVOCATION_BOUNDARY;

export interface RegulatoryImplementationInvocationAuthorizationRequest {
  authorizedAt: string;
  expectedGitHubLogin: string;
  repositoryRoot: string;
  gitExecutable: string;
  githubCliExecutable: string;
  githubCliConfigDir: string;
  auditOutputDirectory: string;
  /** Secret audit-authentication key retained only in protected process memory. */
  auditAuthenticationKey: Uint8Array;
  confirmation: string;
}

export interface RegulatoryImplementationInvocationAuthorization extends InvocationBoundary {
  schemaVersion: 1;
  authorizationId: string;
  repositoryFullName: typeof EXPECTED_REPOSITORY;
  defaultBranch: typeof EXPECTED_DEFAULT_BRANCH;
  planId: string;
  planChecksum: string;
  bundleId: string;
  bundleChecksum: string;
  baseCommitSha: string;
  targetBranch: string;
  expectedExecutorPrincipal: string;
  authorizedAt: string;
  runtimeFingerprint: string;
  auditAuthenticationKeyId: string;
  confirmationFingerprint: string;
  authorizationStatus: "live-one-use-operator-authorization";
  authorizationChecksum: string;
}

export interface RegulatoryImplementationInvocationAuditAuthentication {
  algorithm: "hmac-sha256";
  keyId: string;
  tag: string;
}

export interface RegulatoryImplementationInvocationAuditRecord extends InvocationBoundary {
  schemaVersion: 1;
  auditId: string;
  authorizationId: string;
  authorizationChecksum: string;
  authorization: RegulatoryImplementationInvocationAuthorization;
  repositoryFullName: typeof EXPECTED_REPOSITORY;
  planId: string;
  planChecksum: string;
  bundleId: string;
  bundleChecksum: string;
  baseCommitSha: string;
  targetBranch: string;
  expectedExecutorPrincipal: string;
  authorizedAt: string;
  recordedAt: string;
  recordedAtSource: "operator-clock-audit-only";
  result: RegulatoryImplementationProductionResult;
  auditStatus: "evidence-only-not-execution-authority";
  auditChecksum: string;
  auditAuthentication: RegulatoryImplementationInvocationAuditAuthentication;
}

export type RegulatoryImplementationInvocationResult = Readonly<
  InvocationBoundary &
    (
      | {
          status: "invocation-refused";
          authorizationStatus: "refused";
          errors: readonly string[];
        }
      | {
          status: "invocation-succeeded" | "invocation-failed";
          authorizationStatus: "consumed";
          productionResult: RegulatoryImplementationProductionResult;
          auditRecord: Readonly<RegulatoryImplementationInvocationAuditRecord>;
          auditPath: string;
        }
      | {
          status: "audit-retention-failed";
          authorizationStatus: "consumed";
          productionResult: RegulatoryImplementationProductionResult;
          auditRecord?: Readonly<RegulatoryImplementationInvocationAuditRecord>;
          errors: readonly string[];
        }
    )
>;

interface AuthorizationBinding {
  plan: RegulatoryRegistryImplementationPlan;
  bundle: RegulatoryImplementationPullRequestBundle;
  productionOptions: RegulatoryImplementationProductionOptions;
  auditOutputDirectory: string;
  auditAuthenticationKey: Buffer;
  createdAtMonotonicNs: bigint;
}

function jsonClone<T>(value: T): T {
  const serialized = JSON.stringify(value);
  if (serialized === undefined) throw new Error("Invocation value is not JSON serializable");
  return JSON.parse(serialized) as T;
}

function deepFreeze<T>(value: T): Readonly<T> {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const nested of Object.values(value as Record<string, unknown>)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value as Readonly<T>;
}

function fingerprint(value: unknown): string {
  return fingerprintRegulatoryRegistryValue(jsonClone(value));
}

function sha256(value: string): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function copyAuditAuthenticationKey(value: unknown): Buffer {
  if (!(value instanceof Uint8Array) || value.byteLength < 32 || value.byteLength > 4096) {
    throw new Error("Invocation audit authentication key must contain 32 to 4096 bytes");
  }
  return Buffer.from(value);
}

function auditAuthenticationKeyIdFor(value: Uint8Array): string {
  if (!(value instanceof Uint8Array) || value.byteLength < 32 || value.byteLength > 4096) {
    throw new Error("Invocation audit authentication key must contain 32 to 4096 bytes");
  }
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function exactInstant(value: string, label: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString() !== value) {
    throw new Error(`${label} must be an exact ISO instant`);
  }
  return value;
}

function normalizeGitHubLogin(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (normalized !== value.toLowerCase() || !GITHUB_LOGIN_RE.test(normalized)) {
    throw new Error("Invocation expected GitHub login is invalid");
  }
  return normalized;
}

function exactAbsolutePath(value: string, label: string): string {
  if (!value || value !== value.trim() || /[\x00-\x1f\x7f]/.test(value) || !isAbsolute(value)) {
    throw new Error(`Invocation ${label} must be an exact absolute path`);
  }
  return value;
}


type UnknownRecord = Record<string, unknown>;
type CheckValidationMode = "partial" | "complete-success";

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function hasExactKeys(record: UnknownRecord, expected: readonly string[]): boolean {
  const actual = Object.keys(record).sort();
  const canonical = [...expected].sort();
  return actual.length === canonical.length && actual.every((key, index) => key === canonical[index]);
}

function hasNonblankErrors(value: unknown): value is readonly string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((entry) => typeof entry === "string" && entry.trim().length > 0)
  );
}

function validateControlledBoundary(record: UnknownRecord, label: string): string[] {
  return record.applicationStatus === "not-applied" &&
    record.customerFacingStatus === "benchmark-only" &&
    record.mergeStatus === "not-authorized"
    ? []
    : [`${label} escaped its controlled boundary`];
}

function validateCheckEvidence(value: unknown, mode: CheckValidationMode): string[] {
  const errors: string[] = [];
  if (!Array.isArray(value)) return ["Invocation production check evidence is not an array"];
  if (
    value.length > REQUIRED_CHECKS.length ||
    (mode === "complete-success" && value.length !== REQUIRED_CHECKS.length)
  ) {
    errors.push("Invocation production check evidence has an invalid length");
  }
  let commitSha: string | undefined;
  for (const [index, candidate] of value.entries()) {
    if (!isRecord(candidate) || !hasExactKeys(candidate, ["command", "commitSha", "conclusion"])) {
      errors.push("Invocation production check evidence has an invalid shape");
      continue;
    }
    if (candidate.command !== REQUIRED_CHECKS[index]) {
      errors.push("Invocation production check evidence does not preserve the required sequence");
    }
    if (typeof candidate.commitSha !== "string" || !COMMIT_SHA_RE.test(candidate.commitSha)) {
      errors.push("Invocation production check evidence commit is invalid");
    } else if (commitSha && candidate.commitSha !== commitSha) {
      errors.push("Invocation production check evidence is not bound to one commit");
    } else {
      commitSha = candidate.commitSha;
    }
    if (candidate.conclusion !== "success" && candidate.conclusion !== "failure") {
      errors.push("Invocation production check evidence conclusion is invalid");
    }
    if (mode === "complete-success" && candidate.conclusion !== "success") {
      errors.push("Invocation completed check evidence must contain only successes");
    }
    if (
      mode === "partial" &&
      index < value.length - 1 &&
      candidate.conclusion !== "success"
    ) {
      errors.push("Invocation partial check evidence may fail only at its final observed check");
    }
  }
  if (
    mode === "partial" &&
    value.length === REQUIRED_CHECKS.length &&
    value.every((candidate) => isRecord(candidate) && candidate.conclusion === "success")
  ) {
    errors.push("Invocation check failure cannot contain a complete successful check sequence");
  }
  return [...new Set(errors)];
}

const RECEIPT_KEYS = [
  "schemaVersion", "receiptId", "repositoryFullName", "planId", "planChecksum",
  "bundleId", "bundleChecksum", "baseCommitSha", "targetBranch", "commitSha",
  "files", "checks", "pullRequest", "executedAt", "executedBy",
  "authorizationStatus", "receiptChecksum", "applicationStatus",
  "customerFacingStatus", "mergeStatus",
] as const;

function validateStoredExecutionReceiptShape(value: unknown): string[] {
  if (!isRecord(value) || !hasExactKeys(value, RECEIPT_KEYS)) {
    return ["Invocation success receipt has an invalid exact shape"];
  }
  const stringKeys = [
    "receiptId", "repositoryFullName", "planId", "planChecksum", "bundleId",
    "bundleChecksum", "baseCommitSha", "targetBranch", "commitSha", "executedAt",
    "executedBy", "receiptChecksum",
  ] as const;
  if (
    value.schemaVersion !== 1 ||
    stringKeys.some((key) => typeof value[key] !== "string") ||
    !Array.isArray(value.files) ||
    value.files.some((file) =>
      !isRecord(file) ||
      !hasExactKeys(file, ["path", "beforeChecksum", "afterChecksum"]) ||
      typeof file.path !== "string" ||
      typeof file.beforeChecksum !== "string" ||
      typeof file.afterChecksum !== "string"
    ) ||
    !Array.isArray(value.checks) ||
    value.checks.some((check) =>
      !isRecord(check) ||
      !hasExactKeys(check, ["command", "commitSha", "conclusion"]) ||
      typeof check.command !== "string" ||
      typeof check.commitSha !== "string" ||
      (check.conclusion !== "success" && check.conclusion !== "failure")
    ) ||
    !isRecord(value.pullRequest) ||
    !hasExactKeys(value.pullRequest, [
      "number", "url", "baseBranch", "headBranch", "headCommitSha", "title",
      "bodyFingerprint", "autoMergeEnabled",
    ]) ||
    !Number.isSafeInteger(value.pullRequest.number) ||
    ["url", "baseBranch", "headBranch", "headCommitSha", "title", "bodyFingerprint"].some(
      (key) => typeof (value.pullRequest as UnknownRecord)[key] !== "string"
    ) ||
    value.pullRequest.autoMergeEnabled !== false
  ) {
    return ["Invocation success receipt contains unsafe or incomplete nested evidence"];
  }
  if (value.receiptId !== `regulatory-implementation-execution:${value.bundleId}:${value.commitSha}`) {
    return ["Invocation success receipt ID is invalid"];
  }
  return [];
}

function validateExecutionResult(
  value: unknown,
  authorization?: RegulatoryImplementationInvocationAuthorization
): string[] {
  if (!isRecord(value) || typeof value.status !== "string") {
    return ["Invocation production execution result is invalid"];
  }
  const errors = validateControlledBoundary(value, "Invocation production execution result");
  switch (value.status) {
    case "preflight-refused":
      if (
        !hasExactKeys(value, [
          "status",
          "errors",
          "applicationStatus",
          "customerFacingStatus",
          "mergeStatus",
        ]) ||
        !hasNonblankErrors(value.errors)
      ) {
        errors.push("Invocation preflight refusal is incomplete");
      }
      break;
    case "execution-failed":
      if (
        !hasExactKeys(value, [
          "status",
          "stage",
          "errors",
          "applicationStatus",
          "customerFacingStatus",
          "mergeStatus",
        ]) ||
        typeof value.stage !== "string" ||
        !EXECUTION_FAILURE_STAGES.has(value.stage) ||
        !hasNonblankErrors(value.errors)
      ) {
        errors.push("Invocation execution failure is incomplete");
      }
      break;
    case "check-failed":
      if (
        !hasExactKeys(value, [
          "status",
          "checks",
          "errors",
          "applicationStatus",
          "customerFacingStatus",
          "mergeStatus",
        ]) ||
        !hasNonblankErrors(value.errors)
      ) {
        errors.push("Invocation check failure is incomplete");
      }
      errors.push(...validateCheckEvidence(value.checks, "partial"));
      break;
    case "push-failed":
    case "pull-request-failed":
    case "receipt-failed":
      if (
        !hasExactKeys(value, [
          "status",
          "checks",
          "errors",
          "applicationStatus",
          "customerFacingStatus",
          "mergeStatus",
        ]) ||
        !hasNonblankErrors(value.errors)
      ) {
        errors.push(`Invocation ${value.status} result is incomplete`);
      }
      errors.push(...validateCheckEvidence(value.checks, "complete-success"));
      break;
    case "success": {
      if (
        !hasExactKeys(value, [
          "status",
          "receipt",
          "applicationStatus",
          "customerFacingStatus",
          "mergeStatus",
        ]) ||
        !isRecord(value.receipt)
      ) {
        errors.push("Invocation success result lacks a complete receipt");
        break;
      }
      const receipt = value.receipt as unknown as RegulatoryImplementationExecutionReceipt;
      const shapeErrors = validateStoredExecutionReceiptShape(value.receipt);
      if (shapeErrors.length > 0) {
        errors.push(...shapeErrors);
        break;
      }
      let receiptErrors: string[];
      try {
        receiptErrors = validateRegulatoryImplementationExecutionReceipt(receipt);
      } catch {
        receiptErrors = ["Invocation success receipt validator rejected unsafe evidence"];
      }
      if (receiptErrors.length > 0) {
        errors.push("Invocation success receipt does not reproduce");
      }
      errors.push(...validateCheckEvidence(receipt.checks, "complete-success"));
      if (
        authorization &&
        (receipt.repositoryFullName !== authorization.repositoryFullName ||
          receipt.planId !== authorization.planId ||
          receipt.planChecksum !== authorization.planChecksum ||
          receipt.bundleId !== authorization.bundleId ||
          receipt.bundleChecksum !== authorization.bundleChecksum ||
          receipt.baseCommitSha !== authorization.baseCommitSha ||
          receipt.targetBranch !== authorization.targetBranch ||
          receipt.executedBy !== authorization.expectedExecutorPrincipal)
      ) {
        errors.push("Invocation success receipt does not match its authorization");
      }
      break;
    }
    default:
      errors.push("Invocation production execution result status is invalid");
  }
  return [...new Set(errors)];
}

export function validateRegulatoryImplementationProductionResult(
  value: unknown,
  authorization?: RegulatoryImplementationInvocationAuthorization
): string[] {
  if (!isRecord(value) || typeof value.status !== "string") {
    return ["Invocation production result is invalid"];
  }
  if (value.status !== "production-boundary-failed") {
    return validateExecutionResult(value, authorization);
  }
  const allowedKeys = [
    "status",
    "stage",
    "errors",
    "applicationStatus",
    "customerFacingStatus",
    "mergeStatus",
    ...(Object.prototype.hasOwnProperty.call(value, "priorResult") ? ["priorResult"] : []),
  ];
  const errors = validateControlledBoundary(value, "Invocation production boundary failure");
  if (
    !hasExactKeys(value, allowedKeys) ||
    typeof value.stage !== "string" ||
    !PRODUCTION_BOUNDARY_STAGES.has(value.stage) ||
    !hasNonblankErrors(value.errors)
  ) {
    errors.push("Invocation production boundary failure is incomplete");
  }
  if (value.stage === "cleanup" && !Object.prototype.hasOwnProperty.call(value, "priorResult")) {
    errors.push("Invocation cleanup failure must preserve its prior structured result");
  }
  if (
    (value.stage === "execution" || value.stage === "execution-and-cleanup") &&
    Object.prototype.hasOwnProperty.call(value, "priorResult")
  ) {
    errors.push("Invocation execution boundary failure must not claim a prior result");
  }
  if (Object.prototype.hasOwnProperty.call(value, "priorResult")) {
    errors.push(...validateExecutionResult(value.priorResult, authorization));
  }
  return [...new Set(errors)];
}

function authorizationPayload(
  authorization:
    | Omit<RegulatoryImplementationInvocationAuthorization, "authorizationChecksum">
    | RegulatoryImplementationInvocationAuthorization
): Omit<RegulatoryImplementationInvocationAuthorization, "authorizationChecksum"> {
  const { authorizationChecksum: _ignored, ...payload } =
    authorization as RegulatoryImplementationInvocationAuthorization;
  return jsonClone(payload);
}

function checksumForAuthorization(
  authorization:
    | Omit<RegulatoryImplementationInvocationAuthorization, "authorizationChecksum">
    | RegulatoryImplementationInvocationAuthorization
): string {
  return fingerprint(authorizationPayload(authorization));
}

function auditPayload(audit: unknown): UnknownRecord {
  if (!isRecord(audit)) throw new Error("Invocation audit payload is invalid");
  const {
    auditChecksum: _ignoredChecksum,
    auditAuthentication: _ignoredAuthentication,
    ...payload
  } = audit;
  return jsonClone(payload);
}

function checksumForAudit(audit: unknown): string {
  return fingerprint(auditPayload(audit));
}

function auditAuthenticationPayload(audit: unknown): UnknownRecord {
  if (!isRecord(audit)) throw new Error("Invocation audit authentication payload is invalid");
  const { auditAuthentication: _ignoredAuthentication, ...payload } = audit;
  return jsonClone(payload);
}

function buildAuditAuthentication(
  audit: unknown,
  auditAuthenticationKey: Uint8Array
): RegulatoryImplementationInvocationAuditAuthentication {
  const key = copyAuditAuthenticationKey(auditAuthenticationKey);
  try {
    const keyId = auditAuthenticationKeyIdFor(key);
    const tag = `hmac-sha256:${createHmac("sha256", key)
      .update(fingerprint(auditAuthenticationPayload(audit)))
      .digest("hex")}`;
    return deepFreeze({ algorithm: "hmac-sha256" as const, keyId, tag });
  } finally {
    key.fill(0);
  }
}

function validateAuditAuthentication(
  audit: RegulatoryImplementationInvocationAuditRecord,
  auditAuthenticationKey: Uint8Array
): string[] {
  const errors: string[] = [];
  let key: Buffer | undefined;
  try {
    key = copyAuditAuthenticationKey(auditAuthenticationKey);
    const expectedKeyId = auditAuthenticationKeyIdFor(key);
    if (
      !audit.auditAuthentication ||
      typeof audit.auditAuthentication !== "object" ||
      audit.auditAuthentication.algorithm !== "hmac-sha256" ||
      audit.auditAuthentication.keyId !== expectedKeyId ||
      audit.authorization.auditAuthenticationKeyId !== expectedKeyId ||
      !HMAC_TAG_RE.test(audit.auditAuthentication.tag)
    ) {
      errors.push("Invocation audit authentication metadata is invalid");
      return errors;
    }
    const expected = buildAuditAuthentication(audit, key).tag;
    const actualBytes = Buffer.from(audit.auditAuthentication.tag, "utf8");
    const expectedBytes = Buffer.from(expected, "utf8");
    if (
      actualBytes.length !== expectedBytes.length ||
      !timingSafeEqual(actualBytes, expectedBytes)
    ) {
      errors.push("Invocation audit authentication tag does not reproduce");
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  } finally {
    key?.fill(0);
  }
  return [...new Set(errors)];
}

function runtimeFingerprintFor(
  options: RegulatoryImplementationProductionOptions,
  auditOutputDirectory: string,
  auditAuthenticationKeyId: string
): string {
  return fingerprint({
    repositoryRoot: options.repositoryRoot,
    gitExecutable: options.gitExecutable,
    githubCliExecutable: options.githubCliExecutable,
    githubCliConfigDir: options.githubCliConfigDir,
    auditOutputDirectory,
    expectedGitHubLogin: options.expectedGitHubLogin,
    auditAuthenticationKeyId,
  });
}

export function buildRegulatoryImplementationInvocationConfirmation(
  plan: RegulatoryRegistryImplementationPlan,
  bundle: RegulatoryImplementationPullRequestBundle,
  auditAuthenticationKey: Uint8Array
): string {
  return [
    "AUTHORIZE SUBSHIELD REGULATORY IMPLEMENTATION PR",
    `plan=${plan.planChecksum}`,
    `bundle=${bundle.bundleChecksum}`,
    `base=${plan.baseCommitSha}`,
    `branch=${plan.targetBranch}`,
    `audit-key=${auditAuthenticationKeyIdFor(auditAuthenticationKey)}`,
  ].join(" ");
}

export function validateRegulatoryImplementationInvocationAuthorization(
  authorization: RegulatoryImplementationInvocationAuthorization
): string[] {
  const errors: string[] = [];
  if (authorization.schemaVersion !== 1) errors.push("Invocation authorization schema is invalid");
  if (
    authorization.authorizationId !==
    `regulatory-implementation-invocation:${authorization.bundleChecksum}`
  ) {
    errors.push("Invocation authorization ID is invalid");
  }
  if (
    authorization.repositoryFullName !== EXPECTED_REPOSITORY ||
    authorization.defaultBranch !== EXPECTED_DEFAULT_BRANCH
  ) {
    errors.push("Invocation authorization repository boundary is invalid");
  }
  if (
    !authorization.planId.trim() ||
    !authorization.bundleId.trim() ||
    !CHECKSUM_RE.test(authorization.planChecksum) ||
    !CHECKSUM_RE.test(authorization.bundleChecksum) ||
    !CHECKSUM_RE.test(authorization.runtimeFingerprint) ||
    !CHECKSUM_RE.test(authorization.auditAuthenticationKeyId) ||
    !CHECKSUM_RE.test(authorization.confirmationFingerprint) ||
    !COMMIT_SHA_RE.test(authorization.baseCommitSha) ||
    !authorization.targetBranch.trim()
  ) {
    errors.push("Invocation authorization provenance is invalid");
  }
  try {
    exactInstant(authorization.authorizedAt, "Invocation authorizedAt");
    const login = normalizeGitHubLogin(
      authorization.expectedExecutorPrincipal.replace(/^github-user:/, "")
    );
    if (authorization.expectedExecutorPrincipal !== `github-user:${login}`) {
      errors.push("Invocation expected executor principal is invalid");
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }
  if (
    authorization.authorizationStatus !== "live-one-use-operator-authorization" ||
    authorization.applicationStatus !== "not-applied" ||
    authorization.customerFacingStatus !== "benchmark-only" ||
    authorization.mergeStatus !== "not-authorized"
  ) {
    errors.push("Invocation authorization escaped its non-applied boundary");
  }
  if (
    !CHECKSUM_RE.test(authorization.authorizationChecksum) ||
    authorization.authorizationChecksum !== checksumForAuthorization(authorization)
  ) {
    errors.push("Invocation authorization checksum does not reproduce");
  }
  return [...new Set(errors)];
}

export function isLiveRegulatoryImplementationInvocationAuthorization(
  value: unknown
): value is RegulatoryImplementationInvocationAuthorization {
  return Boolean(
    value &&
      typeof value === "object" &&
      LIVE_AUTHORIZATIONS.has(value as object) &&
      !CONSUMED_AUTHORIZATIONS.has(value as object) &&
      validateRegulatoryImplementationInvocationAuthorization(
        value as RegulatoryImplementationInvocationAuthorization
      ).length === 0
  );
}

export function createRegulatoryImplementationInvocationAuthorization(
  plan: RegulatoryRegistryImplementationPlan,
  bundle: RegulatoryImplementationPullRequestBundle,
  request: RegulatoryImplementationInvocationAuthorizationRequest
): Readonly<RegulatoryImplementationInvocationAuthorization> {
  if (!isLiveAuthorizedRegulatoryRegistryImplementationPlan(plan)) {
    throw new Error("Invocation requires the original live-authorized implementation plan");
  }
  if (!isLiveRegulatoryImplementationPullRequestBundle(bundle)) {
    throw new Error("Invocation requires the original live implementation PR bundle");
  }
  const planErrors = validateRegulatoryRegistryImplementationPlan(plan);
  const bundleErrors = validateRegulatoryImplementationPullRequestBundle(bundle, plan);
  if (planErrors.length > 0 || bundleErrors.length > 0) {
    throw new Error("Invocation plan or bundle failed validation");
  }
  if (
    bundle.planId !== plan.planId ||
    bundle.planChecksum !== plan.planChecksum ||
    bundle.baseCommitSha !== plan.baseCommitSha ||
    bundle.targetBranch !== plan.targetBranch
  ) {
    throw new Error("Invocation plan and bundle identities do not match");
  }

  const authorizedAt = exactInstant(request.authorizedAt, "Invocation authorizedAt");
  const authorizedAtMs = new Date(authorizedAt).getTime();
  const createdAtMs = Date.now();
  const createdAtMonotonicNs = monotonicNow();
  if (authorizedAtMs < new Date(plan.createdAt).getTime()) {
    throw new Error("Invocation authorization cannot predate the live implementation plan");
  }
  if (authorizedAtMs > createdAtMs + MAX_CLOCK_SKEW_MS) {
    throw new Error("Invocation authorization cannot be materially in the future");
  }
  if (authorizedAtMs < createdAtMs - MAX_AUTHORIZATION_AGE_MS) {
    throw new Error("Invocation authorization is older than the five-minute freshness window");
  }
  const expectedGitHubLogin = normalizeGitHubLogin(request.expectedGitHubLogin);
  const repositoryRoot = exactAbsolutePath(request.repositoryRoot, "repository root");
  const gitExecutable = exactAbsolutePath(request.gitExecutable, "Git executable");
  const githubCliExecutable = exactAbsolutePath(
    request.githubCliExecutable,
    "GitHub CLI executable"
  );
  const githubCliConfigDir = exactAbsolutePath(
    request.githubCliConfigDir,
    "GitHub CLI configuration directory"
  );
  const auditOutputDirectory = exactAbsolutePath(
    request.auditOutputDirectory,
    "audit output directory"
  );
  const auditAuthenticationKey = copyAuditAuthenticationKey(request.auditAuthenticationKey);
  try {
    const auditAuthenticationKeyId = auditAuthenticationKeyIdFor(auditAuthenticationKey);
    const expectedConfirmation = buildRegulatoryImplementationInvocationConfirmation(
      plan,
      bundle,
      auditAuthenticationKey
    );
    if (request.confirmation !== expectedConfirmation) {
      throw new Error("Invocation requires the exact plan-and-bundle-bound operator confirmation");
    }
    const productionOptions: RegulatoryImplementationProductionOptions = {
      repositoryRoot,
      gitExecutable,
      githubCliExecutable,
      githubCliConfigDir,
      expectedGitHubLogin,
    };
    const runtimeFingerprint = runtimeFingerprintFor(
      productionOptions,
      auditOutputDirectory,
      auditAuthenticationKeyId
    );
    const payload: Omit<
      RegulatoryImplementationInvocationAuthorization,
      "authorizationChecksum"
    > = {
      schemaVersion: 1,
      authorizationId: `regulatory-implementation-invocation:${bundle.bundleChecksum}`,
      repositoryFullName: EXPECTED_REPOSITORY,
      defaultBranch: EXPECTED_DEFAULT_BRANCH,
      planId: plan.planId,
      planChecksum: plan.planChecksum,
      bundleId: bundle.bundleId,
      bundleChecksum: bundle.bundleChecksum,
      baseCommitSha: plan.baseCommitSha,
      targetBranch: plan.targetBranch,
      expectedExecutorPrincipal: `github-user:${expectedGitHubLogin}`,
      authorizedAt,
      runtimeFingerprint,
      auditAuthenticationKeyId,
      confirmationFingerprint: sha256(request.confirmation),
      authorizationStatus: "live-one-use-operator-authorization",
      ...INVOCATION_BOUNDARY,
    };
    const authorization: RegulatoryImplementationInvocationAuthorization = {
      ...payload,
      authorizationChecksum: checksumForAuthorization(payload),
    };
    const errors = validateRegulatoryImplementationInvocationAuthorization(authorization);
    if (errors.length > 0) {
      throw new Error(`Built invocation authorization failed validation: ${errors.join("; ")}`);
    }
    const frozen = deepFreeze(authorization);
    LIVE_AUTHORIZATIONS.add(frozen as object);
    AUTHORIZATION_BINDINGS.set(frozen as object, {
      plan,
      bundle,
      productionOptions,
      auditOutputDirectory,
      auditAuthenticationKey,
      createdAtMonotonicNs,
    });
    return frozen;
  } catch (error) {
    auditAuthenticationKey.fill(0);
    throw error;
  }
}

export function validateRegulatoryImplementationInvocationAuditRecord(
  audit: RegulatoryImplementationInvocationAuditRecord,
  auditAuthenticationKey: Uint8Array
): string[] {
  const errors: string[] = [];
  if (audit.schemaVersion !== 1) errors.push("Invocation audit schema is invalid");
  if (
    audit.auditId !==
    `regulatory-implementation-audit:${audit.authorizationChecksum}`
  ) {
    errors.push("Invocation audit ID is invalid");
  }
  if (
    audit.repositoryFullName !== EXPECTED_REPOSITORY ||
    audit.authorizationId !==
      `regulatory-implementation-invocation:${audit.bundleChecksum}` ||
    !audit.planId.trim() ||
    !audit.bundleId.trim() ||
    !CHECKSUM_RE.test(audit.authorizationChecksum) ||
    !CHECKSUM_RE.test(audit.planChecksum) ||
    !CHECKSUM_RE.test(audit.bundleChecksum) ||
    !COMMIT_SHA_RE.test(audit.baseCommitSha) ||
    !audit.targetBranch.trim()
  ) {
    errors.push("Invocation audit provenance is invalid");
  }
  if (!audit.authorization || typeof audit.authorization !== "object") {
    errors.push("Invocation audit authorization snapshot is invalid");
  } else {
    const authorizationErrors =
      validateRegulatoryImplementationInvocationAuthorization(audit.authorization);
    if (authorizationErrors.length > 0) {
      errors.push("Invocation audit authorization snapshot does not reproduce");
    }
    if (
      audit.authorizationChecksum !== audit.authorization.authorizationChecksum ||
      audit.authorizationId !== audit.authorization.authorizationId ||
      audit.repositoryFullName !== audit.authorization.repositoryFullName ||
      audit.planId !== audit.authorization.planId ||
      audit.planChecksum !== audit.authorization.planChecksum ||
      audit.bundleId !== audit.authorization.bundleId ||
      audit.bundleChecksum !== audit.authorization.bundleChecksum ||
      audit.baseCommitSha !== audit.authorization.baseCommitSha ||
      audit.targetBranch !== audit.authorization.targetBranch ||
      audit.expectedExecutorPrincipal !==
        audit.authorization.expectedExecutorPrincipal ||
      audit.authorizedAt !== audit.authorization.authorizedAt
    ) {
      errors.push("Invocation audit fields do not match the authorization snapshot");
    }
  }
  try {
    const authorizedAt = new Date(
      exactInstant(audit.authorizedAt, "Invocation audit authorizedAt")
    ).getTime();
    const recordedAt = new Date(
      exactInstant(audit.recordedAt, "Invocation audit recordedAt")
    ).getTime();
    if (recordedAt + MAX_CLOCK_SKEW_MS < authorizedAt || recordedAt > Date.now() + MAX_CLOCK_SKEW_MS) {
      errors.push("Invocation audit recording timestamp is invalid");
    }
    const login = normalizeGitHubLogin(
      audit.expectedExecutorPrincipal.replace(/^github-user:/, "")
    );
    if (audit.expectedExecutorPrincipal !== `github-user:${login}`) {
      errors.push("Invocation audit expected executor principal is invalid");
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }
  if (
    audit.recordedAtSource !== "operator-clock-audit-only" ||
    audit.auditStatus !== "evidence-only-not-execution-authority" ||
    audit.applicationStatus !== "not-applied" ||
    audit.customerFacingStatus !== "benchmark-only" ||
    audit.mergeStatus !== "not-authorized"
  ) {
    errors.push("Invocation audit escaped its evidence-only boundary");
  }
  const productionResultErrors = validateRegulatoryImplementationProductionResult(
    audit.result,
    audit.authorization
  );
  if (productionResultErrors.length > 0) {
    errors.push(...productionResultErrors);
  }
  if (!CHECKSUM_RE.test(audit.auditChecksum) || audit.auditChecksum !== checksumForAudit(audit)) {
    errors.push("Invocation audit checksum does not reproduce");
  }
  errors.push(...validateAuditAuthentication(audit, auditAuthenticationKey));
  return [...new Set(errors)];
}

function buildAuditRecord(
  authorization: RegulatoryImplementationInvocationAuthorization,
  result: RegulatoryImplementationProductionResult,
  auditAuthenticationKey: Uint8Array
): Readonly<RegulatoryImplementationInvocationAuditRecord> {
  const payload: Omit<
    RegulatoryImplementationInvocationAuditRecord,
    "auditChecksum" | "auditAuthentication"
  > = {
    schemaVersion: 1,
    auditId: `regulatory-implementation-audit:${authorization.authorizationChecksum}`,
    authorizationId: authorization.authorizationId,
    authorizationChecksum: authorization.authorizationChecksum,
    authorization: jsonClone(authorization),
    repositoryFullName: EXPECTED_REPOSITORY,
    planId: authorization.planId,
    planChecksum: authorization.planChecksum,
    bundleId: authorization.bundleId,
    bundleChecksum: authorization.bundleChecksum,
    baseCommitSha: authorization.baseCommitSha,
    targetBranch: authorization.targetBranch,
    expectedExecutorPrincipal: authorization.expectedExecutorPrincipal,
    authorizedAt: authorization.authorizedAt,
    recordedAt: new Date().toISOString(),
    recordedAtSource: "operator-clock-audit-only",
    result: jsonClone(result),
    auditStatus: "evidence-only-not-execution-authority",
    ...INVOCATION_BOUNDARY,
  };
  const withChecksum: Omit<
    RegulatoryImplementationInvocationAuditRecord,
    "auditAuthentication"
  > = {
    ...payload,
    auditChecksum: checksumForAudit(payload),
  };
  const audit: RegulatoryImplementationInvocationAuditRecord = {
    ...withChecksum,
    auditAuthentication: buildAuditAuthentication(withChecksum, auditAuthenticationKey),
  };
  const errors = validateRegulatoryImplementationInvocationAuditRecord(
    audit,
    auditAuthenticationKey
  );
  if (errors.length > 0) {
    throw new Error(`Invocation audit failed validation: ${errors.join("; ")}`);
  }
  return deepFreeze(audit);
}

function auditFilename(authorizationChecksum: string): string {
  if (!CHECKSUM_RE.test(authorizationChecksum)) {
    throw new Error("Invocation audit authorization checksum is invalid");
  }
  return `${authorizationChecksum.replace(/^sha256:/, "").slice(0, 24)}-invocation-audit.json`;
}

async function storeAuditRecord(
  outputDirectory: string,
  audit: RegulatoryImplementationInvocationAuditRecord
): Promise<string> {
  const requested = exactAbsolutePath(outputDirectory, "audit output directory");
  const canonical = await realpath(requested);
  if (resolve(canonical) !== resolve(requested)) {
    throw new Error("Invocation audit output directory must be canonical");
  }
  const stats = await lstat(canonical);
  if (!stats.isDirectory() || stats.isSymbolicLink()) {
    throw new Error("Invocation audit output directory is invalid");
  }
  const filename = auditFilename(audit.authorizationChecksum);
  if (!AUDIT_FILENAME_RE.test(filename)) {
    throw new Error("Invocation audit filename is invalid");
  }
  const target = join(canonical, filename);
  const handle = await open(target, "wx", 0o600);
  try {
    await handle.writeFile(`${JSON.stringify(audit, null, 2)}\n`, "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }
  return target;
}

function refusal(...errors: string[]): RegulatoryImplementationInvocationResult {
  return deepFreeze({
    status: "invocation-refused" as const,
    authorizationStatus: "refused" as const,
    errors,
    ...INVOCATION_BOUNDARY,
  });
}

export async function executeRegulatoryImplementationInvocation(
  plan: RegulatoryRegistryImplementationPlan,
  bundle: RegulatoryImplementationPullRequestBundle,
  authorization: RegulatoryImplementationInvocationAuthorization
): Promise<RegulatoryImplementationInvocationResult> {
  if (!isLiveRegulatoryImplementationInvocationAuthorization(authorization)) {
    return refusal("Invocation requires an unused original live operator authorization");
  }
  const binding = AUTHORIZATION_BINDINGS.get(authorization as object);
  if (!binding || binding.plan !== plan || binding.bundle !== bundle) {
    return refusal("Invocation authorization is not bound to these original live objects");
  }
  if (
    !isLiveAuthorizedRegulatoryRegistryImplementationPlan(plan) ||
    !isLiveRegulatoryImplementationPullRequestBundle(bundle)
  ) {
    return refusal("Invocation plan or bundle is no longer live-authorized");
  }
  const runtimeFingerprint = runtimeFingerprintFor(
    binding.productionOptions,
    binding.auditOutputDirectory,
    authorization.auditAuthenticationKeyId
  );
  if (
    authorization.runtimeFingerprint !== runtimeFingerprint ||
    authorization.planChecksum !== plan.planChecksum ||
    authorization.bundleChecksum !== bundle.bundleChecksum
  ) {
    return refusal("Invocation authorization binding no longer matches");
  }

  const authorizedAtMs = new Date(authorization.authorizedAt).getTime();
  const consumedAtMs = Date.now();
  const consumedAtMonotonicNs = monotonicNow();
  if (
    authorizedAtMs < consumedAtMs - MAX_AUTHORIZATION_AGE_MS ||
    consumedAtMonotonicNs < binding.createdAtMonotonicNs ||
    consumedAtMonotonicNs - binding.createdAtMonotonicNs > MAX_AUTHORIZATION_AGE_NS
  ) {
    return refusal("Invocation authorization expired before consumption");
  }

  CONSUMED_AUTHORIZATIONS.add(authorization as object);
  try {
    let productionResult: RegulatoryImplementationProductionResult;
    try {
      productionResult = await executeRegulatoryImplementationWithProductionAdapter(
        plan,
        bundle,
        binding.productionOptions
      );
    } catch {
      productionResult = deepFreeze({
        status: "production-boundary-failed" as const,
        stage: "execution" as const,
        errors: ["Controlled regulatory invocation production adapter failed unexpectedly"],
        ...INVOCATION_BOUNDARY,
      });
    }
    let auditRecord: Readonly<RegulatoryImplementationInvocationAuditRecord>;
    try {
      auditRecord = buildAuditRecord(
        authorization,
        productionResult,
        binding.auditAuthenticationKey
      );
    } catch {
      return deepFreeze({
        status: "audit-retention-failed" as const,
        authorizationStatus: "consumed" as const,
        productionResult,
        errors: ["Invocation result was preserved, but the audit record could not be constructed"],
        ...INVOCATION_BOUNDARY,
      });
    }

    try {
      const auditPath = await storeAuditRecord(binding.auditOutputDirectory, auditRecord);
      return deepFreeze({
        status:
          productionResult.status === "success"
            ? ("invocation-succeeded" as const)
            : ("invocation-failed" as const),
        authorizationStatus: "consumed" as const,
        productionResult,
        auditRecord,
        auditPath,
        ...INVOCATION_BOUNDARY,
      });
    } catch {
      return deepFreeze({
        status: "audit-retention-failed" as const,
        authorizationStatus: "consumed" as const,
        productionResult,
        auditRecord,
        errors: ["Invocation result was preserved, but the evidence-only audit file was not retained"],
        ...INVOCATION_BOUNDARY,
      });
    }
  } finally {
    binding.auditAuthenticationKey.fill(0);
    AUTHORIZATION_BINDINGS.delete(authorization as object);
  }
}

export const regulatoryImplementationInvocationTestSurface = Object.freeze({
  expectedRepository: EXPECTED_REPOSITORY,
  expectedDefaultBranch: EXPECTED_DEFAULT_BRANCH,
  normalizeGitHubLogin,
  exactAbsolutePath,
  authorizationPayload,
  checksumForAuthorization,
  auditPayload,
  checksumForAudit,
  auditAuthenticationKeyIdFor,
  buildAuditAuthentication,
  validateAuditAuthentication,
  runtimeFingerprintFor,
  auditFilename,
  validateCheckEvidence,
  validateExecutionResult,
  refusal,
});
