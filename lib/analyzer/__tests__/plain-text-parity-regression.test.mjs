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

const ORION_PIPE_TEXT = `
Government Subcontract Package — High-Risk Test
Prime Contractor | Orion Federal Systems, LLC
Prime Contract Number | DCT-26-C-4072
Subcontract Type | Time-and-Materials with firm-fixed-price deliverables

2.3 Subcontract Type
This is a time-and-materials subcontract with firm-fixed-price deliverables.

2.7 Payment
Prime Contractor shall pay Subcontractor only after Prime Contractor receives corresponding payment from the Government.

2.11 Flowdowns
Prime Contractor may issue additional or revised flow-down requirements after award. Such requirements become binding upon written notice to Subcontractor.

5. Attachment List
Attachment A — Statement of Work — Included
Attachment B — Prime Contract Flow-Down Matrix — To be provided after award
Attachment C — Cybersecurity and CUI Requirements — To be provided after award / Government direction
Attachment D — Applicable Wage Determination and Labor Category Mapping — Not included
Attachment E — Quality Surveillance and Acceptance Criteria — To be provided after award
Attachment F — Government Furnished Information and System Access Rules — To be provided after award
Attachment G — Data Rights and Records Retention Instructions — To be provided after award
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
    `${label}: classifier remains Hybrid`,
    classification.contractType === "Hybrid (FFP / T&M)",
    `classification=${classification.contractType}`
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
  "Prime Contractor shall pay Subcontractor only after Prime Contractor receives corresponding payment from the Government.";
const paymentResult = verifiedDedupe(
  [
    makeFinding({
      familyKey: "payment",
      regulation: "Payment, Workshare, Notice Deadlines, Funding",
      foundText: paymentQuote,
      riskAnalysis: "Payment is contingent on Prime receiving corresponding payment from the Government.",
    }),
    makeFinding({
      familyKey: "payment",
      regulation: "Pay-if-Paid / Contingent Government-Payment Clause",
      foundText: paymentQuote,
      riskAnalysis: "Payment is contingent on Prime receiving corresponding payment from the Government.",
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
  "The estimated labor hours do not guarantee any minimum hours, workshare, task assignments, or revenue.";
const ordinaryWorkshare = dedupeFindings([
  makeFinding({
    familyKey: "payment",
    regulation: "No Guaranteed Workshare, Hours, or Revenue",
    foundText: ordinaryWorkshareQuote,
    riskAnalysis: "The quoted clause does not guarantee minimum hours, workshare, task assignments, or revenue.",
  }),
]);
check(
  "non-contingent payment-family risk is not relabeled as pay-if-paid",
  ordinaryWorkshare[0]?.regulation === "No Guaranteed Workshare, Hours, or Revenue",
  ordinaryWorkshare[0]?.regulation ?? "missing finding"
);

const flowdownQuote =
  "Prime Contractor may issue additional or revised flow-down requirements after award. Such requirements become binding upon written notice to Subcontractor.";
const flowdownResult = verifiedDedupe(
  [
    makeFinding({
      familyKey: "flowdowns",
      regulation: "FAR / DFARS / Agency Flowdowns",
      foundText: flowdownQuote,
      riskAnalysis: "Additional or revised flow-down requirements become binding upon written notice.",
    }),
    makeFinding({
      familyKey: "structure",
      regulation: "Broad Future Flowdowns / Prime Contract Control",
      foundText: flowdownQuote,
      riskAnalysis: "Additional or revised flow-down requirements become binding upon written notice.",
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

const missingQuote = "Attachment B — Prime Contract Flow-Down Matrix — To be provided after award";
const missingResult = verifiedDedupe(
  [
    makeFinding({
      familyKey: "structure",
      regulation: "Contract Structure & Missing Documents",
      foundText: missingQuote,
      riskAnalysis: "The flow-down matrix is deferred until after award.",
    }),
    makeFinding({
      familyKey: "structure",
      regulation: "Missing / Deferred Contract Documents",
      foundText: missingQuote,
      riskAnalysis: "The flow-down matrix is deferred until after award.",
      severity: "Medium-High",
    }),
  ],
  ORION_PIPE_TEXT
);
check("pasted missing-document overlap dedupes to one material finding", missingResult.findings.length === 1);
check(
  "To-be-provided-after-award evidence receives the canonical missing-document identity",
  missingResult.findings[0]?.regulation === "Missing / Deferred Contract Documents",
  missingResult.findings[0]?.regulation ?? "missing finding"
);
check(
  "canonical missing-document quote remains source-grounded",
  Boolean(missingResult.findings[0] && quoteExistsInDocument(missingResult.findings[0].foundText, missingResult.normalized))
);

console.log(`\n${assertions - failures}/${assertions} assertions passed.`);
if (failures > 0) process.exit(1);
