import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";

import {
  prepareRegulatoryIngestionReviewBatch,
  type RegulatoryIngestionResultDocument,
} from "../ingestion-review-batch";

const { values } = parseArgs({
  options: {
    "ingestion-result": { type: "string" },
    "snapshot-root": { type: "string" },
    "packet-root": { type: "string" },
    "requested-by": { type: "string" },
    "created-at": { type: "string" },
    "result-file": { type: "string" },
  },
  strict: true,
});

const ingestionResultPath = values["ingestion-result"]?.trim();
if (!ingestionResultPath) throw new Error("Missing required --ingestion-result argument");
const requestedBy = values["requested-by"]?.trim();
if (!requestedBy) throw new Error("Missing required --requested-by argument");

const inputPath = path.resolve(process.cwd(), ingestionResultPath);
const snapshotRoot = path.resolve(
  process.cwd(),
  values["snapshot-root"] ?? "data/regulatory-snapshots"
);
const packetRoot = path.resolve(
  process.cwd(),
  values["packet-root"] ?? "data/regulatory-update-reviews"
);
const createdAt = values["created-at"] ?? new Date().toISOString();
const resultFile = values["result-file"]
  ? path.resolve(process.cwd(), values["result-file"])
  : undefined;

const parsed = JSON.parse(await readFile(inputPath, "utf8")) as RegulatoryIngestionResultDocument;
const result = await prepareRegulatoryIngestionReviewBatch({
  ingestion: parsed,
  snapshotRoot,
  packetRoot,
  requestedBy,
  createdAt,
});
const serialized = `${JSON.stringify(result, null, 2)}\n`;
if (resultFile) {
  await mkdir(path.dirname(resultFile), { recursive: true });
  await writeFile(resultFile, serialized, { encoding: "utf8", flag: "wx" });
}
process.stdout.write(serialized);

if (result.ingestionFailureCount > 0) process.exitCode = 2;
