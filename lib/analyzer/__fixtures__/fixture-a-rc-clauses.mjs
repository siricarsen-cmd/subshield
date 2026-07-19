// Focused release-candidate fixtures for the controlled Fixture A parity QA.
// These are intentionally small clause-level inputs so each regression can
// prove one deterministic recall or false-positive boundary without calling
// the model. Plain .mjs keeps the fixtures outside the TypeScript project.

export const MISSING_DOCUMENTS_CLAUSE =
  "1.3 The Statement of Work, flowdown matrix, and relevant Prime Contract excerpts are not attached at execution. Prime will provide those materials after execution or when Prime determines they are needed.";

export const FUTURE_FLOWDOWN_CLAUSE =
  "6.3 Prime may incorporate additional or revised flowdown requirements by email, portal posting, task order update, or other written notice. Such requirements become binding upon notice, whether or not Subcontractor has received the complete Prime Contract or a flowdown matrix.";

export const WEAKER_FUNDING_NOTICE_WAIVER_CLAUSE =
  "Subcontractor shall provide at least thirty days advance notice if it expects funded value to be exhausted. Failure to provide timely notice waives any claim for costs incurred after the funded value is exhausted.";

export const STRONG_SHORT_NOTICE_WAIVER_CLAUSE =
  "Subcontractor must provide written notice to Prime within three calendar days after any event that may affect cost, schedule, staffing, scope, quality, or performance. Complete substantiation must be delivered within five calendar days after the initial notice. Failure to provide either the three-day notice or the five-day substantiation constitutes a complete waiver of any request for equitable adjustment, claim, delay relief, schedule extension, or additional compensation.";

export const COMPETING_NOTICE_CLAUSES_DOCUMENT = `
${WEAKER_FUNDING_NOTICE_WAIVER_CLAUSE}

${STRONG_SHORT_NOTICE_WAIVER_CLAUSE}
`.trim();

export const ORDINARY_THIRTY_DAY_FUNDING_NOTICE_CLAUSE =
  "Subcontractor shall provide at least 30 days advance notice if it expects funded value to be exhausted so the parties can plan an orderly funding update.";

export const IMMEDIATE_TERMINATION_NO_CURE_CLAUSE =
  "Prime may terminate immediately, without any right to cure, if Prime determines that continued performance may threaten customer relations, schedule, compliance, reputation, or mission needs.";

export const IMMEDIATE_TERMINATION_NO_OPPORTUNITY_VARIANT =
  "Prime Contractor may terminate immediately without an opportunity to cure if the Prime determines that continued performance threatens compliance.";

export const PROTECTIVE_REASONABLE_CURE_CLAUSE =
  "Prime may terminate for default only after written notice and a reasonable opportunity to cure, and may not terminate immediately without providing that cure opportunity.";

export const CONTINUED_PERFORMANCE_CLAUSE =
  "Pending final resolution of any dispute, claim, payment issue, interpretation question, or request for adjustment, Subcontractor shall diligently continue performance in accordance with Prime's direction. Subcontractor shall finance continued performance at its own cost even if Prime withholds disputed amounts or the Government has not paid Prime.";

export const GENERIC_IP_INDEMNITY_CLAUSE =
  "Subcontractor shall indemnify, defend, and hold harmless Prime from third-party claims. The obligations in this section apply to claims involving intellectual property, confidentiality, data, privacy, or security.";

export const GENUINE_DATA_RIGHTS_CLAUSES = [
  "All work product and deliverables prepared under this Subcontract shall be owned by Prime Contractor.",
  "Subcontractor grants Prime and the Government a perpetual, royalty-free license to use the software deliverables.",
  "The Government receives unlimited rights in technical data first produced under this Subcontract.",
  "Subcontractor retains pre-existing IP only if it is identified in writing before performance.",
  "Technical data delivered with restricted rights must be marked with the required legend.",
];

export const FIXTURE_A_TARGETED_DOCUMENT = `
${MISSING_DOCUMENTS_CLAUSE}

${FUTURE_FLOWDOWN_CLAUSE}

${COMPETING_NOTICE_CLAUSES_DOCUMENT}

${IMMEDIATE_TERMINATION_NO_CURE_CLAUSE}

${CONTINUED_PERFORMANCE_CLAUSE}
`.trim();

export const ANCHOR_FIXTURE = `
SUBCONTRACT SUMMARY
Ceiling Amount: $850,000
The maximum aggregate value of this Subcontract shall not exceed $850,000.
This is not an incrementally funded subcontract and it contains no numerical funding limit.
`.trim();

export const LONG_PROFESSIONAL_SECTOR_SENTENCE =
  "The parties agree that this subcontract establishes detailed conditions and operational procedures governing the commercial terms under which Subcontractor shall provide professional services and administrative support.";

