// Focused Fixture B regression inputs from controlled production QA. The
// balanced document is intentionally self-contained so deterministic and
// finding-local guards can be tested without a model call or live QA credit.

export const VERIFIED_MATERIAL_NONCONFORMITY_CLAUSE =
  "Subcontractor shall correct a verified material nonconformity at no additional charge.";

export const ACTUAL_MATERIAL_DEFECT_CLAUSE =
  "Subcontractor shall correct an actual material defect at its own cost.";

export const ORIGINAL_REQUIREMENT_LIMIT_CLAUSE =
  "Subcontractor shall correct a material nonconformity at no additional charge. Correction is limited to bringing the work into conformity with the originally agreed requirement.";

export const SUBCONTRACTOR_RESPONSIBILITY_LIMIT_CLAUSE =
  "Subcontractor shall correct defects attributable to Subcontractor at no additional cost.";

export const FIXTURE_B_ACCEPTANCE_BLOCK = `
4.1 Prime shall inspect each deliverable within ten business days after delivery. A deliverable is deemed accepted if Prime does not provide a written, specific notice of nonconformity within that period.

4.2 ${VERIFIED_MATERIAL_NONCONFORMITY_CLAUSE} Rework is limited to bringing the deliverable into conformity with the requirement that existed when the work was performed.

4.3 Prime may not reject work based solely on a later-added requirement, a preference not stated in Exhibit A, or a Government request that changes the agreed scope.
`.trim();

export const BALANCED_MUTUAL_LIABILITY_CAP_CLAUSE =
  "Except for fraud, willful misconduct, confidentiality breach, or third-party indemnity, each party's aggregate liability is limited to the total amount paid or payable under this Subcontract. Neither party is liable for consequential or punitive damages.";

export const FIXTURE_B_LIABILITY_BLOCK = `
8.1 Each party shall indemnify the other from third-party claims to the extent caused by the indemnifying party's negligence, willful misconduct, or breach of law.

8.2 The party seeking indemnity shall provide prompt notice and reasonable cooperation. The indemnifying party controls the defense, subject to the other party's right to participate at its own expense.

8.3 ${BALANCED_MUTUAL_LIABILITY_CAP_CLAUSE}

8.4 Insurance requirements and fixed limits are stated in Exhibit C and may not be increased without a bilateral modification and any appropriate price adjustment.
`.trim();

export const PROTECTIVE_TERMINATION_FOR_CONVENIENCE_CLAUSE =
  "Prime may terminate for convenience on thirty calendar days written notice. Prime shall pay accepted work, reasonable work in process, noncancelable commitments, and reasonable demobilization and settlement costs, subject to the total Subcontract price.";

export const PROTECTIVE_SIXTY_DAY_TERMINATION_CLAUSE =
  "Prime may terminate for convenience on sixty calendar days written notice. Prime shall pay completed work, reasonable work in process, noncancelable commitments, demobilization, and settlement costs.";

export const FIXTURE_B_TERMINATION_BLOCK = `
10.1 Either party may terminate for material breach if the breaching party does not cure within ten business days after detailed written notice. If the breach reasonably requires more time, cure is timely if begun within ten business days and diligently completed.

10.2 ${PROTECTIVE_TERMINATION_FOR_CONVENIENCE_CLAUSE}

10.3 Subcontractor may suspend affected work after fifteen days written notice if Prime fails to pay an undisputed amount when due and does not cure during the notice period.
`.trim();

export const BALANCED_MUTUAL_LIABILITY_CAP_VARIANTS = [
  "Each party's total liability is limited to the total Contract price. Neither party shall be liable for consequential damages.",
  "Except for fraud and willful misconduct, the aggregate liability of each party shall not exceed amounts paid or payable under this Agreement.",
  "The parties mutually waive consequential and punitive damages, and each party's aggregate liability is capped at the Subcontract value.",
];

export const REAL_LIABILITY_CLAUSES = [
  "Prime's liability to Subcontractor shall not exceed $100,000. Subcontractor's liability is unlimited.",
  "Prime's total liability is limited to amounts actually received from the Government.",
  "Prime shall not be liable for consequential damages. Subcontractor remains liable for all consequential damages.",
  "Subcontractor's confidentiality, cyber, intellectual-property, warranty, and indemnity obligations are uncapped.",
  "Except for claims against Prime, each party's liability is capped. All claims against Subcontractor are uncapped.",
  "Each party's aggregate liability is limited to the total Contract price, except that the cap does not apply to Subcontractor's indemnity, confidentiality, cyber, data, intellectual-property, or warranty obligations.",
];

