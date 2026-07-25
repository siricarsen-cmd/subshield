import {
  REGULATORY_FULL_BENCHMARK_CITATION_PACKAGES,
  REGULATORY_SOURCE_COVERAGE_COMPLETION_PACKAGES,
} from "../source-coverage-citation-packages.ts";
import {
  QA_C_REGULATORY_APPLICABILITY_MAPPINGS,
  QA_D_REGULATORY_APPLICABILITY_MAPPINGS,
  REGULATORY_BENCHMARK_APPLICABILITY_MAPPINGS,
} from "../benchmark-applicability-mappings.ts";
import { validateRegulatoryCitationPackage } from "../citation-package.ts";
import { getRegulatorySource } from "../source-catalog.ts";
import { APPROVED_SUPPLEMENTAL_SOURCE_EXCERPT_FIXTURES } from "../__fixtures__/approved-supplemental-source-excerpt-fixtures.mjs";

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

function packageByMapping(mappingId) {
  const value = REGULATORY_FULL_BENCHMARK_CITATION_PACKAGES.find(
    (citationPackage) => citationPackage.mappingId === mappingId
  );
  if (!value) throw new Error(`Missing full-coverage citation package: ${mappingId}`);
  return value;
}

check(
  "source-coverage completion supplies eight replacement or new packages",
  REGULATORY_SOURCE_COVERAGE_COMPLETION_PACKAGES.length === 8
);
check(
  "full benchmark has exactly one citation package for every QA-C and QA-D applicability mapping",
  REGULATORY_FULL_BENCHMARK_CITATION_PACKAGES.length ===
    REGULATORY_BENCHMARK_APPLICABILITY_MAPPINGS.length &&
    new Set(REGULATORY_FULL_BENCHMARK_CITATION_PACKAGES.map((item) => item.mappingId)).size ===
      REGULATORY_BENCHMARK_APPLICABILITY_MAPPINGS.length
);
check(
  "supplemental snapshots explicitly identify themselves as verbatim selected paragraphs rather than complete pages",
  Object.values(APPROVED_SUPPLEMENTAL_SOURCE_EXCERPT_FIXTURES).every((snapshot) =>
    snapshot.provenanceNotes.some((note) => /verbatim selected paragraphs/i.test(note))
  )
);
check(
  "supplemental snapshots exclude the previously summarized or cross-page phrases",
  Object.values(APPROVED_SUPPLEMENTAL_SOURCE_EXCERPT_FIXTURES).every(
    (snapshot) =>
      !/Users may search by wage determination number|Illustrative covered services include|Questions regarding the status of marked or unmarked information|Contractors should not follow CUI program requirements/i.test(
        snapshot.text
      )
  )
);

for (const mapping of REGULATORY_BENCHMARK_APPLICABILITY_MAPPINGS) {
  const citationPackage = packageByMapping(mapping.mappingId);
  const declaredSourceIds = new Set(
    mapping.sourceComparisons.map((comparison) => comparison.sourceId)
  );
  const citedSourceIds = new Set(citationPackage.citations.map((citation) => citation.sourceId));
  const errors = validateRegulatoryCitationPackage(citationPackage);

  check(
    `${mapping.mappingId}: package passes validation`,
    errors.length === 0,
    errors.join(" | ")
  );
  check(
    `${mapping.mappingId}: every declared official source is covered`,
    [...declaredSourceIds].every((sourceId) => citedSourceIds.has(sourceId)),
    `declared ${[...declaredSourceIds].join(", ")} vs cited ${[...citedSourceIds].join(", ")}`
  );
  check(
    `${mapping.mappingId}: source coverage is complete without changing applicability status`,
    citationPackage.sourceCoverage === "complete" &&
      citationPackage.uncoveredSourceIds.length === 0 &&
      citationPackage.regulatoryApplicabilityStatus === mapping.regulatoryApplicabilityStatus
  );
  check(
    `${mapping.mappingId}: customer-facing status remains disabled`,
    citationPackage.customerFacingStatus === "benchmark-only"
  );
}

const missingWage = packageByMapping("qa-d-missing-wage-determination");
check(
  "complete source coverage does not convert the missing fictional wage determination into a verified wage schedule",
  missingWage.comparisonStatus === "required supporting document missing" &&
    missingWage.missingFacts.includes("Authentic wage-determination number and modification") &&
    missingWage.prohibitedInferences.some((item) => /Do not infer any wage rate/i.test(item))
);
check(
  "wage-determination sources preserve the need for locality, classification, and attached determination facts",
  missingWage.citations.some(
    (citation) =>
      citation.sourceId === "sam-wage-determinations" &&
      /given labor category in a given locality/i.test(citation.excerpt)
  ) &&
    missingWage.citations.some(
      (citation) =>
        citation.sourceId === "far-52-222-6" &&
        /attached hereto and made a part hereof/i.test(citation.excerpt)
    )
);

const payroll = packageByMapping("qa-d-certified-payroll-deadline");
check(
  "payroll package distinguishes the federal seven-day delivery rule from the Prime's three-business-day rule",
  payroll.contractEvidenceQuotes.some((quote) => /three business days/i.test(quote)) &&
    payroll.citations.some(
      (citation) =>
        citation.sourceId === "ecfr-29-part-3" &&
        /within 7 days after the regular payment date/i.test(citation.excerpt)
    )
);
check(
  "payroll package preserves WH-347 equivalence rather than an exclusive form requirement",
  payroll.citations.some(
    (citation) =>
      citation.sourceId === "ecfr-29-part-3" &&
      /or on any form with identical wording/i.test(citation.excerpt)
  )
);

