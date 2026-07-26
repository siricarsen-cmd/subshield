import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { RegulatoryRegistryReleaseRecord } from "./registry-change-control";
import { fingerprintRegulatoryRegistryValue } from "./registry-integrity";
import {
  isReverifiedStoredRegulatoryChangeSetDraftReceipt,
  reverifyStoredRegulatoryChangeSetDraft,
  validateVerifiedStoredRegulatoryChangeSetDraft,
  type ReverifiedStoredRegulatoryChangeSetDraftReceipt,
  type VerifiedStoredRegulatoryChangeSetDraft,
} from "./stored-change-set-draft";
import {
  validateRegulatoryUpdateReviewPacket,
  type RegulatoryUpdateReviewPacket,
} from "./update-review-packet";
import {
  isVerifiedStoredRegulatoryUpdatePair,
  type VerifiedStoredRegulatoryUpdatePair,
} from "./verified-stored-update-pair";

export type StoredRegulatoryChangeSetReviewDecision = "approved" | "rejected";
export type StoredRegulatoryChangeSetReviewKind =
  | "mapping"
  | "historical-policy"
  | "citation-template";

export interface RegulatoryBenchmarkValidationAttestation {
  evidenceStatus: "reviewer-attested-not-machine-verified";
  repository: "siricarsen-cmd/subshield";
  commitSha: string;
  regulatoryWorkflowRunId: number;
  analyzerWorkflowRunId: number;
  completedAt: string;
  regulatoryConclusion: "success";
  analyzerConclusion: "success";
}

export interface StoredRegulatoryChangeSetReviewRequest {
  decision: StoredRegulatoryChangeSetReviewDecision;
  reviewedBy: string;
  reviewerPrincipal: string;
  reviewedAt: string;
  reviewNotes: string[];
  reviewedKinds: StoredRegulatoryChangeSetReviewKind[];
  benchmarkValidation?: RegulatoryBenchmarkValidationAttestation;
  releaseCreatedAt?: string;
}

export interface StoredRegulatoryChangeSetReviewRecord {
  schemaVersion: 1;
  reviewRecordId: string;
  draftId: string;
  draftChecksum: string;
  sourceId: string;
  baselineSnapshotId: string;
  candidateSnapshotId: string;
  packetId: string;
  packetChecksum: string;
  pairVerificationChecksum: string;
  draftReverificationChecksum: string;
  decision: StoredRegulatoryChangeSetReviewDecision;
  reviewedBy: string;
  reviewerPrincipal: string;
  reviewedAt: string;
  reviewNotes: string[];
  reviewedKinds: StoredRegulatoryChangeSetReviewKind[];
  sourceReviewedBy: string;
  sourceReviewerPrincipal: string;
  draftRequestedBy: string;
  draftRequesterPrincipal: string;
  benchmarkValidation?: RegulatoryBenchmarkValidationAttestation;
  releaseRecord?: RegulatoryRegistryReleaseRecord;
  releaseRecordFingerprint?: string;
  decisionStatus: "approved-for-explicit-implementation-pr" | "rejected-final";
  applicationStatus: "not-applied";
  customerFacingStatus: "benchmark-only";
  implementationStatus: "requires-explicit-code-change-pr";
  reviewRecordChecksum: string;
}

export interface ReverifiedStoredRegulatoryChangeSetReviewReceipt {
  verificationVersion: 1;
  reviewRecordChecksum: string;
  draftChecksum: string;
  packetChecksum: string;
  pairVerificationChecksum: string;
  draftReverificationChecksum: string;
  sourceId: string;
  candidateSnapshotId: string;
  reviewerPrincipal: string;
  decision: StoredRegulatoryChangeSetReviewDecision;
  verificationChecksum: string;
}

export interface StoreStoredRegulatoryChangeSetReviewRecordResult {
  record: Readonly<StoredRegulatoryChangeSetReviewRecord>;
  recordPath: string;
  relativePath: string;
}

