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
    r'''function findAttachmentListEnd(afterStart: string): number | null {
  const namedEnd = ATTACHMENT_LIST_NAMED_END_RE.exec(afterStart)?.index ?? null;
  NUMBERED_ATTACHMENT_BLOCK_RE.lastIndex = 0;
  const numberedMatches = [...afterStart.matchAll(NUMBERED_ATTACHMENT_BLOCK_RE)];
  let numberedEnd: number | null = null;

  for (let index = 0; index < numberedMatches.length; index++) {
    const start = numberedMatches[index].index ?? 0;
    const nextStart = numberedMatches[index + 1]?.index ?? afterStart.length;
    const block = afterStart.slice(start, Math.min(nextStart, start + 420));
    if (numberedBlockLooksLikeAttachmentRow(block)) continue;
    numberedEnd = start;
    break;
  }

  if (namedEnd === null) return numberedEnd;
  if (numberedEnd === null) return namedEnd;
  return Math.min(namedEnd, numberedEnd);
}''',
    r'''function paragraphLooksLikeAttachmentRow(paragraph: string): boolean {
  const content = paragraph.trim().replace(/^[-•]\s*/, "");
  return ATTACHMENT_ROW_DOCUMENT_RE.test(content) && ATTACHMENT_ROW_STATUS_RE.test(content.slice(0, 320));
}

function findAttachmentParagraphEnd(afterStart: string): number | null {
  const paragraphBreaks = [...afterStart.matchAll(/\n{2,}/g)];
  for (const paragraphBreak of paragraphBreaks) {
    const start = paragraphBreak.index ?? 0;
    const evidenceBeforeBreak = afterStart.slice(0, start);
    if (
      !NAMED_CONTRACT_DOCUMENT_RE.test(evidenceBeforeBreak) ||
      (!DOCUMENT_ABSENCE_RE.test(evidenceBeforeBreak) && !DOCUMENT_DEFERRAL_RE.test(evidenceBeforeBreak))
    ) {
      continue;
    }

    const remaining = afterStart.slice(start + paragraphBreak[0].length).trimStart();
    const nextBreak = remaining.search(/\n{2,}/);
    const nextParagraph = (nextBreak >= 0 ? remaining.slice(0, nextBreak) : remaining).trim();
    if (!nextParagraph) continue;
    if (paragraphLooksLikeAttachmentRow(nextParagraph)) continue;
    return start;
  }
  return null;
}

function findAttachmentListEnd(afterStart: string): number | null {
  const namedEnd = ATTACHMENT_LIST_NAMED_END_RE.exec(afterStart)?.index ?? null;
  const paragraphEnd = findAttachmentParagraphEnd(afterStart);
  NUMBERED_ATTACHMENT_BLOCK_RE.lastIndex = 0;
  const numberedMatches = [...afterStart.matchAll(NUMBERED_ATTACHMENT_BLOCK_RE)];
  let numberedEnd: number | null = null;

  for (let index = 0; index < numberedMatches.length; index++) {
    const start = numberedMatches[index].index ?? 0;
    const nextStart = numberedMatches[index + 1]?.index ?? afterStart.length;
    const block = afterStart.slice(start, Math.min(nextStart, start + 420));
    if (numberedBlockLooksLikeAttachmentRow(block)) continue;
    numberedEnd = start;
    break;
  }

  const candidates = [namedEnd, numberedEnd, paragraphEnd].filter(
    (candidate): candidate is number => candidate !== null
  );
  return candidates.length > 0 ? Math.min(...candidates) : null;
}''',
    "bound Attachment List at paragraph peers",
)

