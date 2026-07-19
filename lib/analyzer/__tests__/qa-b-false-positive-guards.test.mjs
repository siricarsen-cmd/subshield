// Controlled Fixture B regressions for ordinary defect correction, benign
// flowdown/exhibit references, and firm-fixed-price anchors. This script uses
// the same pure verification/canonicalization/dedupe/ranking functions as
// runAnalyzer and does not call a model or consume a live QA credit.
//
// Run with:
//   node --experimental-loader ./lib/analyzer/__tests__/ts-relative-import.loader.mjs lib/analyzer/__tests__/qa-b-false-positive-guards.test.mjs
import { extractAnchorCandidates } from "../anchors.ts";
import {
  SHORT_TERMINATION_NOTICE_MAX_DAYS,
  extractTerminationNoticeDays,
  runDeterministicDetectors,
} from "../deterministic.ts";
import { dedupeFindings, rankFindings } from "../report.ts";
import { verifyFindings } from "../sanity.ts";
import { ANCHOR_FIXTURE } from "../__fixtures__/fixture-a-rc-clauses.mjs";
import {
  ACTUAL_MATERIAL_DEFECT_CLAUSE,
  BALANCED_MUTUAL_LIABILITY_CAP_CLAUSE,
  BALANCED_MUTUAL_LIABILITY_CAP_VARIANTS,
  BENIGN_STRUCTURE_QUOTES,
  FIXTURE_B_ACCEPTANCE_BLOCK,
  FIXTURE_B_BALANCED_DOCUMENT,
  OPERATIVE_STRUCTURE_QUOTES,
  ORIGINAL_REQUIREMENT_LIMIT_CLAUSE,
  PROTECTIVE_SIXTY_DAY_TERMINATION_CLAUSE,
  PROTECTIVE_TERMINATION_FOR_CONVENIENCE_CLAUSE,
  REAL_LIABILITY_CLAUSES,
  REAL_REWORK_CLAUSES,
  REAL_STRUCTURE_CLAUSES,
  REAL_TERMINATION_FOR_CONVENIENCE_CLAUSES,
  SUBCONTRACTOR_RESPONSIBILITY_LIMIT_CLAUSE,
  VERIFIED_MATERIAL_NONCONFORMITY_CLAUSE,
} from "../__fixtures__/fixture-b-qa-clauses.mjs";

let failures = 0;

function check(label, condition) {
  if (condition) console.log(`PASS: ${label}`);
  else {
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
    riskAnalysis: "Valid grounded-risk analysis for regression testing.",
    redlineFix: "Valid proposed redline for regression testing.",
    familyKey: "liability",
    ...overrides,
  };
}

const REWORK = "Acceptance, Rejection, or Rework Without Clear Compensation";
const MISSING_DOCUMENTS = "Missing / Deferred Contract Documents";
const FUTURE_FLOWDOWNS = "Broad Future Flowdowns / Prime Contract Control";
const TERMINATION_FOR_CONVENIENCE = "Termination for Convenience";
const GOVERNMENT_RECEIPT_LIABILITY_CAP = "Prime-Only Liability Cap Tied to Government Payments Received";

const fixtureBModelLiability = mkFinding({
  familyKey: "liability",
  regulation: "Indemnity, Insurance, and Liability",
  severity: "Medium",
  foundText: BALANCED_MUTUAL_LIABILITY_CAP_CLAUSE,
  riskAnalysis: "The Subcontractor could be undercompensated because recovery is limited to contract value.",
  redlineFix: "Increase or remove the cap.",
});

const fixtureBModelTermination = mkFinding({
  familyKey: "liability",
  regulation: "Termination",
  severity: "Medium",
  foundText: PROTECTIVE_TERMINATION_FOR_CONVENIENCE_CLAUSE,
  riskAnalysis: "The Subcontractor could be left with unrecovered costs.",
  redlineFix: "Add cost recovery.",
});

function deterministicFinding(documentText, regulation) {
  return runDeterministicDetectors(documentText).find((finding) => finding.regulation === regulation);
}

