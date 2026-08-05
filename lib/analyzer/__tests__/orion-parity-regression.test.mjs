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
const lawOnly = governingLawOnly.findings.find(
  (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
);
check("governing-law-only text triggers governing-law analysis", Boolean(lawOnly));
check(
  "governing-law-only analysis does not invent a required forum",
  Boolean(
    lawOnly &&
      /selects the governing law/i.test(lawOnly.riskAnalysis) &&
      !/requires or permits disputes/i.test(lawOnly.riskAnalysis)
  ),
  lawOnly?.riskAnalysis ?? "missing finding"
);

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

const mismatchedNamedInvoicePayable = productionPath(`
2.8 Invoice Requirements
Failure to submit Invoice 104 within 30 calendar days waives the right to payment for Invoice 104. Invoice 104 is disputed, but Invoice 105 remains payable.
`);
check(
  "payable status for another named invoice does not preserve the waived invoice",
  mismatchedNamedInvoicePayable.findings.some((finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver")
);

const servicesCompetingObject = productionPath(`
2.17 Improvements
Improvements are owned and used solely by Subcontractor, and Services may be used by Prime Contractor without additional payment.
`);
check(
  "Prime use of Services does not become Prime use of Improvements",
  !servicesCompetingObject.findings.some((finding) => finding.regulation === "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements")
);

const bilateralOptionalForum = productionPath(`
2.23 Venue
The parties may agree to venue in Arlington County, Virginia, or may select another mutually convenient forum.
`);
check(
  "bilateral optional venue selection remains nonmandatory",
  !bilateralOptionalForum.findings.some((finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden")
);

const unnumberedDocumentPeerSection = productionPath(`
Attachment List:
Statement of Work - Not included.

STATEMENT OF WORK
The Statement of Work is attached and incorporated into this section.
`);
const unnumberedDocumentPeerMissing = unnumberedDocumentPeerSection.findings.find(
  (finding) => finding.regulation === "Missing / Deferred Contract Documents"
);
check(
  "unnumbered document-titled peer section is excluded from Attachment List evidence",
  Boolean(unnumberedDocumentPeerMissing && !/STATEMENT OF WORK The Statement of Work is attached/i.test(unnumberedDocumentPeerMissing.foundText)),
  unnumberedDocumentPeerMissing?.foundText ?? "missing finding"
);

const namedInvoicePreservedWithOtherInvoices = productionPath(`
2.8 Invoice Requirements
Failure to submit Invoice 104 within 30 calendar days waives the right to payment for Invoice 104. Invoice 104 remains payable after cure, and all other invoices remain unaffected.
`);
check(
  "same named invoice remains preserved despite unrelated invoice language",
  !namedInvoicePreservedWithOtherInvoices.findings.some((finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver")
);

const compensatedImprovementsUnpaidDeliverables = productionPath(`
2.17 Improvements
Prime Contractor shall use Improvements only under a separately compensated license, while Deliverables may be used without additional payment.
`);
check(
  "unpaid Deliverables do not convert compensated Improvements use into an unpaid-use finding",
  !compensatedImprovementsUnpaidDeliverables.findings.some((finding) => finding.regulation === "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements")
);

const optionalThenMandatoryForum = productionPath(`
2.23 Venue
The parties may agree to venue in Fairfax County or another mutually convenient forum. Any action shall be brought in Arlington County, Virginia.
`);
check(
  "optional venue sentence does not hide a separate mandatory forum obligation",
  optionalThenMandatoryForum.findings.some((finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden")
);

const unavailableNumberedAttachmentRows = productionPath(`
5. Attachment List
1. Statement of Work Not provided.
2. Prime Contract Flow-Down Matrix Not available.
6. Certifications
Subcontractor certifies that its representations remain current.
`);
const unavailableNumberedMissing = unavailableNumberedAttachmentRows.findings.find(
  (finding) => finding.regulation === "Missing / Deferred Contract Documents"
);
check(
  "not-provided and not-available numbered rows stay inside bounded Attachment List evidence",
  Boolean(
    unavailableNumberedMissing &&
      /Statement of Work Not provided/i.test(unavailableNumberedMissing.foundText) &&
      /Flow-Down Matrix Not available/i.test(unavailableNumberedMissing.foundText) &&
      !/6\. Certifications|representations remain current/i.test(unavailableNumberedMissing.foundText)
  ),
  unavailableNumberedMissing?.foundText ?? "missing finding"
);

const hybridPrefixedAnchor = extractAnchorCandidates(
  normalizeWhitespace("Subcontract Type: Hybrid (FFP / T&M)"),
  "hybrid-prefixed.docx"
);
check(
  "Hybrid-prefixed explicit type label preserves both FFP and T&M evidence",
  Boolean(
    hybridPrefixedAnchor.subcontractType &&
      /Hybrid/i.test(hybridPrefixedAnchor.subcontractType) &&
      /FFP/i.test(hybridPrefixedAnchor.subcontractType) &&
      /T\s*&\s*M/i.test(hybridPrefixedAnchor.subcontractType)
  ),
  hybridPrefixedAnchor.subcontractType ?? "missing anchor"
);

const contextualInvoiceWaiver = productionPath(`
2.8 Invoice Requirements
Invoices must be submitted within 30 calendar days. Failure to do so waives the right to payment.
`);
check(
  "adjacent failure-to-do-so language carries invoice deadline context",
  contextualInvoiceWaiver.findings.some((finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver")
);

const plainAndCompensatedImprovements = productionPath(`
2.17 Improvements
Prime Contractor shall use Improvements only under a separately compensated license and Deliverables may be used without additional payment.
`);
check(
  "plain-and unpaid Deliverables do not convert compensated Improvements into unpaid use",
  !plainAndCompensatedImprovements.findings.some((finding) => finding.regulation === "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements")
);

const semicolonOptionalThenMandatoryForum = productionPath(`
2.23 Venue
The parties may agree to venue in Fairfax County or another mutually convenient forum; any action shall be brought in Arlington County, Virginia.
`);
check(
  "semicolon-separated optional venue does not hide an independent mandatory forum",
  semicolonOptionalThenMandatoryForum.findings.some((finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden")
);

const labeledNumberedAttachmentRow = productionPath(`
5. Attachment List
1. Attachment A - Statement of Work - Not included.
6. Certifications
Subcontractor certifies that its representations remain current.
`);
const labeledNumberedMissing = labeledNumberedAttachmentRow.findings.find(
  (finding) => finding.regulation === "Missing / Deferred Contract Documents"
);
check(
  "attachment label plus document title remains a bounded numbered row",
  Boolean(
    labeledNumberedMissing &&
      /Attachment A - Statement of Work - Not included/i.test(labeledNumberedMissing.foundText) &&
      !/6\. Certifications|representations remain current/i.test(labeledNumberedMissing.foundText)
  ),
  labeledNumberedMissing?.foundText ?? "missing finding"
);

const reverseOrderNamedInvoicePreservation = productionPath(`
2.8 Invoice Requirements
Failure to submit Invoice 104 within 30 calendar days waives the right to payment for Invoice 104. However, payment for performed work remains due under Invoice 104.
`);
check(
  "reverse-order same-invoice payable exception suppresses permanent waiver",
  !reverseOrderNamedInvoicePreservation.findings.some((finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver")
);

const defendantThenMandatoryForum = productionPath(`
2.23 Venue
Any action must be brought in the courts where the defendants reside. Any action shall be brought in Arlington County, Virginia.
`);
check(
  "neutral defendant-location sentence does not hide a separate mandatory forum",
  defendantThenMandatoryForum.findings.some((finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden")
);

const commaButOptionalThenMandatoryForum = productionPath(`
2.23 Venue
The parties may agree to venue in Fairfax County or another mutually convenient forum, but any action shall be brought in Arlington County, Virginia.
`);
check(
  "comma-but optional venue does not hide the mandatory forum branch",
  commaButOptionalThenMandatoryForum.findings.some((finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden")
);

const proseBeforeRealTypeLabel = extractAnchorCandidates(
  normalizeWhitespace(`The contract type will not be Time-and-Materials.\nSubcontract Type: Firm-Fixed-Price (FFP)`),
  "real-type-label.docx"
);
check(
  "ordinary contract-type prose does not preempt a later explicit label",
  Boolean(
    proseBeforeRealTypeLabel.subcontractType &&
      /Firm-Fixed-Price|FFP/i.test(proseBeforeRealTypeLabel.subcontractType) &&
      !/will not be/i.test(proseBeforeRealTypeLabel.subcontractType)
  ),
  proseBeforeRealTypeLabel.subcontractType ?? "missing anchor"
);

const appositivePassiveImprovementsGrant = productionPath(`
2.17 Improvements
Improvements, including adaptations, may be used by Prime Contractor without additional payment to Subcontractor.
`);
check(
  "appositive passive Prime improvements-use grant triggers",
  appositivePassiveImprovementsGrant.findings.some(
    (finding) => finding.regulation === "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements"
  )
);

const otherInvoiceExplicitPreservation = productionPath(`
2.8 Invoice Requirements
Failure to submit Invoice 104 within 30 calendar days waives the right to payment for Invoice 104. Invoice 104 remains disputed, but Invoice 105's right to payment is not waived.
`);
check(
  "another invoice's explicit payment preservation does not protect the waived invoice",
  otherInvoiceExplicitPreservation.findings.some(
    (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
  )
);

const sameInvoiceExplicitPreservation = productionPath(`
2.8 Invoice Requirements
Failure to submit Invoice 104 within 30 calendar days waives the right to payment for Invoice 104. Invoice 104's right to payment is not waived after cure.
`);
check(
  "same invoice explicit payment preservation suppresses permanent waiver",
  !sameInvoiceExplicitPreservation.findings.some(
    (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
  )
);

const royaltyFreeImprovementsGrant = productionPath(`
2.17 Improvements
Prime Contractor may use Subcontractor-created Improvements royalty-free.
`);
check(
  "royalty-free Prime improvements-use grant triggers and survives verification",
  royaltyFreeImprovementsGrant.findings.some(
    (finding) => finding.regulation === "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements"
  )
);

const explicitHybridOnlyAnchor = extractAnchorCandidates(
  normalizeWhitespace("Subcontract Type: Hybrid"),
  "hybrid-only.docx"
);
check(
  "explicit Hybrid-only subcontract type label is preserved",
  explicitHybridOnlyAnchor.subcontractType === "Hybrid",
  explicitHybridOnlyAnchor.subcontractType ?? "missing anchor"
);

const activeDeadlinePronounWaiver = productionPath(`
2.8 Invoice Requirements
Subcontractor shall submit invoices within 30 calendar days. Failure to do so waives the right to payment.
`);
check(
  "active submit-invoices deadline carries into adjacent pronoun waiver",
  activeDeadlinePronounWaiver.findings.some(
    (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
  )
);

const plainAdjacentAffectedInvoicePreservation = productionPath(`
2.8 Invoice Requirements
Failure to submit a complete invoice within 30 calendar days waives the right to payment. The affected invoice remains payable after cure.
`);
check(
  "plain adjacent affected-invoice preservation suppresses permanent waiver",
  !plainAdjacentAffectedInvoicePreservation.findings.some(
    (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
  )
);

const invoiceNumberAbbreviationWaiver = productionPath(`
2.8 Invoice Requirements
Failure to submit Invoice No. 104 within 30 calendar days waives the right to payment.
`);
check(
  "Invoice No. abbreviation remains intact for payment-waiver detection",
  invoiceNumberAbbreviationWaiver.findings.some(
    (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
  )
);

const allImprovementsUnpaidGrant = productionPath(`
2.17 Improvements
Prime Contractor may use all Improvements without additional payment to Subcontractor.
`);
check(
  "active Prime use of all Improvements triggers unpaid-use finding",
  allImprovementsUnpaidGrant.findings.some(
    (finding) => finding.regulation === "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements"
  )
);

const compensatedImprovementsWithDeliverablesNoPayment = productionPath(`
2.17 Improvements
Prime Contractor may use Improvements only under a separately compensated license without additional payment being due for Deliverables.
`);
check(
  "Deliverables no-payment qualifier does not convert compensated Improvements use into unpaid use",
  !compensatedImprovementsWithDeliverablesNoPayment.findings.some(
    (finding) => finding.regulation === "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements"
  )
);

const directImprovementsNoPaymentDue = productionPath(`
2.17 Improvements
Prime Contractor may use Improvements without additional payment being due to Subcontractor.
`);
check(
  "no-payment qualifier tied directly to Improvements still triggers unpaid-use finding",
  directImprovementsNoPaymentDue.findings.some(
    (finding) => finding.regulation === "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements"
  )
);

const optionalPairThenIndependentMandatoryForum = productionPath(`
2.23 Venue
At the Subcontractor's option, any action shall be brought in Fairfax County; the Subcontractor may instead bring the action in any other court with jurisdiction; any action shall be brought in Arlington County, Virginia.
`);
check(
  "semicolon-spanning optional pair does not hide a later independent mandatory forum",
  optionalPairThenIndependentMandatoryForum.findings.some(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  )
);

for (const [label, clause] of [
  ["possessive Improvements grant", "Prime Contractor may use Subcontractor's Improvements without additional payment to Subcontractor."],
  ["curly possessive Improvements grant", "Prime Contractor may use Subcontractor’s Improvements without additional payment to Subcontractor."],
  ["owned Improvements grant", "Prime Contractor may use Subcontractor-owned Improvements without additional payment to Subcontractor."],
]) {
  const result = productionPath(`2.17 Improvements
${clause}`);
  check(
    `${label}: genuine unpaid Prime use still triggers`,
    result.findings.some(
      (finding) => finding.regulation === "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements"
    )
  );
}

const plainAndOptionalThenMandatoryForum = productionPath(`
2.23 Venue
The parties may agree to venue in Fairfax County or another mutually convenient forum and any action shall be brought in Arlington County, Virginia.
`);
check(
  "plain-and optional forum does not hide later mandatory Arlington forum",
  plainAndOptionalThenMandatoryForum.findings.some(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  )
);

const detailedAttachmentRows = productionPath(`
5. Attachment List
1. Statement of Work (SOW) Not included.
2. Prime Contract Flow-Down Matrix, dated July 1 - Not provided.
6. Certifications
Subcontractor certifies that its representations remain current.
`);
const detailedAttachmentFinding = detailedAttachmentRows.findings.find(
  (finding) => finding.regulation === "Missing / Deferred Contract Documents"
);
check(
  "parenthetical and dated Attachment List rows remain in bounded evidence",
  Boolean(
    detailedAttachmentFinding &&
      /Statement of Work/i.test(detailedAttachmentFinding.foundText) &&
      /Flow-Down Matrix/i.test(detailedAttachmentFinding.foundText)
  ),
  detailedAttachmentFinding?.foundText ?? "missing finding"
);
check(
  "detailed Attachment List rows do not pull in the next peer section",
  Boolean(detailedAttachmentFinding && !/Certifications/i.test(detailedAttachmentFinding.foundText)),
  detailedAttachmentFinding?.foundText ?? "missing finding"
);

const competingInvoiceDeadlines = productionPath(`
2.8 Invoice Requirements
Invoices must be submitted within 7 calendar days for routine processing. Failure to submit a complete invoice within 30 calendar days waives the right to payment.
`);
const competingDeadlineFinding = competingInvoiceDeadlines.findings.find(
  (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
);
check(
  "invoice waiver analysis uses the forfeiture deadline rather than an earlier ordinary deadline",
  Boolean(
    competingDeadlineFinding &&
      /30 calendar days/i.test(competingDeadlineFinding.riskAnalysis) &&
      !/7 calendar days/i.test(competingDeadlineFinding.riskAnalysis)
  ),
  competingDeadlineFinding?.riskAnalysis ?? "missing finding"
);

const filedInWritingClaim = productionPath(`
2.23 Claim Notice
Any claim must be filed in writing within three business days after the event giving rise to the claim.
`);
check(
  "filed-in-writing claim notice does not become mandatory forum evidence",
  !filedInWritingClaim.findings.some(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  )
);

const geographicMandatoryForum = productionPath(`
2.23 Venue
Any action shall be brought in Arlington County, Virginia.
`);
check(
  "geographic mandatory forum still triggers after location grounding",
  geographicMandatoryForum.findings.some(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  )
);

const adjacentCompetingInvoiceDeadlines = productionPath(`
2.8 Invoice Requirements
Invoices should be submitted within 7 calendar days for routine processing and complete invoices must be submitted no later than 30 calendar days. Failure to do so waives the right to payment.
`);
const adjacentCompetingDeadlineFinding = adjacentCompetingInvoiceDeadlines.findings.find(
  (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
);
check(
  "adjacent pronoun waiver analysis uses the final operative deadline from the referenced invoice sentence",
  Boolean(
    adjacentCompetingDeadlineFinding &&
      /30 calendar days/i.test(adjacentCompetingDeadlineFinding.riskAnalysis) &&
      !/7 calendar days/i.test(adjacentCompetingDeadlineFinding.riskAnalysis)
  ),
  adjacentCompetingDeadlineFinding?.riskAnalysis ?? "missing finding"
);

const submissionDeadlineBeforePrimeReviewDeadline = productionPath(`
2.8 Invoice Requirements
Invoices must be submitted within 30 calendar days for payment eligibility, and Prime shall review invoices within 45 calendar days. Failure to do so waives the right to payment.
`);
const submissionDeadlineFinding = submissionDeadlineBeforePrimeReviewDeadline.findings.find(
  (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
);
check(
  "adjacent waiver analysis ignores a later Prime review deadline",
  Boolean(
    submissionDeadlineFinding &&
      /30 calendar days/i.test(submissionDeadlineFinding.riskAnalysis) &&
      !/45 calendar days/i.test(submissionDeadlineFinding.riskAnalysis)
  ),
  submissionDeadlineFinding?.riskAnalysis ?? "missing finding"
);

const governingLawOnlyClause = productionPath(`
2.23 Governing Law
This Agreement shall be governed by the laws of Virginia.
`);
check(
  "governing-law-only clause still produces the combined dispute-law finding",
  governingLawOnlyClause.findings.some(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  )
);

const mandatoryArbitrationWithoutBindingWord = productionPath(`
2.23 Dispute Resolution
All disputes shall be resolved exclusively through arbitration.
`);
check(
  "mandatory arbitration without the word binding still produces the dispute finding",
  mandatoryArbitrationWithoutBindingWord.findings.some(
    (finding) =>
      finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden" &&
      /requires disputes to be resolved through arbitration/i.test(finding.riskAnalysis)
  )
);

const permissiveArbitrationChoice = productionPath(`
2.23 Dispute Resolution
The parties may agree to resolve a dispute through arbitration.
`);
check(
  "permissive arbitration choice remains clean",
  !permissiveArbitrationChoice.findings.some(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  )
);


const definiteArticlePassivePrimeUse = productionPath(`
2.17 Improvements
Improvements may be used by the Prime Contractor without additional payment to Subcontractor.
`);
const definiteArticleIpFinding = definiteArticlePassivePrimeUse.findings.find(
  (finding) => finding.regulation === "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements"
);
check(
  "passive unpaid-use grant with the Prime Contractor triggers",
  Boolean(definiteArticleIpFinding)
);
check(
  "definite-article passive Prime-use analysis remains finding-local",
  Boolean(
    definiteArticleIpFinding &&
      verifyFindings([definiteArticleIpFinding], definiteArticleIpFinding.foundText).verified.length === 1
  )
);

const plainButOptionalThenMandatoryForum = productionPath(`
2.23 Venue
The parties may agree to venue in Fairfax County or another mutually convenient forum but any action shall be brought in Arlington County, Virginia.
`);
const plainButForumFinding = plainButOptionalThenMandatoryForum.findings.find(
  (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
);
check(
  "plain-but optional venue does not hide the later mandatory forum",
  Boolean(plainButForumFinding && /Arlington County/i.test(plainButForumFinding.foundText))
);
check(
  "plain-but mandatory forum analysis remains finding-local",
  Boolean(
    plainButForumFinding &&
      verifyFindings([plainButForumFinding], plainButForumFinding.foundText).verified.length === 1
  )
);


for (const descriptor of ["monthly", "proper", "final"]) {
  const describedInvoiceDeadline = productionPath(`
2.8 Invoice Requirements
Subcontractor shall submit ${descriptor} invoices within 30 calendar days. Failure to do so waives the right to payment.
`);
  const describedInvoiceFinding = describedInvoiceDeadline.findings.find(
    (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
  );
  check(
    `${descriptor} invoice descriptor preserves adjacent pronoun-waiver detection`,
    Boolean(
      describedInvoiceFinding &&
        /30 calendar days/i.test(describedInvoiceFinding.riskAnalysis)
    ),
    describedInvoiceFinding?.riskAnalysis ?? "missing finding"
  );
}

for (const thirdPartyActor of [
  "Prime Contractor affiliates",
  "Prime Contractor customers",
  "Prime Contractor-affiliated entities",
]) {
  const thirdPartyPassiveUse = productionPath(`
2.17 Improvements
Improvements may be used by ${thirdPartyActor} without additional payment to Subcontractor.
`);
  check(
    `${thirdPartyActor}: passive third-party use does not become direct Prime use`,
    !thirdPartyPassiveUse.findings.some(
      (finding) => finding.regulation === "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements"
    )
  );
}

for (const clause of [
  "The parties may agree to venue in Fairfax County or another mutually convenient forum and venue shall be in Arlington County, Virginia.",
  "The parties may agree to jurisdiction in Fairfax County or another mutually convenient forum but jurisdiction must be located in Arlington County, Virginia.",
]) {
  const mandatoryVenueNounBranch = productionPath(`
2.23 Venue
${clause}
`);
  const mandatoryVenueNounFinding = mandatoryVenueNounBranch.findings.find(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  );
  check(
    "optional forum language does not hide a mandatory venue/jurisdiction noun branch",
    Boolean(mandatoryVenueNounFinding && /Arlington County/i.test(mandatoryVenueNounFinding.foundText)),
    mandatoryVenueNounFinding?.foundText ?? "missing finding"
  );
  check(
    "mandatory venue/jurisdiction noun analysis remains finding-local",
    Boolean(
      mandatoryVenueNounFinding &&
        verifyFindings([mandatoryVenueNounFinding], mandatoryVenueNounFinding.foundText).verified.length === 1
    )
  );
}


const arbitrationCostQuote =
  "Subcontractor shall pay all AAA filing fees and arbitrator compensation.";
const arbitrationCostFinding = {
  triggerType: "Contract Risk Trigger",
  regulation: "Arbitration Fee Allocation",
  severity: "Medium-High",
  foundText: arbitrationCostQuote,
  riskAnalysis:
    "This clause assigns all AAA filing fees and arbitrator compensation to the Subcontractor, creating direct dispute-resolution expense exposure.",
  redlineFix:
    "Allocate filing fees and arbitrator compensation equitably or as determined by the arbitrator.",
};
check(
  "grounded arbitration-cost allocation survives the forum-selection sanity guard",
  verifyFindings([arbitrationCostFinding], arbitrationCostQuote).verified.length === 1,
  verifyFindings([arbitrationCostFinding], arbitrationCostQuote).dropped
    .map(({ reason }) => reason)
    .join(" | ")
);

const genericPreservationWithIncidentalInvoiceId = productionPath(`
2.8 Invoice Requirements
Failure to submit a complete invoice within 30 calendar days waives the right to payment. Invoice 104 remains disputed; however, the affected amount remains payable.
`);
check(
  "incidental invoice number does not block generic affected-amount preservation",
  !genericPreservationWithIncidentalInvoiceId.findings.some(
    (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
  )
);


const sameInvoiceActivePreservation = productionPath(`
2.8 Invoice Requirements
Failure to submit Invoice 104 within 30 calendar days waives the right to payment for Invoice 104. This does not waive the right to payment for Invoice 104 after cure.
`);
check(
  "active same-invoice right-to-payment preservation suppresses permanent payment-loss finding",
  !sameInvoiceActivePreservation.findings.some(
    (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
  )
);

for (const unsupportedUnpaidPhrase of ["royalty-free", "free of charge"]) {
  const ownershipOnlyQuote = "All Improvements are owned by Prime Contractor.";
  const unsupportedUnpaidFinding = {
    triggerType: "Contract Risk Trigger",
    regulation: "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements",
    severity: "Medium-High",
    foundText: ownershipOnlyQuote,
    riskAnalysis: `Prime Contractor receives ${unsupportedUnpaidPhrase} use of Subcontractor-created Improvements.`,
    redlineFix: "Require a separately negotiated license and compensation for any Prime use of Improvements.",
  };
  const unsupportedVerification = verifyFindings([unsupportedUnpaidFinding], ownershipOnlyQuote);
  check(
    `${unsupportedUnpaidPhrase} improvement-use claim requires quote-local unpaid-use evidence`,
    unsupportedVerification.verified.length === 0,
    unsupportedVerification.dropped.map(({ reason }) => reason).join(" | ")
  );
}

const fullSentenceDeferredAttachmentRows = productionPath(`
1. Attachment List
1. Statement of Work will be included after award.
2. Prime Contract Flow-Down Matrix shall be provided after award.
3. Certifications
Subcontractor certifies that its representations remain current.
`);
const deferredAttachmentFinding = fullSentenceDeferredAttachmentRows.findings.find(
  (finding) => finding.regulation === "Missing / Deferred Contract Documents"
);
check(
  "full-sentence deferred Attachment List rows remain inside focused evidence",
  Boolean(
    deferredAttachmentFinding &&
      /Statement of Work/i.test(deferredAttachmentFinding.foundText) &&
      /Prime Contract Flow-Down Matrix/i.test(deferredAttachmentFinding.foundText)
  ),
  deferredAttachmentFinding?.foundText ?? "missing finding"
);
check(
  "full-sentence deferred Attachment List rows stop before the next peer section",
  Boolean(deferredAttachmentFinding && !/Certifications/i.test(deferredAttachmentFinding.foundText)),
  deferredAttachmentFinding?.foundText ?? "missing finding"
);

const anyAndAllPrimeUse = productionPath(`
2.17 Improvements
Prime Contractor may use any and all Improvements without additional payment to Subcontractor.
`);
const anyAndAllIpFinding = anyAndAllPrimeUse.findings.find(
  (finding) => finding.regulation === "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements"
);
check("active any-and-all Improvements unpaid-use grant triggers", Boolean(anyAndAllIpFinding));
check(
  "any-and-all Improvements finding remains quote-local",
  Boolean(
    anyAndAllIpFinding &&
      verifyFindings([anyAndAllIpFinding], anyAndAllIpFinding.foundText).verified.length === 1
  )
);


const filedInWritingQuote =
  "Any claim must be filed in writing within three business days after the event giving rise to the claim.";
const filedInWritingFinding = {
  triggerType: "Contract Risk Trigger",
  regulation: "Short Claim Notice / Waiver",
  severity: "Medium-High",
  foundText: filedInWritingQuote,
  riskAnalysis:
    "This clause requires any claim to be filed in writing within three business days, creating a short notice deadline.",
  redlineFix: "Extend the claim-notice period and preserve claims absent material prejudice.",
};
const filedInWritingVerification = verifyFindings([filedInWritingFinding], filedInWritingQuote);
check(
  "filed-in-writing deadline analysis survives the forum-selection sanity guard",
  filedInWritingVerification.verified.length === 1,
  filedInWritingVerification.dropped.map(({ reason }) => reason).join(" | ")
);

const uncompensatedProcessImprovementQuote =
  "Subcontractor shall implement all required process Improvements without additional compensation.";
const uncompensatedProcessImprovementFinding = {
  triggerType: "Contract Risk Trigger",
  regulation: "Additional Work Without Compensation",
  severity: "Medium-High",
  foundText: uncompensatedProcessImprovementQuote,
  riskAnalysis:
    "This clause requires process Improvements without additional compensation, creating uncompensated additional-work exposure.",
  redlineFix: "Require a bilateral change order and equitable adjustment for additional process improvements.",
};
const uncompensatedProcessVerification = verifyFindings(
  [uncompensatedProcessImprovementFinding],
  uncompensatedProcessImprovementQuote
);
check(
  "uncompensated process-improvement finding is not mistaken for a Prime-use license claim",
  uncompensatedProcessVerification.verified.length === 1,
  uncompensatedProcessVerification.dropped.map(({ reason }) => reason).join(" | ")
);

const barePaymentPreservation = productionPath(`
2.8 Invoice Requirements
Failure to submit a complete invoice within 30 calendar days waives the right to payment. However, payment shall not be waived if the invoice is submitted during the cure period.
`);
check(
  "bare payment-shall-not-be-waived savings language suppresses permanent payment-loss finding",
  !barePaymentPreservation.findings.some(
    (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
  )
);

const ordinaryModifierPassiveUse = productionPath(`
2.17 Improvements
All Improvements developed in the course of performance may be used by the Prime Contractor without additional payment to Subcontractor.
`);
const ordinaryModifierIpFinding = ordinaryModifierPassiveUse.findings.find(
  (finding) => finding.regulation === "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements"
);
check("ordinary passive-grant modifiers preserve unpaid Prime-use detection", Boolean(ordinaryModifierIpFinding));
check(
  "ordinary-modifier passive Prime-use finding remains quote-local",
  Boolean(
    ordinaryModifierIpFinding &&
      verifyFindings([ordinaryModifierIpFinding], ordinaryModifierIpFinding.foundText).verified.length === 1
  )
);

const competingObjectAfterModifiers = productionPath(`
2.17 Improvements
Improvements developed for Subcontractor and Deliverables may be used by Prime Contractor without additional payment.
`);
check(
  "broader passive modifiers do not bind Prime's Deliverables use to Improvements",
  !competingObjectAfterModifiers.findings.some(
    (finding) => finding.regulation === "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements"
  )
);


for (const [label, clause] of [
  [
    "irrevocable submission",
    "Each party irrevocably submits to the exclusive jurisdiction of the state and federal courts located in Fairfax County, Virginia.",
  ],
  [
    "consent to exclusive jurisdiction",
    "Each party consents to the exclusive jurisdiction of the courts located in Arlington County, Virginia.",
  ],
  [
    "courts having exclusive jurisdiction",
    "The state courts located in Fairfax County shall have exclusive jurisdiction over all disputes.",
  ],
]) {
  const exclusiveJurisdiction = productionPath(`
2.23 Dispute Resolution
${clause}
`);
  const exclusiveJurisdictionFinding = exclusiveJurisdiction.findings.find(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  );
  check(`${label}: explicit exclusive jurisdiction triggers`, Boolean(exclusiveJurisdictionFinding));
  check(
    `${label}: exclusive-jurisdiction analysis remains quote-local`,
    Boolean(
      exclusiveJurisdictionFinding &&
        verifyFindings([exclusiveJurisdictionFinding], exclusiveJurisdictionFinding.foundText).verified.length === 1
    )
  );
}

const royaltyFreeLicenseGrant = productionPath(`
2.17 Improvements
Subcontractor hereby grants Prime Contractor a perpetual, royalty-free license to all Improvements.
`);
const royaltyFreeLicenseFinding = royaltyFreeLicenseGrant.findings.find(
  (finding) => finding.regulation === "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements"
);
check("direct royalty-free license to Prime triggers", Boolean(royaltyFreeLicenseFinding));
check(
  "direct royalty-free license finding remains quote-local",
  Boolean(
    royaltyFreeLicenseFinding &&
      verifyFindings([royaltyFreeLicenseFinding], royaltyFreeLicenseFinding.foundText).verified.length === 1
  )
);

const competingRoyaltyFreeLicense = productionPath(`
2.17 Improvements
Subcontractor grants Prime Contractor a royalty-free license to the Deliverables, while Improvements remain owned and used solely by Subcontractor.
`);
check(
  "royalty-free Deliverables license does not become an Improvements-use finding",
  !competingRoyaltyFreeLicense.findings.some(
    (finding) => finding.regulation === "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements"
  )
);

for (const [label, savings] of [
  ["timely submitted invoices", "Payment for timely submitted invoices shall not be waived."],
  ["Prime Government receipt", "Prime Contractor's payment from the Government shall not be waived."],
]) {
  const unrelatedBarePaymentSavings = productionPath(`
2.8 Invoice Requirements
Failure to submit a complete invoice within 30 calendar days waives the right to payment. ${savings}
`);
  check(
    `${label}: unrelated bare-payment savings do not hide late-invoice forfeiture`,
    unrelatedBarePaymentSavings.findings.some(
      (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
    )
  );
}

if (failures > 0) {
  console.error(`\n${failures} of ${assertions} Orion parity regression assertions failed.`);
  process.exit(1);
}
console.log(`\nAll ${assertions} Orion parity regression assertions passed.`);
