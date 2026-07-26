import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";

import {
  fetchApprovedRegulatorySource,
  REGULATORY_INGESTION_STARTER_SOURCE_IDS,
} from "../ingestion";
import { storeRegulatorySnapshot } from "../snapshot-store";

const { values } = parseArgs({
  options: {
    "as-of": { type: "string" },
    "output-dir": { type: "string" },
    "result-file": { type: "string" },
    "source-id": { type: "string", multiple: true },
    starter: { type: "boolean", default: false },
  },
  strict: true,
});

const explicitSourceIds = values["source-id"] ?? [];
const sourceIds = [
  ...(values.starter ? REGULATORY_INGESTION_STARTER_SOURCE_IDS : []),
  ...explicitSourceIds,
];
const uniqueSourceIds = [...new Set(sourceIds)];

if (uniqueSourceIds.length === 0) {
  throw new Error("Provide --starter or at least one --source-id <catalog-id>.");
}

const outputRoot = path.resolve(
  process.cwd(),
  values["output-dir"] ?? "data/regulatory-snapshots"
);
const resultFile = values["result-file"]
  ? path.resolve(process.cwd(), values["result-file"])
  : undefined;
const results: Array<Record<string, unknown>> = [];
let failures = 0;

for (const sourceId of uniqueSourceIds) {
  try {
    const snapshot = await fetchApprovedRegulatorySource(sourceId, {
      asOfDate: values["as-of"] ?? "current",
    });
    const stored = await storeRegulatorySnapshot(outputRoot, snapshot);
    results.push({
      sourceId,
      status: stored.status,
      changeStatus: stored.comparison.status,
      checksum: snapshot.checksum,
      rawChecksum: snapshot.rawChecksum,
      snapshotId: snapshot.snapshotId,
      normalizedSnapshotId:
        stored.status === "observed"
          ? stored.comparison.previousSnapshotId
          : snapshot.snapshotId,
      snapshotPath: stored.snapshotPath,
      manifestPath: stored.manifestPath,
      observationCount: stored.manifest.observations.length,
      reviewStatus: snapshot.reviewStatus,
    });
  } catch (error) {
    failures++;
    results.push({
      sourceId,
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

const output = {
  outputRoot,
  sourceCount: uniqueSourceIds.length,
  failures,
  results,
};
const serialized = `${JSON.stringify(output, null, 2)}\n`;
if (resultFile) {
  await mkdir(path.dirname(resultFile), { recursive: true });
  await writeFile(resultFile, serialized, { encoding: "utf8", flag: "wx" });
}
process.stdout.write(serialized);

if (failures > 0) process.exitCode = 1;