// A. Deterministic rework negatives.
for (const [label, clause] of [
  ["A1. verified material nonconformity", VERIFIED_MATERIAL_NONCONFORMITY_CLAUSE],
  ["A2. actual material defect", ACTUAL_MATERIAL_DEFECT_CLAUSE],
  ["A3. complete balanced Sections 4.1-4.3", FIXTURE_B_ACCEPTANCE_BLOCK],
  ["A4. correction limited to the original requirement", ORIGINAL_REQUIREMENT_LIMIT_CLAUSE],
  ["A5. defects attributable to Subcontractor", SUBCONTRACTOR_RESPONSIBILITY_LIMIT_CLAUSE],
]) {
  check(`${label} does not generate deterministic rework risk`, !deterministicFinding(clause, REWORK));
}

// B. Model-finding guard through runAnalyzer's verification path.
const fixtureBModelRework = mkFinding({
  familyKey: "liability",
  regulation: REWORK,
  severity: "Medium-High",
  foundText: VERIFIED_MATERIAL_NONCONFORMITY_CLAUSE,
});
{
  const { verified, dropped } = verifyFindings(
    [fixtureBModelRework],
    VERIFIED_MATERIAL_NONCONFORMITY_CLAUSE
  );
  check("B1. exact Fixture B model rework finding is dropped", verified.length === 0 && dropped.length === 1);
  check(
    "B2. Fixture B model quote first passed exact grounding and was dropped by the evidence guard",
    dropped[0]?.reason.includes("ordinary verified/actual material defect")
  );
}
for (const [label, quote] of [
  ["B3. model quote limited to the original requirement", ORIGINAL_REQUIREMENT_LIMIT_CLAUSE],
  ["B4. model quote limited to Subcontractor-attributable defects", SUBCONTRACTOR_RESPONSIBILITY_LIMIT_CLAUSE],
]) {
  const finding = mkFinding({ familyKey: "liability", regulation: REWORK, foundText: quote });
  const { verified, dropped } = verifyFindings([finding], quote);
  check(`${label} is dropped`, verified.length === 0 && dropped.length === 1);
}

// C. Genuine rework positives remain deterministic findings.
for (const [index, clause] of REAL_REWORK_CLAUSES.entries()) {
  const finding = deterministicFinding(clause, REWORK);
  check(`C${index + 1}. genuine rework clause remains reportable`, Boolean(finding));
  check(`C${index + 1}q. genuine rework quote remains literal`, Boolean(finding && clause.includes(finding.foundText)));
}

// D. A protective clause cannot suppress a separate risky clause.
{
  const genuineClause = REAL_REWORK_CLAUSES[0];
  const combinedDocument = `${VERIFIED_MATERIAL_NONCONFORMITY_CLAUSE}\n\n${genuineClause}`;
  const deterministic = runDeterministicDetectors(combinedDocument).filter(
    (finding) => finding.regulation === REWORK
  );
  const { verified } = verifyFindings(deterministic, combinedDocument);
  check("D1. same-document isolation leaves exactly one rework finding", verified.length === 1);
  check(
    "D2. surviving same-document rework finding is grounded in the genuine clause",
    verified[0]?.foundText === genuineClause
  );
}

// E. Bare/positive flowdown and exhibit quotes are not missing-document proof.
for (const [index, quote] of BENIGN_STRUCTURE_QUOTES.entries()) {
  const finding = mkFinding({
    familyKey: "structure",
    regulation: "Contract Structure & Missing Documents",
    foundText: quote,
  });
  const { verified, dropped } = verifyFindings([finding], quote);
  check(`E${index + 1}. benign structure quote is dropped`, verified.length === 0 && dropped.length === 1);
}

// A sentence beginning with an Exhibit identifier is not a bare title when
// its exact quote states an operative missing, control, precedence,
// unilateral-modification, or undisclosed-incorporation risk.
for (const [index, quote] of OPERATIVE_STRUCTURE_QUOTES.entries()) {
  const finding = mkFinding({
    familyKey: "structure",
    regulation: "Contract Structure & Missing Documents",
    foundText: quote,
  });
  const { verified, dropped } = verifyFindings([finding], quote);
  check(
    `E-risk-${index + 1}. operative Exhibit structure quote survives verification`,
    verified.length === 1 && dropped.length === 0
  );
}

