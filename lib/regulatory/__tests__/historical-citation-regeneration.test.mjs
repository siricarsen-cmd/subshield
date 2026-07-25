import { createHash } from "node:crypto";

import { QA_C_REGULATORY_APPLICABILITY_MAPPINGS } from "../benchmark-applicability-mappings.ts";
import { buildRegulatoryCitationPackage } from "../citation-package.ts";
import {
  regenerateHistoricalCitationPackage,
  registeredHistoricalCitationRequestForMapping,
} from "../historical-citation-regeneration.ts";
import { APPROVED_SOURCE_EXCERPT_FIXTURES } from "../__fixtures__/approved-source-excerpt-fixtures.mjs";
import { APPROVED_SUPPLEMENTAL_SOURCE_EXCERPT_FIXTURES } from "../__fixtures__/approved-supplemental-source-excerpt-fixtures.mjs";
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

const APPROVED = {
  ...APPROVED_SOURCE_EXCERPT_FIXTURES,
  ...APPROVED_SUPPLEMENTAL_SOURCE_EXCERPT_FIXTURES,
};

function historicalClone(
  sourceId,
  {
    version,
    effective,
    end,
    status = "current",
    text,
    retrieved = "2026-07-25T22:00:00.000Z",
  }
) {
  const source = APPROVED[sourceId];
  if (!source) throw new Error(`Missing approved source fixture: ${sourceId}`);
  const nextText = text ?? source.text;
  const checksum = sha256(nextText);
  return {
    ...source,
    snapshotId: `${sourceId}:${version}:${checksum.slice(-12)}`,
    citation: `${source.citation} ${version}`,
    versionIdentifier: version,
    effectiveDate: effective,
    expirationOrSupersededDate: end,
    retrievedAt: retrieved,
    checksum,
    rawChecksum: checksum,
    historicalStatus: status,
    text: nextText,
    retrieval: {
      ...source.retrieval,
      retrievedAt: retrieved,
      rawByteLength: Buffer.byteLength(nextText),
    },
    reviewedAt: "2026-07-25T22:30:00.000Z",
    reviewNotes: ["Approved historical citation regeneration fixture."],
    provenanceNotes: [
      ...source.provenanceNotes.filter((note) => !note.startsWith("Review: ")),
      "Review: Approved historical citation regeneration fixture.",
    ],
  };
}

function replaceCitation(citationPackage, sourceId, updater) {
  return {
    ...citationPackage,
    citations: citationPackage.citations.map((citation) =>
      citation.sourceId === sourceId ? updater(citation) : citation
    ),
  };
}

function sourceLineAt(text, excerpt) {
  const index = text.indexOf(excerpt);
  if (index < 0) return 1;
  return text.slice(0, index).split("\n").length;
}

const mapping = QA_C_REGULATORY_APPLICABILITY_MAPPINGS.find(
  (candidate) => candidate.mappingId === "qa-c-future-cmmc-by-notice"
);
if (!mapping) throw new Error("Missing QA-C future CMMC mapping");
const registeredRequest = registeredHistoricalCitationRequestForMapping(mapping);
if (!registeredRequest) throw new Error("Missing registered historical CMMC excerpt request");

const old7025 = historicalClone("dfars-252-204-7025", {
  version: "DFARS-7025-2024",
  effective: "2024-01-01",
  end: "2025-02-01",
  status: "superseded",
  retrieved: "2026-07-25T23:00:00.000Z",
});
const current7025 = historicalClone("dfars-252-204-7025", {
  version: "DFARS-7025-2025",
  effective: "2025-02-01",
  retrieved: "2026-07-25T21:00:00.000Z",
});
const current7021 = historicalClone("dfars-252-204-7021", {
  version: "DFARS-7021-2025",
  effective: "2025-02-01",
});
const current170 = historicalClone("ecfr-32-part-170", {
  version: "32-CFR-170-2025",
  effective: "2025-02-01",
});

const histories = {
  "dfars-252-204-7021": [current7021],
  "dfars-252-204-7025": [old7025, current7025],
  "ecfr-32-part-170": [current170],
};
const selectedSnapshots = {
  "dfars-252-204-7021": current7021,
  "dfars-252-204-7025": old7025,
  "ecfr-32-part-170": current170,
};
const DOCUMENT = `FICTIONAL HISTORICAL CMMC PACKAGE
Solicitation Issue Date: January 15, 2025.
Subcontract Effective Date: February 10, 2025.
${QA_C_REGULATORY_DOCUMENT}`;

const suppliedPackage = buildRegulatoryCitationPackage(
  registeredRequest,
  selectedSnapshots
);
const ready = regenerateHistoricalCitationPackage({
  mapping,
  documentText: DOCUMENT,
  sourceHistories: histories,
  citationPackage: suppliedPackage,
});
check(
  "registered anchors deterministically regenerate the package from the historically selected snapshots",
  ready.status === "ready" &&
    ready.regeneratedPackage?.sourceCoverage === "complete" &&
    ready.regeneratedPackage.citations.every((citation) =>
      ready.selectedSnapshotIds.includes(citation.snapshotId)
    ),
  ready.refusalReasons.join(" | ")
);
check(
  "regenerated citations retain the registered extraction request and line provenance",
  ready.regeneratedPackage?.citations.every(
    (citation) =>
      citation.extractionStartAnchor.trim() &&
      citation.extractionEndAnchor.trim() &&
      citation.extractionRequiredAnchors.length > 0 &&
      citation.extractionMaxCharacters >= 80 &&
      citation.startLine > 0 &&
      citation.endLine >= citation.startLine
  )
);
check(
  "the historically regenerated 7025 citation comes from the older solicitation-date snapshot",
  ready.regeneratedPackage?.citations.find(
    (citation) => citation.sourceId === "dfars-252-204-7025"
  )?.snapshotId === old7025.snapshotId
);

