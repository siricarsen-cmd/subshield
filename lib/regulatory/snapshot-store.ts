import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  canUseSnapshotForClientCitation,
  compareRegulatorySnapshots,
  getRegulatorySnapshotValidationErrors,
} from "./ingestion";
import type {
  RegulatoryRetrievalObservation,
  RegulatorySnapshotComparison,
  RegulatorySnapshotManifest,
  RegulatorySnapshotManifestEntry,
  RegulatorySourceSnapshot,
} from "./types";

const SOURCE_ID_RE = /^[a-z0-9][a-z0-9-]*$/;
const SNAPSHOT_FILENAME_RE = /^\d{4}-\d{2}-\d{2}-[a-f0-9]{16}\.json$/;
const SHA256_RE = /^sha256:[a-f0-9]{64}$/;

export interface StoreRegulatorySnapshotResult {
  status: "stored" | "observed" | "unchanged";
  comparison: RegulatorySnapshotComparison;
  manifest: RegulatorySnapshotManifest;
  snapshotPath?: string;
  manifestPath: string;
}

export interface PersistRegulatorySnapshotReviewResult {
  status: "approved" | "rejected";
  snapshot: RegulatorySourceSnapshot;
  manifest: RegulatorySnapshotManifest;
  manifestPath: string;
}

function assertSafeSourceId(sourceId: string): void {
  if (!SOURCE_ID_RE.test(sourceId)) {
    throw new Error(`Unsafe regulatory source ID: ${sourceId}`);
  }
}

function resolvedOutputRoot(outputRoot: string): string {
  return path.resolve(outputRoot);
}

function sourceDirectory(outputRoot: string, sourceId: string): string {
  assertSafeSourceId(sourceId);
  return path.join(resolvedOutputRoot(outputRoot), sourceId);
}

function manifestFilePath(outputRoot: string, sourceId: string): string {
  return path.join(sourceDirectory(outputRoot, sourceId), "manifest.json");
}

function resolveContainedSnapshotPath(
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
    throw new Error(`Unsafe regulatory snapshot path: ${relativePath}`);
  }

  const segments = relativePath.split("/");
  if (
    segments.length !== 2 ||
    !SOURCE_ID_RE.test(segments[0]) ||
    !SNAPSHOT_FILENAME_RE.test(segments[1])
  ) {
    throw new Error(`Invalid regulatory snapshot path shape: ${relativePath}`);
  }
  if (expectedSourceId && segments[0] !== expectedSourceId) {
    throw new Error(
      `Regulatory snapshot path source mismatch: expected ${expectedSourceId}, observed ${segments[0]}`
    );
  }

  const root = resolvedOutputRoot(outputRoot);
  const absolutePath = path.resolve(root, ...segments);
  if (!absolutePath.startsWith(`${root}${path.sep}`)) {
    throw new Error(`Regulatory snapshot path escapes the controlled root: ${relativePath}`);
  }
  return absolutePath;
}

async function readJsonFile<T>(filePath: string): Promise<T | undefined> {
  try {
    return JSON.parse(await readFile(filePath, "utf8")) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}

async function writeJsonAtomic(filePath: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temporaryPath, filePath);
}

async function writeJsonImmutable(filePath: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, {
    encoding: "utf8",
    flag: "wx",
  });
}

function isIsoInstant(value: string): boolean {
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value;
}

function validateManifestEntry(entry: RegulatorySnapshotManifestEntry, sourceId: string): void {
  if (
    !entry.snapshotId ||
    !SHA256_RE.test(entry.checksum) ||
    !SHA256_RE.test(entry.rawChecksum) ||
    !entry.retrievedAt
  ) {
    throw new Error(`Incomplete regulatory snapshot manifest entry: ${entry.snapshotId || "missing-id"}`);
  }
  resolveContainedSnapshotPath(".", entry.path, sourceId);

  if (entry.reviewStatus !== "pending") {
    if (
      !entry.reviewedBy?.trim() ||
      !entry.reviewedAt ||
      !isIsoInstant(entry.reviewedAt) ||
      !entry.reviewNotes?.length ||
      entry.reviewNotes.some((note) => !note.trim())
    ) {
      throw new Error(`Reviewed regulatory snapshot manifest entry lacks provenance: ${entry.snapshotId}`);
    }
  }
}

