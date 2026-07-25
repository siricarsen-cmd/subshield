import { createHash } from "node:crypto";

import { reviewRegulatorySnapshot } from "../source-review.ts";
import { getRegulatorySource } from "../source-catalog.ts";

function sha256(value) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function createApprovedSnapshot(sourceId, text, requiredTextAnchors, index) {
  const source = getRegulatorySource(sourceId);
  if (!source) throw new Error(`Unknown supplemental source fixture ID: ${sourceId}`);
  const retrievedAt = `2026-07-25T22:${String(index).padStart(2, "0")}:00.000Z`;
  const checksum = sha256(text);
  const pending = {
    snapshotId: `${sourceId}:2026072522${String(index).padStart(2, "0")}:${checksum.slice(-12)}`,
    sourceId,
    citation: source.currentVerifiedVersion?.versionIdentifier ?? source.canonicalTitle,
    canonicalTitle: source.canonicalTitle,
    canonicalUrl: source.canonicalUrl,
    versionIdentifier: source.currentVerifiedVersion?.versionIdentifier,
    publicationDate: source.currentVerifiedVersion?.publicationDate,
    effectiveDate: source.currentVerifiedVersion?.effectiveDate,
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
    historicalStatus: "current",
    text,
    applicabilityMetadata: {},
    crossReferences: [],
    provenanceNotes: [
      "Controlled supplemental excerpt transcribed from an approved official government source for citation-package regression coverage.",
    ],
    reviewStatus: "pending",
  };

  return reviewRegulatorySnapshot(pending, {
    decision: "approved",
    reviewedBy: "SubShield regulatory reviewer",
    reviewedAt: `2026-07-25T23:${String(index).padStart(2, "0")}:00.000Z`,
    reviewNotes: [
      "Verified the source identity and exact retained excerpt against the approved official source.",
      "Approved for benchmark-only citation-package regression testing.",
    ],
    requiredTextAnchors,
    verifiedVersionIdentifier: pending.versionIdentifier,
    verifiedEffectiveDate: pending.effectiveDate,
  });
}

const ECFR_29_PART_3_TEXT = `29 CFR Part 3 — Contractors and Subcontractors on Public Building or Public Work
§ 3.3 Certified payrolls.
(b) Each contractor or subcontractor engaged in the construction, prosecution, completion, or repair of any public building or public work, or building or work financed in whole or in part by loans or grants from the United States, each week must provide a copy of its weekly payroll for all laborers and mechanics engaged on work covered by this part and part 5 of this chapter during the preceding weekly payroll period, accompanied by a statement of compliance certifying the accuracy of the weekly payroll information. This statement must be executed by the contractor or subcontractor or by an authorized officer or employee of the contractor or subcontractor who supervises the payment of wages, and must be on the back of Form WH-347, “Payroll (For Contractors Optional Use)” or on any form with identical wording.
§ 3.4 Submission of certified payroll and the preservation and inspection of weekly payroll records.
(a) Each certified payroll required under § 3.3(b) must be delivered by the contractor or subcontractor, within seven days after the regular payment date of the payroll period, to a representative of a Federal or State agency in charge at the site of the building or work, or, if there is no representative of a Federal or State agency at the site of the building or work, the certified payroll must be mailed by the contractor or subcontractor, within such time, to a Federal or State agency contracting for or financing the building or work.`;

const ECFR_29_PART_4_TEXT = `29 CFR Part 4 — Labor Standards for Federal Service Contracts
§ 4.111 Contracts “to furnish services.”
(a) “Principal purpose” as criterion. Under its terms, the Act applies to a contract the principal purpose of which is to furnish services. If the principal purpose is to provide something other than services of the character contemplated by the Act and any such services which may be performed are only incidental to the performance of a contract for another purpose, the Act does not apply.
§ 4.113 Contracts to furnish services “through the use of service employees.”
(a) Use of “service employees” in contract performance. Under the Act, a contract must be principally for services furnished through the use of service employees to be covered by its provisions.
§ 4.130 Types of covered service contracts illustrated.
(a) The types of contracts, the principal purpose of which is to furnish services through the use of service employees, are too numerous and varied to permit an exhaustive listing. Illustrative covered services include custodial, janitorial, and housekeeping services; operation, maintenance, or logistic support of a Federal facility; and support services at military installations.`;

const ECFR_29_PART_5_TEXT = `29 CFR Part 5 — Labor Standards Provisions Applicable to Federal Contracts
§ 5.5 Contract provisions and related matters.
(a) Required contract clauses. The Agency head will cause or require the contracting officer to insert in full, or for contracts covered by the Federal Acquisition Regulation by reference, in any covered contract in excess of $2,000 entered into for actual construction, alteration, or repair of a public building or public work the required labor standards clauses.
(6) Subcontracts. The contractor or subcontractor must insert in any subcontracts the clauses contained in paragraphs (a)(1) through (11) of this section, along with the applicable wage determination(s), and a clause requiring subcontractors to include these clauses and wage determination(s) in any lower-tier subcontracts. The prime contractor is responsible for compliance by any subcontractor or lower-tier subcontractor with all the contract clauses in this section.
(d) Incorporation of contract clauses and wage determinations by reference. Although agencies are required to insert the contract clauses set forth in this section, along with appropriate wage determinations, in full into covered contracts, and contractors and subcontractors are required to insert them in any lower-tier subcontracts, incorporation by reference of the required contract clauses and appropriate wage determinations will be given the same force and effect as if they were inserted in full text.`;