const scls = packageByMapping("qa-d-scls-conditional");
check(
  "SCLS remains unestablished until principal-purpose and service-employee facts are known",
  scls.regulatoryApplicabilityStatus === "Not established" &&
    scls.citations.some(
      (citation) =>
        citation.sourceId === "ecfr-29-part-4" &&
        /only incidental to the performance of a contract for another purpose/i.test(citation.excerpt)
    ) &&
    scls.missingFacts.includes("Principal purpose and separability of the support services")
);

const laborChange = packageByMapping("qa-d-unilateral-labor-change-no-adjustment");
check(
  "construction conformance source assigns classification approval to the Contracting Officer rather than the Prime alone",
  laborChange.citations.some(
    (citation) =>
      citation.sourceId === "far-52-222-6" &&
      /The Contracting Officer shall approve an additional classification/i.test(citation.excerpt)
  )
);
check(
  "labor-change package keeps pass-through-only price relief as Prime-drafted risk",
  laborChange.comparisonStatus === "prime-drafted obligation broader than federal baseline" &&
    laborChange.contractEvidenceQuotes.some((quote) => /unless Prime receives and passes through/i.test(quote))
);

const lowerTierLabor = packageByMapping("qa-d-lower-tier-labor-flowdown");
check(
  "lower-tier labor package limits SCLS flowdown to subcontracts subject to SCLS",
  lowerTierLabor.citations.some(
    (citation) =>
      citation.sourceId === "far-52-222-41" &&
      /subcontracts subject to the Service Contract Labor Standards statute/i.test(citation.excerpt)
  ) &&
    lowerTierLabor.prohibitedInferences.some((item) => /Do not assume identical labor clauses/i.test(item))
);

const baseline = packageByMapping("qa-c-dfars-7012-nist-baseline");
check(
  "NIST source limits technical scope to CUI-processing components and components that protect them",
  baseline.citations.some(
    (citation) =>
      citation.sourceId === "nist-sp-800-171-r3" &&
      /components of nonfederal systems that process, store, or transmit CUI/i.test(citation.excerpt) &&
      /provide protection for such components/i.test(citation.excerpt)
  )
);
check(
  "CUI source coverage preserves government-wide guidance and agency implementation without proving a specific category",
  baseline.prohibitedInferences.some((item) =>
    /Do not infer that every subcontractor system is covered/i.test(item)
  ) &&
    baseline.citations.some(
      (citation) =>
        citation.sourceId === "cui-registry" &&
        /Government-wide online repository/i.test(citation.excerpt) &&
        /agency personnel and contractors should first consult/i.test(citation.excerpt)
    )
);

const cmmc = packageByMapping("qa-c-future-cmmc-by-notice");
check(
  "CMMC source applies level and assessment type subcontract by subcontract based on FCI, CUI, and prime requirements",
  cmmc.citations.some(
    (citation) =>
      citation.sourceId === "ecfr-32-part-170" &&
      /applicable CMMC level and assessment type for each subcontract/i.test(citation.excerpt) &&
      /only process, store, or transmit FCI \(and not CUI\)/i.test(citation.excerpt)
  )
);
check(
  "CMMC package still refuses to infer an unstated level",
  cmmc.regulatoryApplicabilityStatus === "Not established" &&
    cmmc.missingFacts.includes("Required CMMC level") &&
    cmmc.prohibitedInferences.some((item) => /Do not infer a CMMC level/i.test(item))
);

const unmarked = packageByMapping("qa-c-unmarked-cui-designation");
check(
  "unmarked-CUI package preserves program scope and agency implementation guidance without claiming category proof",
  unmarked.citations.some(
    (citation) =>
      citation.sourceId === "cui-registry" &&
      /requires safeguarding or dissemination controls/i.test(citation.excerpt) &&
      /agency personnel and contractors should first consult/i.test(citation.excerpt)
  ) &&
    unmarked.regulatoryApplicabilityStatus === "Not established"
);

const cmmcCatalog = getRegulatorySource("ecfr-32-part-170");
check(
  "CMMC catalog uses the official 32 CFR Part 170 subchapter-G route",
  cmmcCatalog?.canonicalUrl ===
    "https://www.ecfr.gov/current/title-32/subtitle-A/chapter-I/subchapter-G/part-170"
);

check(
  "all five QA-D mappings are represented",
  QA_D_REGULATORY_APPLICABILITY_MAPPINGS.every((mapping) =>
    REGULATORY_FULL_BENCHMARK_CITATION_PACKAGES.some(
      (citationPackage) => citationPackage.mappingId === mapping.mappingId
    )
  )
);
check(
  "all seven QA-C mappings are represented",
  QA_C_REGULATORY_APPLICABILITY_MAPPINGS.every((mapping) =>
    REGULATORY_FULL_BENCHMARK_CITATION_PACKAGES.some(
      (citationPackage) => citationPackage.mappingId === mapping.mappingId
    )
  )
);

if (failures > 0) {
  console.error(`\n${failures} of ${assertions} source-coverage assertions failed.`);
  process.exit(1);
}

console.log(`\nAll ${assertions} regulatory source-coverage assertions passed.`);