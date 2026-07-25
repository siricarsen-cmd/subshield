import {
  canUseSnapshotForClientCitation,
  getRegulatorySnapshotValidationErrors,
} from "./ingestion";
import { fingerprintRegulatoryRegistryValue } from "./registry-integrity";
import {
  loadRegulatorySnapshotManifest,
  loadStoredRegulatorySnapshot,
} from "./snapshot-store";
import type {
  RegulatorySnapshotManifestEntry,
  RegulatorySourceSnapshot,
} from "./types";

export interface VerifiedStoredRegulatoryUpdatePair {
  verificationVersion: 1;
  sourceId: string;
  baselineSnapshotId: string;
  candidateSnapshotId: string;
  baselineFingerprint: string;
  candidateFingerprint: string;
  manifestFingerprint: string;
  candidateRetainedAsApprovedEvidence: boolean;
  baseline: Readonly<RegulatorySourceSnapshot>;
  candidate: Readonly<RegulatorySourceSnapshot>;
  verificationChecksum: string;
}

const VERIFIED_PAIRS = new WeakSet<object>();
const SOURCE_ID_RE = /^[a-z0-9][a-z0-9-]*$/;

function deepClone<T>(value: T): T {
  if (Array.isArray(value)) return value.map((item) => deepClone(item)) as T;
  if (value && typeof value === "object") {
    const clone: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      clone[key] = deepClone(item);
    }
    return clone as T;
  }
  return value;
}

function deepFreeze<T>(value: T): Readonly<T> {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const nested of Object.values(value as Record<string, unknown>)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value as Readonly<T>;
}

function entryById(
  entries: readonly RegulatorySnapshotManifestEntry[],
  snapshotId: string,
  label: string
): RegulatorySnapshotManifestEntry {
  const entry = entries.find((candidate) => candidate.snapshotId === snapshotId);
  if (!entry) {
    throw new Error(`${label} snapshot is not present in the controlled manifest: ${snapshotId}`);
  }
  return entry;
}

function exactInstant(value: string, label: string): number {
  const parsed = new Date(value).getTime();
  if (!Number.isFinite(parsed)) {
    throw new Error(`${label} is not a valid stored retrieval instant`);
  }
  return parsed;
}

function previousApprovedEntry(
  entries: readonly RegulatorySnapshotManifestEntry[],
  candidateEntry: RegulatorySnapshotManifestEntry
): RegulatorySnapshotManifestEntry | undefined {
  const candidateTime = exactInstant(candidateEntry.retrievedAt, "Candidate retrievedAt");
  return [...entries]
    .filter(
      (entry) =>
        entry.reviewStatus === "approved" &&
        entry.snapshotId !== candidateEntry.snapshotId &&
        exactInstant(entry.retrievedAt, "Approved baseline retrievedAt") < candidateTime
    )
    .sort(
      (left, right) =>
        exactInstant(right.retrievedAt, "Approved baseline retrievedAt") -
        exactInstant(left.retrievedAt, "Approved baseline retrievedAt")
    )[0];
}

function newerApprovedEntries(
  entries: readonly RegulatorySnapshotManifestEntry[],
  candidateEntry: RegulatorySnapshotManifestEntry
): RegulatorySnapshotManifestEntry[] {
  const candidateTime = exactInstant(candidateEntry.retrievedAt, "Candidate retrievedAt");
  return entries.filter(
    (entry) =>
      entry.reviewStatus === "approved" &&
      entry.snapshotId !== candidateEntry.snapshotId &&
      exactInstant(entry.retrievedAt, "Approved snapshot retrievedAt") > candidateTime
  );
}

