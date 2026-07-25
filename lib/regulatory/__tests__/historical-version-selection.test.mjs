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

function snapshot({
  sourceId = "far-current",
  version,
  effective,
  end,
  retrieved,
  status = "current",
  review = "approved",
}) {
  const source = getRegulatorySource(sourceId);
  if (!source) throw new Error(`Unknown source ${sourceId}`);
  const text = `Synthetic historical-selection fixture for ${version}. This fixture tests metadata selection only and is never customer evidence.`;
  const checksum = sha256(text);
  return {
    snapshotId: `${sourceId}:${version}:${checksum.slice(-12)}`,
    sourceId,
    citation: version,
    canonicalTitle: source.canonicalTitle,
    canonicalUrl: source.canonicalUrl,
    versionIdentifier: version,
    effectiveDate: effective,
    expirationOrSupersededDate: end,
    retrievedAt: retrieved,
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
      retrievedAt: retrieved,
      redirectChain: [],
    },
    historicalStatus: status,
    text,
    applicabilityMetadata: { selectionFixtureOnly: true },
    crossReferences: [],
    provenanceNotes: ["Synthetic metadata-only version-selection fixture."],
    reviewStatus: review,
    reviewedBy: review === "pending" ? undefined : "SubShield regulatory reviewer",
    reviewedAt: review === "pending" ? undefined : "2026-07-25T23:30:00.000Z",
    reviewNotes:
      review === "pending"
        ? undefined
        : ["Reviewed for historical selection regression only."],
  };
}

const DOCUMENT = `FICTIONAL CONTRACT DATE EVIDENCE
Subcontract Effective Date: June 15, 2024.
Modification Effective Date: January 1, 2025.
Solicitation issued December 31, 2023.
Performance begins 06/20/2024.
END`;

const context = {
  asOfDate: "2024-06-15",
  basis: "subcontract-executed",
  authority: "contract-evidence",
  evidenceQuotes: ["Subcontract Effective Date: June 15, 2024."],
  evidenceDocumentText: DOCUMENT,
};

const old = snapshot({
  version: "FAC TEST-2024",
  effective: "2024-01-01",
  end: "2025-01-01",
  retrieved: "2026-06-01T12:00:00.000Z",
  status: "superseded",
});
const current = snapshot({
  version: "FAC TEST-2025",
  effective: "2025-01-01",
  retrieved: "2026-01-01T12:00:00.000Z",
});

const historical = selectRegulatoryVersionForDate("far-current", [current, old], context);
check(
  "verified contract date selects the historical effective version",
  historical.status === "selected" && historical.selectedSnapshotId === old.snapshotId
);
check(
  "retrieval chronology cannot override effective dates",
  old.retrievedAt > current.retrievedAt && historical.selectedSnapshotId === old.snapshotId
);

const boundary = selectRegulatoryVersionForDate("far-current", [old, current], {
  ...context,
  asOfDate: "2025-01-01",
  basis: "modification-effective",
  evidenceQuotes: ["Modification Effective Date: January 1, 2025."],
});
check(
  "exclusive supersession boundary selects the new version",
  boundary.status === "selected" && boundary.selectedSnapshotId === current.snapshotId
);

const slashDate = selectRegulatoryVersionForDate("far-current", [old, current], {
  ...context,
  asOfDate: "2024-06-20",
  basis: "performance-started",
  evidenceQuotes: ["Performance begins 06/20/2024."],
});
check(
  "slash-form contract dates are verified and normalized",
  slashDate.status === "selected" && slashDate.selectedSnapshotId === old.snapshotId
);

const selectedSnapshot = selectApprovedRegulatorySnapshotForDate(
  "far-current",
  [old, current],
  context
);
check(
  "snapshot adapter returns the exact selected approved object",
  selectedSnapshot.selectedSnapshot === old
);

const evidenceFailures = [
  [
    "invented quote",
    {
      ...context,
      evidenceQuotes: ["Subcontract Effective Date: June 15, 2024. Invented wording."],
    },
    /not present in the analyzed document/i,
  ],
  [
    "wrong date in real quote",
    { ...context, evidenceQuotes: ["Solicitation issued December 31, 2023."] },
    /contains the stated date 2024-06-15/i,
  ],
  [
    "missing analyzed document",
    { ...context, evidenceDocumentText: undefined },
    /requires the analyzed document text/i,
  ],
  [
    "missing exact quote",
    { ...context, evidenceQuotes: [] },
    /exact nonblank evidence quote/i,
  ],
];
for (const [label, badContext, pattern] of evidenceFailures) {
  const result = selectRegulatoryVersionForDate("far-current", [old, current], badContext);
  check(
    `${label} cannot authorize historical selection`,
    result.status === "invalid-request" && result.missingFacts.some((fact) => pattern.test(fact)),
    result.missingFacts.join(" | ")
  );
}

