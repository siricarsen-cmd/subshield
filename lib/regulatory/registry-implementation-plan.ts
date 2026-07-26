import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { RegulatoryRegistryChange } from "./registry-change-control";
import {
  fingerprintRegulatoryRegistryValue,
  getRegisteredCitationTemplate,
  getRegisteredHistoricalGroundingPolicy,
  getRegisteredRegulatoryMapping,
  type RegulatoryRegistryKind,
} from "./registry-integrity";
import {
  isReverifiedStoredRegulatoryChangeSetReviewReceipt,
  validateStoredRegulatoryChangeSetReviewRecord,
  type ReverifiedStoredRegulatoryChangeSetReviewReceipt,
  type StoredRegulatoryChangeSetReviewRecord,
} from "./stored-change-set-review";
import {
  validateVerifiedStoredRegulatoryChangeSetDraft,
  type VerifiedStoredRegulatoryChangeSetDraft,
} from "./stored-change-set-draft";

export interface RegulatoryRegistryImplementationStep {
  kind: RegulatoryRegistryKind;
  id: string;
  targetFile: string;
  currentFingerprint: string;
  proposedFingerprint: string;
  proposedValue: unknown;
  officialSourceIds: string[];
  officialSnapshotIds: string[];
  reason: string;
  benchmarkImpact: string[];
  regressionPlan: string[];
  applicationStatus: "not-applied";
}

export interface RegulatoryRegistryImplementationPlan {
  schemaVersion: 1;
  planId: string;
  sourceId: string;
  baseCommitSha: string;
  reviewRecordChecksum: string;
  reviewAuthorizationChecksum: string;
  draftId: string;
  draftChecksum: string;
  releaseRecordId: string;
  releaseRecordFingerprint: string;
  reviewerPrincipal: string;
  createdAt: string;
  preparedBy: string;
  targetBranch: string;
  steps: RegulatoryRegistryImplementationStep[];
  requiredChecks: string[];
  prohibitedActions: string[];
  authorizationStatus: "live-human-review-receipt-required";
  applicationStatus: "not-applied";
  customerFacingStatus: "benchmark-only";
  mergeStatus: "not-authorized";
  planChecksum: string;
}

export interface BuildRegulatoryRegistryImplementationPlanRequest {
  baseCommitSha: string;
  createdAt: string;
  preparedBy: string;
}

export interface StoreRegulatoryRegistryImplementationPlanResult {
  plan: Readonly<RegulatoryRegistryImplementationPlan>;
  planPath: string;
  relativePath: string;
}

const SHA256_RE = /^sha256:[a-f0-9]{64}$/;
const COMMIT_SHA_RE = /^[a-f0-9]{40}$/;
const SOURCE_ID_RE = /^[a-z0-9][a-z0-9-]*$/;
const PLAN_FILENAME_RE = /^[a-f0-9]{16}-implementation-plan\.json$/;
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;
const LIVE_AUTHORIZED_PLANS = new WeakSet<object>();

const TARGET_FILE_BY_KIND: Readonly<Record<RegulatoryRegistryKind, string>> = {
  mapping: "lib/regulatory/benchmark-applicability-mappings.ts",
  "historical-policy": "lib/regulatory/historical-grounding-policy.ts",
  "citation-template": "lib/regulatory/source-coverage-citation-packages.ts",
};

const REQUIRED_CHECKS = [
  "npm run test:regulatory",
  "npm run test:accuracy",
  "npx tsc --noEmit",
  "npm run build",
] as const;

const PROHIBITED_ACTIONS = [
  "Do not edit or apply registry values outside an explicit code-change pull request.",
  "Do not merge an implementation pull request without fresh required checks and deliberate merge authorization.",
  "Do not use this plan, its stored JSON, or its checksum as a replacement for live human authorization.",
  "Do not change customer reports, analyzer conclusions, payments, authentication, databases, or deployment configuration from this plan.",
] as const;

function jsonClone<T>(value: T): T {
  const serialized = JSON.stringify(value);
  if (serialized === undefined) throw new Error("Implementation plan value is not JSON serializable");
  return JSON.parse(serialized) as T;
}

function fingerprintJson(value: unknown): string {
  return fingerprintRegulatoryRegistryValue(jsonClone(value));
}

