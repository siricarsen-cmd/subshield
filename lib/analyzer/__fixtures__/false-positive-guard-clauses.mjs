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