const gapOld = snapshot({
  version: "FAC GAP-OLD",
  effective: "2024-01-01",
  end: "2024-05-01",
  retrieved: "2026-01-02T12:00:00.000Z",
  status: "superseded",
});
const gapNew = snapshot({
  version: "FAC GAP-NEW",
  effective: "2024-07-01",
  retrieved: "2026-01-03T12:00:00.000Z",
});
check(
  "gaps between approved windows refuse selection",
  selectRegulatoryVersionForDate("far-current", [gapOld, gapNew], context).status ===
    "coverage-gap"
);

const overlapOld = snapshot({
  version: "FAC OVERLAP-OLD",
  effective: "2024-01-01",
  end: "2025-06-01",
  retrieved: "2026-01-04T12:00:00.000Z",
  status: "superseded",
});
const overlapNew = snapshot({
  version: "FAC OVERLAP-NEW",
  effective: "2024-05-01",
  retrieved: "2026-01-05T12:00:00.000Z",
});
check(
  "overlapping approved windows refuse arbitrary selection",
  selectRegulatoryVersionForDate("far-current", [overlapOld, overlapNew], context)
    .status === "overlapping-effective-windows"
);

const beforeHistory = selectRegulatoryVersionForDate("far-current", [old, current], {
  ...context,
  asOfDate: "2023-12-31",
  basis: "solicitation-issued",
  evidenceQuotes: ["Solicitation issued December 31, 2023."],
});
check(
  "dates before retained history report missing coverage",
  beforeHistory.status === "before-known-history"
);

const undated = snapshot({
  version: "FAC UNDATED",
  effective: undefined,
  retrieved: "2026-01-06T12:00:00.000Z",
});
check(
  "approved undated versions block definitive selection",
  selectRegulatoryVersionForDate("far-current", [old, undated], context).status ===
    "unresolved-version-metadata"
);

const noEnd = snapshot({
  version: "FAC SUPERSEDED-NO-END",
  effective: "2024-01-01",
  retrieved: "2026-01-06T13:00:00.000Z",
  status: "superseded",
});
const noEndResult = selectRegulatoryVersionForDate("far-current", [noEnd], context);
check(
  "superseded versions require a verified first non-effective date",
  noEndResult.status === "unresolved-version-metadata" &&
    noEndResult.missingFacts.some((fact) => /lacks its first non-effective date/i.test(fact))
);

const badWindow = snapshot({
  version: "FAC BAD-WINDOW",
  effective: "2025-01-01",
  end: "2024-12-31",
  retrieved: "2026-01-07T12:00:00.000Z",
});
const badWindowResult = selectRegulatoryVersionForDate("far-current", [badWindow], {
  ...context,
  asOfDate: "2025-01-01",
  basis: "modification-effective",
  evidenceQuotes: ["Modification Effective Date: January 1, 2025."],
});
check(
  "reverse effective windows surface unresolved metadata",
  badWindowResult.status === "unresolved-version-metadata" &&
    badWindowResult.missingFacts.some((fact) => /must be after the effective date/i.test(fact))
);

const pending = {
  ...current,
  snapshotId: `${current.snapshotId}:pending`,
  reviewStatus: "pending",
  reviewedBy: undefined,
  reviewedAt: undefined,
  reviewNotes: undefined,
};
const proposed = {
  ...current,
  snapshotId: `${current.snapshotId}:proposed`,
  historicalStatus: "proposed",
};
const rejected = {
  ...current,
  snapshotId: `${current.snapshotId}:rejected`,
  reviewStatus: "rejected",
};
const excluded = selectRegulatoryVersionForDate(
  "far-current",
  [pending, proposed, rejected],
  {
    ...context,
    asOfDate: "2025-01-01",
    basis: "modification-effective",
    evidenceQuotes: ["Modification Effective Date: January 1, 2025."],
  }
);
check(
  "pending, proposed, and rejected snapshots are excluded",
  excluded.status === "no-eligible-approved-snapshots" &&
    excluded.excludedSnapshotIds.length === 3
);