const FAR_52_222_6_TEXT = `52.222-6 Construction Wage Rate Requirements.
Construction Wage Rate Requirements (Mar 2026)
(b)(1) All laborers and mechanics employed or working upon the site of the work will be paid not less than the rates contained in the wage determination of the Secretary of Labor which is attached hereto and made a part hereof, or as may be incorporated for a secondary site of the work.
(b)(3) Such laborers and mechanics shall be paid not less than the appropriate wage rate and fringe benefits in the wage determination for the classification of work actually performed.
(c)(1) The Contracting Officer shall require that any class of laborers or mechanics which is not listed in the wage determination and which is to be employed under the contract shall be classified in conformance with the wage determination. The Contracting Officer shall approve an additional classification and wage rate and fringe benefits only when the work is not performed by a listed classification, the classification is utilized in the area by the construction industry, and the proposed rate bears a reasonable relationship to the wage rates contained in the wage determination.`;

const SAM_WAGE_DETERMINATIONS_TEXT = `SAM.gov Wage Determinations
A wage determination (WD) is a set of wages, fringe benefits, and work rules that the U.S. Department of Labor has ruled to be prevailing for a given labor category in a given locality.
Users may search by wage determination number or start by selecting a category. Public Buildings or Works identifies wage rates for laborers and mechanics under the Davis-Bacon Act. Service Contracts identifies wage rates for service employees under the Service Contract Act.`;

const NIST_SP_800_171_R3_TEXT = `NIST SP 800-171 Revision 3 — Protecting Controlled Unclassified Information in Nonfederal Systems and Organizations
Date Published: May 2024
This publication provides federal agencies with recommended security requirements for protecting the confidentiality of Controlled Unclassified Information when the information is resident in nonfederal systems and organizations.
The requirements apply to components of nonfederal systems that process, store, or transmit CUI or that provide protection for such components. The security requirements are intended for use by federal agencies in contractual vehicles or other agreements established between those agencies and nonfederal organizations.`;

const ECFR_32_PART_170_TEXT = `32 CFR Part 170 — Cybersecurity Maturity Model Certification Program
§ 170.23 Application to subcontractors.
(a) CMMC requirements apply to prime contractors and subcontractors throughout the supply chain at all tiers that will process, store, or transmit any FCI or CUI on contractor information systems in the performance of the DoD contract or subcontract.
Prime contractors shall require subcontractors to comply with and flow down CMMC requirements throughout the supply chain at all tiers with the applicable CMMC level and assessment type for each subcontract.
(1) If a subcontractor will only process, store, or transmit FCI and not CUI, a CMMC Status of Level 1 (Self) is required.
(2) If a subcontractor will process, store, or transmit CUI, a CMMC Status of Level 2 (Self) is the minimum requirement.
(3) If a subcontractor will process, store, or transmit CUI and the associated prime contract requires Level 2 (C3PAO), Level 2 (C3PAO) is the minimum requirement for the subcontractor.
(4) If a subcontractor will process, store, or transmit CUI and the associated prime contract requires Level 3 (DIBCAC), Level 2 (C3PAO) is the minimum requirement for the subcontractor.
(b) DoD may provide specific guidance pertaining to flow-down.`;

const CUI_REGISTRY_TEXT = `Controlled Unclassified Information Registry
The CUI Registry is the Government-wide online repository for Federal-level guidance regarding CUI policy and practice. Agency personnel and contractors should first consult their agency's CUI implementing policies and program management for guidance.
The Registry provides CUI categories, markings and controls. Category detail records identify a category description, category marking, and safeguarding or dissemination authority.
Agencies are responsible for marking or identifying CUI shared with non-federal entities. Questions regarding the status of marked or unmarked information should be directed to the government contracting activity. Contractors should not follow CUI program requirements or markings until directed to do so in a contract or agreement.`;

export const APPROVED_SUPPLEMENTAL_SOURCE_EXCERPT_FIXTURES = {
  "ecfr-29-part-3": createApprovedSnapshot(
    "ecfr-29-part-3",
    ECFR_29_PART_3_TEXT,
    ["§ 3.3 Certified payrolls", "within seven days after the regular payment date"],
    1
  ),
  "ecfr-29-part-4": createApprovedSnapshot(
    "ecfr-29-part-4",
    ECFR_29_PART_4_TEXT,
    ["Principal purpose", "through the use of service employees"],
    2
  ),
  "ecfr-29-part-5": createApprovedSnapshot(
    "ecfr-29-part-5",
    ECFR_29_PART_5_TEXT,
    ["along with the applicable wage determination(s)", "lower-tier subcontracts"],
    3
  ),
  "far-52-222-6": createApprovedSnapshot(
    "far-52-222-6",
    FAR_52_222_6_TEXT,
    ["wage determination of the Secretary of Labor", "classified in conformance"],
    4
  ),
  "sam-wage-determinations": createApprovedSnapshot(
    "sam-wage-determinations",
    SAM_WAGE_DETERMINATIONS_TEXT,
    ["given labor category in a given locality", "Public Buildings or Works"],
    5
  ),
  "nist-sp-800-171-r3": createApprovedSnapshot(
    "nist-sp-800-171-r3",
    NIST_SP_800_171_R3_TEXT,
    ["Date Published: May 2024", "process, store, or transmit CUI"],
    6
  ),
  "ecfr-32-part-170": createApprovedSnapshot(
    "ecfr-32-part-170",
    ECFR_32_PART_170_TEXT,
    ["§ 170.23 Application to subcontractors", "applicable CMMC level and assessment type"],
    7
  ),
  "cui-registry": createApprovedSnapshot(
    "cui-registry",
    CUI_REGISTRY_TEXT,
    ["Government-wide online repository", "government contracting activity"],
    8
  ),
};
