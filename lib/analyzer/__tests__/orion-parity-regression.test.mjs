import { extractAnchorCandidates } from "../anchors.ts";
import { classifyContract } from "../classify.ts";
import { runDeterministicDetectors } from "../deterministic.ts";
import { dedupeFindings, rankFindings } from "../report.ts";
import { verifyFindings } from "../sanity.ts";
import { normalizeWhitespace, quoteExistsInDocument } from "../text.ts";
import { ORION_PARITY_REPRESENTATIONS } from "../__fixtures__/orion-parity-regression-fixture.mjs";

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

function productionPath(rawText) {
  const documentText = normalizeWhitespace(rawText);
  const generated = runDeterministicDetectors(documentText);
  const verification = verifyFindings(generated, documentText);
  const deduped = dedupeFindings(verification.verified, documentText);
  const ranked = rankFindings(deduped);
  return {
    documentText,
    generated,
    dropped: verification.dropped,
    findings: [...ranked.primaryTraps, ...ranked.secondaryConcerns],
  };
}

for (const [representation, rawText] of ORION_PARITY_REPRESENTATIONS) {
  const documentText = normalizeWhitespace(rawText);
  const anchors = extractAnchorCandidates(documentText, `Orion-${representation}.docx`);
  const classification = classifyContract(documentText);
  const result = productionPath(rawText);
  const labels = result.findings.map((finding) => finding.regulation);

  check(
    `${representation}: document anchor preserves both T&M and FFP evidence`,
    /time[\s-]*(?:and|&)\s*-?materials/i.test(anchors.subcontractType ?? "") &&
      /firm[\s-]*fixed[\s-]*price/i.test(anchors.subcontractType ?? ""),
    `anchor=${anchors.subcontractType ?? "missing"}`
  );
  check(`${representation}: classifier remains Hybrid`, classification.contractType === "Hybrid (FFP / T&M)", classification.contractType);
  check(`${representation}: detects invoice payment waiver`, labels.includes("Invoice Submission Deadline / Payment Waiver"), labels.join(", "));

  const invoice = result.findings.find((finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver");
  check(
    `${representation}: invoice waiver quote contains deadline and forfeiture`,
    Boolean(invoice && /30\s+calendar\s+days/i.test(invoice.foundText) && /waives[^.]{0,80}right\s+to\s+payment/i.test(invoice.foundText))
  );

  const ip = result.findings.find((finding) => finding.regulation === "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements");
  check(`${representation}: IP quote contains unpaid-use evidence`, Boolean(ip && /improvements?|adaptations?/i.test(ip.foundText) && /without\s+additional\s+payment/i.test(ip.foundText)));
  check(`${representation}: IP analysis is finding-local`, Boolean(ip && verifyFindings([ip], ip.foundText).verified.length === 1));

  const venue = result.findings.find((finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden");
  check(`${representation}: venue quote contains Arlington forum evidence`, Boolean(venue && /Arlington\s+County/i.test(venue.foundText)));
  check(`${representation}: venue analysis is finding-local`, Boolean(venue && verifyFindings([venue], venue.foundText).verified.length === 1));

  const missing = result.findings.find((finding) => finding.regulation === "Missing / Deferred Contract Documents");
  check(`${representation}: missing-document quote starts at Attachment List`, Boolean(missing && /^5\.\s*Attachment\s+List/i.test(missing.foundText)));
  check(`${representation}: missing-document quote excludes unrelated preceding/following sections`, Boolean(missing && !/Government\s+Interaction|Labor\s+Rate|Subcontractor\s+Questions\s+Form/i.test(missing.foundText)));
  check(`${representation}: every final quote remains source-grounded`, result.findings.every((finding) => quoteExistsInDocument(finding.foundText, result.documentText)));
  check(`${representation}: no deterministic finding is dropped`, result.dropped.length === 0, result.dropped.map(({ finding, reason }) => `${finding.regulation}: ${reason}`).join(" | "));
}

const ordinaryInvoice = productionPath(`
2.8 Invoice Requirements
Invoices should be submitted within 30 calendar days after the billing month. Prime Contractor will notify Subcontractor of any missing support and allow ten business days to cure. Late submission does not waive payment absent material prejudice.
`);
check(
  "ordinary invoice deadline without forfeiture does not trigger payment-waiver finding",
  !ordinaryInvoice.findings.some((finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver")
);

const governingLawOnly = productionPath(`
2.23 Governing Law
This subcontract is governed by the laws of the Commonwealth of Virginia. The parties have not selected an exclusive venue or arbitration forum.
`);
const lawOnly = governingLawOnly.findings.find((finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden");
check("governing-law-only text does not trigger venue finding", !lawOnly);

const conditionedIpOnly = productionPath(`
2.17 Background Intellectual Property
Subcontractor retains ownership of pre-existing tools and methods only if Subcontractor identifies them in writing before use and Prime Contractor approves their use in writing.
`);
const conditionedOnly = conditionedIpOnly.findings.find((finding) => finding.regulation === "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements");
check("conditioned-IP-only analysis does not invent unpaid improvements", Boolean(conditionedOnly && !/improvements?|adaptations?|without\s+(?:additional\s+)?payment/i.test(conditionedOnly.riskAnalysis)));
check("conditioned-IP-only analysis remains finding-local", Boolean(conditionedOnly && verifyFindings([conditionedOnly], conditionedOnly.foundText).verified.length === 1));

if (failures > 0) {
  console.error(`\n${failures} of ${assertions} Orion parity regression assertions failed.`);
  process.exit(1);
}
console.log(`\nAll ${assertions} Orion parity regression assertions passed.`);