// F. Explicit missing/incomplete/control evidence remains reportable.
{
  const missing = deterministicFinding(REAL_STRUCTURE_CLAUSES.missingDocuments, MISSING_DOCUMENTS);
  check("F1. explicit missing/deferred SOW and matrix remain deterministic", Boolean(missing));

  const future = deterministicFinding(REAL_STRUCTURE_CLAUSES.futureFlowdowns, FUTURE_FLOWDOWNS);
  check("F2. future flowdowns binding upon notice remain deterministic", Boolean(future));

  const undisclosed = deterministicFinding(REAL_STRUCTURE_CLAUSES.undisclosedPrimeContract, FUTURE_FLOWDOWNS);
  check("F3. Prime Contract control despite non-supply remains deterministic", Boolean(undisclosed));

  const wage = runDeterministicDetectors(REAL_STRUCTURE_CLAUSES.missingWageDetermination).find(
    (finding) => finding.regulation === "Missing or Unresolved Wage Determination / Labor Standards Requirement"
  );
  check("F4. incorporated-but-unattached wage determination remains deterministic", Boolean(wage));

  for (const [label, quote] of [
    ["F5. incomplete matrix/omitted clauses", REAL_STRUCTURE_CLAUSES.incompleteFlowdowns],
    ["F6. missing cyber documents", REAL_STRUCTURE_CLAUSES.missingCyberDocuments],
    ["F7. unattached wage determination model finding", REAL_STRUCTURE_CLAUSES.missingWageDetermination],
  ]) {
    const finding = mkFinding({
      familyKey: "structure",
      regulation: "Contract Structure & Missing Documents",
      foundText: quote,
    });
    const { verified, dropped } = verifyFindings([finding], quote);
    check(`${label} survives the structure sanity guard`, verified.length === 1 && dropped.length === 0);
  }
}

// G. Pipeline-level collision: model false positives first, then the complete
// deterministic result, followed by runAnalyzer's verification, known-label
// canonicalization/dedupe, and ranking boundaries.
{
  const bareFlowdownFinding = mkFinding({
    familyKey: "structure",
    regulation: "Contract Structure & Missing Documents",
    severity: "Medium",
    foundText: "Exhibit C Flowdown Matrix",
  });
  const deterministic = runDeterministicDetectors(FIXTURE_B_BALANCED_DOCUMENT);
  const { verified } = verifyFindings(
    [
      fixtureBModelRework,
      bareFlowdownFinding,
      fixtureBModelLiability,
      fixtureBModelTermination,
      ...deterministic,
    ],
    FIXTURE_B_BALANCED_DOCUMENT
  );
  const deduped = dedupeFindings(verified);
  const { primaryTraps, secondaryConcerns } = rankFindings(deduped);
  const finalFindings = [...primaryTraps, ...secondaryConcerns];
  const forbiddenLabels = new Set([
    REWORK,
    "Contract Structure & Missing Documents",
    MISSING_DOCUMENTS,
    FUTURE_FLOWDOWNS,
    "Indemnity, Insurance, and Liability",
    "Termination",
    TERMINATION_FOR_CONVENIENCE,
  ]);

  check(
    "G1. neither production false positive nor a deterministic collision survives",
    finalFindings.every((finding) => !forbiddenLabels.has(finding.regulation))
  );
  check(
    "G2. balanced Fixture B pipeline fabricates no High/Medium-High/Medium finding",
    finalFindings.every((finding) => finding.severity === "Low")
  );
  check("G3. complete balanced Fixture B has no deterministic risk finding", deterministic.length === 0);
  check(
    "G4. Fixture B 10.2 produces no deterministic termination-for-convenience finding",
    !deterministic.some((finding) => finding.regulation === TERMINATION_FOR_CONVENIENCE)
  );
  check(
    "G5. prior rework and missing-flowdown protections remain active",
    finalFindings.every((finding) => finding.regulation !== REWORK && finding.familyKey !== "structure")
  );
  check(
    "G6. complete Fixture B still extracts the $420,000 total firm-fixed price",
    extractAnchorCandidates(FIXTURE_B_BALANCED_DOCUMENT).priceOrEstimatedValue === "$420,000"
  );
}

// H. Price anchors: all values must remain literal source substrings.
for (const [index, documentText] of [
  "Total Firm-Fixed Price: $420,000",
  "The total firm-fixed price is $420,000.",
  "Total FFP Price — $420,000",
  "Total\n Firm - Fixed\n Price:\n $420,000",
].entries()) {
  const value = extractAnchorCandidates(documentText).priceOrEstimatedValue;
  check(`H${index + 1}. firm-fixed-price variant extracts literal $420,000`, value === "$420,000");
  check(`H${index + 1}q. extracted price is a literal substring`, Boolean(value && documentText.includes(value)));
}

