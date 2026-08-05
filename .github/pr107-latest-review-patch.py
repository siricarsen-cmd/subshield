from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)


deterministic_path = Path("lib/analyzer/deterministic.ts")
deterministic = deterministic_path.read_text()

waiver_marker = "const INVOICE_PAYMENT_WAIVER_RE ="
negated_waiver = r'''const NEGATED_INVOICE_PAYMENT_WAIVER_RE =
  /failure\s+to\s+(?:submit[^.]{0,180}\binvoice\b|do\s+so|submit\s+(?:it|them)|timely\s+submit(?:\s+(?:it|them))?|submit\s+on\s+time)[^.]{0,200}(?:(?:does|shall|will|may)\s+not|never)\s+(?:waive|forfeit)\s+(?:Subcontractor(?:'s|\u2019s)?\s+)?(?:the\s+)?(?:right|entitlement)\s+to\s+payment/i;
'''
if deterministic.count(waiver_marker) != 1:
    raise SystemExit(
        f"waiver marker: expected one match, found {deterministic.count(waiver_marker)}"
    )
deterministic = deterministic.replace(waiver_marker, negated_waiver + waiver_marker, 1)

old_indexes = r'''function invoiceWaiverSentenceIndexes(sentences: string[]): number[] {
  return sentences.flatMap((sentence, index) => {
    if (INVOICE_PAYMENT_WAIVER_RE.test(sentence)) return [index];'''
new_indexes = r'''function invoiceWaiverSentenceIndexes(sentences: string[]): number[] {
  return sentences.flatMap((sentence, index) => {
    if (NEGATED_INVOICE_PAYMENT_WAIVER_RE.test(sentence)) return [];
    if (INVOICE_PAYMENT_WAIVER_RE.test(sentence)) return [index];'''
deterministic = replace_once(
    deterministic,
    old_indexes,
    new_indexes,
    "negated invoice waiver guard",
)

old_license_guard = r'''const NEGATED_PRIME_IMPROVEMENT_LICENSE_RE =
  /\bSubcontractor\b[^.]{0,100}(?:(?:does|shall|will|may)\s+not|never)\s+grant\b[^.]{0,220}\b(?:the\s+)?Prime(?:\s+Contractor)?\b[^.]{0,220}\blicense\b[^.]{0,160}\b(?:improvements?|adaptations?)\b|\bno\s+(?:royalty[\s-]?free\s+)?license\b[^.]{0,180}\b(?:improvements?|adaptations?)\b[^.]{0,120}\b(?:is|shall|will)\s+be\s+granted\b[^.]{0,100}\b(?:to\s+)?(?:the\s+)?Prime(?:\s+Contractor)?\b/i;'''
new_license_guard = r'''const NON_ROYALTY_FREE_IMPROVEMENT_LICENSE_RE =
  /\bnon[\s-]+royalty[\s-]?free\b|\broyalty[\s-]+bearing\b|\bsubject\s+to\s+(?:a\s+)?royalt(?:y|ies)\b/i;
const NEGATED_PRIME_IMPROVEMENT_LICENSE_RE =
  /\bSubcontractor\b[^.]{0,100}(?:(?:does|shall|will|may)\s+not|never)\s+grant\b[^.]{0,220}\b(?:the\s+)?Prime(?:\s+Contractor)?\b[^.]{0,220}\blicense\b[^.]{0,160}\b(?:improvements?|adaptations?)\b|\bno\s+(?:royalty[\s-]?free\s+)?license\b[^.]{0,180}\b(?:improvements?|adaptations?)\b[^.]{0,120}\b(?:is|shall|will)\s+be\s+granted\b[^.]{0,100}\b(?:to\s+)?(?:the\s+)?Prime(?:\s+Contractor)?\b/i;'''
deterministic = replace_once(
    deterministic,
    old_license_guard,
    new_license_guard,
    "affirmative royalty-free license guard",
)

old_grant_guard = r'''function primeImprovementsUseGrantWindow(segment: string): string | null {
  if (NEGATED_PRIME_IMPROVEMENT_LICENSE_RE.test(segment)) return null;'''
new_grant_guard = r'''function primeImprovementsUseGrantWindow(segment: string): string | null {
  if (
    NEGATED_PRIME_IMPROVEMENT_LICENSE_RE.test(segment) ||
    NON_ROYALTY_FREE_IMPROVEMENT_LICENSE_RE.test(segment)
  ) {
    return null;
  }'''
deterministic = replace_once(
    deterministic,
    old_grant_guard,
    new_grant_guard,
    "non-royalty-free grant rejection",
)

old_jurisdiction_guard = r'''const NEGATED_EXCLUSIVE_JURISDICTION_RE =
  /\b(?:neither\s+party|no\s+party)\b[^.]{0,120}(?:irrevocably\s+)?(?:submits?|consents?)\s+to\s+(?:the\s+)?exclusive\s+jurisdiction\b|\b(?:each|either|both|the)\s+part(?:y|ies)\b[^.]{0,120}(?:(?:does|do|shall|will|may)\s+not|never)\s+(?:submit|consent)\b[^.]{0,120}\bexclusive\s+jurisdiction\b|\b(?:does|do|shall|will|may)\s+not\s+(?:submit|consent)\b[^.]{0,120}\bexclusive\s+jurisdiction\b/i;'''
