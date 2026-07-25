import path from "node:path";

export interface PrepareUpdateReviewCliArguments {
  sourceId: string;
  snapshotRoot: string;
  packetRoot: string;
  requestedBy: string;
  createdAt: string;
  candidateSnapshotId?: string;
}

const OPTION_NAMES = new Set([
  "--source",
  "--snapshot-root",
  "--packet-root",
  "--requested-by",
  "--created-at",
  "--candidate-snapshot-id",
]);

function nonblank(value: string | undefined, name: string): string {
  const normalized = value?.trim();
  if (!normalized) throw new Error(`Missing required ${name} value`);
  return normalized;
}

export function parsePrepareUpdateReviewCliArguments(
  args: readonly string[],
  environment: Readonly<Record<string, string | undefined>> = process.env
): PrepareUpdateReviewCliArguments {
  const values = new Map<string, string>();

  for (let index = 0; index < args.length; index++) {
    const option = args[index];
    if (!option.startsWith("--")) {
      throw new Error(`Unexpected positional argument: ${option}`);
    }
    if (!OPTION_NAMES.has(option)) {
      throw new Error(`Unknown regulatory update review option: ${option}`);
    }
    if (values.has(option)) {
      throw new Error(`Duplicate regulatory update review option: ${option}`);
    }
    const value = args[index + 1];
    if (value === undefined || value.startsWith("--")) {
      throw new Error(`Missing value for regulatory update review option: ${option}`);
    }
    if (!value.trim()) {
      throw new Error(`Blank value for regulatory update review option: ${option}`);
    }
    values.set(option, value.trim());
    index++;
  }

  const sourceId = nonblank(values.get("--source"), "--source");
  const requestedBy = nonblank(values.get("--requested-by"), "--requested-by");
  const createdAt = values.get("--created-at") ?? new Date().toISOString();
  const snapshotRootValue =
    values.get("--snapshot-root") ??
    environment.REGULATORY_SNAPSHOT_ROOT ??
    "data/regulatory-snapshots";
  const packetRootValue =
    values.get("--packet-root") ??
    environment.REGULATORY_UPDATE_PACKET_ROOT ??
    "data/regulatory-update-reviews";

  if (!snapshotRootValue.trim()) {
    throw new Error("Regulatory snapshot root must not be blank");
  }
  if (!packetRootValue.trim()) {
    throw new Error("Regulatory update packet root must not be blank");
  }

  return {
    sourceId,
    snapshotRoot: path.resolve(snapshotRootValue),
    packetRoot: path.resolve(packetRootValue),
    requestedBy,
    createdAt,
    candidateSnapshotId: values.get("--candidate-snapshot-id"),
  };
}
