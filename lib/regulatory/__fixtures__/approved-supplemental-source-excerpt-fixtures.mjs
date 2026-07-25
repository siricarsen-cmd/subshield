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
      "Controlled benchmark snapshot containing verbatim selected paragraphs from the approved official source; it is not a complete page snapshot.",
    ],
    reviewStatus: "pending",
  };

  return reviewRegulatorySnapshot(pending, {
    decision: "approved",
    reviewedBy: "SubShield regulatory reviewer",
    reviewedAt: `2026-07-25T23:${String(index).padStart(2, "0")}:00.000Z`,
    reviewNotes: [
      "Compared each retained paragraph to the approved official source and verified that no paraphrase was substituted.",
      "Approved for benchmark-only citation-package regression testing; production use still requires full live retrieval and persisted review.",
    ],
    requiredTextAnchors,
    verifiedVersionIdentifier: pending.versionIdentifier,
    verifiedEffectiveDate: pending.effectiveDate,
  });
}

const ECFR_29_PART_3_TEXT = `29 CFR Part 3 — Contractors and Subcontractors on Public Building or Public Work Financed in Whole or in Part by Loans or Grants from the United States
§ 3.3 Certified payrolls.
(b) Each contractor or subcontractor engaged in the construction, prosecution, completion, or repair of any public building or public work, or building or work financed in whole or in part by loans or grants from the United States, each week must provide a copy of its weekly payroll for all laborers and mechanics engaged on work covered by this part and part 5 of this chapter during the preceding weekly payroll period, accompanied by a statement of compliance certifying the accuracy of the weekly payroll information.
This statement must be executed by the contractor or subcontractor or by an authorized officer or employee of the contractor or subcontractor who supervises the payment of wages, and must be on the back of Form WH-347, “Payroll (For Contractors Optional Use)” or on any form with identical wording.
§ 3.4 Submission of certified payroll and the preservation and inspection of weekly payroll records.
(a) Certified payroll.
Each certified payroll required under § 3.3 must be delivered by the contractor or subcontractor, within 7 days after the regular payment date of the payroll period, to a representative at the site of the building or work of the agency contracting for or financing the work, or, if there is no representative of the agency at the site of the building or work, the statement must be delivered by mail or by any other means normally assuring delivery by the contractor or subcontractor, within that 7 day time period, to the agency contracting for or financing the building or work.`;

const ECFR_29_PART_4_TEXT = `29 CFR Part 4 — Labor Standards for Federal Service Contracts
§ 4.111 Contracts “to furnish services.”
(a) “Principal purpose” as criterion. Under its terms, the Act applies to a “contract * * * the principal purpose of which is to furnish services * * *.” If the principal purpose is to provide something other than services of the character contemplated by the Act and any such services which may be performed are only incidental to the performance of a contract for another purpose, the Act does not apply.
However, as will be seen by examining the illustrative examples of covered contracts in §§ 4.130 et seq., no hard and fast rule can be laid down as to the precise meaning of the term principal purpose. This remedial Act is intended to be applied to a wide variety of contracts, and the Act does not define or limit the types of services which may be contracted for under a contract the principal purpose of which is to furnish services.
Further, the nomenclature, type, or particular form of contract used by procurement agencies is not determinative of coverage. Whether the principal purpose of a particular contract is the furnishing of services through the use of service employees is largely a question to be determined on the basis of all the facts in each particular case.
§ 4.113 Contracts to furnish services “through the use of service employees.”
(a) Use of “service employees” in a contract performance.
(1) As indicated in § 4.110, the Act covers service contracts only where “service employees” will be used in performing the services which it is the purpose of the contract to procure. A contract principally for services ordinarily will meet this condition if any of the services will be furnished through the use of any service employee or employees.
Where it is contemplated that the services (of the kind performed by service employees) will be performed individually by the contractor, and the contracting officer knows when advertising for bids or concluding negotiations that service employees will in no event be used by the contractor in providing the contract services, the Act will not be deemed applicable to the contract and the contract clauses required by § 4.6 or § 4.7 may be omitted.
§ 4.130 Types of covered service contracts illustrated.
(a) The types of contracts, the principal purpose of which is to furnish services through the use of service employees, are too numerous and varied to permit an exhaustive listing. The following list is illustrative, however, of the types of services called for by such contracts that have been found to come within the coverage of the Act. Other examples of covered contracts are discussed in other sections of this subpart.
(12) Custodial, janitorial, and housekeeping services.
(38) Operation, maintenance, or logistic support of a Federal facility.
(45) Support services at military installations.`;

