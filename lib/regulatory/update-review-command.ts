import { fingerprintRegulatoryRegistryValue } from "./registry-integrity";
import {
  loadRegulatorySnapshotManifest,
  loadStoredRegulatorySnapshot,
} from "./snapshot-store";
import {
  buildRegulatoryUpdateReviewPacket,
  storeRegulatoryUpdateReviewPacket,
} from "./update-review-packet";
import {
  prepareVerifiedStoredRegulatoryUpdateIntake,
  type RegulatoryUpdateDifferenceClassification,
  type RegulatoryUpdateIntakeStatus,
} from "./update-intake";
import { loadVerifiedStoredRegulatoryUpdatePair } from "./verified-stored-update-pair";
import type {
  RegulatoryRetrievalObservation,
  RegulatorySnapshotManifest,
} from "./types";

export interface PrepareStoredRegulatoryUpdateReviewRequest {
  snapshotRoot: string;
  packetRoot: string;
  sourceId: string;
  requestedBy: string;
  createdAt: string;
  candidateSnapshotId?: string;
}

export type PrepareStoredRegulatoryUpdateReviewStatus =
  | "packet-stored"
  | "no-review-packet"
  | "intake-refused";

export interface PrepareStoredRegulatoryUpdateReviewResult {
  status: PrepareStoredRegulatoryUpdateReviewStatus;
  sourceId: string;
  baselineSnapshotId: string;
  candidateSnapshotId: string;
  candidateObservationId?: string;
  pairVerificationChecksum?: string;
  observationVerificationChecksum?: string;
  intakeStatus: RegulatoryUpdateIntakeStatus;
  differenceClassification: RegulatoryUpdateDifferenceClassification;
  proposalReadiness?: string;
  packetRelativePath?: string;
  packetChecksum?: string;
  refusalReasons: string[];
  reviewNotes: string[];
  reviewStatus: "pending" | "not-created";
  applicationStatus: "not-applied";
  customerFacingStatus: "benchmark-only";
}

function deepFreeze<T>(value: T): Readonly<T> {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const nested of Object.values(value as Record<string, unknown>)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value as Readonly<T>;
}

function isIsoInstant(value: string): boolean {
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value;
}

function isReviewPacketEligible(
  intakeStatus: RegulatoryUpdateIntakeStatus,
  difference: RegulatoryUpdateDifferenceClassification
): boolean {
  return (
    ["proposal-prepared", "manual-review-required", "observation-only"].includes(
      intakeStatus
    ) &&
    difference !== "unchanged" &&
    difference !== "transport-only"
  );
}

function latestObservation(
  manifest: RegulatorySnapshotManifest
): RegulatoryRetrievalObservation | undefined {
  return [...manifest.observations].sort(
    (left, right) =>
      new Date(right.retrieval.retrievedAt).getTime() -
      new Date(left.retrieval.retrievedAt).getTime()
  )[0];
}

function retrievalFingerprint(
  receipt: RegulatoryRetrievalObservation["retrieval"]
): string {
  return fingerprintRegulatoryRegistryValue({
    requestedUrl: receipt.requestedUrl,
    finalUrl: receipt.finalUrl,
    status: receipt.status,
    contentType: receipt.contentType,
    rawByteLength: receipt.rawByteLength,
    redirectChain: receipt.redirectChain,
    etag: receipt.etag,
    lastModified: receipt.lastModified,
  });
}

