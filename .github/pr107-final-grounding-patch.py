from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)


deterministic_path = Path("lib/analyzer/deterministic.ts")
deterministic = deterministic_path.read_text()

old_deadline_re = r'''const INVOICE_SUBMISSION_DEADLINE_RE =
  /(?:\binvoices?\b[^.]{0,120}(?:(?:must|shall|should)\s+be\s+submitted|are\s+required\s+to\s+be\s+submitted)|\b(?:must|shall|should|is\s+required\s+to)\s+submit\s+(?:(?:a|all|the|complete|timely|monthly|proper|final|correct|accurate|valid|itemized|detailed|supported|compliant|periodic|interim|recurring|certified|acceptable)\s+)*invoices?\b)[^.]{0,80}(?:within|no\s+later\s+than)\s+\d{1,3}\s*(?:calendar|business|working)?\s*days?/i;'''
new_deadline_re = r'''const INVOICE_SUBMISSION_DEADLINE_RE =
  /(?:\binvoices?\b[^.]{0,120}(?:(?:must|shall|should)\s+be\s+submitted|are\s+required\s+to\s+be\s+submitted)|\b(?:must|shall|should|is\s+required\s+to)\s+submit\s+(?:(?:a|all|the|its|complete|timely|monthly|proper|final|correct|accurate|valid|itemized|detailed|supported|compliant|periodic|interim|recurring|certified|acceptable)\s+)*invoices?\b)[^.]{0,80}(?:within|no\s+later\s+than)\s+\d{1,3}\s*(?:calendar|business|working)?\s*days?/i;'''
deterministic = replace_once(
    deterministic,
    old_deadline_re,
    new_deadline_re,
    "support possessive its-invoice deadline grammar",
)

old_actor_helper = r'''function invoiceSubmissionDutyTargetsSubcontractor(text: string): boolean {
  return !EXPLICIT_NON_SUBCONTRACTOR_INVOICE_DUTY_RE.test(text);
}

function affirmativeInvoiceWaiverBranches(sentence: string): string[] {'''
new_actor_helper = r'''function invoiceSubmissionDutyTargetsSubcontractor(text: string): boolean {
  return !EXPLICIT_NON_SUBCONTRACTOR_INVOICE_DUTY_RE.test(text);
}

function hasInvoiceSubmissionDeadlineEvidence(text: string): boolean {
  return (
    INVOICE_SUBMISSION_DEADLINE_RE.test(text) ||
    /failure\s+to\s+submit[^.]{0,180}\binvoice\b[^.]{0,160}(?:within|no\s+later\s+than)\s+\d{1,3}\s*(?:calendar|business|working)?\s*days?/i.test(
      text
    )
  );
}

function invoiceDutyBranches(text: string): string[] {
  return text
    .split(
      /\s*(?:;|,\s*(?:and|but)\s+|\s+(?:and|but)\s+(?=(?:Prime(?:\s+Contractor)?|Subcontractor|Government|Customer)\b[^.;]{0,120}\b(?:must|shall|should|will|is\s+required\s+to)\s+submit\b))\s*/i
    )
    .map((branch) => branch.trim())
    .filter(Boolean);
}

function nearestInvoiceDeadlineTargetsSubcontractor(text: string): boolean {
  const branches = invoiceDutyBranches(text);
  for (let index = branches.length - 1; index >= 0; index--) {
    if (!hasInvoiceSubmissionDeadlineEvidence(branches[index])) continue;
    return invoiceSubmissionDutyTargetsSubcontractor(branches[index]);
  }
  return false;
}

function affirmativeInvoiceWaiverBranches(sentence: string): string[] {'''
deterministic = replace_once(
    deterministic,
    old_actor_helper,
    new_actor_helper,
    "nearest invoice-deadline actor helper",
)

old_deadline_scope = r'''    const sentenceCarriesInvoiceSubmissionDeadline =
      INVOICE_SUBMISSION_DEADLINE_RE.test(sentence) ||
      /failure\s+to\s+submit[^.]{0,180}\binvoice\b[^.]{0,160}(?:within|no\s+later\s+than)\s+\d{1,3}\s*(?:calendar|business|working)?\s*days?/i.test(
        sentence
      );
    if (
      sentenceCarriesInvoiceSubmissionDeadline &&
      invoiceSubmissionDutyTargetsSubcontractor(sentence)
    ) {
      return [index];
    }
    if (
      index > 0 &&
      INVOICE_SUBMISSION_DEADLINE_RE.test(sentences[index - 1]) &&
      invoiceSubmissionDutyTargetsSubcontractor(sentences[index - 1])
    ) {
      return [index];
    }'''
