import {
  canUseSnapshotForClientCitation,
  hasValidSnapshotChecksum,
} from "./ingestion";
import { getRegulatorySource } from "./source-catalog";
import type { RegulatorySourceSnapshot } from "./types";

export interface RegulatorySnapshotReviewDecision {
  decision: "approved" | "rejected";
  reviewedBy: string;
  reviewedAt: string;
  reviewNotes: string[];
  requiredTextAnchors: string[];
  verifiedVersionIdentifier?: string;
  verifiedEffectiveDate?: string;
}

const AUTOMATION_REVIEWER_RE = /(?:bot|automation|github[ -]?actions|workflow)/i;

function isIsoInstant(value: string): boolean {
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString() === value;
}

function normalized(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function requireMatchingRetainedMetadata(
  label: string,
  retainedValue: string | undefined,
  reviewedValue: string | undefined
): void {
  if (retainedValue !== undefined && reviewedValue === undefined) {
    throw new Error(`Regulatory snapshot approval requires verification of retained ${label}`);
  }
  if (retainedValue !== reviewedValue) {
    throw new Error(`Reviewed ${label} does not match the retained snapshot`);
  }
}

export function reviewRegulatorySnapshot(
  snapshot: RegulatorySourceSnapshot,
  review: RegulatorySnapshotReviewDecision
): RegulatorySourceSnapshot {
  if (snapshot.reviewStatus !== "pending") {
    throw new Error(`Only pending regulatory snapshots may be reviewed: ${snapshot.snapshotId}`);
  }
  if (!hasValidSnapshotChecksum(snapshot)) {
    throw new Error(`Regulatory snapshot checksum is invalid: ${snapshot.snapshotId}`);
  }
  const source = getRegulatorySource(snapshot.sourceId);
  if (!source) throw new Error(`Regulatory snapshot source is not approved: ${snapshot.sourceId}`);
  if (!review.reviewedBy.trim() || AUTOMATION_REVIEWER_RE.test(review.reviewedBy)) {
    throw new Error("Regulatory snapshot review requires an identified non-automated reviewer");
  }
  if (!isIsoInstant(review.reviewedAt)) {
    throw new Error("Regulatory snapshot review timestamp must be an exact ISO instant");
  }
  if (review.reviewNotes.length === 0 || review.reviewNotes.some((note) => !note.trim())) {
    throw new Error("Regulatory snapshot review requires substantive nonblank notes");
  }
  if (review.requiredTextAnchors.length === 0) {
    throw new Error("Regulatory snapshot review requires source-specific text anchors");
  }
  if (review.decision === "approved" && review.requiredTextAnchors.length < 2) {
    throw new Error("Regulatory snapshot approval requires at least two source-specific text anchors");
  }
  if (new Set(review.requiredTextAnchors.map(normalized)).size !== review.requiredTextAnchors.length) {
    throw new Error("Regulatory snapshot review anchors must be distinct");
  }

  const normalizedText = normalized(snapshot.text);
  for (const anchor of review.requiredTextAnchors) {
    if (!anchor.trim() || !normalizedText.includes(normalized(anchor))) {
      throw new Error(`Required regulatory source anchor is missing: ${anchor}`);
    }
  }

  if (review.decision === "approved") {
    requireMatchingRetainedMetadata(
      "version identifier",
      snapshot.versionIdentifier,
      review.verifiedVersionIdentifier
    );
    requireMatchingRetainedMetadata(
      "effective date",
      snapshot.effectiveDate,
      review.verifiedEffectiveDate
    );
  } else {
    if (
      review.verifiedVersionIdentifier !== undefined &&
      snapshot.versionIdentifier !== review.verifiedVersionIdentifier
    ) {
      throw new Error("Reviewed version identifier does not match the retained snapshot");
    }
    if (
      review.verifiedEffectiveDate !== undefined &&
      snapshot.effectiveDate !== review.verifiedEffectiveDate
    ) {
      throw new Error("Reviewed effective date does not match the retained snapshot");
    }
  }

  const reviewNotes = review.reviewNotes.map((note) => note.trim());
  const reviewed: RegulatorySourceSnapshot = {
    ...snapshot,
    reviewStatus: review.decision,
    reviewedBy: review.reviewedBy.trim(),
    reviewedAt: review.reviewedAt,
    reviewNotes,
    provenanceNotes: [
      ...snapshot.provenanceNotes,
      ...reviewNotes.map((note) => `Review: ${note}`),
    ],
  };

  if (review.decision === "approved" && !canUseSnapshotForClientCitation(reviewed)) {
    throw new Error("Reviewed snapshot failed client-citation eligibility controls");
  }
  return reviewed;
}
