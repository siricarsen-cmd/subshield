import { createHash } from "node:crypto";

import { REGULATORY_BENCHMARK_CITATION_PACKAGES } from "../benchmark-citation-packages.ts";
import {
  buildRegulatoryCitationPackage,
  validateRegulatoryCitationPackage,
} from "../citation-package.ts";
import { extractApprovedRegulatoryCitation } from "../clause-extraction.ts";
import { QA_C_REGULATORY_APPLICABILITY_MAPPINGS } from "../benchmark-applicability-mappings.ts";
import { APPROVED_SOURCE_EXCERPT_FIXTURES } from "../__fixtures__/approved-source-excerpt-fixtures.mjs";

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

function packageByMapping(mappingId) {
  const value = REGULATORY_BENCHMARK_CITATION_PACKAGES.find(
    (citationPackage) => citationPackage.mappingId === mappingId
  );
  if (!value) throw new Error(`Missing citation package for ${mappingId}`);
  return value;
}

check(
  "citation benchmark includes the eight selected QA-C and QA-D packages",
  REGULATORY_BENCHMARK_CITATION_PACKAGES.length === 8
);

for (const citationPackage of REGULATORY_BENCHMARK_CITATION_PACKAGES) {
  const errors = validateRegulatoryCitationPackage(citationPackage);
  check(
    `${citationPackage.mappingId}: citation package passes structural validation`,
    errors.length === 0,
    errors.join(" | ")
  );
  check(
    `${citationPackage.mappingId}: package remains benchmark-only`,
    citationPackage.customerFacingStatus === "benchmark-only"
  );
  check(
    `${citationPackage.mappingId}: every excerpt is exact retained snapshot text`,
    citationPackage.citations.every((citation) =>
      APPROVED_SOURCE_EXCERPT_FIXTURES[citation.sourceId].text.includes(citation.excerpt)
    )
  );
  check(
    `${citationPackage.mappingId}: every excerpt checksum is independently reproducible`,
    citationPackage.citations.every(
      (citation) =>
        citation.excerptChecksum ===
        `sha256:${createHash("sha256").update(citation.excerpt).digest("hex")}`
    )
  );
  check(
    `${citationPackage.mappingId}: citations preserve source line locations`,
    citationPackage.citations.every(
      (citation) =>
        Number.isInteger(citation.startLine) &&
        Number.isInteger(citation.endLine) &&
        citation.startLine > 0 &&
        citation.endLine >= citation.startLine
    )
  );
}

const payroll = packageByMapping("qa-d-certified-payroll-deadline");
check(
  "QA-D payroll package identifies the uncovered 29 CFR part 3 source",
  payroll.sourceCoverage === "partial" &&
    payroll.uncoveredSourceIds.length === 1 &&
    payroll.uncoveredSourceIds[0] === "ecfr-29-part-3"
);
check(
  "QA-D payroll citation says WH-347 satisfies the certification requirement rather than claiming it is the only allowed form",
  /Optional Form WH-347 shall satisfy/i.test(payroll.citations[0].excerpt) &&
    !/must use|only form|required form/i.test(payroll.citations[0].excerpt)
);

const scls = packageByMapping("qa-d-scls-conditional");
check(
  "QA-D SCLS package preserves conditional contractual imposition",
  scls.contractualImpositionStatus === "conditionally imposed" &&
    scls.regulatoryApplicabilityStatus === "Not established"
);
check(
  "QA-D SCLS citation includes both exemptions and scope-specific subcontract flowdown",
  /does not apply to contracts or subcontracts administratively exempted/i.test(
    scls.citations[0].excerpt
  ) &&
    /subcontracts subject to the Service Contract Labor Standards statute/i.test(
      scls.citations[0].excerpt
    )
);

const mismatch = packageByMapping("qa-c-dfars-7002-citation-mismatch");
check(
  "QA-C 7002 mismatch has complete official-source coverage",
  mismatch.sourceCoverage === "complete" && mismatch.uncoveredSourceIds.length === 0
);
const paymentCitation = mismatch.citations.find(
  (citation) => citation.sourceId === "dfars-current"
);
check(
  "QA-C 7002 official excerpt is an NSP payment clause and not a cybersecurity assessment clause",
  /not separately priced \(NSP\)/i.test(paymentCitation?.excerpt ?? "") &&
    /shall not invoice the Government/i.test(paymentCitation?.excerpt ?? "") &&
    !/cyber|NIST|assessment|covered contractor information system/i.test(
      paymentCitation?.excerpt ?? ""
    )
);
const assessmentCitation = mismatch.citations.find(
  (citation) => citation.sourceId === "dfars-252-204-7020"
);
check(
  "QA-C mismatch package separately cites 7020 for assessment access",
  /provide access to its facilities, systems, and personnel/i.test(
    assessmentCitation?.excerpt ?? ""
  )
);

const score = packageByMapping("qa-c-absolute-110-score-warranty");
check(
  "QA-C score package preserves official examples of less-than-110 scores and a future expected implementation date",
  score.citations.some((citation) => /95 out of 110/i.test(citation.excerpt)) &&
    score.citations.some((citation) => /score of 110 is expected to be achieved/i.test(citation.excerpt))
);
check(
  "QA-C score package does not import the Prime's perpetual warranty or automatic-breach language into official excerpts",
  score.citations.every(
    (citation) => !/remain 110 throughout performance|material breach|regardless of an accepted/i.test(citation.excerpt)
  )
);

