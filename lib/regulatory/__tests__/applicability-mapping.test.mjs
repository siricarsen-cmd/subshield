import {
  validateRegulatoryApplicabilityMapping,
  validateRegulatoryApplicabilityMappings,
} from "../applicability.ts";
import {
  QA_C_REGULATORY_APPLICABILITY_MAPPINGS,
  QA_D_REGULATORY_APPLICABILITY_MAPPINGS,
  REGULATORY_BENCHMARK_APPLICABILITY_MAPPINGS,
} from "../benchmark-applicability-mappings.ts";
import { fetchApprovedRegulatorySource } from "../ingestion.ts";
import { reviewRegulatorySnapshot } from "../source-review.ts";
import { QA_REGULATORY_FIXTURE_DOCUMENTS } from "../__fixtures__/qa-regulatory-fixtures.mjs";

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

async function checkRejects(label, action, pattern) {
  assertions++;
  try {
    await action();
    failures++;
    console.error(`FAIL: ${label} — expected rejection`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (pattern.test(message)) console.log(`PASS: ${label}`);
    else {
      failures++;
      console.error(`FAIL: ${label} — ${message}`);
    }
  }
}

const validation = validateRegulatoryApplicabilityMappings(
  REGULATORY_BENCHMARK_APPLICABILITY_MAPPINGS,
  QA_REGULATORY_FIXTURE_DOCUMENTS
);
check(
  "all QA-C and QA-D applicability mappings pass structural and exact-evidence validation",
  validation.valid,
  validation.errors.join(" | ")
);
check("QA-D has a meaningful first labor mapping set", QA_D_REGULATORY_APPLICABILITY_MAPPINGS.length >= 5);
check("QA-C has a meaningful first cyber mapping set", QA_C_REGULATORY_APPLICABILITY_MAPPINGS.length >= 7);
check(
  "every mapping distinguishes contractual imposition from regulatory applicability",
  REGULATORY_BENCHMARK_APPLICABILITY_MAPPINGS.every(
    (mapping) => mapping.contractualImpositionStatus && mapping.regulatoryApplicabilityStatus
  )
);
check(
  "every mapping identifies unresolved facts and prohibited inferences",
  REGULATORY_BENCHMARK_APPLICABILITY_MAPPINGS.every(
    (mapping) => mapping.missingFacts.length > 0 && mapping.prohibitedInferences.length > 0
  )
);
check(
  "no mapping overclaims confirmed external applicability",
  REGULATORY_BENCHMARK_APPLICABILITY_MAPPINGS.every(
    (mapping) => mapping.regulatoryApplicabilityStatus !== "Confirmed"
  )
);

const wageMapping = QA_D_REGULATORY_APPLICABILITY_MAPPINGS.find(
  (mapping) => mapping.mappingId === "qa-d-missing-wage-determination"
);
check(
  "QA-D missing wage determination remains a document gap rather than an inferred wage schedule",
  wageMapping?.comparisonStatus === "required supporting document missing" &&
    wageMapping.prohibitedInferences.some((item) => /wage rate|classification/i.test(item))
);
check(
  "QA-D SCLS remains conditional and not externally established",
  QA_D_REGULATORY_APPLICABILITY_MAPPINGS.some(
    (mapping) =>
      mapping.mappingId === "qa-d-scls-conditional" &&
      mapping.contractualImpositionStatus === "conditionally imposed" &&
      mapping.regulatoryApplicabilityStatus === "Not established"
  )
);
check(
  "QA-D certified payroll identifies the Prime deadline as a separate comparison issue",
  QA_D_REGULATORY_APPLICABILITY_MAPPINGS.some(
    (mapping) =>
      mapping.mappingId === "qa-d-certified-payroll-deadline" &&
      mapping.comparisonStatus === "prime-drafted obligation broader than federal baseline"
  )
);

const citationMismatch = QA_C_REGULATORY_APPLICABILITY_MAPPINGS.find(
  (mapping) => mapping.mappingId === "qa-c-dfars-7002-citation-mismatch"
);
check(
  "QA-C preserves the DFARS 252.204-7002 citation mismatch instead of silently correcting it",
  citationMismatch?.contractualImpositionStatus === "citation inconsistent" &&
    citationMismatch.comparisonStatus ===
      "cited clause incomplete, altered, obsolete, or inconsistent" &&
    citationMismatch.prohibitedInferences.some((item) => /do not rewrite|intended/i.test(item))
);
check(
  "QA-C separates the Prime eight-hour notice from the federal seventy-two-hour report",
  QA_C_REGULATORY_APPLICABILITY_MAPPINGS.some(
    (mapping) =>
      mapping.mappingId === "qa-c-incident-reporting-and-preservation" &&
      mapping.evidenceQuotes.some((quote) => /within eight hours/i.test(quote)) &&
      mapping.evidenceQuotes.some((quote) => /within seventy-two hours/i.test(quote)) &&
      mapping.prohibitedInferences.some((item) => /eight-hour.*DFARS|Prime.*eight-hour/i.test(item))
  )
);
check(
  "QA-C future CMMC mapping refuses to infer a level",
  QA_C_REGULATORY_APPLICABILITY_MAPPINGS.some(
    (mapping) =>
      mapping.mappingId === "qa-c-future-cmmc-by-notice" &&
      mapping.regulatoryApplicabilityStatus === "Not established" &&
      mapping.missingFacts.includes("Required CMMC level")
  )
);

const invalidMapping = {
  ...REGULATORY_BENCHMARK_APPLICABILITY_MAPPINGS[0],
  evidenceQuotes: ["This language is not in the fixture."],
};
const invalidResult = validateRegulatoryApplicabilityMapping(
  invalidMapping,
  QA_REGULATORY_FIXTURE_DOCUMENTS[invalidMapping.fixtureId]
);
check(
  "an applicability mapping cannot cite contract language absent from the controlled fixture",
  !invalidResult.valid && invalidResult.errors.some((error) => /not present in the fixture/i.test(error))
);

const officialHtml = `<!doctype html><html><body><main>
<h1>52.222-6 Construction Wage Rate Requirements</h1>
<p>FAC Number: 2026-01</p>
<p>The Contractor shall pay all laborers and mechanics not less than the applicable wage determination.</p>
</main></body></html>`;
const pendingSnapshot = await fetchApprovedRegulatorySource("far-52-222-6", {
  fetchImpl: async () =>
    new Response(officialHtml, {
      status: 200,
      headers: { "content-type": "text/html" },
    }),
  now: new Date("2026-07-25T18:00:00.000Z"),
});

const approvedSnapshot = reviewRegulatorySnapshot(pendingSnapshot, {
  decision: "approved",
  reviewedBy: "SubShield regulatory reviewer",
  reviewedAt: "2026-07-25T19:00:00.000Z",
  reviewNotes: [
    "Verified the clause identity and the retained construction wage text against the approved source.",
    "Confirmed normalization preserves the operative laborers-and-mechanics language.",
  ],
  requiredTextAnchors: [
    "52.222-6 Construction Wage Rate Requirements",
    "pay all laborers and mechanics not less than the applicable wage determination",
  ],
  verifiedVersionIdentifier: "FAC 2026-01",
  verifiedEffectiveDate: "2026-03-13",
});
check("controlled review can approve an intact source-specific snapshot", approvedSnapshot.reviewStatus === "approved");
check("controlled review records the identified reviewer", approvedSnapshot.reviewedBy === "SubShield regulatory reviewer");
check(
  "controlled review retains substantive review notes",
  approvedSnapshot.provenanceNotes.some((note) => /Verified the clause identity/i.test(note))
);

await checkRejects(
  "automated identities cannot approve regulatory snapshots",
  () =>
    Promise.resolve(
      reviewRegulatorySnapshot(pendingSnapshot, {
        decision: "approved",
        reviewedBy: "github-actions-bot",
        reviewedAt: "2026-07-25T19:00:00.000Z",
        reviewNotes: ["Automated approval."],
        requiredTextAnchors: ["52.222-6 Construction Wage Rate Requirements"],
      })
    ),
  /non-automated reviewer/i
);
await checkRejects(
  "review cannot approve a snapshot when a required source anchor is absent",
  () =>
    Promise.resolve(
      reviewRegulatorySnapshot(pendingSnapshot, {
        decision: "approved",
        reviewedBy: "SubShield regulatory reviewer",
        reviewedAt: "2026-07-25T19:00:00.000Z",
        reviewNotes: ["Reviewed source text."],
        requiredTextAnchors: ["This required clause language is absent"],
      })
    ),
  /source anchor is missing/i
);
await checkRejects(
  "review cannot approve a checksum-tampered snapshot",
  () =>
    Promise.resolve(
      reviewRegulatorySnapshot(
        { ...pendingSnapshot, text: `${pendingSnapshot.text}\ntampered` },
        {
          decision: "approved",
          reviewedBy: "SubShield regulatory reviewer",
          reviewedAt: "2026-07-25T19:00:00.000Z",
          reviewNotes: ["Reviewed source text."],
          requiredTextAnchors: ["52.222-6 Construction Wage Rate Requirements"],
        }
      )
    ),
  /checksum is invalid/i
);

if (failures > 0) {
  console.error(`\n${failures} of ${assertions} regulatory applicability assertions failed.`);
  process.exit(1);
}

console.log(`\nAll ${assertions} regulatory applicability and review assertions passed.`);
