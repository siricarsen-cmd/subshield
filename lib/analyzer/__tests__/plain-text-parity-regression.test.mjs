import { extractAnchorCandidates } from "../anchors.ts";
import { classifyContract } from "../classify.ts";
import { dedupeFindings } from "../report.ts";
import { verifyFindings } from "../sanity.ts";
import { normalizeWhitespace, quoteExistsInDocument } from "../text.ts";

let assertions = 0;
let failures = 0;

function check(label, condition, details = "") {
  assertions++;
  if (condition) {
    console.log(`PASS: ${label}`);
    return;
  }
  failures++;
  console.error(`FAIL: ${label}${details ? ` — ${details}` : ""}`);
}

// Mirrors the exact Orion plain-text representation used in production
// acceptance testing for the metadata and clauses implicated by this parity fix.
const ORION_PIPE_TEXT = `
Government Subcontract Package - High-Risk Test
FICTIONAL DOCUMENT FOR SUBSHIELD PLATFORM TESTING ONLY - NOT FOR SIGNATURE

Prime Contractor | Orion Federal Systems, LLC
Proposed Subcontractor | [Subcontractor Name]
Government Customer | U.S. Department of Civic Technology
Prime Contract Number | DCT-26-C-4072
Subcontract Type | Time-and-Materials with firm-fixed-price deliverables

2.1 Parties
This subcontract is between Orion Federal Systems, LLC, referred to as Prime Contractor, and [Subcontractor Name], referred to as Subcontractor.

2.3 Subcontract Type
This is a time-and-materials subcontract with firm-fixed-price deliverables where identified by Prime Contractor. Subcontractor will be paid for approved labor hours actually performed and accepted deliverables, subject to available funding, Government acceptance, and Prime Contractor approval.

2.5 Scope of Work
The specific volume, timing, location, priority, and mix of work will depend on Government needs, agency funding, customer direction, and Prime Contractor business judgment. Prime Contractor does not guarantee any specific number of labor hours, tickets, work packages, deliverables, task assignments, or revenue amount to Subcontractor.

2.7 Payment Terms
Subcontractor may invoice monthly for approved labor hours and accepted deliverables performed during the prior month. Prime Contractor will pay Subcontractor within 10 business days after Prime Contractor receives corresponding payment from the Government for Subcontractor's invoiced work.
If the Government delays, disputes, reduces, rejects, offsets, recoups, suspends, or withholds payment to Prime Contractor for any reason related to Subcontractor's work, Prime Contractor may delay, reduce, offset, suspend, or withhold payment to Subcontractor to the same extent.
Prime Contractor has no obligation to pay Subcontractor for amounts not paid by the Government to Prime Contractor. Subcontractor must continue performance during any payment delay, payment dispute, Government funding interruption, or invoice review unless Prime Contractor provides written direction otherwise.

2.11 Flow-Down Clauses and Prime Contract Requirements
Subcontractor agrees to comply with all FAR, DFARS, agency-specific, security, cybersecurity, labor, ethics, audit, records, supply-chain, accessibility, privacy, and other clauses that apply to Prime Contractor under Prime Contract DCT-26-C-4072, whether included in this subcontract or later provided by Prime Contractor.
Prime Contractor may provide additional flow-down clauses, agency clauses, task-order terms, or compliance instructions after award, and those clauses and instructions will be incorporated into this subcontract upon notice to Subcontractor.
If any prime contract requirement, Government instruction, later-issued flow-down, or agency clause conflicts with this subcontract, the prime contract requirement, Government instruction, later-issued flow-down, or agency clause will control.

2.12 Compliance, Cybersecurity, and Government Information
Subcontractor acknowledges that the work may involve Federal Contract Information, Controlled Unclassified Information, personally identifiable information, Government systems, Government records, or other sensitive information depending on Government direction.
Subcontractor must comply with applicable cybersecurity, privacy, incident reporting, safeguarding, personnel screening, training, records management, and system-access requirements, including requirements based on FAR 52.204-21, DFARS 252.204-7012, NIST SP 800-171, agency directives, and any related prime contract requirements when Prime Contractor determines they apply.

Additional prime contract clauses, agency-specific clauses, cybersecurity requirements, quality requirements, wage determinations, and Government-furnished information may be provided after subcontract award or after the Government issues additional direction.

5. Attachment List
Attachment | Title | Status
Attachment A | Statement of Work | Included
Attachment B | Prime Contract Flow-Down Matrix | To be provided after award
Attachment C | Cybersecurity and CUI Requirements | To be provided after award or upon Government direction
Attachment D | Applicable Wage Determination and Labor Category Mapping | Not included in current package
Attachment E | Quality Surveillance and Acceptance Criteria | To be provided after award
Attachment F | Government Furnished Information and System Access Rules | To be provided after award
Attachment G | Data Rights and Records Retention Instructions | To be provided after award
`;