replace_once(
    "lib/analyzer/deterministic.ts",
    r'''const INVOICE_PAYMENT_WAIVER_RE =
  /failure\s+to\s+submit[^.]{0,140}(?:complete\s+)?invoice[^.]{0,140}(?:within|no\s+later\s+than)\s+\d{1,3}\s*(?:calendar|business|working)?\s*days?[^.]{0,120}(?:waives?|forfeits?)\s+(?:Subcontractor(?:'s|\u2019s)?\s+)?(?:the\s+)?(?:right|entitlement)\s+to\s+payment/i;
const EXPLICIT_PAYMENT_RIGHT_PRESERVED_RE =
  /(?:does|shall|will)\s+not\s+(?:waive|forfeit)[^.]{0,80}(?:right|entitlement)\s+to\s+payment|(?:right|entitlement)\s+to\s+payment[^.]{0,80}(?:is|shall|will)\s+not\s+(?:waived|forfeited)/i;
const SAME_SCOPE_PAYMENT_REMAINS_RE =
  /(?:except(?:\s+that)?|however|provided\s+that|but|notwithstanding)[^.]{0,180}(?:(?:the\s+)?(?:affected|subject|late|delayed)\s+(?:invoice|amount|payment)|(?:all\s+)?(?:amounts?|payment)\s+for\s+(?:performed|completed|accepted)\s+(?:work|services|deliverables)|(?:all\s+)?(?:amounts?|payment)\s+(?:for|under)\s+(?:the\s+)?(?:affected|subject|late|delayed)\s+invoice)[^.]{0,120}(?:remain|remains|shall\s+remain|will\s+remain)\s+(?:payable|due)/i;
const OTHER_INVOICE_SCOPE_RE = /\b(?:other|unrelated|separate)\s+invoices?\b|\binvoice\s+(?:no\.?\s*)?\d+\b|\brather\s+than\b/i;
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
}

function findInvoicePaymentWaiverCandidate(documentText: string): string | null {
  return findClauseCandidate(
    documentText,
    (block) => INVOICE_PAYMENT_WAIVER_RE.test(block) && !hasPaymentRightPreservationEvidence(block)
  );
}''',
    r'''const INVOICE_PAYMENT_WAIVER_RE =
  /failure\s+to\s+submit[^.]{0,140}(?:complete\s+)?invoice[^.]{0,140}(?:within|no\s+later\s+than)\s+\d{1,3}\s*(?:calendar|business|working)?\s*days?[^.]{0,120}(?:waives?|forfeits?)\s+(?:Subcontractor(?:'s|\u2019s)?\s+)?(?:the\s+)?(?:right|entitlement)\s+to\s+payment/i;
const INVOICE_SUBMISSION_DEADLINE_RE =
  /\binvoices?\b[^.]{0,120}(?:must|shall|should|are\s+required\s+to\s+be)\s+submitted[^.]{0,80}(?:within|no\s+later\s+than)\s+\d{1,3}\s*(?:calendar|business|working)?\s*days?/i;
const INVOICE_PAYMENT_FORFEITURE_SENTENCE_RE =
  /failure\s+to\s+submit[^.]{0,160}\binvoice\b[^.]{0,120}(?:waives?|forfeits?)\s+(?:Subcontractor(?:'s|\u2019s)?\s+)?(?:the\s+)?(?:right|entitlement)\s+to\s+payment/i;
const EXPLICIT_PAYMENT_RIGHT_PRESERVED_RE =
  /(?:does|shall|will)\s+not\s+(?:waive|forfeit)[^.]{0,80}(?:right|entitlement)\s+to\s+payment|(?:right|entitlement)\s+to\s+payment[^.]{0,80}(?:is|shall|will)\s+not\s+(?:waived|forfeited)/i;
const SAME_SCOPE_PAYMENT_REMAINS_RE =
  /(?:except(?:\s+that)?|however|provided\s+that|but|notwithstanding)[^.]{0,180}(?:(?:the\s+)?(?:affected|subject|late|delayed)\s+(?:invoice|amount|payment)|(?:all\s+)?(?:amounts?|payment)\s+for\s+(?:performed|completed|accepted)\s+(?:work|services|deliverables)|(?:all\s+)?(?:amounts?|payment)\s+(?:for|under)\s+(?:the\s+)?(?:affected|subject|late|delayed)\s+invoice)[^.]{0,120}(?:remain|remains|shall\s+remain|will\s+remain)\s+(?:payable|due)/i;
const OTHER_INVOICE_SCOPE_RE = /\b(?:other|unrelated|separate)\s+invoices?\b|\brather\s+than\b/i;
const PAYMENT_PRESERVATION_CONNECTOR_RE =
  /(?:,\s*)?\b(?:except(?:\s+that)?|however|provided\s+that|but|notwithstanding)\b/i;
const NAMED_INVOICE_PAYABLE_RE =
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
}

function findInvoiceWaiverSentenceIndex(sentences: string[]): number {
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
  const waivedInvoiceIds = extractInvoiceIds(waiverScope);
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
    "carry invoice waiver and compare named invoice scope",
)

replace_once(
    "lib/analyzer/deterministic.ts",
    r'''const DIRECT_PRIME_PASSIVE_USE_RE =
  /(?:may|shall|will)\s+be\s+used\s+by\s+(?:Prime\s+Contractor\b(?!['\u2019]s\b)(?!\s+(?:customer|client|affiliate|agency|end[\s-]?user)\b)|Prime\b(?!['\u2019]s\b)(?!\s+Contractor\b)(?!\s+(?:customer|client|affiliate|agency|end[\s-]?user)\b))/i;
const DIRECT_PRIME_ACTIVE_USE_RE =
  /(?:Prime\s+Contractor\b(?!['\u2019]s\b)(?!\s+(?:customer|client|affiliate|agency|end[\s-]?user)\b)|Prime\b(?!['\u2019]s\b)(?!\s+Contractor\b)(?!\s+(?:customer|client|affiliate|agency|end[\s-]?user)\b))\s+(?:(?:may|shall|will)\s+use|(?:has|shall\s+have|will\s+have)\s+the\s+right\s+to\s+use|(?:is|shall\s+be|will\s+be)\s+entitled\s+to\s+use)/i;
const IMPROVEMENTS_OR_ADAPTATIONS_RE = /improvements?|adaptations?/i;
const WITHOUT_ADDITIONAL_PAYMENT_RE =
  /without\s+(?:additional\s+)?(?:payment|compensation|charge|fee)/i;

export function hasUnpaidPrimeImprovementsUseEvidence(text: string): boolean {
  const sentences = text.split(/(?<=[.!?])\s+/);
  return sentences.some(
    (sentence) =>
      IMPROVEMENTS_OR_ADAPTATIONS_RE.test(sentence) &&
      WITHOUT_ADDITIONAL_PAYMENT_RE.test(sentence) &&
      (DIRECT_PRIME_PASSIVE_USE_RE.test(sentence) || DIRECT_PRIME_ACTIVE_USE_RE.test(sentence))
  );
}''',
    r'''const DIRECT_PRIME_PASSIVE_IMPROVEMENT_USE_RE =
  /(?:any\s+)?(?:improvements?(?:\s+or\s+adaptations?)?|adaptations?)[^.]{0,140}(?:may|shall|will)\s+be\s+used\s+by\s+(?:Prime\s+Contractor\b(?!['\u2019]s\b)(?!\s+(?:customer|client|affiliate|agency|end[\s-]?user)\b)|Prime\b(?!['\u2019]s\b)(?!\s+Contractor\b)(?!\s+(?:customer|client|affiliate|agency|end[\s-]?user)\b))/i;
const DIRECT_PRIME_ACTIVE_IMPROVEMENT_USE_RE =
  /(?:Prime\s+Contractor\b(?!['\u2019]s\b)(?!\s+(?:customer|client|affiliate|agency|end[\s-]?user)\b)|Prime\b(?!['\u2019]s\b)(?!\s+Contractor\b)(?!\s+(?:customer|client|affiliate|agency|end[\s-]?user)\b))\s+(?:(?:may|shall|will)\s+use|(?:has|shall\s+have|will\s+have)\s+the\s+right\s+to\s+use|(?:is|shall\s+be|will\s+be)\s+entitled\s+to\s+use)\s+(?:(?:any|the|such|stated|those|Subcontractor[\s-]created)\s+){0,3}(?:improvements?(?:\s+or\s+adaptations?)?|adaptations?)\b/i;
const WITHOUT_ADDITIONAL_PAYMENT_RE =
  /without\s+(?:additional\s+)?(?:payment|compensation|charge|fee)/i;

export function hasUnpaidPrimeImprovementsUseEvidence(text: string): boolean {
  const sentences = text.split(/(?<=[.!?])\s+/);
  return sentences.some(
    (sentence) =>
      WITHOUT_ADDITIONAL_PAYMENT_RE.test(sentence) &&
      (DIRECT_PRIME_PASSIVE_IMPROVEMENT_USE_RE.test(sentence) ||
        DIRECT_PRIME_ACTIVE_IMPROVEMENT_USE_RE.test(sentence))
  );
}''',
    "bind Prime use verb to improvements object",
)

replace_once(
    "lib/analyzer/deterministic.ts",
    r'''const EXCLUSIVE_FORUM_RE =
  /(?:the\s+)?exclusive\s+forum(?:\s+for[^.]{0,100})?\s+(?:shall|must|will)\s+be[^.]{0,140}(?:courts?|County|State|Commonwealth)/i;

export function hasMandatoryForumEvidence(text: string): boolean {
  return BASE_FORUM_EVIDENCE_RE.test(text) || DIRECT_MANDATORY_FORUM_RE.test(text) || EXCLUSIVE_FORUM_RE.test(text);
}''',
    r'''const EXCLUSIVE_FORUM_RE =
  /(?:the\s+)?exclusive\s+forum(?:\s+for[^.]{0,100})?\s+(?:shall|must|will)\s+be[^.]{0,140}(?:courts?|County|State|Commonwealth)/i;
const OPTIONAL_SUBCONTRACTOR_ALTERNATIVE_FORUM_RE =
  /(?:at\s+(?:the\s+)?Subcontractor(?:'s|\u2019s)\s+option|Subcontractor\s+(?:may|can)\s+(?:elect|choose))[^.]{0,240}(?:must|shall|will)\s+be\s+(?:brought|filed)[^.]{0,260}Subcontractor\s+(?:may|can)\s+(?:instead\s+|alternatively\s+)?(?:bring|file)[^.]{0,140}(?:any|another|other)\s+(?:court|forum)/i;

export function hasMandatoryForumEvidence(text: string): boolean {
  if (OPTIONAL_SUBCONTRACTOR_ALTERNATIVE_FORUM_RE.test(text)) return false;
  return BASE_FORUM_EVIDENCE_RE.test(text) || DIRECT_MANDATORY_FORUM_RE.test(text) || EXCLUSIVE_FORUM_RE.test(text);
}''',
    "exclude optional Subcontractor forum branch",
)

test_path = Path("lib/analyzer/__tests__/orion-parity-regression.test.mjs")
tests = test_path.read_text()
marker = "\nif (failures > 0) {"
additions = r'''
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
'''
if tests.count(marker) != 1:
    raise SystemExit("final review regression insertion marker missing or duplicated")
test_path.write_text(tests.replace(marker, additions + marker, 1))