check(
  "H5. Fixture A $850,000 ceiling anchor is preserved",
  extractAnchorCandidates(ANCHOR_FIXTURE).priceOrEstimatedValue === "$850,000"
);

for (const [index, documentText] of [
  "Prime Contractor's liability is capped at $420,000.",
  "Commercial general liability insurance shall have a $420,000 per-occurrence limit.",
  "Prime retains ten percent retainage; the current invoice amount is $420,000.",
  "Invoice Amount: $420,000",
].entries()) {
  check(
    `H${index + 6}. unrelated monetary reference is not a contract-price anchor`,
    extractAnchorCandidates(documentText).priceOrEstimatedValue === undefined
  );
}

// I. Balanced mutual liability-cap model negatives and label variants.
for (const [index, regulation] of [
  "Indemnity, Insurance, and Liability",
  "Limitation of Liability",
  "Liability Cap",
  "Liability, Indemnity, Disputes, Termination",
].entries()) {
  const finding = mkFinding({
    familyKey: "liability",
    regulation,
    foundText: BALANCED_MUTUAL_LIABILITY_CAP_CLAUSE,
    riskAnalysis: "Speculative one-sided model analysis that is not contract evidence.",
    redlineFix: "Speculative model redline that is not contract evidence.",
  });
  const { verified, dropped } = verifyFindings([finding], BALANCED_MUTUAL_LIABILITY_CAP_CLAUSE);
  check(`I${index + 1}. ${regulation} mutual-cap finding is dropped`, verified.length === 0 && dropped.length === 1);
  check(
    `I${index + 1}r. ${regulation} drop reason identifies the bilateral cap guard`,
    /mutual\/bilateral liability cap/i.test(dropped[0]?.reason ?? "")
  );
}

const ONE_SIDED_DAMAGES_ALLOCATION_QUOTES = [
  "Each party's aggregate liability is limited to the total Contract price. Prime shall not be liable for consequential or punitive damages.",
  "Each party's aggregate liability is limited to the total Contract price. Subcontractor remains liable for consequential damages, but Prime shall have no liability for consequential damages.",
  "Each party's aggregate liability is limited to the total Contract price. Only Prime is protected from indirect, special, and lost-profit damages.",
  "Each party's aggregate liability is limited to the total Contract price. Subcontractor waives consequential-damage claims against Prime.",
  "Each party's aggregate liability is limited to the total Contract price. Only Prime receives the damages waiver for incidental damages.",
  "Each party's aggregate liability is limited to the total Contract price. The damages waiver applies exclusively to Prime.",
  "Each party's aggregate liability is limited to the total Contract price. Consequential and punitive damages are excluded for Prime; Subcontractor remains liable for those damages.",
  "Each party's aggregate liability is limited to the total Contract price. Neither party shall be liable for consequential damages, except Subcontractor remains liable for consequential damages.",
  "Each party's aggregate liability is limited to the total Contract price. The parties mutually waive consequential damages; however, the waiver does not apply to claims against Subcontractor.",
  "Each party's aggregate liability is limited to the total Contract price. Neither Prime nor Subcontractor shall be liable for special damages, except that Subcontractor remains liable for Prime's lost profits.",
  "Each party's aggregate liability is limited to the total Contract price. Each party waives indirect damages against the other, but only Prime retains the right to recover indirect damages.",
  "Each party's aggregate liability is limited to the total Contract price. Neither party shall be liable for consequential damages. Prime shall not be liable for punitive damages.",
  "Each party's aggregate liability is limited to the total Contract price. The parties mutually waive indirect damages. Prime shall not be liable for consequential, special, or lost-profit damages.",
  "Each party's aggregate liability is limited to the total Contract price. Neither Prime nor Subcontractor shall be liable for punitive damages. Subcontractor remains liable for consequential damages.",
  "Each party's aggregate liability is limited to the total Contract price. Neither party shall be liable for consequential damages. Only Prime is protected from incidental damages.",
];

