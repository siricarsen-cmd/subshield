// Report-level regression check for the payment-contingency ranking priority
// added on fix/analyzer-7-6-report-parity. Complements
// deterministic.payment-contingency.test.mjs, which only proves the
// deterministic detector *fires* - this proves the finding it produces
// actually *survives the report pipeline* (verifyFindings, dedupeFindings,
// rankFindings) and lands as primaryTraps[0] / Prime Pushback Memo bullet 1,
// even when severity and volume of competing findings would otherwise bury
// it. No test runner is configured in this repo, so this is a plain script
// with manual asserts. Does not call OpenAI or require an API key - every
// finding here is either the real deterministic detector's output or a
// hand-built mock Finding object.
//
// Unlike deterministic.payment-contingency.test.mjs, this file transitively
// imports report.ts's *value* imports (sanity.ts, detectors.ts, etc, not
// just a type-only import), and Node's native TS stripping does not resolve
// those files' extensionless relative specifiers (e.g. `from "./text"`) on
// its own - see ts-relative-import.loader.mjs in this directory for why and
// what it does about it. Run with the loader registered:
//
//   node --experimental-loader ./lib/analyzer/__tests__/ts-relative-import.loader.mjs lib/analyzer/__tests__/report.ranking.test.mjs
//
// Plain .mjs (not .mts) on purpose: see payment-contingency-clauses.mjs for
// why - tsc's project-wide "**/*.mts" include + moduleResolution "bundler"
// rejects the explicit ".ts" import specifier below (TS5097) unless
// allowImportingTsExtensions is enabled, which we're avoiding. A plain .mjs
// file is outside tsc's include globs entirely, so it never reaches that
// check, while still being able to import and exercise the real
// lib/analyzer/report.ts source at runtime (Node 24 strips TS types
// natively).
import { runDeterministicDetectors } from "../deterministic.ts";
import { verifyFindings } from "../sanity.ts";
import { rankFindings, dedupeFindings, buildPmMemo } from "../report.ts";
import { PAYMENT_CONTINGENCY_CLAUSE } from "../__fixtures__/payment-contingency-clauses.mjs";

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
    severity: "High",
    foundText: "Placeholder found text.",
    riskAnalysis: "Placeholder risk analysis.",
    redlineFix: "Placeholder redline fix.",
    familyKey: "liability",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// A. Detection: the existing payment fixture triggers a payment-contingency
// deterministic finding.
// ---------------------------------------------------------------------------
const allDeterministicFindings = runDeterministicDetectors(PAYMENT_CONTINGENCY_CLAUSE);
const detected = allDeterministicFindings.find(
  (f) => f.familyKey === "payment" && f.regulation === "Pay-if-Paid / Contingent Government-Payment Clause"
);
check("A. deterministic detector finds a payment-contingency finding", Boolean(detected));

// ---------------------------------------------------------------------------
// B. Quote verification: the finding survives verifyFindings against document
// text containing the literal clause.
// ---------------------------------------------------------------------------
const { verified: verifiedB, dropped: droppedB } = verifyFindings([detected], PAYMENT_CONTINGENCY_CLAUSE);
check(
  "B. payment-contingency finding survives verifyFindings",
  verifiedB.length === 1 && droppedB.length === 0
);

// ---------------------------------------------------------------------------
// C. Deduplication: an overlapping LLM-style equivalent payment finding
// (same evidence, non-canonical regulation label) is deduplicated, and the
// surviving finding is still recognized as payment-contingency even though
// its regulation label is not the canonical deterministic title - only its
// verified foundText carries the payment-dependency language.
// ---------------------------------------------------------------------------
const llmStylePaymentFinding = mkFinding({
  regulation: "Compensation Tied to Government Disbursement",
  severity: "High",
  foundText: detected.foundText,
  familyKey: "payment",
});
// llmStylePaymentFinding placed first so, on a length tie, dedupeFindings
// keeps *it* (the non-canonical label) as the survivor rather than the
// deterministic finding - this is the scenario the foundText fallback in
// isPaymentContingencyFinding exists for.
const dedupedC = dedupeFindings([llmStylePaymentFinding, detected]);
check("C1. overlapping LLM-style equivalent finding is deduplicated into one", dedupedC.length === 1);
const survivor = dedupedC[0];
check(
  "C2. surviving finding kept the non-canonical LLM regulation label",
  survivor.regulation === "Compensation Tied to Government Disbursement"
);

