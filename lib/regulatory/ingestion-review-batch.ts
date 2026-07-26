import { prepareStoredRegulatoryUpdateReview } from "./update-review-command";

export type RegulatoryIngestionRecordStatus =
  | "stored"
  | "observed"
  | "unchanged"
  | "failed";

export type RegulatoryIngestionChangeStatus =
  | "first-snapshot"
  | "unchanged"
  | "content-changed";

export interface RegulatoryIngestionResultRecord {
  sourceId: string;
  status: RegulatoryIngestionRecordStatus;
  changeStatus?: RegulatoryIngestionChangeStatus;
  checksum?: string;
  rawChecksum?: string;
  snapshotId?: string;
  normalizedSnapshotId?: string;
  reviewStatus?: string;
  error?: string;
}

export interface RegulatoryIngestionResultDocument {
  outputRoot: string;
  sourceCount: number;
  failures: number;
  results: RegulatoryIngestionResultRecord[];
}

export type RegulatoryIngestionReviewItemStatus =
  | "packet-stored"
  | "no-review-packet"
  | "initial-snapshot-pending-review"
  | "manual-baseline-review-required"
  | "ingestion-failed";

export interface RegulatoryIngestionReviewItem {
  sourceId: string;
  ingestionStatus: RegulatoryIngestionRecordStatus;
  changeStatus?: RegulatoryIngestionChangeStatus;
  status: RegulatoryIngestionReviewItemStatus;
  snapshotId?: string;
  normalizedSnapshotId?: string;
  intakeStatus?: string;
  differenceClassification?: string;
  proposalReadiness?: string;
  packetRelativePath?: string;
  packetChecksum?: string;
  refusalReasons: string[];
  reviewNotes: string[];
  applicationStatus: "not-applied";
  customerFacingStatus: "benchmark-only";
}

export interface PrepareRegulatoryIngestionReviewBatchRequest {
  ingestion: RegulatoryIngestionResultDocument;
  snapshotRoot: string;
  packetRoot: string;
  requestedBy: string;
  createdAt: string;
}

export interface RegulatoryIngestionReviewBatchResult {
  sourceCount: number;
  ingestionFailureCount: number;
  packetCount: number;
  noPacketCount: number;
  initialSnapshotCount: number;
  manualBaselineReviewCount: number;
  items: RegulatoryIngestionReviewItem[];
  applicationStatus: "not-applied";
  customerFacingStatus: "benchmark-only";
}

const SOURCE_ID_RE = /^[a-z0-9][a-z0-9-]*$/;
const REVIEWABLE_STATUSES = new Set<RegulatoryIngestionRecordStatus>([
  "stored",
  "observed",
  "unchanged",
  "failed",
]);
const CHANGE_STATUSES = new Set<RegulatoryIngestionChangeStatus>([
  "first-snapshot",
  "unchanged",
  "content-changed",
]);

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

function validateIngestionDocument(document: RegulatoryIngestionResultDocument): void {
  if (!document || typeof document !== "object") {
    throw new Error("Regulatory ingestion result must be an object");
  }
  if (!Number.isInteger(document.sourceCount) || document.sourceCount < 0) {
    throw new Error("Regulatory ingestion sourceCount must be a non-negative integer");
  }
  if (!Number.isInteger(document.failures) || document.failures < 0) {
    throw new Error("Regulatory ingestion failures must be a non-negative integer");
  }
  if (!Array.isArray(document.results) || document.results.length !== document.sourceCount) {
    throw new Error("Regulatory ingestion result count does not match sourceCount");
  }

  const seen = new Set<string>();
  let observedFailures = 0;
  for (const record of document.results) {
    if (!SOURCE_ID_RE.test(record.sourceId)) {
      throw new Error(`Invalid regulatory ingestion source ID: ${record.sourceId}`);
    }
    if (seen.has(record.sourceId)) {
      throw new Error(`Duplicate regulatory ingestion source ID: ${record.sourceId}`);
    }
    seen.add(record.sourceId);
    if (!REVIEWABLE_STATUSES.has(record.status)) {
      throw new Error(`Unsupported regulatory ingestion status for ${record.sourceId}`);
    }
    if (record.changeStatus && !CHANGE_STATUSES.has(record.changeStatus)) {
      throw new Error(`Unsupported regulatory ingestion change status for ${record.sourceId}`);
    }
    if (record.status === "failed") {
      observedFailures++;
      if (!record.error?.trim()) {
        throw new Error(`Failed regulatory ingestion record lacks an error: ${record.sourceId}`);
      }
      continue;
    }
    if (!record.changeStatus) {
      throw new Error(`Successful regulatory ingestion record lacks changeStatus: ${record.sourceId}`);
    }
    if (!record.snapshotId?.trim() || !record.normalizedSnapshotId?.trim()) {
      throw new Error(`Successful regulatory ingestion record lacks snapshot identity: ${record.sourceId}`);
    }
    if (record.reviewStatus !== "pending") {
      throw new Error(`New regulatory ingestion evidence must remain pending: ${record.sourceId}`);
    }
  }
  if (observedFailures !== document.failures) {
    throw new Error("Regulatory ingestion failure count does not match failed records");
  }
}

