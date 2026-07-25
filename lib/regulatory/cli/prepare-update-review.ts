import path from "node:path";

import { prepareStoredRegulatoryUpdateReview } from "../update-review-command";

interface CliArguments {
  sourceId: string;
  snapshotRoot: string;
  packetRoot: string;
  requestedBy: string;
  createdAt: string;
  candidateSnapshotId?: string;
}

function valueAfter(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function parseArguments(args: string[]): CliArguments {
  const sourceId = valueAfter(args, "--source")?.trim();
  if (!sourceId) throw new Error("Missing required --source argument");
  const requestedBy = valueAfter(args, "--requested-by")?.trim();
  if (!requestedBy) throw new Error("Missing required --requested-by argument");
  const createdAt = valueAfter(args, "--created-at") ?? new Date().toISOString();
  const snapshotRoot = path.resolve(
    valueAfter(args, "--snapshot-root") ??
      process.env.REGULATORY_SNAPSHOT_ROOT ??
      "data/regulatory-snapshots"
  );
  const packetRoot = path.resolve(
    valueAfter(args, "--packet-root") ??
      process.env.REGULATORY_UPDATE_PACKET_ROOT ??
      "data/regulatory-update-reviews"
  );
  return {
    sourceId,
    snapshotRoot,
    packetRoot,
    requestedBy,
    createdAt,
    candidateSnapshotId: valueAfter(args, "--candidate-snapshot-id")?.trim(),
  };
}

async function main(): Promise<void> {
  const request = parseArguments(process.argv.slice(2));
  const result = await prepareStoredRegulatoryUpdateReview(request);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (result.status === "intake-refused") process.exitCode = 2;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