const ORION_DOCUMENT_STYLE = ORION_PIPE_TEXT
  .replace("Prime Contractor | Orion Federal Systems, LLC", "Prime Contractor: Orion Federal Systems, LLC")
  .replace("Prime Contract Number | DCT-26-C-4072", "Prime Contract Number: DCT-26-C-4072")
  .replace(
    "Subcontract Type | Time-and-Materials with firm-fixed-price deliverables",
    "Subcontract Type: Time-and-Materials with firm-fixed-price deliverables"
  );

const representations = [
  ["document-style", ORION_DOCUMENT_STYLE],
  ["plain TXT / pipe-delimited", ORION_PIPE_TEXT],
  ["pasted text / CRLF and spaced pipes", ORION_PIPE_TEXT.replace(/\n/g, "\r\n").replace(/ \| /g, "   |   ")],
];

for (const [label, rawText] of representations) {
  const documentText = normalizeWhitespace(rawText);
  const anchors = extractAnchorCandidates(documentText, `${label}.txt`);
  const classification = classifyContract(documentText);

  check(
    `${label}: subcontract anchor preserves T&M evidence`,
    /time[\s-]*(?:and|&)\s*-?materials/i.test(anchors.subcontractType ?? ""),
    `anchor=${anchors.subcontractType ?? "missing"}`
  );
  check(
    `${label}: subcontract anchor preserves FFP evidence`,
    /firm[\s-]*fixed[\s-]*price/i.test(anchors.subcontractType ?? ""),
    `anchor=${anchors.subcontractType ?? "missing"}`
  );
  check(
    `${label}: subcontract anchor is not reduced to FFP-only`,
    anchors.subcontractType !== "Firm-Fixed-Price (FFP)",
    `anchor=${anchors.subcontractType ?? "missing"}`
  );
  check(
    `${label}: prime contract number survives normalization`,
    anchors.primeContractNumber === "DCT-26-C-4072",
    `anchor=${anchors.primeContractNumber ?? "missing"}`
  );
  check(
    `${label}: parties anchor remains source-grounded`,
    /Orion Federal Systems, LLC/i.test(anchors.parties ?? "") && /Subcontractor/i.test(anchors.parties ?? ""),
    `parties=${anchors.parties ?? "missing"}`
  );
  check(
    `${label}: classifier remains Hybrid`,
    classification.contractType === "Hybrid (FFP / T&M)",
    `classification=${classification.contractType}`
  );
  check(
    `${label}: sector remains cybersecurity / IT / professional services`,
    classification.sector === "Cybersecurity / IT / Professional Services",
    `sector=${classification.sector}`
  );
}

for (const attachmentLetter of ["A", "B", "C", "D", "E", "F", "G"]) {
  check(
    `Orion source fixture preserves Attachment ${attachmentLetter}`,
    ORION_PIPE_TEXT.includes(`Attachment ${attachmentLetter} |`)
  );
}

function makeFinding({ familyKey, regulation, foundText, riskAnalysis, severity = "High" }) {
  return {
    triggerType: "Contract Risk Trigger",
    familyKey,
    regulation,
    severity,
    foundText,
    riskAnalysis,
    redlineFix: "Revise the quoted clause so the identified risk is removed or made bilateral before execution.",
  };
}