function validateObservation(
  observation: RegulatoryRetrievalObservation,
  manifest: RegulatorySnapshotManifest
): void {
  if (
    !observation.observationId ||
    !SHA256_RE.test(observation.checksum) ||
    !SHA256_RE.test(observation.rawChecksum) ||
    !observation.normalizationVersion ||
    !observation.retrieval.retrievedAt
  ) {
    throw new Error(`Invalid regulatory retrieval observation: ${observation.observationId || "missing-id"}`);
  }
  const normalizedEntry = manifest.snapshots.find(
    (entry) => entry.snapshotId === observation.normalizedSnapshotId
  );
  if (!normalizedEntry || normalizedEntry.checksum !== observation.checksum) {
    throw new Error(
      `Regulatory retrieval observation does not reference a retained normalized snapshot: ${observation.observationId}`
    );
  }
}

export async function loadRegulatorySnapshotManifest(
  outputRoot: string,
  sourceId: string
): Promise<RegulatorySnapshotManifest> {
  assertSafeSourceId(sourceId);
  const manifestPath = manifestFilePath(outputRoot, sourceId);
  const parsed = await readJsonFile<RegulatorySnapshotManifest>(manifestPath);
  if (!parsed) {
    return {
      schemaVersion: 1,
      sourceId,
      snapshots: [],
      observations: [],
    };
  }
  const existing: RegulatorySnapshotManifest = {
    ...parsed,
    observations: Array.isArray(parsed.observations) ? parsed.observations : [],
  };
  if (existing.schemaVersion !== 1 || existing.sourceId !== sourceId) {
    throw new Error(`Invalid regulatory snapshot manifest: ${manifestPath}`);
  }
  if (new Set(existing.snapshots.map((entry) => entry.snapshotId)).size !== existing.snapshots.length) {
    throw new Error(`Regulatory snapshot manifest contains duplicate snapshot IDs: ${manifestPath}`);
  }
  if (
    new Set(existing.observations.map((entry) => entry.observationId)).size !==
    existing.observations.length
  ) {
    throw new Error(`Regulatory snapshot manifest contains duplicate observation IDs: ${manifestPath}`);
  }
  for (const entry of existing.snapshots) validateManifestEntry(entry, sourceId);
  for (const observation of existing.observations) validateObservation(observation, existing);

  if (existing.latestApprovedSnapshotId) {
    const approvedEntry = existing.snapshots.find(
      (entry) => entry.snapshotId === existing.latestApprovedSnapshotId
    );
    if (!approvedEntry || approvedEntry.reviewStatus !== "approved") {
      throw new Error(`Manifest latestApprovedSnapshotId is not an approved snapshot: ${sourceId}`);
    }
  }
  return existing;
}

function withPersistedReview(
  snapshot: RegulatorySourceSnapshot,
  entry: RegulatorySnapshotManifestEntry
): RegulatorySourceSnapshot {
  const reviewNotes = entry.reviewNotes ?? [];
  const baseProvenanceNotes = snapshot.provenanceNotes.filter(
    (note) => !note.startsWith("Review: ")
  );
  return {
    ...snapshot,
    reviewStatus: entry.reviewStatus,
    reviewedBy: entry.reviewedBy,
    reviewedAt: entry.reviewedAt,
    reviewNotes: reviewNotes.length > 0 ? reviewNotes : undefined,
    provenanceNotes: [
      ...baseProvenanceNotes,
      ...reviewNotes.map((note) => `Review: ${note}`),
    ],
  };
}

