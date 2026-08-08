import { runDeterministicDetectors } from "../deterministic.ts";
import { hasShortNoticeWaiverRiskEvidence, verifyFindings } from "../sanity.ts";

const NOTICE_WAIVER = "Short Notice-of-Claim / Change Notice Waiver";

const AURORA_INVOICE =
  "Prime Contractor will notify Subcontractor of any invoice defect within 7 business days after receipt and will provide a reasonable opportunity to correct it. A late or corrected invoice does not waive Subcontractor's right to payment.";
const AURORA_CHANGE =
  "Subcontractor should notify Prime Contractor within 15 business days after recognizing a potential change. A later notice does not waive adjustment rights unless Prime Contractor demonstrates material prejudice caused by the delay.";
const ORION_CHANGE =
  "If Subcontractor believes any Prime Contractor direction changes scope, price, staffing, deliverables, security requirements, or schedule, Subcontractor must notify Prime Contractor in writing within 2 business days after receiving the direction. Failure to provide timely notice waives Subcontractor's right to request additional compensation, equitable adjustment, or schedule relief related to the direction.";

const VARIANTS = {
  primeAdministrativeProtective:
    "Prime Contractor shall notify Subcontractor of a billing defect within 5 calendar days. A delayed invoice shall not forfeit Subcontractor's entitlement to payment.",
  subcontractorProtective:
    "Subcontractor must give written notice to Prime Contractor within 4 calendar days after recognizing a potential change. Failure to provide timely notice does not waive Subcontractor's right to an equitable adjustment unless Prime demonstrates material prejudice.",
  subcontractorProtectiveBar:
    "Subcontractor shall submit written notice no later than 3 business days after recognizing a change. Late notice shall not bar the claim unless Prime Contractor demonstrates material prejudice caused by the delay.",
  subcontractorTruePositive:
    "Subcontractor shall give written notice to Prime Contractor within 5 business days after recognizing a scope change. Failure to provide timely notice forfeits Subcontractor's entitlement to equitable adjustment and additional compensation.",
  subcontractorTruePositiveBar:
    "Subcontractor is required to submit written notice no later than 3 calendar days after recognizing a delay. Missing the deadline bars the Subcontractor's claim for schedule relief.",
  unrelatedAdministrativeRight:
    "Subcontractor must notify Prime Contractor within 3 business days after losing a site badge. Failure to do so waives Subcontractor's right to use the visitor parking lot until a replacement badge is issued.",
  multiStepQaDStyle:
    "Subcontractor must provide written notice within two calendar days after any event that may affect cost or time. Detailed pricing, schedule analysis, and supporting records are due within five calendar days. Failure to provide the two-day notice and five-day substantiation constitutes a complete waiver of any change request, delay claim, differing-site-condition claim, or request for additional compensation.",
  brokenLocalityChain:
    "Subcontractor must provide written notice within two calendar days after any event that may affect cost or time. Employees may use the east parking lot during normal business hours. A separate late claim for additional compensation is waived.",
};

let failures = 0;
function check(label, condition) {
  if (condition) {
    console.log(`PASS: ${label}`);
  } else {
    console.error(`FAIL: ${label}`);
    failures++;
  }
}

function simulatedModelFinding(foundText) {
  return {
    triggerType: "Contract Risk Trigger",
    regulation: NOTICE_WAIVER,
    severity: "Medium-High",
    foundText,
    riskAnalysis:
      "This provision is alleged to waive compensation or schedule rights when notice is late.",
    redlineFix: "Remove automatic waiver and preserve legitimate adjustment rights.",
    familyKey: "payment",
  };
}

function verifiedDeterministicNoticeFinding(documentText) {
  const deterministic = runDeterministicDetectors(documentText);
  return verifyFindings(deterministic, documentText).verified.find(
    (finding) => finding.regulation === NOTICE_WAIVER
  );
}

check(
  "A1. Aurora 7-day Prime invoice notice is not qualifying short-notice waiver evidence",
  !hasShortNoticeWaiverRiskEvidence(AURORA_INVOICE)
);
check(
  "A2. Aurora 7-day Prime invoice notice produces no verified short-notice finding",
  !verifiedDeterministicNoticeFinding(AURORA_INVOICE)
);
check(
  "A3. simulated model Aurora invoice false positive is rejected",
  verifyFindings([simulatedModelFinding(AURORA_INVOICE)], AURORA_INVOICE).verified.length === 0
);

