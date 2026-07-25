import { createHash } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  selectApprovedRegulatorySnapshotForDate,
  selectRegulatoryVersionForDate,
} from "../historical-selection.ts";
import { loadApprovedRegulatorySnapshots } from "../historical-store.ts";
import { reviewRegulatorySnapshot } from "../source-review.ts";
import { getRegulatorySource } from "../source-catalog.ts";
import {
  persistRegulatorySnapshotReview,
  storeRegulatorySnapshot,
} from "../snapshot-store.ts";

let assertions = 0;
let failures = 0;

function check(label, condition, details = "") {
  assertions++;
  if (condition) console.log(`PASS: ${label}`);
  else {
    failures++;
    console.error(`FAIL: ${label}${details ? ` — ${details}` : ""}`);
  }
}

function sha256(value) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function createSnapshot({
  sourceId = "far-current",
  versionIdentifier,
  effectiveDate,
  endExclusiveDate,
  retrievedAt,
  historicalStatus = "current",
  reviewStatus = "approved",
  marker,
}) {
  const source = getRegulatorySource(sourceId);
  if (!source) throw new Error(`Unknown test source: ${sourceId}`);
  const text = `Official selection-only regression fixture for ${versionIdentifier}. ${marker}. This text is synthetic and is never used as a customer citation or regulatory conclusion.`;
  const checksum = sha256(text);
  return {
    snapshotId: `${sourceId}:${versionIdentifier}:${checksum.slice(-12)}`,
    sourceId,
    citation: versionIdentifier,
    canonicalTitle: source.canonicalTitle,
    canonicalUrl: source.canonicalUrl,
    versionIdentifier,
    effectiveDate,
    expirationOrSupersededDate: endExclusiveDate,
    retrievedAt,
    checksum,
    rawChecksum: checksum,
    normalizationVersion: "regulatory-text-v1",
    contentFormat: "text",
    retrieval: {
      requestedUrl: source.canonicalUrl,
      finalUrl: source.canonicalUrl,
      status: 200,
      contentType: "text/plain",
      rawByteLength: Buffer.byteLength(text),
      retrievedAt,
      redirectChain: [],
    },
    historicalStatus,
    text,
    applicabilityMetadata: { selectionFixtureOnly: true },
    crossReferences: [],
    provenanceNotes: [
      "Synthetic metadata-only historical selection fixture; never a customer citation.",
    ],
    reviewStatus,
    reviewedBy: reviewStatus === "pending" ? undefined : "SubShield regulatory reviewer",
    reviewedAt: reviewStatus === "pending" ? undefined : "2026-07-25T23:30:00.000Z",
    reviewNotes:
      reviewStatus === "pending"
        ? undefined
        : ["Reviewed for historical version-selection regression behavior only."],
  };
}

const CONTRACT_DOCUMENT = `FICTIONAL SUBCONTRACT DATE FIXTURE
Subcontract Effective Date: June 15, 2024.
Modification Effective Date: January 1, 2025.
Solicitation issued December 31, 2023.
Performance begins 06/20/2024.
END DATE FIXTURE`;

const contractContext = {
  asOfDate: "2024-06-15",
  basis: "subcontract-executed",
  authority: "contract-evidence",
  evidenceQuotes: ["Subcontract Effective Date: June 15, 2024."],
  evidenceDocumentText: CONTRACT_DOCUMENT,
};

const oldVersion = createSnapshot({
  versionIdentifier: "FAC TEST-2024",
  effectiveDate: "2024-01-01",
  endExclusiveDate: "2025-01-01",
  retrievedAt: "2026-06-01T12:00:00.000Z",
  historicalStatus: "superseded",
  marker: "Older effective version retrieved after the newer version",
});
const currentVersion = createSnapshot({
  versionIdentifier: "FAC TEST-2025",
  effectiveDate: "2025-01-01",
  retrievedAt: "2026-01-01T12:00:00.000Z",
  historicalStatus: "current",
  marker: "Newer effective version retrieved before the older archive",
});

const oldSelection = selectRegulatoryVersionForDate(
  "far-current",
  [currentVersion, oldVersion],
  contractContext
);
check(
  "verified contract execution date selects the historical version effective on that date",
  oldSelection.status === "selected" &&
    oldSelection.selectedSnapshotId === oldVersion.snapshotId &&
    oldSelection.selectedVersionIdentifier === "FAC TEST-2024"
);
check(
  "retrieval chronology never overrides regulatory effective dates",
  oldVersion.retrievedAt > currentVersion.retrievedAt &&
    oldSelection.selectedSnapshotId === oldVersion.snapshotId
);
check(
  "selection preserves the exact grounded date basis",
  oldSelection.asOfDate === contractContext.asOfDate &&
    oldSelection.basis === "subcontract-executed"
);

