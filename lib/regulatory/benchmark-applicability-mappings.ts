import type { RegulatoryApplicabilityMapping } from "./applicability";

export const QA_D_REGULATORY_APPLICABILITY_MAPPINGS = [
  {
    mappingId: "qa-d-missing-wage-determination",
    fixtureId: "QA-D",
    topic: "Construction wage determination incorporated but unavailable before pricing and mobilization",
    evidenceQuotes: [
      "1.3 Wage Determination WD 2026-CA-9999 is incorporated by reference but is not attached at execution. Prime will provide the wage determination and any modifications after mobilization.",
      "3.1 The Davis-Bacon Act and Construction Wage Rate Requirements apply to all covered construction laborers and mechanics. Subcontractor shall pay not less than the wages and fringe benefits stated in the applicable wage determination and modifications.",
    ],
    contractualImpositionStatus: "expressly imposed",
    regulatoryApplicabilityStatus: "Potentially applicable",
    comparisonStatus: "required supporting document missing",
    sourceComparisons: [
      {
        sourceId: "far-52-222-6",
        locator: "FAR 52.222-6",
        expectedRelationship: "defines required document",
        reviewNote: "Compare the subcontract language to the applicable construction wage clause and the actual attached wage determination.",
      },
      {
        sourceId: "sam-wage-determinations",
        locator: "project-specific construction wage determination and modification",
        expectedRelationship: "defines required document",
        reviewNote: "The fictional identifier cannot establish locality, construction type, modification, classifications, wages, or fringe rates.",
      },
      {
        sourceId: "ecfr-29-part-5",
        locator: "29 CFR part 5 labor standards and payroll requirements",
        expectedRelationship: "defines applicability",
        reviewNote: "Use the controlling labor-standard record only after project and wage-determination facts are verified.",
      },
    ],
    supportingFacts: [
      "The package describes a $3,600,000 firm-fixed-price construction subcontract.",
      "The stated scope includes excavation, concrete, structural repairs, electrical support, and site restoration.",
      "The subcontract expressly imposes construction wage obligations.",
    ],
    missingFacts: [
      "Actual federal project location and jurisdiction",
      "Authentic wage-determination number and modification",
      "Construction type and covered locality",
      "Attached wage and fringe schedules",
      "Prime-contract flowdown matrix and clause versions",
    ],
    prohibitedInferences: [
      "Do not infer any wage rate, fringe rate, labor classification, locality, construction type, or modification status from WD 2026-CA-9999.",
    ],
    recommendedDocumentRequests: [
      "Provide the complete official wage determination and every incorporated modification before execution and mobilization.",
      "Provide the Prime flowdown matrix identifying the construction labor clauses and revision dates.",
    ],
    reviewerConclusion: "The obligation is contractually imposed, but statutory applicability and pricing cannot be verified from the fictional, unattached wage-determination reference.",
  },
  {
    mappingId: "qa-d-certified-payroll-deadline",
    fixtureId: "QA-D",
    topic: "Weekly certified payroll and a Prime-imposed accelerated submission deadline",
    evidenceQuotes: [
      "4.1 Subcontractor shall submit complete weekly certified payrolls using Form WH-347 or an approved equivalent no later than three business days after each payroll period.",
    ],
    contractualImpositionStatus: "expressly imposed",
    regulatoryApplicabilityStatus: "Potentially applicable",
    comparisonStatus: "prime-drafted obligation broader than federal baseline",
    sourceComparisons: [
      {
        sourceId: "far-52-222-8",
        locator: "FAR 52.222-8 and FAR 22.406-6",
        expectedRelationship: "provides controlling deadline",
        reviewNote: "The federal construction baseline uses weekly payroll records and a submission timing measured from the regular payment date; compare that baseline to the Prime's three-business-day rule.",
      },
      {
        sourceId: "ecfr-29-part-3",
        locator: "29 CFR part 3 certified statements and payroll deductions",
        expectedRelationship: "supports stated obligation",
        reviewNote: "Confirm the required statement of compliance and payroll record content without assuming WH-347 is mandatory when an equivalent is allowed.",
      },
    ],
    supportingFacts: [
      "The subcontract requires weekly certified payrolls.",
      "The subcontract allows Form WH-347 or an approved equivalent.",
    ],
    missingFacts: [
      "Actual payroll payment date and Prime submission procedure",
      "Applicable construction wage clause and wage determination",
    ],
    prohibitedInferences: [
      "Do not describe the Prime's three-business-day deadline as the federal deadline without source comparison.",
    ],
    recommendedDocumentRequests: [
      "Provide the Prime certified-payroll procedure, required form, submission portal, and deadline calculation example.",
    ],
    reviewerConclusion: "Certified payroll is expressly required, while the Prime's timing may be stricter or differently measured than the federal baseline and should be identified as Prime-drafted.",
  },
  {
    mappingId: "qa-d-scls-conditional",
    fixtureId: "QA-D",
    topic: "Conditional Service Contract Labor Standards coverage inside a construction package",
    evidenceQuotes: [
      "3.2 The Service Contract Labor Standards (SCLS) shall apply to any covered service employees performing site logistics, custodial support, equipment operation, or other covered support services if Prime determines the work is subject to SCLS.",
    ],
    contractualImpositionStatus: "conditionally imposed",
    regulatoryApplicabilityStatus: "Not established",
    comparisonStatus: "applicability uncertain",
    sourceComparisons: [
      {
        sourceId: "far-52-222-41",
        locator: "FAR 52.222-41",
        expectedRelationship: "defines applicability",
        reviewNote: "Determine whether covered service employees and a valid service wage determination are actually implicated; Prime discretion alone does not establish statutory coverage.",
      },
      {
        sourceId: "ecfr-29-part-4",
        locator: "29 CFR part 4",
        expectedRelationship: "defines applicability",
        reviewNote: "Review principal-purpose, employee-classification, exemption, and mixed-contract facts before reaching an SCLS conclusion.",
      },
    ],
    supportingFacts: [
      "The package identifies possible logistics, custodial, equipment-operation, and support services.",
      "The clause makes SCLS conditional rather than attaching a service wage determination.",
    ],
    missingFacts: [
      "Principal purpose and separability of the support services",
      "Actual service-employee duties and classifications",
      "Applicable service wage determination",
      "Any exemption or administrative determination",
    ],
    prohibitedInferences: [
      "Do not conclude that SCLS applies solely because the Prime says it may later determine coverage.",
    ],
    recommendedDocumentRequests: [
      "Identify each potentially covered service role and provide the applicable SCLS clause and wage determination before pricing.",
    ],
    reviewerConclusion: "The subcontract creates conditional commercial exposure, but current facts do not establish SCLS applicability.",
  },
  {
    mappingId: "qa-d-unilateral-labor-change-no-adjustment",
    fixtureId: "QA-D",
    topic: "Prime-directed labor classification and wage changes without assured price relief",
    evidenceQuotes: [
      "3.4 Prime may direct a revised classification, wage rate, fringe obligation, or labor standard. Subcontractor shall comply immediately and is not entitled to a price adjustment unless Prime receives and passes through a corresponding Government adjustment.",
    ],
    contractualImpositionStatus: "expressly imposed",
    regulatoryApplicabilityStatus: "Potentially applicable",
    comparisonStatus: "prime-drafted obligation broader than federal baseline",
    sourceComparisons: [
      {
        sourceId: "far-52-222-6",
        locator: "FAR construction wage classification and conformance process",
        expectedRelationship: "provides comparison baseline",
        reviewNote: "Separate government-authorized classification or wage-determination changes from unilateral Prime direction.",
      },
      {
        sourceId: "far-52-222-41",
        locator: "FAR service classification and conformance process",
        expectedRelationship: "provides comparison baseline",
        reviewNote: "If SCLS is implicated, compare the official conformance and price-adjustment framework to the pass-through-only limitation.",
      },
    ],
    supportingFacts: [
      "The Prime may direct immediate compliance.",
      "Price relief is conditioned on the Prime receiving and passing through a Government adjustment.",
    ],
    missingFacts: [
      "Actual clause authorizing the change",
      "Government modification or contracting-officer direction",
      "Prime entitlement and subcontract pass-through procedure",
    ],
    prohibitedInferences: [
      "Do not characterize every Prime-directed wage or classification change as a government-mandated regulatory change.",
    ],
    recommendedDocumentRequests: [
      "Require written Government or contracting-officer authority and a bilateral price and schedule adjustment for changed labor obligations.",
    ],
    reviewerConclusion: "The clause shifts change and financing risk beyond a verified federal baseline and requires separate commercial-risk treatment.",
  },
  {
    mappingId: "qa-d-lower-tier-labor-flowdown",
    fixtureId: "QA-D",
    topic: "Lower-tier labor and payroll flowdowns",
    evidenceQuotes: [
      "10.2 Subcontractor shall flow down Davis-Bacon, SCLS when applicable, certified-payroll, safety, insurance, audit, notice, and records requirements to every lower tier.",
    ],
    contractualImpositionStatus: "expressly imposed",
    regulatoryApplicabilityStatus: "Potentially applicable",
    comparisonStatus: "source-backed obligation present",
    sourceComparisons: [
      {
        sourceId: "far-52-222-8",
        locator: "FAR 52.222-8 subcontract payroll responsibilities",
        expectedRelationship: "supports stated obligation",
        reviewNote: "Verify which construction payroll obligations apply to each lower-tier subcontract.",
      },
      {
        sourceId: "far-52-222-41",
        locator: "FAR 52.222-41 subcontract coverage",
        expectedRelationship: "defines applicability",
        reviewNote: "SCLS flowdown must remain conditional on actual covered service work and applicable clauses.",
      },
    ],
    supportingFacts: ["The clause expressly requires flowdown to every lower tier."],
    missingFacts: [
      "Lower-tier scopes and employee duties",
      "Applicable clause list for each lower tier",
      "Construction and service wage determinations",
    ],
    prohibitedInferences: [
      "Do not assume identical labor clauses apply to every lower tier regardless of scope, location, threshold, or employee type.",
    ],
    recommendedDocumentRequests: [
      "Provide a lower-tier flowdown matrix tied to each supplier's actual scope and covered employees.",
    ],
    reviewerConclusion: "A genuine flowdown obligation may exist, but the all-lower-tier wording requires scope-specific applicability review.",
  },
] as const satisfies readonly RegulatoryApplicabilityMapping[];

