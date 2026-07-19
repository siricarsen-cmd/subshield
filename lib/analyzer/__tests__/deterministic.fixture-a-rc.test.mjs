// Focused deterministic recall/ranking regressions for confirmed Fixture A
// release-candidate defects. Run directly with Node 24.
import { runDeterministicDetectors } from "../deterministic.ts";
import {
  MISSING_DOCUMENTS_CLAUSE,
  FUTURE_FLOWDOWN_CLAUSE,
  COMPETING_NOTICE_CLAUSES_DOCUMENT,
  ORDINARY_THIRTY_DAY_FUNDING_NOTICE_CLAUSE,
  IMMEDIATE_TERMINATION_NO_CURE_CLAUSE,
  IMMEDIATE_TERMINATION_NO_OPPORTUNITY_VARIANT,
  PROTECTIVE_REASONABLE_CURE_CLAUSE,
  CONTINUED_PERFORMANCE_CLAUSE,
  FIXTURE_A_TARGETED_DOCUMENT,
} from "../__fixtures__/fixture-a-rc-clauses.mjs";

let failures = 0;

function check(label, condition) {
  if (condition) console.log(`PASS: ${label}`);
  else {
    console.error(`FAIL: ${label}`);
    failures++;
  }
}

function find(documentText, regulation) {
  return runDeterministicDetectors(documentText).find((finding) => finding.regulation === regulation);
}

const MISSING_DOCUMENTS = "Missing / Deferred Contract Documents";
const FUTURE_FLOWDOWNS = "Broad Future Flowdowns / Prime Contract Control";
const NOTICE_WAIVER = "Short Notice-of-Claim / Change Notice Waiver";
const CURE = "Short Default Cure Period / Termination Discretion";
const CONTINUE_PERFORMANCE = "Continue-Performance Obligation During Payment Dispute";

{
  const finding = find(MISSING_DOCUMENTS_CLAUSE, MISSING_DOCUMENTS);
  check("A1. explicit missing/deferred SOW, matrix, and Prime excerpts trigger", Boolean(finding));
  check("A2. missing-documents quote is grounded", Boolean(finding && MISSING_DOCUMENTS_CLAUSE.includes(finding.foundText)));
  check("A3. document silence alone never triggers missing documents", !find("The parties executed this subcontract.", MISSING_DOCUMENTS));
}

{
  const findings = runDeterministicDetectors(`${MISSING_DOCUMENTS_CLAUSE}\n\n${FUTURE_FLOWDOWN_CLAUSE}`);
  const missing = findings.find((finding) => finding.regulation === MISSING_DOCUMENTS);
  const future = findings.find((finding) => finding.regulation === FUTURE_FLOWDOWNS);
  check("B1. additional/revised flowdowns binding upon notice trigger", Boolean(future));
  check("B2. missing documents and future flowdowns remain separate findings", Boolean(missing && future && missing !== future));
  check("B3. future-flowdown quote is grounded in its own clause", Boolean(future && FUTURE_FLOWDOWN_CLAUSE.includes(future.foundText)));
}

{
  const finding = find(COMPETING_NOTICE_CLAUSES_DOCUMENT, NOTICE_WAIVER);
  check("C1. notice-waiver finding is produced", Boolean(finding));
  check("C2. three-day/five-day complete waiver wins over funding notice", Boolean(finding && finding.foundText.includes("three calendar days") && finding.foundText.includes("five calendar days") && finding.foundText.includes("complete waiver")));
  check("D. ordinary 30-day funding notification is not promoted", !find(ORDINARY_THIRTY_DAY_FUNDING_NOTICE_CLAUSE, NOTICE_WAIVER));
}

for (const [label, clause] of [
  ["E1. without any right to cure / if Prime determines triggers", IMMEDIATE_TERMINATION_NO_CURE_CLAUSE],
  ["E2. without an opportunity to cure / if the Prime determines triggers", IMMEDIATE_TERMINATION_NO_OPPORTUNITY_VARIANT],
]) {
  check(label, Boolean(find(clause, CURE)));
}
check("F. protective reasonable cure clause does not false-positive", !find(PROTECTIVE_REASONABLE_CURE_CLAUSE, CURE));

{
  const finding = find(CONTINUED_PERFORMANCE_CLAUSE, CONTINUE_PERFORMANCE);
  check("G1. leading pending-final-resolution continued-performance clause triggers", Boolean(finding));
  check("G2. selected quote includes the self-financing consequence", Boolean(finding && finding.foundText.includes("finance continued performance at its own cost")));
}

const targetRegulations = [MISSING_DOCUMENTS, FUTURE_FLOWDOWNS, NOTICE_WAIVER, CURE, CONTINUE_PERFORMANCE];
const baseline = runDeterministicDetectors(FIXTURE_A_TARGETED_DOCUMENT)
  .filter((finding) => targetRegulations.includes(finding.regulation))
  .map((finding) => finding.regulation)
  .sort();
const whitespaceVariants = [
  FIXTURE_A_TARGETED_DOCUMENT.replace(/ /g, "  "),
  FIXTURE_A_TARGETED_DOCUMENT.replace(/, /g, ",\n").replace(/\. /g, ".\n"),
  FIXTURE_A_TARGETED_DOCUMENT.replace(/\n\n/g, "\n \n"),
];
for (const [index, variant] of whitespaceVariants.entries()) {
  const actual = runDeterministicDetectors(variant)
    .filter((finding) => targetRegulations.includes(finding.regulation))
    .map((finding) => finding.regulation)
    .sort();
  check(`K${index + 1}. whitespace/newline variant preserves targeted deterministic findings`, JSON.stringify(actual) === JSON.stringify(baseline));
}
check("K4. baseline contains every targeted finding", baseline.length === targetRegulations.length);

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log("\nAll Fixture A deterministic regression checks passed.");

