from pathlib import Path
import re

def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one exact match, found {count}")
    return text.replace(old, new, 1)

def replace_block(text: str, start: str, end: str, new_block: str, label: str) -> str:
    start_i = text.find(start)
    if start_i < 0:
        raise SystemExit(f"{label}: start marker not found")
    end_i = text.find(end, start_i + len(start))
    if end_i < 0:
        raise SystemExit(f"{label}: end marker not found")
    return text[:start_i] + new_block + text[end_i:]

anchors_path = Path('lib/analyzer/anchors.ts')
anchors = anchors_path.read_text()
anchors = replace_once(
    anchors,
    '''const EXPLICIT_TYPE_LABEL =
  /(?:subcontract\\s+type|type\\s+of\\s+(?:subcontract|agreement)|contract\\s+type)\\s*[:\\-]\\s*([^\\n]{2,60})/i;''',
    '''const EXPLICIT_TYPE_LABEL =
  /(?:subcontract\\s+type|type\\s+of\\s+(?:subcontract|agreement)|contract\\s+type)\\s*(?::|[-\\u2010-\\u2015])?\\s*(?:\\n\\s*)?((?:firm[\\s-]*fixed[\\s-]*price|time[\\s-]*(?:and|&)[\\s-]*materials|labor[\\s-]hour|cost[\\s-]*plus[\\s-]*fixed[\\s-]*fee|cost[\\s-]reimburs(?:ement|able)|indefinite[\\s-]delivery|IDIQ|purchase\\s+order|teaming\\s+agreement)[^\\n]{0,60})/i;''',
    'explicit subcontract-type table value extraction',
)
anchors_path.write_text(anchors)

deterministic_path = Path('lib/analyzer/deterministic.ts')
deterministic = deterministic_path.read_text()

old_missing = '''function findMissingDocumentsCandidate(documentText: string): string | null {
  return findClauseCandidate(
    documentText,
    (block) => NAMED_CONTRACT_DOCUMENT_RE.test(block) && (DOCUMENT_ABSENCE_RE.test(block) || DOCUMENT_DEFERRAL_RE.test(block))
  );
}'''
new_missing = '''const ATTACHMENT_LIST_START_RE = /\\b(?:\\d+\\.\\s*)?Attachment\\s+List\\b/i;
const ATTACHMENT_LIST_END_RE =
  /\\b(?:\\d+\\.\\s*)?(?:Subcontractor\\s+Questions\\s+Form|Quote\\s+Submission\\s+Instructions)\\b/i;

function findMissingDocumentsCandidate(documentText: string): string | null {
  // DOCX/PDF table extraction can flatten the attachment table into a
  // much larger structural block. Prefer the literal Attachment List
  // range and stop before the next top-level section so the displayed
  // evidence remains focused on the actually missing/deferred items.
  const start = ATTACHMENT_LIST_START_RE.exec(documentText);
  if (start) {
    const afterStart = documentText.slice(start.index + start[0].length);
    const end = ATTACHMENT_LIST_END_RE.exec(afterStart);
    const finish = end
      ? start.index + start[0].length + end.index
      : Math.min(documentText.length, start.index + 1800);
    const attachmentBlock = documentText
      .slice(start.index, finish)
      .trim()
      .replace(/\\s+/g, " ");
    if (
      NAMED_CONTRACT_DOCUMENT_RE.test(attachmentBlock) &&
      (DOCUMENT_ABSENCE_RE.test(attachmentBlock) || DOCUMENT_DEFERRAL_RE.test(attachmentBlock))
    ) {
      return attachmentBlock;
    }
  }

  return findClauseCandidate(
    documentText,
    (block) =>
      NAMED_CONTRACT_DOCUMENT_RE.test(block) &&
      (DOCUMENT_ABSENCE_RE.test(block) || DOCUMENT_DEFERRAL_RE.test(block))
  );
}'''
deterministic = replace_once(deterministic, old_missing, new_missing, 'bounded missing-document quote')

