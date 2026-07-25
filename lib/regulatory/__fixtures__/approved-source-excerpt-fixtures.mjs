import { createHash } from "node:crypto";

import { reviewRegulatorySnapshot } from "../source-review.ts";
import { getRegulatorySource } from "../source-catalog.ts";

function sha256(value) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function createApprovedSnapshot(sourceId, text, requiredTextAnchors, index) {
  const source = getRegulatorySource(sourceId);
  if (!source) throw new Error(`Unknown source fixture ID: ${sourceId}`);
  const retrievedAt = `2026-07-25T20:${String(index).padStart(2, "0")}:00.000Z`;
  const checksum = sha256(text);
  const pending = {
    snapshotId: `${sourceId}:2026072520${String(index).padStart(2, "0")}:${checksum.slice(-12)}`,
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
      "Controlled test excerpt transcribed from the approved official source for clause-level citation regression coverage.",
    ],
    reviewStatus: "pending",
  };

  return reviewRegulatorySnapshot(pending, {
    decision: "approved",
    reviewedBy: "SubShield regulatory reviewer",
    reviewedAt: `2026-07-25T21:${String(index).padStart(2, "0")}:00.000Z`,
    reviewNotes: [
      "Verified the clause identity, source relationship, and exact retained excerpt against the approved official page.",
      "Approved for deterministic citation-package regression testing only.",
    ],
    requiredTextAnchors,
    verifiedVersionIdentifier: pending.versionIdentifier,
    verifiedEffectiveDate: pending.effectiveDate,
  });
}

const FAR_52_222_8_TEXT = `52.222-8 Payrolls and Basic Records.
Payrolls and Basic Records (Jul 2021)
(2) Each payroll submitted shall be accompanied by a "Statement of Compliance," signed by the Contractor or subcontractor or his or her agent who pays or supervises the payment of the persons employed under the contract and shall certify-
(i) That the payroll for the payroll period contains the information required to be maintained under paragraph (a) of this clause and that such information is correct and complete;
(ii) That each laborer or mechanic (including each helper, apprentice, and trainee) employed on the contract during the payroll period has been paid the full weekly wages earned, without rebate, either directly or indirectly, and that no deductions have been made either directly or indirectly from the full wages earned, other than permissible deductions as set forth in the Regulations, 29 CFR Part 3; and
(iii) That each laborer or mechanic has been paid not less than the applicable wage rates and fringe benefits or cash equivalents for the classification of work performed, as specified in the applicable wage determination incorporated into the contract.
(3) The weekly submission of a properly executed certification set forth on the reverse side of Optional Form WH-347 shall satisfy the requirement for submission of the "Statement of Compliance" required by paragraph (b)(2) of this clause.`;

const FAR_52_222_41_TEXT = `52.222-41 Service Contract Labor Standards.
Service Contract Labor Standards (Aug 2018)
(b) Applicability. This contract is subject to the following provisions and to all other applicable provisions of 41 U.S.C. chapter 67, Service Contract Labor Standards, and regulations of the Secretary of Labor (29 CFR Part 4). This clause does not apply to contracts or subcontracts administratively exempted by the Secretary of Labor or exempted by 41 U.S.C. 6702, as interpreted in Subpart C of 29 CFR Part 4.
(c)(1) Each service employee employed in the performance of this contract by the Contractor or any subcontractor shall be paid not less than the minimum monetary wages and shall be furnished fringe benefits in accordance with the wages and fringe benefits determined by the Secretary of Labor, or authorized representative, as specified in any wage determination attached to this contract.
(l) Subcontracts. The Contractor agrees to insert this clause in all subcontracts subject to the Service Contract Labor Standards statute.`;

const DFARS_CURRENT_7002_TEXT = `252.204-7002 Payment for Contract Line or Subline Items Not Separately Priced.
Payment for Contract Line or Subline Items Not Separately Priced (Apr 2020)
(a) If the schedule in this contract contains any contract line or subline items identified as not separately priced (NSP), it means that the unit price for the NSP line or subline item is included in the unit price of another, related line or subline item.
(b) The Contractor shall not invoice the Government for an item that includes in its price an NSP item until—
(1) The Contractor has also delivered the NSP item included in the price of the item being invoiced; and
(2) The Government has accepted the NSP item.
(c) This clause does not apply to technical data.`;

