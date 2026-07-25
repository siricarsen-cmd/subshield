import { createHash } from "node:crypto";

import { QA_C_REGULATORY_APPLICABILITY_MAPPINGS } from "../benchmark-applicability-mappings.ts";
import { orchestrateHistoricalRegulatoryGrounding } from "../historical-grounding-orchestration.ts";
import {
  REGULATORY_HISTORICAL_GROUNDING_POLICIES,
  validateHistoricalGroundingPolicies,
} from "../historical-grounding-policy.ts";
import { getRegulatorySource } from "../source-catalog.ts";
import { QA_C_REGULATORY_DOCUMENT } from "../__fixtures__/qa-regulatory-fixtures.mjs";

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
  sourceId,
  version,
  effective,
  end,
  status = "current",
  retrieved = "2026-07-25T18:00:00.000Z",
}) {
  const source = getRegulatorySource(sourceId);
  if (!source) throw new Error(`Unknown source ${sourceId}`);
  const text = `Synthetic orchestration fixture for ${sourceId} ${version}. This metadata-only fixture is never customer evidence.`;
  const checksum = sha256(text);
  return {
    snapshotId: `${sourceId}:${version}:${checksum.slice(-12)}`,
    sourceId,
    citation: `${source.citation} ${version}`,
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
    applicabilityMetadata: { orchestrationFixtureOnly: true },
    crossReferences: [],
    provenanceNotes: ["Synthetic metadata-only orchestration fixture."],
    reviewStatus: "approved",
    reviewedBy: "SubShield regulatory reviewer",
    reviewedAt: "2026-07-25T18:30:00.000Z",
    reviewNotes: ["Reviewed for historical orchestration regression only."],
  };
}

function citationPackage(mapping, selectedBySource) {
  return {
    packageId: `${mapping.mappingId}-historical-orchestration-test-package`,
    mappingId: mapping.mappingId,
    fixtureId: mapping.fixtureId,
    topic: mapping.topic,
    contractualImpositionStatus: mapping.contractualImpositionStatus,
    regulatoryApplicabilityStatus: mapping.regulatoryApplicabilityStatus,
    comparisonStatus: mapping.comparisonStatus,
    contractEvidenceQuotes: [...mapping.evidenceQuotes],
    citations: mapping.sourceComparisons.map((comparison, index) => {
      const selected = selectedBySource[comparison.sourceId];
      if (!selected) throw new Error(`Missing selected fixture ${comparison.sourceId}`);
      return {
        sourceId: selected.sourceId,
        snapshotId: selected.snapshotId,
        citation: selected.citation,
        title: selected.canonicalTitle,
        canonicalUrl: selected.canonicalUrl,
        versionIdentifier: selected.versionIdentifier,
        effectiveDate: selected.effectiveDate,
        retrievedAt: selected.retrievedAt,
        excerpt: `Synthetic exact excerpt ${index + 1} for ${selected.sourceId}.`,
        checksum: selected.checksum,
        locator: comparison.locator,
        excerptChecksum: sha256(`excerpt:${selected.sourceId}:${index}`),
        startLine: 1,
        endLine: 1,
      };
    }),
    supportingFacts: [...mapping.supportingFacts],
    missingFacts: [...mapping.missingFacts],
    prohibitedInferences: [...mapping.prohibitedInferences],
    recommendedDocumentRequests: [...mapping.recommendedDocumentRequests],
    reviewerConclusion: mapping.reviewerConclusion,
    uncoveredSourceIds: [],
    sourceCoverage: "complete",
    customerFacingStatus: "benchmark-only",
  };
}

function versionsFor(sourceId) {
  const old = snapshot({
    sourceId,
    version: `${sourceId}-2024`,
    effective: "2024-01-01",
    end: "2025-02-01",
    status: "superseded",
    retrieved: "2026-07-25T18:00:00.000Z",
  });
  const current = snapshot({
    sourceId,
    version: `${sourceId}-2025`,
    effective: "2025-02-01",
    status: "current",
    retrieved: "2026-07-25T17:00:00.000Z",
  });
  return { old, current };
}