function deepFreeze<T>(value: T): Readonly<T> {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const nested of Object.values(value as Record<string, unknown>)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value as Readonly<T>;
}

function exactInstant(value: string, label: string): number {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString() !== value) {
    throw new Error(`${label} must be an exact ISO instant`);
  }
  return parsed.getTime();
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b)
  );
}

function currentRegistryFingerprint(kind: RegulatoryRegistryKind, id: string): string | undefined {
  return kind === "mapping"
    ? getRegisteredRegulatoryMapping(id)?.fingerprint
    : kind === "historical-policy"
      ? getRegisteredHistoricalGroundingPolicy(id)?.fingerprint
      : getRegisteredCitationTemplate(id)?.fingerprint;
}

function planPayload(
  plan:
    | Omit<RegulatoryRegistryImplementationPlan, "planChecksum">
    | RegulatoryRegistryImplementationPlan
): Omit<RegulatoryRegistryImplementationPlan, "planChecksum"> {
  const { planChecksum: _ignored, ...payload } = plan as RegulatoryRegistryImplementationPlan;
  return jsonClone(payload);
}

function checksumForPlan(
  plan:
    | Omit<RegulatoryRegistryImplementationPlan, "planChecksum">
    | RegulatoryRegistryImplementationPlan
): string {
  return fingerprintRegulatoryRegistryValue(planPayload(plan));
}

function buildStep(change: RegulatoryRegistryChange): RegulatoryRegistryImplementationStep {
  const currentFingerprint = currentRegistryFingerprint(change.kind, change.id);
  if (!currentFingerprint) {
    throw new Error(`Implementation plan cannot locate current ${change.kind} registry entry: ${change.id}`);
  }
  if (currentFingerprint !== change.beforeFingerprint) {
    throw new Error(
      `Implementation plan registry drift for ${change.kind}/${change.id}: expected ${change.beforeFingerprint}, observed ${currentFingerprint}`
    );
  }
  const proposedFingerprint = fingerprintJson(change.afterValue);
  if (proposedFingerprint !== change.afterFingerprint) {
    throw new Error(`Implementation plan proposed value fingerprint mismatch: ${change.kind}/${change.id}`);
  }
  if (proposedFingerprint === currentFingerprint) {
    throw new Error(`Implementation plan transition is a no-op: ${change.kind}/${change.id}`);
  }
  return {
    kind: change.kind,
    id: change.id,
    targetFile: TARGET_FILE_BY_KIND[change.kind],
    currentFingerprint,
    proposedFingerprint,
    proposedValue: jsonClone(change.afterValue),
    officialSourceIds: uniqueSorted(change.officialEvidence.map((item) => item.sourceId)),
    officialSnapshotIds: uniqueSorted(change.officialEvidence.map((item) => item.snapshotId)),
    reason: change.reason.trim(),
    benchmarkImpact: [...change.benchmarkImpact],
    regressionPlan: [...change.regressionPlan],
    applicationStatus: "not-applied",
  };
}

