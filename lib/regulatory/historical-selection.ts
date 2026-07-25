import { canUseSnapshotForClientCitation } from "./ingestion";
import { getRegulatorySource } from "./source-catalog";
import type { RegulatorySourceSnapshot } from "./types";

export type RegulatoryAnalysisDateBasis =
  | "solicitation-issued"
  | "proposal-due"
  | "subcontract-executed"
  | "modification-effective"
  | "performance-started"
  | "user-specified";

export type RegulatoryAnalysisDateAuthority = "contract-evidence" | "user-provided";

export interface RegulatoryAnalysisDateContext {
  asOfDate: string;
  basis: RegulatoryAnalysisDateBasis;
  authority: RegulatoryAnalysisDateAuthority;
  evidenceQuotes: string[];
}

export type RegulatoryVersionSelectionStatus =
  | "selected"
  | "invalid-request"
  | "unknown-source"
  | "mixed-source-set"
  | "no-eligible-approved-snapshots"
  | "unresolved-version-metadata"
  | "before-known-history"
  | "coverage-gap"
  | "overlapping-effective-windows";

export interface RegulatoryVersionCandidate {
  snapshotId: string;
  versionIdentifier: string;
  effectiveDate: string;
  endExclusiveDate?: string;
  historicalStatus: RegulatorySourceSnapshot["historicalStatus"];
}

export interface RegulatoryVersionSelectionResult {
  status: RegulatoryVersionSelectionStatus;
  sourceId: string;
  asOfDate: string;
  basis: RegulatoryAnalysisDateBasis;
  selectedSnapshotId?: string;
  selectedVersionIdentifier?: string;
  candidates: RegulatoryVersionCandidate[];
  excludedSnapshotIds: string[];
  missingFacts: string[];
  explanation: string;
}

export interface ApprovedRegulatorySnapshotSelection
  extends RegulatoryVersionSelectionResult {
  selectedSnapshot?: RegulatorySourceSnapshot;
}

interface ParsedVersionCandidate extends RegulatoryVersionCandidate {
  effectiveDay: number;
  endExclusiveDay?: number;
}

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;
const ANALYSIS_DATE_BASES = new Set<string>([
  "solicitation-issued",
  "proposal-due",
  "subcontract-executed",
  "modification-effective",
  "performance-started",
  "user-specified",
]);
const ANALYSIS_DATE_AUTHORITIES = new Set<string>([
  "contract-evidence",
  "user-provided",
]);

function parseDateOnly(value: string): number | undefined {
  if (!DATE_ONLY_RE.test(value)) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  const timestamp = Date.UTC(year, month - 1, day);
  const date = new Date(timestamp);
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  ) {
    return undefined;
  }
  return timestamp;
}

function normalizeContext(value: unknown): RegulatoryAnalysisDateContext {
  const record =
    typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : {};
  const evidenceQuotes = Array.isArray(record.evidenceQuotes)
    ? record.evidenceQuotes.filter((quote): quote is string => typeof quote === "string")
    : [];
  return {
    asOfDate: typeof record.asOfDate === "string" ? record.asOfDate : "",
    basis: ANALYSIS_DATE_BASES.has(String(record.basis))
      ? (record.basis as RegulatoryAnalysisDateBasis)
      : "user-specified",
    authority: ANALYSIS_DATE_AUTHORITIES.has(String(record.authority))
      ? (record.authority as RegulatoryAnalysisDateAuthority)
      : "user-provided",
    evidenceQuotes,
  };
}

function baseResult(
  status: RegulatoryVersionSelectionStatus,
  sourceId: string,
  context: RegulatoryAnalysisDateContext,
  explanation: string,
  overrides: Partial<RegulatoryVersionSelectionResult> = {}
): RegulatoryVersionSelectionResult {
  return {
    status,
    sourceId,
    asOfDate: context.asOfDate,
    basis: context.basis,
    candidates: [],
    excludedSnapshotIds: [],
    missingFacts: [],
    explanation,
    ...overrides,
  };
}

