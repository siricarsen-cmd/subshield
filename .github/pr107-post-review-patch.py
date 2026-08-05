from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)


deterministic_path = Path("lib/analyzer/deterministic.ts")
deterministic = deterministic_path.read_text()

old_context = r'''const SAME_SCOPE_BARE_PAYMENT_CONTEXT_RE =
  /\b(?:affected|subject|late|delayed)\s+(?:invoice|amount|payment)\b|\b(?:cure|grace)\s+period\b|\bsubmitted\s+(?:during|within)\s+(?:the\s+)?(?:cure|grace)\b|\bafter\s+(?:the\s+)?(?:cure|grace)\b/i;'''
new_context = r'''const SAME_SCOPE_BARE_PAYMENT_CONTEXT_RE =
  /\b(?:affected|subject|late|delayed)\s+(?:invoice|amount|payment)\b|\b(?:cure|grace)\s+period\b|\bsubmitted\s+(?:during|within)\s+(?:the\s+)?(?:cure|grace)\b|\bafter\s+(?:the\s+)?(?:cure|grace)\b/i;
const SAME_SCOPE_EXPLICIT_PAYMENT_CONTEXT_RE =
  /\b(?:affected|subject|late|delayed)\s+(?:invoice|amount|payment)\b|\b(?:cure|grace)\s+period\b|\binvoices?\b|^\s*(?:this|such|the\s+foregoing)\b|\bSubcontractor(?:'s|\u2019s)?\s+(?:right|entitlement)\s+to\s+payment\b/i;'''
deterministic = replace_once(
    deterministic,
    old_context,
    new_context,
    "explicit payment scope context",
)

old_signature = "function sentencePreservesPayment(sentence: string, waivedInvoiceIds: string[]): boolean {"
new_signature = "function sentencePreservesPayment(\n  sentence: string,\n  waivedInvoiceIds: string[],\n  isWaiverSentenceScope = false\n): boolean {"
deterministic = replace_once(
    deterministic,
    old_signature,
    new_signature,
    "payment preservation signature",
)

old_generic_return = r'''  const sameScopeBarePaymentPreservation =
    BARE_PAYMENT_PRESERVED_RE.test(sentence) &&
    SAME_SCOPE_BARE_PAYMENT_CONTEXT_RE.test(sentence);
  return (
    EXPLICIT_PAYMENT_RIGHT_PRESERVED_RE.test(sentence) ||
    sameScopeBarePaymentPreservation ||
    SAME_SCOPE_PAYMENT_REMAINS_RE.test(sentence) ||
    ADJACENT_SAME_SCOPE_PAYMENT_REMAINS_RE.test(sentence)
  );'''
new_generic_return = r'''  const sameScopeExplicitPaymentPreservation =
    EXPLICIT_PAYMENT_RIGHT_PRESERVED_RE.test(sentence) &&
    (isWaiverSentenceScope || SAME_SCOPE_EXPLICIT_PAYMENT_CONTEXT_RE.test(sentence));
  const sameScopeBarePaymentPreservation =
    BARE_PAYMENT_PRESERVED_RE.test(sentence) &&
    SAME_SCOPE_BARE_PAYMENT_CONTEXT_RE.test(sentence);
  return (
    sameScopeExplicitPaymentPreservation ||
    sameScopeBarePaymentPreservation ||
    SAME_SCOPE_PAYMENT_REMAINS_RE.test(sentence) ||
    ADJACENT_SAME_SCOPE_PAYMENT_REMAINS_RE.test(sentence)
  );'''
deterministic = replace_once(
    deterministic,
    old_generic_return,
    new_generic_return,
    "explicit payment preservation scope",
)

old_connector_call = "    if (sentencePreservesPayment(preservationScope, waivedInvoiceIds)) return true;"
new_connector_call = "    if (sentencePreservesPayment(preservationScope, waivedInvoiceIds, true)) return true;"
deterministic = replace_once(
    deterministic,
    old_connector_call,
    new_connector_call,
    "same-sentence payment preservation",
)

