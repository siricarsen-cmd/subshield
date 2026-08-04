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

for (const [label, text] of [
  ["inline abbreviated label", "Subcontract Type: T&M / FFP"],
  ["newline abbreviated label", "Subcontract Type\nT&M / FFP"],
]) {
  const anchor = extractAnchorCandidates(text, `${label}.txt`).subcontractType ?? "";
  check(
    `${label}: anchor preserves abbreviated T&M and FFP evidence`,
    /T\s*&\s*M/i.test(anchor) && /\bFFP\b/i.test(anchor),
    `anchor=${anchor || "missing"}`
  );
}

// Negative controls ensure the targeted recall, grounding, and boundary fixes do not create new false positives.
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

const preservedPayment = productionPath(`
2.8 Invoice Requirements
Failure to submit a complete invoice within 30 calendar days waives the right to dispute rejection, but does not waive the right to payment.
`);
check(
  "procedural waiver that preserves payment does not trigger invoice payment waiver",
  !preservedPayment.findings.some((finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver")
);

const remainsPayable = productionPath(`
2.8 Invoice Requirements
Failure to submit a complete invoice within 30 calendar days waives the right to payment, except that all amounts for performed work remain payable.
`);
check(
  "amounts-remain-payable exception suppresses invoice payment waiver",
  !remainsPayable.findings.some((finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver")
);

const permissiveForum = productionPath(`
2.23 Venue
Any action may be brought in Arlington County, Virginia, or in any other court with jurisdiction.
`);
check(
  "permissive nonexclusive Arlington action clause remains clean",
  !permissiveForum.findings.some((finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden")
);

const defendantLocationClauses = [
  "Exclusive venue shall be in the courts located where the defendant resides.",
  "Any action must be brought in a court where the defendant resides.",
  "Any lawsuit shall be filed in a court where the defendant is located.",
  "Any claim must be brought where the defendant has its principal place of business.",
  "Any dispute shall be filed in the courts located where the defendant resides.",
];
for (const [index, clause] of defendantLocationClauses.entries()) {
  const result = productionPath(`2.23 Venue
${clause}`);
  check(
    `defendant-location formulation ${index + 1} remains clean`,
    !result.findings.some((finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden")
  );
}

const numberedAttachmentRows = productionPath(`
5. Attachment List
1. Statement of Work Included.
2. Prime Contract Flow-Down Matrix Not included in current package.
6. Certifications
Subcontractor certifies that its representations remain current.
`);
const numberedBoundedMissing = numberedAttachmentRows.findings.find((finding) => finding.regulation === "Missing / Deferred Contract Documents");
check(
  "numbered attachment rows remain inside the Attachment List evidence",
  Boolean(numberedBoundedMissing && /Prime Contract Flow-Down Matrix/i.test(numberedBoundedMissing.foundText))
);
check(
  "numbered attachment rows do not pull in the next peer section",
  Boolean(numberedBoundedMissing && !/Certifications/i.test(numberedBoundedMissing.foundText))
);

const unrelatedInvoicePaymentsRemainPayable = productionPath(`
2.8 Invoice Requirements
Failure to submit a complete invoice within 30 calendar days waives the right to payment for the affected invoice, but all undisputed amounts under other invoices remain payable.
`);
check(
  "unrelated payable invoices do not hide affected-invoice forfeiture",
  unrelatedInvoicePaymentsRemainPayable.findings.some((finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver")
);

const affectedAmountProtected = productionPath(`
2.8 Invoice Requirements
Failure to submit a complete invoice within 30 calendar days waives the right to payment, except that the affected amount remains payable for performed work.
`);
check(
  "same affected amount remains payable suppresses invoice payment waiver",
  !affectedAmountProtected.findings.some((finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver")
);

const primeCustomerUse = productionPath(`
2.17 Improvements
Improvements may be used by Prime Contractor's customer without additional payment to Prime Contractor.
`);
check(
  "Prime Contractor customer use does not become direct Prime use",
  !primeCustomerUse.findings.some((finding) => finding.regulation === "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements")
);

const earlyNumberedAttachmentList = productionPath(`
1. Attachment List
2. Prime Contract Flow-Down Matrix Not included in current package.
3. Cybersecurity and CUI Requirements To be provided after award.
4. Certifications
Subcontractor certifies that its representations remain current.
`);
const earlyBoundedMissing = earlyNumberedAttachmentList.findings.find((finding) => finding.regulation === "Missing / Deferred Contract Documents");
check(
  "early Attachment List retains higher-numbered attachment rows",
  Boolean(earlyBoundedMissing && /Flow-Down Matrix/i.test(earlyBoundedMissing.foundText) && /Cybersecurity and CUI Requirements/i.test(earlyBoundedMissing.foundText)),
  earlyBoundedMissing?.foundText ?? "missing finding"
);
check(
  "early Attachment List excludes the next structural section",
  Boolean(earlyBoundedMissing && !/Certifications/i.test(earlyBoundedMissing.foundText)),
  earlyBoundedMissing?.foundText ?? "missing finding"
);

const incidentalAttachmentReference = productionPath(`
1. Instructions
See the Attachment List before signing.
2. Other Materials
This section contains general administrative information.
3. Attachment List
Attachment B Prime Contract Flow-Down Matrix Not included in current package.
4. Certifications
Subcontractor certifies that its representations remain current.
`);
const incidentalBoundedMissing = incidentalAttachmentReference.findings.find((finding) => finding.regulation === "Missing / Deferred Contract Documents");
check(
  "incidental Attachment List reference is not selected as the heading",
  Boolean(incidentalBoundedMissing && /^3\.\s*Attachment\s+List/i.test(incidentalBoundedMissing.foundText)),
  incidentalBoundedMissing?.foundText ?? "missing finding"
);
check(
  "incidental reference does not pull other sections into evidence",
  Boolean(incidentalBoundedMissing && !/Other Materials|Certifications/i.test(incidentalBoundedMissing.foundText)),
  incidentalBoundedMissing?.foundText ?? "missing finding"
);

const labeledAttachmentList = productionPath(`
Attachment List:
Attachment B Prime Contract Flow-Down Matrix Not included in current package.
6. Certifications
Subcontractor certifies that its representations remain current.
`);
const labeledBoundedMissing = labeledAttachmentList.findings.find((finding) => finding.regulation === "Missing / Deferred Contract Documents");
check(
  "colon-labeled Attachment List remains supported and bounded",
  Boolean(labeledBoundedMissing && /Flow-Down Matrix/i.test(labeledBoundedMissing.foundText) && !/Certifications/i.test(labeledBoundedMissing.foundText)),
  labeledBoundedMissing?.foundText ?? "missing finding"
);

const performedWorkOtherInvoices = productionPath(`
2.8 Invoice Requirements
Failure to submit a complete invoice within 30 calendar days waives the right to payment for the affected invoice, but all amounts for performed work under other invoices remain payable.
`);
check(
  "performed-work amounts under other invoices do not hide affected-invoice forfeiture",
  performedWorkOtherInvoices.findings.some((finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver")
);

for (const [label, clause] of [
  ["Prime right-to-use grant", "Prime Contractor shall have the right to use Improvements without additional payment to Subcontractor."],
  ["Prime entitlement-to-use grant", "Prime Contractor is entitled to use Improvements without additional payment to Subcontractor."],
]) {
  const result = productionPath(`2.17 Improvements
${clause}`);
  const finding = result.findings.find((candidate) => candidate.regulation === "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements");
  check(`${label}: direct unpaid Prime use triggers`, Boolean(finding));
  check(`${label}: analysis remains finding-local`, Boolean(finding && verifyFindings([finding], finding.foundText).verified.length === 1));
}

for (const [label, clause] of [
  ["exclusive forum", "The exclusive forum for all disputes shall be the state courts in Arlington County, Virginia."],
  ["all actions will", "All actions will be brought exclusively in Arlington County, Virginia."],
  ["required filing", "Any lawsuit is required to be filed in Arlington County, Virginia."],
]) {
  const result = productionPath(`2.23 Venue
${clause}`);
  const finding = result.findings.find((candidate) => candidate.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden");
  check(`${label}: mandatory forum language triggers`, Boolean(finding));
  check(`${label}: mandatory forum analysis remains finding-local`, Boolean(finding && verifyFindings([finding], finding.foundText).verified.length === 1));
}

const certificationStatusWords = productionPath(`
5. Attachment List
Attachment B Prime Contract Flow-Down Matrix Not included in current package.
6. Certifications
The certifications included in this section remain current.
`);
const certificationBoundedMissing = certificationStatusWords.findings.find((finding) => finding.regulation === "Missing / Deferred Contract Documents");
check(
  "structural Certifications section containing status words is excluded",
  Boolean(certificationBoundedMissing && !/Certifications|certifications included/i.test(certificationBoundedMissing.foundText)),
  certificationBoundedMissing?.foundText ?? "missing finding"
);

const namedInvoicePreservation = productionPath(`
2.8 Invoice Requirements
Failure to submit a complete invoice within 30 calendar days waives the right to payment for the affected invoice. However, all amounts for performed work under Invoice 104 rather than the affected invoice remain payable.
`);
check(
  "named unrelated invoice preservation does not hide affected-invoice forfeiture",
  namedInvoicePreservation.findings.some((finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver")
);

const followingAffectedPreservation = productionPath(`
2.8 Invoice Requirements
Failure to submit a complete invoice within 30 calendar days waives the right to payment. However, the affected amount remains payable for performed work.
`);
check(
  "following sentence tied to the affected amount suppresses invoice payment waiver",
  !followingAffectedPreservation.findings.some((finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver")
);

for (const [label, clause] of [
  ["passive shall-use grant", "Improvements shall be used by Prime Contractor without additional payment to Subcontractor."],
  ["passive will-use grant", "Improvements will be used by Prime Contractor without additional payment to Subcontractor."],
]) {
  const result = productionPath(`2.17 Improvements\n${clause}`);
  const finding = result.findings.find((candidate) => candidate.regulation === "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements");
  check(`${label}: direct unpaid Prime use triggers`, Boolean(finding));
  check(`${label}: analysis remains finding-local`, Boolean(finding && verifyFindings([finding], finding.foundText).verified.length === 1));
}

const pluralDefendantVenue = productionPath(`
2.23 Venue
Any action must be brought in the courts where the defendants reside.
`);
check(
  "plural defendant-location venue remains clean",
  !pluralDefendantVenue.findings.some((finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden")
);

const certificationDocumentReference = productionPath(`
5. Attachment List
Attachment B Prime Contract Flow-Down Matrix Not included in current package.
6. Certifications. The attached Statement of Work is incorporated for purposes of these certifications.
`);
const documentReferenceBoundedMissing = certificationDocumentReference.findings.find((finding) => finding.regulation === "Missing / Deferred Contract Documents");
check(
  "document-referencing Certifications section is excluded from Attachment List evidence",
  Boolean(documentReferenceBoundedMissing && !/Certifications|attached Statement of Work/i.test(documentReferenceBoundedMissing.foundText)),
  documentReferenceBoundedMissing?.foundText ?? "missing finding"
);

const ordinaryImprovementOwnership = {
  triggerType: "Contract Risk Trigger",
  regulation: "Prime Ownership of Improvements",
  severity: "Medium",
  foundText: "All Improvements created under this subcontract are owned by Prime Contractor.",
  riskAnalysis: "This clause gives Prime ownership of improvements created during performance.",
  redlineFix: "Clarify ownership and licensing rights.",
  familyKey: "data-rights",
};
check(
  "ordinary improvement ownership is not mistaken for unpaid-use analysis",
  verifyFindings([ordinaryImprovementOwnership], ordinaryImprovementOwnership.foundText).verified.length === 1
);

const reverseIpActor = productionPath(`
2.17 Improvements
Improvements may be used by Subcontractor without additional payment to Prime Contractor.
`);
check(
  "Subcontractor use of improvements does not become unpaid Prime use",
  !reverseIpActor.findings.some((finding) => finding.regulation === "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements")
);

const neutralDefendantVenue = productionPath(`
2.23 Venue
Exclusive venue shall be in the courts located where the defendant resides.
`);
check(
  "bilateral defendant-location venue remains clean",
  !neutralDefendantVenue.findings.some((finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden")
);

for (const [label, clause] of [
  ["mandatory action", "Any action must be brought in Arlington County, Virginia."],
  ["mandatory lawsuit", "Any lawsuit shall be filed exclusively in Arlington County, Virginia."],
]) {
  const result = productionPath(`2.23 Venue\n${clause}`);
  const finding = result.findings.find((candidate) => candidate.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden");
  check(`${label}: direct Arlington forum language triggers`, Boolean(finding && /Arlington\s+County/i.test(finding.foundText)));
  check(`${label}: venue analysis remains finding-local`, Boolean(finding && verifyFindings([finding], finding.foundText).verified.length === 1));
}

const genericNextSection = productionPath(`
5. Attachment List
Attachment B Prime Contract Flow-Down Matrix Not included in current package.
6. Certifications
Subcontractor certifies that its representations remain current.
`);
const boundedMissing = genericNextSection.findings.find((finding) => finding.regulation === "Missing / Deferred Contract Documents");
check("generic numbered section bounds Attachment List evidence", Boolean(boundedMissing && !/Certifications/i.test(boundedMissing.foundText)));

const conditionedIpOnly = productionPath(`
2.17 Background Intellectual Property
Subcontractor retains ownership of pre-existing tools and methods only if Subcontractor identifies them in writing before use and Prime Contractor approves their use in writing.
`);
const conditionedOnly = conditionedIpOnly.findings.find((finding) => finding.regulation === "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements");
check("conditioned-IP-only analysis does not invent unpaid improvements", Boolean(conditionedOnly && !/improvements?|adaptations?|without\s+(?:additional\s+)?payment/i.test(conditionedOnly.riskAnalysis)));
check("conditioned-IP-only analysis remains finding-local", Boolean(conditionedOnly && verifyFindings([conditionedOnly], conditionedOnly.foundText).verified.length === 1));

const adjacentSentenceInvoiceWaiver = productionPath(`
2.8 Invoice Requirements
Invoices must be submitted within 30 calendar days. Failure to submit a timely invoice waives the right to payment.
`);
check(
  "adjacent deadline and forfeiture sentences trigger invoice payment waiver",
  adjacentSentenceInvoiceWaiver.findings.some((finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver")
);

const sameNamedInvoicePreserved = productionPath(`
2.8 Invoice Requirements
Failure to submit a complete invoice within 30 calendar days waives the right to payment for Invoice 104, except that Invoice 104 remains payable after cure.
`);
check(
  "same named invoice payable-after-cure suppresses permanent payment waiver",
  !sameNamedInvoicePreserved.findings.some((finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver")
);

const mixedObjectPrimeUse = productionPath(`
2.17 Improvements
Prime Contractor shall use the Deliverables, while Improvements shall be used by Subcontractor without additional payment.
`);
check(
  "Prime use of Deliverables does not become Prime use of Improvements",
  !mixedObjectPrimeUse.findings.some((finding) => finding.regulation === "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements")
);

const optionalSubcontractorForum = productionPath(`
2.23 Venue
At the Subcontractor's option, any action shall be brought in Arlington County; the Subcontractor may instead bring the action in any other court with jurisdiction.
`);
check(
  "Subcontractor optional Arlington branch with alternative forum remains clean",
  !optionalSubcontractorForum.findings.some((finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden")
);

const unnumberedPeerHeading = productionPath(`
1. Attachment List:
Statement of Work - Not included.

CERTIFICATIONS
The Subcontractor certifies that its representations remain current.
`);
const unnumberedPeerMissing = unnumberedPeerHeading.findings.find(
  (finding) => finding.regulation === "Missing / Deferred Contract Documents"
);
check(
  "unnumbered peer heading bounds Attachment List evidence",
  Boolean(unnumberedPeerMissing && !/CERTIFICATIONS|representations remain current/i.test(unnumberedPeerMissing.foundText)),
  unnumberedPeerMissing?.foundText ?? "missing finding"
);

const adjacentNamedInvoicePreserved = productionPath(`
2.8 Invoice Requirements
Invoice 104 must be submitted within 30 calendar days. Failure to submit the invoice waives the right to payment. However, Invoice 104 remains payable after cure.
`);
check(
  "named invoice from adjacent deadline carries into preservation scope",
  !adjacentNamedInvoicePreserved.findings.some((finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver")
);

const passiveMixedObjectPrimeUse = productionPath(`
2.17 Improvements
Improvements shall be used by Subcontractor, while Deliverables may be used by Prime Contractor without additional payment.
`);
check(
  "Prime passive use of Deliverables does not become Prime use of Improvements",
  !passiveMixedObjectPrimeUse.findings.some((finding) => finding.regulation === "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements")
);

const electiveEitherForum = productionPath(`
2.23 Venue
Subcontractor may elect either (a) any action shall be brought in Arlington County, or (b) any action shall be brought in another court with jurisdiction.
`);
check(
  "may-elect-either forum branches remain nonmandatory",
  !electiveEitherForum.findings.some((finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden")
);

const multipleInvoiceWaivers = productionPath(`
2.8 Invoice Requirements
Failure to submit Invoice 104 within 30 calendar days waives the right to payment for Invoice 104, except that Invoice 104 remains payable after cure. Failure to submit Invoice 105 within 30 calendar days waives the right to payment for Invoice 105.
`);
check(
  "one preserved waiver does not hide a separate unpreserved invoice waiver",
  multipleInvoiceWaivers.findings.some((finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver")
);

const activeThenPassiveMixedObject = productionPath(`
2.17 Improvements
Subcontractor shall use Improvements, while Deliverables may be used by Prime Contractor without additional payment.
`);
check(
  "Subcontractor active use of Improvements does not cross to Prime use of Deliverables",
  !activeThenPassiveMixedObject.findings.some((finding) => finding.regulation === "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements")
);

const optionalVenueNoun = productionPath(`
2.23 Venue
At the Subcontractor's option, venue shall be in Arlington County, Virginia, or in any other court with jurisdiction.
`);
check(
  "optional venue-noun branch with any competent court remains clean",
  !optionalVenueNoun.findings.some((finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden")
);

const documentTitledPeerSection = productionPath(`
5. Attachment List
Attachment B Prime Contract Flow-Down Matrix Not included in current package.
6. Statement of Work
The Statement of Work is attached and incorporated into this section.
`);
const documentTitledPeerMissing = documentTitledPeerSection.findings.find(
  (finding) => finding.regulation === "Missing / Deferred Contract Documents"
);
check(
  "document-titled peer section is excluded from Attachment List evidence",
  Boolean(documentTitledPeerMissing && !/6\. Statement of Work|incorporated into this section/i.test(documentTitledPeerMissing.foundText)),
  documentTitledPeerMissing?.foundText ?? "missing finding"
);

if (failures > 0) {
  console.error(`\n${failures} of ${assertions} Orion parity regression assertions failed.`);
  process.exit(1);
}
console.log(`\nAll ${assertions} Orion parity regression assertions passed.`);
