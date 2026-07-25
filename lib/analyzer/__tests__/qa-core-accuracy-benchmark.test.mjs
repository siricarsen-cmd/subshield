// Core benchmark regressions for clean-contract precision, construction/labor
// recall, cross-format normalization, exact-quote grounding, and Limited Scan
// safety. No model or live government-source request is made by this test.

import { runDeterministicDetectors } from "../deterministic.ts";
import { verifyFindings } from "../sanity.ts";
import { dedupeFindings, rankFindings, runAnalyzer } from "../report.ts";
import {
  assessExtractionConfidence,
  normalizeWhitespace,
  quoteExistsInDocument,
} from "../text.ts";
import {
  QA_B_REPRESENTATIONS,
  QA_D_REPRESENTATIONS,
  QA_E1_DEGRADED_FRAGMENT_DOCUMENT,
  QA_E1_IMAGE_ONLY_DOCUMENT,
} from "../__fixtures__/core-accuracy-benchmark-fixtures.mjs";

let assertions = 0;
let failures = 0;

function check(label, condition, details = "") {
  assertions++;
  if (condition) {
    console.log(`PASS: ${label}`);
    return;
  }

  console.error(`FAIL: ${label}${details ? ` — ${details}` : ""}`);
  failures++;
}

function runProductionDeterministicPath(rawText) {
  const documentText = normalizeWhitespace(rawText);
  const deterministic = runDeterministicDetectors(documentText);
  const { verified, dropped } = verifyFindings(deterministic, documentText);
  const deduped = dedupeFindings(verified, documentText);
  const { primaryTraps, secondaryConcerns } = rankFindings(deduped);
  return {
    documentText,
    deterministic,
    verified,
    dropped,
    deduped,
    finalFindings: [...primaryTraps, ...secondaryConcerns],
  };
}

function labelsOf(result) {
  return result.finalFindings.map((finding) => finding.regulation).sort();
}

// QA-B is intentionally clean and protective. The deterministic recall net must
// not turn attached documents, bilateral changes, Net-30 payment, verified
// defect correction, reasonable audit access, or compensated termination into
// adverse findings merely because those topics appear in the contract.
for (const [representationName, documentText] of QA_B_REPRESENTATIONS) {
  const confidence = assessExtractionConfidence(normalizeWhitespace(documentText));
  const result = runProductionDeterministicPath(documentText);
  const labels = labelsOf(result);

  check(`QA-B ${representationName}: extraction is confidently complete`, confidence.confident);
  check(
    `QA-B ${representationName}: clean protective contract has no deterministic adverse findings`,
    labels.length === 0,
    `observed ${labels.join(", ") || "none"}`
  );
  check(
    `QA-B ${representationName}: no candidate was dropped after being generated`,
    result.dropped.length === 0,
    `dropped ${result.dropped.map((finding) => finding.regulation).join(", ")}`
  );
}

// These are the current high-confidence deterministic identities that must be
// present in the fictional construction/labor fixture. The broader benchmark
// document deliberately lists additional provisional targets for the model and
// future regulatory-applicability layer; this test does not pretend the current
// deterministic scanner already covers every one of them.
const QA_D_REQUIRED_DETERMINISTIC_LABELS = [
  "Missing or Unresolved Wage Determination / Labor Standards Requirement",
  "Broad Setoff / Backcharge / Withholding Rights",
  "Short Notice-of-Claim / Change Notice Waiver",
  "Acceptance, Rejection, or Rework Without Clear Compensation",
  "Broad Indemnification / Duty to Defend",
  "Termination for Convenience",
  "Short Default Cure Period / Termination Discretion",
  "Continue-Performance Obligation During Payment Dispute",
].sort();

let canonicalQaDLabels = null;

