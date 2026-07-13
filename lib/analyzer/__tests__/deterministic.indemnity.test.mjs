// Regression check for the "Broad Indemnification / Duty to Defend"
// protective-language fix on fix/analyzer-false-positive-guards. Proves the
// bare "duty to defend" pattern's negative lookbehind correctly excludes
// protective "neither/no party has (a)? duty to defend" / "has (have) no
// duty to defend" phrasings, while a real affirmative duty-to-defend clause,
// an aggressive clause containing an unrelated "not", and a real
// indemnify/hold-harmless clause elsewhere in the same document all still
// trigger.
//
// A separate, narrow file rather than folding into
// deterministic.cure-period.test.mjs since indemnification is an unrelated
// topic - same reasoning as keeping payment-contingency and cure-period
// checks in their own files.
//
// No test runner is configured in this repo - run directly with
// `node lib/analyzer/__tests__/deterministic.indemnity.test.mjs`
// (Node 24 strips TS types natively when importing deterministic.ts; its
// only relative import, `from "./types"`, is type-only and gets erased
// before Node ever tries to resolve it, so no loader is needed here - same
// as deterministic.payment-contingency.test.mjs and
// deterministic.cure-period.test.mjs).
import { runDeterministicDetectors } from "../deterministic.ts";
import {
  INDEMNITY_NO_DUTY_TO_DEFEND_CLAUSE,
  INDEMNITY_PROTECTIVE_SHALL_HAVE_CLAUSE,
  INDEMNITY_PROTECTIVE_NO_PARTY_CLAUSE,
  INDEMNITY_PROTECTIVE_HAS_NO_CLAUSE,
  REAL_INDEMNITY_CLAUSE,
  REAL_DUTY_TO_DEFEND_CLAUSE,
  AGGRESSIVE_DUTY_TO_DEFEND_NOT_LIMITED_CLAUSE,
  INDEMNITY_PROTECTIVE_AND_REAL_COEXIST_DOC,
  COMPLETE_CLEAN_PREVIEW_CONTRACT,
  INDEMNITY_PROTECTIVE_WITH_AFFIRMATIVE_EXCEPTION_CLAUSE,
} from "../__fixtures__/false-positive-guard-clauses.mjs";

let failures = 0;

function check(label, condition) {
  if (condition) {
    console.log(`PASS: ${label}`);
  } else {
    console.error(`FAIL: ${label}`);
    failures++;
  }
}

function findIndemnityFinding(documentText) {
  const findings = runDeterministicDetectors(documentText);
  return findings.find(
    (f) => f.familyKey === "liability" && f.regulation === "Broad Indemnification / Duty to Defend"
  );
}

// Protective phrasings must not trigger.
check(
  "'Neither party has a duty to defend the other party' does not trigger",
  !findIndemnityFinding(INDEMNITY_NO_DUTY_TO_DEFEND_CLAUSE)
);
check(
  "'Neither party shall have any duty to defend the other' does not trigger",
  !findIndemnityFinding(INDEMNITY_PROTECTIVE_SHALL_HAVE_CLAUSE)
);
check(
  "'No party has a duty to defend another party' does not trigger",
  !findIndemnityFinding(INDEMNITY_PROTECTIVE_NO_PARTY_CLAUSE)
);
check(
  "'Each party has no duty to defend the other' does not trigger",
  !findIndemnityFinding(INDEMNITY_PROTECTIVE_HAS_NO_CLAUSE)
);

// Real affirmative obligations must still trigger.
check(
  "real 'Subcontractor shall indemnify, defend, and hold harmless Prime Contractor' still triggers",
  Boolean(findIndemnityFinding(REAL_INDEMNITY_CLAUSE))
);
check(
  "real 'Subcontractor has a duty to defend Prime Contractor' still triggers",
  Boolean(findIndemnityFinding(REAL_DUTY_TO_DEFEND_CLAUSE))
);

// The lookbehind must not be overly broad: an aggressive clause with an
// unrelated "not" nowhere near "duty to defend" must still trigger.
check(
  "'Subcontractor's duty to defend is not limited by insurance' still triggers",
  Boolean(findIndemnityFinding(AGGRESSIVE_DUTY_TO_DEFEND_NOT_LIMITED_CLAUSE))
);

// Coexistence: a protective "no duty to defend" clause and a separate real
// indemnify/defend/hold-harmless clause in the same document - the real
// clause must still be found.
{
  const finding = findIndemnityFinding(INDEMNITY_PROTECTIVE_AND_REAL_COEXIST_DOC);
  check(
    "protective clause + separate real indemnity clause: real clause is found",
    Boolean(finding) && finding.foundText.toLowerCase().includes("indemnify")
  );
}

check(
  "complete clean Preview text produces no Broad Indemnification / Duty to Defend finding",
  !findIndemnityFinding(COMPLETE_CLEAN_PREVIEW_CONTRACT)
);

// Protective "no duty to defend" language AND a real affirmative indemnity
// exception in the SAME quote: the production detector supports this today
// via the pre-existing "indemnify[^.]{0,60}(?:and )?hold harmless" pattern,
// which matches "...shall indemnify, defend, and hold harmless Prime
// Contractor..." regardless of what precedes it in the same sentence - it
// does not require or depend on the new negative-lookbehind pattern at all.
// Since the combined quote has no internal sentence-ending period before
// the match, extractQuoteAroundMatch() returns the whole sentence
// (protective clause + exception together) as foundText, which is exactly
// what sanity.ts's new AFFIRMATIVE_INDEMNITY_EXCEPTION_RE counter-signal is
// designed to keep un-suppressed.
{
  const finding = findIndemnityFinding(INDEMNITY_PROTECTIVE_WITH_AFFIRMATIVE_EXCEPTION_CLAUSE);
  check(
    "protective clause + affirmative indemnity exception in the same quote: deterministic detector finds it",
    Boolean(finding) && finding.foundText.toLowerCase().includes("indemnify")
  );
}

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
} else {
  console.log("\nAll indemnity regression checks passed.");
}