const mapping = QA_C_REGULATORY_APPLICABILITY_MAPPINGS.find(
  (candidate) => candidate.mappingId === "qa-c-future-cmmc-by-notice"
);
if (!mapping) throw new Error("Missing QA-C CMMC mapping");

const histories = Object.fromEntries(
  mapping.sourceComparisons.map((comparison) => [
    comparison.sourceId,
    Object.values(versionsFor(comparison.sourceId)),
  ])
);
const bySource = Object.fromEntries(
  Object.entries(histories).map(([sourceId, values]) => [
    sourceId,
    sourceId === "dfars-252-204-7025" ? values[0] : values[1],
  ])
);

const DOCUMENT = `FICTIONAL DATED QA-C PACKAGE
Solicitation Issue Date: January 15, 2025.
Subcontract Effective Date: February 10, 2025.
${QA_C_REGULATORY_DOCUMENT}`;

check(
  "every QA-C and QA-D mapping has one source-complete benchmark-only historical policy",
  validateHistoricalGroundingPolicies().length === 0 &&
    REGULATORY_HISTORICAL_GROUNDING_POLICIES.length === 12 &&
    REGULATORY_HISTORICAL_GROUNDING_POLICIES.every(
      (policy) => policy.customerFacingStatus === "benchmark-only"
    )
);

const ready = orchestrateHistoricalRegulatoryGrounding({
  mapping,
  documentText: DOCUMENT,
  sourceHistories: histories,
  citationPackage: citationPackage(mapping, bySource),
});
check(
  "complete exact-date and historical coverage makes the benchmark citation package ready",
  ready.status === "ready" &&
    ready.citationPackageStatus === "ready" &&
    ready.sourceDecisions.every((decision) => decision.status === "selected"),
  ready.refusalReasons.join(" | ")
);
check(
  "the CMMC solicitation provision uses solicitation issuance while contract sources use execution",
  ready.sourceDecisions.find((decision) => decision.sourceId === "dfars-252-204-7025")
    ?.dateBasis === "solicitation-issued" &&
    ready.sourceDecisions
      .filter((decision) => decision.sourceId !== "dfars-252-204-7025")
      .every((decision) => decision.dateBasis === "subcontract-executed")
);
check(
  "source versions are selected by their assigned date rather than retrieval chronology",
  ready.sourceDecisions.find((decision) => decision.sourceId === "dfars-252-204-7025")
    ?.selectedSnapshotId === histories["dfars-252-204-7025"][0].snapshotId &&
    ready.sourceDecisions.find((decision) => decision.sourceId === "dfars-252-204-7021")
      ?.selectedSnapshotId === histories["dfars-252-204-7021"][1].snapshotId &&
    histories["dfars-252-204-7025"][0].retrievedAt >
      histories["dfars-252-204-7025"][1].retrievedAt
);
check(
  "ready orchestration remains benchmark-only",
  ready.customerFacingStatus === "benchmark-only"
);

const wrongPackage = citationPackage(mapping, {
  ...bySource,
  "dfars-252-204-7025": histories["dfars-252-204-7025"][1],
});
const mismatch = orchestrateHistoricalRegulatoryGrounding({
  mapping,
  documentText: DOCUMENT,
  sourceHistories: histories,
  citationPackage: wrongPackage,
});
check(
  "a citation from today's snapshot is refused when the solicitation date selects the older version",
  mismatch.status === "citation-package-mismatch" &&
    mismatch.citationPackageStatus === "refused" &&
    mismatch.refusalReasons.some((reason) => /wrong historical snapshot.*7025/i.test(reason))
);

const missingSolicitation = orchestrateHistoricalRegulatoryGrounding({
  mapping,
  documentText: DOCUMENT.replace("Solicitation Issue Date: January 15, 2025.\n", ""),
  sourceHistories: histories,
  citationPackage: citationPackage(mapping, bySource),
});
check(
  "a missing source-specific contract date refuses the package instead of borrowing execution",
  missingSolicitation.status === "date-unresolved" &&
    missingSolicitation.sourceDecisions.find(
      (decision) => decision.sourceId === "dfars-252-204-7025"
    )?.status === "date-unresolved" &&
    missingSolicitation.sourceDecisions
      .filter((decision) => decision.sourceId !== "dfars-252-204-7025")
      .every((decision) => decision.status === "selected")
);