const REVIEW_KINDS: readonly StoredRegulatoryChangeSetReviewKind[] = [
  "mapping",
  "historical-policy",
  "citation-template",
];
const REVIEW_KIND_SET = new Set<string>(REVIEW_KINDS);
const SOURCE_ID_RE = /^[a-z0-9][a-z0-9-]*$/;
const REVIEW_FILENAME_RE = /^[a-f0-9]{16}-review\.json$/;
const SHA256_RE = /^sha256:[a-f0-9]{64}$/;
const COMMIT_SHA_RE = /^[a-f0-9]{40}$/;
const PRINCIPAL_RE = /^[a-z0-9][a-z0-9 ._@'+-]{1,158}$/i;
const AUTOMATION_REVIEWER_RE = /(?:bot|automation|github[ -]?actions|workflow|monitor|preparer)/i;
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;
const HUMAN_REVIEWED_RECORDS = new WeakSet<object>();
const REVERIFIED_REVIEWS = new WeakSet<object>();

function jsonClone<T>(value: T): T {
  const serialized = JSON.stringify(value);
  if (serialized === undefined) {
    throw new Error("Stored change-set review value is not JSON serializable");
  }
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

function normalizePrincipal(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function validatePrincipalValue(value: string, label: string): string {
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (
    !trimmed ||
    !PRINCIPAL_RE.test(trimmed) ||
    /[,;|()]/.test(trimmed) ||
    /\s[-–—]\s/.test(trimmed)
  ) {
    throw new Error(`${label} must be a stable reviewer principal without role suffixes`);
  }
  return normalizePrincipal(trimmed);
}

function principalFromDisplayLabel(value: string, label: string): string {
  const display = value.replace(/\s+/g, " ").trim();
  if (!display) throw new Error(`${label} must not be blank`);
  const principal = display.split(/[,;|()]|\s[-–—]\s/, 1)[0]?.trim() ?? "";
  return validatePrincipalValue(principal, label);
}

function uniqueNonblank(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function canonicalReviewKinds(
  values: readonly StoredRegulatoryChangeSetReviewKind[]
): StoredRegulatoryChangeSetReviewKind[] {
  const unique = new Set(values);
  return REVIEW_KINDS.filter((kind) => unique.has(kind));
}

function reviewRecordPayload(
  record:
    | Omit<StoredRegulatoryChangeSetReviewRecord, "reviewRecordChecksum">
    | StoredRegulatoryChangeSetReviewRecord
): Omit<StoredRegulatoryChangeSetReviewRecord, "reviewRecordChecksum"> {
  const { reviewRecordChecksum: _ignored, ...payload } =
    record as StoredRegulatoryChangeSetReviewRecord;
  return jsonClone(payload);
}

function checksumForReviewRecord(
  record:
    | Omit<StoredRegulatoryChangeSetReviewRecord, "reviewRecordChecksum">
    | StoredRegulatoryChangeSetReviewRecord
): string {
  return fingerprintRegulatoryRegistryValue(reviewRecordPayload(record));
}

function validateBenchmarkAttestation(
  attestation: RegulatoryBenchmarkValidationAttestation | undefined,
  draftCreatedAt: number,
  reviewedAt: number,
  errors: string[]
): void {
  if (!attestation) {
    errors.push("Approved stored change-set review requires benchmark validation attestation");
    return;
  }
  if (attestation.evidenceStatus !== "reviewer-attested-not-machine-verified") {
    errors.push("Benchmark validation evidence status is invalid");
  }
  if (attestation.repository !== "siricarsen-cmd/subshield") {
    errors.push("Benchmark validation repository is invalid");
  }
  if (!COMMIT_SHA_RE.test(attestation.commitSha)) {
    errors.push("Benchmark validation commit SHA must contain 40 lowercase hexadecimal characters");
  }
  if (
    !Number.isSafeInteger(attestation.regulatoryWorkflowRunId) ||
    attestation.regulatoryWorkflowRunId <= 0 ||
    !Number.isSafeInteger(attestation.analyzerWorkflowRunId) ||
    attestation.analyzerWorkflowRunId <= 0
  ) {
    errors.push("Benchmark validation workflow run IDs must be positive safe integers");
  }
  if (attestation.regulatoryWorkflowRunId === attestation.analyzerWorkflowRunId) {
    errors.push("Regulatory and analyzer benchmark workflow run IDs must be distinct");
  }
  if (
    attestation.regulatoryConclusion !== "success" ||
    attestation.analyzerConclusion !== "success"
  ) {
    errors.push("Both regulatory and analyzer benchmark conclusions must be success");
  }
  try {
    const completedAt = exactInstant(attestation.completedAt, "Benchmark validation completedAt");
    if (completedAt < draftCreatedAt || completedAt > reviewedAt) {
      errors.push("Benchmark validation must complete after draft creation and no later than review");
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }
}

function buildReleaseRecord(
  draft: VerifiedStoredRegulatoryChangeSetDraft,
  request: StoredRegulatoryChangeSetReviewRequest
): RegulatoryRegistryReleaseRecord {
  const createdAt = request.releaseCreatedAt as string;
  return deepFreeze({
    releaseRecordId: `${draft.draftId}:release:${createdAt}`,
    changeSetId: draft.draftId,
    approvedAt: request.reviewedAt,
    approvedBy: request.reviewedBy.trim(),
    reviewNotes: request.reviewNotes.map((note) => note.trim()),
    transitions: draft.changes.map((change) => ({
      kind: change.kind,
      id: change.id,
      beforeFingerprint: change.beforeFingerprint,
      afterFingerprint: change.afterFingerprint,
      officialSourceIds: uniqueNonblank(
        change.officialEvidence.map((evidence) => evidence.sourceId)
      ).sort((left, right) => left.localeCompare(right)),
      reason: change.reason,
      benchmarkImpact: [...change.benchmarkImpact],
      regressionPlan: [...change.regressionPlan],
    })),
    applicationStatus: "not-applied",
    customerFacingStatus: "benchmark-only",
    createdAt,
  });
}

function validateReleaseRecordAgainstDraft(
  record: StoredRegulatoryChangeSetReviewRecord,
  draft: VerifiedStoredRegulatoryChangeSetDraft | undefined,
  errors: string[]
): void {
  if (record.decision === "rejected") {
    if (record.releaseRecord !== undefined || record.releaseRecordFingerprint !== undefined) {
      errors.push("Rejected stored change-set reviews must not contain release records");
    }
    return;
  }
  const release = record.releaseRecord;
  if (!release) {
    errors.push("Approved stored change-set review requires a release record");
    return;
  }
  if (
    release.releaseRecordId !== `${record.draftId}:release:${release.createdAt}` ||
    release.changeSetId !== record.draftId ||
    release.approvedAt !== record.reviewedAt ||
    release.approvedBy !== record.reviewedBy ||
    fingerprintJson(release.reviewNotes) !== fingerprintJson(record.reviewNotes) ||
    release.applicationStatus !== "not-applied" ||
    release.customerFacingStatus !== "benchmark-only"
  ) {
    errors.push("Approved stored change-set release record does not match its review envelope");
  }
  if (record.releaseRecordFingerprint !== fingerprintJson(release)) {
    errors.push("Stored change-set release-record fingerprint does not reproduce");
  }
  try {
    const reviewedAt = exactInstant(record.reviewedAt, "Stored change-set reviewedAt");
    const releasedAt = exactInstant(release.createdAt, "Stored change-set release createdAt");
    if (releasedAt < reviewedAt) {
      errors.push("Stored change-set release record cannot predate approval");
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }
  if (!draft) return;
  if (release.transitions.length !== draft.changes.length) {
    errors.push("Stored change-set release transition count does not match the draft");
    return;
  }
  for (let index = 0; index < draft.changes.length; index++) {
    const change = draft.changes[index];
    const transition = release.transitions[index];
    const expectedSourceIds = uniqueNonblank(
      change.officialEvidence.map((evidence) => evidence.sourceId)
    ).sort((left, right) => left.localeCompare(right));
    if (
      transition.kind !== change.kind ||
      transition.id !== change.id ||
      transition.beforeFingerprint !== change.beforeFingerprint ||
      transition.afterFingerprint !== change.afterFingerprint ||
      fingerprintJson(transition.officialSourceIds) !== fingerprintJson(expectedSourceIds) ||
      transition.reason !== change.reason ||
      fingerprintJson(transition.benchmarkImpact) !== fingerprintJson(change.benchmarkImpact) ||
      fingerprintJson(transition.regressionPlan) !== fingerprintJson(change.regressionPlan)
    ) {
      errors.push(`Stored change-set release transition does not match draft change: ${change.id}`);
    }
  }
}

export function buildStoredRegulatoryChangeSetReviewRecord(
  draft: VerifiedStoredRegulatoryChangeSetDraft,
  packet: RegulatoryUpdateReviewPacket,
  pair: VerifiedStoredRegulatoryUpdatePair,
  draftReceipt: ReverifiedStoredRegulatoryChangeSetDraftReceipt,
  request: StoredRegulatoryChangeSetReviewRequest
): Readonly<StoredRegulatoryChangeSetReviewRecord> {
  const draftErrors = validateVerifiedStoredRegulatoryChangeSetDraft(draft);
  if (draftErrors.length > 0) {
    throw new Error(`Stored change-set review draft is invalid: ${draftErrors.join("; ")}`);
  }
  const packetErrors = validateRegulatoryUpdateReviewPacket(packet);
  if (packetErrors.length > 0) {
    throw new Error(`Stored change-set review packet is invalid: ${packetErrors.join("; ")}`);
  }
  if (!isVerifiedStoredRegulatoryUpdatePair(pair)) {
    throw new Error("Stored change-set review requires an opaque verified source pair");
  }
  if (!isReverifiedStoredRegulatoryChangeSetDraftReceipt(draftReceipt)) {
    throw new Error("Stored change-set review requires an opaque draft reverification receipt");
  }
  const reproducedReceipt = reverifyStoredRegulatoryChangeSetDraft(draft, packet, pair);
  if (
    fingerprintJson(reproducedReceipt) !== fingerprintJson(draftReceipt) ||
    draftReceipt.draftChecksum !== draft.draftChecksum ||
    draftReceipt.packetChecksum !== packet.packetChecksum ||
    draftReceipt.pairVerificationChecksum !== pair.verificationChecksum
  ) {
    throw new Error("Stored change-set review receipt does not match current verified evidence");
  }
  if (
    draft.sourceId !== pair.sourceId ||
    draft.baselineSnapshotId !== pair.baselineSnapshotId ||
    draft.candidateSnapshotId !== pair.candidateSnapshotId ||
    draft.packetId !== packet.packetId
  ) {
    throw new Error("Stored change-set review provenance does not align across draft, packet, and pair");
  }

  const reviewedBy = request.reviewedBy.replace(/\s+/g, " ").trim();
  if (!reviewedBy || AUTOMATION_REVIEWER_RE.test(reviewedBy)) {
    throw new Error("Stored change-set review requires an identified non-automated reviewer");
  }
  const reviewerPrincipal = validatePrincipalValue(
    request.reviewerPrincipal,
    "Stored change-set reviewer principal"
  );
  const labelPrincipal = principalFromDisplayLabel(reviewedBy, "Stored change-set reviewer label");
  if (reviewerPrincipal !== labelPrincipal) {
    throw new Error("Stored change-set reviewer principal does not match the reviewer display label");
  }

  const sourceReviewedBy = pair.candidate.reviewedBy?.replace(/\s+/g, " ").trim();
  if (!sourceReviewedBy) {
    throw new Error("Stored change-set review requires retained source-review provenance");
  }
  const sourceReviewerPrincipal = principalFromDisplayLabel(
    sourceReviewedBy,
    "Stored source reviewer label"
  );
  const draftRequestedBy = draft.requestedBy.replace(/\s+/g, " ").trim();
  const draftRequesterPrincipal = principalFromDisplayLabel(
    draftRequestedBy,
    "Stored change-set draft requester label"
  );
  if (
    reviewerPrincipal === sourceReviewerPrincipal ||
    reviewerPrincipal === draftRequesterPrincipal
  ) {
    throw new Error(
      "Stored change-set reviewer principal must be independent from the source reviewer and draft preparer"
    );
  }

  const draftCreatedAt = exactInstant(draft.createdAt, "Stored change-set draft createdAt");
  const reviewedAt = exactInstant(request.reviewedAt, "Stored change-set review timestamp");
  if (reviewedAt < draftCreatedAt) {
    throw new Error("Stored change-set review cannot predate draft creation");
  }
  if (reviewedAt > Date.now() + MAX_CLOCK_SKEW_MS) {
    throw new Error("Stored change-set review timestamp cannot be in the future");
  }

  const reviewNotes = request.reviewNotes.map((note) => note.trim());
  if (reviewNotes.length === 0 || reviewNotes.some((note) => !note)) {
    throw new Error("Stored change-set review requires substantive nonblank notes");
  }
  if (request.decision === "approved" && reviewNotes.length < 2) {
    throw new Error("Stored change-set approval requires at least two substantive review notes");
  }

  if (
    request.reviewedKinds.length === 0 ||
    request.reviewedKinds.some((kind) => !REVIEW_KIND_SET.has(kind)) ||
    new Set(request.reviewedKinds).size !== request.reviewedKinds.length
  ) {
    throw new Error("Stored change-set reviewed kinds must be distinct recognized registry kinds");
  }
  const reviewedKinds = canonicalReviewKinds(request.reviewedKinds);
  if (
    request.decision === "approved" &&
    reviewedKinds.join("|") !== draft.requiredHumanReviewKinds.join("|")
  ) {
    throw new Error(
      "Stored change-set approval requires explicit review of mapping, historical-policy, and citation-template impacts"
    );
  }

  let releaseRecord: RegulatoryRegistryReleaseRecord | undefined;
  let releaseRecordFingerprint: string | undefined;
  if (request.decision === "approved") {
    const benchmarkErrors: string[] = [];
    validateBenchmarkAttestation(
      request.benchmarkValidation,
      draftCreatedAt,
      reviewedAt,
      benchmarkErrors
    );
    if (benchmarkErrors.length > 0) {
      throw new Error(`Stored change-set benchmark attestation is invalid: ${benchmarkErrors.join("; ")}`);
    }
    if (!request.releaseCreatedAt) {
      throw new Error("Stored change-set approval requires an explicit releaseCreatedAt timestamp");
    }
    const releaseCreatedAt = exactInstant(
      request.releaseCreatedAt,
      "Stored change-set release createdAt"
    );
    if (releaseCreatedAt < reviewedAt) {
      throw new Error("Stored change-set release record cannot predate approval");
    }
    if (releaseCreatedAt > Date.now() + MAX_CLOCK_SKEW_MS) {
      throw new Error("Stored change-set release timestamp cannot be in the future");
    }
    releaseRecord = buildReleaseRecord(draft, request);
    releaseRecordFingerprint = fingerprintJson(releaseRecord);
  } else if (request.benchmarkValidation || request.releaseCreatedAt) {
    throw new Error("Rejected stored change-set reviews must not claim release or benchmark approval evidence");
  }

  const payload: Omit<StoredRegulatoryChangeSetReviewRecord, "reviewRecordChecksum"> = {
    schemaVersion: 1,
    reviewRecordId: `stored-regulatory-change-set-review:${draft.sourceId}:${draft.draftChecksum}`,
    draftId: draft.draftId,
    draftChecksum: draft.draftChecksum,
    sourceId: draft.sourceId,
    baselineSnapshotId: draft.baselineSnapshotId,
    candidateSnapshotId: draft.candidateSnapshotId,
    packetId: draft.packetId,
    packetChecksum: draft.packetChecksum,
    pairVerificationChecksum: pair.verificationChecksum,
    draftReverificationChecksum: draftReceipt.verificationChecksum,
    decision: request.decision,
    reviewedBy,
    reviewerPrincipal,
    reviewedAt: request.reviewedAt,
    reviewNotes,
    reviewedKinds,
    sourceReviewedBy,
    sourceReviewerPrincipal,
    draftRequestedBy,
    draftRequesterPrincipal,
    benchmarkValidation: request.benchmarkValidation
      ? jsonClone(request.benchmarkValidation)
      : undefined,
    releaseRecord,
    releaseRecordFingerprint,
    decisionStatus:
      request.decision === "approved"
        ? "approved-for-explicit-implementation-pr"
        : "rejected-final",
    applicationStatus: "not-applied",
    customerFacingStatus: "benchmark-only",
    implementationStatus: "requires-explicit-code-change-pr",
  };
  const record: StoredRegulatoryChangeSetReviewRecord = {
    ...payload,
    reviewRecordChecksum: checksumForReviewRecord(payload),
  };
  const errors = validateStoredRegulatoryChangeSetReviewRecord(record, draft);
  if (errors.length > 0) {
    throw new Error(`Built stored change-set review record failed validation: ${errors.join("; ")}`);
  }
  const frozen = deepFreeze(record);
  HUMAN_REVIEWED_RECORDS.add(frozen as object);
  return frozen;
}

export function validateStoredRegulatoryChangeSetReviewRecord(
  record: StoredRegulatoryChangeSetReviewRecord,
  draft?: VerifiedStoredRegulatoryChangeSetDraft
): string[] {
  const errors: string[] = [];
  if (record.schemaVersion !== 1) errors.push("Stored change-set review schema version is invalid");
  if (!SOURCE_ID_RE.test(record.sourceId)) errors.push("Stored change-set review source ID is invalid");
  if (
    record.reviewRecordId !==
    `stored-regulatory-change-set-review:${record.sourceId}:${record.draftChecksum}`
  ) {
    errors.push("Stored change-set review ID does not match its source and draft checksum");
  }
  if (!record.draftId.trim() || !SHA256_RE.test(record.draftChecksum)) {
    errors.push("Stored change-set review draft provenance is invalid");
  }
  if (
    !record.baselineSnapshotId.trim() ||
    !record.candidateSnapshotId.startsWith(`${record.sourceId}:`) ||
    record.baselineSnapshotId === record.candidateSnapshotId
  ) {
    errors.push("Stored change-set review snapshot provenance is invalid");
  }
  if (
    !record.packetId.startsWith(`regulatory-update-review:${record.sourceId}:`) ||
    !SHA256_RE.test(record.packetChecksum) ||
    !SHA256_RE.test(record.pairVerificationChecksum) ||
    !SHA256_RE.test(record.draftReverificationChecksum)
  ) {
    errors.push("Stored change-set review packet or opaque verification provenance is invalid");
  }
  if (record.decision !== "approved" && record.decision !== "rejected") {
    errors.push("Stored change-set review decision is invalid");
  }
  if (!record.reviewedBy.trim() || AUTOMATION_REVIEWER_RE.test(record.reviewedBy)) {
    errors.push("Stored change-set review requires a non-automated reviewer");
  }
  try {
    const reviewerPrincipal = validatePrincipalValue(
      record.reviewerPrincipal,
      "Stored change-set reviewer principal"
    );
    const labelPrincipal = principalFromDisplayLabel(
      record.reviewedBy,
      "Stored change-set reviewer label"
    );
    const sourcePrincipal = principalFromDisplayLabel(
      record.sourceReviewedBy,
      "Stored source reviewer label"
    );
    const draftPrincipal = principalFromDisplayLabel(
      record.draftRequestedBy,
      "Stored change-set draft requester label"
    );
    if (
      reviewerPrincipal !== labelPrincipal ||
      sourcePrincipal !== record.sourceReviewerPrincipal ||
      draftPrincipal !== record.draftRequesterPrincipal
    ) {
      errors.push("Stored change-set reviewer principal provenance does not reproduce");
    }
    if (reviewerPrincipal === sourcePrincipal || reviewerPrincipal === draftPrincipal) {
      errors.push("Stored change-set reviewer principal is not independent");
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }
  try {
    exactInstant(record.reviewedAt, "Stored change-set review timestamp");
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }
  if (record.reviewNotes.length === 0 || record.reviewNotes.some((note) => !note.trim())) {
    errors.push("Stored change-set review notes must be nonblank");
  }
  if (
    record.reviewedKinds.length === 0 ||
    record.reviewedKinds.some((kind) => !REVIEW_KIND_SET.has(kind)) ||
    new Set(record.reviewedKinds).size !== record.reviewedKinds.length ||
    canonicalReviewKinds(record.reviewedKinds).join("|") !== record.reviewedKinds.join("|")
  ) {
    errors.push("Stored change-set reviewed kinds are invalid or noncanonical");
  }
  if (
    record.decision === "approved" &&
    record.reviewedKinds.join("|") !== REVIEW_KINDS.join("|")
  ) {
    errors.push("Approved stored change-set review lacks all required registry kinds");
  }
  if (record.decision === "approved") {
    const benchmarkErrors: string[] = [];
    try {
      const reviewedAt = exactInstant(record.reviewedAt, "Stored change-set review timestamp");
      const draftCreatedAt = draft
        ? exactInstant(draft.createdAt, "Stored change-set draft createdAt")
        : 0;
      validateBenchmarkAttestation(
        record.benchmarkValidation,
        draftCreatedAt,
        reviewedAt,
        benchmarkErrors
      );
    } catch (error) {
      benchmarkErrors.push(error instanceof Error ? error.message : String(error));
    }
    errors.push(...benchmarkErrors);
  } else if (record.benchmarkValidation !== undefined) {
    errors.push("Rejected stored change-set review must not contain benchmark approval evidence");
  }
  validateReleaseRecordAgainstDraft(record, draft, errors);
  if (
    record.decisionStatus !==
      (record.decision === "approved"
        ? "approved-for-explicit-implementation-pr"
        : "rejected-final") ||
    record.applicationStatus !== "not-applied" ||
    record.customerFacingStatus !== "benchmark-only" ||
    record.implementationStatus !== "requires-explicit-code-change-pr"
  ) {
    errors.push("Stored change-set review escaped its non-applied implementation boundary");
  }
  if (!SHA256_RE.test(record.reviewRecordChecksum)) {
    errors.push("Stored change-set review checksum must be SHA-256");
  } else if (record.reviewRecordChecksum !== checksumForReviewRecord(record)) {
    errors.push("Stored change-set review checksum does not reproduce");
  }
  if (draft) {
    if (
      record.draftId !== draft.draftId ||
      record.draftChecksum !== draft.draftChecksum ||
      record.sourceId !== draft.sourceId ||
      record.baselineSnapshotId !== draft.baselineSnapshotId ||
      record.candidateSnapshotId !== draft.candidateSnapshotId ||
      record.packetId !== draft.packetId ||
      record.packetChecksum !== draft.packetChecksum ||
      record.draftRequestedBy !== draft.requestedBy
    ) {
      errors.push("Stored change-set review record does not match the verified draft");
    }
  }
  const serialized = JSON.stringify(record);
  if (
    serialized.includes('"text":') ||
    serialized.includes('"rawBody":') ||
    serialized.includes('"fileContents":')
  ) {
    errors.push("Stored change-set review record contains prohibited full-source payloads");
  }
  return [...new Set(errors)];
}

function reviewReceiptPayload(
  receipt: Omit<ReverifiedStoredRegulatoryChangeSetReviewReceipt, "verificationChecksum">
): Record<string, unknown> {
  return {
    verificationVersion: receipt.verificationVersion,
    reviewRecordChecksum: receipt.reviewRecordChecksum,
    draftChecksum: receipt.draftChecksum,
    packetChecksum: receipt.packetChecksum,
    pairVerificationChecksum: receipt.pairVerificationChecksum,
    draftReverificationChecksum: receipt.draftReverificationChecksum,
    sourceId: receipt.sourceId,
    candidateSnapshotId: receipt.candidateSnapshotId,
    reviewerPrincipal: receipt.reviewerPrincipal,
    decision: receipt.decision,
  };
}

export function isReverifiedStoredRegulatoryChangeSetReviewReceipt(
  value: unknown
): value is ReverifiedStoredRegulatoryChangeSetReviewReceipt {
  if (!value || typeof value !== "object" || !REVERIFIED_REVIEWS.has(value as object)) {
    return false;
  }
  const receipt = value as ReverifiedStoredRegulatoryChangeSetReviewReceipt;
  return (
    receipt.verificationVersion === 1 &&
    fingerprintRegulatoryRegistryValue(reviewReceiptPayload(receipt)) ===
      receipt.verificationChecksum
  );
}

export function reverifyStoredRegulatoryChangeSetReviewRecord(
  record: StoredRegulatoryChangeSetReviewRecord,
  draft: VerifiedStoredRegulatoryChangeSetDraft,
  packet: RegulatoryUpdateReviewPacket,
  pair: VerifiedStoredRegulatoryUpdatePair
): Readonly<ReverifiedStoredRegulatoryChangeSetReviewReceipt> {
  if (!HUMAN_REVIEWED_RECORDS.has(record as object)) {
    throw new Error(
      "Stored change-set review authorization requires the original in-process human decision record; serialized or loaded records cannot recreate trust"
    );
  }
  const draftReceipt = reverifyStoredRegulatoryChangeSetDraft(draft, packet, pair);
  const errors = validateStoredRegulatoryChangeSetReviewRecord(record, draft);
  if (errors.length > 0) {
    throw new Error(`Stored change-set review record failed reverification: ${errors.join("; ")}`);
  }
  if (
    record.packetChecksum !== packet.packetChecksum ||
    record.pairVerificationChecksum !== pair.verificationChecksum ||
    record.draftReverificationChecksum !== draftReceipt.verificationChecksum ||
    record.sourceReviewedBy !== pair.candidate.reviewedBy
  ) {
    throw new Error("Stored change-set review record provenance does not match current evidence");
  }
  const withoutChecksum = {
    verificationVersion: 1 as const,
    reviewRecordChecksum: record.reviewRecordChecksum,
    draftChecksum: draft.draftChecksum,
    packetChecksum: packet.packetChecksum,
    pairVerificationChecksum: pair.verificationChecksum,
    draftReverificationChecksum: draftReceipt.verificationChecksum,
    sourceId: record.sourceId,
    candidateSnapshotId: record.candidateSnapshotId,
    reviewerPrincipal: record.reviewerPrincipal,
    decision: record.decision,
  };
  const receipt: ReverifiedStoredRegulatoryChangeSetReviewReceipt = {
    ...withoutChecksum,
    verificationChecksum: fingerprintRegulatoryRegistryValue(
      reviewReceiptPayload(withoutChecksum)
    ),
  };
  const frozen = deepFreeze(receipt);
  REVERIFIED_REVIEWS.add(frozen as object);
  if (!isReverifiedStoredRegulatoryChangeSetReviewReceipt(frozen)) {
    throw new Error("Stored change-set review record failed opaque receipt verification");
  }
  return frozen;
}

function resolveContainedReviewPath(
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
    throw new Error(`Unsafe stored change-set review path: ${relativePath}`);
  }
  const segments = relativePath.split("/");
  if (
    segments.length !== 2 ||
    !SOURCE_ID_RE.test(segments[0]) ||
    !REVIEW_FILENAME_RE.test(segments[1])
  ) {
    throw new Error(`Invalid stored change-set review path shape: ${relativePath}`);
  }
  if (expectedSourceId && segments[0] !== expectedSourceId) {
    throw new Error(
      `Stored change-set review path source mismatch: expected ${expectedSourceId}, observed ${segments[0]}`
    );
  }
  const root = path.resolve(outputRoot);
  const absolute = path.resolve(root, ...segments);
  if (!absolute.startsWith(`${root}${path.sep}`)) {
    throw new Error(`Stored change-set review path escapes the controlled root: ${relativePath}`);
  }
  return absolute;
}

function relativeReviewPath(record: StoredRegulatoryChangeSetReviewRecord): string {
  const suffix = record.draftChecksum.replace(/^sha256:/, "").slice(0, 16);
  return path.posix.join(record.sourceId, `${suffix}-review.json`);
}

export async function storeStoredRegulatoryChangeSetReviewRecord(
  outputRoot: string,
  record: StoredRegulatoryChangeSetReviewRecord
): Promise<StoreStoredRegulatoryChangeSetReviewRecordResult> {
  const errors = validateStoredRegulatoryChangeSetReviewRecord(record);
  if (errors.length > 0) {
    throw new Error(`Stored change-set review record cannot be persisted: ${errors.join("; ")}`);
  }
  const relativePath = relativeReviewPath(record);
  const recordPath = resolveContainedReviewPath(outputRoot, relativePath, record.sourceId);
  await mkdir(path.dirname(recordPath), { recursive: true });
  await writeFile(recordPath, `${JSON.stringify(record, null, 2)}\n`, {
    encoding: "utf8",
    flag: "wx",
  });
  return { record: deepFreeze(jsonClone(record)), recordPath, relativePath };
}

export async function loadStoredRegulatoryChangeSetReviewRecord(
  outputRoot: string,
  relativePath: string,
  expectedSourceId?: string
): Promise<Readonly<StoredRegulatoryChangeSetReviewRecord>> {
  const recordPath = resolveContainedReviewPath(outputRoot, relativePath, expectedSourceId);
  const record = JSON.parse(
    await readFile(recordPath, "utf8")
  ) as StoredRegulatoryChangeSetReviewRecord;
  const errors = validateStoredRegulatoryChangeSetReviewRecord(record);
  if (errors.length > 0) {
    throw new Error(`Stored change-set review record failed validation: ${errors.join("; ")}`);
  }
  if (relativeReviewPath(record) !== relativePath) {
    throw new Error("Stored change-set review path does not match its draft-bound identity");
  }
  return deepFreeze(record);
}
