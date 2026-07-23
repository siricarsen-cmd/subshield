// Fixture C regressions for cyber/CUI coverage and finding-local grounding.
// The production path exercised here is deterministic detection ->
// verifyFindings -> dedupeFindings -> rankFindings. No model or live API runs.

import {
  runDeterministicDetectors,
  SAFE_MISSING_DOCUMENTS_REDLINE,
} from "../deterministic.ts";
import { extractClauseSegments } from "../clause-segments.ts";
import { verifyFindings } from "../sanity.ts";
import { buildPmMemo, dedupeFindings, rankFindings } from "../report.ts";
import { normalizeWhitespace, quoteExistsInDocument } from "../text.ts";
import {
  ALL_PAYMENT_WITHHOLDING_CLAUSE,
  ATTACHED_CYBER_DOCUMENTS_CLAUSE,
  ATTACHED_REVISABLE_CYBER_DOCUMENT_CLAUSE,
  BILATERAL_CYBER_AMENDMENT_CLAUSE,
  CMMC_ONLY_CLAUSE,
  COMPENSATED_REMEDIATION_CLAUSE,
  CONTINUED_PERFORMANCE_SELF_FINANCING_CLAUSE,
  CYBER_AUDIT_ACCESS_CLAUSE,
  CYBER_AUDIT_EVIDENCE_CLAUSE,
  CYBER_REMEDIATION_CONTEXT_CLAUSE,
  CYBER_INDEMNITY_WITH_PRIME_CONTRIBUTION_CLAUSE,
  DFARS_NIST_CYBER_CLAUSE,
  FIVE_DAY_TERMINATION_FOR_CONVENIENCE_CLAUSE,
  FIXTURE_C_BLANK_LINE_DOCUMENT,
  FIXTURE_C_FLATTENED_PASTE_DOCUMENT,
  FIXTURE_C_PDF_STYLE_DOCUMENT,
  FIXTURE_C_PRODUCTION_PDF_TEXT,
  FIXTURE_C_SINGLE_NEWLINE_DOCUMENT,
  FRAUD_ONLY_UNCAPPED_LIABILITY_CLAUSE,
  FUTURE_CYBER_REQUIREMENTS_CLAUSE,
  GENERIC_NON_CYBER_INDEMNITY_CLAUSE,
  IMMEDIATE_NO_CURE_TERMINATION_CLAUSE,
  MISSING_CYBER_DOCUMENTS_CLAUSE,
  NET_TWENTY_INVOICE_TIMING_CLAUSE,
  ORDINARY_CURE_TERMINATION_CLAUSE,
  ORDINARY_INVOICE_TIMING_CLAUSE,
  ORDINARY_REPORTING_CLAUSE,
  ORDINARY_SCHEDULED_AUDIT_CLAUSE,
  PAYMENT_HOLDING_CLAUSE,
  PRIME_DIRECTED_IMMEDIATE_RESPONSE_CLAUSE,
  PRIME_DIRECTED_RESPONSE_COSTS_CLAUSE,
  REMEDIATION_NO_EQ_ADJUSTMENT_CLAUSE,
  SHORT_INCIDENT_REPORTING_CLAUSE,
  UNRELATED_BEAR_ASSOCIATED_COST_CLAUSE,
  UNRELATED_COMPLY_IMMEDIATELY_CLAUSE,
  UNRELATED_EIGHT_HOURS_CLAUSE,
  WITHHOLDING_CONTINUED_PERFORMANCE_CLAUSE,
} from "../__fixtures__/fixture-c-qa-clauses.mjs";

let assertions = 0;
let failures = 0;

