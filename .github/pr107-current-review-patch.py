from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)


deterministic_path = Path("lib/analyzer/deterministic.ts")
deterministic = deterministic_path.read_text()

old_payment_context = r'''const SAME_SCOPE_EXPLICIT_PAYMENT_CONTEXT_RE =
  /\b(?:affected|subject|late|delayed)\s+(?:invoice|amount|payment)\b|\b(?:cure|grace)\s+period\b|\binvoices?\b|^\s*(?:this|such|the\s+foregoing)\b|\bSubcontractor(?:'s|\u2019s)?\s+(?:right|entitlement)\s+to\s+payment\b/i;'''
new_payment_context = r'''const SAME_SCOPE_EXPLICIT_PAYMENT_CONTEXT_RE =
  /\b(?:affected|subject|late|delayed)\s+(?:invoice|amount|payment)\b|\b(?:cure|grace)\s+period\b|\binvoices?\b|^\s*(?:this|such|the\s+foregoing)\b|\bSubcontractor(?:'s|\u2019s)?\s+(?:right|entitlement)\s+to\s+payment\b/i;
const PRIME_PAYMENT_RIGHT_PRESERVATION_RE =
  /\bPrime(?:\s+Contractor)?(?:'s|\u2019s)\s+(?:right|entitlement)\s+to\s+payment\b/i;'''
deterministic = replace_once(
    deterministic,
    old_payment_context,
    new_payment_context,
    "Prime payment-right preservation guard",
)

old_explicit_scope = r'''  const sameScopeExplicitPaymentPreservation =
    EXPLICIT_PAYMENT_RIGHT_PRESERVED_RE.test(sentence) &&
    (isWaiverSentenceScope || SAME_SCOPE_EXPLICIT_PAYMENT_CONTEXT_RE.test(sentence));'''
new_explicit_scope = r'''  const sameScopeExplicitPaymentPreservation =
    EXPLICIT_PAYMENT_RIGHT_PRESERVED_RE.test(sentence) &&
    !PRIME_PAYMENT_RIGHT_PRESERVATION_RE.test(sentence) &&
    (isWaiverSentenceScope || SAME_SCOPE_EXPLICIT_PAYMENT_CONTEXT_RE.test(sentence));'''
deterministic = replace_once(
    deterministic,
    old_explicit_scope,
    new_explicit_scope,
    "reject Prime-owned payment-right savings",
)

old_sentence_start = r'''): boolean {
  const preservedInvoiceIds = extractInvoiceIds(sentence);'''
new_sentence_start = r'''): boolean {
  if (PRIME_PAYMENT_RIGHT_PRESERVATION_RE.test(sentence)) return false;
  const preservedInvoiceIds = extractInvoiceIds(sentence);'''
deterministic = replace_once(
    deterministic,
    old_sentence_start,
    new_sentence_start,
    "reject Prime-owned named-invoice savings",
)

license_marker = "const WITHOUT_ADDITIONAL_PAYMENT_RE ="
postfix_license = r'''const DIRECT_PRIME_POSTFIX_UNPAID_IMPROVEMENT_LICENSE_RE =
  /\bSubcontractor\b[^.]{0,100}\bgrants?\b(?:(?:(?!\b(?:deliverables?|services?|work\s+products?)\b)[^.]){0,180})\b(?:the\s+)?Prime(?:\s+Contractor)?\b(?:(?:(?!\b(?:deliverables?|services?|work\s+products?)\b)[^.]){0,160})\blicense\b(?:(?:(?!\b(?:deliverables?|services?|work\s+products?)\b)[^.]){0,140})\b(?:improvements?|adaptations?)\b(?:(?:(?!\b(?:deliverables?|services?|work\s+products?)\b)[^.]){0,100})\b(?:on\s+(?:a\s+)?royalty[\s-]?free\s+basis|royalty[\s-]?free|free\s+of\s+charge|without\s+(?:additional\s+)?(?:payment|compensation|charge|fee)|at\s+no\s+(?:additional\s+)?(?:cost|charge|fee|expense))\b/i;
'''
if deterministic.count(license_marker) != 1:
    raise SystemExit(
        f"license marker: expected one match, found {deterministic.count(license_marker)}"
    )
deterministic = deterministic.replace(license_marker, postfix_license + license_marker, 1)

old_candidates = r'''  const candidates = [
    DIRECT_PRIME_PASSIVE_IMPROVEMENT_USE_RE.exec(segment),
    DIRECT_PRIME_ACTIVE_IMPROVEMENT_USE_RE.exec(segment),
    DIRECT_PRIME_UNPAID_IMPROVEMENT_LICENSE_RE.exec(segment),
  ].filter((match): match is RegExpExecArray => match !== null);'''
new_candidates = r'''  const candidates = [
    DIRECT_PRIME_PASSIVE_IMPROVEMENT_USE_RE.exec(segment),
    DIRECT_PRIME_ACTIVE_IMPROVEMENT_USE_RE.exec(segment),
    DIRECT_PRIME_UNPAID_IMPROVEMENT_LICENSE_RE.exec(segment),
    DIRECT_PRIME_POSTFIX_UNPAID_IMPROVEMENT_LICENSE_RE.exec(segment),
  ].filter((match): match is RegExpExecArray => match !== null);'''