export async function loadStoredRegulatorySnapshot(
  outputRoot: string,
  entry: RegulatorySnapshotManifestEntry,
  expectedSourceId?: string
): Promise<RegulatorySourceSnapshot> {
  const absolutePath = resolveContainedSnapshotPath(outputRoot, entry.path, expectedSourceId);
  const immutableSnapshot = await readJsonFile<RegulatorySourceSnapshot>(absolutePath);
  if (!immutableSnapshot) throw new Error(`Regulatory snapshot file is missing: ${absolutePath}`);

  if (
    immutableSnapshot.snapshotId !== entry.snapshotId ||
    immutableSnapshot.checksum !== entry.checksum ||
    immutableSnapshot.rawChecksum !== entry.rawChecksum ||
    immutableSnapshot.retrievedAt !== entry.retrievedAt ||
    immutableSnapshot.sourceId !== (expectedSourceId ?? entry.path.split("/", 1)[0])
  ) {
    throw new Error(`Regulatory snapshot does not match its manifest entry: ${absolutePath}`);
  }

  const snapshot = withPersistedReview(immutableSnapshot, entry);
  const validationErrors = getRegulatorySnapshotValidationErrors(snapshot);
  if (validationErrors.length > 0) {
    throw new Error(
      `Stored regulatory snapshot failed validation: ${validationErrors.join("; ")}`
    );
  }
  return snapshot;
}

export async function loadLatestObservedRegulatorySnapshot(
  outputRoot: string,
  sourceId: string
): Promise<RegulatorySourceSnapshot | undefined> {
  const manifest = await loadRegulatorySnapshotManifest(outputRoot, sourceId);
  if (!manifest.latestObservedSnapshotId) return undefined;
  const entry = manifest.snapshots.find(
    (candidate) => candidate.snapshotId === manifest.latestObservedSnapshotId
  );
  if (!entry) {
    throw new Error(
      `Manifest latestObservedSnapshotId does not exist in snapshot entries: ${sourceId}`
    );
  }
  return loadStoredRegulatorySnapshot(outputRoot, entry, sourceId);
}

function relativeSnapshotPath(snapshot: RegulatorySourceSnapshot): string {
  const date = snapshot.retrievedAt.slice(0, 10);
  const checksumSuffix = snapshot.checksum.replace(/^sha256:/, "").slice(0, 16);
  return path.posix.join(snapshot.sourceId, `${date}-${checksumSuffix}.json`);
}

function sameImmutableSnapshot(
  left: RegulatorySourceSnapshot,
  right: RegulatorySourceSnapshot
): boolean {
  return (
    left.snapshotId === right.snapshotId &&
    left.sourceId === right.sourceId &&
    left.checksum === right.checksum &&
    left.rawChecksum === right.rawChecksum &&
    left.retrievedAt === right.retrievedAt &&
    left.text === right.text
  );
}

function retrievalFingerprint(
  rawChecksum: string,
  normalizationVersion: string,
  retrieval: RegulatorySourceSnapshot["retrieval"]
): string {
  return JSON.stringify({
    rawChecksum,
    normalizationVersion,
    requestedUrl: retrieval.requestedUrl,
    finalUrl: retrieval.finalUrl,
    status: retrieval.status,
    contentType: retrieval.contentType,
    rawByteLength: retrieval.rawByteLength,
    redirectChain: retrieval.redirectChain,
    etag: retrieval.etag ?? null,
    lastModified: retrieval.lastModified ?? null,
  });
}

function latestRetrievalFingerprint(
  manifest: RegulatorySnapshotManifest,
  previous: RegulatorySourceSnapshot
): string {
  const observation = [...manifest.observations]
    .reverse()
    .find((candidate) => candidate.normalizedSnapshotId === previous.snapshotId);
  if (observation) {
    return retrievalFingerprint(
      observation.rawChecksum,
      observation.normalizationVersion,
      observation.retrieval
    );
  }
  return retrievalFingerprint(
    previous.rawChecksum,
    previous.normalizationVersion,
    previous.retrieval
  );
}

