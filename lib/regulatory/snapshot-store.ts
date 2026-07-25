import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  compareRegulatorySnapshots,
  getRegulatorySnapshotValidationErrors,
} from "./ingestion";
import type {
  RegulatorySnapshotComparison,
  RegulatorySnapshotManifest,
  RegulatorySnapshotManifestEntry,
  RegulatorySourceSnapshot,
} from "./types";

const SOURCE_ID_RE = /^[a-z0-9][a-z0-9-]*$/;
const SNAPSHOT_FILENAME_RE = /^\d{4}-\d{2}-\d{2}-[a-f0-9]{16}\.json$/;

export interface StoreRegulatorySnapshotResult {
  status: "stored" | "unchanged";
  comparison: RegulatorySnapshotComparison;
  manifest: RegulatorySnapshotManifest;
  snapshotPath?: string;
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

function validateManifestEntry(entry: RegulatorySnapshotManifestEntry, sourceId: string): void {
  if (!entry.snapshotId || !entry.checksum || !entry.rawChecksum || !entry.retrievedAt) {
    throw new Error(`Incomplete regulatory snapshot manifest entry: ${entry.snapshotId || "missing-id"}`);
  }
  resolveContainedSnapshotPath(".", entry.path, sourceId);
}

export async function loadRegulatorySnapshotManifest(
  outputRoot: string,
  sourceId: string
): Promise<RegulatorySnapshotManifest> {
  assertSafeSourceId(sourceId);
  const manifestPath = manifestFilePath(outputRoot, sourceId);
  const existing = await readJsonFile<RegulatorySnapshotManifest>(manifestPath);
  if (!existing) {
    return {
      schemaVersion: 1,
      sourceId,
      snapshots: [],
    };
  }
  if (existing.schemaVersion !== 1 || existing.sourceId !== sourceId) {
    throw new Error(`Invalid regulatory snapshot manifest: ${manifestPath}`);
  }
  if (new Set(existing.snapshots.map((entry) => entry.snapshotId)).size !== existing.snapshots.length) {
    throw new Error(`Regulatory snapshot manifest contains duplicate snapshot IDs: ${manifestPath}`);
  }
  for (const entry of existing.snapshots) validateManifestEntry(entry, sourceId);
  return existing;
}

export async function loadStoredRegulatorySnapshot(
  outputRoot: string,
  entry: RegulatorySnapshotManifestEntry,
  expectedSourceId?: string
): Promise<RegulatorySourceSnapshot> {
  const absolutePath = resolveContainedSnapshotPath(outputRoot, entry.path, expectedSourceId);
  const snapshot = await readJsonFile<RegulatorySourceSnapshot>(absolutePath);
  if (!snapshot) throw new Error(`Regulatory snapshot file is missing: ${absolutePath}`);

  if (
    snapshot.snapshotId !== entry.snapshotId ||
    snapshot.checksum !== entry.checksum ||
    snapshot.rawChecksum !== entry.rawChecksum ||
    snapshot.retrievedAt !== entry.retrievedAt ||
    snapshot.reviewStatus !== entry.reviewStatus ||
    snapshot.sourceId !== (expectedSourceId ?? entry.path.split("/", 1)[0])
  ) {
    throw new Error(`Regulatory snapshot does not match its manifest entry: ${absolutePath}`);
  }

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

export async function storeRegulatorySnapshot(
  outputRoot: string,
  snapshot: RegulatorySourceSnapshot
): Promise<StoreRegulatorySnapshotResult> {
  assertSafeSourceId(snapshot.sourceId);
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

  if (comparison.status === "unchanged") {
    return {
      status: "unchanged",
      comparison,
      manifest,
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
    reviewStatus: snapshot.reviewStatus,
    versionIdentifier: snapshot.versionIdentifier,
  };
  const nextManifest: RegulatorySnapshotManifest = {
    ...manifest,
    latestObservedSnapshotId: snapshot.snapshotId,
    latestApprovedSnapshotId:
      snapshot.reviewStatus === "approved"
        ? snapshot.snapshotId
        : manifest.latestApprovedSnapshotId,
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
