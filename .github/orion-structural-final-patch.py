from pathlib import Path


def replace_once(path: str, old: str, new: str, label: str) -> None:
    file_path = Path(path)
    text = file_path.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    file_path.write_text(text.replace(old, new, 1))


replace_once(
    "lib/analyzer/deterministic.ts",
    r'''const ATTACHMENT_ROW_STATUS_RE =
  /\b(?:included|not\s+included|to\s+be\s+provided|provided\s+after|not\s+attached|attached|missing|omitted)\b/i;
const ATTACHMENT_ROW_DOCUMENT_RE =
  /^(?:statement\s+of\s+work|SOW\b|prime\s+contract(?:\s+excerpts?)?|flow[\s-]?down\s+(?:lists?|matrix|matrices)|cybersecurity|CUI\s+requirements?|wage\s+determination|labor\s+category|quality\s+surveillance|acceptance\s+criteria|system\s+security\s+plan|SSP\b|(?:exhibit|attachment|appendix|schedule)\s+[A-Z0-9])/i;''',
    r'''const ATTACHMENT_ROW_STATUS_RE =
  /\b(?:not\s+included|to\s+be\s+provided|provided\s+after|not\s+attached|included|attached|missing|omitted)\b/i;
const ATTACHMENT_DOCUMENT_TITLE_SOURCE =
  String.raw`(?:statement\s+of\s+work|SOW\b|prime\s+contract(?:\s+excerpts?)?|flow[\s-]?down\s+(?:lists?|matrix|matrices)|cybersecurity(?:\s+and\s+CUI\s+requirements?)?|CUI\s+requirements?|wage\s+determination(?:\s+and\s+labor\s+category\s+mapping)?|labor\s+category(?:\s+mapping)?|quality\s+surveillance(?:\s+and\s+acceptance\s+criteria)?|acceptance\s+criteria|system\s+security\s+plan|SSP\b)`;
const ATTACHMENT_ROW_DOCUMENT_RE = new RegExp(
  String.raw`^(?:(?:exhibit|attachment|appendix|schedule)\s+[A-Z0-9]+\s+)?${ATTACHMENT_DOCUMENT_TITLE_SOURCE}|^(?:exhibit|attachment|appendix|schedule)\s+[A-Z0-9]+\b`,
  "i"
);''',
    "define complete attachment-row title grammar",
)

replace_once(
    "lib/analyzer/deterministic.ts",
    r'''function numberedBlockLooksLikeAttachmentRow(block: string): boolean {
  const content = block.replace(/^\s*(?:Section\s+)?\d+\.\s+/, "");
  return ATTACHMENT_ROW_DOCUMENT_RE.test(content) && ATTACHMENT_ROW_STATUS_RE.test(content.slice(0, 320));
}''',
    r'''function numberedBlockLooksLikeAttachmentRow(block: string): boolean {
  const content = block.replace(/^\s*(?:Section\s+)?\d+\.\s+/, "");
  const documentMatch = ATTACHMENT_ROW_DOCUMENT_RE.exec(content);
  if (!documentMatch) return false;
  const tail = content.slice(documentMatch[0].length, documentMatch[0].length + 180);
  const statusMatch = ATTACHMENT_ROW_STATUS_RE.exec(tail);
  if (!statusMatch) return false;
  const betweenTitleAndStatus = tail.slice(0, statusMatch.index);
  return /^\s*(?:[-–—:]\s*)?(?:is\s+)?$/i.test(betweenTitleAndStatus);
}''',
    "distinguish numbered attachment rows from document peer sections",
)

