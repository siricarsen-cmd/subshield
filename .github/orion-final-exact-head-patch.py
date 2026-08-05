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
    r'''function namedInvoiceRemainsPayable(sentence: string, invoiceId: string): boolean {
  const escapedInvoiceId = escapeRegexLiteral(invoiceId);
  const otherInvoiceBoundary = String.raw`\binvoice\s+(?:no\.?\s*)?[A-Z0-9-]*\d[A-Z0-9-]*\b`;
  const invoiceThenPayable = new RegExp(
    `\\binvoice\\s+(?:no\\.?\\s*)?${escapedInvoiceId}\\b(?:(?!${otherInvoiceBoundary})[^.]){0,140}(?:remain|remains|shall\\s+remain|will\\s+remain)\\s+(?:payable|due)`,
    "i"
  );
  const payableThenInvoice = new RegExp(
    `(?:payment|amounts?|(?:performed|completed|accepted)\\s+(?:work|services|deliverables))(?:(?!${otherInvoiceBoundary})[^.]){0,140}(?:remain|remains|shall\\s+remain|will\\s+remain)\\s+(?:payable|due)(?:(?!${otherInvoiceBoundary})[^.]){0,100}\\b(?:under|for)\\s+invoice\\s+(?:no\\.?\\s*)?${escapedInvoiceId}\\b`,
    "i"
  );
  return invoiceThenPayable.test(sentence) || payableThenInvoice.test(sentence);
}

function sentencePreservesPayment(sentence: string, waivedInvoiceIds: string[]): boolean {
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
    r'''function namedInvoiceRemainsPayable(sentence: string, invoiceId: string): boolean {
  const escapedInvoiceId = escapeRegexLiteral(invoiceId);
  const otherInvoiceBoundary = String.raw`\binvoice\s+(?:no\.?\s*)?[A-Z0-9-]*\d[A-Z0-9-]*\b`;
  const invoiceThenPayable = new RegExp(
    `\\binvoice\\s+(?:no\\.?\\s*)?${escapedInvoiceId}\\b(?:(?!${otherInvoiceBoundary})[^.]){0,140}(?:remain|remains|shall\\s+remain|will\\s+remain)\\s+(?:payable|due)`,
    "i"
  );
  const payableThenInvoice = new RegExp(
    `(?:payment|amounts?|(?:performed|completed|accepted)\\s+(?:work|services|deliverables))(?:(?!${otherInvoiceBoundary})[^.]){0,140}(?:remain|remains|shall\\s+remain|will\\s+remain)\\s+(?:payable|due)(?:(?!${otherInvoiceBoundary})[^.]){0,100}\\b(?:under|for)\\s+invoice\\s+(?:no\\.?\\s*)?${escapedInvoiceId}\\b`,
    "i"
  );
  return invoiceThenPayable.test(sentence) || payableThenInvoice.test(sentence);
}

function namedInvoicePaymentRightIsPreserved(sentence: string, invoiceId: string): boolean {
  const escapedInvoiceId = escapeRegexLiteral(invoiceId);
  const invoiceRef = `\\binvoice\\s+(?:no\\.?\\s*)?${escapedInvoiceId}\\b`;
  const otherInvoiceBoundary = String.raw`\binvoice\s+(?:no\.?\s*)?[A-Z0-9-]*\d[A-Z0-9-]*\b`;
  const boundedGap = `(?:(?!${otherInvoiceBoundary})[^.])`;
  const invoiceThenPreserved = new RegExp(
    `${invoiceRef}${boundedGap}{0,120}(?:right|entitlement)\\s+to\\s+payment${boundedGap}{0,100}(?:is|shall|will)\\s+not\\s+(?:waived|forfeited)`,
    "i"
  );
  const preservedThenInvoice = new RegExp(
    `(?:right|entitlement)\\s+to\\s+payment${boundedGap}{0,100}\\b(?:under|for)\\s+${invoiceRef}${boundedGap}{0,100}(?:is|shall|will)\\s+not\\s+(?:waived|forfeited)`,
    "i"
  );
  const activePreservation = new RegExp(
    `(?:does|shall|will)\\s+not\\s+(?:waive|forfeit)${boundedGap}{0,100}${invoiceRef}${boundedGap}{0,100}(?:right|entitlement)\\s+to\\s+payment`,
    "i"
  );
  return (
    invoiceThenPreserved.test(sentence) ||
    preservedThenInvoice.test(sentence) ||
    activePreservation.test(sentence)
  );
}

function sentencePreservesPayment(sentence: string, waivedInvoiceIds: string[]): boolean {
  const preservedInvoiceIds = extractInvoiceIds(sentence);
  if (preservedInvoiceIds.length > 0) {
    const mentionsWaivedInvoice =
      waivedInvoiceIds.length > 0 && preservedInvoiceIds.some((invoiceId) => waivedInvoiceIds.includes(invoiceId));
    if (!mentionsWaivedInvoice) return false;
    const preservesWaivedInvoice = waivedInvoiceIds.some(
      (invoiceId) =>
        namedInvoiceRemainsPayable(sentence, invoiceId) ||
        namedInvoicePaymentRightIsPreserved(sentence, invoiceId)
    );
    return preservesWaivedInvoice;
  }
  if (OTHER_INVOICE_SCOPE_RE.test(sentence)) return false;
  return EXPLICIT_PAYMENT_RIGHT_PRESERVED_RE.test(sentence) || SAME_SCOPE_PAYMENT_REMAINS_RE.test(sentence);
}''',
    "bind explicit payment preservation to the waived invoice",
)

replace_once(
    "lib/analyzer/deterministic.ts",
    r'''const WITHOUT_ADDITIONAL_PAYMENT_RE =
  /without\s+(?:additional\s+)?(?:payment|compensation|charge|fee)/i;''',
    r'''const WITHOUT_ADDITIONAL_PAYMENT_RE =
  /without\s+(?:additional\s+)?(?:payment|compensation|charge|fee)|royalty[\s-]?free|free\s+of\s+charge|at\s+no\s+(?:additional\s+)?(?:cost|charge|fee|expense)/i;''',
    "recognize common uncompensated-use formulations",
)

replace_once(
    "lib/analyzer/anchors.ts",
    r'''  const explicitTypeLabel =
    explicitTypeLabelCandidate &&
    CONTRACT_TYPE_PATTERNS.some((pattern) => pattern.pattern.test(explicitTypeLabelCandidate))
      ? explicitTypeLabelCandidate.trim()
      : undefined;''',
    r'''  const explicitTypeLabel =
    explicitTypeLabelCandidate &&
    (CONTRACT_TYPE_PATTERNS.some((pattern) => pattern.pattern.test(explicitTypeLabelCandidate)) ||
      /^Hybrid(?:\s+(?:subcontract|contract|agreement))?$/i.test(explicitTypeLabelCandidate))
      ? explicitTypeLabelCandidate.trim()
      : undefined;''',
    "preserve exact explicit Hybrid labels",
)

test_path = Path("lib/analyzer/__tests__/orion-parity-regression.test.mjs")
tests = test_path.read_text()
marker = "\nif (failures > 0) {"
additions = r'''
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
'''
if tests.count(marker) != 1:
    raise SystemExit("final exact-head regression insertion marker missing or duplicated")
test_path.write_text(tests.replace(marker, additions + marker, 1))