const DFARS_252_204_7012_TEXT = `252.204-7012 Safeguarding Covered Defense Information and Cyber Incident Reporting.
Safeguarding Covered Defense Information and Cyber Incident Reporting (May 2024)
“Rapidly report” means within 72 hours of discovery of any cyber incident.
(c) Cyber incident reporting requirement.
(1) When the Contractor discovers a cyber incident that affects a covered contractor information system or the covered defense information residing therein, or that affects the contractor's ability to perform the requirements of the contract that are designated as operationally critical support and identified in the contract, the Contractor shall—
(ii) Rapidly report cyber incidents to DoD at https://dibnet.dod.mil.
(e) Media preservation and protection. When a Contractor discovers a cyber incident has occurred, the Contractor shall preserve and protect images of all known affected information systems identified in paragraph (c)(1)(i) of this clause and all relevant monitoring/packet capture data for at least 90 days from the submission of the cyber incident report to allow DoD to request the media or decline interest.
(m) Subcontracts. The Contractor shall—
(1) Include this clause, including this paragraph (m), in subcontracts, or similar contractual instruments, for operationally critical support, or for which subcontract performance will involve covered defense information, including subcontracts for commercial products or commercial services, without alteration, except to identify the parties.`;

const DFARS_252_204_7019_TEXT = `252.204-7019 Notice of NIST SP 800-171 DoD Assessment Requirements.
Notice of NIST SP 800-171 DoD Assessment Requirements (Nov 2023)
(b) Requirement. In order to be considered for award, if the Offeror is required to implement NIST SP 800-171, the Offeror shall have a current assessment (i.e., not more than 3 years old unless a lesser time is specified in the solicitation) for each covered contractor information system that is relevant to the offer, contract, task order, or delivery order.
(c)(1) The Offeror shall verify that summary level scores of a current NIST SP 800-171 DoD Assessment are posted in the Supplier Performance Risk System (SPRS) for all covered contractor information systems relevant to the offer.
(d)(1)(i)(E) Summary level score (e.g., 95 out of 110, NOT the individual value for each requirement).
(F) Date that all requirements are expected to be implemented (i.e., a score of 110 is expected to be achieved) based on information gathered from associated plan(s) of action developed in accordance with NIST SP 800-171.`;

const DFARS_252_204_7020_TEXT = `252.204-7020 NIST SP 800-171 DoD Assessment Requirements.
NIST SP 800-171 DoD Assessment Requirements (Nov 2023)
(b) Applicability. This clause applies to covered contractor information systems that are required to comply with National Institute of Standards and Technology (NIST) Special Publication (SP) 800-171, in accordance with Defense Federal Acquisition Regulation Supplement (DFARS) clause at 252.204-7012, Safeguarding Covered Defense Information and Cyber Incident Reporting, of this contract.
(c) Requirements. The Contractor shall provide access to its facilities, systems, and personnel necessary for the Government to conduct a Medium or High NIST SP 800-171 DoD Assessment, as described in the NIST SP 800-171 DoD Assessment Methodology, if necessary.
(d)(1)(i)(E) Summary level score (e.g., 95 out of 110, NOT the individual value for each requirement).
(F) Date that all requirements are expected to be implemented (i.e., a score of 110 is expected to be achieved) based on information gathered from associated plan(s) of action developed in accordance with NIST SP 800-171.`;

