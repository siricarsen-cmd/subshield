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
    r'''const INVOICE_SUBMISSION_DEADLINE_RE =
  /\binvoices?\b[^.]{0,120}(?:(?:must|shall|should)\s+be\s+submitted|are\s+required\s+to\s+be\s+submitted)[^.]{0,80}(?:within|no\s+later\s+than)\s+\d{1,3}\s*(?:calendar|business|working)?\s*days?/i;''',
    r'''const INVOICE_SUBMISSION_DEADLINE_RE =
  /(?:\binvoices?\b[^.]{0,120}(?:(?:must|shall|should)\s+be\s+submitted|are\s+required\s+to\s+be\s+submitted)|\b(?:must|shall|should|is\s+required\s+to)\s+submit\s+(?:a\s+|all\s+|complete\s+|timely\s+)*invoices?\b)[^.]{0,80}(?:within|no\s+later\s+than)\s+\d{1,3}\s*(?:calendar|business|working)?\s*days?/i;''',
    "recognize active invoice-submission deadlines",
)

replace_once(
    "lib/analyzer/deterministic.ts",
    r'''const SAME_SCOPE_PAYMENT_REMAINS_RE =
  /(?:except(?:\s+that)?|however|provided\s+that|but|notwithstanding)[^.]{0,180}(?:(?:the\s+)?(?:affected|subject|late|delayed)\s+(?:invoice|amount|payment)|(?:all\s+)?(?:amounts?|payment)\s+for\s+(?:performed|completed|accepted)\s+(?:work|services|deliverables)|(?:all\s+)?(?:amounts?|payment)\s+(?:for|under)\s+(?:the\s+)?(?:affected|subject|late|delayed)\s+invoice)[^.]{0,120}(?:remain|remains|shall\s+remain|will\s+remain)\s+(?:payable|due)/i;''',
    r'''const SAME_SCOPE_PAYMENT_REMAINS_RE =
  /(?:except(?:\s+that)?|however|provided\s+that|but|notwithstanding)[^.]{0,180}(?:(?:the\s+)?(?:affected|subject|late|delayed)\s+(?:invoice|amount|payment)|(?:all\s+)?(?:amounts?|payment)\s+for\s+(?:performed|completed|accepted)\s+(?:work|services|deliverables)|(?:all\s+)?(?:amounts?|payment)\s+(?:for|under)\s+(?:the\s+)?(?:affected|subject|late|delayed)\s+invoice)[^.]{0,120}(?:remain|remains|shall\s+remain|will\s+remain)\s+(?:payable|due)/i;
const ADJACENT_SAME_SCOPE_PAYMENT_REMAINS_RE =
  /^\s*(?:(?:the\s+)?(?:affected|subject|late|delayed)\s+(?:invoice|amount|payment)|(?:all\s+)?(?:amounts?|payment)\s+for\s+(?:performed|completed|accepted)\s+(?:work|services|deliverables)|(?:all\s+)?(?:amounts?|payment)\s+(?:for|under)\s+(?:the\s+)?(?:affected|subject|late|delayed)\s+invoice)[^.]{0,120}(?:remain|remains|shall\s+remain|will\s+remain)\s+(?:payable|due)/i;''',
    "recognize plain adjacent same-scope payment preservation",
)

replace_once(
    "lib/analyzer/deterministic.ts",
    r'''  return EXPLICIT_PAYMENT_RIGHT_PRESERVED_RE.test(sentence) || SAME_SCOPE_PAYMENT_REMAINS_RE.test(sentence);''',
    r'''  return (
    EXPLICIT_PAYMENT_RIGHT_PRESERVED_RE.test(sentence) ||
    SAME_SCOPE_PAYMENT_REMAINS_RE.test(sentence) ||
    ADJACENT_SAME_SCOPE_PAYMENT_REMAINS_RE.test(sentence)
  );''',
    "apply adjacent same-scope payment preservation",
)

test_path = Path("lib/analyzer/__tests__/orion-parity-regression.test.mjs")
tests = test_path.read_text()
marker = "\nif (failures > 0) {"
additions = r'''
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
'''
if tests.count(marker) != 1:
    raise SystemExit("final invoice variants insertion marker missing or duplicated")
test_path.write_text(tests.replace(marker, additions + marker, 1))
