import path from "node:path";

export interface RegulatoryReviewDecisionCliArguments {
  snapshotRoot: string;
  sourceId: string;
  snapshotId: string;
  decision: "approved" | "rejected";
  reviewedBy: string;
  reviewedAt: string;
  reviewNotes: string[];
  requiredTextAnchors: string[];
  verifiedVersionIdentifier?: string;
  verifiedEffectiveDate?: string;
  resultFile?: string;
}

const SINGLE_OPTIONS = new Set([
  "--snapshot-root",
  "--source",
  "--snapshot-id",
  "--decision",
  "--reviewed-by",
  "--reviewed-at",
  "--verified-version",
  "--verified-effective-date",
  "--result-file",
]);
const REPEATED_OPTIONS = new Set(["--note", "--anchor"]);
const ALL_OPTIONS = new Set([...SINGLE_OPTIONS, ...REPEATED_OPTIONS]);

function required(values: ReadonlyMap<string, string>, option: string): string {
  const value = values.get(option)?.trim();
  if (!value) throw new Error(`Missing required ${option} value`);
  return value;
}

export function parseRegulatoryReviewDecisionCliArguments(
  args: readonly string[],
  environment: Readonly<Record<string, string | undefined>> = process.env
): RegulatoryReviewDecisionCliArguments {
  const singles = new Map<string, string>();
  const repeated = new Map<string, string[]>();

  for (let index = 0; index < args.length; index++) {
    const option = args[index];
    if (!option.startsWith("--")) {
      throw new Error(`Unexpected positional regulatory review argument: ${option}`);
    }
    if (!ALL_OPTIONS.has(option)) {
      throw new Error(`Unknown regulatory review option: ${option}`);
    }
    const value = args[index + 1];
    if (value === undefined || value.startsWith("--")) {
      throw new Error(`Missing value for regulatory review option: ${option}`);
    }
    const normalized = value.trim();
    if (!normalized) {
      throw new Error(`Blank value for regulatory review option: ${option}`);
    }

    if (SINGLE_OPTIONS.has(option)) {
      if (singles.has(option)) {
        throw new Error(`Duplicate regulatory review option: ${option}`);
      }
      singles.set(option, normalized);
    } else {
      repeated.set(option, [...(repeated.get(option) ?? []), normalized]);
    }
    index++;
  }

  const decision = required(singles, "--decision");
  if (decision !== "approved" && decision !== "rejected") {
    throw new Error("Regulatory review --decision must be approved or rejected");
  }
  const notes = repeated.get("--note") ?? [];
  const anchors = repeated.get("--anchor") ?? [];
  if (notes.length === 0) {
    throw new Error("Regulatory review requires at least one --note value");
  }
  if (anchors.length === 0) {
    throw new Error("Regulatory review requires at least one --anchor value");
  }

  const snapshotRootValue =
    singles.get("--snapshot-root") ??
    environment.REGULATORY_SNAPSHOT_ROOT ??
    "data/regulatory-snapshots";
  if (!snapshotRootValue.trim()) {
    throw new Error("Regulatory snapshot root must not be blank");
  }

  return {
    snapshotRoot: path.resolve(snapshotRootValue),
    sourceId: required(singles, "--source"),
    snapshotId: required(singles, "--snapshot-id"),
    decision,
    reviewedBy: required(singles, "--reviewed-by"),
    reviewedAt: required(singles, "--reviewed-at"),
    reviewNotes: notes,
    requiredTextAnchors: anchors,
    verifiedVersionIdentifier: singles.get("--verified-version"),
    verifiedEffectiveDate: singles.get("--verified-effective-date"),
    resultFile: singles.get("--result-file")
      ? path.resolve(singles.get("--result-file") as string)
      : undefined,
  };
}