// ---------------------------------------------------------------------------
// D, F, G: build a realistic competing field of findings and prove:
//  D. payment contingency is primaryTraps[0] and survives the 6-item cap,
//     even though 6+ unrelated High findings precede it in input order.
//  F. unrelated same-severity findings otherwise keep their stable order.
//  G. payment-family findings that are NOT payment-contingency (setoff,
//     ordinary invoice timing) do not receive payment-contingency priority.
// ---------------------------------------------------------------------------
const indemnityFinding = mkFinding({
  familyKey: "liability",
  regulation: "Broad Indemnification / Duty to Defend",
  severity: "High",
  foundText: "Subcontractor shall indemnify and hold harmless Prime Contractor from any and all claims.",
});
const liabilityCapFinding = mkFinding({
  familyKey: "liability",
  regulation: "Prime-Only Liability Cap Tied to Government Payments Received",
  severity: "High",
  foundText: "Prime Contractor's total liability to Subcontractor shall be limited to amounts actually received from the Government.",
});
const cyberFinding = mkFinding({
  familyKey: "cyber",
  regulation: "DFARS 252.204-7012 / CUI / NIST SP 800-171 Cybersecurity Flowdown",
  severity: "High",
  foundText: "This subcontract is subject to DFARS 252.204-7012 and NIST SP 800-171 requirements.",
});
const dataRightsFinding = mkFinding({
  familyKey: "data-rights",
  regulation: "Broad Prime Ownership of Subcontractor Deliverables / Work Product",
  severity: "High",
  foundText: "All deliverables and technical data prepared under this Subcontract shall be owned by Prime Contractor.",
});
const cureFinding = mkFinding({
  familyKey: "liability",
  regulation: "Short Default Cure Period / Termination Discretion",
  severity: "High",
  foundText: "Prime Contractor may terminate this Subcontract for default immediately if Subcontractor fails to cure within 5 calendar days.",
});
const venueFinding = mkFinding({
  familyKey: "liability",
  regulation: "Out-of-State Venue, Governing Law, or Arbitration Burden",
  severity: "High",
  foundText: "This Subcontract shall be governed by the laws of the State of Virginia and disputes resolved through binding arbitration.",
});
const sixUnrelatedHighs = [
  indemnityFinding,
  liabilityCapFinding,
  cyberFinding,
  dataRightsFinding,
  cureFinding,
  venueFinding,
];

// G: payment-family, but NOT payment-contingency - must not receive priority.
const setoffFinding = mkFinding({
  familyKey: "payment",
  regulation: "Broad Setoff / Backcharge / Withholding Rights",
  severity: "High",
  foundText: "Prime Contractor may offset, deduct, or withhold any amounts it believes are owed to it from any payment otherwise due to Subcontractor.",
});
const invoiceTimingFinding = mkFinding({
  familyKey: "payment",
  regulation: "Ordinary Invoice Timing",
  severity: "High",
  foundText: "Prime Contractor will pay Subcontractor within 30 calendar days of receipt of a valid invoice.",
});

// Six unrelated Highs + two non-contingency payment-family Highs, all placed
// BEFORE the payment-contingency survivor in input order - the toughest case
// for the new tiebreak, since a stable-sort-only ranking would put any of
// these ahead of it.
const inputD = [...sixUnrelatedHighs, setoffFinding, invoiceTimingFinding, survivor];
const { primaryTraps: primaryD, secondaryConcerns: secondaryD } = rankFindings(inputD);

check("D1. primaryTraps is capped at 6", primaryD.length === 6);
check("D2. payment-contingency finding is primaryTraps[0]", primaryD[0] === survivor);
check(
  "D3. payment-contingency finding survived the 6-item cap (is inside primaryTraps)",
  primaryD.includes(survivor)
);
check("G1. setoff finding did not win payment-contingency priority", primaryD[0] !== setoffFinding);
check("G2. ordinary invoice-timing finding did not win payment-contingency priority", primaryD[0] !== invoiceTimingFinding);

// F. Stable ordering: indemnityFinding and liabilityCapFinding are both
// unrelated, same-severity (High) findings that were adjacent in input order
// (index 0, 1 of sixUnrelatedHighs) - their relative order must be unchanged.
const combined = [...primaryD, ...secondaryD];
const indemnityPos = combined.indexOf(indemnityFinding);
const liabilityCapPos = combined.indexOf(liabilityCapFinding);
check(
  "F. unrelated same-severity findings retain their original relative order",
  indemnityPos !== -1 && liabilityCapPos !== -1 && indemnityPos < liabilityCapPos
);

// ---------------------------------------------------------------------------
// E. Severity remains dominant: a High non-payment finding must rank above a
// Medium-High payment-contingency finding - payment priority must never cross
// severity tiers. mediumHighPayment is placed FIRST in input, the case most
// likely to expose a bug that checked priority before (or instead of)
// severity.
// ---------------------------------------------------------------------------
const mediumHighPayment = mkFinding({
  familyKey: "payment",
  regulation: "Pay-if-Paid / Contingent Government-Payment Clause",
  severity: "Medium-High",
  foundText: "Subcontractor's right to pay is triggered only after Prime Contractor receives the corresponding payment from the Government.",
});
const highNonPayment = mkFinding({
  familyKey: "liability",
  regulation: "Broad Indemnification / Duty to Defend",
  severity: "High",
  foundText: "Subcontractor shall indemnify and hold harmless Prime Contractor from any and all claims.",
});
const { primaryTraps: primaryE } = rankFindings([mediumHighPayment, highNonPayment]);
check(
  "E. High non-payment finding ranks above Medium-High payment-contingency finding",
  primaryE[0] === highNonPayment
);

// ---------------------------------------------------------------------------
// H. Prime Pushback Memo: buildPmMemo must place the payment-contingency
// finding in bullet 1 when it is primaryTraps[0], including when its
// surviving regulation label is the non-canonical LLM label from Test C.
// ---------------------------------------------------------------------------
const memo = buildPmMemo(primaryD, secondaryD, false);
const bulletOneMatch = memo.match(/1\.\s+([^:]+):/);
check(
  "H. Prime Pushback Memo bullet 1 is the payment-contingency finding",
  Boolean(bulletOneMatch) && bulletOneMatch[1].trim() === survivor.regulation
);

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
} else {
  console.log("\nAll report-ranking regression checks passed.");
}
