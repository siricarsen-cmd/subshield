// Regression check for the finding-local false-positive guards added to
// sanity.ts's violatesContradictionGuard on
// fix/analyzer-false-positive-guards (ordinary invoice timing, bare
// prime-contract identifier, protective entire-agreement clause, and the
// LLM long-cure companion guard). Each guard decides suppression using only
// the individual finding's own verified foundText (never documentText, and
// never riskAnalysis) - this file proves that a harmless finding is
// suppressed while a real, distinct finding survives independently, even
// when both exist in the same document and are verified together in one
// verifyFindings() call.
//
// No test runner is configured in this repo, so this is a plain script
// with manual asserts. Does not call OpenAI or require an API key - every
// finding here is either the real deterministic detector's output or a
// hand-built mock Finding object, same pattern as report.ranking.test.mjs.
//
// sanity.ts has value imports (`from "./text"`, `from "./deterministic"`)
// that Node's native TS stripping does not resolve on its own - run with
// the loader registered, same as report.ranking.test.mjs:
//
//   node --experimental-loader ./lib/analyzer/__tests__/ts-relative-import.loader.mjs lib/analyzer/__tests__/sanity.finding-local-guards.test.mjs
import { runDeterministicDetectors } from "../deterministic.ts";
import { verifyFindings } from "../sanity.ts";
import {
  ORDINARY_NET20_CLAUSE,
  ORDINARY_NET30_CLAUSE,
  ORDINARY_NET45_CLAUSE,
  NET20_WITH_SEPARATE_CONTINGENCY_DOC,
  NET20_WITH_INLINE_CONTINGENCY_CLAUSE,
  NET20_WITH_RECEIPT_OF_FUNDS_CONTINGENCY_CLAUSE,
  NET20_WITH_RECEIPT_OF_MONIES_CONTINGENCY_CLAUSE,
  BARE_PRIME_CONTRACT_NUMBER_CLAUSE,
  INCORPORATION_BY_REFERENCE_CLAUSE,
  PROTECTIVE_ENTIRE_AGREEMENT_CLAUSE,
  MISSING_FLOWDOWN_MATRIX_CLAUSE,
  PROTECTIVE_ENTIRE_AGREEMENT_WITH_FUTURE_SOW_CLAUSE,
  CURE_30_DAY_DILIGENT_EXTENSION_CLAUSE,
  CURE_5_DAY_CLAUSE,
  CURE_30_DAY_NO_OPPORTUNITY_TO_CURE_CLAUSE,
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

function mkFinding(overrides) {
  return {
    triggerType: "Contract Risk Trigger",
    regulation: "Placeholder Regulation",
    severity: "Medium",
    foundText: "Placeholder found text.",
    riskAnalysis: "Placeholder risk analysis.",
    redlineFix: "Placeholder redline fix.",
    familyKey: "payment",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// A. Ordinary invoice timing guard
// ---------------------------------------------------------------------------
{
  const net20Finding = mkFinding({
    familyKey: "payment",
    regulation: "Ordinary Invoice Timing",
    foundText: ORDINARY_NET20_CLAUSE,
  });
  const { verified, dropped } = verifyFindings([net20Finding], ORDINARY_NET20_CLAUSE);
  check("A1. ordinary Net-20 finding is suppressed", verified.length === 0 && dropped.length === 1);
}
{
  const net30Finding = mkFinding({
    familyKey: "payment",
    regulation: "Ordinary Invoice Timing",
    foundText: ORDINARY_NET30_CLAUSE,
  });
  const { verified, dropped } = verifyFindings([net30Finding], ORDINARY_NET30_CLAUSE);
  check("A2. ordinary Net-30 finding is suppressed", verified.length === 0 && dropped.length === 1);
}
{
  const net45Finding = mkFinding({
    familyKey: "payment",
    regulation: "Ordinary Invoice Timing",
    foundText: ORDINARY_NET45_CLAUSE,
  });
  const { verified, dropped } = verifyFindings([net45Finding], ORDINARY_NET45_CLAUSE);
  check(
    "A3. Net-45 finding is NOT suppressed by the ordinary-timing guard",
    verified.length === 1 && dropped.length === 0
  );
}
{
  // Harmless Net-20 and a separate true Government-payment contingency
  // finding, verified together against the same document - only the Net-20
  // finding should be dropped.
  const net20Finding = mkFinding({
    familyKey: "payment",
    regulation: "Ordinary Invoice Timing",
    foundText: "Prime Contractor will pay each correct invoice within 20 calendar days after receipt.",
  });
  const contingencyFinding = runDeterministicDetectors(NET20_WITH_SEPARATE_CONTINGENCY_DOC).find(
    (f) => f.familyKey === "payment" && f.regulation === "Pay-if-Paid / Contingent Government-Payment Clause"
  );
  check("A4. deterministic detector finds the separate contingency clause", Boolean(contingencyFinding));
  const { verified, dropped } = verifyFindings(
    [net20Finding, contingencyFinding],
    NET20_WITH_SEPARATE_CONTINGENCY_DOC
  );
  check(
    "A5. harmless Net-20 dropped, separate true contingency finding survives",
    verified.length === 1 &&
      verified[0].regulation === "Pay-if-Paid / Contingent Government-Payment Clause" &&
      dropped.length === 1 &&
      dropped[0].finding.regulation === "Ordinary Invoice Timing"
  );
}
{
  // Ordinary timing AND actual contingency language in the SAME quote must
  // survive - the guard must not suppress based on the timing phrase alone.
  const inlineFinding = mkFinding({
    familyKey: "payment",
    regulation: "Ordinary Invoice Timing",
    foundText: NET20_WITH_INLINE_CONTINGENCY_CLAUSE,
  });
  const { verified, dropped } = verifyFindings([inlineFinding], NET20_WITH_INLINE_CONTINGENCY_CLAUSE);
  check(
    "A6. quote with ordinary timing plus inline contingency evidence survives",
    verified.length === 1 && dropped.length === 0
  );
}
{
  // "receipt of funds from the Government" - same contingency risk as A6,
  // phrased with a different noun than the literal word "payment".
  const receiptOfFundsFinding = mkFinding({
    familyKey: "payment",
    regulation: "Ordinary Invoice Timing",
    foundText: NET20_WITH_RECEIPT_OF_FUNDS_CONTINGENCY_CLAUSE,
  });
  const { verified, dropped } = verifyFindings(
    [receiptOfFundsFinding],
    NET20_WITH_RECEIPT_OF_FUNDS_CONTINGENCY_CLAUSE
  );
  check(
    "A7. 'receipt of funds from the Government' contingency quote survives",
    verified.length === 1 && dropped.length === 0
  );
}
{
  const receiptOfMoniesFinding = mkFinding({
    familyKey: "payment",
    regulation: "Ordinary Invoice Timing",
    foundText: NET20_WITH_RECEIPT_OF_MONIES_CONTINGENCY_CLAUSE,
  });
  const { verified, dropped } = verifyFindings(
    [receiptOfMoniesFinding],
    NET20_WITH_RECEIPT_OF_MONIES_CONTINGENCY_CLAUSE
  );
  check(
    "A8. 'receipt of monies from the Government' contingency quote survives",
    verified.length === 1 && dropped.length === 0
  );
}

// ---------------------------------------------------------------------------
// B. Bare prime-contract identifier guard
// ---------------------------------------------------------------------------
{
  const bareIdFinding = mkFinding({
    familyKey: "structure",
    regulation: "Contract Structure & Missing Documents",
    foundText: BARE_PRIME_CONTRACT_NUMBER_CLAUSE,
  });
  const { verified, dropped } = verifyFindings([bareIdFinding], BARE_PRIME_CONTRACT_NUMBER_CLAUSE);
  check("B1. bare prime-contract-number finding is suppressed", verified.length === 0 && dropped.length === 1);
}
{
  const incorporationFinding = mkFinding({
    familyKey: "structure",
    regulation: "Contract Structure & Missing Documents",
    foundText: INCORPORATION_BY_REFERENCE_CLAUSE,
  });
  const { verified, dropped } = verifyFindings([incorporationFinding], INCORPORATION_BY_REFERENCE_CLAUSE);
  check("B2. real incorporation-by-reference finding survives", verified.length === 1 && dropped.length === 0);
}

// ---------------------------------------------------------------------------
// C. Protective entire-agreement guard
// ---------------------------------------------------------------------------
{
  const entireAgreementFinding = mkFinding({
    familyKey: "structure",
    regulation: "Contract Structure & Missing Documents",
    foundText: PROTECTIVE_ENTIRE_AGREEMENT_CLAUSE,
  });
  const { verified, dropped } = verifyFindings([entireAgreementFinding], PROTECTIVE_ENTIRE_AGREEMENT_CLAUSE);
  check("C1. protective entire-agreement finding is suppressed", verified.length === 0 && dropped.length === 1);
}
{
  const missingDocFinding = mkFinding({
    familyKey: "structure",
    regulation: "Contract Structure & Missing Documents",
    foundText: MISSING_FLOWDOWN_MATRIX_CLAUSE,
  });
  const { verified, dropped } = verifyFindings([missingDocFinding], MISSING_FLOWDOWN_MATRIX_CLAUSE);
  check("C2. actual missing-flowdown-matrix finding survives", verified.length === 1 && dropped.length === 0);
}
{
  // Protective entire-agreement language AND a real "SOW will be provided
  // later" statement in the SAME quote - the real missing-document evidence
  // must not be masked by the protective-clause guard.
  const futureSowFinding = mkFinding({
    familyKey: "structure",
    regulation: "Contract Structure & Missing Documents",
    foundText: PROTECTIVE_ENTIRE_AGREEMENT_WITH_FUTURE_SOW_CLAUSE,
  });
  const { verified, dropped } = verifyFindings(
    [futureSowFinding],
    PROTECTIVE_ENTIRE_AGREEMENT_WITH_FUTURE_SOW_CLAUSE
  );
  check(
    "C3. protective clause plus 'SOW will be provided later' in the same quote survives",
    verified.length === 1 && dropped.length === 0
  );
}

// ---------------------------------------------------------------------------
// D. LLM long-cure companion guard
// ---------------------------------------------------------------------------
{
  const llmLongCureFinding = mkFinding({
    familyKey: "liability",
    regulation: "Short Default Cure Period / Termination Discretion",
    foundText: CURE_30_DAY_DILIGENT_EXTENSION_CLAUSE,
  });
  const { verified, dropped } = verifyFindings([llmLongCureFinding], CURE_30_DAY_DILIGENT_EXTENSION_CLAUSE);
  check("D1. simulated LLM 30-day short-cure finding is suppressed", verified.length === 0 && dropped.length === 1);
}
{
  const llmShortCureFinding = mkFinding({
    familyKey: "liability",
    regulation: "Short Default Cure Period / Termination Discretion",
    foundText: CURE_5_DAY_CLAUSE,
  });
  const { verified, dropped } = verifyFindings([llmShortCureFinding], CURE_5_DAY_CLAUSE);
  check("D2. simulated LLM 5-day short-cure finding survives", verified.length === 1 && dropped.length === 0);
}
{
  // A cure period longer than SHORT_CURE_MAX_DAYS paired with "no genuine
  // opportunity to cure" language - must survive the long-cure guard even
  // though the phrasing isn't the literal "terminate...immediately"/
  // "without further notice"/"sole discretion" forms.
  const llmNoOpportunityFinding = mkFinding({
    familyKey: "liability",
    regulation: "Short Default Cure Period / Termination Discretion",
    foundText: CURE_30_DAY_NO_OPPORTUNITY_TO_CURE_CLAUSE,
  });
  const { verified, dropped } = verifyFindings(
    [llmNoOpportunityFinding],
    CURE_30_DAY_NO_OPPORTUNITY_TO_CURE_CLAUSE
  );
  check(
    "D3. simulated LLM 30-day cure with 'without any opportunity to cure' survives",
    verified.length === 1 && dropped.length === 0
  );
}

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
} else {
  console.log("\nAll finding-local guard regression checks passed.");
}