for (const [index, quote] of ONE_SIDED_DAMAGES_ALLOCATION_QUOTES.entries()) {
  const finding = mkFinding({
    familyKey: "liability",
    regulation: "Liability Cap",
    foundText: quote,
    riskAnalysis: "Model analysis is intentionally not used as evidence by this regression.",
    redlineFix: "Model redline is intentionally not used as evidence by this regression.",
  });
  const { verified, dropped } = verifyFindings([finding], quote);
  check(
    `I-asym-${index + 1}. mutual cap with one-sided damages allocation survives`,
    verified.length === 1 && dropped.length === 0
  );
}

const MUTUAL_DAMAGES_WAIVER_QUOTES = [
  "Each party's aggregate liability is limited to the total Contract price. Neither party shall be liable for consequential or punitive damages.",
  "Each party's aggregate liability is limited to the total Contract price. Each party mutually waives consequential damages.",
  "Each party's aggregate liability is limited to the total Contract price. The parties mutually waive consequential and punitive damages.",
  "Each party's aggregate liability is limited to the total Contract price. Neither Prime nor Subcontractor shall be liable for indirect, special, or consequential damages.",
  "Except for fraud and willful misconduct, the aggregate liability of each party shall not exceed amounts paid or payable under this Agreement.",
  "Each party's aggregate liability is limited to the total Contract price. Neither party shall be liable for consequential damages. For clarity, Prime shall not be liable for consequential damages.",
  "Each party's aggregate liability is limited to the total Contract price. The parties mutually waive consequential and punitive damages. Prime shall not be liable for punitive damages.",
];

for (const [index, quote] of MUTUAL_DAMAGES_WAIVER_QUOTES.entries()) {
  const finding = mkFinding({
    familyKey: "liability",
    regulation: "Liability Cap",
    foundText: quote,
    riskAnalysis: "Speculative one-sided analysis must not override mutual quote evidence.",
    redlineFix: "Speculative model redline must not override mutual quote evidence.",
  });
  const { verified, dropped } = verifyFindings([finding], quote);
  check(
    `I-mutual-${index + 1}. genuinely mutual damages allocation remains suppressed`,
    verified.length === 0 && dropped.length === 1
  );
}

for (const [index, quote] of BALANCED_MUTUAL_LIABILITY_CAP_VARIANTS.entries()) {
  const finding = mkFinding({ familyKey: "liability", regulation: "Liability Cap", foundText: quote });
  const { verified, dropped } = verifyFindings([finding], quote);
  check(`J${index + 1}. balanced mutual-cap wording variant is dropped`, verified.length === 0 && dropped.length === 1);
}

// K. Real asymmetric liability terms remain reportable, including the
// deterministic Government-receipt cap already protected by the analyzer.
const realLiabilityLabels = [
  "Liability Cap",
  "Limitation of Liability",
  "Damages Limitation",
  "Indemnity, Insurance, and Liability",
  "Liability, Indemnity, Disputes, Termination",
  "Liability Cap",
];
for (const [index, quote] of REAL_LIABILITY_CLAUSES.entries()) {
  const finding = mkFinding({
    familyKey: "liability",
    regulation: realLiabilityLabels[index],
    foundText: quote,
  });
  const { verified, dropped } = verifyFindings([finding], quote);
  check(`K${index + 1}. real asymmetric liability clause survives`, verified.length === 1 && dropped.length === 0);
}
{
  const governmentCap = deterministicFinding(REAL_LIABILITY_CLAUSES[1], GOVERNMENT_RECEIPT_LIABILITY_CAP);
  check("K6. deterministic Government-receipt liability cap remains detected", Boolean(governmentCap));
  const { verified, dropped } = verifyFindings(
    governmentCap ? [governmentCap] : [],
    REAL_LIABILITY_CLAUSES[1]
  );
  check("K7. deterministic Government-receipt liability cap survives verification", verified.length === 1 && dropped.length === 0);
}