export function buildRegulatoryRegistryImplementationPlan(
  record: StoredRegulatoryChangeSetReviewRecord,
  reviewReceipt: ReverifiedStoredRegulatoryChangeSetReviewReceipt,
  draft: VerifiedStoredRegulatoryChangeSetDraft,
  request: BuildRegulatoryRegistryImplementationPlanRequest
): Readonly<RegulatoryRegistryImplementationPlan> {
  if (!isReverifiedStoredRegulatoryChangeSetReviewReceipt(reviewReceipt)) {
    throw new Error("Implementation plan requires a live opaque human-review authorization receipt");
  }
  const recordErrors = validateStoredRegulatoryChangeSetReviewRecord(record, draft);
  if (recordErrors.length > 0) {
    throw new Error(`Implementation plan review record is invalid: ${recordErrors.join("; ")}`);
  }
  const draftErrors = validateVerifiedStoredRegulatoryChangeSetDraft(draft);
  if (draftErrors.length > 0) {
    throw new Error(`Implementation plan draft is invalid: ${draftErrors.join("; ")}`);
  }
  if (
    record.decision !== "approved" ||
    record.decisionStatus !== "approved-for-explicit-implementation-pr" ||
    !record.releaseRecord ||
    !record.releaseRecordFingerprint ||
    !record.benchmarkValidation
  ) {
    throw new Error("Implementation plan requires a complete approved human review and release record");
  }
  if (
    reviewReceipt.reviewRecordChecksum !== record.reviewRecordChecksum ||
    reviewReceipt.draftChecksum !== draft.draftChecksum ||
    reviewReceipt.packetChecksum !== record.packetChecksum ||
    reviewReceipt.pairVerificationChecksum !== record.pairVerificationChecksum ||
    reviewReceipt.draftReverificationChecksum !== record.draftReverificationChecksum ||
    reviewReceipt.sourceId !== record.sourceId ||
    reviewReceipt.candidateSnapshotId !== record.candidateSnapshotId ||
    reviewReceipt.reviewerPrincipal !== record.reviewerPrincipal ||
    reviewReceipt.decision !== "approved"
  ) {
    throw new Error("Implementation plan review receipt does not match the approved evidence chain");
  }
  if (!COMMIT_SHA_RE.test(request.baseCommitSha)) {
    throw new Error("Implementation plan base commit must contain 40 lowercase hexadecimal characters");
  }
  if (request.baseCommitSha !== record.benchmarkValidation.commitSha) {
    throw new Error("Implementation plan base commit must equal the human-reviewed benchmark commit");
  }
  const preparedBy = request.preparedBy.replace(/\s+/g, " ").trim();
  if (!preparedBy) throw new Error("Implementation plan preparer must not be blank");
  const createdAt = exactInstant(request.createdAt, "Implementation plan createdAt");
  const reviewedAt = exactInstant(record.reviewedAt, "Implementation review timestamp");
  const releaseCreatedAt = exactInstant(
    record.releaseRecord.createdAt,
    "Implementation release-record timestamp"
  );
  if (createdAt < reviewedAt || createdAt < releaseCreatedAt) {
    throw new Error("Implementation plan cannot predate the human approval or release record");
  }
  if (createdAt > Date.now() + MAX_CLOCK_SKEW_MS) {
    throw new Error("Implementation plan timestamp cannot be in the future");
  }
  if (
    record.releaseRecordFingerprint !== fingerprintJson(record.releaseRecord) ||
    record.releaseRecord.changeSetId !== draft.draftId ||
    record.releaseRecord.transitions.length !== draft.changes.length
  ) {
    throw new Error("Implementation plan release record does not reproduce from the approved draft");
  }

  const steps = draft.changes.map(buildStep);
  for (let index = 0; index < steps.length; index++) {
    const release = record.releaseRecord.transitions[index];
    const step = steps[index];
    if (
      release.kind !== step.kind ||
      release.id !== step.id ||
      release.beforeFingerprint !== step.currentFingerprint ||
      release.afterFingerprint !== step.proposedFingerprint
    ) {
      throw new Error(`Implementation plan release transition mismatch: ${step.kind}/${step.id}`);
    }
  }

  const suffix = draft.draftChecksum.replace(/^sha256:/, "").slice(0, 12);
  const payload: Omit<RegulatoryRegistryImplementationPlan, "planChecksum"> = {
    schemaVersion: 1,
    planId: `regulatory-registry-implementation:${record.sourceId}:${record.reviewRecordChecksum}`,
    sourceId: record.sourceId,
    baseCommitSha: request.baseCommitSha,
    reviewRecordChecksum: record.reviewRecordChecksum,
    reviewAuthorizationChecksum: reviewReceipt.verificationChecksum,
    draftId: draft.draftId,
    draftChecksum: draft.draftChecksum,
    releaseRecordId: record.releaseRecord.releaseRecordId,
    releaseRecordFingerprint: record.releaseRecordFingerprint,
    reviewerPrincipal: record.reviewerPrincipal,
    createdAt: request.createdAt,
    preparedBy,
    targetBranch: `regulatory-update/${record.sourceId}/${suffix}`,
    steps,
    requiredChecks: [...REQUIRED_CHECKS],
    prohibitedActions: [...PROHIBITED_ACTIONS],
    authorizationStatus: "live-human-review-receipt-required",
    applicationStatus: "not-applied",
    customerFacingStatus: "benchmark-only",
    mergeStatus: "not-authorized",
  };
  const plan: RegulatoryRegistryImplementationPlan = {
    ...payload,
    planChecksum: checksumForPlan(payload),
  };
  const errors = validateRegulatoryRegistryImplementationPlan(plan, draft);
  if (errors.length > 0) {
    throw new Error(`Built implementation plan failed validation: ${errors.join("; ")}`);
  }
  const frozen = deepFreeze(plan);
  LIVE_AUTHORIZED_PLANS.add(frozen as object);
  return frozen;
}