const boundarySelection = selectRegulatoryVersionForDate(
  "far-current",
  [oldVersion, currentVersion],
  {
    ...contractContext,
    asOfDate: "2025-01-01",
    evidenceQuotes: ["Modification Effective Date: January 1, 2025."],
    basis: "modification-effective",
  }
);
check(
  "the superseded date is an exclusive boundary and selects the new version on that date",
  boundarySelection.status === "selected" &&
    boundarySelection.selectedSnapshotId === currentVersion.snapshotId
);

const slashDateSelection = selectRegulatoryVersionForDate(
  "far-current",
  [oldVersion, currentVersion],
  {
    ...contractContext,
    asOfDate: "2024-06-20",
    evidenceQuotes: ["Performance begins 06/20/2024."],
    basis: "performance-started",
  }
);
check(
  "numeric slash dates are verified against the stated analysis date",
  slashDateSelection.status === "selected" &&
    slashDateSelection.selectedSnapshotId === oldVersion.snapshotId
);

const actualSnapshotSelection = selectApprovedRegulatorySnapshotForDate(
  "far-current",
  [oldVersion, currentVersion],
  contractContext
);
check(
  "snapshot adapter returns the exact selected approved snapshot",
  actualSnapshotSelection.selectedSnapshot === oldVersion
);

const inventedQuoteSelection = selectRegulatoryVersionForDate(
  "far-current",
  [oldVersion, currentVersion],
  {
    ...contractContext,
    evidenceQuotes: ["Subcontract Effective Date: June 15, 2024. Invented tail."],
  }
);
check(
  "a quote absent from the analyzed document cannot select a version",
  inventedQuoteSelection.status === "invalid-request" &&
    inventedQuoteSelection.missingFacts.some((fact) => /not present in the analyzed document/i.test(fact))
);

const unrelatedDateSelection = selectRegulatoryVersionForDate(
  "far-current",
  [oldVersion, currentVersion],
  {
    ...contractContext,
    evidenceQuotes: ["Solicitation issued December 31, 2023."],
  }
);
check(
  "a real quote containing a different date cannot support the stated analysis date",
  unrelatedDateSelection.status === "invalid-request" &&
    unrelatedDateSelection.missingFacts.some((fact) => /contains the stated date 2024-06-15/i.test(fact))
);

const missingDocumentSelection = selectRegulatoryVersionForDate(
  "far-current",
  [oldVersion, currentVersion],
  { ...contractContext, evidenceDocumentText: undefined }
);
check(
  "contract-date evidence cannot be accepted without the analyzed document text",
  missingDocumentSelection.status === "invalid-request" &&
    missingDocumentSelection.missingFacts.some((fact) => /requires the analyzed document text/i.test(fact))
);

const gapOld = createSnapshot({
  versionIdentifier: "FAC GAP-OLD",
  effectiveDate: "2024-01-01",
  endExclusiveDate: "2024-05-01",
  retrievedAt: "2026-01-02T12:00:00.000Z",
  historicalStatus: "superseded",
  marker: "Version ending before the requested date",
});
const gapNew = createSnapshot({
  versionIdentifier: "FAC GAP-NEW",
  effectiveDate: "2024-07-01",
  retrievedAt: "2026-01-03T12:00:00.000Z",
  marker: "Version beginning after the requested date",
});
const gapSelection = selectRegulatoryVersionForDate(
  "far-current",
  [gapOld, gapNew],
  contractContext
);
check(
  "a gap between approved effective windows refuses to guess a version",
  gapSelection.status === "coverage-gap" &&
    gapSelection.selectedSnapshotId === undefined &&
    gapSelection.missingFacts.some((fact) => /version effective on 2024-06-15/i.test(fact))
);

const overlapOld = createSnapshot({
  versionIdentifier: "FAC OVERLAP-OLD",
  effectiveDate: "2024-01-01",
  endExclusiveDate: "2025-06-01",
  retrievedAt: "2026-01-04T12:00:00.000Z",
  historicalStatus: "superseded",
  marker: "Overlapping older version",
});
const overlapNew = createSnapshot({
  versionIdentifier: "FAC OVERLAP-NEW",
  effectiveDate: "2024-05-01",
  retrievedAt: "2026-01-05T12:00:00.000Z",
  marker: "Overlapping newer version",
});
const overlapSelection = selectRegulatoryVersionForDate(
  "far-current",
  [overlapOld, overlapNew],
  contractContext
);
check(
  "overlapping effective windows produce a conflict rather than arbitrary selection",
  overlapSelection.status === "overlapping-effective-windows" &&
    overlapSelection.selectedSnapshotId === undefined
);

