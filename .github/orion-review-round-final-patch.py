from pathlib import Path


def replace_once(path: str, old: str, new: str, label: str) -> None:
    file_path = Path(path)
    text = file_path.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    file_path.write_text(text.replace(old, new, 1))


replace_once(
    "lib/analyzer/anchors.ts",
    r'''const EXPLICIT_TYPE_LABEL =
  /(?:subcontract\s+type|type\s+of\s+(?:subcontract|agreement)|contract\s+type)\s*(?::|[-\u2010-\u2015])?\s*(?:\n\s*)?((?:T\s*&\s*M|FFP|firm[\s-]*fixed[\s-]*price|time[\s-]*(?:and|&)[\s-]*materials|labor[\s-]hour|cost[\s-]*plus[\s-]*fixed[\s-]*fee|cost[\s-]reimburs(?:ement|able)|indefinite[\s-]delivery|IDIQ|purchase\s+order|teaming\s+agreement)[^\n]{0,60})/i;''',
    r'''const EXPLICIT_TYPE_LABEL =
  /(?:subcontract\s+type|type\s+of\s+(?:subcontract|agreement)|contract\s+type)\s*(?::|[-\u2010-\u2015])?\s*(?:\n\s*)?([^\n.]{1,100})/i;''',
    "capture bounded explicit type labels before validating their contents",
)

replace_once(
    "lib/analyzer/anchors.ts",
    r'''  const explicitTypeLabel = firstMatch(text, EXPLICIT_TYPE_LABEL);
  const contractTypeMatch = CONTRACT_TYPE_PATTERNS.find((p) => p.pattern.test(text));''',
    r'''  const explicitTypeLabelCandidate = firstMatch(text, EXPLICIT_TYPE_LABEL);
  const explicitTypeLabel =
    explicitTypeLabelCandidate &&
    CONTRACT_TYPE_PATTERNS.some((pattern) => pattern.pattern.test(explicitTypeLabelCandidate))
      ? explicitTypeLabelCandidate.trim()
      : undefined;
  const contractTypeMatch = CONTRACT_TYPE_PATTERNS.find((p) => p.pattern.test(text));''',
    "validate explicit type labels by recognized evidence without requiring the first word to be a type",
)

replace_once(
    "lib/analyzer/deterministic.ts",
    r'''const ATTACHMENT_ROW_DOCUMENT_RE = new RegExp(
  String.raw`^(?:(?:exhibit|attachment|appendix|schedule)\s+[A-Z0-9]+\s+)?${ATTACHMENT_DOCUMENT_TITLE_SOURCE}|^(?:exhibit|attachment|appendix|schedule)\s+[A-Z0-9]+\b`,
  "i"
);''',
    r'''const ATTACHMENT_ROW_DOCUMENT_RE = new RegExp(
  String.raw`^(?:(?:exhibit|attachment|appendix|schedule)\s+[A-Z0-9]+\s*(?:[-–—:]\s*)?)?${ATTACHMENT_DOCUMENT_TITLE_SOURCE}|^(?:exhibit|attachment|appendix|schedule)\s+[A-Z0-9]+\b`,
  "i"
);''',
    "treat attachment labels and following document titles as one row title",
)

replace_once(
    "lib/analyzer/deterministic.ts",
    r'''const INVOICE_PAYMENT_FORFEITURE_SENTENCE_RE =
  /failure\s+to\s+submit[^.]{0,160}\binvoice\b[^.]{0,120}(?:waives?|forfeits?)\s+(?:Subcontractor(?:'s|\u2019s)?\s+)?(?:the\s+)?(?:right|entitlement)\s+to\s+payment/i;''',
    r'''const INVOICE_PAYMENT_FORFEITURE_SENTENCE_RE =
  /failure\s+to\s+submit[^.]{0,160}\binvoice\b[^.]{0,120}(?:waives?|forfeits?)\s+(?:Subcontractor(?:'s|\u2019s)?\s+)?(?:the\s+)?(?:right|entitlement)\s+to\s+payment/i;
const INVOICE_PAYMENT_FORFEITURE_CONTEXT_RE =
  /failure\s+to\s+(?:do\s+so|submit\s+(?:it|them)|timely\s+submit(?:\s+(?:it|them))?|submit\s+on\s+time)[^.]{0,120}(?:waives?|forfeits?)\s+(?:Subcontractor(?:'s|\u2019s)?\s+)?(?:the\s+)?(?:right|entitlement)\s+to\s+payment/i;''',
    "recognize contextual invoice-forfeiture pronouns",
)

