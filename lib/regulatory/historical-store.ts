import {
  loadRegulatorySnapshotManifest,
  loadStoredRegulatorySnapshot,
} from "./snapshot-store";
import type { RegulatorySourceSnapshot } from "./types";

export async function loadApprovedRegulatorySnapshots(
  outputRoot: string,
  sourceId: string
): Promise<RegulatorySourceSnapshot[]> {
  const manifest = await loadRegulatorySnapshotManifest(outputRoot, sourceId);
  const approvedEntries = manifest.snapshots.filter(
    (entry) => entry.reviewStatus === "approved"
  );
  const snapshots = await Promise.all(
    approvedEntries.map((entry) =>
      loadStoredRegulatorySnapshot(outputRoot, entry, sourceId)
    )
  );

  return snapshots.sort((left, right) => {
    const leftEffective = left.effectiveDate ?? "9999-12-31";
    const rightEffective = right.effectiveDate ?? "9999-12-31";
    return (
      leftEffective.localeCompare(rightEffective) ||
      left.retrievedAt.localeCompare(right.retrievedAt) ||
      left.snapshotId.localeCompare(right.snapshotId)
    );
  });
}
