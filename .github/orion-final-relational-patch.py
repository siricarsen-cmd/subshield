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
    r'''function numberedBlockLooksLikeAttachmentRow(block: string): boolean {
  const content = block.replace(/^\s*(?:Section\s+)?\d+\.\s+/, "");
  const documentMatch = ATTACHMENT_ROW_DOCUMENT_RE.exec(content);
  if (!documentMatch) return false;
  const tail = content.slice(documentMatch[0].length, documentMatch[0].length + 180);
  const statusMatch = ATTACHMENT_ROW_STATUS_RE.exec(tail);
  if (!statusMatch) return false;
  const betweenTitleAndStatus = tail.slice(0, statusMatch.index);
  return /^\s*(?:[-–—:]\s*)?(?:is\s+)?$/i.test(betweenTitleAndStatus);
}

function paragraphLooksLikeAttachmentRow(paragraph: string): boolean {
  const content = paragraph.trim().replace(/^[-•]\s*/, "");
  return ATTACHMENT_ROW_DOCUMENT_RE.test(content) && ATTACHMENT_ROW_STATUS_RE.test(content.slice(0, 320));
}''',
    r'''function attachmentTextLooksLikeRow(content: string): boolean {
  const documentMatch = ATTACHMENT_ROW_DOCUMENT_RE.exec(content);
  if (!documentMatch) return false;
  const tail = content.slice(documentMatch[0].length, documentMatch[0].length + 180);
  const statusMatch = ATTACHMENT_ROW_STATUS_RE.exec(tail);
  if (!statusMatch) return false;
  const betweenTitleAndStatus = tail.slice(0, statusMatch.index);
  return /^\s*(?:[-–—:]\s*)?(?:is\s+)?$/i.test(betweenTitleAndStatus);
}

function numberedBlockLooksLikeAttachmentRow(block: string): boolean {
  const content = block.replace(/^\s*(?:Section\s+)?\d+\.\s+/, "");
  return attachmentTextLooksLikeRow(content);
}

function paragraphLooksLikeAttachmentRow(paragraph: string): boolean {
  const content = paragraph.trim().replace(/^[-•]\s*/, "");
  return attachmentTextLooksLikeRow(content);
}''',
    "reuse strict attachment-row grammar for paragraphs",
)