function assertNoPendingReviewProvenance(
  entry: RegulatorySnapshotManifestEntry,
  snapshot: RegulatorySourceSnapshot
): void {
  if (entry.reviewStatus !== "pending" || snapshot.reviewStatus !== "pending") return;
  if (
    entry.reviewedBy !== undefined ||
    entry.reviewedAt !== undefined ||
    entry.reviewNotes !== undefined ||
    snapshot.reviewedBy !== undefined ||
    snapshot.reviewedAt !== undefined ||
    snapshot.reviewNotes !== undefined
  ) {
    throw new Error(
      `Pending stored regulatory candidate contains completed review provenance: ${snapshot.snapshotId}`
    );
  }
}

function verificationPayload(
  pair: Omit<
    VerifiedStoredRegulatoryUpdatePair,
    "verificationChecksum" | "baseline" | "candidate"
  >
): Record<string, unknown> {
  return {
    verificationVersion: pair.verificationVersion,
    sourceId: pair.sourceId,
    baselineSnapshotId: pair.baselineSnapshotId,
    candidateSnapshotId: pair.candidateSnapshotId,
    baselineFingerprint: pair.baselineFingerprint,
    candidateFingerprint: pair.candidateFingerprint,
    manifestFingerprint: pair.manifestFingerprint,
    candidateRetainedAsApprovedEvidence: pair.candidateRetainedAsApprovedEvidence,
  };
}

export function isVerifiedStoredRegulatoryUpdatePair(
  value: unknown
): value is VerifiedStoredRegulatoryUpdatePair {
  if (!value || typeof value !== "object" || !VERIFIED_PAIRS.has(value as object)) {
    return false;
  }
  const pair = value as VerifiedStoredRegulatoryUpdatePair;
  if (pair.verificationVersion !== 1) return false;
  if (pair.baseline.sourceId !== pair.sourceId || pair.candidate.sourceId !== pair.sourceId) {
    return false;
  }
  if (
    pair.baseline.snapshotId !== pair.baselineSnapshotId ||
    pair.candidate.snapshotId !== pair.candidateSnapshotId
  ) {
    return false;
  }
  if (
    fingerprintRegulatoryRegistryValue(pair.baseline) !== pair.baselineFingerprint ||
    fingerprintRegulatoryRegistryValue(pair.candidate) !== pair.candidateFingerprint
  ) {
    return false;
  }
  return (
    fingerprintRegulatoryRegistryValue(verificationPayload(pair)) ===
    pair.verificationChecksum
  );
}