const ECFR_29_PART_5_TEXT = `29 CFR Part 5 — Labor Standards Provisions Applicable to Federal Contracts
§ 5.5 Contract provisions and related matters.
(a)(6) Subcontracts. The contractor or subcontractor must insert in any subcontracts the clauses contained in paragraphs (a)(1) through (11) of this section, along with the applicable wage determination(s) and such other clauses or contract modifications as the [write in the name of the Federal agency] may by appropriate instructions require, and a clause requiring the subcontractors to include these clauses and wage determination(s) in any lower tier subcontracts.
The prime contractor is responsible for the compliance by any subcontractor or lower tier subcontractor with all the contract clauses in this section. In the event of any violations of these clauses, the prime contractor and any subcontractor(s) responsible will be liable for any unpaid wages and monetary relief, including interest from the date of the underpayment or loss, due to any workers of lower-tier subcontractors, and may be subject to debarment, as appropriate.
(d) Incorporation of contract clauses and wage determinations by reference.
Although agencies are required to insert the contract clauses set forth in this section, along with appropriate wage determinations, in full into covered contracts, and contractors and subcontractors are required to insert them in any lower-tier subcontracts, the incorporation by reference of the required contract clauses and appropriate wage determinations will be given the same force and effect as if they were inserted in full text.`;

const FAR_52_222_6_TEXT = `52.222-6 Construction Wage Rate Requirements.
Construction Wage Rate Requirements (Aug 2018)
(b)(1) All laborers and mechanics employed or working upon the site of the work will be paid unconditionally and not less often than once a week, and without subsequent deduction or rebate on any account (except such payroll deductions as are permitted by regulations issued by the Secretary of Labor under the Copeland Act (29 CFR Part 3)), the full amount of wages and bona fide fringe benefits (or cash equivalents thereof) due at time of payment computed at rates not less than those contained in the wage determination of the Secretary of Labor which is attached hereto and made a part hereof, or as may be incorporated for a secondary site of the work, regardless of any contractual relationship which may be alleged to exist between the Contractor and such laborers and mechanics. Any wage determination incorporated for a secondary site of the work shall be effective from the first day on which work under the contract was performed at that site and shall be incorporated without any adjustment in contract price or estimated cost. Laborers employed by the construction Contractor or construction subcontractor that are transporting portions of the building or work between the secondary site of the work and the primary site of the work shall be paid in accordance with the wage determination applicable to the primary site of the work.
(b)(3) Such laborers and mechanics shall be paid not less than the appropriate wage rate and fringe benefits in the wage determination for the classification of work actually performed, without regard to skill, except as provided in the clause entitled Apprentices and Trainees. Laborers or mechanics performing work in more than one classification may be compensated at the rate specified for each classification for the time actually worked therein; provided that the employer’s payroll records accurately set forth the time spent in each classification in which work is performed.
(c)(1) The Contracting Officer shall require that any class of laborers or mechanics which is not listed in the wage determination and which is to be employed under the contract shall be classified in conformance with the wage determination. The Contracting Officer shall approve an additional classification and wage rate and fringe benefits therefor only when all the following criteria have been met:
(i) The work to be performed by the classification requested is not performed by a classification in the wage determination.
(ii) The classification is utilized in the area by the construction industry.
(iii) The proposed wage rate, including any bona fide fringe benefits, bears a reasonable relationship to the wage rates contained in the wage determination.`;