// L. A favorable cap cannot suppress a separate asymmetric cap in the same
// document because both guards operate on each finding's own exact quote.
{
  const riskyQuote = REAL_LIABILITY_CLAUSES[1];
  const documentText = `${BALANCED_MUTUAL_LIABILITY_CAP_CLAUSE}\n\n${riskyQuote}`;
  const findings = [
    mkFinding({ familyKey: "liability", regulation: "Liability Cap", foundText: BALANCED_MUTUAL_LIABILITY_CAP_CLAUSE }),
    mkFinding({ familyKey: "liability", regulation: GOVERNMENT_RECEIPT_LIABILITY_CAP, foundText: riskyQuote }),
  ];
  const { verified, dropped } = verifyFindings(findings, documentText);
  check("L1. same-document balanced liability finding alone is dropped", dropped.length === 1);
  check("L2. same-document asymmetric liability finding survives", verified.length === 1 && verified[0]?.foundText === riskyQuote);
}

// M. Deterministic termination requires actual short-notice or adverse
// recovery evidence; a numeric day count by itself is no longer sufficient.
check("M1. short-notice threshold is explicitly 15 days", SHORT_TERMINATION_NOTICE_MAX_DAYS === 15);
for (const [index, quote] of [
  PROTECTIVE_TERMINATION_FOR_CONVENIENCE_CLAUSE,
  PROTECTIVE_SIXTY_DAY_TERMINATION_CLAUSE,
].entries()) {
  check(
    `M${index + 2}. protective long-notice comprehensive-recovery clause is not deterministic risk`,
    !deterministicFinding(quote, TERMINATION_FOR_CONVENIENCE)
  );
}
check(
  "M4. fifteen-day notice is still a deterministic short-notice risk",
  Boolean(deterministicFinding("Prime may terminate for convenience on fifteen days written notice.", TERMINATION_FOR_CONVENIENCE))
);
for (const unit of ["calendar", "business", "working"]) {
  check(
    `M4-${unit}. numeric 15 ${unit}-day notice remains deterministic risk`,
    Boolean(deterministicFinding(`Prime may terminate for convenience on 15 ${unit} days written notice.`, TERMINATION_FOR_CONVENIENCE))
  );
}
check(
  "M5. sixteen-day notice alone is insufficient deterministic risk evidence",
  !deterministicFinding("Prime may terminate for convenience on sixteen days written notice.", TERMINATION_FOR_CONVENIENCE)
);

const PROTECTIVE_NEGATED_TERMINATION_QUOTES = [
  "Prime may not terminate for convenience without written notice.",
  "Prime may terminate for convenience, but not immediately, and only after sixty days written notice.",
  "Prime is prohibited from terminating for convenience at any time without notice.",
  "Neither party may terminate for convenience without thirty days prior written notice.",
];

const AFFIRMATIVE_IMMEDIATE_TERMINATION_QUOTES = [
  "Prime may terminate for convenience without written notice.",
  "Prime may terminate for convenience immediately.",
  "Prime may terminate for convenience at any time.",
  "Prime may terminate for convenience in its sole discretion without further notice.",
];

for (const [index, quote] of PROTECTIVE_NEGATED_TERMINATION_QUOTES.entries()) {
  check(
    `M-protective-${index + 1}. protective negated termination wording is not deterministic risk`,
    !deterministicFinding(quote, TERMINATION_FOR_CONVENIENCE)
  );
}

for (const [index, quote] of AFFIRMATIVE_IMMEDIATE_TERMINATION_QUOTES.entries()) {
  check(
    `M-adverse-${index + 1}. affirmative immediate/no-notice termination remains deterministic risk`,
    Boolean(deterministicFinding(quote, TERMINATION_FOR_CONVENIENCE))
  );
}

const FIVE_DAY_PRIOR_NOTICE_CLAUSE = "Prime may terminate for convenience on five days’ prior written notice.";
const FIFTEEN_DAY_PRIOR_NOTICE_CLAUSE = "Prime may terminate for convenience on 15 days prior written notice.";
const SIXTEEN_DAY_PRIOR_NOTICE_CLAUSE = "Prime may terminate for convenience on 16 days prior written notice.";
const THIRTY_DAY_PRIOR_NOTICE_WITH_RECOVERY =
  "Prime may terminate for convenience on 30 days prior written notice. Prime shall pay accepted work, reasonable work in process, noncancelable commitments, demobilization, and settlement costs.";
const SIXTY_DAY_ADVANCE_NOTICE_WITH_RECOVERY =
  "Prime may terminate for convenience on 60 days advance written notice. Prime shall pay completed work, reasonable work in process, noncancelable commitments, demobilization, and closeout costs.";