replace_once(
    "lib/analyzer/deterministic.ts",
    r'''const NAMED_INVOICE_PAYABLE_RE =
  /\binvoice\s+(?:no\.?\s*)?[A-Z0-9-]*\d[A-Z0-9-]*\b[^.]{0,100}(?:remain|remains|shall\s+remain|will\s+remain)\s+(?:payable|due)/i;

function extractInvoiceIds(text: string): string[] {
  return [...text.matchAll(/\binvoice\s+(?:no\.?\s*)?([A-Z0-9-]*\d[A-Z0-9-]*)\b/gi)].map(
    (match) => match[1].toUpperCase()
  );
}

function sentencePreservesPayment(sentence: string, waivedInvoiceIds: string[]): boolean {
  if (OTHER_INVOICE_SCOPE_RE.test(sentence)) return false;
  const preservedInvoiceIds = extractInvoiceIds(sentence);
  if (preservedInvoiceIds.length > 0) {
    const preservesWaivedInvoice =
      waivedInvoiceIds.length > 0 && preservedInvoiceIds.some((invoiceId) => waivedInvoiceIds.includes(invoiceId));
    if (!preservesWaivedInvoice) return false;
    return NAMED_INVOICE_PAYABLE_RE.test(sentence) || EXPLICIT_PAYMENT_RIGHT_PRESERVED_RE.test(sentence);
  }
  return EXPLICIT_PAYMENT_RIGHT_PRESERVED_RE.test(sentence) || SAME_SCOPE_PAYMENT_REMAINS_RE.test(sentence);
}''',
    r'''function extractInvoiceIds(text: string): string[] {
  return [...text.matchAll(/\binvoice\s+(?:no\.?\s*)?([A-Z0-9-]*\d[A-Z0-9-]*)\b/gi)].map(
    (match) => match[1].toUpperCase()
  );
}

function escapeRegexLiteral(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function namedInvoiceRemainsPayable(sentence: string, invoiceId: string): boolean {
  const escapedInvoiceId = escapeRegexLiteral(invoiceId);
  const invoiceThenPayable = new RegExp(
    `\\binvoice\\s+(?:no\\.?\\s*)?${escapedInvoiceId}\\b[^.]{0,100}(?:remain|remains|shall\\s+remain|will\\s+remain)\\s+(?:payable|due)`,
    "i"
  );
  const payableThenInvoice = new RegExp(
    `(?:remain|remains|shall\\s+remain|will\\s+remain)\\s+(?:payable|due)[^.]{0,100}\\binvoice\\s+(?:no\\.?\\s*)?${escapedInvoiceId}\\b`,
    "i"
  );
  return invoiceThenPayable.test(sentence) || payableThenInvoice.test(sentence);
}

function sentencePreservesPayment(sentence: string, waivedInvoiceIds: string[]): boolean {
  if (OTHER_INVOICE_SCOPE_RE.test(sentence)) return false;
  const preservedInvoiceIds = extractInvoiceIds(sentence);
  if (preservedInvoiceIds.length > 0) {
    const mentionsWaivedInvoice =
      waivedInvoiceIds.length > 0 && preservedInvoiceIds.some((invoiceId) => waivedInvoiceIds.includes(invoiceId));
    if (!mentionsWaivedInvoice) return false;
    const makesWaivedInvoicePayable = waivedInvoiceIds.some((invoiceId) =>
      namedInvoiceRemainsPayable(sentence, invoiceId)
    );
    return makesWaivedInvoicePayable || EXPLICIT_PAYMENT_RIGHT_PRESERVED_RE.test(sentence);
  }
  return EXPLICIT_PAYMENT_RIGHT_PRESERVED_RE.test(sentence) || SAME_SCOPE_PAYMENT_REMAINS_RE.test(sentence);
}''',
    "bind payable predicate to waived invoice ID",
)

replace_once(
    "lib/analyzer/deterministic.ts",
    r'''const DIRECT_PRIME_PASSIVE_IMPROVEMENT_USE_RE =
  /(?:any\s+)?(?:improvements?(?:\s+or\s+adaptations?)?|adaptations?)(?:(?!\b(?:may|shall|will)\s+be\s+used\s+by\b|\b(?:while|whereas)\b|\b(?:deliverables?|work\s+products?)\b)[^.]){0,140}(?:may|shall|will)\s+be\s+used\s+by\s+(?:Prime\s+Contractor\b(?!['\u2019]s\b)(?!\s+(?:customer|client|affiliate|agency|end[\s-]?user)\b)|Prime\b(?!['\u2019]s\b)(?!\s+Contractor\b)(?!\s+(?:customer|client|affiliate|agency|end[\s-]?user)\b))/i;''',
    r'''const DIRECT_PRIME_PASSIVE_IMPROVEMENT_USE_RE =
  /(?:any\s+)?(?:improvements?(?:\s+or\s+adaptations?)?|adaptations?)(?:\s+(?:that|which|are|were|is|was|created|developed|generated|made|produced|conceived|arising|during|under|in|for|through|the|this|such|subcontract|agreement|performance|by|Subcontractor)){0,16}\s+(?:may|shall|will)\s+be\s+used\s+by\s+(?:Prime\s+Contractor\b(?!['\u2019]s\b)(?!\s+(?:customer|client|affiliate|agency|end[\s-]?user)\b)|Prime\b(?!['\u2019]s\b)(?!\s+Contractor\b)(?!\s+(?:customer|client|affiliate|agency|end[\s-]?user)\b))/i;''',
    "require passive Prime-use predicate to govern improvements noun",
)