export function validateRegulatoryRegistryImplementationPlan(
  plan: RegulatoryRegistryImplementationPlan,
  draft?: VerifiedStoredRegulatoryChangeSetDraft
): string[] {
  const errors: string[] = [];
  if (plan.schemaVersion !== 1) errors.push("Implementation plan schema version is invalid");
  if (!SOURCE_ID_RE.test(plan.sourceId)) errors.push("Implementation plan source ID is invalid");
  if (!COMMIT_SHA_RE.test(plan.baseCommitSha)) errors.push("Implementation plan base commit is invalid");
  if (
    !plan.planId.startsWith(`regulatory-registry-implementation:${plan.sourceId}:`) ||
    !SHA256_RE.test(plan.reviewRecordChecksum) ||
    !SHA256_RE.test(plan.reviewAuthorizationChecksum) ||
    !SHA256_RE.test(plan.draftChecksum) ||
    !SHA256_RE.test(plan.releaseRecordFingerprint)
  ) {
    errors.push("Implementation plan approval or draft provenance is invalid");
  }
  if (!plan.preparedBy.trim() || !plan.reviewerPrincipal.trim()) {
    errors.push("Implementation plan preparer or reviewer principal is blank");
  }
  try {
    exactInstant(plan.createdAt, "Implementation plan createdAt");
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }
  if (
    plan.targetBranch !==
    `regulatory-update/${plan.sourceId}/${plan.draftChecksum.replace(/^sha256:/, "").slice(0, 12)}`
  ) {
    errors.push("Implementation plan target branch is not deterministic");
  }
  if (!Array.isArray(plan.steps) || plan.steps.length === 0) {
    errors.push("Implementation plan contains no registry steps");
  } else {
    const identities = new Set<string>();
    for (const step of plan.steps) {
      const identity = `${step.kind}:${step.id}`;
      if (identities.has(identity)) errors.push(`Implementation plan contains duplicate step: ${identity}`);
      identities.add(identity);
      if (step.targetFile !== TARGET_FILE_BY_KIND[step.kind]) {
        errors.push(`Implementation plan target file is invalid: ${identity}`);
      }
      if (
        !SHA256_RE.test(step.currentFingerprint) ||
        !SHA256_RE.test(step.proposedFingerprint) ||
        step.currentFingerprint === step.proposedFingerprint ||
        fingerprintJson(step.proposedValue) !== step.proposedFingerprint
      ) {
        errors.push(`Implementation plan step fingerprint is invalid: ${identity}`);
      }
      if (
        step.officialSourceIds.length === 0 ||
        step.officialSnapshotIds.length === 0 ||
        !step.reason.trim() ||
        step.benchmarkImpact.length === 0 ||
        step.regressionPlan.length === 0 ||
        step.applicationStatus !== "not-applied"
      ) {
        errors.push(`Implementation plan step evidence or safeguards are incomplete: ${identity}`);
      }
    }
  }
  if (
    fingerprintJson(plan.requiredChecks) !== fingerprintJson(REQUIRED_CHECKS) ||
    fingerprintJson(plan.prohibitedActions) !== fingerprintJson(PROHIBITED_ACTIONS) ||
    plan.authorizationStatus !== "live-human-review-receipt-required" ||
    plan.applicationStatus !== "not-applied" ||
    plan.customerFacingStatus !== "benchmark-only" ||
    plan.mergeStatus !== "not-authorized"
  ) {
    errors.push("Implementation plan escaped its non-applied, non-mergeable boundary");
  }
  if (!SHA256_RE.test(plan.planChecksum) || plan.planChecksum !== checksumForPlan(plan)) {
    errors.push("Implementation plan checksum does not reproduce");
  }
  if (draft) {
    if (
      plan.draftId !== draft.draftId ||
      plan.draftChecksum !== draft.draftChecksum ||
      plan.sourceId !== draft.sourceId ||
      plan.steps.length !== draft.changes.length
    ) {
      errors.push("Implementation plan does not match the verified draft");
    }
  }
  const serialized = JSON.stringify(plan);
  if (
    serialized.includes('"text":') ||
    serialized.includes('"rawBody":') ||
    serialized.includes('"customerContract":')
  ) {
    errors.push("Implementation plan contains prohibited source or customer payloads");
  }
  return [...new Set(errors)];
}