const AT_LEAST_THIRTY_DAY_NOTICE_WITH_RECOVERY =
  "Prime may terminate for convenience on at least thirty days prior written notice. Prime shall pay completed work, reasonable work in process, noncancelable commitments, demobilization, and settlement costs.";

for (const [label, quote, expectedDays] of [
  ["five days’ prior written notice", FIVE_DAY_PRIOR_NOTICE_CLAUSE, 5],
  ["15 days prior written notice", FIFTEEN_DAY_PRIOR_NOTICE_CLAUSE, 15],
  ["16 days prior written notice", SIXTEEN_DAY_PRIOR_NOTICE_CLAUSE, 16],
  ["30 days prior written notice", THIRTY_DAY_PRIOR_NOTICE_WITH_RECOVERY, 30],
  ["60 days advance written notice", SIXTY_DAY_ADVANCE_NOTICE_WITH_RECOVERY, 60],
  ["at least thirty days prior written notice", AT_LEAST_THIRTY_DAY_NOTICE_WITH_RECOVERY, 30],
]) {
  check(`M-parser-${label}. notice parser returns ${expectedDays}`, extractTerminationNoticeDays(quote) === expectedDays);
}

check(
  "M-prior-5. five-day prior written notice remains short-notice risk",
  Boolean(deterministicFinding(FIVE_DAY_PRIOR_NOTICE_CLAUSE, TERMINATION_FOR_CONVENIENCE))
);
check(
  "M-prior-15. 15-day prior written notice remains short-notice risk",
  Boolean(deterministicFinding(FIFTEEN_DAY_PRIOR_NOTICE_CLAUSE, TERMINATION_FOR_CONVENIENCE))
);
check(
  "M-prior-16. 16-day prior written notice alone is not risk",
  !deterministicFinding(SIXTEEN_DAY_PRIOR_NOTICE_CLAUSE, TERMINATION_FOR_CONVENIENCE)
);
for (const [label, quote] of [
  ["30-day prior notice", THIRTY_DAY_PRIOR_NOTICE_WITH_RECOVERY],
  ["60-day advance notice", SIXTY_DAY_ADVANCE_NOTICE_WITH_RECOVERY],
  ["at-least-30-day prior notice", AT_LEAST_THIRTY_DAY_NOTICE_WITH_RECOVERY],
]) {
  check(
    `M-long-${label}. long notice plus comprehensive recovery remains protective`,
    !deterministicFinding(quote, TERMINATION_FOR_CONVENIENCE)
  );
}

// N. Model termination negatives, including the tightly bounded second
// sentence continuation allowed for a quote containing only sentence one.
for (const [index, regulation] of [
  "Termination",
  "Termination for Convenience",
  "Liability, Indemnity, Disputes, Termination",
].entries()) {
  const finding = mkFinding({
    familyKey: "liability",
    regulation,
    foundText: PROTECTIVE_TERMINATION_FOR_CONVENIENCE_CLAUSE,
    riskAnalysis: "Speculative unrecovered-cost analysis that ignores the quote.",
    redlineFix: "Speculative recovery redline that ignores the quote.",
  });
  const { verified, dropped } = verifyFindings([finding], PROTECTIVE_TERMINATION_FOR_CONVENIENCE_CLAUSE);
  check(`N${index + 1}. ${regulation} protective termination finding is dropped`, verified.length === 0 && dropped.length === 1);
}
{
  const firstSentence = "Prime may terminate for convenience on thirty calendar days written notice.";
  const finding = mkFinding({ familyKey: "liability", regulation: "Termination", foundText: firstSentence });
  const { verified, dropped } = verifyFindings([finding], PROTECTIVE_TERMINATION_FOR_CONVENIENCE_CLAUSE);
  check("N4. first-sentence-only quote is dropped using its immediate same-clause recovery sentence", verified.length === 0 && dropped.length === 1);

  const unrelatedRecoveryDocument = `${firstSentence}\n\n10.3 Subcontractor may suspend work for nonpayment.\n\nPrime shall pay accepted work, reasonable work in process, noncancelable commitments, demobilization, and settlement costs under a separate closeout clause.`;
  const isolated = verifyFindings([finding], unrelatedRecoveryDocument);
  check(
    "N5. recovery language several unrelated clauses later does not suppress",
    isolated.verified.length === 1 && isolated.dropped.length === 0
  );
}