export const REAL_TERMINATION_FOR_CONVENIENCE_CLAUSES = [
  "Prime may terminate for convenience upon five calendar days written notice. In that event, Subcontractor's recovery is limited to accepted work performed through the termination date, less retainage, backcharges, and other amounts Prime claims are owed.",
  "Prime may terminate for convenience on five calendar days notice and is not liable for unabsorbed overhead, demobilization, security investments, unused licenses, or profit on unperformed work.",
  "Prime may terminate for convenience on five calendar days notice. Recovery is limited to accepted work incorporated into the project before termination, less retainage, backcharges, and other offsets.",
  "Prime may terminate for convenience at any time without notice and without further liability.",
  "Prime may terminate for convenience on thirty days notice. Recovery is limited to accepted work.",
  "Prime may terminate for convenience on sixty days notice. Prime is not liable for work in process, noncancelable commitments, demobilization, or settlement costs.",
  "Prime may terminate for convenience on ten days notice. Prime shall pay completed work and reasonable demobilization costs.",
];

export const FIXTURE_B_BALANCED_DOCUMENT = `
BALANCED FIRM-FIXED-PRICE SUBCONTRACT

Total Firm-Fixed Price: $420,000

Included Attachments: Exhibit A Statement of Work; Exhibit B Pricing Schedule; Exhibit C Flowdown Matrix

All referenced exhibits are attached at execution.

Prime shall pay each correct invoice within thirty calendar days after receipt. Payment is not conditioned on Prime receiving payment from the Government.

${FIXTURE_B_ACCEPTANCE_BLOCK}

${FIXTURE_B_LIABILITY_BLOCK}

${FIXTURE_B_TERMINATION_BLOCK}

Exhibit C identifies each applicable clause, the reason for applicability, and any tailoring.

The Prime Contract is incorporated only to the extent a clause is expressly identified in Exhibit C. No future Prime Contract clause becomes binding unless the parties sign a bilateral modification.

Prime shall provide any amendment it proposes to flow down. Subcontractor may accept the amendment, propose an equitable adjustment, or reject work not covered by the existing agreement.
`.trim();

export const REAL_REWORK_CLAUSES = [
  "Subcontractor shall promptly correct, replace, or reperform rejected work at no additional cost.",
  "Prime may reject any work in its sole discretion and require Subcontractor to reperform it at no additional cost.",
  "Subcontractor shall correct rejected work regardless of cause and without additional compensation.",
  "Prime may require rework to comply with later-added requirements without a price adjustment.",
  "Subcontractor shall remove and replace nonconforming work, including all access, demolition, testing, restoration, and schedule-recovery work, at Subcontractor's own cost.",
  "Prime unilaterally determines a nonconformity and requires Subcontractor to correct it without additional compensation.",
  "Prime may require Subcontractor to rework deliverables caused by a Prime change without additional compensation.",
];

export const BENIGN_STRUCTURE_QUOTES = [
  "Exhibit C Flowdown Matrix",
  "Attachment B Cybersecurity Requirements",
  "Appendix 1 Statement of Work",
  "Schedule A Pricing",
  "Statement of Work",
  "SOW",
  "Prime Contract Excerpts",
  "Exhibit D Security Controls",
  "Included Attachments: Exhibit A Statement of Work; Exhibit B Pricing Schedule; Exhibit C Flowdown Matrix",
  "All referenced exhibits are attached at execution.",
  "Exhibit C identifies each applicable clause, the reason for applicability, and any tailoring.",
  "No future Prime Contract clause becomes binding unless the parties sign a bilateral modification.",
];

export const OPERATIVE_STRUCTURE_QUOTES = [
  "Exhibit C Flowdown Matrix is missing.",
  "Exhibit C Flowdown Matrix has been omitted from the package.",
  "Exhibit C Flowdown Matrix controls in the event of conflict.",
  "Exhibit C Flowdown Matrix governs all Prime Contract obligations.",
  "Exhibit C Flowdown Matrix takes precedence over this Subcontract.",
  "Exhibit C Flowdown Matrix may be modified unilaterally by Prime.",
  "Exhibit C Flowdown Matrix is incorporated regardless of whether it was supplied to Subcontractor.",
];

export const REAL_STRUCTURE_CLAUSES = {
  missingDocuments:
    "The Statement of Work and flowdown matrix are not attached at execution and will be provided after award.",
  incompleteFlowdowns: "Exhibit C Flowdown Matrix is incomplete and omits required FAR and DFARS clauses.",
  futureFlowdowns:
    "Prime may add revised flowdown requirements by written notice. The requirements become binding upon notice.",
  undisclosedPrimeContract:
    "The Prime Contract is incorporated by reference regardless of whether the document was supplied to Subcontractor.",
  missingCyberDocuments:
    "The SSP, CUI marking guide, network diagram, data-flow map, and cyber procedures are not attached.",
  missingWageDetermination: "The applicable wage determination is incorporated but is not attached.",
};