new_jurisdiction_guard = r'''const NEGATED_EXCLUSIVE_JURISDICTION_RE =
  /\b(?:neither\s+party|no\s+party)\b[^.]{0,120}(?:irrevocably\s+)?(?:submits?|consents?)\s+to\s+(?:the\s+)?exclusive\s+jurisdiction\b|\b(?:each|either|both|the)\s+part(?:y|ies)\b[^.]{0,120}(?:(?:does|do|shall|will|may)\s+not|never)\s+(?:submit|consent)\b[^.]{0,120}\bexclusive\s+jurisdiction\b|\b(?:does|do|shall|will|may)\s+not\s+(?:submit|consent)\b[^.]{0,120}\bexclusive\s+jurisdiction\b|\b(?:each|either|both|the)\s+part(?:y|ies)\b[^.]{0,140}(?:expressly\s+)?(?:refuses?|declines?)\s+to\s+(?:submit|consent)\b[^.]{0,140}\bexclusive\s+jurisdiction\b|\b(?:each|either|both|the)\s+part(?:y|ies)\b[^.]{0,140}(?:expressly\s+)?disclaims?\s+(?:any\s+)?(?:submission|consent)\s+to\s+(?:the\s+)?exclusive\s+jurisdiction\b/i;'''
deterministic = replace_once(
    deterministic,
    old_jurisdiction_guard,
    new_jurisdiction_guard,
    "broader jurisdiction refusal guard",
)

deterministic_path.write_text(deterministic)


test_path = Path("lib/analyzer/__tests__/orion-parity-regression.test.mjs")
tests = test_path.read_text()
marker = "\nif (failures > 0) {\n"
if tests.count(marker) != 1:
    raise SystemExit(f"test marker: expected one match, found {tests.count(marker)}")

additions = r'''

for (const protectiveWaiverClause of [
  "Failure to submit a complete invoice within 30 calendar days does not waive the right to payment.",
  "Failure to submit a complete invoice within 30 calendar days shall not waive the right to payment.",
  "Failure to submit a complete invoice within 30 calendar days will not forfeit the right to payment.",
]) {
  const negatedInvoiceWaiver = productionPath(`
2.8 Invoice Requirements
${protectiveWaiverClause}
`);
  check(
    "negated invoice-payment waiver remains clean",
    !negatedInvoiceWaiver.findings.some(
      (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
    )
  );
}

const affirmativeInvoiceWaiverControl = productionPath(`
2.8 Invoice Requirements
Failure to submit a complete invoice within 30 calendar days waives the right to payment.
`);
check(
  "affirmative invoice-payment waiver still triggers after the negation guard",
  affirmativeInvoiceWaiverControl.findings.some(
    (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
  )
);

for (const refusalClause of [
  "Each party expressly refuses to consent to the exclusive jurisdiction of the courts located in Fairfax County, Virginia.",
  "Each party declines to submit to the exclusive jurisdiction of the courts located in Arlington County, Virginia.",
  "Each party expressly disclaims any consent to the exclusive jurisdiction of the courts located in Fairfax County, Virginia.",
]) {
  const refusedExclusiveJurisdiction = productionPath(`
2.23 Dispute Resolution
${refusalClause}
`);
  check(
    "refusal, declination, or disclaimer of exclusive jurisdiction remains clean",
    !refusedExclusiveJurisdiction.findings.some(
      (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
    )
  );
}

const affirmativeJurisdictionControl = productionPath(`
2.23 Dispute Resolution
Each party consents to the exclusive jurisdiction of the courts located in Fairfax County, Virginia.
`);
check(
  "affirmative exclusive-jurisdiction consent still triggers after broader refusal guards",
  affirmativeJurisdictionControl.findings.some(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  )
);

for (const compensatedLicenseClause of [
  "Subcontractor grants Prime Contractor a non-royalty-free license to all Improvements.",
  "Subcontractor grants Prime Contractor a royalty-bearing license to all Improvements.",
  "Subcontractor grants Prime Contractor a license to all Improvements subject to a royalty.",
]) {
  const compensatedImprovementLicense = productionPath(`
2.17 Improvements
${compensatedLicenseClause}
`);
  check(
    "compensated or non-royalty-free Improvements license remains clean",
    !compensatedImprovementLicense.findings.some(
      (finding) => finding.regulation === "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements"
    )
  );
}

const affirmativeRoyaltyFreeControl = productionPath(`
2.17 Improvements
Subcontractor grants Prime Contractor a royalty-free license to all Improvements.
`);
check(
  "affirmative royalty-free Improvements license still triggers",
  affirmativeRoyaltyFreeControl.findings.some(
    (finding) => finding.regulation === "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements"
  )
);
'''

test_path.write_text(tests.replace(marker, additions + marker, 1))
