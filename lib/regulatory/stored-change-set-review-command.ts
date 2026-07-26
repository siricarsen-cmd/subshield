import { loadRegulatoryUpdateReviewPacket } from "./update-review-packet";
import {
  buildStoredRegulatoryChangeSetReviewRecord,
  storeStoredRegulatoryChangeSetReviewRecord,
  type RegulatoryBenchmarkValidationAttestation,
  type StoredRegulatoryChangeSetReviewDecision,
  type StoredRegulatoryChangeSetReviewKind,
} from "./stored-change-set-review";
import {
  loadVerifiedStoredRegulatoryChangeSetDraft,
  reverifyStoredRegulatoryChangeSetDraft,
} from "./stored-change-set-draft";
import { loadVerifiedStoredRegulatoryUpdatePair } from "./verified-stored-update-pair";

export interface RecordStoredRegulatoryChangeSetReviewRequest {
  snapshotRoot: string;
  packetRoot: string;
  draftRoot: string;
  reviewRoot: string;
  sourceId: string;
  packetRelativePath: string;
  draftRelativePath: string;
  decision: StoredRegulatoryChangeSetReviewDecision;
  reviewedBy: string;
  reviewerPrincipal: string;
  reviewedAt: string;
  reviewNotes: string[];
  reviewedKinds: StoredRegulatoryChangeSetReviewKind[];
  benchmarkValidation?: RegulatoryBenchmarkValidationAttestation;
  releaseCreatedAt?: string;
}

export interface RecordStoredRegulatoryChangeSetReviewResult {
  sourceId: string;
  draftId: string;
  draftChecksum: string;
  candidateSnapshotId: string;
  decision: StoredRegulatoryChangeSetReviewDecision;
  reviewedBy: string;
  reviewerPrincipal: string;
  reviewedAt: string;
  reviewedKinds: StoredRegulatoryChangeSetReviewKind[];
  reviewRecordRelativePath: string;
  reviewRecordChecksum: string;
  releaseRecordId?: string;
  releaseRecordFingerprint?: string;
  decisionStatus: "approved-for-explicit-implementation-pr" | "rejected-final";
  applicationStatus: "not-applied";
  customerFacingStatus: "benchmark-only";
  implementationStatus: "requires-explicit-code-change-pr";
}

const SOURCE_ID_RE = /^[a-z0-9][a-z0-9-]*$/;

function deepFreeze<T>(value: T): Readonly<T> {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const nested of Object.values(value as Record<string, unknown>)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value as Readonly<T>;
}

export async function recordStoredRegulatoryChangeSetReviewDecision(
  request: RecordStoredRegulatoryChangeSetReviewRequest
): Promise<Readonly<RecordStoredRegulatoryChangeSetReviewResult>> {
  if (!SOURCE_ID_RE.test(request.sourceId)) {
    throw new Error(`Unsafe stored change-set review source ID: ${request.sourceId}`);
  }
  const draft = await loadVerifiedStoredRegulatoryChangeSetDraft(
    request.draftRoot,
    request.draftRelativePath,
    request.sourceId
  );
  const packet = await loadRegulatoryUpdateReviewPacket(
    request.packetRoot,
    request.packetRelativePath,
    request.sourceId
  );
  const pair = await loadVerifiedStoredRegulatoryUpdatePair(
    request.snapshotRoot,
    request.sourceId,
    draft.candidateSnapshotId
  );
  const draftReceipt = reverifyStoredRegulatoryChangeSetDraft(draft, packet, pair);
  const record = buildStoredRegulatoryChangeSetReviewRecord(
    draft,
    packet,
    pair,
    draftReceipt,
    {
      decision: request.decision,
      reviewedBy: request.reviewedBy,
      reviewerPrincipal: request.reviewerPrincipal,
      reviewedAt: request.reviewedAt,
      reviewNotes: [...request.reviewNotes],
      reviewedKinds: [...request.reviewedKinds],
      benchmarkValidation: request.benchmarkValidation,
      releaseCreatedAt: request.releaseCreatedAt,
    }
  );
  const stored = await storeStoredRegulatoryChangeSetReviewRecord(request.reviewRoot, record);
  return deepFreeze({
    sourceId: record.sourceId,
    draftId: record.draftId,
    draftChecksum: record.draftChecksum,
    candidateSnapshotId: record.candidateSnapshotId,
    decision: record.decision,
    reviewedBy: record.reviewedBy,
    reviewerPrincipal: record.reviewerPrincipal,
    reviewedAt: record.reviewedAt,
    reviewedKinds: [...record.reviewedKinds],
    reviewRecordRelativePath: stored.relativePath,
    reviewRecordChecksum: record.reviewRecordChecksum,
    releaseRecordId: record.releaseRecord?.releaseRecordId,
    releaseRecordFingerprint: record.releaseRecordFingerprint,
    decisionStatus: record.decisionStatus,
    applicationStatus: record.applicationStatus,
    customerFacingStatus: record.customerFacingStatus,
    implementationStatus: record.implementationStatus,
  });
}
