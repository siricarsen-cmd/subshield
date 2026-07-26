import path from "node:path";

import type {
  RegulatoryBenchmarkValidationAttestation,
  StoredRegulatoryChangeSetReviewDecision,
  StoredRegulatoryChangeSetReviewKind,
} from "../stored-change-set-review";

export interface StoredChangeSetReviewCliArguments {
  snapshotRoot: string;
  packetRoot: string;
  draftRoot: string;
  reviewRoot: string;
  sourceId: string;
  packetRelativePath: string;
  draftRelativePath: string;
  decision: StoredRegulatoryChangeSetReviewDecision;
  reviewedBy: string;
  reviewedAt: string;
  reviewNotes: string[];
  reviewedKinds: StoredRegulatoryChangeSetReviewKind[];
  benchmarkValidation?: RegulatoryBenchmarkValidationAttestation;
  releaseCreatedAt?: string;
  resultFile?: string;
}

const SINGLE_OPTIONS = new Set([
  "--snapshot-root",
  "--packet-root",
  "--draft-root",
  "--review-root",
  "--source",
  "--packet-path",
  "--draft-path",
  "--decision",
  "--reviewed-by",
  "--reviewed-at",
  "--release-created-at",
  "--validation-commit",
  "--regulatory-run-id",
  "--analyzer-run-id",
  "--validation-completed-at",
  "--result-file",
]);
const REPEATED_OPTIONS = new Set(["--note", "--review-kind"]);
const ALL_OPTIONS = new Set([...SINGLE_OPTIONS, ...REPEATED_OPTIONS]);
const ALLOWED_REVIEW_KINDS = new Set<StoredRegulatoryChangeSetReviewKind>([
  "mapping",
  "historical-policy",
  "citation-template",
]);

function required(values: ReadonlyMap<string, string>, option: string): string {
  const value = values.get(option)?.trim();
  if (!value) throw new Error(`Missing required ${option} value`);
  return value;
}

function positiveInteger(value: string, option: string): number {
  if (!/^\d+$/.test(value)) throw new Error(`${option} must be a positive integer`);
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${option} must be a positive safe integer`);
  }
  return parsed;
}

export function parseStoredChangeSetReviewCliArguments(
  args: readonly string[],
  environment: Readonly<Record<string, string | undefined>> = process.env
): StoredChangeSetReviewCliArguments {
  const singles = new Map<string, string>();
  const repeated = new Map<string, string[]>();

  for (let index = 0; index < args.length; index++) {
    const option = args[index];
    if (!option.startsWith("--")) {
      throw new Error(`Unexpected positional stored change-set review argument: ${option}`);
    }
    if (!ALL_OPTIONS.has(option)) {
      throw new Error(`Unknown stored change-set review option: ${option}`);
    }
    const value = args[index + 1];
    if (value === undefined || value.startsWith("--")) {
      throw new Error(`Missing value for stored change-set review option: ${option}`);
    }
    const normalized = value.trim();
    if (!normalized) {
      throw new Error(`Blank value for stored change-set review option: ${option}`);
    }
    if (SINGLE_OPTIONS.has(option)) {
      if (singles.has(option)) {
        throw new Error(`Duplicate stored change-set review option: ${option}`);
      }
      singles.set(option, normalized);
    } else {
      repeated.set(option, [...(repeated.get(option) ?? []), normalized]);
    }
    index++;
  }

  const decisionValue = required(singles, "--decision");
  if (decisionValue !== "approved" && decisionValue !== "rejected") {
    throw new Error("Stored change-set review --decision must be approved or rejected");
  }
  const decision: StoredRegulatoryChangeSetReviewDecision = decisionValue;
  const notes = repeated.get("--note") ?? [];
  if (notes.length === 0) {
    throw new Error("Stored change-set review requires at least one --note value");
  }
  const kinds = repeated.get("--review-kind") ?? [];
  if (kinds.length === 0) {
    throw new Error("Stored change-set review requires at least one --review-kind value");
  }
  if (new Set(kinds).size !== kinds.length) {
    throw new Error("Stored change-set review kinds must not be duplicated");
  }
  for (const kind of kinds) {
    if (!ALLOWED_REVIEW_KINDS.has(kind as StoredRegulatoryChangeSetReviewKind)) {
      throw new Error(`Unknown stored change-set review kind: ${kind}`);
    }
  }
  const reviewedKinds = kinds as StoredRegulatoryChangeSetReviewKind[];

  const benchmarkOptionNames = [
    "--validation-commit",
    "--regulatory-run-id",
    "--analyzer-run-id",
    "--validation-completed-at",
  ];
  const benchmarkValues = benchmarkOptionNames.map((option) => singles.get(option));
  let benchmarkValidation: RegulatoryBenchmarkValidationAttestation | undefined;
  let releaseCreatedAt: string | undefined;
  if (decision === "approved") {
    releaseCreatedAt = required(singles, "--release-created-at");
    benchmarkValidation = {
      evidenceStatus: "reviewer-attested-not-machine-verified",
      repository: "siricarsen-cmd/subshield",
      commitSha: required(singles, "--validation-commit"),
      regulatoryWorkflowRunId: positiveInteger(
        required(singles, "--regulatory-run-id"),
        "--regulatory-run-id"
      ),
      analyzerWorkflowRunId: positiveInteger(
        required(singles, "--analyzer-run-id"),
        "--analyzer-run-id"
      ),
      completedAt: required(singles, "--validation-completed-at"),
      regulatoryConclusion: "success",
      analyzerConclusion: "success",
    };
  } else {
    if (singles.has("--release-created-at") || benchmarkValues.some(Boolean)) {
      throw new Error(
        "Rejected stored change-set reviews must not include release or benchmark approval options"
      );
    }
  }

  const snapshotRoot =
    singles.get("--snapshot-root") ??
    environment.REGULATORY_SNAPSHOT_ROOT ??
    "data/regulatory-snapshots";
  const packetRoot =
    singles.get("--packet-root") ??
    environment.REGULATORY_UPDATE_PACKET_ROOT ??
    "data/regulatory-update-reviews";
  const draftRoot =
    singles.get("--draft-root") ??
    environment.REGULATORY_CHANGE_SET_DRAFT_ROOT ??
    "data/regulatory-change-set-drafts";
  const reviewRoot =
    singles.get("--review-root") ??
    environment.REGULATORY_CHANGE_SET_REVIEW_ROOT ??
    "data/regulatory-change-set-reviews";
  for (const [label, value] of [
    ["snapshot root", snapshotRoot],
    ["packet root", packetRoot],
    ["draft root", draftRoot],
    ["review root", reviewRoot],
  ] as const) {
    if (!value.trim()) throw new Error(`Stored change-set ${label} must not be blank`);
  }

  return {
    snapshotRoot: path.resolve(snapshotRoot),
    packetRoot: path.resolve(packetRoot),
    draftRoot: path.resolve(draftRoot),
    reviewRoot: path.resolve(reviewRoot),
    sourceId: required(singles, "--source"),
    packetRelativePath: required(singles, "--packet-path"),
    draftRelativePath: required(singles, "--draft-path"),
    decision,
    reviewedBy: required(singles, "--reviewed-by"),
    reviewedAt: required(singles, "--reviewed-at"),
    reviewNotes: notes,
    reviewedKinds,
    benchmarkValidation,
    releaseCreatedAt,
    resultFile: singles.get("--result-file")
      ? path.resolve(singles.get("--result-file") as string)
      : undefined,
  };
}
