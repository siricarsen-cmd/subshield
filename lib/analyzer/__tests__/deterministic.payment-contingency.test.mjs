// Dependency-free regression check for the payment-contingency detection gap
// fixed on fix/analyzer-regression-parity. No test runner is configured in
// this repo, so this is a plain script with manual asserts, not a jest/vitest
// suite - run directly with `node lib/analyzer/__tests__/deterministic.payment-contingency.test.mjs`
// (Node 24 strips TS types natively when importing deterministic.ts; no build
// step or new dependency needed).
//
// Plain .mjs (not .mts) on purpose: see payment-contingency-clauses.mjs for
// why - tsc's project-wide "**/*.mts" include + moduleResolution "bundler"
// rejects the explicit ".ts" import specifier below (TS5097) unless
// allowImportingTsExtensions is enabled, which we're avoiding. A plain .mjs
// file is outside tsc's include globs entirely, so it never reaches that
// check, while still being able to import and exercise the real
// lib/analyzer/deterministic.ts source at runtime.
import { runDeterministicDetectors } from "../deterministic.ts";
import {
  PAYMENT_CONTINGENCY_CLAUSE,
  PAYMENT_CONTINGENCY_CLAUSE_NOT_RECEIVED_VARIANT,
} from "../__fixtures__/payment-contingency-clauses.mjs";

let failures = 0;

function check(label, condition) {
  if (condition) {
    console.log(`PASS: ${label}`);
  } else {
    console.error(`FAIL: ${label}`);
    failures++;
  }
}

function findPaymentContingency(documentText) {
  const findings = runDeterministicDetectors(documentText);
  return findings.find(
    (f) => f.familyKey === "payment" && f.regulation === "Pay-if-Paid / Contingent Government-Payment Clause"
  );
}

// Case 1: the exact known-risk clause language (the "will pay ... within N
// days after ... receives ... payment from the Government" / mirror /
// "not paid by the Government" phrasing that was previously undetected).
{
  const finding = findPaymentContingency(PAYMENT_CONTINGENCY_CLAUSE);
  check("finds a payment-contingency finding in the known-risk clause", Boolean(finding));
  check("finding is High severity", finding?.severity === "High");
  check("finding familyKey is 'payment'", finding?.familyKey === "payment");
  check(
    "foundText is an exact verbatim substring of the document (grounding preserved)",
    Boolean(finding && PAYMENT_CONTINGENCY_CLAUSE.includes(finding.foundText))
  );
}

// Case 2: the pre-existing "not received from the Government" phrasing must
// still be detected - the broadened pattern must not have regressed the
// original 7/7 case it was extending.
{
  const finding = findPaymentContingency(PAYMENT_CONTINGENCY_CLAUSE_NOT_RECEIVED_VARIANT);
  check("still finds the pre-existing 'not received' phrasing", Boolean(finding));
  check(
    "'not received' variant foundText is an exact verbatim substring",
    Boolean(finding && PAYMENT_CONTINGENCY_CLAUSE_NOT_RECEIVED_VARIANT.includes(finding.foundText))
  );
}

// Case 3: a clean document with no payment-contingency language must not
// produce a false positive (deterministic patterns must stay grounded).
{
  const cleanText =
    "Prime Contractor will pay Subcontractor within 30 calendar days of receipt of a valid invoice, regardless of the status of Prime Contractor's payment from the Government.";
  const finding = findPaymentContingency(cleanText);
  check("does not flag a document with no contingent-payment language", !finding);
}

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
} else {
  console.log("\nAll payment-contingency regression checks passed.");
}
