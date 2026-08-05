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
    r'''function hasUnpreservedInvoicePaymentWaiver(block: string): boolean {
  const sentences = block.split(/(?<=[.!?])\s+/);
  return invoiceWaiverSentenceIndexes(sentences).some(
    (waiverIndex) => !invoiceWaiverIsPreserved(sentences, waiverIndex)
  );
}''',
    r'''function hasUnpreservedInvoicePaymentWaiver(block: string): boolean {
  const invoiceSentenceSafeBlock = block.replace(
    /\binvoice\s+no\.\s*(?=[A-Z0-9-]*\d)/gi,
    "Invoice No "
  );
  const sentences = invoiceSentenceSafeBlock.split(/(?<=[.!?])\s+/);
  return invoiceWaiverSentenceIndexes(sentences).some(
    (waiverIndex) => !invoiceWaiverIsPreserved(sentences, waiverIndex)
  );
}''',
    "keep Invoice No. identifiers intact during sentence splitting",
)

replace_once(
    "lib/analyzer/deterministic.ts",
    r'''\s+(?:(?:any|the|such|stated|those|Subcontractor[\s-]created)\s+){0,3}(?:improvements?(?:\s+or\s+adaptations?)?|adaptations?)\b/i;''',
    r'''\s+(?:(?:all|any|the|such|stated|those|Subcontractor[\s-]created)\s+){0,3}(?:improvements?(?:\s+or\s+adaptations?)?|adaptations?)\b/i;''',
    "accept all as an improvements determiner",
)

test_path = Path("lib/analyzer/__tests__/orion-parity-regression.test.mjs")
tests = test_path.read_text()
marker = "\nif (failures > 0) {"
additions = r'''
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
'''
if tests.count(marker) != 1:
    raise SystemExit("review-two regression insertion marker missing or duplicated")
test_path.write_text(tests.replace(marker, additions + marker, 1))