const cmmc = packageByMapping("qa-c-future-cmmc-by-notice");
check(
  "QA-C CMMC package identifies the still-uncovered 32 CFR part 170 source",
  cmmc.sourceCoverage === "partial" &&
    cmmc.uncoveredSourceIds.includes("ecfr-32-part-170")
);
check(
  "QA-C CMMC citations require an inserted level and tie coverage to systems processing FCI or CUI",
  cmmc.citations.some(
    (citation) =>
      /Contracting Officer insert/i.test(citation.excerpt) &&
      /process, store, or transmit FCI or CUI/i.test(citation.excerpt)
  ) &&
    cmmc.citations.some((citation) => /required prior to award/i.test(citation.excerpt))
);
check(
  "QA-C CMMC package continues to refuse an inferred level",
  cmmc.missingFacts.includes("Required CMMC level") &&
    cmmc.prohibitedInferences.some((item) => /Do not infer a CMMC level/i.test(item))
);

const incident = packageByMapping("qa-c-incident-reporting-and-preservation");
check(
  "QA-C incident package keeps the contract's eight-hour notice separate from the official 72-hour report and 90-day preservation period",
  incident.contractEvidenceQuotes.some((quote) => /within eight hours/i.test(quote)) &&
    incident.citations[0].excerpt.includes("within 72 hours") &&
    incident.citations[0].excerpt.includes("at least 90 days") &&
    !incident.citations[0].excerpt.includes("within eight hours")
);

const lowerTier = packageByMapping("qa-c-lower-tier-7012-flowdown");
check(
  "QA-C lower-tier package has complete 7012 and CMMC clause coverage",
  lowerTier.sourceCoverage === "complete" && lowerTier.citations.length === 2
);
check(
  "QA-C lower-tier citations preserve scope conditions rather than an all-supplier rule",
  lowerTier.citations.some(
    (citation) =>
      /operationally critical support|covered defense information/i.test(citation.excerpt)
  ) &&
    lowerTier.citations.some(
      (citation) => /CMMC level that is appropriate for the information/i.test(citation.excerpt)
    )
);

const baseline = packageByMapping("qa-c-dfars-7012-nist-baseline");
check(
  "QA-C baseline package explicitly remains partial until NIST and CUI Registry excerpts are approved",
  baseline.sourceCoverage === "partial" &&
    baseline.uncoveredSourceIds.includes("nist-sp-800-171-r3") &&
    baseline.uncoveredSourceIds.includes("cui-registry")
);

const approved7012 = APPROVED_SOURCE_EXCERPT_FIXTURES["dfars-252-204-7012"];
await checkRejects(
  "pending snapshots cannot produce citation excerpts",
  () =>
    Promise.resolve(
      extractApprovedRegulatoryCitation(
        { ...approved7012, reviewStatus: "pending", reviewedBy: undefined, reviewedAt: undefined },
        {
          sourceId: "dfars-252-204-7012",
          locator: "pending source",
          startAnchor: "(m) Subcontracts",
          endAnchor: "except to identify the parties",
          requiredAnchors: ["covered defense information"],
        }
      )
    ),
  /not approved for citation/i
);
await checkRejects(
  "citation extraction rejects source identity mismatches",
  () =>
    Promise.resolve(
      extractApprovedRegulatoryCitation(approved7012, {
        sourceId: "dfars-252-204-7020",
        locator: "wrong source",
        startAnchor: "(m) Subcontracts",
        endAnchor: "except to identify the parties",
        requiredAnchors: ["covered defense information"],
      })
    ),
  /source mismatch/i
);
await checkRejects(
  "citation extraction rejects ambiguous source anchors",
  () =>
    Promise.resolve(
      extractApprovedRegulatoryCitation(
        {
          ...approved7012,
          text: `${approved7012.text}\n(m) Subcontracts. Duplicate test heading.`,
          checksum: `sha256:${createHash("sha256")
            .update(`${approved7012.text}\n(m) Subcontracts. Duplicate test heading.`)
            .digest("hex")}`,
        },
        {
          sourceId: "dfars-252-204-7012",
          locator: "ambiguous source",
          startAnchor: "(m) Subcontracts",
          endAnchor: "except to identify the parties",
          requiredAnchors: ["covered defense information"],
        }
      )
    ),
  /ambiguous/i
);
await checkRejects(
  "citation packages cannot cite a source absent from the applicability mapping",
  () => {
    const mapping = QA_C_REGULATORY_APPLICABILITY_MAPPINGS.find(
      (candidate) => candidate.mappingId === "qa-c-incident-reporting-and-preservation"
    );
    return Promise.resolve(
      buildRegulatoryCitationPackage(
        {
          packageId: "qa-c-incident-reporting-and-preservation-invalid-source",
          mapping,
          excerpts: [
            {
              sourceId: "far-52-222-8",
              locator: "unrelated payroll clause",
              startAnchor: "52.222-8 Payrolls and Basic Records",
              endAnchor: "Optional Form WH-347",
              requiredAnchors: ["Statement of Compliance"],
            },
          ],
        },
        APPROVED_SOURCE_EXCERPT_FIXTURES
      )
    );
  },
  /not declared by mapping/i
);

if (failures > 0) {
  console.error(`\n${failures} of ${assertions} regulatory citation-package assertions failed.`);
  process.exit(1);
}

console.log(`\nAll ${assertions} regulatory citation-package assertions passed.`);