replace_once(
    "lib/analyzer/deterministic.ts",
    r'''const BASE_FORUM_EVIDENCE_RE =
  /(?:exclusive\s+)?(?:venue|jurisdiction)\s+(?:shall\s+be\s+|is\s+|lies\s+|must\s+be\s+)?(?:in|located\s+in)[^.]{0,120}(?:courts?|County|State|Commonwealth)|binding\s+arbitration|Prime(?:\s+Contractor)?\s+elects?\s+(?:another|a\s+different|an\s+alternate)\s+forum/i;''',
    r'''const BASE_FORUM_EVIDENCE_RE =
  /(?:exclusive\s+(?:venue|jurisdiction)\s+(?:(?:shall|must|will)\s+be\s+|is\s+|lies\s+)?(?:in|located\s+in)|(?:venue|jurisdiction)\s+(?:(?:shall|must|will)\s+be\s+|is\s+|lies\s+)(?:in|located\s+in))[^.]{0,120}(?:courts?|County|State|Commonwealth)|binding\s+arbitration|Prime(?:\s+Contractor)?\s+elects?\s+(?:another|a\s+different|an\s+alternate)\s+forum/i;''',
    "require mandatory or exclusive base venue language",
)

replace_once(
    "lib/analyzer/deterministic.ts",
    r'''const OPTIONAL_VENUE_NOUN_ALTERNATIVE_RE =
  /(?:at\s+(?:the\s+)?Subcontractor(?:'s|\u2019s)\s+option|Subcontractor\s+(?:may|can)\s+(?:elect|choose))[^.]{0,180}(?:venue|jurisdiction)[^.]{0,180}\bor\b[^.]{0,120}(?:any\s+other|another|other)\s+(?:court|forum)/i;

export function hasMandatoryForumEvidence(text: string): boolean {
  if (
    OPTIONAL_SUBCONTRACTOR_ALTERNATIVE_FORUM_RE.test(text) ||
    ELECTIVE_EITHER_FORUM_RE.test(text) ||
    OPTIONAL_VENUE_NOUN_ALTERNATIVE_RE.test(text)
  ) return false;''',
    r'''const OPTIONAL_VENUE_NOUN_ALTERNATIVE_RE =
  /(?:at\s+(?:the\s+)?Subcontractor(?:'s|\u2019s)\s+option|Subcontractor\s+(?:may|can)\s+(?:elect|choose))[^.]{0,180}(?:venue|jurisdiction)[^.]{0,180}\bor\b[^.]{0,120}(?:any\s+other|another|other)\s+(?:court|forum)/i;
const BILATERAL_OPTIONAL_FORUM_RE =
  /(?:the\s+)?parties\s+(?:may|can)\s+(?:agree|select|choose|elect)[^.]{0,180}(?:venue|jurisdiction|forum)[^.]{0,180}\bor\b[^.]{0,140}(?:another|other|mutually\s+convenient)\s+(?:court|forum)/i;

export function hasMandatoryForumEvidence(text: string): boolean {
  if (
    OPTIONAL_SUBCONTRACTOR_ALTERNATIVE_FORUM_RE.test(text) ||
    ELECTIVE_EITHER_FORUM_RE.test(text) ||
    OPTIONAL_VENUE_NOUN_ALTERNATIVE_RE.test(text) ||
    BILATERAL_OPTIONAL_FORUM_RE.test(text)
  ) return false;''',
    "exclude bilateral optional forum selection",
)

test_path = Path("lib/analyzer/__tests__/orion-parity-regression.test.mjs")
tests = test_path.read_text()
marker = "\nif (failures > 0) {"
additions = r'''
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
'''
if tests.count(marker) != 1:
    raise SystemExit("final relational regression insertion marker missing or duplicated")
test_path.write_text(tests.replace(marker, additions + marker, 1))
