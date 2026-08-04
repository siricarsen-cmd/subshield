from pathlib import Path


def replace_once(path: str, old: str, new: str, label: str) -> None:
    file_path = Path(path)
    text = file_path.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    file_path.write_text(text.replace(old, new, 1))


replace_once(
    "lib/analyzer/sanity.ts",
    r"/improvements?|adaptations?[^.]{0,100}",
    r"/(?:improvements?|adaptations?)[^.]{0,100}",
    "group unpaid-use IP nouns",
)

replace_once(
    "lib/analyzer/deterministic.ts",
    r'''const ATTACHMENT_ROW_DOCUMENT_RE =
  /statement\s+of\s+work|\bSOW\b|prime\s+contract(?:\s+excerpts?)?|flow[\s-]?down\s+(?:lists?|matrix|matrices)|cybersecurity|CUI\s+requirements?|wage\s+determination|labor\s+category|quality\s+surveillance|acceptance\s+criteria|system\s+security\s+plan|\bSSP\b|(?:exhibit|attachment|appendix|schedule)\s+[A-Z0-9]/i;''',
    r'''const ATTACHMENT_ROW_DOCUMENT_RE =
  /^(?:statement\s+of\s+work|SOW\b|prime\s+contract(?:\s+excerpts?)?|flow[\s-]?down\s+(?:lists?|matrix|matrices)|cybersecurity|CUI\s+requirements?|wage\s+determination|labor\s+category|quality\s+surveillance|acceptance\s+criteria|system\s+security\s+plan|SSP\b|(?:exhibit|attachment|appendix|schedule)\s+[A-Z0-9])/i;''',
    "anchor attachment row document title",
)

replace_once(
    "lib/analyzer/deterministic.ts",
    r'''function numberedBlockLooksLikeAttachmentRow(block: string): boolean {
  const content = block.replace(/^\s*(?:Section\s+)?\d+\.\s+/, "");
  const sentenceEnd = content.search(/[.!?](?:\s|$)/);
  const firstSentence = sentenceEnd >= 0 ? content.slice(0, sentenceEnd + 1) : content;
  return ATTACHMENT_ROW_DOCUMENT_RE.test(firstSentence) && ATTACHMENT_ROW_STATUS_RE.test(firstSentence);
}''',
    r'''function numberedBlockLooksLikeAttachmentRow(block: string): boolean {
  const content = block.replace(/^\s*(?:Section\s+)?\d+\.\s+/, "");
  return ATTACHMENT_ROW_DOCUMENT_RE.test(content) && ATTACHMENT_ROW_STATUS_RE.test(content.slice(0, 320));
}''',
    "classify attachment row from heading start",
)

replace_once(
    "lib/analyzer/deterministic.ts",
    r'''const OTHER_INVOICE_SCOPE_RE = /\b(?:other|unrelated|separate)\s+invoices?\b/i;

function hasPaymentRightPreservationEvidence(block: string): boolean {
  const sentences = block.split(/(?<=[.!?])\s+/);
  return sentences.some((sentence) => {
    if (OTHER_INVOICE_SCOPE_RE.test(sentence)) return false;
    return EXPLICIT_PAYMENT_RIGHT_PRESERVED_RE.test(sentence) || SAME_SCOPE_PAYMENT_REMAINS_RE.test(sentence);
  });
}''',
    r'''const OTHER_INVOICE_SCOPE_RE = /\b(?:other|unrelated|separate)\s+invoices?\b|\binvoice\s+(?:no\.?\s*)?\d+\b|\brather\s+than\b/i;
const AFFECTED_PAYMENT_SCOPE_RE =
  /\b(?:affected|subject|late|delayed)\s+(?:invoice|amount|payment)\b|\b(?:this|that|such)\s+invoice\b|\b(?:right|entitlement)\s+to\s+payment\b/i;

function sentencePreservesPayment(sentence: string): boolean {
  if (OTHER_INVOICE_SCOPE_RE.test(sentence)) return false;
  return EXPLICIT_PAYMENT_RIGHT_PRESERVED_RE.test(sentence) || SAME_SCOPE_PAYMENT_REMAINS_RE.test(sentence);
}

function hasPaymentRightPreservationEvidence(block: string): boolean {
  const sentences = block.split(/(?<=[.!?])\s+/);
  const waiverIndex = sentences.findIndex((sentence) => INVOICE_PAYMENT_WAIVER_RE.test(sentence));
  if (waiverIndex < 0) return false;
  if (sentencePreservesPayment(sentences[waiverIndex])) return true;

  const nextSentence = sentences[waiverIndex + 1] ?? "";
  return AFFECTED_PAYMENT_SCOPE_RE.test(nextSentence) && sentencePreservesPayment(nextSentence);
}''',
    "bind payment preservation to waiver scope",
)

replace_once(
    "lib/analyzer/deterministic.ts",
    r"/may\s+be\s+used\s+by\s+(?:Prime\s+Contractor\b(?!['\u2019]s\b)(?!\s+(?:customer|client|affiliate|agency|end[\s-]?user)\b)|Prime\b(?!['\u2019]s\b)(?!\s+Contractor\b)(?!\s+(?:customer|client|affiliate|agency|end[\s-]?user)\b))/i",
    r"/(?:may|shall|will)\s+be\s+used\s+by\s+(?:Prime\s+Contractor\b(?!['\u2019]s\b)(?!\s+(?:customer|client|affiliate|agency|end[\s-]?user)\b)|Prime\b(?!['\u2019]s\b)(?!\s+Contractor\b)(?!\s+(?:customer|client|affiliate|agency|end[\s-]?user)\b))/i",
    "support passive may shall will Prime use",
)

replace_once(
    "lib/analyzer/deterministic.ts",
    r"\bdefendant\b[^.]{0,100}(?:resides?|is\s+located|has\s+its\s+principal\s+place\s+of\s+business)/i",
    r"\bdefendants?\b[^.]{0,100}(?:resides?|is\s+located|has\s+(?:its|their)\s+principal\s+place\s+of\s+business)/i",
    "support plural defendants",
)

test_path = Path("lib/analyzer/__tests__/orion-parity-regression.test.mjs")
tests = test_path.read_text()
marker = "const reverseIpActor = productionPath(`\n"
additions = '''const namedInvoicePreservation = productionPath(`
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
  const result = productionPath(`2.17 Improvements\\n${clause}`);
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

'''
if tests.count(marker) != 1:
    raise SystemExit("scope-aware regression insertion marker missing or duplicated")
test_path.write_text(tests.replace(marker, additions + marker, 1))