new_deadline_scope = r'''    const sentenceCarriesInvoiceSubmissionDeadline =
      hasInvoiceSubmissionDeadlineEvidence(sentence);
    if (
      sentenceCarriesInvoiceSubmissionDeadline &&
      nearestInvoiceDeadlineTargetsSubcontractor(sentence)
    ) {
      return [index];
    }
    if (
      index > 0 &&
      hasInvoiceSubmissionDeadlineEvidence(sentences[index - 1]) &&
      nearestInvoiceDeadlineTargetsSubcontractor(sentences[index - 1])
    ) {
      return [index];
    }'''
deterministic = replace_once(
    deterministic,
    old_deadline_scope,
    new_deadline_scope,
    "bind pronoun waiver to nearest invoice deadline actor",
)

old_governing_law = r'''const GOVERNING_LAW_EVIDENCE_RE =
  /(?:\bgoverned\s+by\s+the\s+laws?\s+of|\bgoverning\s+law(?:\s+of[^.]{0,80})?\s*(?::|[-–—]|(?:shall|will|is)\s+be)\s*(?:the\s+laws?\s+of)?)(?:\s+(?:(?:the\s+)?(?:State|Commonwealth)\s+of\s+)?[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,2})/i;'''
new_governing_law = r'''const GOVERNING_LAW_JURISDICTION_RE =
  /(?:Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New\s+Hampshire|New\s+Jersey|New\s+Mexico|New\s+York|North\s+Carolina|North\s+Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode\s+Island|South\s+Carolina|South\s+Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West\s+Virginia|Wisconsin|Wyoming|District\s+of\s+Columbia|Puerto\s+Rico|United\s+States)/i;
const GOVERNING_LAW_EVIDENCE_RE = new RegExp(
  String.raw`(?:\bgoverned\s+by\s+the\s+laws?\s+of|\bgoverning\s+law(?:\s+of[^.]{0,80})?\s*(?::|[-–—]|(?:shall|will|is)\s+be)\s*(?:(?:the\s+)?laws?\s+of\s+)?)(?:\s+(?:(?:the\s+)?(?:State|Commonwealth)\s+of\s+)?)${GOVERNING_LAW_JURISDICTION_RE.source}\b`,
  "i"
);'''
deterministic = replace_once(
    deterministic,
    old_governing_law,
    new_governing_law,
    "controlled governing-law jurisdiction evidence",
)

deterministic_path.write_text(deterministic)


test_path = Path("lib/analyzer/__tests__/orion-parity-regression.test.mjs")
tests = test_path.read_text()
marker = "\nif (failures > 0) {\n"
if tests.count(marker) != 1:
    raise SystemExit(f"test marker: expected one match, found {tests.count(marker)}")

additions = r'''

const mixedInvoiceDeadlineActors = productionPath(`
2.8 Invoice Requirements
Prime Contractor shall submit its invoice within 20 calendar days, and Subcontractor shall submit its invoice within 30 calendar days; failure to do so waives the right to payment.
`);
check(
  "pronoun waiver follows the nearest Subcontractor invoice deadline branch",
  mixedInvoiceDeadlineActors.findings.some(
    (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
  )
);

const nearestPrimeInvoiceDeadline = productionPath(`
2.8 Invoice Requirements
Subcontractor shall submit its invoice within 20 calendar days, and Prime Contractor shall submit its invoice within 30 calendar days; failure to do so waives the right to payment.
`);
check(
  "pronoun waiver does not become Subcontractor risk when the nearest invoice deadline belongs to Prime",
  !nearestPrimeInvoiceDeadline.findings.some(
    (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
  )
);

const adjacentMixedInvoiceDeadlineActors = productionPath(`
2.8 Invoice Requirements
Prime Contractor shall submit its invoice within 20 calendar days, and Subcontractor shall submit its invoice within 30 calendar days. Failure to do so waives the right to payment.
`);
check(
  "adjacent pronoun waiver follows the nearest Subcontractor invoice deadline branch",
  adjacentMixedInvoiceDeadlineActors.findings.some(
    (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
  )
);

for (const [label, clause] of [
  ["chosen before award", "The governing law shall be chosen before award."],
  ["designated in definitive agreement", "The governing law will be designated in the definitive agreement."],
  ["documented later", "The governing law shall be documented later."],
]) {
  const unresolvedLaw = productionPath(`
2.23 Governing Law
${clause}
`);
  check(
    `${label}: arbitrary post-label words do not become a selected jurisdiction`,
    !unresolvedLaw.findings.some(
      (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
    )
  );
}

for (const [label, clause] of [
  ["Virginia law", "The governing law shall be Virginia law."],
  ["New York laws", "This subcontract is governed by the laws of New York."],
  ["District of Columbia laws", "The governing law shall be the laws of the District of Columbia."],
]) {
  const selectedLaw = productionPath(`
2.23 Governing Law
${clause}
`);
  check(
    `${label}: named jurisdiction still produces governing-law analysis`,
    selectedLaw.findings.some(
      (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
    )
  );
}
'''

test_path.write_text(tests.replace(marker, additions + marker, 1))
