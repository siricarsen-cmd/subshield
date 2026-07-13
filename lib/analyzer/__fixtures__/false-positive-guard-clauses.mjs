// Shared fixtures for the false-positive-guard regression tests added on
// fix/analyzer-false-positive-guards. Each export is the smallest text
// snippet that exercises exactly one guard/detector behavior described in
// the corresponding test file - see deterministic.cure-period.test.mjs,
// classify.sector-negation.test.mjs, and sanity.finding-local-guards.test.mjs.
//
// Plain .mjs (not .ts) on purpose, same reason as payment-contingency-clauses.mjs:
// tsconfig.json's "include" globs pick up **/*.ts and **/*.mts project-wide,
// and moduleResolution "bundler" rejects explicit ".ts" import specifiers
// (TS5097) unless allowImportingTsExtensions is enabled. Keeping fixtures as
// plain ESM JavaScript keeps them out of the tsc project entirely.

// --- Payment: ordinary invoice timing vs. real contingency -----------------

export const ORDINARY_NET20_CLAUSE =
  "Prime Contractor will pay each correct invoice within 20 calendar days after receipt.";

export const ORDINARY_NET30_CLAUSE =
  "Prime Contractor will pay each correct invoice within 30 calendar days after receipt.";

export const ORDINARY_NET45_CLAUSE =
  "Prime Contractor will pay each correct invoice within 45 calendar days after receipt.";

// A harmless Net-20 clause and a separate, true Government-payment
// contingency clause in the same document - only the Net-20 finding should
// be suppressed; the contingency finding must survive independently.
export const NET20_WITH_SEPARATE_CONTINGENCY_DOC = `
Section 6. Payment.

Prime Contractor will pay each correct invoice within 20 calendar days after receipt.

Section 7. Government Payment.

Prime Contractor will pay Subcontractor within 10 business days after Prime Contractor receives corresponding payment from the Government for Subcontractor's invoiced work.
`.trim();

// Ordinary timing AND actual contingency evidence inside the SAME quote -
// must survive (the guard must not suppress based on the timing phrase
// alone when real risk evidence is present in that same foundText).
export const NET20_WITH_INLINE_CONTINGENCY_CLAUSE =
  "Prime Contractor will pay each correct invoice within 20 calendar days after receipt, provided that Prime Contractor has first received corresponding payment from the Government.";

// "receipt of X from the Government" contingency phrasing, varying the noun
// (funds/monies) instead of the literal word "payment" - must survive, same
// reason as NET20_WITH_INLINE_CONTINGENCY_CLAUSE above.
export const NET20_WITH_RECEIPT_OF_FUNDS_CONTINGENCY_CLAUSE =
  "Prime Contractor will pay each correct invoice within 20 calendar days after receipt of funds from the Government.";

export const NET20_WITH_RECEIPT_OF_MONIES_CONTINGENCY_CLAUSE =
  "Prime Contractor will pay each correct invoice within 20 calendar days after receipt of monies from the Government.";

// --- Structure: bare identifier vs. real incorporation-by-reference --------

export const BARE_PRIME_CONTRACT_NUMBER_CLAUSE = "Prime Contract No. NPS-2027-114";

export const INCORPORATION_BY_REFERENCE_CLAUSE =
  "The terms of the Prime Contract, including Prime Contract No. NPS-2027-114, are incorporated herein by reference and shall control regardless of whether attached.";

// --- Liability: cure period duration ----------------------------------------

export const CURE_30_DAY_CLAUSE =
  "The receiving party has 30 calendar days to cure any default under this Subcontract.";

export const CURE_30_DAY_DILIGENT_EXTENSION_CLAUSE =
  "The receiving party has 30 calendar days to cure, or a longer reasonable period if cure has begun and is being pursued diligently.";

export const CURE_5_DAY_CLAUSE =
  "Subcontractor shall have 5 calendar days to cure any default under this Subcontract.";

export const CURE_10_DAY_CLAUSE =
  "Subcontractor shall have 10 calendar days to cure any default under this Subcontract.";

export const CURE_11_DAY_CLAUSE =
  "Subcontractor shall have 11 calendar days to cure any default under this Subcontract.";

export const IMMEDIATE_TERMINATION_NO_CURE_CLAUSE =
  "Prime Contractor may terminate this Subcontract for default immediately without further notice.";

