import { createHash } from "node:crypto";
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

const EXPECTED_REPOSITORY = "siricarsen-cmd/subshield";
const EXPECTED_DEFAULT_BRANCH = "main";
const CHECKSUM_RE = /^sha256:[a-f0-9]{64}$/;
const COMMIT_SHA_RE = /^[a-f0-9]{40}$/;
const GITHUB_LOGIN_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;
const AUDIT_FILENAME_RE = /^[a-f0-9]{24}-invocation-audit\.json$/;
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;
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
  confirmationFingerprint: string;
  authorizationStatus: "live-one-use-operator-authorization";
  authorizationChecksum: string;
}

export interface RegulatoryImplementationInvocationAuditRecord extends InvocationBoundary {
  schemaVersion: 1;
  auditId: string;
  authorizationId: string;
  authorizationChecksum: string;
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

function auditPayload(
  audit:
    | Omit<RegulatoryImplementationInvocationAuditRecord, "auditChecksum">
    | RegulatoryImplementationInvocationAuditRecord
): Omit<RegulatoryImplementationInvocationAuditRecord, "auditChecksum"> {
  const { auditChecksum: _ignored, ...payload } =
    audit as RegulatoryImplementationInvocationAuditRecord;
  return jsonClone(payload);
}

function checksumForAudit(
  audit:
    | Omit<RegulatoryImplementationInvocationAuditRecord, "auditChecksum">
    | RegulatoryImplementationInvocationAuditRecord
): string {
  return fingerprint(auditPayload(audit));
}

function runtimeFingerprintFor(
  options: RegulatoryImplementationProductionOptions,
  auditOutputDirectory: string
): string {
  return fingerprint({
    repositoryRoot: options.repositoryRoot,
    gitExecutable: options.gitExecutable,
    githubCliExecutable: options.githubCliExecutable,
    githubCliConfigDir: options.githubCliConfigDir,
    auditOutputDirectory,
    expectedGitHubLogin: options.expectedGitHubLogin,
  });
}

export function buildRegulatoryImplementationInvocationConfirmation(
  plan: RegulatoryRegistryImplementationPlan,
  bundle: RegulatoryImplementationPullRequestBundle
): string {
  return [
    "AUTHORIZE SUBSHIELD REGULATORY IMPLEMENTATION PR",
    `plan=${plan.planChecksum}`,
    `bundle=${bundle.bundleChecksum}`,
    `base=${plan.baseCommitSha}`,
    `branch=${plan.targetBranch}`,
  ].join(" ");
}

export function validateRegulatoryImplementationInvocationAuthorization(
  authorization: RegulatoryImplementationInvocationAuthorization
): string[] {
  const errors: string[] = [];
  if (authorization.schemaVersion !== 1) errors.push("Invocation authorization schema is invalid");
  if (!authorization.authorizationId.startsWith("regulatory-implementation-invocation:")) {
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
  if (authorizedAtMs < new Date(plan.createdAt).getTime()) {
    throw new Error("Invocation authorization cannot predate the live implementation plan");
  }
  if (authorizedAtMs > Date.now() + MAX_CLOCK_SKEW_MS) {
    throw new Error("Invocation authorization cannot be materially in the future");
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
  const expectedConfirmation = buildRegulatoryImplementationInvocationConfirmation(plan, bundle);
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
  const runtimeFingerprint = runtimeFingerprintFor(productionOptions, auditOutputDirectory);
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
  });
  return frozen;
}

export function validateRegulatoryImplementationInvocationAuditRecord(
  audit: RegulatoryImplementationInvocationAuditRecord
): string[] {
  const errors: string[] = [];
  if (audit.schemaVersion !== 1) errors.push("Invocation audit schema is invalid");
  if (!audit.auditId.startsWith("regulatory-implementation-audit:")) {
    errors.push("Invocation audit ID is invalid");
  }
  if (
    audit.repositoryFullName !== EXPECTED_REPOSITORY ||
    !audit.authorizationId.trim() ||
    !CHECKSUM_RE.test(audit.authorizationChecksum) ||
    !CHECKSUM_RE.test(audit.planChecksum) ||
    !CHECKSUM_RE.test(audit.bundleChecksum) ||
    !COMMIT_SHA_RE.test(audit.baseCommitSha) ||
    !audit.targetBranch.trim()
  ) {
    errors.push("Invocation audit provenance is invalid");
  }
  try {
    exactInstant(audit.authorizedAt, "Invocation audit authorizedAt");
    exactInstant(audit.recordedAt, "Invocation audit recordedAt");
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
  if (!audit.result || typeof audit.result !== "object" || !("status" in audit.result)) {
    errors.push("Invocation audit result is invalid");
  }
  if (!CHECKSUM_RE.test(audit.auditChecksum) || audit.auditChecksum !== checksumForAudit(audit)) {
    errors.push("Invocation audit checksum does not reproduce");
  }
  return [...new Set(errors)];
}

function buildAuditRecord(
  authorization: RegulatoryImplementationInvocationAuthorization,
  result: RegulatoryImplementationProductionResult
): Readonly<RegulatoryImplementationInvocationAuditRecord> {
  const payload: Omit<RegulatoryImplementationInvocationAuditRecord, "auditChecksum"> = {
    schemaVersion: 1,
    auditId: `regulatory-implementation-audit:${authorization.authorizationChecksum}`,
    authorizationId: authorization.authorizationId,
    authorizationChecksum: authorization.authorizationChecksum,
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
  const audit: RegulatoryImplementationInvocationAuditRecord = {
    ...payload,
    auditChecksum: checksumForAudit(payload),
  };
  const errors = validateRegulatoryImplementationInvocationAuditRecord(audit);
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
    binding.auditOutputDirectory
  );
  if (
    authorization.runtimeFingerprint !== runtimeFingerprint ||
    authorization.planChecksum !== plan.planChecksum ||
    authorization.bundleChecksum !== bundle.bundleChecksum
  ) {
    return refusal("Invocation authorization binding no longer matches");
  }

  CONSUMED_AUTHORIZATIONS.add(authorization as object);
  const productionResult = await executeRegulatoryImplementationWithProductionAdapter(
    plan,
    bundle,
    binding.productionOptions
  );
  let auditRecord: Readonly<RegulatoryImplementationInvocationAuditRecord>;
  try {
    auditRecord = buildAuditRecord(authorization, productionResult);
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
  runtimeFingerprintFor,
  auditFilename,
  refusal,
});