const ambiguousExecution = orchestrateHistoricalRegulatoryGrounding({
  mapping,
  documentText: DOCUMENT.replace(
    "Subcontract Effective Date: February 10, 2025.",
    "Subcontract Effective Date: February 10, 2025.\nAgreement Effective Date: March 1, 2025."
  ),
  sourceHistories: histories,
  citationPackage: citationPackage(mapping, bySource),
});
check(
  "multiple distinct execution dates refuse every source governed by execution",
  ambiguousExecution.status === "date-unresolved" &&
    ambiguousExecution.sourceDecisions
      .filter((decision) => decision.dateBasis === "subcontract-executed")
      .every((decision) => decision.status === "date-unresolved")
);

const missingHistory = orchestrateHistoricalRegulatoryGrounding({
  mapping,
  documentText: DOCUMENT,
  sourceHistories: { ...histories, "ecfr-32-part-170": [] },
  citationPackage: citationPackage(mapping, bySource),
});
check(
  "missing approved historical coverage refuses the package",
  missingHistory.status === "historical-version-unresolved" &&
    missingHistory.sourceDecisions.find((decision) => decision.sourceId === "ecfr-32-part-170")
      ?.versionSelection?.status === "no-eligible-approved-snapshots"
);

const gapHistories = {
  ...histories,
  "dfars-252-204-7021": [
    snapshot({
      sourceId: "dfars-252-204-7021",
      version: "7021-old-gap",
      effective: "2024-01-01",
      end: "2025-02-05",
      status: "superseded",
    }),
    snapshot({
      sourceId: "dfars-252-204-7021",
      version: "7021-new-gap",
      effective: "2025-02-15",
    }),
  ],
};
const gap = orchestrateHistoricalRegulatoryGrounding({
  mapping,
  documentText: DOCUMENT,
  sourceHistories: gapHistories,
  citationPackage: citationPackage(mapping, bySource),
});
check(
  "a historical gap refuses the package rather than selecting the nearest version",
  gap.status === "historical-version-unresolved" &&
    gap.sourceDecisions.find((decision) => decision.sourceId === "dfars-252-204-7021")
      ?.versionSelection?.status === "coverage-gap"
);

const partialPackage = {
  ...citationPackage(mapping, bySource),
  sourceCoverage: "partial",
  uncoveredSourceIds: ["ecfr-32-part-170"],
};
const invalidPackage = orchestrateHistoricalRegulatoryGrounding({
  mapping,
  documentText: DOCUMENT,
  sourceHistories: histories,
  citationPackage: partialPackage,
});
check(
  "an incomplete citation package is refused before historical claims are released",
  invalidPackage.status === "invalid-citation-package" &&
    invalidPackage.citationPackageStatus === "refused"
);

const mismatchedPolicy = {
  ...REGULATORY_HISTORICAL_GROUNDING_POLICIES.find(
    (policy) => policy.mappingId === mapping.mappingId
  ),
  mappingId: "qa-c-incident-reporting-and-preservation",
};
const invalidPolicy = orchestrateHistoricalRegulatoryGrounding({
  mapping,
  documentText: DOCUMENT,
  sourceHistories: histories,
  citationPackage: citationPackage(mapping, bySource),
  policy: mismatchedPolicy,
});
check(
  "a policy for another mapping cannot silently govern the source dates",
  invalidPolicy.status === "invalid-policy" &&
    invalidPolicy.refusalReasons.some((reason) => /mapping mismatch/i.test(reason))
);

if (failures > 0) {
  console.error(`\n${failures} of ${assertions} historical orchestration assertions failed.`);
  process.exit(1);
}

console.log(`\nAll ${assertions} historical orchestration assertions passed.`);