function validateContext(
  rawContext: unknown,
  context: RegulatoryAnalysisDateContext
): string[] {
  const errors: string[] = [];
  const record =
    typeof rawContext === "object" && rawContext !== null
      ? (rawContext as Record<string, unknown>)
      : undefined;

  if (!record) {
    errors.push("Analysis-date context must be an object");
    return errors;
  }
  if (typeof record.asOfDate !== "string" || parseDateOnly(context.asOfDate) === undefined) {
    errors.push("Analysis date must be a real calendar date in YYYY-MM-DD format");
  }
  if (typeof record.basis !== "string" || !ANALYSIS_DATE_BASES.has(record.basis)) {
    errors.push("Analysis date basis is unsupported");
  }
  if (
    typeof record.authority !== "string" ||
    !ANALYSIS_DATE_AUTHORITIES.has(record.authority)
  ) {
    errors.push("Analysis date authority is unsupported");
  }
  if (!Array.isArray(record.evidenceQuotes)) {
    errors.push("Analysis-date evidence quotes must be an array");
  } else if (record.evidenceQuotes.some((quote) => typeof quote !== "string")) {
    errors.push("Analysis-date evidence quotes must contain only strings");
  }

  if (context.authority === "contract-evidence") {
    if (
      context.evidenceQuotes.length === 0 ||
      context.evidenceQuotes.some((quote) => !quote.trim())
    ) {
      errors.push(
        "A contract-derived analysis date requires at least one exact nonblank evidence quote"
      );
    }
  } else if (context.evidenceQuotes.some((quote) => !quote.trim())) {
    errors.push("Analysis-date evidence quotes must not be blank");
  }
  if (context.basis === "user-specified" && context.authority !== "user-provided") {
    errors.push("A user-specified date must identify the user as its authority");
  }
  if (context.basis !== "user-specified" && context.authority !== "contract-evidence") {
    errors.push("A contract date basis must be grounded in contract evidence");
  }
  return [...new Set(errors)];
}

function parseCandidate(snapshot: RegulatorySourceSnapshot): {
  candidate?: ParsedVersionCandidate;
  error?: string;
} {
  if (!snapshot.versionIdentifier?.trim()) {
    return { error: `${snapshot.snapshotId}: version identifier is missing` };
  }
  if (!snapshot.effectiveDate) {
    return { error: `${snapshot.snapshotId}: effective date is missing` };
  }
  const effectiveDay = parseDateOnly(snapshot.effectiveDate);
  if (effectiveDay === undefined) {
    return { error: `${snapshot.snapshotId}: effective date is invalid` };
  }

  let endExclusiveDay: number | undefined;
  if (snapshot.expirationOrSupersededDate !== undefined) {
    endExclusiveDay = parseDateOnly(snapshot.expirationOrSupersededDate);
    if (endExclusiveDay === undefined) {
      return { error: `${snapshot.snapshotId}: superseded or expiration date is invalid` };
    }
    if (endExclusiveDay <= effectiveDay) {
      return {
        error: `${snapshot.snapshotId}: superseded or expiration date must be after the effective date`,
      };
    }
  }

  return {
    candidate: {
      snapshotId: snapshot.snapshotId,
      versionIdentifier: snapshot.versionIdentifier.trim(),
      effectiveDate: snapshot.effectiveDate,
      endExclusiveDate: snapshot.expirationOrSupersededDate,
      historicalStatus: snapshot.historicalStatus,
      effectiveDay,
      endExclusiveDay,
    },
  };
}

function publicCandidate(candidate: ParsedVersionCandidate): RegulatoryVersionCandidate {
  return {
    snapshotId: candidate.snapshotId,
    versionIdentifier: candidate.versionIdentifier,
    effectiveDate: candidate.effectiveDate,
    endExclusiveDate: candidate.endExclusiveDate,
    historicalStatus: candidate.historicalStatus,
  };
}

