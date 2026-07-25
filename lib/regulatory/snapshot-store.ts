import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import { compareRegulatorySnapshots } from "./ingestion";
import type {
  RegulatorySnapshotComparison,
  RegulatorySnapshotManifest,
  RegulatorySnapshotManifestEntry,
  RegulatorySourceSnapshot,
} from "./types";

const SOURCE_ID_RE = /^[a-z0-9][a-z0-9-]*$/;

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

function sourceDirectory(outputRoot: string, sourceId: string): string {
  assertSafeSourceId(sourceId);
  return path.join(outputRoot, sourceId);
}

function manifestFilePath(outputRoot: string, sourceId: string): string {
  return path.join(sourceDirectory(outputRoot, sourceId), "manifest.json");
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

export async function loadRegulatorySnapshotManifest(
  outputRoot: string,
  sourceId: string
): Promise<RegulatorySnapshotManifest> {
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
  return existing;
}

export async function loadStoredRegulatorySnapshot(
  outputRoot: string,
  entry: RegulatorySnapshotManifestEntry
): Promise<RegulatorySourceSnapshot> {
  const absolutePath = path.join(outputRoot, ...entry.path.split("/"));
  const snapshot = await readJsonFile<RegulatorySourceSnapshot>(absolutePath);
  if (!snapshot) throw new Error(`Regulatory snapshot file is missing: ${absolutePath}`);
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
  return loadStoredRegulatorySnapshot(outputRoot, entry);
}

function relativeSnapshotPath(snapshot: RegulatorySourceSnapshot): string {
  const date = snapshot.retrievedAt.slice(0, 10);
  const checksumSuffix = snapshot.checksum.replace(/^sha256:/, "").slice(0, 16);
  return path.posix.join(snapshot.sourceId, `${date}-${checksumSuffix}.json`);
}

export async function storeRegulatorySnapshot(
  outputRoot: string,
  snapshot: RegulatorySourceSnapshot
): Promise<StoreRegulatorySnapshotResult> {
  assertSafeSourceId(snapshot.sourceId);
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
  const absoluteSnapshotPath = path.join(outputRoot, ...relativePath.split("/"));
  const existingAtPath = await readJsonFile<RegulatorySourceSnapshot>(absoluteSnapshotPath);
  if (existingAtPath && existingAtPath.snapshotId !== snapshot.snapshotId) {
    throw new Error(`Regulatory snapshot path collision: ${absoluteSnapshotPath}`);
  }

  await writeJsonAtomic(absoluteSnapshotPath, snapshot);

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