old_waiver_indexes = r'''function invoiceWaiverSentenceIndexes(sentences: string[]): number[] {
  return sentences.flatMap((sentence, index) => {
    if (INVOICE_PAYMENT_WAIVER_RE.test(sentence)) return [index];
    const carriesPriorInvoiceDeadline =
      INVOICE_PAYMENT_FORFEITURE_SENTENCE_RE.test(sentence) ||
      INVOICE_PAYMENT_FORFEITURE_CONTEXT_RE.test(sentence);'''
new_waiver_indexes = r'''function invoiceWaiverSentenceIndexes(sentences: string[]): number[] {
  return sentences.flatMap((sentence, index) => {
    if (INVOICE_PAYMENT_WAIVER_RE.test(sentence)) return [index];
    if (
      INVOICE_PAYMENT_FORFEITURE_CONTEXT_RE.test(sentence) &&
      INVOICE_SUBMISSION_DEADLINE_RE.test(sentence)
    ) {
      return [index];
    }
    const carriesPriorInvoiceDeadline =
      INVOICE_PAYMENT_FORFEITURE_SENTENCE_RE.test(sentence) ||
      INVOICE_PAYMENT_FORFEITURE_CONTEXT_RE.test(sentence);'''
deterministic = replace_once(
    deterministic,
    old_waiver_indexes,
    new_waiver_indexes,
    "same-sentence pronoun invoice waiver",
)

license_marker = "const DIRECT_PRIME_UNPAID_IMPROVEMENT_LICENSE_RE ="
negated_license = r'''const NEGATED_PRIME_IMPROVEMENT_LICENSE_RE =
  /\bSubcontractor\b[^.]{0,100}(?:(?:does|shall|will|may)\s+not|never)\s+grant\b[^.]{0,220}\b(?:the\s+)?Prime(?:\s+Contractor)?\b[^.]{0,220}\blicense\b[^.]{0,160}\b(?:improvements?|adaptations?)\b|\bno\s+(?:royalty[\s-]?free\s+)?license\b[^.]{0,180}\b(?:improvements?|adaptations?)\b[^.]{0,120}\b(?:is|shall|will)\s+be\s+granted\b[^.]{0,100}\b(?:to\s+)?(?:the\s+)?Prime(?:\s+Contractor)?\b/i;
'''
if deterministic.count(license_marker) != 1:
    raise SystemExit(
        f"license marker: expected one match, found {deterministic.count(license_marker)}"
    )
deterministic = deterministic.replace(license_marker, negated_license + license_marker, 1)

old_grant_window = r'''function primeImprovementsUseGrantWindow(segment: string): string | null {
  const candidates = ['''
new_grant_window = r'''function primeImprovementsUseGrantWindow(segment: string): string | null {
  if (NEGATED_PRIME_IMPROVEMENT_LICENSE_RE.test(segment)) return null;
  const candidates = ['''
deterministic = replace_once(
    deterministic,
    old_grant_window,
    new_grant_window,
    "negated Prime improvement license",
)

forum_marker = "const EXCLUSIVE_JURISDICTION_SUBMISSION_RE ="
negated_forum = r'''const NEGATED_EXCLUSIVE_JURISDICTION_RE =
  /\b(?:neither\s+party|no\s+party)\b[^.]{0,120}(?:irrevocably\s+)?(?:submits?|consents?)\s+to\s+(?:the\s+)?exclusive\s+jurisdiction\b|\b(?:each|either|both|the)\s+part(?:y|ies)\b[^.]{0,120}(?:(?:does|do|shall|will|may)\s+not|never)\s+(?:submit|consent)\b[^.]{0,120}\bexclusive\s+jurisdiction\b|\b(?:does|do|shall|will|may)\s+not\s+(?:submit|consent)\b[^.]{0,120}\bexclusive\s+jurisdiction\b/i;
'''
if deterministic.count(forum_marker) != 1:
    raise SystemExit(
        f"forum marker: expected one match, found {deterministic.count(forum_marker)}"
    )