function check(label, condition) {
  assertions++;
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

function runProductionPath(extractedText) {
  const documentText = normalizeWhitespace(extractedText);
  const deterministic = runDeterministicDetectors(documentText);
  const { verified, dropped } = verifyFindings(deterministic, documentText);
  const deduped = dedupeFindings(verified);
  const { primaryTraps, secondaryConcerns } = rankFindings(deduped);
  return {
    documentText,
    deterministic,
    verified,
    dropped,
    deduped,
    primaryTraps,
    secondaryConcerns,
    finalFindings: [...primaryTraps, ...secondaryConcerns],
  };
}

function deterministicFinding(documentText, regulation) {
  return runDeterministicDetectors(documentText).find((finding) => finding.regulation === regulation);
}

const LABELS = {
  baseline: "DFARS 252.204-7012 / CUI / NIST SP 800-171 Cybersecurity Flowdown",
  missing: "Missing / Deferred Contract Documents",
  futureCyber: "Unilateral Future Cybersecurity Requirements",
  incident: "Accelerated Cyber Incident Reporting",
  response: "Prime-Directed Cyber Response Costs",
  auditAssessment: "Intrusive Cybersecurity Assessments",
  auditAccess: "Broad Cybersecurity System Access / Evidence Production",
  remediation: "Uncompensated Cyber Remediation / No Equitable Adjustment",
  percentageWithholding: "Percentage Invoice Withholding",
  allPaymentWithholding: "All-Payment Withholding",
  withholdingPerformance: "Continued Performance Despite Payment Withholding",
  paymentContinuedPerformance: "Continue-Performance Obligation During Payment Dispute",
  selfFinancedRemediation: "Continued Performance / Self-Financed Remediation During Dispute",
  indemnity: "Broad Indemnification / Duty to Defend",
  uncapped: "Uncapped Cyber Liability",
  noCure: "Short Default Cure Period / Termination Discretion",
  convenience: "Termination for Convenience",
};
const REQUIRED_LABELS = Object.entries(LABELS)
  .filter(([key]) => key !== "paymentContinuedPerformance")
  .map(([, label]) => label)
  .sort();

const EXTRACTION_REPRESENTATIONS = [
  ["blank-line", FIXTURE_C_BLANK_LINE_DOCUMENT],
  ["single-newline", FIXTURE_C_SINGLE_NEWLINE_DOCUMENT],
  ["PDF-style", FIXTURE_C_PDF_STYLE_DOCUMENT],
  ["flattened-paste", FIXTURE_C_FLATTENED_PASTE_DOCUMENT],
];

const pipeline = runProductionPath(FIXTURE_C_BLANK_LINE_DOCUMENT);
const finalLabels = pipeline.finalFindings.map((finding) => finding.regulation).sort();
const byLabel = new Map(pipeline.finalFindings.map((finding) => [finding.regulation, finding]));

check("A1. complete production path yields the exact Fixture C finding labels", JSON.stringify(finalLabels) === JSON.stringify(REQUIRED_LABELS));
check("A2. every deterministic Fixture C finding survives verification", pipeline.dropped.length === 0 && pipeline.verified.length === pipeline.deterministic.length);
check("A3. dedupe preserves every materially distinct Fixture C identity", pipeline.deduped.length === REQUIRED_LABELS.length);
check("A4. rankFindings preserves every materially distinct Fixture C identity", pipeline.finalFindings.length === REQUIRED_LABELS.length);
check("A5. every final quote exists in the normalized Fixture C source", pipeline.finalFindings.every((finding) => quoteExistsInDocument(finding.foundText, pipeline.documentText)));
check("A6. every final analysis passes finding-local verification against only its own quote", pipeline.finalFindings.every((finding) => verifyFindings([finding], finding.foundText).verified.length === 1));

const baseline = byLabel.get(LABELS.baseline);
check("B1. DFARS/NIST baseline quote contains both exact standards", baseline?.foundText.includes("DFARS 252.204-7012") && baseline.foundText.includes("NIST SP 800-171"));
check("B2. DFARS/NIST analysis states only the standards in its quote", baseline?.riskAnalysis.includes("DFARS 252.204-7012") && baseline.riskAnalysis.includes("NIST SP 800-171") && !/CMMC|lower-tier|attachment|deadline/i.test(baseline.riskAnalysis));

const missing = byLabel.get(LABELS.missing);
for (const [index, term] of ["System Security Plan", "CUI marking guide", "network boundary diagram", "data-flow map", "Prime cyber procedures"].entries()) {
  check(`B${index + 3}. missing-document quote contains ${term}`, missing?.foundText.includes(term));
}
check("B8. missing-document analysis is supported by local absence and deferral language", /not attached/i.test(missing?.foundText ?? "") && /provide or revise[^.]+after award/i.test(missing?.foundText ?? "") && /not attached|provided later/i.test(missing?.riskAnalysis ?? ""));

const futureCyber = byLabel.get(LABELS.futureCyber);
check("B9. future-cyber quote contains unilateral channel, binding notice, and no-adjustment facts", /email or portal posting/i.test(futureCyber?.foundText ?? "") && /binding upon notice/i.test(futureCyber?.foundText ?? "") && /without a price or schedule adjustment/i.test(futureCyber?.foundText ?? ""));
check("B10. future-cyber identity and analysis do not invent Prime Contract terms", !/Prime Contract/i.test(futureCyber?.regulation ?? "") && !/Prime Contract/i.test(futureCyber?.riskAnalysis ?? ""));

const incident = byLabel.get(LABELS.incident);
const response = byLabel.get(LABELS.response);
check("B11. section 4.1 incident reporting remains a separate finding", incident?.foundText.startsWith("4.1 ") && !/containment|associated cost/i.test(incident.foundText));
check("B12. section 4.1 analysis states the exact eight-hour deadline only", /within eight hours/i.test(incident?.riskAnalysis ?? "") && !/response|cost|containment/i.test(incident?.riskAnalysis ?? ""));
check("B13. section 4.4 response obligations remain a separate finding", response?.foundText.startsWith("4.4 ") && !/within eight hours/i.test(response.foundText));
check("B14. section 4.4 analysis mentions only locally stated actions, immediacy, and cost", /containment|credential reset|forensic imaging/i.test(response?.riskAnalysis ?? "") && /immediate compliance/i.test(response?.riskAnalysis ?? "") && /associated cost/i.test(response?.riskAnalysis ?? "") && !/eight hours|incident reporting/i.test(response?.riskAnalysis ?? ""));
check("B15. sections 4.1 and 4.4 survive as different objects and quotes", incident !== response && incident?.foundText !== response?.foundText);

const auditAssessment = byLabel.get(LABELS.auditAssessment);
const auditAccess = byLabel.get(LABELS.auditAccess);
const remediation = byLabel.get(LABELS.remediation);
check("B16. section 5.1 intrusive assessment survives locally", auditAssessment?.foundText.startsWith("5.1 ") && /unannounced cybersecurity assessments/i.test(auditAssessment.foundText));
check("B17. section 5.2 administrative access/evidence production survives locally", auditAccess?.foundText.startsWith("5.2 ") && /administrative access/i.test(auditAccess.foundText) && /without additional charge/i.test(auditAccess.foundText));
check("B18. sections 5.1 and 5.2 remain distinct findings", auditAssessment?.foundText !== auditAccess?.foundText);
check("B19. complete contiguous sections 5.3-5.4 ground cyber remediation", remediation?.foundText.startsWith("5.3 ") && /cybersecurity posture/i.test(remediation.foundText) && /5\.4 A suspension or remediation directive/i.test(remediation.foundText) && /does not entitle[^.]+equitable adjustment/i.test(remediation.foundText) && !/8\.1 /i.test(remediation.foundText));

const percentage = byLabel.get(LABELS.percentageWithholding);
const allPayment = byLabel.get(LABELS.allPaymentWithholding);
const withholdingPerformance = byLabel.get(LABELS.withholdingPerformance);
check("B20. section 8.1 percentage withholding has its own exact identity", percentage?.foundText.startsWith("8.1 ") && /twenty percent of any invoice/i.test(percentage.foundText) && !/withhold all payment/i.test(percentage.foundText));
check("B21. section 8.2 all-payment withholding has its own exact identity", allPayment?.foundText.startsWith("8.2 ") && /withhold all payment/i.test(allPayment.foundText) && !/twenty percent/i.test(allPayment.foundText));
check("B22. all-payment analysis states only conditions in section 8.2", /incident investigation/i.test(allPayment?.riskAnalysis ?? "") && /assessment dispute/i.test(allPayment?.riskAnalysis ?? "") && /score deficiency/i.test(allPayment?.riskAnalysis ?? "") && /flowdown failure/i.test(allPayment?.riskAnalysis ?? "") && !/costs|damages|neutral|adjudicat/i.test(allPayment?.riskAnalysis ?? ""));
check("B23. section 8.3 continued performance despite withholding remains separate", withholdingPerformance?.foundText.startsWith("8.3 ") && /withholding does not relieve/i.test(withholdingPerformance.foundText) && !/twenty percent|withhold all payment/i.test(withholdingPerformance.foundText));

const continuedPerformance = byLabel.get(LABELS.selfFinancedRemediation);
check("B24. section 10.3 continued performance/self-financing remains local", continuedPerformance?.foundText.startsWith("10.3 ") && /continue performance/i.test(continuedPerformance.foundText) && /finance all required remediation/i.test(continuedPerformance.foundText) && /follow Prime direction/i.test(continuedPerformance.foundText));
check("B25. section 10.3 analysis does not invent payment or withholding facts", !/payment|withhold|delayed/i.test(continuedPerformance?.riskAnalysis ?? "") && /dispute|investigation/i.test(continuedPerformance?.riskAnalysis ?? "") && /finance required remediation/i.test(continuedPerformance?.riskAnalysis ?? ""));
check("B25b. no-payment section 10.3 never receives the payment-dispute title", !byLabel.has(LABELS.paymentContinuedPerformance));

const indemnity = byLabel.get(LABELS.indemnity);
const uncapped = byLabel.get(LABELS.uncapped);
check("B26. section 9.1 remains a genuine broad indemnity finding", indemnity?.foundText.startsWith("9.1 ") && /indemnify, defend, and hold harmless/i.test(indemnity.foundText));
check("B27. section 9.1 analysis does not import Prime contribution or unstated allegations", !/Prime(?:'s)? (?:fault|contribution)|alleged noncompliance/i.test(indemnity?.riskAnalysis ?? ""));
check("B28. section 9.3 remains a distinct High uncapped-cyber finding", uncapped?.severity === "High" && uncapped.foundText.startsWith("9.3 ") && /No limitation of liability applies to cybersecurity/i.test(uncapped.foundText));
check("B29. indemnity and uncapped liability survive dedupe as different findings", indemnity?.foundText !== uncapped?.foundText);

const noCure = byLabel.get(LABELS.noCure);
const convenience = byLabel.get(LABELS.convenience);
check("B30. section 10.1 immediate no-cure termination survives", noCure?.foundText.startsWith("10.1 ") && /terminate immediately, without any right to cure/i.test(noCure.foundText));
check("B31. section 10.1 analysis states only immediate no-cure exposure", /immediate termination without a right to cure/i.test(noCure?.riskAnalysis ?? "") && !/five|convenience|recovery/i.test(noCure?.riskAnalysis ?? ""));
check("B32. section 10.2 convenience termination survives with local notice and exclusions", convenience?.foundText.startsWith("10.2 ") && /five calendar days notice/i.test(convenience.foundText) && /not liable for unabsorbed overhead/i.test(convenience.foundText));
check("B33. section 10.2 analysis uses its own five-day notice", /five calendar days notice/i.test(convenience?.riskAnalysis ?? "") && !/immediate|right to cure/i.test(convenience?.riskAnalysis ?? ""));

// Positive and negative clause-level controls.
check("C1. explicit missing/deferred cyber documents trigger", Boolean(deterministicFinding(MISSING_CYBER_DOCUMENTS_CLAUSE, LABELS.missing)));
check("C2. attached cyber documents do not trigger missing/deferred finding", !deterministicFinding(ATTACHED_CYBER_DOCUMENTS_CLAUSE, LABELS.missing));
check("C3. attached document revision after award is not absence or deferral", !deterministicFinding(ATTACHED_REVISABLE_CYBER_DOCUMENT_CLAUSE, LABELS.missing));
check("C4. silence is not evidence of missing cyber documents", !deterministicFinding("The parties executed this Subcontract.", LABELS.missing));
check("C5. SSP uses a word boundary and does not match responsibility", !deterministicFinding("Subcontractor accepts responsibility for security performance.", LABELS.missing));
check("C6. ordinary security procedures are recognized when expressly missing", Boolean(deterministicFinding("The SSP and security procedures are not attached at execution.", LABELS.missing)));

check("C7. unilateral future cyber requirements trigger", Boolean(deterministicFinding(FUTURE_CYBER_REQUIREMENTS_CLAUSE, LABELS.futureCyber)));
check("C8. bilateral cyber amendment with agreed adjustment stays negative", !deterministicFinding(BILATERAL_CYBER_AMENDMENT_CLAUSE, LABELS.futureCyber));
check("C9. favorable bilateral language elsewhere cannot suppress an adverse clause", Boolean(deterministicFinding(`${BILATERAL_CYBER_AMENDMENT_CLAUSE}\n\n${FUTURE_CYBER_REQUIREMENTS_CLAUSE}`, LABELS.futureCyber)));
{
  const extractionTrapDocument = "1.3 Subcontractor uses DFARS 252.204-7012, FAR 52.204-21, version 2.4 Release, $10.50 Million, 20.25 Percent, and the date 12.31 December 2026. 4.1 Subcontractor shall report a cyber incident within eight hours.";
  const clauseNumbers = extractClauseSegments(extractionTrapDocument).map((segment) => segment.number).filter(Boolean);
  check("C9b. citations, money, percentages, versions, and dates are not clause boundaries", JSON.stringify(clauseNumbers) === JSON.stringify(["1.3", "4.1"]));
}

check("C10. local eight-hour cyber-incident reporting triggers", Boolean(deterministicFinding(SHORT_INCIDENT_REPORTING_CLAUSE, LABELS.incident)));
check("C11. reasonable-period incident reporting stays negative", !deterministicFinding(ORDINARY_REPORTING_CLAUSE, LABELS.incident));
check("C12. unrelated within-eight-hours language stays negative", !deterministicFinding(UNRELATED_EIGHT_HOURS_CLAUSE, LABELS.incident));
check("C13. nonadjacent cyber context cannot import an unrelated eight-hour phrase", !deterministicFinding(`A suspected cyber incident shall be reported promptly.\n\n${UNRELATED_EIGHT_HOURS_CLAUSE}`, LABELS.incident));
for (const [deadline, shouldTrigger] of [
  ["within 8 hours", true],
  ["within eight hours", true],
  ["within 24 hours", true],
  ["within twenty-four hours", true],
  ["within 72 hours", false],
  ["within seventy-two hours", false],
  ["within 99 hours", false],
]) {
  const clause = `4.1 Subcontractor shall report a suspected cyber incident to Prime ${deadline} after discovery.`;
  const finding = deterministicFinding(clause, LABELS.incident);
  check(`C13 deadline control: ${deadline} ${shouldTrigger ? "triggers" : "stays negative"}`, shouldTrigger ? Boolean(finding && finding.riskAnalysis.includes(deadline)) : !finding);
}
check("C13 remediation within eight hours is not a reporting identity", !deterministicFinding("4.1 Subcontractor shall remediate a cyber incident within eight hours after discovery.", LABELS.incident));

check("C14. Prime-directed response with immediate compliance and cost triggers", Boolean(deterministicFinding(PRIME_DIRECTED_RESPONSE_COSTS_CLAUSE, LABELS.response)));
const immediateResponse = deterministicFinding(PRIME_DIRECTED_IMMEDIATE_RESPONSE_CLAUSE, LABELS.response);
check("C15. Prime-directed response with immediate compliance but no cost statement stays negative", !immediateResponse);
check("C16. a Response Costs title always has local cost-bearing evidence", !immediateResponse && /bear all associated cost/i.test(deterministicFinding(PRIME_DIRECTED_RESPONSE_COSTS_CLAUSE, LABELS.response)?.foundText ?? ""));
check("C17. unrelated comply-immediately language stays negative", !deterministicFinding(UNRELATED_COMPLY_IMMEDIATELY_CLAUSE, LABELS.response));
check("C18. unrelated bear-associated-cost language stays negative", !deterministicFinding(UNRELATED_BEAR_ASSOCIATED_COST_CLAUSE, LABELS.response));
check("C19. nonadjacent direction, immediate compliance, and cost phrases cannot combine", !deterministicFinding(`Prime may direct ordinary project administration.\n\n${UNRELATED_COMPLY_IMMEDIATELY_CLAUSE}\n\n${UNRELATED_BEAR_ASSOCIATED_COST_CLAUSE}`, LABELS.response));
check("C19 generic restoration plus cost outside cyber context stays negative", !deterministicFinding("4.4 Prime may direct restoration and employee interviews. Subcontractor shall bear all associated cost.", LABELS.response));
check("C19b. multiple generic response actions without a cyber-specific action stay negative", !deterministicFinding("4.4 Prime may direct containment, employee interviews, and restoration actions. Subcontractor shall bear all associated cost.", LABELS.response));
check("C19c. one cyber-specific action without multiple response actions stays negative", !deterministicFinding("4.4 Prime may direct credential reset. Subcontractor shall bear all associated cost.", LABELS.response));

check("C20. unannounced cybersecurity assessment triggers", Boolean(deterministicFinding(CYBER_AUDIT_ACCESS_CLAUSE, LABELS.auditAssessment)));
check("C21. administrative access and broad evidence without charge triggers", Boolean(deterministicFinding(CYBER_AUDIT_EVIDENCE_CLAUSE, LABELS.auditAccess)));
check("C22. ordinary scheduled audit of defined records stays negative", !deterministicFinding(ORDINARY_SCHEDULED_AUDIT_CLAUSE, LABELS.auditAssessment) && !deterministicFinding(ORDINARY_SCHEDULED_AUDIT_CLAUSE, LABELS.auditAccess));
check("C23. contiguous cyber context and uncompensated remediation clauses trigger", Boolean(deterministicFinding(`${CYBER_REMEDIATION_CONTEXT_CLAUSE}\n${REMEDIATION_NO_EQ_ADJUSTMENT_CLAUSE}`, LABELS.remediation)));
check("C24. compensated negotiated remediation stays negative", !deterministicFinding(COMPENSATED_REMEDIATION_CLAUSE, LABELS.remediation));
check("C24b. ordinary non-cyber suspension without adjustment stays negative", !deterministicFinding("A weather suspension does not excuse schedule performance and does not entitle Subcontractor to an equitable adjustment.", LABELS.remediation));
check("C24c. environmental remediation does not receive a cyber label", !deterministicFinding("5.4 Environmental remediation shall continue without schedule relief and does not entitle Subcontractor to an equitable adjustment.", LABELS.remediation));
check("C24d. construction-defect remediation does not receive a cyber label", !deterministicFinding("5.4 A construction defect remediation directive does not excuse schedule performance and creates no equitable adjustment.", LABELS.remediation));

for (const percentage of ["10%", "15 percent", "20%", "25 percent"]) {
  const clause = `8.1 Prime may withhold up to ${percentage} of any invoice until Subcontractor provides all requested cybersecurity evidence.`;
  const finding = deterministicFinding(clause, LABELS.percentageWithholding);
  check(`C25. ${percentage} cyber-evidence invoice withholding triggers and is echoed`, Boolean(finding && finding.riskAnalysis.includes(`up to ${percentage}`)));
}
check("C26. all-payment conditional withholding triggers exact identity", Boolean(deterministicFinding(ALL_PAYMENT_WITHHOLDING_CLAUSE, LABELS.allPaymentWithholding)));
check("C27. withholding continued-performance clause triggers exact identity", Boolean(deterministicFinding(WITHHOLDING_CONTINUED_PERFORMANCE_CLAUSE, LABELS.withholdingPerformance)));
check("C28. Net-30 ordinary invoice timing stays negative", !deterministicFinding(ORDINARY_INVOICE_TIMING_CLAUSE, LABELS.percentageWithholding) && !deterministicFinding(ORDINARY_INVOICE_TIMING_CLAUSE, LABELS.allPaymentWithholding));
check("C29. Net-20 ordinary invoice timing stays negative", !deterministicFinding(NET_TWENTY_INVOICE_TIMING_CLAUSE, LABELS.percentageWithholding) && !deterministicFinding(NET_TWENTY_INVOICE_TIMING_CLAUSE, LABELS.allPaymentWithholding));
check("C29b. ordinary construction retainage is not cyber-evidence withholding", !deterministicFinding("Prime may retain twenty percent of each progress invoice until final completion of the construction work.", LABELS.percentageWithholding));

check("C30. section 10.3 dispute/investigation self-financing triggers its grounded identity", Boolean(deterministicFinding(CONTINUED_PERFORMANCE_SELF_FINANCING_CLAUSE, LABELS.selfFinancedRemediation)));
check("C30a. no-payment section 10.3 never triggers the payment-dispute identity", !deterministicFinding(CONTINUED_PERFORMANCE_SELF_FINANCING_CLAUSE, LABELS.paymentContinuedPerformance));
check("C30b. Prime direction during a dispute without continued performance stays negative", !deterministicFinding("Pending a dispute, Subcontractor shall follow Prime direction on document formatting.", LABELS.selfFinancedRemediation));
const paymentDisputePerformance = deterministicFinding("Pending final resolution of any payment dispute, Subcontractor shall continue performance and finance continued performance.", LABELS.paymentContinuedPerformance);
check("C30c. genuine payment-dispute continued performance keeps the existing grounded identity", Boolean(paymentDisputePerformance && /payment|withhold/i.test(paymentDisputePerformance.foundText)));
const genericIndemnity = deterministicFinding(GENERIC_NON_CYBER_INDEMNITY_CLAUSE, LABELS.indemnity);
check("C31. generic non-cyber indemnity remains reportable", Boolean(genericIndemnity));
check("C32. generic non-cyber indemnity analysis remains generic", Boolean(genericIndemnity && !/cyber|notification|forensic|Prime fault|contribution/i.test(genericIndemnity.riskAnalysis)));
check("C33. fraud-only no-cap clause does not trigger uncapped cyber liability", !deterministicFinding(FRAUD_ONLY_UNCAPPED_LIABILITY_CLAUSE, LABELS.uncapped));
check("C34. balanced mutual cap does not trigger uncapped cyber liability", !deterministicFinding("Except for fraud and willful misconduct, each party's aggregate liability is limited to the total Subcontract price.", LABELS.uncapped));
check("C35. ordinary thirty-day cure language stays negative", !deterministicFinding(ORDINARY_CURE_TERMINATION_CLAUSE, LABELS.noCure));
check("C36. immediate no-cure language triggers", Boolean(deterministicFinding(IMMEDIATE_NO_CURE_TERMINATION_CLAUSE, LABELS.noCure)));
check("C37. five-day convenience termination with excluded recovery triggers", Boolean(deterministicFinding(FIVE_DAY_TERMINATION_FOR_CONVENIENCE_CLAUSE, LABELS.convenience)));

const cmmcOnly = deterministicFinding(CMMC_ONLY_CLAUSE, LABELS.baseline);
check("D1. CMMC-only clause still receives a cyber-baseline finding", Boolean(cmmcOnly));
check("D2. CMMC-only analysis mentions CMMC but not DFARS or NIST", Boolean(cmmcOnly && /CMMC/i.test(cmmcOnly.riskAnalysis) && !/DFARS|NIST/i.test(cmmcOnly.riskAnalysis)));

// Simulated model findings prove unsupported facts cannot borrow evidence from
// riskAnalysis, redlineFix, or a nonadjacent clause.
for (const [label, finding, documentText, expectedReason] of [
  [
    "D3. DFARS/NIST overclaim on a CMMC-only quote is rejected",
    mkFinding({ familyKey: "cyber", regulation: LABELS.baseline, foundText: CMMC_ONLY_CLAUSE, riskAnalysis: "This clause imposes DFARS 252.204-7012 and NIST SP 800-171." }),
    CMMC_ONLY_CLAUSE,
    /DFARS requirement|NIST SP 800-171 requirement/i,
  ],
  [
    "D4. missing-attachment claim without local absence language is rejected",
    mkFinding({ familyKey: "cyber", regulation: LABELS.baseline, foundText: DFARS_NIST_CYBER_CLAUSE, riskAnalysis: "The cyber attachment is not attached and will be provided later." }),
    DFARS_NIST_CYBER_CLAUSE,
    /missing or deferred|absence or deferral/i,
  ],
  [
    "D5. nonadjacent eight-hour phrase cannot support an incident-deadline analysis",
    mkFinding({ familyKey: "cyber", regulation: LABELS.incident, foundText: ORDINARY_REPORTING_CLAUSE, riskAnalysis: "The cyber incident must be reported within eight hours." }),
    `${ORDINARY_REPORTING_CLAUSE}\n\n${UNRELATED_EIGHT_HOURS_CLAUSE}`,
    /deadline|timeframe/i,
  ],
  [
    "D6. lower-tier flowdown claim without local lower-tier language is rejected",
    mkFinding({ familyKey: "cyber", regulation: LABELS.baseline, foundText: DFARS_NIST_CYBER_CLAUSE, riskAnalysis: "The clause requires lower-tier flowdown of the cyber requirements." }),
    DFARS_NIST_CYBER_CLAUSE,
    /lower-tier flowdown/i,
  ],
  [
    "D7. indemnity Prime-contribution/cost/allegation overclaim is rejected",
    mkFinding({ familyKey: "liability", regulation: LABELS.indemnity, foundText: GENERIC_NON_CYBER_INDEMNITY_CLAUSE, riskAnalysis: "The indemnity applies regardless of Prime contribution and covers response costs, notification costs, forensic costs, and allegations of noncompliance." }),
    GENERIC_NON_CYBER_INDEMNITY_CLAUSE,
    /Prime fault|Prime.*contribution|response costs|notification costs|forensic costs|allegations/i,
  ],
  [
    "D8. withholding analysis cannot invent costs, damages, or adjudication procedure",
    mkFinding({ familyKey: "payment", regulation: LABELS.percentageWithholding, foundText: PAYMENT_HOLDING_CLAUSE, riskAnalysis: "Prime may recover costs and damages through unilateral adjudication without a neutral procedure." }),
    PAYMENT_HOLDING_CLAUSE,
    /costs|damages|unilateral determination|neutral procedure/i,
  ],
  [
    "D9. section 10.3 analysis cannot import payment or withholding facts",
    mkFinding({ familyKey: "liability", regulation: LABELS.selfFinancedRemediation, foundText: CONTINUED_PERFORMANCE_SELF_FINANCING_CLAUSE, riskAnalysis: "The Subcontractor must perform while payment is delayed and withheld." }),
    `${CONTINUED_PERFORMANCE_SELF_FINANCING_CLAUSE}\n\n${ALL_PAYMENT_WITHHOLDING_CLAUSE}`,
    /payment or withholding facts/i,
  ],
]) {
  const result = verifyFindings([finding], documentText);
  check(label, result.verified.length === 0 && result.dropped.length === 1 && expectedReason.test(result.dropped[0].reason));
}

const contiguousPrimeContribution = mkFinding({
  familyKey: "liability",
  regulation: LABELS.indemnity,
  foundText: CYBER_INDEMNITY_WITH_PRIME_CONTRIBUTION_CLAUSE,
  riskAnalysis: "The quoted indemnity expressly applies when Prime contributed to the incident.",
  redlineFix: "Limit indemnity to loss caused by Subcontractor.",
});
{
  const result = verifyFindings([contiguousPrimeContribution], CYBER_INDEMNITY_WITH_PRIME_CONTRIBUTION_CLAUSE);
  check("D10. complete contiguous sections 9.1-9.2 support Prime-contribution analysis", result.verified.length === 1 && result.dropped.length === 0);
}

{
  const simulatedModelFutureCyber = mkFinding({
    familyKey: "structure",
    regulation: "Contract Structure & Missing Documents",
    severity: "High",
    foundText: FUTURE_CYBER_REQUIREMENTS_CLAUSE,
    riskAnalysis: "Later cybersecurity requirements become binding on notice without a price or schedule adjustment.",
  });
  const deterministic = runDeterministicDetectors(FUTURE_CYBER_REQUIREMENTS_CLAUSE);
  const { verified } = verifyFindings([simulatedModelFutureCyber, ...deterministic], FUTURE_CYBER_REQUIREMENTS_CLAUSE);
  const deduped = dedupeFindings(verified);
  check("D11. model/deterministic future-cyber collision keeps one exact cyber identity", deduped.length === 1 && deduped[0].regulation === LABELS.futureCyber && deduped[0].familyKey === "cyber");
}

{
  const separatedEvidence = [
    "2.1 Subcontractor maintains a cybersecurity program.",
    "2.2 Routine supplies receive no price or schedule adjustment.",
    "2.3 Any future requirement applies only through a mutually signed bilateral amendment.",
  ].join(" ");
  const modelFinding = mkFinding({
    familyKey: "structure",
    regulation: "Contract Structure & Missing Documents",
    foundText: separatedEvidence,
    riskAnalysis: "The quoted terms describe contract administration.",
  });
  const [deduped] = dedupeFindings([modelFinding]);
  check("D12. canonicalization never bridges nonadjacent cyber, no-adjustment, and bilateral-protection clauses", deduped.regulation === modelFinding.regulation && !deterministicFinding(separatedEvidence, LABELS.futureCyber));
}

for (const [formatName, extraction] of EXTRACTION_REPRESENTATIONS) {
  const result = runProductionPath(extraction);
  const labels = result.finalFindings.map((finding) => finding.regulation).sort();
  const findings = new Map(result.finalFindings.map((finding) => [finding.regulation, finding]));
  const incidentQuote = findings.get(LABELS.incident)?.foundText ?? "";
  const responseQuote = findings.get(LABELS.response)?.foundText ?? "";
  const assessmentQuote = findings.get(LABELS.auditAssessment)?.foundText ?? "";
  const accessQuote = findings.get(LABELS.auditAccess)?.foundText ?? "";
  const remediationQuote = findings.get(LABELS.remediation)?.foundText ?? "";
  const percentageQuote = findings.get(LABELS.percentageWithholding)?.foundText ?? "";
  const allPaymentQuote = findings.get(LABELS.allPaymentWithholding)?.foundText ?? "";
  const withholdingPerformanceQuote = findings.get(LABELS.withholdingPerformance)?.foundText ?? "";
  const noCureQuote = findings.get(LABELS.noCure)?.foundText ?? "";
  const convenienceQuote = findings.get(LABELS.convenience)?.foundText ?? "";
  const selfFinancedQuote = findings.get(LABELS.selfFinancedRemediation)?.foundText ?? "";

  check(`E ${formatName}: every required identity survives`, JSON.stringify(labels) === JSON.stringify(REQUIRED_LABELS));
  check(`E ${formatName}: verification drops no deterministic identity`, result.dropped.length === 0 && result.verified.length === result.deterministic.length);
  check(`E ${formatName}: dedupe preserves all materially distinct identities`, result.deduped.length === REQUIRED_LABELS.length && result.finalFindings.length === REQUIRED_LABELS.length);
  check(`E ${formatName}: every quote verifies against normalized source`, result.finalFindings.every((finding) => quoteExistsInDocument(finding.foundText, result.documentText)));
  check(`E ${formatName}: every analysis is supported by its own quote`, result.finalFindings.every((finding) => verifyFindings([finding], finding.foundText).verified.length === 1));
  check(`E ${formatName}: 4.1 and 4.4 retain distinct clause-local quotes`, incidentQuote.startsWith("4.1 ") && responseQuote.startsWith("4.4 ") && incidentQuote !== responseQuote && !/4\.2 |4\.3 |4\.4 /.test(incidentQuote) && !/5\.1 /.test(responseQuote));
  check(`E ${formatName}: 5.1 and 5.2 retain distinct clause-local quotes`, assessmentQuote.startsWith("5.1 ") && accessQuote.startsWith("5.2 ") && assessmentQuote !== accessQuote && !/5\.2 /.test(assessmentQuote) && !/5\.3 /.test(accessQuote));
  check(`E ${formatName}: remediation uses only the contiguous 5.3-5.4 passage`, remediationQuote.startsWith("5.3 ") && /5\.4 /.test(remediationQuote) && !/5\.2 |8\.1 /.test(remediationQuote));
  check(`E ${formatName}: 8.1, 8.2, and 8.3 retain three distinct quotes`, new Set([percentageQuote, allPaymentQuote, withholdingPerformanceQuote]).size === 3 && percentageQuote.startsWith("8.1 ") && allPaymentQuote.startsWith("8.2 ") && withholdingPerformanceQuote.startsWith("8.3 ") && !/8\.2 /.test(percentageQuote) && !/8\.3 /.test(allPaymentQuote) && !/9\.1 /.test(withholdingPerformanceQuote));
  check(`E ${formatName}: 10.1, 10.2, and 10.3 retain three distinct quotes`, new Set([noCureQuote, convenienceQuote, selfFinancedQuote]).size === 3 && noCureQuote.startsWith("10.1 ") && convenienceQuote.startsWith("10.2 ") && selfFinancedQuote.startsWith("10.3 ") && selfFinancedQuote.endsWith("mission work.") && !/10\.2 /.test(noCureQuote) && !/10\.3 /.test(convenienceQuote));
  check(`E ${formatName}: finding titles are grounded by their own quote`, /cost/i.test(responseQuote) && /cyber|security/i.test(remediationQuote) && !findings.has(LABELS.paymentContinuedPerformance));
  if (formatName === "PDF-style") {
    check("E PDF-style: page footer is excluded from the preceding 5.2 quote", !/SUBSHIELD CYBER TERMS|Page 5 of 12/i.test(accessQuote));
  }
}

// Literal report-124 production shape: real headings, plain-text footer, exact
// section 4.4 wording, and the observed associated/cost line wrap.
{
  const result = runProductionPath(FIXTURE_C_PRODUCTION_PDF_TEXT);
  const finalByLabel = new Map(result.finalFindings.map((finding) => [finding.regulation, finding]));
  const response = finalByLabel.get(LABELS.response);
  const currentlyCorrectLabels = REQUIRED_LABELS.filter((label) => label !== LABELS.response);

  for (const [stageName, findings] of [
    ["deterministic construction", result.deterministic],
    ["verification", result.verified],
    ["dedupe", result.deduped],
    ["ranking", result.finalFindings],
  ]) {
    check(
      `F1 ${stageName}: production section 4.4 response-cost identity survives`,
      findings.some((finding) => finding.regulation === LABELS.response)
    );
  }

  check(
    "F2. production section 4.4 exact quote verifies",
    Boolean(response && quoteExistsInDocument(response.foundText, result.documentText))
  );
  check(
    "F3. production section 4.4 retains singular associated cost",
    Boolean(response && /bear all associated cost\.$/i.test(response.foundText) && !/associated costs/i.test(response.foundText))
  );
  check(
    "F4. production section 4.4 quote ends before the section 5 heading",
    Boolean(response && response.foundText.endsWith("associated cost.") && !/5\. CYBERSECURITY ASSESSMENTS/i.test(response.foundText))
  );
  check(
    "F5. production response analysis stays grounded in associated cost wording",
    Boolean(response && /associated cost/i.test(response.riskAnalysis) && !/response costs/i.test(response.riskAnalysis))
  );

  const modelStyleUnsupportedResponse = mkFinding({
    familyKey: "cyber",
    regulation: LABELS.response,
    severity: "High",
    foundText: response?.foundText ?? PRIME_DIRECTED_RESPONSE_COSTS_CLAUSE,
    riskAnalysis: "This clause imposes Prime-directed cyber response costs on the Subcontractor.",
  });
  const unsupportedResponseResult = verifyFindings(
    [modelStyleUnsupportedResponse],
    response?.foundText ?? PRIME_DIRECTED_RESPONSE_COSTS_CLAUSE
  );
  check(
    "F6. sanity still rejects unsupported literal response-costs analysis",
    unsupportedResponseResult.verified.length === 0 &&
      unsupportedResponseResult.dropped.length === 1 &&
      /response costs/i.test(unsupportedResponseResult.dropped[0].reason)
  );

  check(
    "F7. all 15 currently correct report-124 identities remain present",
    currentlyCorrectLabels.every((label) => finalByLabel.has(label))
  );
  check(
    "F8. production shape yields the exact 16 expected identities",
    result.finalFindings.length === 16 &&
      JSON.stringify(result.finalFindings.map((finding) => finding.regulation).sort()) === JSON.stringify(REQUIRED_LABELS)
  );

  for (const [label, trailingHeading] of [
    [LABELS.missing, /2\. REQUIRED CYBER FRAMEWORKS/i],
    [LABELS.futureCyber, /3\. CUI AND DATA HANDLING/i],
    [LABELS.response, /5\. CYBERSECURITY ASSESSMENTS/i],
    [LABELS.remediation, /6\. LOWER-TIER FLOWDOWNS/i],
    [LABELS.withholdingPerformance, /9\. CYBER INDEMNITY/i],
    [LABELS.uncapped, /10\. TERMINATION AND CONTINUED PERFORMANCE/i],
    [LABELS.selfFinancedRemediation, /11\. SURVIVAL AND ACKNOWLEDGMENT/i],
  ]) {
    check(
      `F9 ${label}: quote stops before its following top-level heading`,
      Boolean(finalByLabel.get(label) && !trailingHeading.test(finalByLabel.get(label).foundText))
    );
  }

  const access = finalByLabel.get(LABELS.auditAccess);
  check(
    "F10. production section 5.2 quote excludes the plain-text footer",
    Boolean(access && !/-- 1 of 2 --|QA-C|Fictional Test Document|Page 2/i.test(access.foundText))
  );

  const remediation = finalByLabel.get(LABELS.remediation);
  check(
    "F11. production sections 5.3-5.4 remain one contiguous evidence passage",
    Boolean(
      remediation &&
        remediation.foundText.startsWith("5.3 ") &&
        /5\.4 A suspension or remediation directive/i.test(remediation.foundText) &&
        !/6\. LOWER-TIER FLOWDOWNS/i.test(remediation.foundText) &&
        quoteExistsInDocument(remediation.foundText, result.documentText)
    )
  );

  const missing = finalByLabel.get(LABELS.missing);
  check(
    "F12. production missing-document redline uses only the safe generic recommendation",
    Boolean(
      missing &&
        missing.redlineFix === SAFE_MISSING_DOCUMENTS_REDLINE &&
        !/Statement of Work|flowdown matrix|Prime Contract excerpts/i.test(missing.redlineFix)
    )
  );

  const simulatedModelMissingDocument = mkFinding({
    familyKey: "structure",
    regulation: "Contract Structure & Missing Documents",
    severity: "Medium",
    foundText: MISSING_CYBER_DOCUMENTS_CLAUSE,
    riskAnalysis:
      "The identified cybersecurity documents are not attached and will be provided after award.",
    redlineFix:
      "Require the missing Statement of Work, flowdown matrix, and Prime Contract excerpts before execution.",
  });
  const deterministicMissingDocument = runDeterministicDetectors(MISSING_CYBER_DOCUMENTS_CLAUSE).find(
    (finding) => finding.regulation === LABELS.missing
  );

  for (const [orderName, orderedFindings] of [
    ["model-first", [simulatedModelMissingDocument, deterministicMissingDocument]],
    ["deterministic-first", [deterministicMissingDocument, simulatedModelMissingDocument]],
  ]) {
    const { verified } = verifyFindings(
      orderedFindings.filter(Boolean),
      MISSING_CYBER_DOCUMENTS_CLAUSE
    );
    const matching = dedupeFindings(verified).filter((finding) => finding.regulation === LABELS.missing);
    check(
      `F13 ${orderName}: safe missing-document redline survives dedupe collision order`,
      matching.length === 1 && matching[0].redlineFix === SAFE_MISSING_DOCUMENTS_REDLINE
    );
  }

  const memo = buildPmMemo(result.primaryTraps, result.secondaryConcerns, false);
  check(
    "F14. consolidated memo uses the safe missing-document recommendation",
    memo.includes(SAFE_MISSING_DOCUMENTS_REDLINE) &&
      !/Statement of Work|flowdown matrix|Prime Contract excerpts/i.test(memo)
  );

  const productionSegments = extractClauseSegments(result.documentText);
  const productionHeadings = [
    "1. INCORPORATION AND DEFERRED DOCUMENTS",
    "2. REQUIRED CYBER FRAMEWORKS",
    "3. CUI AND DATA HANDLING",
    "4. CYBER INCIDENT REPORTING AND RESPONSE",
    "5. CYBERSECURITY ASSESSMENTS, ACCESS, AND REMEDIATION",
    "6. LOWER-TIER FLOWDOWNS AND SUPPLY CHAIN",
    "7. CONTRACT ADMINISTRATION",
    "8. PAYMENT WITHHOLDING AND CONTINUED PERFORMANCE",
    "9. CYBER INDEMNITY AND COST ALLOCATION",
    "10. TERMINATION AND CONTINUED PERFORMANCE",
    "11. SURVIVAL AND ACKNOWLEDGMENT",
  ];
  check(
    "F15. top-level headings are structural boundaries, never evidence segments",
    productionHeadings.every((heading) => productionSegments.every((segment) => !segment.text.includes(heading)))
  );

  const nonBoundaryControls = normalizeWhitespace(
    "1.3 Subcontractor references DFARS 252.204-7012, FAR 52.204-21, NIST SP 800-171, version 2.4 Release, revision 3.2 Release, $10.50 Million, 20.25 Percent, the date 12.31 December 2026, and Page 2.4 Notes. 2. THIS IS ORDINARY NUMBERED EMPHASIS. It is not followed by subsection 2.1. 4.1 Subcontractor shall report a cyber incident within eight hours."
  );
  const nonBoundaryNumbers = extractClauseSegments(nonBoundaryControls)
    .map((segment) => segment.number)
    .filter(Boolean);
  check(
    "F16. citations, money, decimals, dates, percentages, versions, revisions, pages, and ordinary numbering remain non-boundaries",
    JSON.stringify(nonBoundaryNumbers) === JSON.stringify(["1.3", "4.1"])
  );

  const flattenedProduction = runProductionPath(FIXTURE_C_PRODUCTION_PDF_TEXT.replace(/\n+/g, " "));
  const flattenedByLabel = new Map(
    flattenedProduction.finalFindings.map((finding) => [finding.regulation, finding])
  );
  check(
    "F17. flattened production headings and footer preserve all 16 clean identities",
    flattenedProduction.finalFindings.length === 16 &&
      flattenedByLabel.get(LABELS.response)?.foundText.endsWith("associated cost.") &&
      !/5\. CYBERSECURITY ASSESSMENTS/i.test(flattenedByLabel.get(LABELS.response)?.foundText ?? "") &&
      !/-- 1 of 2 --|Page 2/i.test(flattenedByLabel.get(LABELS.auditAccess)?.foundText ?? "")
  );

  const thirdLevelSegments = extractClauseSegments(
    normalizeWhitespace(
      "10. TERMINATION AND CONTINUED PERFORMANCE\n10.3.1 Subcontractor shall preserve records.\n11. SURVIVAL AND ACKNOWLEDGMENT\n11.1 The parties acknowledge this Subcontract."
    )
  );
  check(
    "F18. top-level boundaries preserve optional third-level subsection numbers",
    JSON.stringify(thirdLevelSegments.map((segment) => segment.number).filter(Boolean)) ===
      JSON.stringify(["10.3.1", "11.1"]) &&
      !thirdLevelSegments.some((segment) => /TERMINATION AND CONTINUED PERFORMANCE|SURVIVAL AND ACKNOWLEDGMENT/i.test(segment.text))
  );

  const ordinaryPageSentence =
    "5.2 The parties agree that Page 2 describes the delivery schedule and remains part of this Subcontract. 5.3 The next obligation applies after delivery.";
  const ordinaryPageSegments = extractClauseSegments(ordinaryPageSentence);
  check(
    "F19. ordinary contractual Page wording is retained",
    ordinaryPageSegments[0]?.text.includes("Page 2 describes the delivery schedule")
  );

  const unrelatedStructureFinding = mkFinding({
    familyKey: "structure",
    regulation: "Contract Structure & Missing Documents",
    foundText: "The Prime Contract is incorporated by reference and controls in the event of conflict.",
    riskAnalysis: "The quoted incorporation term governs conflicts.",
    redlineFix: "Preserve this unrelated structure-specific negotiation ask.",
  });
  const [unrelatedStructureAfterDedupe] = dedupeFindings([unrelatedStructureFinding]);
  check(
    "F20. safe redline enforcement does not rewrite unrelated structure findings",
    unrelatedStructureAfterDedupe.redlineFix === unrelatedStructureFinding.redlineFix &&
      unrelatedStructureAfterDedupe.regulation === unrelatedStructureFinding.regulation
  );
}

if (failures > 0) {
  console.error(`\n${failures} of ${assertions} Fixture C assertions failed.`);
  process.exit(1);
}

console.log(`\nAll ${assertions} Fixture C grounding and coverage assertions passed.`);