// A cure period longer than SHORT_CURE_MAX_DAYS (10) paired with "no genuine
// opportunity to cure" language that isn't the literal "terminate...
// immediately"/"without further notice"/"sole discretion" phrasing already
// covered - must still survive the long-cure suppression guard.
export const CURE_30_DAY_NO_OPPORTUNITY_TO_CURE_CLAUSE =
  "Subcontractor shall have 30 calendar days to cure any default; however, Prime Contractor may terminate this Subcontract without any opportunity to cure if it determines the default is material.";

// --- Classification: construction exclusion vs. affirmative scope ----------

export const CONSTRUCTION_EXCLUSION_ONLY_DOC =
  "This Subcontract excludes construction, manufacturing, and trade work; Subcontractor's scope is limited to administrative support services.";

export const CONSTRUCTION_EXCLUSION_DO_NOT_INCLUDE_DOC =
  "The services do not include design, construction, or engineering activities.";

export const CONSTRUCTION_AFFIRMATIVE_DOC =
  "Subcontractor shall furnish all labor, materials, and equipment for construction of the facility addition, in accordance with Davis-Bacon wage requirements.";

export const CONSTRUCTION_EXCLUSION_THEN_AFFIRMATIVE_SEPARATE_SENTENCES_DOC =
  "This package excludes construction work. Under Task Order 2, Subcontractor shall perform HVAC installation and construction services.";

export const CONSTRUCTION_EXCLUSION_THEN_AFFIRMATIVE_SAME_SENTENCE_DOC =
  "Excluding general construction, Subcontractor shall perform electrical construction work under the SOW.";

export const CONSTRUCTION_REQUIRED_EXCLUDING_ABATEMENT_DOC =
  "Construction services are required, excluding hazardous-material abatement.";

// Compact scope-noun clause reset ("the scope covers...") after a fronted
// exclusion phrase, distinct from the named-party reset
// (CONSTRUCTION_EXCLUSION_THEN_AFFIRMATIVE_SAME_SENTENCE_DOC above) - the
// excluded "general construction" occurrence stays negated, but the later
// affirmative "HVAC installation" must still count.
export const CONSTRUCTION_EXCLUSION_RESET_SCOPE_COVERS_DOC =
  "Excluding general construction, the scope covers HVAC installation.";

// Control: a plain exclusion list with no clause reset anywhere - every
// sector keyword here stays negated, so this must NOT classify as
// Construction / Facility / Trade.
export const CONSTRUCTION_EXCLUSION_LIST_HVAC_DOC =
  "This Subcontract excludes construction, HVAC installation, and electrical work.";

// --- Structure: protective entire-agreement vs. real missing documents -----

export const PROTECTIVE_ENTIRE_AGREEMENT_CLAUSE =
  "This Agreement, together with any duly executed written amendments signed by both parties, constitutes the entire agreement between the parties.";

export const MISSING_FLOWDOWN_MATRIX_CLAUSE =
  "No current flowdown list/matrix is included in this package; later-issued flow-down requirements referenced in the Prime Contract are not currently attached.";

// Protective entire-agreement language PLUS an explicit statement that the
// Statement of Work will be provided later, in the same quote - must
// survive (the real missing-document evidence in this same quote must not
// be masked by the protective-clause guard).
export const PROTECTIVE_ENTIRE_AGREEMENT_WITH_FUTURE_SOW_CLAUSE =
  "This Agreement, together with any duly executed written amendments signed by both parties, constitutes the entire agreement between the parties; the Statement of Work will be provided later.";

// --- Liability: protective "no duty to defend" vs. real indemnity ---------

export const INDEMNITY_NO_DUTY_TO_DEFEND_CLAUSE =
  "Neither party has a duty to defend the other party, and neither party is liable for indirect, special, punitive, or consequential damages.";

export const INDEMNITY_PROTECTIVE_SHALL_HAVE_CLAUSE =
  "Neither party shall have any duty to defend the other.";

export const INDEMNITY_PROTECTIVE_NO_PARTY_CLAUSE =
  "No party has a duty to defend another party.";

export const INDEMNITY_PROTECTIVE_HAS_NO_CLAUSE =
  "Each party has no duty to defend the other.";

export const REAL_INDEMNITY_CLAUSE =
  "Subcontractor shall indemnify, defend, and hold harmless Prime Contractor from any and all claims.";

export const REAL_DUTY_TO_DEFEND_CLAUSE =
  "Subcontractor has a duty to defend Prime Contractor.";

export const REAL_DUTY_TO_DEFEND_AGAINST_THIRD_PARTY_CLAIMS_CLAUSE =
  "Subcontractor shall defend Prime Contractor against third-party claims.";