for (const [representationName, documentText] of QA_D_REPRESENTATIONS) {
  const confidence = assessExtractionConfidence(normalizeWhitespace(documentText));
  const result = runProductionDeterministicPath(documentText);
  const labels = labelsOf(result);
  const labelSet = new Set(labels);

  check(`QA-D ${representationName}: extraction is confidently complete`, confidence.confident);

  for (const requiredLabel of QA_D_REQUIRED_DETERMINISTIC_LABELS) {
    check(
      `QA-D ${representationName}: detects ${requiredLabel}`,
      labelSet.has(requiredLabel),
      `observed ${labels.join(", ")}`
    );
  }

  check(
    `QA-D ${representationName}: every deterministic finding survives verification`,
    result.dropped.length === 0 && result.verified.length === result.deterministic.length,
    `generated ${result.deterministic.length}, verified ${result.verified.length}, dropped ${result.dropped.length}`
  );
  check(
    `QA-D ${representationName}: every final quote exists in the normalized source`,
    result.finalFindings.every((finding) =>
      quoteExistsInDocument(finding.foundText, result.documentText)
    )
  );
  check(
    `QA-D ${representationName}: every final analysis passes finding-local verification`,
    result.finalFindings.every(
      (finding) => verifyFindings([finding], finding.foundText).verified.length === 1
    )
  );

  const wageFinding = result.finalFindings.find(
    (finding) =>
      finding.regulation ===
      "Missing or Unresolved Wage Determination / Labor Standards Requirement"
  );
  check(
    `QA-D ${representationName}: wage-determination finding quotes absence and deferral evidence`,
    Boolean(
      wageFinding &&
        /Wage Determination WD 2026-CA-9999/i.test(wageFinding.foundText) &&
        /not attached at execution/i.test(wageFinding.foundText) &&
        /after mobilization/i.test(wageFinding.foundText)
    )
  );
  check(
    `QA-D ${representationName}: wage finding does not invent a wage rate or labor classification`,
    Boolean(
      wageFinding &&
        !/\$\d|electrician|carpenter|laborer rate|hourly rate/i.test(
          `${wageFinding.riskAnalysis} ${wageFinding.redlineFix}`
        )
    )
  );

  if (canonicalQaDLabels === null) canonicalQaDLabels = labels;
  else {
    check(
      `QA-D ${representationName}: material deterministic labels match the paragraph representation`,
      JSON.stringify(labels) === JSON.stringify(canonicalQaDLabels),
      `paragraph ${canonicalQaDLabels.join(", ")} vs ${representationName} ${labels.join(", ")}`
    );
  }
}

// QA-E1 is intentionally incomplete. Both the readable fragment and a fully
// image-only/empty extraction must stop before any model call and return the
// Limited Scan safety shape instead of a clean-contract result.
const qaE1Cases = [
  ["degraded readable fragments", QA_E1_DEGRADED_FRAGMENT_DOCUMENT, "QA-E1-TXT.txt"],
  ["image-only empty extraction", QA_E1_IMAGE_ONLY_DOCUMENT, "QA-E1-PDF.pdf"],
];

for (const [caseName, documentText, fileName] of qaE1Cases) {
  const confidence = assessExtractionConfidence(normalizeWhitespace(documentText), {
    pageCount: caseName.includes("image-only") ? 4 : undefined,
  });
  check(`QA-E1 ${caseName}: extraction is not treated as complete`, !confidence.confident);
  check(
    `QA-E1 ${caseName}: confidence gate explains why review is unreliable`,
    Boolean(confidence.reason && /too short|too few words|failed extraction|partial upload/i.test(confidence.reason))
  );

  const result = await runAnalyzer(documentText, fileName, {
    limitedScanReason: "Fictional QA-E1 incomplete-package benchmark.",
    confidenceHints: caseName.includes("image-only") ? { pageCount: 4 } : undefined,
  });

  check(`QA-E1 ${caseName}: production analyzer returns Limited Scan`, result.limitedScan === true);
  check(
    `QA-E1 ${caseName}: Limited Scan contains no definitive primary or secondary findings`,
    result.primaryTraps.length === 0 && result.secondaryConcerns.length === 0
  );
  check(`QA-E1 ${caseName}: Limited Scan does not draft a completed-review memo`, result.emailDraft === "");
  check(
    `QA-E1 ${caseName}: supplied safety reason is preserved`,
    result.limitedScanReason === "Fictional QA-E1 incomplete-package benchmark."
  );
}

if (failures > 0) {
  console.error(`\n${failures} of ${assertions} core accuracy benchmark assertions failed.`);
  process.exit(1);
}

console.log(`\nAll ${assertions} QA-B, QA-D, and QA-E1 accuracy benchmark assertions passed.`);