check(
  "B1. Aurora 15-day anti-waiver/material-prejudice clause is not qualifying risk evidence",
  !hasShortNoticeWaiverRiskEvidence(AURORA_CHANGE)
);
check(
  "B2. Aurora 15-day protected change notice produces no verified short-notice finding",
  !verifiedDeterministicNoticeFinding(AURORA_CHANGE)
);
check(
  "B3. simulated model Aurora protected-change false positive is rejected",
  verifyFindings([simulatedModelFinding(AURORA_CHANGE)], AURORA_CHANGE).verified.length === 0
);

const orionFinding = verifiedDeterministicNoticeFinding(ORION_CHANGE);
check(
  "C1. Orion 2-day actual waiver remains qualifying short-notice risk evidence",
  hasShortNoticeWaiverRiskEvidence(ORION_CHANGE)
);
check(
  "C2. Orion 2-day actual waiver remains a verified deterministic finding",
  Boolean(orionFinding)
);
check(
  "C3. Orion verified quote remains grounded in the actual 2-day waiver language",
  Boolean(
    orionFinding &&
      ORION_CHANGE.includes(orionFinding.foundText) &&
      orionFinding.foundText.includes("2 business days") &&
      orionFinding.foundText.includes("waives Subcontractor's right")
  )
);
check(
  "C4. simulated model Orion true positive survives shared verification",
  verifyFindings([simulatedModelFinding(ORION_CHANGE)], ORION_CHANGE).verified.length === 1
);

check(
  "D1. Prime-facing 5-day administrative deadline with anti-forfeiture language stays negative",
  !hasShortNoticeWaiverRiskEvidence(VARIANTS.primeAdministrativeProtective)
);
check(
  "D2. mandatory Subcontractor notice with does-not-waive/material-prejudice protection stays negative",
  !hasShortNoticeWaiverRiskEvidence(VARIANTS.subcontractorProtective)
);
check(
  "D3. late-notice-shall-not-bar material-prejudice variant stays negative",
  !hasShortNoticeWaiverRiskEvidence(VARIANTS.subcontractorProtectiveBar)
);
check(
  "D4. genuine 5-day Subcontractor forfeiture variant remains positive",
  hasShortNoticeWaiverRiskEvidence(VARIANTS.subcontractorTruePositive)
);
check(
  "D5. genuine no-later-than 3-day barred-claim variant remains positive",
  hasShortNoticeWaiverRiskEvidence(VARIANTS.subcontractorTruePositiveBar)
);
check(
  "D6. genuine 5-day simulated model finding survives verification",
  verifyFindings(
    [simulatedModelFinding(VARIANTS.subcontractorTruePositive)],
    VARIANTS.subcontractorTruePositive
  ).verified.length === 1
);
check(
  "D7. protected 4-day simulated model finding is rejected",
  verifyFindings(
    [simulatedModelFinding(VARIANTS.subcontractorProtective)],
    VARIANTS.subcontractorProtective
  ).verified.length === 0
);
check(
  "D8. unrelated short administrative notice is not treated as a claim/change waiver",
  !hasShortNoticeWaiverRiskEvidence(VARIANTS.unrelatedAdministrativeRight)
);
check(
  "D9. unrelated administrative-right model finding is rejected",
  verifyFindings(
    [simulatedModelFinding(VARIANTS.unrelatedAdministrativeRight)],
    VARIANTS.unrelatedAdministrativeRight
  ).verified.length === 0
);
check(
  "D10. QA-D-style notice plus substantiation plus waiver remains positive",
  hasShortNoticeWaiverRiskEvidence(VARIANTS.multiStepQaDStyle)
);
check(
  "D11. unrelated intervening sentence breaks the notice-to-waiver locality chain",
  !hasShortNoticeWaiverRiskEvidence(VARIANTS.brokenLocalityChain)
);

if (failures > 0) {
  console.error(`\n${failures} short-notice regression check(s) failed.`);
  process.exit(1);
}

console.log("\nAll Aurora/Orion short-notice regression checks passed.");