const beforeSelection = selectRegulatoryVersionForDate(
  "far-current",
  [oldVersion, currentVersion],
  {
    ...contractContext,
    asOfDate: "2023-12-31",
    evidenceQuotes: ["Solicitation issued December 31, 2023."],
    basis: "solicitation-issued",
  }
);
check(
  "a date before retained history reports missing historical coverage",
  beforeSelection.status === "before-known-history" &&
    beforeSelection.missingFacts.some((fact) => /on or before 2023-12-31/i.test(fact))
);

const undated = createSnapshot({
  versionIdentifier: "FAC UNDATED",
  effectiveDate: undefined,
  retrievedAt: "2026-01-06T12:00:00.000Z",
  marker: "Approved but undated version",
});
const undatedSelection = selectRegulatoryVersionForDate(
  "far-current",
  [oldVersion, undated],
  contractContext
);
check(
  "any approved snapshot with unresolved version metadata blocks definitive selection",
  undatedSelection.status === "unresolved-version-metadata" &&
    undatedSelection.missingFacts.some((fact) => /effective date is missing/i.test(fact))
);

const supersededWithoutEnd = createSnapshot({
  versionIdentifier: "FAC SUPERSEDED-NO-END",
  effectiveDate: "2024-01-01",
  retrievedAt: "2026-01-06T13:00:00.000Z",
  historicalStatus: "superseded",
  marker: "Obsolete version lacking its first non-effective date",
});
const noEndSelection = selectRegulatoryVersionForDate(
  "far-current",
  [supersededWithoutEnd],
  contractContext
);
check(
  "a superseded snapshot without a verified end boundary cannot appear effective forever",
  noEndSelection.status === "unresolved-version-metadata" &&
    noEndSelection.missingFacts.some((fact) => /lacks its first non-effective date/i.test(fact))
);

const malformedWindow = createSnapshot({
  versionIdentifier: "FAC BAD-WINDOW",
  effectiveDate: "2025-01-01",
  endExclusiveDate: "2024-12-31",
  retrievedAt: "2026-01-07T12:00:00.000Z",
  marker: "Invalid reverse effective window",
});
const malformedSelection = selectRegulatoryVersionForDate(
  "far-current",
  [malformedWindow],
  { ...contractContext, asOfDate: "2025-01-15" }
);
check(
  "an invalid effective window is surfaced as unresolved metadata",
  malformedSelection.status === "unresolved-version-metadata" &&
    malformedSelection.missingFacts.some((fact) => /must be after the effective date/i.test(fact))
);

const pendingVersion = {
  ...currentVersion,
  snapshotId: `${currentVersion.snapshotId}:pending`,
  reviewStatus: "pending",
  reviewedBy: undefined,
  reviewedAt: undefined,
  reviewNotes: undefined,
};
const proposedVersion = {
  ...currentVersion,
  snapshotId: `${currentVersion.snapshotId}:proposed`,
  historicalStatus: "proposed",
};
const rejectedVersion = {
  ...currentVersion,
  snapshotId: `${currentVersion.snapshotId}:rejected`,
  reviewStatus: "rejected",
};
const noEligible = selectRegulatoryVersionForDate(
  "far-current",
  [pendingVersion, proposedVersion, rejectedVersion],
  { ...contractContext, asOfDate: "2025-02-01", evidenceQuotes: ["Modification Effective Date: January 1, 2025."] }
);
check(
  "pending, rejected, and proposed sources cannot become the selected legal baseline",
  noEligible.status === "no-eligible-approved-snapshots" &&
    noEligible.excludedSnapshotIds.length === 3
);

const mixedSource = createSnapshot({
  sourceId: "dfars-current",
  versionIdentifier: "DFARS TEST",
  effectiveDate: "2024-01-01",
  retrievedAt: "2026-01-08T12:00:00.000Z",
  marker: "Wrong source family",
});
const mixedSelection = selectRegulatoryVersionForDate(
  "far-current",
  [oldVersion, mixedSource],
  contractContext
);
check(
  "snapshots from different source families cannot be compared in one selection",
  mixedSelection.status === "mixed-source-set" &&
    mixedSelection.excludedSnapshotIds.includes(mixedSource.snapshotId)
);

const missingEvidence = selectRegulatoryVersionForDate(
  "far-current",
  [oldVersion],
  { ...contractContext, evidenceQuotes: [] }
);
check(
  "a contract-derived date without exact evidence is rejected",
  missingEvidence.status === "invalid-request" &&
    missingEvidence.missingFacts.some((fact) => /exact nonblank evidence quote/i.test(fact))
);

const invalidDate = selectRegulatoryVersionForDate(
  "far-current",
  [oldVersion],
  { ...contractContext, asOfDate: "2024-02-30" }
);
check(
  "an impossible calendar date is rejected",
  invalidDate.status === "invalid-request" &&
    invalidDate.missingFacts.some((fact) => /real calendar date/i.test(fact))
);

