import {
  QA_C_REGULATORY_APPLICABILITY_MAPPINGS,
  QA_D_REGULATORY_APPLICABILITY_MAPPINGS,
} from "./benchmark-applicability-mappings";
import {
  buildRegulatoryCitationPackage,
  type RegulatoryCitationPackageRequest,
} from "./citation-package";
import { APPROVED_SOURCE_EXCERPT_FIXTURES } from "./__fixtures__/approved-source-excerpt-fixtures.mjs";
import type { RegulatoryApplicabilityMapping } from "./applicability";

function mappingById(
  mappings: readonly RegulatoryApplicabilityMapping[],
  mappingId: string
): RegulatoryApplicabilityMapping {
  const mapping = mappings.find((candidate) => candidate.mappingId === mappingId);
  if (!mapping) throw new Error(`Unknown regulatory applicability mapping: ${mappingId}`);
  return mapping;
}

const REQUESTS: RegulatoryCitationPackageRequest[] = [
  {
    packageId: "qa-d-certified-payroll-deadline-official-baseline",
    mapping: mappingById(
      QA_D_REGULATORY_APPLICABILITY_MAPPINGS,
      "qa-d-certified-payroll-deadline"
    ),
    excerpts: [
      {
        sourceId: "far-52-222-8",
        locator: "FAR 52.222-8(b)(2)-(3) — certified statement and WH-347 equivalence",
        startAnchor: "(2) Each payroll submitted shall be accompanied by a Statement of Compliance",
        endAnchor:
          "shall satisfy the requirement for submission of the Statement of Compliance required by paragraph (b)(2) of this clause",
        requiredAnchors: [
          "Statement of Compliance",
          "correct and complete",
          "Optional Form WH-347",
        ],
      },
    ],
  },
  {
    packageId: "qa-d-scls-conditional-official-baseline",
    mapping: mappingById(QA_D_REGULATORY_APPLICABILITY_MAPPINGS, "qa-d-scls-conditional"),
    excerpts: [
      {
        sourceId: "far-52-222-41",
        locator: "FAR 52.222-41(b), (c)(1), and (l) — applicability, wage determination, and subcontract coverage",
        startAnchor: "(b) Applicability. This contract is subject",
        endAnchor:
          "(l) Subcontracts. The Contractor agrees to insert this clause in all subcontracts subject to the Service Contract Labor Standards statute",
        requiredAnchors: [
          "This clause does not apply to contracts or subcontracts administratively exempted",
          "wage determination attached to this contract",
          "all subcontracts subject to the Service Contract Labor Standards statute",
        ],
      },
    ],
  },
  {
    packageId: "qa-c-dfars-7002-citation-mismatch-official-comparison",
    mapping: mappingById(
      QA_C_REGULATORY_APPLICABILITY_MAPPINGS,
      "qa-c-dfars-7002-citation-mismatch"
    ),
    excerpts: [
      {
        sourceId: "dfars-current",
        locator: "DFARS 252.204-7002 — payment for NSP line or subline items",
        startAnchor:
          "252.204-7002 Payment for Contract Line or Subline Items Not Separately Priced",
        endAnchor: "(c) This clause does not apply to technical data",
        requiredAnchors: [
          "not separately priced (NSP)",
          "shall not invoice the Government",
          "Government has accepted the NSP item",
        ],
      },
      {
        sourceId: "dfars-252-204-7020",
        locator: "DFARS 252.204-7020(b)-(c) — assessment applicability and Government access",
        startAnchor: "(b) Applicability. This clause applies to covered contractor information systems",
        endAnchor:
          "The Contractor shall provide access to its facilities, systems, and personnel necessary for the Government to conduct a Medium or High NIST SP 800-171 DoD Assessment",
        requiredAnchors: [
          "252.204-7012",
          "provide access to its facilities, systems, and personnel",
        ],
      },
    ],
  },
  {
    packageId: "qa-c-absolute-110-score-warranty-official-comparison",
    mapping: mappingById(
      QA_C_REGULATORY_APPLICABILITY_MAPPINGS,
      "qa-c-absolute-110-score-warranty"
    ),
    excerpts: [
      {
        sourceId: "dfars-252-204-7019",
        locator: "DFARS 252.204-7019(b)-(d) — current assessment and score reporting",
        startAnchor: "(b) Requirement. In order to be considered for award",
        endAnchor:
          "Date that all requirements are expected to be implemented (i.e., a score of 110 is expected to be achieved) based on information gathered from associated plan(s) of action developed in accordance with NIST SP 800-171",
        requiredAnchors: [
          "current assessment",
          "95 out of 110",
          "score of 110 is expected to be achieved",
          "plan(s) of action",
        ],
      },
      {
        sourceId: "dfars-252-204-7020",
        locator: "DFARS 252.204-7020(b)-(d) — applicability, access, and assessment score fields",
        startAnchor: "(b) Applicability. This clause applies to covered contractor information systems",
        endAnchor:
          "Date that all requirements are expected to be implemented (i.e., a score of 110 is expected to be achieved) based on information gathered from associated plan(s) of action developed in accordance with NIST SP 800-171",
        requiredAnchors: [
          "provide access to its facilities, systems, and personnel",
          "95 out of 110",
          "score of 110 is expected to be achieved",
        ],
      },
    ],
  },
  {
    packageId: "qa-c-future-cmmc-by-notice-official-comparison",
    mapping: mappingById(
      QA_C_REGULATORY_APPLICABILITY_MAPPINGS,
      "qa-c-future-cmmc-by-notice"
    ),
    excerpts: [
      {
        sourceId: "dfars-252-204-7021",
        locator: "DFARS 252.204-7021(d) and (f) — inserted level, covered systems, and subcontract flowdown",
        startAnchor: "(d) Requirements. The Contractor shall",
        endAnchor:
          "ensure that the subcontractor has a current CMMC certificate or current CMMC status at the CMMC level that is appropriate for the information that is being flowed down to the subcontractor based on the requirements at 32 CFR 170.23",
        requiredAnchors: [
          "Contracting Officer insert",
          "process, store, or transmit FCI or CUI",
          "flow down the correct CMMC level",
          "(f) Subcontracts",
        ],
      },
      {
        sourceId: "dfars-252-204-7025",
        locator: "DFARS 252.204-7025(b) — solicitation-specified CMMC level and preaward status",
        startAnchor:
          "(b)(1) Cybersecurity Maturity Model Certification (CMMC) level. The CMMC level required by this solicitation is",
        endAnchor:
          "A current affirmation of continuous compliance with the security requirements identified at 32 CFR part 170 in SPRS",
        requiredAnchors: [
          "Contracting Officer insert",
          "required prior to award",
          "current CMMC status",
        ],
      },
    ],
  },
  {
    packageId: "qa-c-incident-reporting-and-preservation-official-comparison",
    mapping: mappingById(
      QA_C_REGULATORY_APPLICABILITY_MAPPINGS,
      "qa-c-incident-reporting-and-preservation"
    ),
    excerpts: [
      {
        sourceId: "dfars-252-204-7012",
        locator: "DFARS 252.204-7012(a), (c), and (e) — rapid reporting and media preservation",
        startAnchor: "Rapidly report means within 72 hours of discovery of any cyber incident",
        endAnchor:
          "all relevant monitoring/packet capture data for at least 90 days from the submission of the cyber incident report to allow DoD to request the media or decline interest",
        requiredAnchors: [
          "within 72 hours",
          "Rapidly report cyber incidents to DoD",
          "at least 90 days",
        ],
      },
    ],
  },
  {
    packageId: "qa-c-lower-tier-7012-flowdown-official-comparison",
    mapping: mappingById(
      QA_C_REGULATORY_APPLICABILITY_MAPPINGS,
      "qa-c-lower-tier-7012-flowdown"
    ),
    excerpts: [
      {
        sourceId: "dfars-252-204-7012",
        locator: "DFARS 252.204-7012(m)(1) — covered-defense-information subcontract flowdown",
        startAnchor: "(m) Subcontracts. The Contractor shall",
        endAnchor:
          "including subcontracts for commercial products or commercial services, without alteration, except to identify the parties",
        requiredAnchors: [
          "operationally critical support",
          "covered defense information",
          "without alteration",
        ],
      },
      {
        sourceId: "dfars-252-204-7021",
        locator: "DFARS 252.204-7021(f) — CMMC subcontract level and preaward status",
        startAnchor: "(f) Subcontracts. The Contractor shall",
        endAnchor:
          "ensure that the subcontractor has a current CMMC certificate or current CMMC status at the CMMC level that is appropriate for the information that is being flowed down to the subcontractor based on the requirements at 32 CFR 170.23",
        requiredAnchors: [
          "excluding commercially available off-the-shelf items",
          "process, store, or transmit FCI or CUI",
          "CMMC level that is appropriate for the information",
        ],
      },
    ],
  },
  {
    packageId: "qa-c-dfars-7012-nist-baseline-core-clause",
    mapping: mappingById(
      QA_C_REGULATORY_APPLICABILITY_MAPPINGS,
      "qa-c-dfars-7012-nist-baseline"
    ),
    excerpts: [
      {
        sourceId: "dfars-252-204-7012",
        locator: "DFARS 252.204-7012 — covered-system reporting, preservation, and flowdown baseline",
        startAnchor:
          "252.204-7012 Safeguarding Covered Defense Information and Cyber Incident Reporting",
        endAnchor:
          "including subcontracts for commercial products or commercial services, without alteration, except to identify the parties",
        requiredAnchors: [
          "within 72 hours",
          "at least 90 days",
          "covered defense information",
        ],
      },
    ],
  },
];

export const REGULATORY_BENCHMARK_CITATION_PACKAGES = REQUESTS.map((request) =>
  buildRegulatoryCitationPackage(request, APPROVED_SOURCE_EXCERPT_FIXTURES)
);