const DFARS_252_204_7021_TEXT = `252.204-7021 Contractor Compliance With the Cybersecurity Maturity Model Certification Level Requirements.
Contractor Compliance With the Cybersecurity Maturity Model Certification Level Requirements (Nov 2025)
(d) Requirements. The Contractor shall—
(1)(i) Have and maintain for the duration of the contract a current CMMC status at the following CMMC level, or higher: ____________ [Contracting Officer insert: CMMC Level 1 (Self); CMMC Level 2 (Self); CMMC Level 2 (C3PAO); or CMMC Level 3 (DIBCAC)] for all information systems used in performance of the contract, task order, or delivery order that process, store, or transmit FCI or CUI; and
(ii) Consult 32 CFR 170.23 related to the flowdown of the CMMC requirements, and flow down the correct CMMC level to subcontracts and other contractual instruments;
(f) Subcontracts. The Contractor shall—
(1) Insert the substance of this clause, including this paragraph (f) and excluding paragraph (e)(1), in subcontracts and other contractual instruments, including those for the acquisition of commercial products and commercial services, excluding commercially available off-the-shelf items, if the subcontract or other contractual instrument will contain a requirement to process, store, or transmit FCI or CUI; and
(2) Prior to awarding a subcontract or other contractual instrument, ensure that the subcontractor has a current CMMC certificate or current CMMC status at the CMMC level that is appropriate for the information that is being flowed down to the subcontractor based on the requirements at 32 CFR 170.23.`;

const DFARS_252_204_7025_TEXT = `252.204-7025 Notice of Cybersecurity Maturity Model Certification Level Requirements.
Notice of Cybersecurity Maturity Model Certification Level Requirements (Nov 2025)
(b)(1) Cybersecurity Maturity Model Certification (CMMC) level. The CMMC level required by this solicitation is: ____________ Contracting Officer insert: CMMC Level 1 (Self); CMMC Level 2 (Self); CMMC Level 2 (C3PAO); or CMMC Level 3 (DIBCAC).
This CMMC level, or higher (see 32 CFR part 170), is required prior to award for each contractor information system that will process, store, or transmit Federal contract information (FCI) or controlled unclassified information (CUI) during performance of the contract.
(2) The Offeror will not be eligible for award of a contract, task order, or delivery order resulting from this solicitation if the Offeror does not have, for each of the contractor information systems that will process, store, or transmit FCI or CUI and that will be used in performance of a contract resulting from this solicitation—
(i) The current CMMC status entered in the Supplier Performance Risk System (SPRS) at the CMMC level required by paragraph (b)(1) of this provision; and
(ii) A current affirmation of continuous compliance with the security requirements identified at 32 CFR part 170 in SPRS.`;

export const APPROVED_SOURCE_EXCERPT_FIXTURES = {
  "far-52-222-8": createApprovedSnapshot(
    "far-52-222-8",
    FAR_52_222_8_TEXT,
    ["52.222-8 Payrolls and Basic Records", "Optional Form WH-347"],
    1
  ),
  "far-52-222-41": createApprovedSnapshot(
    "far-52-222-41",
    FAR_52_222_41_TEXT,
    ["52.222-41 Service Contract Labor Standards", "(l) Subcontracts"],
    2
  ),
  "dfars-current": createApprovedSnapshot(
    "dfars-current",
    DFARS_CURRENT_7002_TEXT,
    ["252.204-7002 Payment for Contract Line or Subline Items Not Separately Priced", "NSP item"],
    3
  ),
  "dfars-252-204-7012": createApprovedSnapshot(
    "dfars-252-204-7012",
    DFARS_252_204_7012_TEXT,
    ["Rapidly report", "at least 90 days", "(m) Subcontracts"],
    4
  ),
  "dfars-252-204-7019": createApprovedSnapshot(
    "dfars-252-204-7019",
    DFARS_252_204_7019_TEXT,
    ["current assessment", "95 out of 110", "score of 110 is expected to be achieved"],
    5
  ),
  "dfars-252-204-7020": createApprovedSnapshot(
    "dfars-252-204-7020",
    DFARS_252_204_7020_TEXT,
    ["(b) Applicability", "provide access to its facilities, systems, and personnel"],
    6
  ),
  "dfars-252-204-7021": createApprovedSnapshot(
    "dfars-252-204-7021",
    DFARS_252_204_7021_TEXT,
    ["current CMMC status", "flow down the correct CMMC level", "(f) Subcontracts"],
    7
  ),
  "dfars-252-204-7025": createApprovedSnapshot(
    "dfars-252-204-7025",
    DFARS_252_204_7025_TEXT,
    ["The CMMC level required by this solicitation", "required prior to award"],
    8
  ),
};