const SAM_WAGE_DETERMINATIONS_TEXT = `Wage Determinations
A wage determination (WD) is a set of wages, fringe benefits, and work rules that the U.S. Department of Labor has ruled to be prevailing for a given labor category in a given locality.
Help me find a wage determination
I know the WD number
Search by WD Number
I do not know the number
Start your search by selecting a category
Public Buildings or Works
Wages rates for laborers and mechanics
Davis-Bacon Act (DBA)
Service Contracts
Wage rates for service employees
Service Contract Act (SCA)`;

const NIST_SP_800_171_R3_TEXT = `NIST SP 800-171 Rev. 3
Protecting Controlled Unclassified Information in Nonfederal Systems and Organizations
Date Published: May 2024
Abstract
The protection of Controlled Unclassified Information (CUI) is of paramount importance to federal agencies and can directly impact the ability of the Federal Government to successfully conduct its essential missions and functions. This publication provides federal agencies with recommended security requirements for protecting the confidentiality of CUI when the information is resident in nonfederal systems and organizations.
The requirements apply to components of nonfederal systems that process, store, or transmit CUI or that provide protection for such components. The security requirements are intended for use by federal agencies in contractual vehicles or other agreements established between those agencies and nonfederal organizations.
This publication can be used in conjunction with its companion publication, NIST Special Publication 800-171A, which provides a comprehensive set of procedures to assess the security requirements.`;

const ECFR_32_PART_170_TEXT = `32 CFR Part 170 — Cybersecurity Maturity Model Certification (CMMC) Program
§ 170.23 Application to subcontractors.
(a) CMMC requirements apply to prime contractors and subcontractors throughout the supply chain at all tiers that will process, store, or transmit any FCI or CUI on contractor information systems in the performance of the DoD contract or subcontract.
Prime contractors shall comply and shall require subcontractors to comply with and to flow down CMMC requirements, such that compliance will be required throughout the supply chain at all tiers with the applicable CMMC level and assessment type for each subcontract as follows:
(1) If a subcontractor will only process, store, or transmit FCI (and not CUI) in performance of the subcontract, then a CMMC Status of Level 1 (Self) is required for the subcontractor.
(2) If a subcontractor will process, store, or transmit CUI in performance of the subcontract, then a CMMC Status of Level 2 (Self) is the minimum requirement for the subcontractor.
(3) If a subcontractor will process, store, or transmit CUI in performance of the subcontract and the associated prime contract has a requirement for a CMMC Status of Level 2 (C3PAO), then the CMMC Status of Level 2 (C3PAO) is the minimum requirement for the subcontractor.
(4) If a subcontractor will process, store, or transmit CUI in performance of the subcontract and the associated prime contract has a requirement for the CMMC Status of Level 3 (DIBCAC), then the CMMC Status of Level 2 (C3PAO) is the minimum requirement for the subcontractor.
(b) As with any solicitation or contract, the DoD may provide specific guidance pertaining to flow-down.`;

const CUI_REGISTRY_TEXT = `Controlled Unclassified Information (CUI)
Established by Executive Order 13556, the Controlled Unclassified Information (CUI) program standardizes the way the executive branch handles unclassified information that requires safeguarding or dissemination controls pursuant to and consistent with law, Federal regulations, and Government-wide policies.
CUI Registry
The CUI Registry is the Government-wide online repository for Federal-level guidance regarding CUI policy and practice. However, agency personnel and contractors should first consult their agency's CUI implementing policies and program management for guidance.
Categories, Markings and Controls:
CUI Registry
CUI Markings
Limited Dissemination Controls
Decontrol
Registry Change Log`;

export const APPROVED_SUPPLEMENTAL_SOURCE_EXCERPT_FIXTURES = {
  "ecfr-29-part-3": createApprovedSnapshot(
    "ecfr-29-part-3",
    ECFR_29_PART_3_TEXT,
    ["§ 3.3 Certified payrolls", "within 7 days after the regular payment date"],
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
    ["Government-wide online repository", "agency personnel and contractors should first consult"],
    8
  ),
};