deterministic = deterministic.replace(forum_marker, negated_forum + forum_marker, 1)

old_clause_guard = r'''function clauseHasMandatoryForumEvidence(clause: string): boolean {
  if (clauseHasOptionalForumChoice(clause)) return false;
  if (BILATERAL_DEFENDANT_VENUE_RE.test(clause)) return false;'''
new_clause_guard = r'''function clauseHasMandatoryForumEvidence(clause: string): boolean {
  if (clauseHasOptionalForumChoice(clause)) return false;
  if (BILATERAL_DEFENDANT_VENUE_RE.test(clause)) return false;
  if (NEGATED_EXCLUSIVE_JURISDICTION_RE.test(clause)) return false;'''
deterministic = replace_once(
    deterministic,
    old_clause_guard,
    new_clause_guard,
    "negated exclusive jurisdiction",
)

deterministic_path.write_text(deterministic)


test_path = Path("lib/analyzer/__tests__/orion-parity-regression.test.mjs")
tests = test_path.read_text()
marker = "\nif (failures > 0) {\n"
if tests.count(marker) != 1:
    raise SystemExit(f"test marker: expected one match, found {tests.count(marker)}")

additions = r'''

const unrelatedExplicitPrimePaymentSavings = productionPath(`
2.8 Invoice Requirements
Failure to submit a complete invoice within 30 calendar days waives the right to payment. Prime Contractor's right to payment from the Government is not waived.
`);
check(
  "Prime Government-payment right does not preserve Subcontractor's late-invoice payment",
  unrelatedExplicitPrimePaymentSavings.findings.some(
    (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
  )
);

const scopedExplicitSubcontractorSavings = productionPath(`
2.8 Invoice Requirements
Failure to submit a complete invoice within 30 calendar days waives the right to payment. The Subcontractor's right to payment for the affected invoice is not waived during the cure period.
`);
check(
  "affected-invoice explicit Subcontractor payment savings suppresses permanent payment-loss finding",
  !scopedExplicitSubcontractorSavings.findings.some(
    (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
  )
);

for (const separator of [";", ","]) {
  const sameSentencePronounWaiver = productionPath(`
2.8 Invoice Requirements
Invoices must be submitted within 30 calendar days${separator} failure to do so waives the right to payment.
`);
  check(
    `same-sentence pronoun invoice waiver after ${separator === ";" ? "semicolon" : "comma"} triggers`,
    sameSentencePronounWaiver.findings.some(
      (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
    )
  );
}

for (const protectiveForumClause of [
  "Neither party consents to the exclusive jurisdiction of the courts located in Fairfax County, Virginia.",
  "Each party does not submit to the exclusive jurisdiction of the courts located in Arlington County, Virginia.",
]) {
  const negatedExclusiveJurisdiction = productionPath(`
2.23 Dispute Resolution
${protectiveForumClause}
`);
  check(
    "negated exclusive-jurisdiction language remains clean",
    !negatedExclusiveJurisdiction.findings.some(
      (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
    )
  );
}

for (const protectiveLicenseClause of [
  "Subcontractor does not grant Prime Contractor a royalty-free license to any Improvements.",
  "No royalty-free license to Improvements shall be granted to Prime Contractor.",
]) {
  const negatedRoyaltyFreeLicense = productionPath(`
2.17 Improvements
${protectiveLicenseClause}
`);
  check(
    "negated royalty-free Improvements license remains clean",
    !negatedRoyaltyFreeLicense.findings.some(
      (finding) => finding.regulation === "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements"
    )
  );
}
'''

test_path.write_text(tests.replace(marker, additions + marker, 1))