export async function loadVerifiedStoredRegulatoryUpdatePair(
  outputRoot: string,
  sourceId: string,
  candidateSnapshotId?: string
): Promise<Readonly<VerifiedStoredRegulatoryUpdatePair>> {
  if (!SOURCE_ID_RE.test(sourceId)) {
    throw new Error(`Unsafe stored regulatory update source ID: ${sourceId}`);
  }
  const manifest = await loadRegulatorySnapshotManifest(outputRoot, sourceId);
  if (!manifest.latestObservedSnapshotId) {
    throw new Error(`No observed stored regulatory candidate exists for ${sourceId}`);
  }

  const selectedCandidateId = candidateSnapshotId ?? manifest.latestObservedSnapshotId;
  if (selectedCandidateId !== manifest.latestObservedSnapshotId) {
    throw new Error(
      `Stored regulatory candidate is not the latest observed snapshot: expected ${manifest.latestObservedSnapshotId}, observed ${selectedCandidateId}`
    );
  }

  const candidateEntry = entryById(
    manifest.snapshots,
    selectedCandidateId,
    "Update candidate"
  );
  if (candidateEntry.reviewStatus === "rejected") {
    throw new Error(
      `Rejected stored regulatory snapshot cannot be an update candidate: ${candidateEntry.snapshotId}`
    );
  }
  if (
    candidateEntry.reviewStatus !== "pending" &&
    candidateEntry.reviewStatus !== "approved"
  ) {
    throw new Error(
      `Stored regulatory candidate has an unsupported review status: ${String(candidateEntry.reviewStatus)}`
    );
  }

  const newerApproved = newerApprovedEntries(manifest.snapshots, candidateEntry);
  if (newerApproved.length > 0) {
    const newest = [...newerApproved].sort(
      (left, right) =>
        exactInstant(right.retrievedAt, "Approved snapshot retrievedAt") -
        exactInstant(left.retrievedAt, "Approved snapshot retrievedAt")
    )[0];
    throw new Error(
      `Stored regulatory candidate predates a retained approved snapshot and cannot create a rollback proposal: candidate ${candidateEntry.snapshotId}, newer approved ${newest.snapshotId}`
    );
  }

  const baselineEntry = previousApprovedEntry(manifest.snapshots, candidateEntry);
  if (!baselineEntry) {
    throw new Error(
      `No earlier approved stored regulatory baseline exists for candidate ${candidateEntry.snapshotId}`
    );
  }

  const baseline = await loadStoredRegulatorySnapshot(outputRoot, baselineEntry, sourceId);
  const candidate = await loadStoredRegulatorySnapshot(outputRoot, candidateEntry, sourceId);
  if (!canUseSnapshotForClientCitation(baseline)) {
    throw new Error(`Stored regulatory baseline is not citation eligible: ${baseline.snapshotId}`);
  }
  const baselineErrors = getRegulatorySnapshotValidationErrors(baseline);
  const candidateErrors = getRegulatorySnapshotValidationErrors(candidate);
  if (baselineErrors.length > 0 || candidateErrors.length > 0) {
    throw new Error(
      `Stored regulatory update pair failed validation: ${[
        ...baselineErrors.map((error) => `baseline: ${error}`),
        ...candidateErrors.map((error) => `candidate: ${error}`),
      ].join("; ")}`
    );
  }
  if (candidate.reviewStatus !== candidateEntry.reviewStatus) {
    throw new Error(
      `Stored regulatory candidate review status differs from its manifest entry: ${candidate.snapshotId}`
    );
  }
  assertNoPendingReviewProvenance(candidateEntry, candidate);
  if (candidate.reviewStatus === "approved" && !canUseSnapshotForClientCitation(candidate)) {
    throw new Error(
      `Approved stored regulatory candidate is not citation eligible: ${candidate.snapshotId}`
    );
  }

  const baselineTime = exactInstant(baseline.retrievedAt, "Baseline retrievedAt");
  const candidateTime = exactInstant(candidate.retrievedAt, "Candidate retrievedAt");
  if (candidateTime <= baselineTime) {
    throw new Error("Stored regulatory candidate must be retrieved after the approved baseline");
  }

  const frozenBaseline = deepFreeze(deepClone(baseline));
  const frozenCandidate = deepFreeze(deepClone(candidate));
  const pairWithoutChecksum = {
    verificationVersion: 1 as const,
    sourceId,
    baselineSnapshotId: frozenBaseline.snapshotId,
    candidateSnapshotId: frozenCandidate.snapshotId,
    baselineFingerprint: fingerprintRegulatoryRegistryValue(frozenBaseline),
    candidateFingerprint: fingerprintRegulatoryRegistryValue(frozenCandidate),
    manifestFingerprint: fingerprintRegulatoryRegistryValue(manifest),
    candidateRetainedAsApprovedEvidence: frozenCandidate.reviewStatus === "approved",
    baseline: frozenBaseline,
    candidate: frozenCandidate,
  };
  const pair: VerifiedStoredRegulatoryUpdatePair = {
    ...pairWithoutChecksum,
    verificationChecksum: fingerprintRegulatoryRegistryValue(
      verificationPayload(pairWithoutChecksum)
    ),
  };
  const frozenPair = deepFreeze(pair);
  VERIFIED_PAIRS.add(frozenPair as object);
  if (!isVerifiedStoredRegulatoryUpdatePair(frozenPair)) {
    throw new Error("Stored regulatory update pair failed opaque verification");
  }
  return frozenPair;
}
