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
    r'''  const waiverScope = connector ? waiverSentence.slice(0, connector.index) : waiverSentence;
  const waivedInvoiceIds = extractInvoiceIds(waiverScope);
  if (connector) {''',
    r'''  const waiverScope = connector ? waiverSentence.slice(0, connector.index) : waiverSentence;
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
  if (connector) {''',
    "carry named invoice from adjacent deadline",
)

replace_once(
    "lib/analyzer/deterministic.ts",
    r'''const DIRECT_PRIME_PASSIVE_IMPROVEMENT_USE_RE =
  /(?:any\s+)?(?:improvements?(?:\s+or\s+adaptations?)?|adaptations?)[^.]{0,140}(?:may|shall|will)\s+be\s+used\s+by\s+(?:Prime\s+Contractor\b(?!['\u2019]s\b)(?!\s+(?:customer|client|affiliate|agency|end[\s-]?user)\b)|Prime\b(?!['\u2019]s\b)(?!\s+Contractor\b)(?!\s+(?:customer|client|affiliate|agency|end[\s-]?user)\b))/i;''',
    r'''const DIRECT_PRIME_PASSIVE_IMPROVEMENT_USE_RE =
  /(?:any\s+)?(?:improvements?(?:\s+or\s+adaptations?)?|adaptations?)(?:(?!\b(?:may|shall|will)\s+be\s+used\s+by\b)[^.]){0,140}(?:may|shall|will)\s+be\s+used\s+by\s+(?:Prime\s+Contractor\b(?!['\u2019]s\b)(?!\s+(?:customer|client|affiliate|agency|end[\s-]?user)\b)|Prime\b(?!['\u2019]s\b)(?!\s+Contractor\b)(?!\s+(?:customer|client|affiliate|agency|end[\s-]?user)\b))/i;''',
    "bind passive Prime use to first use predicate",
)

replace_once(
    "lib/analyzer/deterministic.ts",
    r'''const OPTIONAL_SUBCONTRACTOR_ALTERNATIVE_FORUM_RE =
  /(?:at\s+(?:the\s+)?Subcontractor(?:'s|\u2019s)\s+option|Subcontractor\s+(?:may|can)\s+(?:elect|choose))[^.]{0,240}(?:must|shall|will)\s+be\s+(?:brought|filed)[^.]{0,260}Subcontractor\s+(?:may|can)\s+(?:instead\s+|alternatively\s+)?(?:bring|file)[^.]{0,140}(?:any|another|other)\s+(?:court|forum)/i;

export function hasMandatoryForumEvidence(text: string): boolean {
  if (OPTIONAL_SUBCONTRACTOR_ALTERNATIVE_FORUM_RE.test(text)) return false;''',
    r'''const OPTIONAL_SUBCONTRACTOR_ALTERNATIVE_FORUM_RE =
  /(?:at\s+(?:the\s+)?Subcontractor(?:'s|\u2019s)\s+option|Subcontractor\s+(?:may|can)\s+(?:elect|choose))[^.]{0,240}(?:must|shall|will)\s+be\s+(?:brought|filed)[^.]{0,260}Subcontractor\s+(?:may|can)\s+(?:instead\s+|alternatively\s+)?(?:bring|file)[^.]{0,140}(?:any|another|other)\s+(?:court|forum)/i;
const ELECTIVE_EITHER_FORUM_RE =
  /Subcontractor\s+(?:may|can)\s+(?:elect|choose)\s+either[^.]{0,220}(?:must|shall|will)\s+be\s+(?:brought|filed)[^.]{0,220}\bor\b[^.]{0,140}(?:must|shall|will)\s+be\s+(?:brought|filed)[^.]{0,160}(?:any\s+other|another|other)\s+(?:court|forum)/i;

export function hasMandatoryForumEvidence(text: string): boolean {
  if (OPTIONAL_SUBCONTRACTOR_ALTERNATIVE_FORUM_RE.test(text) || ELECTIVE_EITHER_FORUM_RE.test(text)) return false;''',
    "recognize elective either forum branches",
)

test_path = Path("lib/analyzer/__tests__/orion-parity-regression.test.mjs")
tests = test_path.read_text()
marker = "\nif (failures > 0) {"
additions = r'''
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
'''
if tests.count(marker) != 1:
    raise SystemExit("final scope regression insertion marker missing or duplicated")
test_path.write_text(tests.replace(marker, additions + marker, 1))