helpers_marker = 'const CATEGORIES: DeterministicCategory[] = ['
helpers = r'''const INVOICE_PAYMENT_WAIVER_RE =
  /failure\s+to\s+submit[^.]{0,140}(?:complete\s+)?invoice[^.]{0,140}(?:within|no\s+later\s+than)\s+\d{1,3}\s*(?:calendar|business|working)?\s*days?[^.]{0,180}(?:waives?|forfeits?)[^.]{0,100}(?:right|entitlement)\s+to\s+payment/i;

function findInvoicePaymentWaiverCandidate(documentText: string): string | null {
  return findClauseCandidate(documentText, (block) => INVOICE_PAYMENT_WAIVER_RE.test(block));
}

function buildInvoicePaymentWaiverAnalysis(foundText: string): string {
  const deadline = /(?:within|no\s+later\s+than)\s+(\d{1,3}\s*(?:calendar|business|working)?\s*days?)/i.exec(foundText)?.[1];
  return `This clause makes a missed invoice-submission deadline${deadline ? ` of ${deadline}` : ""} waive or forfeit the Subcontractor's right to payment, creating a permanent payment-loss risk even when the underlying work was performed.`;
}

const CONDITIONED_PREEXISTING_IP_RE =
  /pre[\s-]existing\s+(?:ip|intellectual\s+property|tools?|materials|methods|know[\s-]how)[^.]{0,200}only\s+if[^.]{0,150}(?:identif|disclos|approve[sd]?|written\s+approval)/i;
const UNPAID_IMPROVEMENTS_USE_RE =
  /(?:improvements?|adaptations?)[^.]{0,180}(?:may\s+be\s+used\s+by|Prime(?:\s+Contractor)?\s+may\s+use)[^.]{0,160}without\s+(?:additional\s+)?(?:payment|compensation|charge|fee)|(?:may\s+be\s+used\s+by|Prime(?:\s+Contractor)?\s+may\s+use)[^.]{0,160}(?:improvements?|adaptations?)[^.]{0,160}without\s+(?:additional\s+)?(?:payment|compensation|charge|fee)/i;

function findConditionedPreExistingIpCandidate(documentText: string): string | null {
  return findClauseCandidate(
    documentText,
    (block) => CONDITIONED_PREEXISTING_IP_RE.test(block) || UNPAID_IMPROVEMENTS_USE_RE.test(block)
  );
}

function buildConditionedPreExistingIpAnalysis(foundText: string): string {
  const conditioned = CONDITIONED_PREEXISTING_IP_RE.test(foundText);
  const unpaidUse = UNPAID_IMPROVEMENTS_USE_RE.test(foundText);
  if (conditioned && unpaidUse) {
    return "This clause conditions the Subcontractor's retention of its pre-existing tools, methods, and background materials on advance written identification and approval, and permits Prime use of stated improvements or adaptations without additional payment, creating ownership and uncompensated-use exposure.";
  }
  if (conditioned) {
    return "This clause conditions the Subcontractor's retention of its pre-existing tools, methods, or background materials on the advance identification-and-approval process stated in the quote, creating a risk that unlisted background IP will not remain protected.";
  }
  return "This clause permits Prime to use the stated Subcontractor-created improvements or adaptations without additional payment, creating uncompensated-use and licensing exposure.";
}

const VENUE_OR_ARBITRATION_EVIDENCE_RE =
  /(?:exclusive\s+)?(?:venue|jurisdiction)\b|binding\s+arbitration|(?:arbitration|mediation|court\s+proceeding)[^.]{0,180}(?:brought|filed)\s+in|Prime(?:\s+Contractor)?\s+elects?\s+(?:another|a\s+different|an\s+alternate)\s+forum/i;
const GOVERNING_LAW_EVIDENCE_RE =
  /(?:governing\s+law|governed\s+by\s+the\s+laws\s+of)[^.]{0,100}(?:State\s+of|Commonwealth\s+of)\s+[A-Z][a-zA-Z]+/i;

function findVenueOrGoverningLawCandidate(documentText: string): string | null {
  return findClauseCandidate(
    documentText,
    (block) => VENUE_OR_ARBITRATION_EVIDENCE_RE.test(block) || GOVERNING_LAW_EVIDENCE_RE.test(block)
  );
}

function buildVenueOrGoverningLawAnalysis(foundText: string): string {
  if (VENUE_OR_ARBITRATION_EVIDENCE_RE.test(foundText)) {
    return "This clause requires or permits disputes to be litigated, mediated, or arbitrated in the forum stated in the quote, which can increase the cost and difficulty of pursuing or defending a claim for a Subcontractor located elsewhere.";
  }
  return "This clause selects the governing law stated in the quote. If that law differs from the Subcontractor's home jurisdiction, it can increase legal-review complexity, but the quote does not by itself establish a required litigation or arbitration venue.";
}

'''
if helpers_marker not in deterministic:
    raise SystemExit('deterministic helpers marker not found')
deterministic = deterministic.replace(helpers_marker, helpers + helpers_marker, 1)