export function selectRegulatoryVersionForDate(
  sourceId: string,
  snapshots: readonly RegulatorySourceSnapshot[],
  contextInput: RegulatoryAnalysisDateContext
): RegulatoryVersionSelectionResult {
  const context = normalizeContext(contextInput);
  const contextErrors = validateContext(contextInput, context);
  if (contextErrors.length > 0) {
    return baseResult(
      "invalid-request",
      sourceId,
      context,
      "The regulatory analysis date is not sufficiently grounded for version selection.",
      { missingFacts: contextErrors }
    );
  }

  if (!getRegulatorySource(sourceId)) {
    return baseResult(
      "unknown-source",
      sourceId,
      context,
      "The requested regulatory source is not in the approved source catalog.",
      { missingFacts: [`Approved source catalog entry for ${sourceId}`] }
    );
  }

  const duplicateSnapshotIds = snapshots
    .map((snapshot) => snapshot.snapshotId)
    .filter((snapshotId, index, values) => values.indexOf(snapshotId) !== index);
  if (duplicateSnapshotIds.length > 0) {
    return baseResult(
      "invalid-request",
      sourceId,
      context,
      "The source set contains duplicate snapshot identities.",
      {
        missingFacts: [...new Set(duplicateSnapshotIds)].map(
          (id) => `Unique snapshot identity: ${id}`
        ),
      }
    );
  }

  const mismatched = snapshots.filter((snapshot) => snapshot.sourceId !== sourceId);
  if (mismatched.length > 0) {
    return baseResult(
      "mixed-source-set",
      sourceId,
      context,
      "Historical selection cannot compare snapshots from different regulatory sources.",
      {
        excludedSnapshotIds: mismatched.map((snapshot) => snapshot.snapshotId),
        missingFacts: [`A source-homogeneous snapshot set for ${sourceId}`],
      }
    );
  }

  const eligible = snapshots.filter(
    (snapshot) =>
      snapshot.reviewStatus === "approved" &&
      snapshot.historicalStatus !== "proposed" &&
      canUseSnapshotForClientCitation(snapshot)
  );
  const eligibleIds = new Set(eligible.map((snapshot) => snapshot.snapshotId));
  const excludedSnapshotIds = snapshots
    .filter((snapshot) => !eligibleIds.has(snapshot.snapshotId))
    .map((snapshot) => snapshot.snapshotId);

  if (eligible.length === 0) {
    return baseResult(
      "no-eligible-approved-snapshots",
      sourceId,
      context,
      "No approved, citation-eligible, non-proposed snapshot is available for date selection.",
      {
        excludedSnapshotIds,
        missingFacts: [`An approved official-source snapshot for ${sourceId}`],
      }
    );
  }

  const parsed: ParsedVersionCandidate[] = [];
  const metadataErrors: string[] = [];
  for (const snapshot of eligible) {
    const result = parseCandidate(snapshot);
    if (result.error) metadataErrors.push(result.error);
    else if (result.candidate) parsed.push(result.candidate);
  }

  if (metadataErrors.length > 0) {
    return baseResult(
      "unresolved-version-metadata",
      sourceId,
      context,
      "Approved source text exists, but its effective version window is incomplete or invalid.",
      {
        candidates: parsed.map(publicCandidate),
        excludedSnapshotIds,
        missingFacts: metadataErrors,
      }
    );
  }

  parsed.sort(
    (left, right) =>
      left.effectiveDay - right.effectiveDay || left.snapshotId.localeCompare(right.snapshotId)
  );
  const asOfDay = parseDateOnly(context.asOfDate)!;
  const active = parsed.filter(
    (candidate) =>
      candidate.effectiveDay <= asOfDay &&
      (candidate.endExclusiveDay === undefined || asOfDay < candidate.endExclusiveDay)
  );
  const candidates = parsed.map(publicCandidate);

  if (active.length > 1) {
    return baseResult(
      "overlapping-effective-windows",
      sourceId,
      context,
      "More than one approved source version claims to be effective on the analysis date.",
      {
        candidates,
        excludedSnapshotIds,
        missingFacts: [
          `Resolve overlapping effective windows for ${active
            .map((candidate) => candidate.versionIdentifier)
            .join(", ")}`,
        ],
      }
    );
  }

  if (active.length === 1) {
    const selected = active[0];
    return baseResult(
      "selected",
      sourceId,
      context,
      "One approved source version covers the grounded analysis date.",
      {
        selectedSnapshotId: selected.snapshotId,
        selectedVersionIdentifier: selected.versionIdentifier,
        candidates,
        excludedSnapshotIds,
      }
    );
  }

  const earliest = parsed[0];
  if (asOfDay < earliest.effectiveDay) {
    return baseResult(
      "before-known-history",
      sourceId,
      context,
      "The analysis date predates the earliest approved source version retained by SubShield.",
      {
        candidates,
        excludedSnapshotIds,
        missingFacts: [
          `An approved ${sourceId} snapshot effective on or before ${context.asOfDate}`,
        ],
      }
    );
  }

  return baseResult(
    "coverage-gap",
    sourceId,
    context,
    "The approved source history does not contain a version window covering the analysis date.",
    {
      candidates,
      excludedSnapshotIds,
      missingFacts: [
        `The official ${sourceId} version effective on ${context.asOfDate}`,
        "A verified effective date and first non-effective date for adjacent source versions",
      ],
    }
  );
}

export function selectApprovedRegulatorySnapshotForDate(
  sourceId: string,
  snapshots: readonly RegulatorySourceSnapshot[],
  context: RegulatoryAnalysisDateContext
): ApprovedRegulatorySnapshotSelection {
  const result = selectRegulatoryVersionForDate(sourceId, snapshots, context);
  const selectedSnapshot = result.selectedSnapshotId
    ? snapshots.find((snapshot) => snapshot.snapshotId === result.selectedSnapshotId)
    : undefined;
  return { ...result, selectedSnapshot };
}
