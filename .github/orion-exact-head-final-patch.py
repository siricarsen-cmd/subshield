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
  /\b(?:not\s+included|to\s+be\s+provided|provided\s+after|not\s+attached|included|attached|missing|omitted)\b/i;''',
    r'''const ATTACHMENT_ROW_STATUS_RE =
  /\b(?:not\s+(?:included|provided|available|attached)|to\s+be\s+provided|provided\s+after|included|attached|missing|omitted)\b/i;''',
    "recognize ordinary unavailable attachment-row statuses",
)

replace_once(
    "lib/analyzer/deterministic.ts",
    r'''function sentencePreservesPayment(sentence: string, waivedInvoiceIds: string[]): boolean {
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
    r'''function sentencePreservesPayment(sentence: string, waivedInvoiceIds: string[]): boolean {
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
  if (OTHER_INVOICE_SCOPE_RE.test(sentence)) return false;
  return EXPLICIT_PAYMENT_RIGHT_PRESERVED_RE.test(sentence) || SAME_SCOPE_PAYMENT_REMAINS_RE.test(sentence);
}''',
    "evaluate same-invoice preservation before unrelated invoice language",
)

replace_once(
    "lib/analyzer/deterministic.ts",
    r'''export function hasUnpaidPrimeImprovementsUseEvidence(text: string): boolean {
  const sentences = text.split(/(?<=[.!?])\s+/);
  return sentences.some(
    (sentence) =>
      WITHOUT_ADDITIONAL_PAYMENT_RE.test(sentence) &&
      (DIRECT_PRIME_PASSIVE_IMPROVEMENT_USE_RE.test(sentence) ||
        DIRECT_PRIME_ACTIVE_IMPROVEMENT_USE_RE.test(sentence))
  );
}''',
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
    "bind no-payment language to the same coordinated IP-use segment",
)

replace_once(
    "lib/analyzer/deterministic.ts",
    r'''export function hasMandatoryForumEvidence(text: string): boolean {
  if (
    OPTIONAL_SUBCONTRACTOR_ALTERNATIVE_FORUM_RE.test(text) ||
    ELECTIVE_EITHER_FORUM_RE.test(text) ||
    OPTIONAL_VENUE_NOUN_ALTERNATIVE_RE.test(text) ||
    BILATERAL_OPTIONAL_FORUM_RE.test(text)
  ) return false;
  return BASE_FORUM_EVIDENCE_RE.test(text) || DIRECT_MANDATORY_FORUM_RE.test(text) || EXCLUSIVE_FORUM_RE.test(text);
}''',
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
    "scope forum optionality to the sentence it governs",
)

test_path = Path("lib/analyzer/__tests__/orion-parity-regression.test.mjs")
tests = test_path.read_text()
marker = "\nif (failures > 0) {"
additions = r'''
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
'''
if tests.count(marker) != 1:
    raise SystemExit("final exact-head regression insertion marker missing or duplicated")
test_path.write_text(tests.replace(marker, additions + marker, 1))
