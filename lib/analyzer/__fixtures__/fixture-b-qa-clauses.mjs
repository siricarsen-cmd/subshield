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

export const FIXTURE_B_BALANCED_DOCUMENT = `
BALANCED FIRM-FIXED-PRICE SUBCONTRACT

Total Firm-Fixed Price: $420,000

Included Attachments: Exhibit A Statement of Work; Exhibit B Pricing Schedule; Exhibit C Flowdown Matrix

All referenced exhibits are attached at execution.

${FIXTURE_B_ACCEPTANCE_BLOCK}

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
