// Regression check for the "Short Default Cure Period / Termination
// Discretion" deterministic detector fix on fix/analyzer-false-positive-guards.
// Proves the standalone "N days to cure" patterns are bounded to
// SHORT_CURE_MAX_DAYS (see deterministic.ts) so a commercially reasonable
// 30-day (or 11+ day) cure period no longer false-positives, while a true
// short cure period and any immediate-termination/no-notice/sole-discretion
// language remain detected regardless of day count.
//
// No test runner is configured in this repo - run directly with
// `node lib/analyzer/__tests__/deterministic.cure-period.test.mjs`
// (Node 24 strips TS types natively when importing deterministic.ts; its
// only relative import, `from "./types"`, is type-only and gets erased
// before Node ever tries to resolve it, so no loader is needed here - same
// as deterministic.payment-contingency.test.mjs).
import { runDeterministicDetectors } from "../deterministic.ts";
import {
  CURE_30_DAY_CLAUSE,
  CURE_30_DAY_DILIGENT_EXTENSION_CLAUSE,
  CURE_5_DAY_CLAUSE,
  CURE_10_DAY_CLAUSE,
  CURE_11_DAY_CLAUSE,
  IMMEDIATE_TERMINATION_NO_CURE_CLAUSE,
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

function findCureFinding(documentText) {
  const findings = runDeterministicDetectors(documentText);
  return findings.find(
    (f) => f.familyKey === "liability" && f.regulation === "Short Default Cure Period / Termination Discretion"
  );
}

check("30-day standalone cure does not trigger", !findCureFinding(CURE_30_DAY_CLAUSE));
check(
  "30-day cure with diligent-cure extension does not trigger",
  !findCureFinding(CURE_30_DAY_DILIGENT_EXTENSION_CLAUSE)
);
check("11-day cure does not trigger solely due to duration", !findCureFinding(CURE_11_DAY_CLAUSE));
check("5-day cure still triggers", Boolean(findCureFinding(CURE_5_DAY_CLAUSE)));
check("10-day cure still triggers", Boolean(findCureFinding(CURE_10_DAY_CLAUSE)));
check(
  "immediate termination without a stated cure period still triggers",
  Boolean(findCureFinding(IMMEDIATE_TERMINATION_NO_CURE_CLAUSE))
);
check(
  "termination without further notice remains detected",
  Boolean(findCureFinding("Prime Contractor may terminate this Subcontract for default without further notice."))
);

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
} else {
  console.log("\nAll cure-period regression checks passed.");
}
