import { fingerprintRegulatoryRegistryValue } from "./registry-integrity";
import {
  loadRegulatorySnapshotManifest,
  loadStoredRegulatorySnapshot,
  persistRegulatorySnapshotReview,
} from "./snapshot-store";
import {
  reviewRegulatorySnapshot,
  type RegulatorySnapshotReviewDecision,
} from "./source-review";

export interface RecordRegulatorySnapshotReviewRequest
  extends RegulatorySnapshotReviewDecision {
  snapshotRoot: string;
  sourceId: string;
  snapshotId: string;
}

export interface RecordRegulatorySnapshotReviewResult {
  sourceId: string;
  snapshotId: string;
  decision: "approved" | "rejected";
  reviewedBy: string;
  reviewedAt: string;
  reviewNoteCount: number;
  verifiedAnchorCount: number;
  versionIdentifier?: string;
  effectiveDate?: string;
  snapshotFingerprint: string;
  manifestFingerprint: string;
  latestApprovedSnapshotId?: string;
  reviewPersistenceStatus: "persisted";
  registryApplicationStatus: "not-applied";
  customerFacingStatus: "not-enabled";
}

const SOURCE_ID_RE = /^[a-z0-9][a-z0-9-]*$/;
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;

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

export async function recordRegulatorySnapshotReviewDecision(
  request: RecordRegulatorySnapshotReviewRequest
): Promise<Readonly<RecordRegulatorySnapshotReviewResult>> {
  if (!SOURCE_ID_RE.test(request.sourceId)) {
    throw new Error(`Unsafe regulatory review source ID: ${request.sourceId}`);
  }
  if (!request.snapshotId.startsWith(`${request.sourceId}:`)) {
    throw new Error("Regulatory review snapshot ID must begin with its source ID");
  }

  const manifest = await loadRegulatorySnapshotManifest(request.snapshotRoot, request.sourceId);
  const entry = manifest.snapshots.find(
    (candidate) => candidate.snapshotId === request.snapshotId
  );
  if (!entry) {
    throw new Error(
      `Regulatory snapshot is not present in controlled storage: ${request.snapshotId}`
    );
  }
  if (entry.reviewStatus !== "pending") {
    throw new Error(`Regulatory snapshot review is already final: ${request.snapshotId}`);
  }

  const snapshot = await loadStoredRegulatorySnapshot(
    request.snapshotRoot,
    entry,
    request.sourceId
  );
  const retrievedAt = exactInstant(snapshot.retrievedAt, "Snapshot retrievedAt");
  const reviewedAt = exactInstant(request.reviewedAt, "Regulatory review timestamp");
  if (reviewedAt < retrievedAt) {
    throw new Error("Regulatory snapshot review cannot predate source retrieval");
  }
  if (reviewedAt > Date.now() + MAX_CLOCK_SKEW_MS) {
    throw new Error("Regulatory snapshot review timestamp cannot be in the future");
  }

  if (request.decision === "approved") {
    for (const approvedEntry of manifest.snapshots) {
      if (approvedEntry.reviewStatus !== "approved") continue;
      const approvedTime = exactInstant(
        approvedEntry.retrievedAt,
        "Approved snapshot retrievedAt"
      );
      if (approvedTime > retrievedAt) {
        throw new Error(
          `Regulatory snapshot approval would roll back a later approved source version: ${approvedEntry.snapshotId}`
        );
      }
    }
  }

  const reviewed = reviewRegulatorySnapshot(snapshot, {
    decision: request.decision,
    reviewedBy: request.reviewedBy,
    reviewedAt: request.reviewedAt,
    reviewNotes: [...request.reviewNotes],
    requiredTextAnchors: [...request.requiredTextAnchors],
    verifiedVersionIdentifier: request.verifiedVersionIdentifier,
    verifiedEffectiveDate: request.verifiedEffectiveDate,
  });
  const persisted = await persistRegulatorySnapshotReview(request.snapshotRoot, reviewed);

  const result: RecordRegulatorySnapshotReviewResult = {
    sourceId: persisted.snapshot.sourceId,
    snapshotId: persisted.snapshot.snapshotId,
    decision: persisted.status,
    reviewedBy: persisted.snapshot.reviewedBy as string,
    reviewedAt: persisted.snapshot.reviewedAt as string,
    reviewNoteCount: persisted.snapshot.reviewNotes?.length ?? 0,
    verifiedAnchorCount: request.requiredTextAnchors.length,
    versionIdentifier: persisted.snapshot.versionIdentifier,
    effectiveDate: persisted.snapshot.effectiveDate,
    snapshotFingerprint: fingerprintRegulatoryRegistryValue(persisted.snapshot),
    manifestFingerprint: fingerprintRegulatoryRegistryValue(persisted.manifest),
    latestApprovedSnapshotId: persisted.manifest.latestApprovedSnapshotId,
    reviewPersistenceStatus: "persisted",
    registryApplicationStatus: "not-applied",
    customerFacingStatus: "not-enabled",
  };
  return deepFreeze(result);
}