export function isLiveAuthorizedRegulatoryRegistryImplementationPlan(
  value: unknown
): value is RegulatoryRegistryImplementationPlan {
  if (!value || typeof value !== "object" || !LIVE_AUTHORIZED_PLANS.has(value as object)) {
    return false;
  }
  const plan = value as RegulatoryRegistryImplementationPlan;
  return validateRegulatoryRegistryImplementationPlan(plan).length === 0;
}

function relativePlanPath(plan: RegulatoryRegistryImplementationPlan): string {
  const suffix = plan.reviewRecordChecksum.replace(/^sha256:/, "").slice(0, 16);
  return path.posix.join(plan.sourceId, `${suffix}-implementation-plan.json`);
}

function resolveContainedPlanPath(
  outputRoot: string,
  relativePath: string,
  expectedSourceId?: string
): string {
  if (
    !relativePath ||
    path.isAbsolute(relativePath) ||
    relativePath.includes("\\") ||
    path.posix.normalize(relativePath) !== relativePath
  ) {
    throw new Error(`Unsafe implementation plan path: ${relativePath}`);
  }
  const segments = relativePath.split("/");
  if (
    segments.length !== 2 ||
    !SOURCE_ID_RE.test(segments[0]) ||
    !PLAN_FILENAME_RE.test(segments[1])
  ) {
    throw new Error(`Invalid implementation plan path shape: ${relativePath}`);
  }
  if (expectedSourceId && expectedSourceId !== segments[0]) {
    throw new Error(
      `Implementation plan path source mismatch: expected ${expectedSourceId}, observed ${segments[0]}`
    );
  }
  const root = path.resolve(outputRoot);
  const absolute = path.resolve(root, ...segments);
  if (!absolute.startsWith(`${root}${path.sep}`)) {
    throw new Error(`Implementation plan path escapes the controlled root: ${relativePath}`);
  }
  return absolute;
}

export async function storeRegulatoryRegistryImplementationPlan(
  outputRoot: string,
  plan: RegulatoryRegistryImplementationPlan
): Promise<StoreRegulatoryRegistryImplementationPlanResult> {
  const errors = validateRegulatoryRegistryImplementationPlan(plan);
  if (errors.length > 0) {
    throw new Error(`Implementation plan cannot be stored: ${errors.join("; ")}`);
  }
  const relativePath = relativePlanPath(plan);
  const planPath = resolveContainedPlanPath(outputRoot, relativePath, plan.sourceId);
  await mkdir(path.dirname(planPath), { recursive: true });
  await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`, {
    encoding: "utf8",
    flag: "wx",
  });
  return { plan: deepFreeze(jsonClone(plan)), planPath, relativePath };
}

export async function loadRegulatoryRegistryImplementationPlan(
  outputRoot: string,
  relativePath: string,
  expectedSourceId?: string
): Promise<Readonly<RegulatoryRegistryImplementationPlan>> {
  const planPath = resolveContainedPlanPath(outputRoot, relativePath, expectedSourceId);
  const plan = JSON.parse(await readFile(planPath, "utf8")) as RegulatoryRegistryImplementationPlan;
  const errors = validateRegulatoryRegistryImplementationPlan(plan);
  if (errors.length > 0) {
    throw new Error(`Stored implementation plan failed validation: ${errors.join("; ")}`);
  }
  if (relativePlanPath(plan) !== relativePath) {
    throw new Error("Stored implementation plan path does not match its review-bound identity");
  }
  return deepFreeze(plan);
}
