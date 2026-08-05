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
  const invoiceThenPayable = new RegExp(
    `\\binvoice\\s+(?:no\\.?\\s*)?${escapedInvoiceId}\\b(?:(?!\\binvoice\\s+(?:no\\.?\\s*)?[A-Z0-9-]*\\d[A-Z0-9-]*\\b)[^.]){0,100}(?:remain|remains|shall\\s+remain|will\\s+remain)\\s+(?:payable|due)`,
    "i"
  );
  return invoiceThenPayable.test(sentence);
}''',
    r'''function namedInvoiceRemainsPayable(sentence: string, invoiceId: string): boolean {
  const escapedInvoiceId = escapeRegexLiteral(invoiceId);
  const otherInvoiceBoundary = String.raw`\\binvoice\\s+(?:no\\.?\\s*)?[A-Z0-9-]*\\d[A-Z0-9-]*\\b`;
  const invoiceThenPayable = new RegExp(
    `\\binvoice\\s+(?:no\\.?\\s*)?${escapedInvoiceId}\\b(?:(?!${otherInvoiceBoundary})[^.]){0,140}(?:remain|remains|shall\\s+remain|will\\s+remain)\\s+(?:payable|due)`,
    "i"
  );
  const payableThenInvoice = new RegExp(
    `(?:payment|amounts?|(?:performed|completed|accepted)\\s+(?:work|services|deliverables))(?:(?!${otherInvoiceBoundary})[^.]){0,140}(?:remain|remains|shall\\s+remain|will\\s+remain)\\s+(?:payable|due)(?:(?!${otherInvoiceBoundary})[^.]){0,100}\\b(?:under|for)\\s+invoice\\s+(?:no\\.?\\s*)?${escapedInvoiceId}\\b`,
    "i"
  );
  return invoiceThenPayable.test(sentence) || payableThenInvoice.test(sentence);
}''',
    "support forward and reverse same-invoice payable predicates",
)

replace_once(
    "lib/analyzer/deterministic.ts",
    r'''function forumEvidenceClauses(sentence: string): string[] {
  return sentence
    .split(/\s*;\s*/)
    .map((clause) => clause.trim())
    .filter(Boolean);
}''',
    r'''function forumEvidenceClauses(sentence: string): string[] {
  return sentence
    .split(/\s*;\s*|,\s*(?:but|however|while|whereas)\s+/i)
    .map((clause) => clause.trim())
    .filter(Boolean);
}''',
    "split independent coordinated forum branches",
)

replace_once(
    "lib/analyzer/deterministic.ts",
    r'''function clauseHasOptionalForumChoice(clause: string): boolean {
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
}
const BILATERAL_DEFENDANT_VENUE_RE =
  /(?:(?:exclusive\s+)?venue|(?:any\s+)?(?:action|lawsuit|claim|dispute|proceeding))[^.]{0,240}(?:where|located\s+where|in\s+(?:a\s+)?court\s+where)[^.]{0,100}\bdefendants?\b[^.]{0,100}(?:resides?|is\s+located|has\s+(?:its|their)\s+principal\s+place\s+of\s+business)/i;''',
    r'''function clauseHasOptionalForumChoice(clause: string): boolean {
  return OPTIONAL_FORUM_EVIDENCE_RES.some((pattern) => pattern.test(clause));
}

const BILATERAL_DEFENDANT_VENUE_RE =
  /(?:(?:exclusive\s+)?venue|(?:any\s+)?(?:action|lawsuit|claim|dispute|proceeding))[^.]{0,240}(?:where|located\s+where|in\s+(?:a\s+)?court\s+where)[^.]{0,100}\bdefendants?\b[^.]{0,100}(?:resides?|is\s+located|has\s+(?:its|their)\s+principal\s+place\s+of\s+business)/i;

function clauseHasMandatoryForumEvidence(clause: string): boolean {
  if (clauseHasOptionalForumChoice(clause)) return false;
  if (BILATERAL_DEFENDANT_VENUE_RE.test(clause)) return false;
  return (
    BASE_FORUM_EVIDENCE_RE.test(clause) ||
    DIRECT_MANDATORY_FORUM_RE.test(clause) ||
    EXCLUSIVE_FORUM_RE.test(clause)
  );
}

export function hasMandatoryForumEvidence(text: string): boolean {
  return forumEvidenceSentences(text).some((sentence) => {
    if (optionalForumChoiceSpansSemicolon(sentence)) return false;
    return forumEvidenceClauses(sentence).some(clauseHasMandatoryForumEvidence);
  });
}''',
    "scope optional and defendant-location guards to their matching clause",
)

replace_once(
    "lib/analyzer/deterministic.ts",
    r'''function findVenueOrGoverningLawCandidate(documentText: string): string | null {
  return findClauseCandidate(
    documentText,
    (block) =>
      hasMandatoryForumEvidence(block) &&
      !BILATERAL_DEFENDANT_VENUE_RE.test(block)
  );
}''',
    r'''function findVenueOrGoverningLawCandidate(documentText: string): string | null {
  return findClauseCandidate(documentText, hasMandatoryForumEvidence);
}''',
    "remove block-wide defendant-location suppression",
)

test_path = Path("lib/analyzer/__tests__/orion-parity-regression.test.mjs")
tests = test_path.read_text()
marker = "\nif (failures > 0) {"
additions = r'''
const reverseOrderNamedInvoicePreservation = productionPath(`
2.8 Invoice Requirements
Failure to submit Invoice 104 within 30 calendar days waives the right to payment for Invoice 104. However, payment for performed work remains due under Invoice 104.
`);
check(
  "reverse-order same-invoice payable exception suppresses permanent waiver",
  !reverseOrderNamedInvoicePreservation.findings.some((finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver")
);

const defendantThenMandatoryForum = productionPath(`
2.23 Venue
Any action must be brought in the courts where the defendants reside. Any action shall be brought in Arlington County, Virginia.
`);
check(
  "neutral defendant-location sentence does not hide a separate mandatory forum",
  defendantThenMandatoryForum.findings.some((finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden")
);

const commaButOptionalThenMandatoryForum = productionPath(`
2.23 Venue
The parties may agree to venue in Fairfax County or another mutually convenient forum, but any action shall be brought in Arlington County, Virginia.
`);
check(
  "comma-but optional venue does not hide the mandatory forum branch",
  commaButOptionalThenMandatoryForum.findings.some((finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden")
);
'''
if tests.count(marker) != 1:
    raise SystemExit("final-three regression insertion marker missing or duplicated")
test_path.write_text(tests.replace(marker, additions + marker, 1))