broad_setoff_marker = '''  {
  familyKey: "payment",
  regulation: "Broad Setoff / Backcharge / Withholding Rights",'''
invoice_category = '''  {
  familyKey: "payment",
  regulation: "Invoice Submission Deadline / Payment Waiver",
  severity: "Medium-High",
  patterns: [],
  findCandidate: findInvoicePaymentWaiverCandidate,
  riskAnalysis:
    "This clause makes a missed invoice-submission deadline waive or forfeit the Subcontractor's right to payment, creating permanent payment-loss exposure.",
  redlineFix:
    "Extend the invoice-submission period, require written notice and a reasonable cure opportunity before rejection, and state that a late invoice is not waived absent material prejudice to the Prime.",
  buildRiskAnalysis: buildInvoicePaymentWaiverAnalysis,
},
'''
if broad_setoff_marker not in deterministic:
    raise SystemExit('broad setoff category marker not found')
deterministic = deterministic.replace(broad_setoff_marker, invoice_category + broad_setoff_marker, 1)

venue_start = '''  {
  familyKey: "liability",
  regulation: "Out-of-State Venue, Governing Law, or Arbitration Burden",'''
venue_end = '''  {
  familyKey: "liability",
  regulation: "Acceptance, Rejection, or Rework Without Clear Compensation",'''
venue_new = '''  {
  familyKey: "liability",
  regulation: "Out-of-State Venue, Governing Law, or Arbitration Burden",
  severity: "Medium",
  patterns: [],
  findCandidate: findVenueOrGoverningLawCandidate,
  riskAnalysis:
    "This clause selects governing law or a dispute forum that may increase the Subcontractor's cost and difficulty in pursuing or defending a claim.",
  redlineFix:
    "Negotiate for governing law and venue in the Subcontractor's home state, or at minimum a neutral/mutually convenient forum, and confirm any arbitration provision preserves reasonable discovery and cost-sharing terms.",
  buildRiskAnalysis: buildVenueOrGoverningLawAnalysis,
},
'''
deterministic = replace_block(deterministic, venue_start, venue_end, venue_new, 'venue clause-local detector')

ip_start = '''  {
  familyKey: "data-rights",
  regulation: "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements",'''
ip_end = '''];

const CONTEXT_WINDOW'''
ip_new = '''  {
  familyKey: "data-rights",
  regulation: "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements",
  severity: "Medium-High",
  patterns: [],
  findCandidate: findConditionedPreExistingIpCandidate,
  riskAnalysis:
    "This clause conditions pre-existing-IP retention and/or permits uncompensated use of improvements as stated in the quote, creating ownership or licensing exposure.",
  redlineFix:
    "Remove any advance-approval condition on retaining pre-existing IP and limit any Prime right to use Subcontractor improvements or adaptations beyond the priced deliverables unless a separate license and compensation are agreed.",
  buildRiskAnalysis: buildConditionedPreExistingIpAnalysis,
},
'''
deterministic = replace_block(deterministic, ip_start, ip_end, ip_new, 'IP clause-local detector')
deterministic_path.write_text(deterministic)

sanity_path = Path('lib/analyzer/sanity.ts')
sanity = sanity_path.read_text()
local_claim_marker = '''  if (/continue[\\s-]?performance|continued\\s+performance/i.test(reg)) {
  const paymentClaim = /payment\\s+(?:delay|withhold|issue)|withheld|non[\\s-]payment/i.test(claim);
  const paymentEvidence = /payment|withhold|non[\\s-]payment/i.test(quote);
  if (paymentClaim && !paymentEvidence) {
    return "Finding's analysis imports payment or withholding facts that are not stated in the finding's own verified quote.";
  }
}

return null;'''
local_claim_replacement = '''  if (/continue[\\s-]?performance|continued\\s+performance/i.test(reg)) {
  const paymentClaim = /payment\\s+(?:delay|withhold|issue)|withheld|non[\\s-]payment/i.test(claim);
  const paymentEvidence = /payment|withhold|non[\\s-]payment/i.test(quote);
  if (paymentClaim && !paymentEvidence) {
    return "Finding's analysis imports payment or withholding facts that are not stated in the finding's own verified quote.";
  }
}

const forumBurdenClaim =
  /litigat|arbitrat|forum\\s+(?:far|stated|required)|must\\s+be\\s+brought|filed\\s+in/i.test(claim);
const forumBurdenEvidence =
  /(?:exclusive\\s+)?(?:venue|jurisdiction)\\b|binding\\s+arbitration|(?:arbitration|mediation|court\\s+proceeding)[^.]{0,180}(?:brought|filed)\\s+in|Prime(?:\\s+Contractor)?\\s+elects?\\s+(?:another|a\\s+different|an\\s+alternate)\\s+forum/i.test(quote);
if (forumBurdenClaim && !forumBurdenEvidence) {
  return "Finding's analysis claims a litigation, arbitration, or forum requirement that is not stated in the finding's own verified quote.";
}

const unpaidImprovementClaim =
  /improvements?|adaptations?[^.]{0,100}(?:without\\s+(?:additional\\s+)?(?:payment|compensation)|unpaid|free\\s+use)|(?:without\\s+(?:additional\\s+)?(?:payment|compensation)|unpaid|free\\s+use)[^.]{0,100}(?:improvements?|adaptations?)/i.test(claim);
const unpaidImprovementEvidence =
  /improvements?|adaptations?/i.test(quote) &&
  /without\\s+(?:additional\\s+)?(?:payment|compensation|charge|fee)/i.test(quote);
if (unpaidImprovementClaim && !unpaidImprovementEvidence) {
  return "Finding's analysis claims unpaid Prime use of improvements or adaptations that is not stated in the finding's own verified quote.";
}

return null;'''
sanity = replace_once(sanity, local_claim_marker, local_claim_replacement, 'finding-local venue and IP guards')
sanity_path.write_text(sanity)