async function noPairObservationResult(
  request: PrepareStoredRegulatoryUpdateReviewRequest,
  originalError: unknown
): Promise<Readonly<PrepareStoredRegulatoryUpdateReviewResult>> {
  const message = originalError instanceof Error ? originalError.message : String(originalError);
  if (!/No earlier approved stored regulatory baseline exists/i.test(message)) {
    throw originalError;
  }
  if (!request.requestedBy.trim()) {
    return deepFreeze({
      status: "intake-refused",
      sourceId: request.sourceId,
      baselineSnapshotId: "unresolved",
      candidateSnapshotId: "unresolved",
      intakeStatus: "refused",
      differenceClassification: "unchanged",
      refusalReasons: ["Update-intake requester must not be blank"],
      reviewNotes: ["No review packet was created."],
      reviewStatus: "not-created",
      applicationStatus: "not-applied",
      customerFacingStatus: "benchmark-only",
    });
  }
  if (!isIsoInstant(request.createdAt)) {
    return deepFreeze({
      status: "intake-refused",
      sourceId: request.sourceId,
      baselineSnapshotId: "unresolved",
      candidateSnapshotId: "unresolved",
      intakeStatus: "refused",
      differenceClassification: "unchanged",
      refusalReasons: ["Update-intake createdAt must be an ISO timestamp"],
      reviewNotes: ["No review packet was created."],
      reviewStatus: "not-created",
      applicationStatus: "not-applied",
      customerFacingStatus: "benchmark-only",
    });
  }

  const manifest = await loadRegulatorySnapshotManifest(
    request.snapshotRoot,
    request.sourceId
  );
  const snapshotId = manifest.latestObservedSnapshotId;
  if (!snapshotId || snapshotId !== manifest.latestApprovedSnapshotId) {
    throw originalError;
  }
  if (request.candidateSnapshotId && request.candidateSnapshotId !== snapshotId) {
    throw originalError;
  }
  const entry = manifest.snapshots.find((candidate) => candidate.snapshotId === snapshotId);
  if (!entry) throw originalError;
  const observation = latestObservation(manifest);
  if (observation && observation.normalizedSnapshotId !== snapshotId) {
    throw originalError;
  }
  const approvedSnapshot = await loadStoredRegulatorySnapshot(
    request.snapshotRoot,
    entry,
    request.sourceId
  );
  if (approvedSnapshot.reviewStatus !== "approved") throw originalError;

  const latestEvidenceTime = new Date(
    observation?.retrieval.retrievedAt ?? approvedSnapshot.retrievedAt
  ).getTime();
  const createdTime = new Date(request.createdAt).getTime();
  if (!Number.isFinite(latestEvidenceTime) || createdTime < latestEvidenceTime) {
    return deepFreeze({
      status: "intake-refused",
      sourceId: request.sourceId,
      baselineSnapshotId: snapshotId,
      candidateSnapshotId: snapshotId,
      candidateObservationId: observation?.observationId,
      intakeStatus: "refused",
      differenceClassification: "unchanged",
      refusalReasons: ["Update intake cannot be created before the latest controlled retrieval evidence"],
      reviewNotes: ["No review packet was created."],
      reviewStatus: "not-created",
      applicationStatus: "not-applied",
      customerFacingStatus: "benchmark-only",
    });
  }

  const rawChanged = observation
    ? observation.rawChecksum !== entry.rawChecksum
    : false;
  const transportChanged = observation
    ? retrievalFingerprint(observation.retrieval) !==
      retrievalFingerprint(approvedSnapshot.retrieval)
    : false;
  const differenceClassification: RegulatoryUpdateDifferenceClassification =
    rawChanged || transportChanged ? "transport-only" : "unchanged";
  const observationVerificationChecksum = fingerprintRegulatoryRegistryValue({
    sourceId: request.sourceId,
    manifest,
    snapshotFingerprint: fingerprintRegulatoryRegistryValue(approvedSnapshot),
    observation: observation ?? null,
  });

  return deepFreeze({
    status: "no-review-packet",
    sourceId: request.sourceId,
    baselineSnapshotId: snapshotId,
    candidateSnapshotId: snapshotId,
    candidateObservationId: observation?.observationId,
    observationVerificationChecksum,
    intakeStatus:
      differenceClassification === "unchanged" ? "no-change" : "observation-only",
    differenceClassification,
    refusalReasons: [],
    reviewNotes: [
      observation
        ? differenceClassification === "unchanged"
          ? "The latest controlled retrieval observation is identical to the approved stored snapshot."
          : "The latest controlled retrieval changes only raw or transport provenance; normalized regulatory text remains tied to the approved snapshot."
        : "No distinct stored candidate or new retrieval observation exists beyond the approved snapshot.",
      "No regulatory review packet was created.",
    ],
    reviewStatus: "not-created",
    applicationStatus: "not-applied",
    customerFacingStatus: "benchmark-only",
  });
}

export async function prepareStoredRegulatoryUpdateReview(
  request: PrepareStoredRegulatoryUpdateReviewRequest
): Promise<Readonly<PrepareStoredRegulatoryUpdateReviewResult>> {
  let pair;
  try {
    pair = await loadVerifiedStoredRegulatoryUpdatePair(
      request.snapshotRoot,
      request.sourceId,
      request.candidateSnapshotId
    );
  } catch (error) {
    return noPairObservationResult(request, error);
  }

  const intake = prepareVerifiedStoredRegulatoryUpdateIntake(
    pair,
    request.requestedBy,
    request.createdAt
  );

  const common = {
    sourceId: pair.sourceId,
    baselineSnapshotId: pair.baselineSnapshotId,
    candidateSnapshotId: pair.candidateSnapshotId,
    pairVerificationChecksum: pair.verificationChecksum,
    intakeStatus: intake.status,
    differenceClassification: intake.difference.classification,
    proposalReadiness: intake.proposal?.readiness,
    refusalReasons: [...intake.refusalReasons],
    reviewNotes: [...intake.reviewNotes],
    applicationStatus: "not-applied" as const,
    customerFacingStatus: "benchmark-only" as const,
  };

  if (intake.status === "refused") {
    return deepFreeze({
      ...common,
      status: "intake-refused" as const,
      reviewStatus: "not-created" as const,
    });
  }

  if (!isReviewPacketEligible(intake.status, intake.difference.classification)) {
    return deepFreeze({
      ...common,
      status: "no-review-packet" as const,
      reviewStatus: "not-created" as const,
    });
  }

  const packet = buildRegulatoryUpdateReviewPacket(
    intake,
    request.requestedBy,
    request.createdAt
  );
  const stored = await storeRegulatoryUpdateReviewPacket(request.packetRoot, packet);
  return deepFreeze({
    ...common,
    status: "packet-stored" as const,
    packetRelativePath: stored.relativePath,
    packetChecksum: packet.packetChecksum,
    reviewStatus: "pending" as const,
  });
}