replace_once(
    "lib/analyzer/deterministic.ts",
    r'''function findInvoiceWaiverSentenceIndex(sentences: string[]): number {
  return sentences.findIndex(
    (sentence) => INVOICE_PAYMENT_WAIVER_RE.test(sentence) || INVOICE_PAYMENT_FORFEITURE_SENTENCE_RE.test(sentence)
  );
}

function hasInvoicePaymentWaiverEvidence(block: string): boolean {
  const sentences = block.split(/(?<=[.!?])\s+/);
  return sentences.some((sentence, index) => {
    if (INVOICE_PAYMENT_WAIVER_RE.test(sentence)) return true;
    return (
      INVOICE_PAYMENT_FORFEITURE_SENTENCE_RE.test(sentence) &&
      index > 0 &&
      INVOICE_SUBMISSION_DEADLINE_RE.test(sentences[index - 1])
    );
  });
}

function hasPaymentRightPreservationEvidence(block: string): boolean {
  const sentences = block.split(/(?<=[.!?])\s+/);
  const waiverIndex = findInvoiceWaiverSentenceIndex(sentences);
  if (waiverIndex < 0) return false;

  const waiverSentence = sentences[waiverIndex];
  const connector = PAYMENT_PRESERVATION_CONNECTOR_RE.exec(waiverSentence);
  const waiverScope = connector ? waiverSentence.slice(0, connector.index) : waiverSentence;
  let waivedInvoiceIds = extractInvoiceIds(waiverScope);
  const previousSentence = sentences[waiverIndex - 1] ?? "";
  if (
    waivedInvoiceIds.length === 0 &&
    INVOICE_PAYMENT_FORFEITURE_SENTENCE_RE.test(waiverScope) &&
    /\b(?:the|this|such)\s+invoice\b/i.test(waiverScope) &&
    INVOICE_SUBMISSION_DEADLINE_RE.test(previousSentence)
  ) {
    waivedInvoiceIds = extractInvoiceIds(previousSentence);
  }
  if (connector) {
    const preservationScope = waiverSentence.slice(connector.index);
    if (sentencePreservesPayment(preservationScope, waivedInvoiceIds)) return true;
  }

  const nextSentence = sentences[waiverIndex + 1] ?? "";
  return sentencePreservesPayment(nextSentence, waivedInvoiceIds);
}

function findInvoicePaymentWaiverCandidate(documentText: string): string | null {
  return findClauseCandidate(
    documentText,
    (block) => hasInvoicePaymentWaiverEvidence(block) && !hasPaymentRightPreservationEvidence(block)
  );
}''',
    r'''function invoiceWaiverSentenceIndexes(sentences: string[]): number[] {
  return sentences.flatMap((sentence, index) => {
    if (INVOICE_PAYMENT_WAIVER_RE.test(sentence)) return [index];
    if (
      INVOICE_PAYMENT_FORFEITURE_SENTENCE_RE.test(sentence) &&
      index > 0 &&
      INVOICE_SUBMISSION_DEADLINE_RE.test(sentences[index - 1])
    ) {
      return [index];
    }
    return [];
  });
}

function waivedInvoiceIdsForSentence(sentences: string[], waiverIndex: number, waiverScope: string): string[] {
  const directIds = extractInvoiceIds(waiverScope);
  if (directIds.length > 0) return directIds;

  const previousSentence = sentences[waiverIndex - 1] ?? "";
  if (
    INVOICE_PAYMENT_FORFEITURE_SENTENCE_RE.test(waiverScope) &&
    /\b(?:the|this|such)\s+invoice\b/i.test(waiverScope) &&
    INVOICE_SUBMISSION_DEADLINE_RE.test(previousSentence)
  ) {
    return extractInvoiceIds(previousSentence);
  }
  return [];
}

function invoiceWaiverIsPreserved(sentences: string[], waiverIndex: number): boolean {
  const waiverSentence = sentences[waiverIndex];
  const connector = PAYMENT_PRESERVATION_CONNECTOR_RE.exec(waiverSentence);
  const waiverScope = connector ? waiverSentence.slice(0, connector.index) : waiverSentence;
  const waivedInvoiceIds = waivedInvoiceIdsForSentence(sentences, waiverIndex, waiverScope);

  if (connector) {
    const preservationScope = waiverSentence.slice(connector.index);
    if (sentencePreservesPayment(preservationScope, waivedInvoiceIds)) return true;
  }

  const nextSentence = sentences[waiverIndex + 1] ?? "";
  return sentencePreservesPayment(nextSentence, waivedInvoiceIds);
}

function hasUnpreservedInvoicePaymentWaiver(block: string): boolean {
  const sentences = block.split(/(?<=[.!?])\s+/);
  return invoiceWaiverSentenceIndexes(sentences).some(
    (waiverIndex) => !invoiceWaiverIsPreserved(sentences, waiverIndex)
  );
}

function findInvoicePaymentWaiverCandidate(documentText: string): string | null {
  return findClauseCandidate(documentText, hasUnpreservedInvoicePaymentWaiver);
}''',
    "evaluate preservation independently for every waiver",
)