function verifiedDedupe(findings, documentText) {
  const normalized = normalizeWhitespace(documentText);
  const verification = verifyFindings(findings, normalized);
  check(
    "synthetic parity candidates remain individually evidence-grounded",
    verification.verified.length === findings.length,
    verification.dropped.map(({ finding, reason }) => `${finding.regulation}: ${reason}`).join(" | ")
  );
  return {
    normalized,
    findings: dedupeFindings(verification.verified, normalized),
  };
}

const paymentQuote =
  "Prime Contractor will pay Subcontractor within 10 business days after Prime Contractor receives corresponding payment from the Government for Subcontractor's invoiced work.";
const paymentResult = verifiedDedupe(
  [
    makeFinding({
      familyKey: "payment",
      regulation: "Payment, Workshare, Notice Deadlines, Funding",
      foundText: paymentQuote,
      riskAnalysis: "Payment timing is contingent on Prime Contractor first receiving corresponding Government payment.",
    }),
    makeFinding({
      familyKey: "payment",
      regulation: "Pay-if-Paid / Contingent Government-Payment Clause",
      foundText: paymentQuote,
      riskAnalysis: "Payment timing is contingent on Prime Contractor first receiving corresponding Government payment.",
      severity: "Medium-High",
    }),
  ],
  ORION_PIPE_TEXT
);
check("pasted payment overlap dedupes to one material finding", paymentResult.findings.length === 1);
check(
  "Government-payment evidence receives the narrow canonical payment identity",
  paymentResult.findings[0]?.regulation === "Pay-if-Paid / Contingent Government-Payment Clause",
  paymentResult.findings[0]?.regulation ?? "missing finding"
);
check(
  "canonical payment quote remains source-grounded",
  Boolean(paymentResult.findings[0] && quoteExistsInDocument(paymentResult.findings[0].foundText, paymentResult.normalized))
);

const ordinaryWorkshareQuote =
  "Prime Contractor does not guarantee any specific number of labor hours, tickets, work packages, deliverables, task assignments, or revenue amount to Subcontractor.";
const ordinaryWorkshare = dedupeFindings([
  makeFinding({
    familyKey: "payment",
    regulation: "No Guaranteed Workshare, Hours, or Revenue",
    foundText: ordinaryWorkshareQuote,
    riskAnalysis: "The quoted clause does not guarantee workshare, hours, assignments, or revenue.",
  }),
]);
check(
  "non-contingent payment-family risk is not relabeled as pay-if-paid",
  ordinaryWorkshare[0]?.regulation === "No Guaranteed Workshare, Hours, or Revenue",
  ordinaryWorkshare[0]?.regulation ?? "missing finding"
);

const flowdownQuote =
  "Prime Contractor may provide additional flow-down clauses, agency clauses, task-order terms, or compliance instructions after award, and those clauses and instructions will be incorporated into this subcontract upon notice to Subcontractor.";
const flowdownResult = verifiedDedupe(
  [
    makeFinding({
      familyKey: "flowdowns",
      regulation: "FAR / DFARS / Agency Flowdowns",
      foundText: flowdownQuote,
      riskAnalysis: "Additional post-award flow-down clauses are incorporated into the subcontract upon notice.",
    }),
    makeFinding({
      familyKey: "structure",
      regulation: "Broad Future Flowdowns / Prime Contract Control",
      foundText: flowdownQuote,
      riskAnalysis: "Additional post-award flow-down clauses are incorporated into the subcontract upon notice.",
      severity: "Medium-High",
    }),
  ],
  ORION_PIPE_TEXT
);
check("pasted future-flowdown overlap dedupes to one material finding", flowdownResult.findings.length === 1);
check(
  "future-flowdown evidence retains the intended canonical identity",
  flowdownResult.findings[0]?.familyKey === "structure" &&
    flowdownResult.findings[0]?.regulation === "Broad Future Flowdowns / Prime Contract Control",
  `${flowdownResult.findings[0]?.familyKey ?? "missing"} / ${flowdownResult.findings[0]?.regulation ?? "missing"}`
);
check(
  "canonical future-flowdown quote remains source-grounded",
  Boolean(flowdownResult.findings[0] && quoteExistsInDocument(flowdownResult.findings[0].foundText, flowdownResult.normalized))
);