const registered7025Request = registeredRequest.excerpts.find(
  (request) => request.sourceId === "dfars-252-204-7025"
);
if (!registered7025Request) throw new Error("Missing registered 7025 request");

const drifted7025Text = old7025.text.replace(
  registered7025Request.startAnchor,
  "(b)(1) CMMC requirement level revised historical wording"
);
if (drifted7025Text === old7025.text) {
  throw new Error("Failed to create missing-anchor drift fixture");
}
const drifted7025 = historicalClone("dfars-252-204-7025", {
  version: "DFARS-7025-2024-DRIFT",
  effective: "2024-01-01",
  end: "2025-02-01",
  status: "superseded",
  text: drifted7025Text,
});
const driftExcerpt = drifted7025.text.slice(0, Math.min(220, drifted7025.text.length));
const driftPackage = replaceCitation(
  suppliedPackage,
  "dfars-252-204-7025",
  (citation) => ({
    ...citation,
    snapshotId: drifted7025.snapshotId,
    citation: drifted7025.citation,
    title: drifted7025.canonicalTitle,
    canonicalUrl: drifted7025.canonicalUrl,
    versionIdentifier: drifted7025.versionIdentifier,
    effectiveDate: drifted7025.effectiveDate,
    retrievedAt: drifted7025.retrievedAt,
    checksum: drifted7025.checksum,
    excerpt: driftExcerpt,
    excerptChecksum: sha256(driftExcerpt),
    startLine: 1,
    endLine: sourceLineAt(drifted7025.text, driftExcerpt),
  })
);
const missingAnchor = regenerateHistoricalCitationPackage({
  mapping,
  documentText: DOCUMENT,
  sourceHistories: {
    ...histories,
    "dfars-252-204-7025": [drifted7025, current7025],
  },
  citationPackage: driftPackage,
});
check(
  "a historically selected source with a missing registered anchor is refused as anchor drift",
  missingAnchor.status === "anchor-drift" &&
    missingAnchor.refusalReasons.some((reason) => /start anchor was not found/i.test(reason))
);

const ambiguous7025Text = `${old7025.text}\n\n${registered7025Request.startAnchor}\nHistorical duplicate marker only.`;
const ambiguous7025 = historicalClone("dfars-252-204-7025", {
  version: "DFARS-7025-2024-AMBIGUOUS",
  effective: "2024-01-01",
  end: "2025-02-01",
  status: "superseded",
  text: ambiguous7025Text,
});
const ambiguousPackage = replaceCitation(
  suppliedPackage,
  "dfars-252-204-7025",
  (citation) => ({
    ...citation,
    snapshotId: ambiguous7025.snapshotId,
    citation: ambiguous7025.citation,
    versionIdentifier: ambiguous7025.versionIdentifier,
    effectiveDate: ambiguous7025.effectiveDate,
    retrievedAt: ambiguous7025.retrievedAt,
    checksum: ambiguous7025.checksum,
  })
);
const ambiguousAnchor = regenerateHistoricalCitationPackage({
  mapping,
  documentText: DOCUMENT,
  sourceHistories: {
    ...histories,
    "dfars-252-204-7025": [ambiguous7025, current7025],
  },
  citationPackage: ambiguousPackage,
});
check(
  "a duplicated registered anchor is refused instead of selecting the first match",
  ambiguousAnchor.status === "anchor-drift" &&
    ambiguousAnchor.refusalReasons.some((reason) => /start anchor is ambiguous/i.test(reason))
);

const alternativeExcerpt = old7025.text.slice(
  0,
  Math.min(180, old7025.text.length)
);
const alternativePackage = replaceCitation(
  suppliedPackage,
  "dfars-252-204-7025",
  (citation) => ({
    ...citation,
    excerpt: alternativeExcerpt,
    excerptChecksum: sha256(alternativeExcerpt),
    startLine: 1,
    endLine: sourceLineAt(old7025.text, alternativeExcerpt),
  })
);
const unregisteredPassage = regenerateHistoricalCitationPackage({
  mapping,
  documentText: DOCUMENT,
  sourceHistories: histories,
  citationPackage: alternativePackage,
});
check(
  "an exact passage from the selected snapshot is refused when it is not the registered excerpt",
  unregisteredPassage.status === "registered-excerpt-mismatch" &&
    unregisteredPassage.refusalReasons.some((reason) => /supplied excerpt differs/i.test(reason))
);

const wrongLinePackage = replaceCitation(
  suppliedPackage,
  "dfars-252-204-7025",
  (citation) => ({ ...citation, startLine: citation.startLine + 1 })
);
const wrongLine = regenerateHistoricalCitationPackage({
  mapping,
  documentText: DOCUMENT,
  sourceHistories: histories,
  citationPackage: wrongLinePackage,
});
check(
  "incorrect line provenance is refused even when the excerpt text is exact",
  wrongLine.status === "registered-excerpt-mismatch" &&
    wrongLine.refusalReasons.some((reason) => /start line differs/i.test(reason))
);

const missingDate = regenerateHistoricalCitationPackage({
  mapping,
  documentText: DOCUMENT.replace("Solicitation Issue Date: January 15, 2025.\n", ""),
  sourceHistories: histories,
  citationPackage: suppliedPackage,
});
check(
  "citation regeneration does not run when the source-specific governing date is unresolved",
  missingDate.status === "orchestration-unresolved" &&
    missingDate.orchestration.status === "date-unresolved"
);

if (failures > 0) {
  console.error(`\n${failures} of ${assertions} historical citation regeneration assertions failed.`);
  process.exit(1);
}

console.log(`\nAll ${assertions} historical citation regeneration assertions passed.`);