replace_once(
    "lib/analyzer/deterministic.ts",
    r'''const DIRECT_PRIME_PASSIVE_IMPROVEMENT_USE_RE =
  /(?:any\s+)?(?:improvements?(?:\s+or\s+adaptations?)?|adaptations?)(?:(?!\b(?:may|shall|will)\s+be\s+used\s+by\b)[^.]){0,140}(?:may|shall|will)\s+be\s+used\s+by\s+(?:Prime\s+Contractor\b(?!['\u2019]s\b)(?!\s+(?:customer|client|affiliate|agency|end[\s-]?user)\b)|Prime\b(?!['\u2019]s\b)(?!\s+Contractor\b)(?!\s+(?:customer|client|affiliate|agency|end[\s-]?user)\b))/i;''',
    r'''const DIRECT_PRIME_PASSIVE_IMPROVEMENT_USE_RE =
  /(?:any\s+)?(?:improvements?(?:\s+or\s+adaptations?)?|adaptations?)(?:(?!\b(?:may|shall|will)\s+be\s+used\s+by\b|\b(?:while|whereas)\b|\b(?:deliverables?|work\s+products?)\b)[^.]){0,140}(?:may|shall|will)\s+be\s+used\s+by\s+(?:Prime\s+Contractor\b(?!['\u2019]s\b)(?!\s+(?:customer|client|affiliate|agency|end[\s-]?user)\b)|Prime\b(?!['\u2019]s\b)(?!\s+Contractor\b)(?!\s+(?:customer|client|affiliate|agency|end[\s-]?user)\b))/i;''',
    "stop passive use at competing clause or object",
)

replace_once(
    "lib/analyzer/deterministic.ts",
    r'''const ELECTIVE_EITHER_FORUM_RE =
  /Subcontractor\s+(?:may|can)\s+(?:elect|choose)\s+either[^.]{0,220}(?:must|shall|will)\s+be\s+(?:brought|filed)[^.]{0,220}\bor\b[^.]{0,140}(?:must|shall|will)\s+be\s+(?:brought|filed)[^.]{0,160}(?:any\s+other|another|other)\s+(?:court|forum)/i;

export function hasMandatoryForumEvidence(text: string): boolean {
  if (OPTIONAL_SUBCONTRACTOR_ALTERNATIVE_FORUM_RE.test(text) || ELECTIVE_EITHER_FORUM_RE.test(text)) return false;''',
    r'''const ELECTIVE_EITHER_FORUM_RE =
  /Subcontractor\s+(?:may|can)\s+(?:elect|choose)\s+either[^.]{0,220}(?:must|shall|will)\s+be\s+(?:brought|filed)[^.]{0,220}\bor\b[^.]{0,140}(?:must|shall|will)\s+be\s+(?:brought|filed)[^.]{0,160}(?:any\s+other|another|other)\s+(?:court|forum)/i;
const OPTIONAL_VENUE_NOUN_ALTERNATIVE_RE =
  /(?:at\s+(?:the\s+)?Subcontractor(?:'s|\u2019s)\s+option|Subcontractor\s+(?:may|can)\s+(?:elect|choose))[^.]{0,180}(?:venue|jurisdiction)[^.]{0,180}\bor\b[^.]{0,120}(?:any\s+other|another|other)\s+(?:court|forum)/i;

export function hasMandatoryForumEvidence(text: string): boolean {
  if (
    OPTIONAL_SUBCONTRACTOR_ALTERNATIVE_FORUM_RE.test(text) ||
    ELECTIVE_EITHER_FORUM_RE.test(text) ||
    OPTIONAL_VENUE_NOUN_ALTERNATIVE_RE.test(text)
  ) return false;''',
    "honor optional venue-noun alternatives",
)

test_path = Path("lib/analyzer/__tests__/orion-parity-regression.test.mjs")
tests = test_path.read_text()
marker = "\nif (failures > 0) {"
additions = r'''
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
'''
if tests.count(marker) != 1:
    raise SystemExit("structural final regression insertion marker missing or duplicated")
test_path.write_text(tests.replace(marker, additions + marker, 1))