function baseItem(record: RegulatoryIngestionResultRecord): Omit<
  RegulatoryIngestionReviewItem,
  "status" | "refusalReasons" | "reviewNotes"
> {
  return {
    sourceId: record.sourceId,
    ingestionStatus: record.status,
    changeStatus: record.changeStatus,
    snapshotId: record.snapshotId,
    normalizedSnapshotId: record.normalizedSnapshotId,
    applicationStatus: "not-applied",
    customerFacingStatus: "benchmark-only",
  };
}

function isMissingApprovedBaseline(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /No earlier approved stored regulatory baseline exists|No observed stored regulatory candidate exists/i.test(
    message
  );
}

export async function prepareRegulatoryIngestionReviewBatch(
  request: PrepareRegulatoryIngestionReviewBatchRequest
): Promise<Readonly<RegulatoryIngestionReviewBatchResult>> {
  validateIngestionDocument(request.ingestion);
  if (!request.requestedBy.trim()) {
    throw new Error("Regulatory ingestion review requester must not be blank");
  }
  if (!isIsoInstant(request.createdAt)) {
    throw new Error("Regulatory ingestion review createdAt must be an ISO timestamp");
  }

  const items: RegulatoryIngestionReviewItem[] = [];
  for (const record of request.ingestion.results) {
    const common = baseItem(record);
    if (record.status === "failed") {
      items.push({
        ...common,
        status: "ingestion-failed",
        refusalReasons: [record.error ?? "Official-source ingestion failed"],
        reviewNotes: ["No review packet was created."],
      });
      continue;
    }

    if (record.status === "stored" && record.changeStatus === "first-snapshot") {
      items.push({
        ...common,
        status: "initial-snapshot-pending-review",
        refusalReasons: [],
        reviewNotes: [
          "This is the first retained snapshot for the source, so no approved comparison baseline exists.",
          "The snapshot remains pending and requires direct source review before approval.",
        ],
      });
      continue;
    }

    try {
      const review = await prepareStoredRegulatoryUpdateReview({
        snapshotRoot: request.snapshotRoot,
        packetRoot: request.packetRoot,
        sourceId: record.sourceId,
        requestedBy: request.requestedBy,
        createdAt: request.createdAt,
        candidateSnapshotId:
          record.status === "stored" && record.changeStatus === "content-changed"
            ? record.snapshotId
            : undefined,
      });
      items.push({
        ...common,
        status: review.status,
        intakeStatus: review.intakeStatus,
        differenceClassification: review.differenceClassification,
        proposalReadiness: review.proposalReadiness,
        packetRelativePath: review.packetRelativePath,
        packetChecksum: review.packetChecksum,
        refusalReasons: [...review.refusalReasons],
        reviewNotes: [...review.reviewNotes],
      });
    } catch (error) {
      if (!isMissingApprovedBaseline(error)) throw error;
      items.push({
        ...common,
        status: "manual-baseline-review-required",
        refusalReasons: [error instanceof Error ? error.message : String(error)],
        reviewNotes: [
          "A distinct source change was retained, but no earlier approved snapshot is available for controlled comparison.",
          "No review packet was created and no registry transition was prepared.",
        ],
      });
    }
  }

  const result: RegulatoryIngestionReviewBatchResult = {
    sourceCount: items.length,
    ingestionFailureCount: items.filter((item) => item.status === "ingestion-failed").length,
    packetCount: items.filter((item) => item.status === "packet-stored").length,
    noPacketCount: items.filter((item) => item.status === "no-review-packet").length,
    initialSnapshotCount: items.filter(
      (item) => item.status === "initial-snapshot-pending-review"
    ).length,
    manualBaselineReviewCount: items.filter(
      (item) => item.status === "manual-baseline-review-required"
    ).length,
    items,
    applicationStatus: "not-applied",
    customerFacingStatus: "benchmark-only",
  };
  return deepFreeze(result);
}
