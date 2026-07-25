import type { RegulatoryApplicabilityMapping } from "./applicability";
import {
  QA_C_REGULATORY_APPLICABILITY_MAPPINGS,
  QA_D_REGULATORY_APPLICABILITY_MAPPINGS,
} from "./benchmark-applicability-mappings";
import { REGULATORY_BENCHMARK_CITATION_PACKAGES } from "./benchmark-citation-packages";
import {
  buildRegulatoryCitationPackage,
  type RegulatoryCitationPackage,
  type RegulatoryCitationPackageRequest,
} from "./citation-package";
import { APPROVED_SOURCE_EXCERPT_FIXTURES } from "./__fixtures__/approved-source-excerpt-fixtures.mjs";
import { APPROVED_SUPPLEMENTAL_SOURCE_EXCERPT_FIXTURES } from "./__fixtures__/approved-supplemental-source-excerpt-fixtures.mjs";

const ALL_APPROVED_SOURCE_EXCERPT_FIXTURES = {
  ...APPROVED_SOURCE_EXCERPT_FIXTURES,
  ...APPROVED_SUPPLEMENTAL_SOURCE_EXCERPT_FIXTURES,
};

function mappingById(
  mappings: readonly RegulatoryApplicabilityMapping[],
  mappingId: string
): RegulatoryApplicabilityMapping {
  const mapping = mappings.find((candidate) => candidate.mappingId === mappingId);
  if (!mapping) throw new Error(`Unknown regulatory applicability mapping: ${mappingId}`);
  return mapping;
}

