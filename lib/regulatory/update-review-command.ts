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
  pairVerificationChecksum: string;
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

export async function prepareStoredRegulatoryUpdateReview(
  request: PrepareStoredRegulatoryUpdateReviewRequest
): Promise<Readonly<PrepareStoredRegulatoryUpdateReviewResult>> {
  const pair = await loadVerifiedStoredRegulatoryUpdatePair(
    request.snapshotRoot,
    request.sourceId,
    request.candidateSnapshotId
  );
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