export const QA_C_REGULATORY_APPLICABILITY_MAPPINGS = [
  {
    mappingId: "qa-c-dfars-7012-nist-baseline",
    fixtureId: "QA-C",
    topic: "DFARS 252.204-7012 and NIST SP 800-171 expressly flowed to covered systems",
    evidenceQuotes: [
      "2.1 Subcontractor shall comply with DFARS 252.204-7012, Safeguarding Covered Defense Information and Cyber Incident Reporting, and shall implement the security requirements of NIST SP 800-171 on every covered contractor information system.",
      "1.2 Prime expects Subcontractor personnel and systems to receive, create, process, transmit, or store Federal Contract Information and Controlled Unclassified Information, including Covered Defense Information.",
    ],
    contractualImpositionStatus: "expressly imposed",
    regulatoryApplicabilityStatus: "Potentially applicable",
    comparisonStatus: "source-backed obligation present",
    sourceComparisons: [
      {
        sourceId: "dfars-252-204-7012",
        locator: "DFARS 252.204-7012",
        expectedRelationship: "supports stated obligation",
        reviewNote: "Confirm the exact clause version, covered defense information, covered contractor information systems, incident duties, cloud-service terms, and subcontract flowdown scope.",
      },
      {
        sourceId: "nist-sp-800-171-r3",
        locator: "NIST SP 800-171 Revision 3",
        expectedRelationship: "provides comparison baseline",
        reviewNote: "Identify the contractually required NIST revision and the system components that process, store, transmit, or protect CUI.",
      },
      {
        sourceId: "cui-registry",
        locator: "CUI categories and safeguarding authorities",
        expectedRelationship: "defines applicability",
        reviewNote: "Verify the actual CUI categories, authorities, markings, and handling instructions rather than relying on generic labels.",
      },
    ],
    supportingFacts: [
      "The work is described as supporting a fictional defense customer.",
      "The package anticipates FCI, CUI, and covered defense information on subcontractor systems.",
      "The subcontract expressly cites DFARS 252.204-7012 and NIST SP 800-171.",
    ],
    missingFacts: [
      "Actual prime clause set and revision dates",
      "Covered-system boundary and data-flow map",
      "CUI categories and marking authority",
      "Whether any COTS or other exception applies",
      "Required NIST revision and transition instructions",
    ],
    prohibitedInferences: [
      "Do not infer that every subcontractor system is covered or that every unmarked Prime record is CUI.",
    ],
    recommendedDocumentRequests: [
      "Provide the complete flowed-down clause, CUI marking guide, system boundary, data-flow map, and applicable NIST revision before execution.",
    ],
    reviewerConclusion: "The obligation is expressly imposed and strongly triggered by the stated work, but exact applicability and system scope still require the missing contract and data facts.",
  },
  {
    mappingId: "qa-c-dfars-7002-citation-mismatch",
    fixtureId: "QA-C",
    topic: "DFARS 252.204-7002 is cited as a cybersecurity assessment clause even though the current identifier concerns NSP line-item payment",
    evidenceQuotes: [
      "2.2 Subcontractor shall also comply with DFARS 252.204-7002 and DFARS 252.204-7020, including assessments, access, and cooperation requested by the Government or Prime.",
    ],
    contractualImpositionStatus: "citation inconsistent",
    regulatoryApplicabilityStatus: "Not established",
    comparisonStatus: "cited clause incomplete, altered, obsolete, or inconsistent",
    sourceComparisons: [
      {
        sourceId: "dfars-current",
        locator: "DFARS 252.204-7002 — Payment for Contract Line or Subline Items Not Separately Priced",
        expectedRelationship: "shows cited identifier is unrelated",
        reviewNote: "The cited identifier does not establish cybersecurity assessment, access, or cooperation duties; do not silently substitute another clause.",
      },
      {
        sourceId: "dfars-252-204-7020",
        locator: "DFARS 252.204-7020",
        expectedRelationship: "supports stated obligation",
        reviewNote: "Review 252.204-7020 separately because that cited clause does address NIST SP 800-171 DoD assessments and access.",
      },
    ],
    supportingFacts: ["The clause pairs 252.204-7002 with 252.204-7020 and describes both as cyber assessment obligations."],
    missingFacts: [
      "Prime's intended clause number and complete flowdown text",
      "Whether DFARS 252.204-7008 or another provision was intended",
    ],
    prohibitedInferences: [
      "Do not rewrite the subcontract by assuming which cybersecurity clause the Prime intended.",
    ],
    recommendedDocumentRequests: [
      "Require the Prime to correct the citation and supply the complete intended clause text before execution.",
    ],
    reviewerConclusion: "This is a source-verifiable citation defect, not merely a commercial-risk issue; the report should identify the mismatch and request correction.",
  },
  {
    mappingId: "qa-c-absolute-110-score-warranty",
    fixtureId: "QA-C",
    topic: "Perpetual perfect assessment-score warranty and automatic material breach",
    evidenceQuotes: [
      "2.3 Subcontractor warrants that its current NIST SP 800-171 assessment score is 110 and will remain 110 throughout performance. Any score below 110 constitutes a material breach, regardless of an accepted plan of action and milestones.",
    ],
    contractualImpositionStatus: "expressly imposed",
    regulatoryApplicabilityStatus: "Potentially applicable",
    comparisonStatus: "prime-drafted obligation broader than federal baseline",
    sourceComparisons: [
      {
        sourceId: "dfars-252-204-7019",
        locator: "DFARS 252.204-7019 current assessment requirement",
        expectedRelationship: "provides comparison baseline",
        reviewNote: "Compare the required current assessment to the Prime's absolute 110 warranty and automatic breach remedy.",
      },
      {
        sourceId: "dfars-252-204-7020",
        locator: "DFARS 252.204-7020 assessment definitions and access",
        expectedRelationship: "provides comparison baseline",
        reviewNote: "Verify the applicable methodology, assessment scope, age, and SPRS record rather than accepting an unsupported score representation.",
      },
    ],
    supportingFacts: [
      "The subcontract requires a score of 110 throughout performance.",
      "It rejects the effect of an accepted plan of action and milestones for breach purposes.",
    ],
    missingFacts: [
      "Actual SPRS assessment record and date",
      "Applicable assessment methodology and NIST revision",
      "Covered-system scope",
      "Permitted plan-of-action treatment under the applicable clause set",
    ],
    prohibitedInferences: [
      "Do not state that federal law universally requires a continuous score of 110 for every covered subcontractor system.",
    ],
    recommendedDocumentRequests: [
      "Provide the applicable assessment methodology, SPRS evidence, system scope, and any permitted POA&M terms.",
    ],
    reviewerConclusion: "A current assessment may be required, but the permanent perfect-score warranty and automatic breach provision are Prime-drafted risk allocations requiring separate negotiation.",
  },
  {
    mappingId: "qa-c-future-cmmc-by-notice",
    fixtureId: "QA-C",
    topic: "Future CMMC and cybersecurity requirements become binding by email or portal posting",
    evidenceQuotes: [
      "2.4 Prime may add revised cybersecurity frameworks, agency directives, CMMC requirements, cloud-security controls, or customer procedures by email or portal posting. Each added requirement becomes binding upon notice without a price or schedule adjustment.",
    ],
    contractualImpositionStatus: "expressly imposed",
    regulatoryApplicabilityStatus: "Not established",
    comparisonStatus: "prime-drafted obligation broader than federal baseline",
    sourceComparisons: [
      {
        sourceId: "dfars-252-204-7021",
        locator: "DFARS 252.204-7021 CMMC level and flowdown requirements",
        expectedRelationship: "provides comparison baseline",
        reviewNote: "CMMC obligations depend on the clause, required level, covered information systems, current status, and flowdown rules—not an unspecified future portal posting alone.",
      },
      {
        sourceId: "dfars-252-204-7025",
        locator: "DFARS 252.204-7025 solicitation notice",
        expectedRelationship: "defines required document",
        reviewNote: "Confirm the specified CMMC level and solicitation/contract terms before treating CMMC as established.",
      },
      {
        sourceId: "ecfr-32-part-170",
        locator: "32 CFR part 170",
        expectedRelationship: "defines applicability",
        reviewNote: "Review assessment level, status, affirmation, POA&M, and subcontract flowdown facts under the program rule.",
      },
    ],
    supportingFacts: ["The clause names CMMC but supplies no level, assessment status, system list, or effective contract clause."],
    missingFacts: [
      "Required CMMC level",
      "Applicable DFARS 252.204-7021 and 7025 text",
      "CMMC UID and current assessment status",
      "Systems processing FCI or CUI",
      "Price and schedule impact",
    ],
    prohibitedInferences: [
      "Do not infer a CMMC level or certification duty from a generic reference to future CMMC requirements.",
    ],
    recommendedDocumentRequests: [
      "Require the exact CMMC level, clause version, covered systems, implementation date, and equitable-adjustment mechanism in a bilateral amendment.",
    ],
    reviewerConclusion: "The clause creates open-ended commercial exposure; current regulatory applicability is not established from the missing level and system facts.",
  },
  {
    mappingId: "qa-c-incident-reporting-and-preservation",
    fixtureId: "QA-C",
    topic: "Prime eight-hour notice compared with DoD reporting and preservation obligations",
    evidenceQuotes: [
      "4.1 Subcontractor shall report any suspected cyber incident, compromise, unauthorized disclosure, malware event, lost device, anomalous access, or policy violation to Prime within eight hours after discovery or suspicion.",
      "4.2 Subcontractor shall submit any required report to the DoD reporting portal within seventy-two hours and shall provide Prime the report number, all updates, and all information submitted to the Government.",
      "4.3 Subcontractor shall preserve and protect images of affected information systems and all relevant monitoring or packet-capture data for at least ninety days after reporting, or longer if Prime directs.",
    ],
    contractualImpositionStatus: "expressly imposed",
    regulatoryApplicabilityStatus: "Potentially applicable",
    comparisonStatus: "prime-drafted obligation broader than federal baseline",
    sourceComparisons: [
      {
        sourceId: "dfars-252-204-7012",
        locator: "DFARS 252.204-7012 cyber incident reporting, media preservation, and subcontract flowdown",
        expectedRelationship: "provides controlling deadline",
        reviewNote: "Distinguish the official DoD reporting and preservation duties from the Prime's broader eight-hour suspicion and policy-violation notice.",
      },
    ],
    supportingFacts: [
      "The subcontract states a seventy-two-hour DoD portal deadline and ninety-day preservation period.",
      "The Prime notice is triggered by suspicion and several events broader than a verified reportable cyber incident.",
    ],
    missingFacts: [
      "Incident definition and reporting threshold in the flowed-down clause",
      "Prime incident-reporting procedure and secure communication channel",
      "Cloud-service and subcontract reporting responsibilities",
    ],
    prohibitedInferences: [
      "Do not present the Prime's eight-hour notice as the DFARS seventy-two-hour reporting deadline.",
    ],
    recommendedDocumentRequests: [
      "Provide a reporting matrix separating Prime notice, DoD portal submission, evidence preservation, and lower-tier escalation duties.",
    ],
    reviewerConclusion: "The seventy-two-hour and preservation concepts may track the federal clause, while the eight-hour suspicion-based notice is a separate Prime-drafted acceleration.",
  },
  {
    mappingId: "qa-c-unmarked-cui-designation",
    fixtureId: "QA-C",
    topic: "Prime or customer representatives may designate any information as CUI even if unmarked or disputed",
    evidenceQuotes: [
      "3.1 All information identified by Prime, the Government, or any customer representative as CUI shall be treated as CUI immediately, even if it is not marked and even if the designation is later disputed.",
    ],
    contractualImpositionStatus: "expressly imposed",
    regulatoryApplicabilityStatus: "Not established",
    comparisonStatus: "prime-drafted obligation broader than federal baseline",
    sourceComparisons: [
      {
        sourceId: "cui-registry",
        locator: "CUI category, authority, marking, safeguarding, and dissemination records",
        expectedRelationship: "defines applicability",
        reviewNote: "Verify the category and legal or policy authority for CUI rather than treating every Prime designation as dispositive.",
      },
      {
        sourceId: "nist-sp-800-171-r3",
        locator: "NIST SP 800-171 scope for systems processing, storing, transmitting, or protecting CUI",
        expectedRelationship: "provides comparison baseline",
        reviewNote: "Security scope follows actual CUI and affected system components; the missing marking guide and data-flow map are material.",
      },
    ],
    supportingFacts: [
      "The CUI marking guide is expressly missing at execution.",
      "The clause requires immediate treatment even when designation is disputed.",
    ],
    missingFacts: [
      "CUI category and authority",
      "Authorized designating official or process",
      "Marking guide and decontrol procedure",
      "Covered data flows and system boundary",
    ],
    prohibitedInferences: [
      "Do not state that an unsupported label automatically creates CUI under federal law or policy.",
    ],
    recommendedDocumentRequests: [
      "Provide the CUI category, authority, marking guide, data-flow map, challenge process, and decontrol instructions.",
    ],
    reviewerConclusion: "The clause may require conservative handling contractually, but federal CUI status and system scope are not established by an unsupported designation alone.",
  },
  {
    mappingId: "qa-c-lower-tier-7012-flowdown",
    fixtureId: "QA-C",
    topic: "DFARS 252.204-7012 and Prime cyber requirements flowed to lower tiers",
    evidenceQuotes: [
      "6.1 Subcontractor shall flow down DFARS 252.204-7012 and all other cyber requirements identified by Prime to every lower-tier supplier that may handle covered information or support a covered system.",
    ],
    contractualImpositionStatus: "expressly imposed",
    regulatoryApplicabilityStatus: "Potentially applicable",
    comparisonStatus: "source-backed obligation present",
    sourceComparisons: [
      {
        sourceId: "dfars-252-204-7012",
        locator: "DFARS 252.204-7012 subcontract flowdown paragraph",
        expectedRelationship: "defines applicability",
        reviewNote: "Tie flowdown to the lower-tier scope, covered defense information, operationally critical support, and required clause substance.",
      },
      {
        sourceId: "dfars-252-204-7021",
        locator: "DFARS 252.204-7021 CMMC subcontract requirements",
        expectedRelationship: "defines applicability",
        reviewNote: "CMMC flowdown requires the correct level based on the information and systems involved; it is not established by a generic all-cyber-requirements clause.",
      },
    ],
    supportingFacts: ["The clause applies to suppliers that may handle covered information or support a covered system."],
    missingFacts: [
      "Each lower-tier supplier's scope",
      "Information and systems accessed by each lower tier",
      "Required DFARS clause substance and CMMC level",
      "COTS or other exceptions",
    ],
    prohibitedInferences: [
      "Do not impose every Prime cyber procedure on every supplier without a scope-specific flowdown analysis.",
    ],
    recommendedDocumentRequests: [
      "Create a lower-tier cyber flowdown matrix identifying clause, reason, information type, system boundary, and CMMC level for each supplier.",
    ],
    reviewerConclusion: "A source-backed flowdown may be required, but the Prime's all-other-requirements wording is broader and must be mapped supplier by supplier.",
  },
] as const satisfies readonly RegulatoryApplicabilityMapping[];

export const REGULATORY_BENCHMARK_APPLICABILITY_MAPPINGS = [
  ...QA_D_REGULATORY_APPLICABILITY_MAPPINGS,
  ...QA_C_REGULATORY_APPLICABILITY_MAPPINGS,
] as const satisfies readonly RegulatoryApplicabilityMapping[];