for (const [index, quote] of PROTECTIVE_NEGATED_TERMINATION_QUOTES.entries()) {
  const finding = mkFinding({
    familyKey: "liability",
    regulation: "Termination for Convenience",
    foundText: quote,
    riskAnalysis: "Speculative immediate-termination analysis is not evidence.",
    redlineFix: "Speculative model redline is not evidence.",
  });
  const { verified, dropped } = verifyFindings([finding], quote);
  check(
    `N-protective-${index + 1}. protective negated model termination finding is dropped`,
    verified.length === 0 && dropped.length === 1
  );
}

for (const [index, quote] of AFFIRMATIVE_IMMEDIATE_TERMINATION_QUOTES.entries()) {
  const finding = mkFinding({
    familyKey: "liability",
    regulation: "Termination for Convenience",
    foundText: quote,
  });
  const { verified, dropped } = verifyFindings([finding], quote);
  check(
    `N-adverse-${index + 1}. affirmative immediate/no-notice model finding survives`,
    verified.length === 1 && dropped.length === 0
  );
}

{
  const protectiveQuote = PROTECTIVE_NEGATED_TERMINATION_QUOTES[0];
  const riskyQuote = AFFIRMATIVE_IMMEDIATE_TERMINATION_QUOTES[0];
  const documentText = `${protectiveQuote}\n\n${riskyQuote}`;
  const modelFindings = [
    mkFinding({ familyKey: "liability", regulation: "Termination for Convenience", foundText: protectiveQuote }),
    mkFinding({ familyKey: "liability", regulation: "Termination for Convenience", foundText: riskyQuote }),
  ];
  const deterministic = runDeterministicDetectors(documentText).filter(
    (finding) => finding.regulation === TERMINATION_FOR_CONVENIENCE
  );
  const { verified } = verifyFindings([...modelFindings, ...deterministic], documentText);
  const finalFindings = dedupeFindings(verified);
  check("N-isolation-1. protective and adverse same-document clauses leave one finding", finalFindings.length === 1);
  check(
    "N-isolation-2. same-document survivor is the affirmative no-notice clause",
    finalFindings[0]?.foundText === riskyQuote
  );
}

// O. Every required real termination condition remains reportable through
// both the deterministic source and model-finding verification.
for (const [index, quote] of REAL_TERMINATION_FOR_CONVENIENCE_CLAUSES.entries()) {
  const deterministic = deterministicFinding(quote, TERMINATION_FOR_CONVENIENCE);
  check(`O${index + 1}d. real termination clause remains deterministic`, Boolean(deterministic));

  const modelFinding = mkFinding({
    familyKey: "liability",
    regulation: index % 2 === 0 ? "Termination" : "Termination for Convenience",
    foundText: quote,
  });
  const { verified, dropped } = verifyFindings([modelFinding], quote);
  check(`O${index + 1}m. real termination model finding survives`, verified.length === 1 && dropped.length === 0);
}

// P. Same-document isolation: the protective first clause neither consumes
// the deterministic category slot nor suppresses the separate five-day risk.
{
  const riskyQuote = REAL_TERMINATION_FOR_CONVENIENCE_CLAUSES[0];
  const documentText = `${PROTECTIVE_TERMINATION_FOR_CONVENIENCE_CLAUSE}\n\n${riskyQuote}`;
  const modelFindings = [
    mkFinding({ familyKey: "liability", regulation: "Termination", foundText: PROTECTIVE_TERMINATION_FOR_CONVENIENCE_CLAUSE }),
    mkFinding({ familyKey: "liability", regulation: TERMINATION_FOR_CONVENIENCE, foundText: riskyQuote }),
  ];
  const deterministic = runDeterministicDetectors(documentText).filter(
    (finding) => finding.regulation === TERMINATION_FOR_CONVENIENCE
  );
  const { verified } = verifyFindings([...modelFindings, ...deterministic], documentText);
  const finalFindings = dedupeFindings(verified);
  check("P1. same-document termination pipeline leaves exactly one finding", finalFindings.length === 1);
  check("P2. same-document survivor is grounded in the five-day risky clause", finalFindings[0]?.foundText === riskyQuote);
}

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}

console.log("\nAll QA-B false-positive and price-anchor regression checks passed.");