deterministic = replace_once(
    deterministic,
    old_candidates,
    new_candidates,
    "postfix unpaid license candidate",
)

old_governing_law = r'''const GOVERNING_LAW_EVIDENCE_RE =
  /(?:\bgoverned\s+by\s+the\s+laws?\s+of|\bgoverning\s+law\s*(?::|[-–—])\s*(?:the\s+laws?\s+of)?)(?:\s+(?:(?:the\s+)?(?:State|Commonwealth)\s+of\s+)?[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,2})/i;'''
new_governing_law = r'''const DEFERRED_OR_UNSELECTED_GOVERNING_LAW_RE =
  /\bgoverning\s+law\b[^.]{0,140}\b(?:has|have|is|was)\s+not\s+(?:been\s+)?selected\b|\bgoverning\s+law\b[^.]{0,140}\bshall\s+be\s+(?:agreed|selected|determined)\s+later\b/i;
const GOVERNING_LAW_EVIDENCE_RE =
  /(?:\bgoverned\s+by\s+the\s+laws?\s+of|\bgoverning\s+law(?:\s+of[^.]{0,80})?\s*(?::|[-–—]|(?:shall|will|is)\s+be)\s*(?:the\s+laws?\s+of)?)(?:\s+(?:(?:the\s+)?(?:State|Commonwealth)\s+of\s+)?[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,2})/i;'''
deterministic = replace_once(
    deterministic,
    old_governing_law,
    new_governing_law,
    "governing-law shall-be formulation",
)

old_evidence_return = r'''export function hasVenueGoverningLawOrArbitrationEvidence(text: string): boolean {
  return hasMandatoryVenueOrArbitrationEvidence(text) || GOVERNING_LAW_EVIDENCE_RE.test(text);
}'''
new_evidence_return = r'''export function hasVenueGoverningLawOrArbitrationEvidence(text: string): boolean {
  return (
    hasMandatoryVenueOrArbitrationEvidence(text) ||
    (GOVERNING_LAW_EVIDENCE_RE.test(text) &&
      !DEFERRED_OR_UNSELECTED_GOVERNING_LAW_RE.test(text))
  );
}'''
deterministic = replace_once(
    deterministic,
    old_evidence_return,
    new_evidence_return,
    "deferred governing-law rejection",
)

deterministic_path.write_text(deterministic)


test_path = Path("lib/analyzer/__tests__/orion-parity-regression.test.mjs")
tests = test_path.read_text()
marker = "\nif (failures > 0) {\n"
if tests.count(marker) != 1:
    raise SystemExit(f"test marker: expected one match, found {tests.count(marker)}")

additions = r'''

const postfixRoyaltyFreeLicense = productionPath(`
2.17 Improvements
Subcontractor grants Prime Contractor a license to all Improvements on a royalty-free basis.
`);
const postfixRoyaltyFreeFinding = postfixRoyaltyFreeLicense.findings.find(
  (finding) => finding.regulation === "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements"
);
check("postfix royalty-free Improvements license triggers", Boolean(postfixRoyaltyFreeFinding));
check(
  "postfix royalty-free license finding remains quote-local",
  Boolean(
    postfixRoyaltyFreeFinding &&
      verifyFindings([postfixRoyaltyFreeFinding], postfixRoyaltyFreeFinding.foundText).verified.length === 1
  )
);

const postfixRoyaltyBearingLicense = productionPath(`
2.17 Improvements
Subcontractor grants Prime Contractor a license to all Improvements on a royalty-bearing basis.
`);
check(
  "postfix royalty-bearing Improvements license remains clean",
  !postfixRoyaltyBearingLicense.findings.some(
    (finding) => finding.regulation === "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements"
  )
);

const primeAffectedInvoicePaymentRight = productionPath(`
2.8 Invoice Requirements
Failure to submit a complete invoice within 30 calendar days waives the Subcontractor's right to payment. Prime Contractor's right to payment for the affected invoice is not waived.
`);
check(
  "Prime's affected-invoice payment right does not preserve Subcontractor's forfeited payment",
  primeAffectedInvoicePaymentRight.findings.some(
    (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
  )
);

const subcontractorAffectedInvoicePaymentRight = productionPath(`
2.8 Invoice Requirements
Failure to submit a complete invoice within 30 calendar days waives the Subcontractor's right to payment. Subcontractor's right to payment for the affected invoice is not waived during the cure period.
`);
check(
  "Subcontractor's affected-invoice payment right suppresses permanent payment-loss finding",
  !subcontractorAffectedInvoicePaymentRight.findings.some(
    (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
  )
);

const governingLawShallBe = productionPath(`
2.23 Governing Law
The governing law of this Agreement shall be the laws of the State of Virginia.
`);
check(
  "governing-law shall-be formulation produces the combined dispute-law finding",
  governingLawShallBe.findings.some(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  )
);

const governingLawUnselected = productionPath(`
2.23 Governing Law
The governing law of this Agreement has not been selected and shall be agreed later by both parties.
`);
check(
  "unselected governing-law language remains clean",
  !governingLawUnselected.findings.some(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  )
);
'''

test_path.write_text(tests.replace(marker, additions + marker, 1))