fixture_path = Path('lib/analyzer/__fixtures__/orion-parity-regression-fixture.mjs')
fixture_path.write_text(r'''export const ORION_PARITY_DOCUMENT = `
Government Subcontract Package - High-Risk Parity Fixture
Fictional document for SubShield testing only.
Prime Contractor Orion Federal Systems, LLC
Prime Contract Number DCT-26-C-4072
Subcontract Type Time-and-Materials with firm-fixed-price deliverables

2.3 Subcontract Type
This is a time-and-materials subcontract with firm-fixed-price deliverables where identified by Prime Contractor. Subcontractor will be paid for approved labor hours actually performed and accepted deliverables.

2.8 Invoice Requirements
Each invoice must include the subcontract number, invoice date, labor category, hours worked, rate, and supporting documentation. Invoices must be submitted within 7 calendar days after the end of each billing month. Failure to submit a complete invoice within 30 calendar days after the end of the billing month waives Subcontractor's right to payment for the affected amount unless Prime Contractor approves otherwise in writing.

2.17 Data Rights and Intellectual Property
All required final deliverables will be owned by Prime Contractor. Subcontractor retains ownership of pre-existing tools, methods, templates, know-how, and background materials only if Subcontractor identifies them in writing before use and Prime Contractor approves their use in writing. Any improvements or adaptations created during performance may be used by Prime Contractor without additional payment to Subcontractor.

2.23 Disputes and Continued Performance
The parties will attempt to resolve disputes through good-faith discussions. This subcontract is governed by the laws of the Commonwealth of Virginia, without regard to conflict-of-law rules. Any arbitration, mediation, or court proceeding must be brought in Arlington County, Virginia, unless Prime Contractor elects another forum required by the prime contract.

3.5 Government Interaction
Subcontractor may communicate with Government personnel only when authorized by Prime Contractor.

4. Labor Rate and Funding Schedule
Service Desk Specialist $86.00 650 Estimate only. Total subcontract value shall not exceed $176,200.

5. Attachment List
Attachment A Statement of Work Included.
Attachment B Prime Contract Flow-Down Matrix To be provided after award.
Attachment C Cybersecurity and CUI Requirements To be provided after award or upon Government direction.
Attachment D Applicable Wage Determination and Labor Category Mapping Not included in current package.
Attachment E Quality Surveillance and Acceptance Criteria To be provided after award.

6. Subcontractor Questions Form
Subcontractor may submit written questions before the quote due date.
`;

export const ORION_PARITY_REPRESENTATIONS = [
  ["paragraph", ORION_PARITY_DOCUMENT],
  ["flattened", ORION_PARITY_DOCUMENT.replace(/\\s+/g, " ")],
];
''')