const dfars = snapshot({
  sourceId: "dfars-current",
  version: "DFARS TEST",
  effective: "2024-01-01",
  retrieved: "2026-01-08T12:00:00.000Z",
});
check(
  "mixed source families cannot be compared",
  selectRegulatoryVersionForDate("far-current", [old, dfars], context).status ===
    "mixed-source-set"
);
check(
  "duplicate snapshot identities invalidate the set",
  selectRegulatoryVersionForDate("far-current", [old, old], context).status ===
    "invalid-request"
);
check(
  "impossible calendar dates are rejected",
  selectRegulatoryVersionForDate("far-current", [old], {
    ...context,
    asOfDate: "2024-02-30",
  }).status === "invalid-request"
);

const userDate = selectRegulatoryVersionForDate("far-current", [old], {
  asOfDate: "2024-06-15",
  basis: "user-specified",
  authority: "user-provided",
  evidenceQuotes: [],
});
check(
  "explicit user dates work without fabricated contract evidence",
  userDate.status === "selected" && userDate.selectedSnapshotId === old.snapshotId
);
check(
  "user dates cannot masquerade as verified contract evidence",
  selectRegulatoryVersionForDate("far-current", [old], {
    asOfDate: "2024-06-15",
    basis: "user-specified",
    authority: "user-provided",
    evidenceQuotes: ["Subcontract Effective Date: June 15, 2024."],
    evidenceDocumentText: DOCUMENT,
  }).status === "invalid-request"
);
check(
  "unknown source IDs are rejected before selection",
  selectRegulatoryVersionForDate("not-approved", [], {
    asOfDate: "2024-06-15",
    basis: "user-specified",
    authority: "user-provided",
    evidenceQuotes: [],
  }).status === "unknown-source"
);

const root = await mkdtemp(path.join(tmpdir(), "subshield-history-"));
try {
  const oldPending = {
    ...old,
    reviewStatus: "pending",
    reviewedBy: undefined,
    reviewedAt: undefined,
    reviewNotes: undefined,
  };
  const currentPending = {
    ...current,
    reviewStatus: "pending",
    reviewedBy: undefined,
    reviewedAt: undefined,
    reviewNotes: undefined,
  };
  const unreviewed = snapshot({
    version: "FAC UNREVIEWED",
    effective: "2026-01-01",
    retrieved: "2026-07-25T22:45:00.000Z",
    review: "pending",
  });
  await storeRegulatorySnapshot(root, oldPending);
  await storeRegulatorySnapshot(root, currentPending);
  await storeRegulatorySnapshot(root, unreviewed);

  for (const [index, item] of [oldPending, currentPending].entries()) {
    const reviewed = reviewRegulatorySnapshot(item, {
      decision: "approved",
      reviewedBy: "SubShield regulatory reviewer",
      reviewedAt: `2026-07-25T23:${40 + index}:00.000Z`,
      reviewNotes: ["Verified metadata-only historical selection fixture."],
      requiredTextAnchors: [item.versionIdentifier, "historical-selection fixture"],
      verifiedVersionIdentifier: item.versionIdentifier,
      verifiedEffectiveDate: item.effectiveDate,
    });
    await persistRegulatorySnapshotReview(root, reviewed);
  }

  const loaded = await loadApprovedRegulatorySnapshots(root, "far-current");
  check(
    "persisted history loader returns all approved versions and excludes pending ones",
    loaded.length === 2 &&
      loaded.every((item) => item.reviewStatus === "approved") &&
      !loaded.some((item) => item.snapshotId === unreviewed.snapshotId)
  );
  check(
    "persisted approved history is ordered by effective date",
    loaded[0].snapshotId === old.snapshotId && loaded[1].snapshotId === current.snapshotId
  );
  const stored = selectApprovedRegulatorySnapshotForDate(
    "far-current",
    loaded,
    context
  );
  check(
    "persisted approved history selects the same historical version",
    stored.status === "selected" && stored.selectedSnapshot?.snapshotId === old.snapshotId
  );
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures > 0) {
  console.error(`\n${failures} of ${assertions} historical selection assertions failed.`);
  process.exit(1);
}

console.log(`\nAll ${assertions} verified historical selection assertions passed.`);