replace_once(
    "lib/analyzer/deterministic.ts",
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
}''',
    r'''function invoiceWaiverSentenceIndexes(sentences: string[]): number[] {
  return sentences.flatMap((sentence, index) => {
    if (INVOICE_PAYMENT_WAIVER_RE.test(sentence)) return [index];
    const carriesPriorInvoiceDeadline =
      INVOICE_PAYMENT_FORFEITURE_SENTENCE_RE.test(sentence) ||
      INVOICE_PAYMENT_FORFEITURE_CONTEXT_RE.test(sentence);
    if (
      carriesPriorInvoiceDeadline &&
      index > 0 &&
      INVOICE_SUBMISSION_DEADLINE_RE.test(sentences[index - 1])
    ) {
      return [index];
    }
    return [];
  });
}''',
    "carry invoice deadline context into adjacent forfeiture sentences",
)

replace_once(
    "lib/analyzer/deterministic.ts",
    r'''  if (
    INVOICE_PAYMENT_FORFEITURE_SENTENCE_RE.test(waiverScope) &&
    /\b(?:the|this|such)\s+invoice\b/i.test(waiverScope) &&
    INVOICE_SUBMISSION_DEADLINE_RE.test(previousSentence)
  ) {
    return extractInvoiceIds(previousSentence);
  }''',
    r'''  const refersBackToPriorInvoice =
    (INVOICE_PAYMENT_FORFEITURE_SENTENCE_RE.test(waiverScope) &&
      /\b(?:the|this|such)\s+invoice\b/i.test(waiverScope)) ||
    INVOICE_PAYMENT_FORFEITURE_CONTEXT_RE.test(waiverScope);
  if (refersBackToPriorInvoice && INVOICE_SUBMISSION_DEADLINE_RE.test(previousSentence)) {
    return extractInvoiceIds(previousSentence);
  }''',
    "carry named invoice identifiers through contextual references",
)

replace_once(
    "lib/analyzer/deterministic.ts",
    r'''function coordinatedIpUseSegments(sentence: string): string[] {
  return sentence
    .split(/;\s*|,\s*(?:and|but|while|whereas)\s+/i)
    .map((segment) => segment.trim())
    .filter(Boolean);
}

export function hasUnpaidPrimeImprovementsUseEvidence(text: string): boolean {
  const sentences = text.split(/(?<=[.!?])\s+/);
  return sentences.some((sentence) =>
    coordinatedIpUseSegments(sentence).some(
      (segment) =>
        WITHOUT_ADDITIONAL_PAYMENT_RE.test(segment) &&
        (DIRECT_PRIME_PASSIVE_IMPROVEMENT_USE_RE.test(segment) ||
          DIRECT_PRIME_ACTIVE_IMPROVEMENT_USE_RE.test(segment))
    )
  );
}''',
    r'''function coordinatedIpUseSegments(sentence: string): string[] {
  return sentence
    .split(
      /;\s*|,\s*(?:and|but|while|whereas)\s+|\s+and\s+(?=(?:deliverables?|services?|work\s+products?|improvements?|adaptations?)\b[^.]{0,80}\b(?:may|shall|will|is|are|has|have)\b)/i
    )
    .map((segment) => segment.trim())
    .filter(Boolean);
}

const COMPETING_IP_GRANT_BOUNDARY_RE =
  /\b(?:and|but|while|whereas)\s+(?=(?:deliverables?|services?|work\s+products?|improvements?|adaptations?|Subcontractor|Prime(?:\s+Contractor)?)\b[^.]{0,100}\b(?:may|shall|will|is|are|has|have)\b)/i;