export const AGGRESSIVE_DUTY_TO_DEFEND_NOT_LIMITED_CLAUSE =
  "Notwithstanding anything herein, Subcontractor's duty to defend is not limited by insurance.";

// Protective "no duty to defend" and a separate, real indemnify/defend/
// hold-harmless clause in the same document - the deterministic detector
// must still find the real clause (the protective occurrence must not
// consume the category's one-finding slot).
export const INDEMNITY_PROTECTIVE_AND_REAL_COEXIST_DOC = `
Neither party has a duty to defend the other party.

Subcontractor shall indemnify, defend, and hold harmless Prime Contractor from any and all third-party claims arising from Subcontractor's performance.
`.trim();

// --- Liability: protective termination/cure prohibition vs. real risk -----

export const TERMINATION_PROHIBITED_WITHOUT_NOTICE_AND_CURE_CLAUSE =
  "Neither party may terminate for default without notice and a reasonable opportunity to cure.";

export const TERMINATION_PROHIBITED_WITHOUT_WRITTEN_NOTICE_CLAUSE =
  "Neither party may terminate without written notice and an opportunity to cure.";

export const TERMINATION_PROHIBITED_NO_PARTY_CLAUSE =
  "No party may terminate for default without notice.";

export const TERMINATION_PROHIBITED_MAY_NOT_CLAUSE =
  "A party may not terminate for default without notice and cure.";

export const TERMINATION_PROHIBITED_SHALL_NOT_CLAUSE =
  "A party shall not terminate without providing a reasonable opportunity to cure.";

export const REAL_TERMINATION_IMMEDIATE_NO_NOTICE_CLAUSE =
  "Prime Contractor may terminate immediately without notice.";

export const REAL_TERMINATION_SOLE_DISCRETION_CLAUSE =
  "Prime Contractor may terminate in its sole discretion.";

export const REAL_TERMINATION_SOLE_DISCRETION_FOR_DEFAULT_CLAUSE =
  "Prime Contractor may terminate this Subcontract for default in its sole discretion.";

export const REAL_TERMINATION_NO_RIGHT_TO_CURE_CLAUSE =
  "Prime Contractor may terminate without any right or opportunity to cure.";

// Protective prohibition AND a separate explicit exception granting Prime an
// immediate/no-notice termination right, in the SAME quote - must survive
// (the protective language alone doesn't cancel a real, explicitly-granted
// exception stated in that same quote).
export const TERMINATION_PROHIBITED_WITH_EXPLICIT_EXCEPTION_CLAUSE =
  "Neither party may terminate for default without notice and a reasonable opportunity to cure, except that Prime Contractor may terminate immediately without notice in the event of a security breach.";

// Protective prohibition and a separate, real immediate-termination clause
// in the same document - the deterministic detector must still find the
// real clause.
export const TERMINATION_PROHIBITED_AND_REAL_COEXIST_DOC = `
Neither party may terminate for default without notice and a reasonable opportunity to cure.

Prime Contractor may terminate this Subcontract for default immediately without further notice in the event of a material safety violation.
`.trim();

// --- Classification: "not responsible for" negative-scope list ------------

export const CONSTRUCTION_NOT_RESPONSIBLE_FOR_LIST_DOC =
  "Subcontractor is not responsible for field installation, facility repair, equipment fabrication, certified payroll, or accounting certification.";

export const CONSTRUCTION_EXCLUDES_AND_NOT_RESPONSIBLE_FOR_DOC = `
This Subcontract excludes construction, manufacturing, and trade work.

Subcontractor is not responsible for field installation, facility repair, equipment fabrication, certified payroll, or accounting certification.
`.trim();

// A protective payment-restriction list ("may not impose retainage,
// setoff, backcharge, or withholding...") mentions "retainage" only as
// something the Prime is barred from doing - must not count as affirmative
// construction evidence.
export const CONSTRUCTION_MAY_NOT_IMPOSE_RETAINAGE_CLAUSE =
  "Prime Contractor may not impose retainage, setoff, backcharge, or withholding unless the amount is supported by written documentation and Subcontractor is given a reasonable opportunity to respond.";

// A real, affirmative retainage clause - must still count.
export const CONSTRUCTION_AFFIRMATIVE_RETAINAGE_CLAUSE =
  "Prime Contractor will retain a 10 percent retainage from each progress payment until final acceptance of the work.";

// --- Classification: sector-evidence consistency ---------------------------

// A negated "excludes general construction" sentence followed by real
// affirmative HVAC/construction scope - sector evidence must be drawn from
// the affirmative sentence, not the negated one.
export const CONSTRUCTION_EXCLUDED_THEN_AFFIRMATIVE_EVIDENCE_DOC =
  "This Subcontract excludes general construction. Subcontractor shall perform HVAC installation and electrical construction under Task Order 2.";