test_path = Path('lib/analyzer/__tests__/orion-parity-regression.test.mjs')
test_path.write_text(r'''import { extractAnchorCandidates } from "../anchors.ts";
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
    /time[\\s-]*(?:and|&)\\s*-?materials/i.test(anchors.subcontractType ?? "") &&
      /firm[\\s-]*fixed[\\s-]*price/i.test(anchors.subcontractType ?? ""),
    `anchor=${anchors.subcontractType ?? "missing"}`
  );
  check(`${representation}: classifier remains Hybrid`, classification.contractType === "Hybrid (FFP / T&M)", classification.contractType);
  check(`${representation}: detects invoice payment waiver`, labels.includes("Invoice Submission Deadline / Payment Waiver"), labels.join(", "));

  const invoice = result.findings.find((finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver");
  check(
    `${representation}: invoice waiver quote contains deadline and forfeiture`,
    Boolean(invoice && /30\\s+calendar\\s+days/i.test(invoice.foundText) && /waives[^.]{0,80}right\\s+to\\s+payment/i.test(invoice.foundText))
  );

  const ip = result.findings.find((finding) => finding.regulation === "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements");
  check(`${representation}: IP quote contains unpaid-use evidence`, Boolean(ip && /improvements?|adaptations?/i.test(ip.foundText) && /without\\s+additional\\s+payment/i.test(ip.foundText)));
  check(`${representation}: IP analysis is finding-local`, Boolean(ip && verifyFindings([ip], ip.foundText).verified.length === 1));

  const venue = result.findings.find((finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden");
  check(`${representation}: venue quote contains Arlington forum evidence`, Boolean(venue && /Arlington\\s+County/i.test(venue.foundText)));
  check(`${representation}: venue analysis is finding-local`, Boolean(venue && verifyFindings([venue], venue.foundText).verified.length === 1));

  const missing = result.findings.find((finding) => finding.regulation === "Missing / Deferred Contract Documents");
  check(`${representation}: missing-document quote starts at Attachment List`, Boolean(missing && /^5\\.\\s*Attachment\\s+List/i.test(missing.foundText)));
  check(`${representation}: missing-document quote excludes unrelated preceding/following sections`, Boolean(missing && !/Government\\s+Interaction|Labor\\s+Rate|Subcontractor\\s+Questions\\s+Form/i.test(missing.foundText)));
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
check("governing-law-only finding does not invent a required forum", Boolean(lawOnly && !/requires?[^.]{0,80}(?:litigat|arbitrat)|forum\\s+(?:far|stated|required)/i.test(lawOnly.riskAnalysis)));
check("governing-law-only analysis remains finding-local", Boolean(lawOnly && verifyFindings([lawOnly], lawOnly.foundText).verified.length === 1));

const conditionedIpOnly = productionPath(`
2.17 Background Intellectual Property
Subcontractor retains ownership of pre-existing tools and methods only if Subcontractor identifies them in writing before use and Prime Contractor approves their use in writing.
`);
const conditionedOnly = conditionedIpOnly.findings.find((finding) => finding.regulation === "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements");
check("conditioned-IP-only analysis does not invent unpaid improvements", Boolean(conditionedOnly && !/improvements?|adaptations?|without\\s+(?:additional\\s+)?payment/i.test(conditionedOnly.riskAnalysis)));
check("conditioned-IP-only analysis remains finding-local", Boolean(conditionedOnly && verifyFindings([conditionedOnly], conditionedOnly.foundText).verified.length === 1));

if (failures > 0) {
  console.error(`\\n${failures} of ${assertions} Orion parity regression assertions failed.`);
  process.exit(1);
}
console.log(`\\nAll ${assertions} Orion parity regression assertions passed.`);
''')

package_path = Path('package.json')
package_text = package_path.read_text()
package_text = replace_once(
    package_text,
    '    "test:accuracy:core": "node --experimental-loader ./lib/analyzer/__tests__/ts-relative-import.loader.mjs lib/analyzer/__tests__/qa-core-accuracy-benchmark.test.mjs",\n',
    '    "test:accuracy:core": "node --experimental-loader ./lib/analyzer/__tests__/ts-relative-import.loader.mjs lib/analyzer/__tests__/qa-core-accuracy-benchmark.test.mjs",\n    "test:accuracy:orion": "node --experimental-loader ./lib/analyzer/__tests__/ts-relative-import.loader.mjs lib/analyzer/__tests__/orion-parity-regression.test.mjs",\n',
    'package Orion test script',
)
package_text = replace_once(
    package_text,
    '    "test:accuracy": "npm run test:accuracy:core && npm run test:accuracy:qa-c",',
    '    "test:accuracy": "npm run test:accuracy:core && npm run test:accuracy:orion && npm run test:accuracy:qa-c",',
    'accuracy chain includes Orion regression',
)
package_path.write_text(package_text)

Path('.github/workflows/orion-parity-fix-builder.yml').unlink()