function primeImprovementsUseGrantWindow(segment: string): string | null {
  const candidates = [
    DIRECT_PRIME_PASSIVE_IMPROVEMENT_USE_RE.exec(segment),
    DIRECT_PRIME_ACTIVE_IMPROVEMENT_USE_RE.exec(segment),
  ].filter((match): match is RegExpExecArray => match !== null);
  if (candidates.length === 0) return null;
  const match = candidates.sort((left, right) => left.index - right.index)[0];
  const afterMatch = segment.slice(match.index + match[0].length);
  const boundary = COMPETING_IP_GRANT_BOUNDARY_RE.exec(afterMatch);
  const grantEnd = boundary ? match.index + match[0].length + boundary.index : segment.length;
  return segment.slice(match.index, grantEnd);
}

export function hasUnpaidPrimeImprovementsUseEvidence(text: string): boolean {
  const sentences = text.split(/(?<=[.!?])\s+/);
  return sentences.some((sentence) =>
    coordinatedIpUseSegments(sentence).some((segment) => {
      const grantWindow = primeImprovementsUseGrantWindow(segment);
      return Boolean(grantWindow && WITHOUT_ADDITIONAL_PAYMENT_RE.test(grantWindow));
    })
  );
}''',
    "bind no-payment evidence to the matched Prime improvements-use grant",
)

replace_once(
    "lib/analyzer/deterministic.ts",
    r'''function forumEvidenceSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

export function hasMandatoryForumEvidence(text: string): boolean {
  return forumEvidenceSentences(text).some((sentence) => {
    if (
      OPTIONAL_SUBCONTRACTOR_ALTERNATIVE_FORUM_RE.test(sentence) ||
      ELECTIVE_EITHER_FORUM_RE.test(sentence) ||
      OPTIONAL_VENUE_NOUN_ALTERNATIVE_RE.test(sentence) ||
      BILATERAL_OPTIONAL_FORUM_RE.test(sentence)
    ) return false;
    return (
      BASE_FORUM_EVIDENCE_RE.test(sentence) ||
      DIRECT_MANDATORY_FORUM_RE.test(sentence) ||
      EXCLUSIVE_FORUM_RE.test(sentence)
    );
  });
}''',
    r'''const OPTIONAL_FORUM_EVIDENCE_RES = [
  OPTIONAL_SUBCONTRACTOR_ALTERNATIVE_FORUM_RE,
  ELECTIVE_EITHER_FORUM_RE,
  OPTIONAL_VENUE_NOUN_ALTERNATIVE_RE,
  BILATERAL_OPTIONAL_FORUM_RE,
];

function forumEvidenceSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function forumEvidenceClauses(sentence: string): string[] {
  return sentence
    .split(/\s*;\s*/)
    .map((clause) => clause.trim())
    .filter(Boolean);
}

function optionalForumChoiceSpansSemicolon(sentence: string): boolean {
  return OPTIONAL_FORUM_EVIDENCE_RES.some((pattern) => {
    const match = pattern.exec(sentence);
    return Boolean(match?.[0].includes(";"));
  });
}

function clauseHasOptionalForumChoice(clause: string): boolean {
  return OPTIONAL_FORUM_EVIDENCE_RES.some((pattern) => pattern.test(clause));
}

export function hasMandatoryForumEvidence(text: string): boolean {
  return forumEvidenceSentences(text).some((sentence) => {
    if (optionalForumChoiceSpansSemicolon(sentence)) return false;
    return forumEvidenceClauses(sentence).some((clause) => {
      if (clauseHasOptionalForumChoice(clause)) return false;
      return (
        BASE_FORUM_EVIDENCE_RE.test(clause) ||
        DIRECT_MANDATORY_FORUM_RE.test(clause) ||
        EXCLUSIVE_FORUM_RE.test(clause)
      );
    });
  });
}''',
    "scope venue optionality to the branch it governs",
)

test_path = Path("lib/analyzer/__tests__/orion-parity-regression.test.mjs")
tests = test_path.read_text()
marker = "\nif (failures > 0) {"
additions = r'''
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
'''
if tests.count(marker) != 1:
    raise SystemExit("review-round regression insertion marker missing or duplicated")
test_path.write_text(tests.replace(marker, additions + marker, 1))