const COVERAGE_REQUESTS: RegulatoryCitationPackageRequest[] = [
  {
    packageId: "qa-d-missing-wage-determination-complete-source-coverage",
    mapping: mappingById(
      QA_D_REGULATORY_APPLICABILITY_MAPPINGS,
      "qa-d-missing-wage-determination"
    ),
    excerpts: [
      {
        sourceId: "far-52-222-6",
        locator: "FAR 52.222-6(b)-(c) — attached wage determination and conformance authority",
        startAnchor: "(b)(1) All laborers and mechanics employed",
        endAnchor:
          "the proposed rate bears a reasonable relationship to the wage rates contained in the wage determination",
        requiredAnchors: [
          "wage determination of the Secretary of Labor",
          "attached hereto and made a part hereof",
          "classified in conformance with the wage determination",
        ],
      },
      {
        sourceId: "sam-wage-determinations",
        locator: "SAM.gov Wage Determinations — search dimensions and prevailing-wage content",
        startAnchor: "A wage determination (WD) is a set of wages",
        endAnchor:
          "Service Contracts identifies wage rates for service employees under the Service Contract Act",
        requiredAnchors: [
          "given labor category in a given locality",
          "Search by wage determination number",
          "Public Buildings or Works",
        ],
      },
      {
        sourceId: "ecfr-29-part-5",
        locator: "29 CFR 5.5(a)(6) and (d) — wage determination flowdown and incorporation",
        startAnchor: "(6) Subcontracts. The contractor or subcontractor must insert",
        endAnchor:
          "the same force and effect as if they were inserted in full text",
        requiredAnchors: [
          "along with the applicable wage determination(s)",
          "lower-tier subcontracts",
          "appropriate wage determinations",
        ],
      },
    ],
  },
  {
    packageId: "qa-d-certified-payroll-deadline-complete-source-coverage",
    mapping: mappingById(
      QA_D_REGULATORY_APPLICABILITY_MAPPINGS,
      "qa-d-certified-payroll-deadline"
    ),
    excerpts: [
      {
        sourceId: "far-52-222-8",
        locator: "FAR 52.222-8(b)(2)-(3) — certification and WH-347 equivalence",
        startAnchor: "(2) Each payroll submitted shall be accompanied by a Statement of Compliance",
        endAnchor:
          "shall satisfy the requirement for submission of the Statement of Compliance required by paragraph (b)(2) of this clause",
        requiredAnchors: ["Statement of Compliance", "Optional Form WH-347"],
      },
      {
        sourceId: "ecfr-29-part-3",
        locator: "29 CFR 3.3(b) and 3.4(a) — weekly certified payroll and seven-day delivery",
        startAnchor: "(b) Each contractor or subcontractor engaged in the construction",
        endAnchor:
          "to a Federal or State agency contracting for or financing the building or work",
        requiredAnchors: [
          "each week must provide a copy of its weekly payroll",
          "Form WH-347",
          "or on any form with identical wording",
          "within seven days after the regular payment date",
        ],
      },
    ],
  },
  {
    packageId: "qa-d-scls-conditional-complete-source-coverage",
    mapping: mappingById(QA_D_REGULATORY_APPLICABILITY_MAPPINGS, "qa-d-scls-conditional"),
    excerpts: [
      {
        sourceId: "far-52-222-41",
        locator: "FAR 52.222-41(b), (c)(1), and (l) — applicability and covered subcontracts",
        startAnchor: "(b) Applicability. This contract is subject",
        endAnchor:
          "all subcontracts subject to the Service Contract Labor Standards statute",
        requiredAnchors: [
          "This clause does not apply to contracts or subcontracts administratively exempted",
          "wage determination attached to this contract",
          "subcontracts subject to the Service Contract Labor Standards statute",
        ],
      },
      {
        sourceId: "ecfr-29-part-4",
        locator: "29 CFR 4.111, 4.113, and 4.130 — principal purpose and service-employee coverage",
        startAnchor: "(a) Principal purpose as criterion",
        endAnchor: "support services at military installations",
        requiredAnchors: [
          "principal purpose is to provide something other than services",
          "only incidental to the performance of a contract for another purpose",
          "through the use of service employees",
        ],
      },
    ],
  },
  {
    packageId: "qa-d-unilateral-labor-change-no-adjustment-complete-source-coverage",
    mapping: mappingById(
      QA_D_REGULATORY_APPLICABILITY_MAPPINGS,
      "qa-d-unilateral-labor-change-no-adjustment"
    ),
    excerpts: [
      {
        sourceId: "far-52-222-6",
        locator: "FAR 52.222-6(c) — contracting-officer conformance process",
        startAnchor: "(c)(1) The Contracting Officer shall require",
        endAnchor:
          "the proposed rate bears a reasonable relationship to the wage rates contained in the wage determination",
        requiredAnchors: [
          "The Contracting Officer shall approve",
          "classification is utilized in the area by the construction industry",
        ],
      },
      {
        sourceId: "far-52-222-41",
        locator: "FAR 52.222-41(b)-(c) — SCLS applicability and attached wage determination",
        startAnchor: "(b) Applicability. This contract is subject",
        endAnchor: "as specified in any wage determination attached to this contract",
        requiredAnchors: [
          "Service Contract Labor Standards",
          "wage determination attached to this contract",
        ],
      },
    ],
  },
  {
    packageId: "qa-d-lower-tier-labor-flowdown-complete-source-coverage",
    mapping: mappingById(
      QA_D_REGULATORY_APPLICABILITY_MAPPINGS,
      "qa-d-lower-tier-labor-flowdown"
    ),
    excerpts: [
      {
        sourceId: "far-52-222-8",
        locator: "FAR 52.222-8(b) — contractor or subcontractor certified payroll",
        startAnchor: "(2) Each payroll submitted shall be accompanied",
        endAnchor:
          "shall satisfy the requirement for submission of the Statement of Compliance required by paragraph (b)(2) of this clause",
        requiredAnchors: ["Contractor or subcontractor", "Optional Form WH-347"],
      },
      {
        sourceId: "far-52-222-41",
        locator: "FAR 52.222-41(l) — SCLS subcontract flowdown",
        startAnchor: "(l) Subcontracts. The Contractor agrees",
        endAnchor: "subcontracts subject to the Service Contract Labor Standards statute",
        requiredAnchors: ["subcontracts subject to the Service Contract Labor Standards statute"],
      },
    ],
  },
  {
    packageId: "qa-c-dfars-7012-nist-baseline-complete-source-coverage",
    mapping: mappingById(
      QA_C_REGULATORY_APPLICABILITY_MAPPINGS,
      "qa-c-dfars-7012-nist-baseline"
    ),
    excerpts: [
      {
        sourceId: "dfars-252-204-7012",
        locator: "DFARS 252.204-7012 — reporting, preservation, and flowdown baseline",
        startAnchor:
          "252.204-7012 Safeguarding Covered Defense Information and Cyber Incident Reporting",
        endAnchor: "without alteration, except to identify the parties",
        requiredAnchors: ["within 72 hours", "at least 90 days", "covered defense information"],
      },
      {
        sourceId: "nist-sp-800-171-r3",
        locator: "NIST SP 800-171 Revision 3 abstract — technical scope",
        startAnchor: "This publication provides federal agencies",
        endAnchor:
          "contractual vehicles or other agreements established between those agencies and nonfederal organizations",
        requiredAnchors: [
          "process, store, or transmit CUI",
          "provide protection for such components",
          "contractual vehicles or other agreements",
        ],
      },
      {
        sourceId: "cui-registry",
        locator: "CUI Registry — categories, authorities, and implementing guidance",
        startAnchor: "The CUI Registry is the Government-wide online repository",
        endAnchor:
          "Contractors should not follow CUI program requirements or markings until directed to do so in a contract or agreement",
        requiredAnchors: [
          "CUI categories, markings and controls",
          "safeguarding or dissemination authority",
          "government contracting activity",
        ],
      },
    ],
  },
  {
    packageId: "qa-c-future-cmmc-by-notice-complete-source-coverage",
    mapping: mappingById(
      QA_C_REGULATORY_APPLICABILITY_MAPPINGS,
      "qa-c-future-cmmc-by-notice"
    ),
    excerpts: [
      {
        sourceId: "dfars-252-204-7021",
        locator: "DFARS 252.204-7021(d) and (f) — inserted level and flowdown",
        startAnchor: "(d) Requirements. The Contractor shall",
        endAnchor:
          "the CMMC level that is appropriate for the information that is being flowed down to the subcontractor based on the requirements at 32 CFR 170.23",
        requiredAnchors: ["Contracting Officer insert", "flow down the correct CMMC level"],
      },
      {
        sourceId: "dfars-252-204-7025",
        locator: "DFARS 252.204-7025(b) — solicitation-specified level and preaward status",
        startAnchor: "(b)(1) Cybersecurity Maturity Model Certification (CMMC) level",
        endAnchor:
          "A current affirmation of continuous compliance with the security requirements identified at 32 CFR part 170 in SPRS",
        requiredAnchors: ["The CMMC level required by this solicitation", "required prior to award"],
      },
      {
        sourceId: "ecfr-32-part-170",
        locator: "32 CFR 170.23 — subcontract level based on FCI, CUI, and prime requirement",
        startAnchor: "(a) CMMC requirements apply to prime contractors and subcontractors",
        endAnchor: "DoD may provide specific guidance pertaining to flow-down",
        requiredAnchors: [
          "applicable CMMC level and assessment type for each subcontract",
          "only process, store, or transmit FCI and not CUI",
          "process, store, or transmit CUI",
        ],
      },
    ],
  },
  {
    packageId: "qa-c-unmarked-cui-designation-complete-source-coverage",
    mapping: mappingById(
      QA_C_REGULATORY_APPLICABILITY_MAPPINGS,
      "qa-c-unmarked-cui-designation"
    ),
    excerpts: [
      {
        sourceId: "cui-registry",
        locator: "CUI Registry — category, authority, and contracting-activity guidance",
        startAnchor: "The CUI Registry is the Government-wide online repository",
        endAnchor:
          "Contractors should not follow CUI program requirements or markings until directed to do so in a contract or agreement",
        requiredAnchors: [
          "category description, category marking, and safeguarding or dissemination authority",
          "Questions regarding the status of marked or unmarked information",
          "government contracting activity",
        ],
      },
      {
        sourceId: "nist-sp-800-171-r3",
        locator: "NIST SP 800-171 Revision 3 abstract — system-component scope",
        startAnchor: "This publication provides federal agencies",
        endAnchor:
          "contractual vehicles or other agreements established between those agencies and nonfederal organizations",
        requiredAnchors: ["components of nonfederal systems", "process, store, or transmit CUI"],
      },
    ],
  },
];

export const REGULATORY_SOURCE_COVERAGE_COMPLETION_PACKAGES = COVERAGE_REQUESTS.map(
  (request) => buildRegulatoryCitationPackage(request, ALL_APPROVED_SOURCE_EXCERPT_FIXTURES)
);

const completionByMappingId = new Map(
  REGULATORY_SOURCE_COVERAGE_COMPLETION_PACKAGES.map((citationPackage) => [
    citationPackage.mappingId,
    citationPackage,
  ])
);

export const REGULATORY_FULL_BENCHMARK_CITATION_PACKAGES: RegulatoryCitationPackage[] = [
  ...REGULATORY_BENCHMARK_CITATION_PACKAGES.filter(
    (citationPackage) => !completionByMappingId.has(citationPackage.mappingId)
  ),
  ...REGULATORY_SOURCE_COVERAGE_COMPLETION_PACKAGES,
].sort((left, right) => left.mappingId.localeCompare(right.mappingId));