function createRetrievalObservation(
  snapshot: RegulatorySourceSnapshot,
  normalizedSnapshotId: string
): RegulatoryRetrievalObservation {
  return {
    observationId: `${snapshot.sourceId}:observation:${snapshot.retrievedAt
      .replace(/[^0-9]/g, "")
      .slice(0, 14)}:${snapshot.rawChecksum.slice(-12)}`,
    normalizedSnapshotId,
    checksum: snapshot.checksum,
    rawChecksum: snapshot.rawChecksum,
    normalizationVersion: snapshot.normalizationVersion,
    retrieval: snapshot.retrieval,
  };
}

export async function storeRegulatorySnapshot(
  outputRoot: string,
  snapshot: RegulatorySourceSnapshot
): Promise<StoreRegulatorySnapshotResult> {
  assertSafeSourceId(snapshot.sourceId);
  if (snapshot.reviewStatus !== "pending") {
    throw new Error(
      "New regulatory snapshots must be stored pending and reviewed through the persisted review transition"
    );
  }
  const validationErrors = getRegulatorySnapshotValidationErrors(snapshot);
  if (validationErrors.length > 0) {
    throw new Error(
      `Regulatory snapshot cannot be stored: ${validationErrors.join("; ")}`
    );
  }

  const manifestPath = manifestFilePath(outputRoot, snapshot.sourceId);
  const manifest = await loadRegulatorySnapshotManifest(outputRoot, snapshot.sourceId);
  const previous = await loadLatestObservedRegulatorySnapshot(outputRoot, snapshot.sourceId);
  const comparison = compareRegulatorySnapshots(snapshot, previous);

  if (comparison.status === "unchanged" && previous) {
    const newFingerprint = retrievalFingerprint(
      snapshot.rawChecksum,
      snapshot.normalizationVersion,
      snapshot.retrieval
    );
    if (newFingerprint === latestRetrievalFingerprint(manifest, previous)) {
      return {
        status: "unchanged",
        comparison,
        manifest,
        manifestPath,
      };
    }

    const observation = createRetrievalObservation(snapshot, previous.snapshotId);
    if (manifest.observations.some((entry) => entry.observationId === observation.observationId)) {
      throw new Error(`Duplicate regulatory retrieval observation ID: ${observation.observationId}`);
    }
    const observedManifest: RegulatorySnapshotManifest = {
      ...manifest,
      observations: [...manifest.observations, observation],
    };
    await writeJsonAtomic(manifestPath, observedManifest);
    return {
      status: "observed",
      comparison,
      manifest: observedManifest,
      manifestPath,
    };
  }

  if (manifest.snapshots.some((entry) => entry.snapshotId === snapshot.snapshotId)) {
    throw new Error(`Duplicate regulatory snapshot ID: ${snapshot.snapshotId}`);
  }

  const relativePath = relativeSnapshotPath(snapshot);
  const absoluteSnapshotPath = resolveContainedSnapshotPath(
    outputRoot,
    relativePath,
    snapshot.sourceId
  );
  const existingAtPath = await readJsonFile<RegulatorySourceSnapshot>(absoluteSnapshotPath);
  if (existingAtPath && !sameImmutableSnapshot(existingAtPath, snapshot)) {
    throw new Error(`Regulatory snapshot path collision: ${absoluteSnapshotPath}`);
  }
  if (!existingAtPath) await writeJsonImmutable(absoluteSnapshotPath, snapshot);

  const entry: RegulatorySnapshotManifestEntry = {
    snapshotId: snapshot.snapshotId,
    path: relativePath,
    checksum: snapshot.checksum,
    rawChecksum: snapshot.rawChecksum,
    retrievedAt: snapshot.retrievedAt,
    reviewStatus: "pending",
    versionIdentifier: snapshot.versionIdentifier,
  };
  const nextManifest: RegulatorySnapshotManifest = {
    ...manifest,
    latestObservedSnapshotId: snapshot.snapshotId,
    snapshots: [...manifest.snapshots, entry],
  };
  await writeJsonAtomic(manifestPath, nextManifest);

  return {
    status: "stored",
    comparison,
    manifest: nextManifest,
    snapshotPath: absoluteSnapshotPath,
    manifestPath,
  };
}