const fixedFlowdownQuote =
  "Subcontractor agrees to comply with all FAR, DFARS, agency-specific, security, cybersecurity, labor, ethics, audit, records, supply-chain, accessibility, privacy, and other clauses that apply to Prime Contractor under Prime Contract DCT-26-C-4072, whether included in this subcontract or later provided by Prime Contractor.";
const fixedFlowdown = dedupeFindings([
  makeFinding({
    familyKey: "flowdowns",
    regulation: "FAR / DFARS / Agency Flowdowns",
    foundText: fixedFlowdownQuote,
    riskAnalysis: "The clause requires compliance with applicable prime-contract flowdowns.",
  }),
]);
check(
  "ordinary fixed-flowdown evidence is not rewritten as future-flowdown risk",
  fixedFlowdown[0]?.familyKey === "flowdowns" && fixedFlowdown[0]?.regulation === "FAR / DFARS / Agency Flowdowns",
  `${fixedFlowdown[0]?.familyKey ?? "missing"} / ${fixedFlowdown[0]?.regulation ?? "missing"}`
);

const deferredPackageQuote =
  "Additional prime contract clauses, agency-specific clauses, cybersecurity requirements, quality requirements, wage determinations, and Government-furnished information may be provided after subcontract award or after the Government issues additional direction.";
const missingQuote = `Attachment | Title | Status
Attachment A | Statement of Work | Included
Attachment B | Prime Contract Flow-Down Matrix | To be provided after award
Attachment C | Cybersecurity and CUI Requirements | To be provided after award or upon Government direction
Attachment D | Applicable Wage Determination and Labor Category Mapping | Not included in current package
Attachment E | Quality Surveillance and Acceptance Criteria | To be provided after award
Attachment F | Government Furnished Information and System Access Rules | To be provided after award
Attachment G | Data Rights and Records Retention Instructions | To be provided after award`;
const missingResult = verifiedDedupe(
  [
    makeFinding({
      familyKey: "structure",
      regulation: "Contract Structure & Missing Documents",
      foundText: deferredPackageQuote,
      riskAnalysis: "The package defers additional prime-contract and compliance materials until after subcontract award or later Government direction.",
      severity: "Medium-High",
    }),
    makeFinding({
      familyKey: "structure",
      regulation: "Missing / Deferred Contract Documents",
      foundText: missingQuote,
      riskAnalysis: "The attachment list defers multiple material contract documents until after award or Government direction.",
      severity: "Medium",
    }),
  ],
  ORION_PIPE_TEXT
);
check("pasted missing-document overlap dedupes to one material finding", missingResult.findings.length === 1);
check(
  "deferred-package summary receives the canonical missing-document identity",
  missingResult.findings[0]?.regulation === "Missing / Deferred Contract Documents",
  missingResult.findings[0]?.regulation ?? "missing finding"
);
check(
  "missing-document collision retains the higher severity without retaining the generic title",
  missingResult.findings[0]?.severity === "Medium-High" &&
    missingResult.findings[0]?.regulation !== "Contract Structure & Missing Documents",
  `${missingResult.findings[0]?.severity ?? "missing"} / ${missingResult.findings[0]?.regulation ?? "missing"}`
);
check(
  "canonical missing-document quote remains source-grounded",
  Boolean(missingResult.findings[0] && quoteExistsInDocument(missingResult.findings[0].foundText, missingResult.normalized))
);
check(
  "canonical missing-document evidence still preserves Attachment A through G",
  Boolean(
    missingResult.findings[0] &&
      missingResult.findings[0].foundText.includes("Attachment A") &&
      missingResult.findings[0].foundText.includes("Attachment G")
  )
);

console.log(`\n${assertions - failures}/${assertions} assertions passed.`);
if (failures > 0) process.exit(1);