const userSpecified = selectRegulatoryVersionForDate(
  "far-current",
  [oldVersion],
  {
    asOfDate: "2024-06-15",
    basis: "user-specified",
    authority: "user-provided",
    evidenceQuotes: [],
  }
);
check(
  "an explicitly user-specified date may be selected without fabricating contract evidence",
  userSpecified.status === "selected" &&
    userSpecified.selectedSnapshotId === oldVersion.snapshotId
);

const falseUserEvidence = selectRegulatoryVersionForDate(
  "far-current",
  [oldVersion],
  {
    asOfDate: "2024-06-15",
    basis: "user-specified",
    authority: "user-provided",
    evidenceQuotes: ["Subcontract Effective Date: June 15, 2024."],
    evidenceDocumentText: CONTRACT_DOCUMENT,
  }
);
check(
  "user-provided dates cannot masquerade as verified contract evidence",
  falseUserEvidence.status === "invalid-request" &&
    falseUserEvidence.missingFacts.some((fact) => /must not be represented as verified contract evidence/i.test(fact))
);

const unknownSource = selectRegulatoryVersionForDate(
  "not-an-approved-source",
  [],
  {
    asOfDate: "2024-06-15",
    basis: "user-specified",
    authority: "user-provided",
    evidenceQuotes: [],
  }
);
check(
  "unknown source identifiers are rejected before version selection",
  unknownSource.status === "unknown-source"
);

const duplicateSelection = selectRegulatoryVersionForDate(
  "far-current",
  [oldVersion, oldVersion],
  contractContext
);
check(
  "duplicate snapshot identities invalidate the source set",
  duplicateSelection.status === "invalid-request" &&
    duplicateSelection.missingFacts.some((fact) => fact.includes(oldVersion.snapshotId))
);

const storageRoot = await mkdtemp(path.join(tmpdir(), "subshield-history-"));
try {
  const storedOldPending = {
    ...oldVersion,
    reviewStatus: "pending",
    reviewedBy: undefined,
    reviewedAt: undefined,
    reviewNotes: undefined,
  };
  const storedCurrentPending = {
    ...currentVersion,
    reviewStatus: "pending",
    reviewedBy: undefined,
    reviewedAt: undefined,
    reviewNotes: undefined,
  };
  const unreviewedPending = createSnapshot({
    versionIdentifier: "FAC UNREVIEWED",
    effectiveDate: "2026-01-01",
    retrievedAt: "2026-07-25T22:45:00.000Z",
    reviewStatus: "pending",
    marker: "Stored but not reviewed",
  });

  await storeRegulatorySnapshot(storageRoot, storedOldPending);
  await storeRegulatorySnapshot(storageRoot, storedCurrentPending);
  await storeRegulatorySnapshot(storageRoot, unreviewedPending);

  for (const [index, pending] of [storedOldPending, storedCurrentPending].entries()) {
    const reviewed = reviewRegulatorySnapshot(pending, {
      decision: "approved",
      reviewedBy: "SubShield regulatory reviewer",
      reviewedAt: `2026-07-25T23:${40 + index}:00.000Z`,
      reviewNotes: ["Verified synthetic historical selection metadata for storage regression."],
      requiredTextAnchors: [pending.versionIdentifier, "selection-only regression fixture"],
      verifiedVersionIdentifier: pending.versionIdentifier,
      verifiedEffectiveDate: pending.effectiveDate,
    });
    await persistRegulatorySnapshotReview(storageRoot, reviewed);
  }

  const loadedApproved = await loadApprovedRegulatorySnapshots(storageRoot, "far-current");
  check(
    "historical storage helper loads every approved version and excludes pending snapshots",
    loadedApproved.length === 2 &&
      loadedApproved.every((snapshot) => snapshot.reviewStatus === "approved") &&
      !loadedApproved.some((snapshot) => snapshot.snapshotId === unreviewedPending.snapshotId)
  );
  check(
    "approved snapshots loaded from persisted storage remain ordered by effective date",
    loadedApproved[0].snapshotId === oldVersion.snapshotId &&
      loadedApproved[1].snapshotId === currentVersion.snapshotId
  );
  const storedSelection = selectApprovedRegulatorySnapshotForDate(
    "far-current",
    loadedApproved,
    contractContext
  );
  check(
    "persisted approved history selects the correct source version",
    storedSelection.status === "selected" &&
      storedSelection.selectedSnapshot?.snapshotId === oldVersion.snapshotId
  );
} finally {
  await rm(storageRoot, { recursive: true, force: true });
}

if (failures > 0) {
  console.error(`\n${failures} of ${assertions} historical-selection assertions failed.`);
  process.exit(1);
}

console.log(`\nAll ${assertions} historical regulatory version-selection assertions passed.`);