export async function persistRegulatorySnapshotReview(
  outputRoot: string,
  reviewedSnapshot: RegulatorySourceSnapshot
): Promise<PersistRegulatorySnapshotReviewResult> {
  assertSafeSourceId(reviewedSnapshot.sourceId);
  if (reviewedSnapshot.reviewStatus === "pending") {
    throw new Error("A pending regulatory snapshot does not contain a completed review decision");
  }
  if (
    !reviewedSnapshot.reviewedBy?.trim() ||
    !reviewedSnapshot.reviewedAt ||
    !isIsoInstant(reviewedSnapshot.reviewedAt) ||
    !reviewedSnapshot.reviewNotes?.length ||
    reviewedSnapshot.reviewNotes.some((note) => !note.trim())
  ) {
    throw new Error("Reviewed regulatory snapshot lacks persistent reviewer provenance");
  }

  const validationErrors = getRegulatorySnapshotValidationErrors(reviewedSnapshot);
  if (validationErrors.length > 0) {
    throw new Error(
      `Reviewed regulatory snapshot cannot be persisted: ${validationErrors.join("; ")}`
    );
  }
  if (
    reviewedSnapshot.reviewStatus === "approved" &&
    !canUseSnapshotForClientCitation(reviewedSnapshot)
  ) {
    throw new Error("Approved regulatory snapshot is not eligible for client citation");
  }

  const manifestPath = manifestFilePath(outputRoot, reviewedSnapshot.sourceId);
  const manifest = await loadRegulatorySnapshotManifest(outputRoot, reviewedSnapshot.sourceId);
  const entryIndex = manifest.snapshots.findIndex(
    (entry) => entry.snapshotId === reviewedSnapshot.snapshotId
  );
  if (entryIndex < 0) {
    throw new Error(`Reviewed regulatory snapshot is not present in storage: ${reviewedSnapshot.snapshotId}`);
  }
  const existingEntry = manifest.snapshots[entryIndex];
  if (existingEntry.reviewStatus !== "pending") {
    throw new Error(`Regulatory snapshot review is already final: ${reviewedSnapshot.snapshotId}`);
  }

  const storedPendingSnapshot = await loadStoredRegulatorySnapshot(
    outputRoot,
    existingEntry,
    reviewedSnapshot.sourceId
  );
  if (!sameImmutableSnapshot(storedPendingSnapshot, reviewedSnapshot)) {
    throw new Error(`Reviewed regulatory snapshot content differs from the immutable stored snapshot`);
  }
  if (existingEntry.versionIdentifier !== reviewedSnapshot.versionIdentifier) {
    throw new Error("Reviewed regulatory snapshot version differs from its manifest entry");
  }

  const reviewedEntry: RegulatorySnapshotManifestEntry = {
    ...existingEntry,
    reviewStatus: reviewedSnapshot.reviewStatus,
    reviewedBy: reviewedSnapshot.reviewedBy,
    reviewedAt: reviewedSnapshot.reviewedAt,
    reviewNotes: [...reviewedSnapshot.reviewNotes],
  };
  const nextEntries = [...manifest.snapshots];
  nextEntries[entryIndex] = reviewedEntry;
  const nextManifest: RegulatorySnapshotManifest = {
    ...manifest,
    latestApprovedSnapshotId:
      reviewedSnapshot.reviewStatus === "approved"
        ? reviewedSnapshot.snapshotId
        : manifest.latestApprovedSnapshotId,
    snapshots: nextEntries,
  };
  await writeJsonAtomic(manifestPath, nextManifest);

  const persistedSnapshot = await loadStoredRegulatorySnapshot(
    outputRoot,
    reviewedEntry,
    reviewedSnapshot.sourceId
  );
  return {
    status: reviewedSnapshot.reviewStatus,
    snapshot: persistedSnapshot,
    manifest: nextManifest,
    manifestPath,
  };
}