// --- Complete clean Preview regression text --------------------------------

// Exact full clean-regression contract text tested in Vercel Preview (PR
// #15). Reproduced verbatim, not abbreviated, so regression tests exercise
// the real document shape - including sentences and sections that don't
// themselves relate to the false positives being guarded against (Sections
// 2's acceptance-window language, Section 6's convenience-style
// termination, Section 8's dispute-resolution language, etc.) - rather than
// only the specific clauses under test.
export const COMPLETE_CLEAN_PREVIEW_CONTRACT = `
CLEAN SUBCONTRACT REGRESSION AGREEMENT

Prime Contract No. NPS-2027-114

1. Scope of Work

Subcontractor will provide administrative scheduling, document organization, meeting coordination, and routine project-support services described in Exhibit A.

This Subcontract excludes construction, manufacturing, and trade work. Subcontractor is not responsible for field installation, facility repair, equipment fabrication, certified payroll, or accounting certification.

The work is firm-fixed-price. The total subcontract price is $48,000 for the complete scope stated in Exhibit A. No additional work may be required unless both parties sign a written bilateral amendment describing the added scope, schedule, and price.

2. Invoicing and Payment

Subcontractor may submit one correct invoice at the end of each calendar month for accepted services performed during that month.

Prime Contractor will pay each correct invoice within 20 calendar days after receipt.

Payment is not conditioned on Prime Contractor receiving payment from the Government or from any other party. Prime Contractor remains responsible for timely payment of all undisputed amounts owed to Subcontractor.

Prime Contractor may not impose retainage, setoff, backcharge, or withholding unless the amount is supported by written documentation and Subcontractor is given a reasonable opportunity to respond.

3. Acceptance

Prime Contractor will review each deliverable within 10 business days after receipt. A deliverable will be accepted unless Prime Contractor provides a written explanation identifying a specific failure to satisfy Exhibit A.

Subcontractor will have a reasonable opportunity to correct any confirmed deficiency. Prime Contractor may not reject work for reasons outside the agreed scope or require uncompensated additional work.

4. Changes

No change to scope, schedule, price, specifications, or performance requirements is effective unless stated in a written bilateral amendment signed by both parties.

Email requests, verbal directions, internal policies, future manuals, or later-issued prime-contract requirements do not modify this Subcontract unless incorporated through a signed bilateral amendment.

5. Default and Cure

Before terminating for default, the complaining party must provide written notice describing the specific default.

The receiving party has 30 calendar days to cure, or a longer reasonable period if cure has begun and is being pursued diligently.

Neither party may terminate for default without notice and a reasonable opportunity to cure.

6. Termination

Either party may terminate this Subcontract upon 30 calendar days' written notice. Prime Contractor must pay Subcontractor for all accepted work performed through the termination date and for authorized, noncancelable commitments reasonably incurred before notice.

7. Liability

Each party is responsible for its own negligent acts and omissions. Neither party has a duty to defend the other party, and neither party is liable for indirect, special, punitive, or consequential damages.

Any indemnification obligation is limited to third-party claims caused by the indemnifying party's negligence or willful misconduct.

8. Disputes

The parties will first attempt to resolve disputes through good-faith discussions between authorized representatives.

Neither party must continue disputed work unless the parties agree in writing on interim payment and performance terms.

9. Complete Agreement

This Agreement and Exhibit A contain the complete scope, price, schedule, and performance requirements agreed by the parties.

This Agreement, together with any duly executed written amendments signed by both parties, constitutes the entire agreement between the parties.

No unidentified, future, unattached, or automatically incorporated prime-contract terms apply to Subcontractor. Any later requirement must be added through a written bilateral amendment signed by both parties.

10. Signatures

Both parties acknowledge that they reviewed this Agreement and Exhibit A and agree that no other document controls the parties' obligations unless expressly identified in a signed bilateral amendment.
`.trim();

// Protective "no duty to defend" language AND a separate, explicit
// affirmative indemnity exception in the SAME quote - must survive (the
// real affirmative obligation must not be masked by the general protective
// rule stated earlier in the same sentence).
export const INDEMNITY_PROTECTIVE_WITH_AFFIRMATIVE_EXCEPTION_CLAUSE =
  "Neither party has a duty to defend the other party, except that Subcontractor shall indemnify, defend, and hold harmless Prime Contractor against third-party claims arising from Subcontractor's negligence.";
