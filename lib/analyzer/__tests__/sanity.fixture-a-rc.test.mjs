// Finding-local guards for the two release-candidate false-positive paths.
// Run with ts-relative-import.loader.mjs because sanity.ts has value imports.
import { verifyFindings } from "../sanity.ts";
import { runDeterministicDetectors } from "../deterministic.ts";
import { dedupeFindings } from "../report.ts";
import {
  GENERIC_IP_INDEMNITY_CLAUSE,
  ORDINARY_THIRTY_DAY_FUNDING_NOTICE_CLAUSE,
  GENUINE_DATA_RIGHTS_CLAUSES,
  MISSING_DOCUMENTS_CLAUSE,
  FUTURE_FLOWDOWN_CLAUSE,
  COMPETING_NOTICE_CLAUSES_DOCUMENT,
  WEAKER_FUNDING_NOTICE_WAIVER_CLAUSE,
} from "../__fixtures__/fixture-a-rc-clauses.mjs";

let failures = 0;
function check(label, condition) {
  if (condition) console.log(`PASS: ${label}`);
  else {
    console.error(`FAIL: ${label}`);
    failures++;
  }
}
function finding(overrides) {
  return {
    triggerType: "Contract Risk Trigger",
    regulation: "Placeholder",
    severity: "Medium-High",
    foundText: "Placeholder quote.",
    riskAnalysis: "Placeholder analysis.",
    redlineFix: "Placeholder fix.",
    familyKey: "data-rights",
    ...overrides,
  };
}

{
  const result = verifyFindings([
    finding({
      regulation: "Data Rights / Loss of Proprietary Information",
      foundText: GENERIC_IP_INDEMNITY_CLAUSE,
    }),
  ], GENERIC_IP_INDEMNITY_CLAUSE);
  check("H3. indemnity-only IP/data quote cannot survive as data-rights finding", result.verified.length === 0 && result.dropped.length === 1);
}

{
  const clause = GENUINE_DATA_RIGHTS_CLAUSES[1];
  const result = verifyFindings([
    finding({ regulation: "Broad License Grant", foundText: clause }),
  ], clause);
  check("I6. genuine license quote survives data-rights sanity guard", result.verified.length === 1 && result.dropped.length === 0);
}

{
  const result = verifyFindings([
    finding({
      familyKey: "payment",
      regulation: "Short Notice-of-Claim / Change Notice Waiver",
      foundText: ORDINARY_THIRTY_DAY_FUNDING_NOTICE_CLAUSE,
    }),
  ], ORDINARY_THIRTY_DAY_FUNDING_NOTICE_CLAUSE);
  check("D2. simulated LLM ordinary 30-day funding notice is suppressed", result.verified.length === 0 && result.dropped.length === 1);
}

{
  const documentText = `${MISSING_DOCUMENTS_CLAUSE}\n\n${FUTURE_FLOWDOWN_CLAUSE}`;
  const simulatedModelFutureFlowdown = finding({
    familyKey: "structure",
    regulation: "Contract Structure & Missing Documents",
    severity: "Medium-High",
    foundText: FUTURE_FLOWDOWN_CLAUSE,
    riskAnalysis:
      "Additional or revised flowdown requirements can bind Subcontractor on notice without prior review of the complete Prime Contract or matrix.",
    redlineFix:
      "Require advance delivery and Subcontractor's written acceptance of any additional or revised flowdown before it becomes binding.",
  });
  const deterministic = runDeterministicDetectors(documentText).filter((candidate) =>
    ["Missing / Deferred Contract Documents", "Broad Future Flowdowns / Prime Contract Control"].includes(candidate.regulation)
  );
  const { verified } = verifyFindings([simulatedModelFutureFlowdown, ...deterministic], documentText);
  const deduped = dedupeFindings(verified);
  const structureFindings = deduped.filter((candidate) => candidate.familyKey === "structure");
  const futureFlowdown = structureFindings.find(
    (candidate) => candidate.regulation === "Broad Future Flowdowns / Prime Contract Control"
  );
  check(
    "B4. model-first collision produces exactly the canonical missing-document and future-flowdown structure findings",
    structureFindings.length === 2 &&
      structureFindings.some((candidate) => candidate.regulation === "Missing / Deferred Contract Documents") &&
      Boolean(futureFlowdown)
  );
  check(
    "B5. future-flowdown collision preserves the model's higher severity and exact grounded quote",
    futureFlowdown?.severity === "Medium-High" && futureFlowdown.foundText === FUTURE_FLOWDOWN_CLAUSE
  );
  check(
    "B6. future-flowdown quote does not retain the model's generic missing-documents title",
    !structureFindings.some(
      (candidate) =>
        candidate.foundText === FUTURE_FLOWDOWN_CLAUSE &&
        candidate.regulation === "Contract Structure & Missing Documents"
    )
  );
}

