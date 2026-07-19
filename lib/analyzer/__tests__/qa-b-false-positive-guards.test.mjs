// Controlled Fixture B regressions for ordinary defect correction, benign
// flowdown/exhibit references, and firm-fixed-price anchors. This script uses
// the same pure verification/canonicalization/dedupe/ranking functions as
// runAnalyzer and does not call a model or consume a live QA credit.
//
// Run with:
//   node --experimental-loader ./lib/analyzer/__tests__/ts-relative-import.loader.mjs lib/analyzer/__tests__/qa-b-false-positive-guards.test.mjs
import { extractAnchorCandidates } from "../anchors.ts";
import { runDeterministicDetectors } from "../deterministic.ts";
import { dedupeFindings, rankFindings } from "../report.ts";
import { verifyFindings } from "../sanity.ts";
import { ANCHOR_FIXTURE } from "../__fixtures__/fixture-a-rc-clauses.mjs";
import {
  ACTUAL_MATERIAL_DEFECT_CLAUSE,
  BENIGN_STRUCTURE_QUOTES,
  FIXTURE_B_ACCEPTANCE_BLOCK,
  FIXTURE_B_BALANCED_DOCUMENT,
  OPERATIVE_STRUCTURE_QUOTES,
  ORIGINAL_REQUIREMENT_LIMIT_CLAUSE,
  REAL_REWORK_CLAUSES,
  REAL_STRUCTURE_CLAUSES,
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
    [fixtureBModelRework, bareFlowdownFinding, ...deterministic],
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

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}

console.log("\nAll QA-B false-positive and price-anchor regression checks passed.");