{
  const simulatedModelMissingDocument = finding({
    familyKey: "structure",
    regulation: "Contract Structure & Missing Documents",
    severity: "Medium-High",
    foundText: MISSING_DOCUMENTS_CLAUSE,
  });
  const deterministicMissingDocument = runDeterministicDetectors(MISSING_DOCUMENTS_CLAUSE).find(
    (candidate) => candidate.regulation === "Missing / Deferred Contract Documents"
  );
  const { verified } = verifyFindings(
    [simulatedModelMissingDocument, deterministicMissingDocument],
    MISSING_DOCUMENTS_CLAUSE
  );
  const matchingMissingDocuments = dedupeFindings(verified).filter(
    (candidate) => candidate.foundText === MISSING_DOCUMENTS_CLAUSE
  );
  check(
    "B7. model-first missing-document collision keeps one canonical, higher-severity, exactly grounded finding",
    matchingMissingDocuments.length === 1 &&
      matchingMissingDocuments[0].regulation === "Missing / Deferred Contract Documents" &&
      matchingMissingDocuments[0].severity === "Medium-High" &&
      matchingMissingDocuments[0].foundText === MISSING_DOCUMENTS_CLAUSE &&
      !matchingMissingDocuments.some(
        (candidate) => candidate.regulation === "Contract Structure & Missing Documents"
      )
  );
}

{
  const documentText = `${MISSING_DOCUMENTS_CLAUSE}\n\n${FUTURE_FLOWDOWN_CLAUSE}`;
  const simulatedModelMissingDocument = finding({
    familyKey: "structure",
    regulation: "Contract Structure & Missing Documents",
    severity: "Medium-High",
    foundText: MISSING_DOCUMENTS_CLAUSE,
  });
  const simulatedModelFutureFlowdown = finding({
    familyKey: "structure",
    regulation: "Contract Structure & Missing Documents",
    severity: "Medium-High",
    foundText: FUTURE_FLOWDOWN_CLAUSE,
  });
  const deterministic = runDeterministicDetectors(documentText).filter((candidate) =>
    ["Missing / Deferred Contract Documents", "Broad Future Flowdowns / Prime Contract Control"].includes(candidate.regulation)
  );
  const { verified } = verifyFindings(
    [simulatedModelMissingDocument, simulatedModelFutureFlowdown, ...deterministic],
    documentText
  );
  const structureFindings = dedupeFindings(verified).filter(
    (candidate) => candidate.familyKey === "structure"
  );
  const titles = structureFindings.map((candidate) => candidate.regulation).sort();
  check(
    "B8. combined model/deterministic collisions yield exactly the two canonical structure findings",
    structureFindings.length === 2 &&
      JSON.stringify(titles) ===
        JSON.stringify([
          "Broad Future Flowdowns / Prime Contract Control",
          "Missing / Deferred Contract Documents",
        ])
  );
}

for (const [label, foundText] of [
  [
    "B9. order-of-precedence evidence is not renamed as missing/deferred documents",
    "Exhibit A is not included in the order of precedence; the body of this Subcontract controls in the event of conflict.",
  ],
  [
    "B10. generic incorporation-by-reference evidence is not renamed as missing/deferred documents",
    "The Prime Contract is incorporated by reference and shall control in the event of conflict.",
  ],
  [
    "B11. document silence is not renamed as missing/deferred documents",
    "The parties executed this Subcontract after reviewing the terms stated in this agreement.",
  ],
]) {
  const simulatedModelStructureFinding = finding({
    familyKey: "structure",
    regulation: "Contract Structure & Missing Documents",
    foundText,
  });
  const { verified } = verifyFindings([simulatedModelStructureFinding], foundText);
  const [dedupedStructureFinding] = dedupeFindings(verified);
  check(
    label,
    dedupedStructureFinding?.regulation === "Contract Structure & Missing Documents"
  );
}

{
  const simulatedWeakerNotice = finding({
    familyKey: "payment",
    regulation: "Short Notice-of-Claim / Change Notice Waiver",
    severity: "Medium-High",
    foundText: WEAKER_FUNDING_NOTICE_WAIVER_CLAUSE,
  });
  const deterministicNotice = runDeterministicDetectors(COMPETING_NOTICE_CLAUSES_DOCUMENT).find(
    (candidate) => candidate.regulation === "Short Notice-of-Claim / Change Notice Waiver"
  );
  const { verified } = verifyFindings(
    [simulatedWeakerNotice, deterministicNotice],
    COMPETING_NOTICE_CLAUSES_DOCUMENT
  );
  const noticeFindings = dedupeFindings(verified).filter(
    (candidate) => candidate.regulation === "Short Notice-of-Claim / Change Notice Waiver"
  );
  check(
    "C3. model-first weaker funding notice loses to the stronger three-day/five-day complete-waiver quote",
    noticeFindings.length === 1 &&
      noticeFindings[0].foundText.includes("three calendar days") &&
      noticeFindings[0].foundText.includes("five calendar days") &&
      noticeFindings[0].foundText.includes("complete waiver")
  );
}

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log("\nAll Fixture A sanity regression checks passed.");
