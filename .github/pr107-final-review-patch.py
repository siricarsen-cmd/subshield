from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)


deterministic_path = Path("lib/analyzer/deterministic.ts")
deterministic = deterministic_path.read_text()

old_payment = r'''const EXPLICIT_PAYMENT_RIGHT_PRESERVED_RE =
  /(?:does|shall|will)\s+not\s+(?:waive|forfeit)[^.]{0,80}(?:right|entitlement)\s+to\s+payment|(?:right|entitlement)\s+to\s+payment[^.]{0,80}(?:is|shall|will)\s+not\s+(?:waived|forfeited)|(?:payment|amounts?)[^.]{0,80}(?:is|are|shall|will)\s+not\s+(?:be\s+)?(?:waived|forfeited)|(?:does|shall|will)\s+not\s+(?:waive|forfeit)\s+(?:the\s+)?(?:payment|amounts?)/i;'''
new_payment = r'''const EXPLICIT_PAYMENT_RIGHT_PRESERVED_RE =
  /(?:does|shall|will)\s+not\s+(?:waive|forfeit)[^.]{0,80}(?:right|entitlement)\s+to\s+payment|(?:right|entitlement)\s+to\s+payment[^.]{0,80}(?:is|shall|will)\s+not\s+(?:waived|forfeited)/i;
const BARE_PAYMENT_PRESERVED_RE =
  /(?:payment|amounts?)[^.]{0,80}(?:is|are|shall|will)\s+not\s+(?:be\s+)?(?:waived|forfeited)|(?:does|shall|will)\s+not\s+(?:waive|forfeit)\s+(?:the\s+)?(?:payment|amounts?)/i;
const SAME_SCOPE_BARE_PAYMENT_CONTEXT_RE =
  /\b(?:affected|subject|late|delayed)\s+(?:invoice|amount|payment)\b|\b(?:cure|grace)\s+period\b|\bsubmitted\s+(?:during|within)\s+(?:the\s+)?(?:cure|grace)\b|\bafter\s+(?:the\s+)?(?:cure|grace)\b/i;'''
deterministic = replace_once(
    deterministic,
    old_payment,
    new_payment,
    "scoped bare payment preservation",
)

old_generic_return = r'''  return (
    EXPLICIT_PAYMENT_RIGHT_PRESERVED_RE.test(sentence) ||
    SAME_SCOPE_PAYMENT_REMAINS_RE.test(sentence) ||
    ADJACENT_SAME_SCOPE_PAYMENT_REMAINS_RE.test(sentence)
  );'''
new_generic_return = r'''  const sameScopeBarePaymentPreservation =
    BARE_PAYMENT_PRESERVED_RE.test(sentence) &&
    SAME_SCOPE_BARE_PAYMENT_CONTEXT_RE.test(sentence);
  return (
    EXPLICIT_PAYMENT_RIGHT_PRESERVED_RE.test(sentence) ||
    sameScopeBarePaymentPreservation ||
    SAME_SCOPE_PAYMENT_REMAINS_RE.test(sentence) ||
    ADJACENT_SAME_SCOPE_PAYMENT_REMAINS_RE.test(sentence)
  );'''
deterministic = replace_once(
    deterministic,
    old_generic_return,
    new_generic_return,
    "generic payment preservation scope",
)

license_marker = "const WITHOUT_ADDITIONAL_PAYMENT_RE ="
license_constant = r'''const DIRECT_PRIME_UNPAID_IMPROVEMENT_LICENSE_RE =
  /\bSubcontractor\b[^.]{0,100}\bgrants?\b(?:(?:(?!\b(?:deliverables?|services?|work\s+products?)\b)[^.]){0,180})\b(?:the\s+)?Prime(?:\s+Contractor)?\b(?:(?:(?!\b(?:deliverables?|services?|work\s+products?)\b)[^.]){0,180})\b(?:royalty[\s-]?free|free\s+of\s+charge|without\s+(?:additional\s+)?(?:payment|compensation|charge|fee)|at\s+no\s+(?:additional\s+)?(?:cost|charge|fee|expense))\b(?:(?:(?!\b(?:deliverables?|services?|work\s+products?)\b)[^.]){0,120})\blicense\b(?:(?:(?!\b(?:deliverables?|services?|work\s+products?)\b)[^.]){0,120})\b(?:improvements?|adaptations?)\b|\bSubcontractor\b[^.]{0,100}\bgrants?\b(?:(?:(?!\b(?:deliverables?|services?|work\s+products?)\b)[^.]){0,120})\b(?:royalty[\s-]?free|free\s+of\s+charge|without\s+(?:additional\s+)?(?:payment|compensation|charge|fee)|at\s+no\s+(?:additional\s+)?(?:cost|charge|fee|expense))\b(?:(?:(?!\b(?:deliverables?|services?|work\s+products?)\b)[^.]){0,80})\blicense\b(?:(?:(?!\b(?:deliverables?|services?|work\s+products?)\b)[^.]){0,100})\b(?:to\s+)?(?:the\s+)?Prime(?:\s+Contractor)?\b(?:(?:(?!\b(?:deliverables?|services?|work\s+products?)\b)[^.]){0,100})\b(?:improvements?|adaptations?)\b/i;
'''
if deterministic.count(license_marker) != 1:
    raise SystemExit(
        f"license marker: expected one match, found {deterministic.count(license_marker)}"
    )
deterministic = deterministic.replace(license_marker, license_constant + license_marker, 1)

old_candidates = r'''  const candidates = [
    DIRECT_PRIME_PASSIVE_IMPROVEMENT_USE_RE.exec(segment),
    DIRECT_PRIME_ACTIVE_IMPROVEMENT_USE_RE.exec(segment),
  ].filter((match): match is RegExpExecArray => match !== null);'''
new_candidates = r'''  const candidates = [
    DIRECT_PRIME_PASSIVE_IMPROVEMENT_USE_RE.exec(segment),
    DIRECT_PRIME_ACTIVE_IMPROVEMENT_USE_RE.exec(segment),
    DIRECT_PRIME_UNPAID_IMPROVEMENT_LICENSE_RE.exec(segment),
  ].filter((match): match is RegExpExecArray => match !== null);'''
deterministic = replace_once(
    deterministic,
    old_candidates,
    new_candidates,
    "direct Prime license candidate",
)

forum_marker = "const DIRECT_MANDATORY_FORUM_RE ="
forum_constant = r'''const EXCLUSIVE_JURISDICTION_SUBMISSION_RE =
  /(?:\b(?:each|either|both|the)\s+part(?:y|ies)\b[^.]{0,120})?(?:irrevocably\s+)?(?:submits?|consents?)\s+to\s+(?:the\s+)?exclusive\s+jurisdiction\s+of[^.]{0,220}(?:courts?|County|State|Commonwealth|District|City)|\bcourts?\b[^.]{0,180}\b(?:shall|will)\s+have\s+exclusive\s+jurisdiction\b|\bcourts?\b[^.]{0,180}\bhaving\s+exclusive\s+jurisdiction\b/i;
'''
if deterministic.count(forum_marker) != 1:
    raise SystemExit(
        f"forum marker: expected one match, found {deterministic.count(forum_marker)}"
    )
deterministic = deterministic.replace(forum_marker, forum_constant + forum_marker, 1)

old_forum_return = r'''    BASE_FORUM_EVIDENCE_RE.test(clause) ||
    DIRECT_MANDATORY_FORUM_RE.test(clause) ||
    EXCLUSIVE_FORUM_RE.test(clause)'''
new_forum_return = r'''    BASE_FORUM_EVIDENCE_RE.test(clause) ||
    EXCLUSIVE_JURISDICTION_SUBMISSION_RE.test(clause) ||
    DIRECT_MANDATORY_FORUM_RE.test(clause) ||
    EXCLUSIVE_FORUM_RE.test(clause)'''
deterministic = replace_once(
    deterministic,
    old_forum_return,
    new_forum_return,
    "exclusive jurisdiction evidence",
)
deterministic_path.write_text(deterministic)


test_path = Path("lib/analyzer/__tests__/orion-parity-regression.test.mjs")
tests = test_path.read_text()
marker = "\nif (failures > 0) {\n"
if tests.count(marker) != 1:
    raise SystemExit(f"test marker: expected one match, found {tests.count(marker)}")

additions = r'''

for (const [label, clause] of [
  [
    "irrevocable submission",
    "Each party irrevocably submits to the exclusive jurisdiction of the state and federal courts located in Fairfax County, Virginia.",
  ],
  [
    "consent to exclusive jurisdiction",
    "Each party consents to the exclusive jurisdiction of the courts located in Arlington County, Virginia.",
  ],
  [
    "courts having exclusive jurisdiction",
    "The state courts located in Fairfax County shall have exclusive jurisdiction over all disputes.",
  ],
]) {
  const exclusiveJurisdiction = productionPath(`
2.23 Dispute Resolution
${clause}
`);
  const exclusiveJurisdictionFinding = exclusiveJurisdiction.findings.find(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  );
  check(`${label}: explicit exclusive jurisdiction triggers`, Boolean(exclusiveJurisdictionFinding));
  check(
    `${label}: exclusive-jurisdiction analysis remains quote-local`,
    Boolean(
      exclusiveJurisdictionFinding &&
        verifyFindings([exclusiveJurisdictionFinding], exclusiveJurisdictionFinding.foundText).verified.length === 1
    )
  );
}

const royaltyFreeLicenseGrant = productionPath(`
2.17 Improvements
Subcontractor hereby grants Prime Contractor a perpetual, royalty-free license to all Improvements.
`);
const royaltyFreeLicenseFinding = royaltyFreeLicenseGrant.findings.find(
  (finding) => finding.regulation === "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements"
);
check("direct royalty-free license to Prime triggers", Boolean(royaltyFreeLicenseFinding));
check(
  "direct royalty-free license finding remains quote-local",
  Boolean(
    royaltyFreeLicenseFinding &&
      verifyFindings([royaltyFreeLicenseFinding], royaltyFreeLicenseFinding.foundText).verified.length === 1
  )
);

const competingRoyaltyFreeLicense = productionPath(`
2.17 Improvements
Subcontractor grants Prime Contractor a royalty-free license to the Deliverables, while Improvements remain owned and used solely by Subcontractor.
`);
check(
  "royalty-free Deliverables license does not become an Improvements-use finding",
  !competingRoyaltyFreeLicense.findings.some(
    (finding) => finding.regulation === "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements"
  )
);

for (const [label, savings] of [
  ["timely submitted invoices", "Payment for timely submitted invoices shall not be waived."],
  ["Prime Government receipt", "Prime Contractor's payment from the Government shall not be waived."],
]) {
  const unrelatedBarePaymentSavings = productionPath(`
2.8 Invoice Requirements
Failure to submit a complete invoice within 30 calendar days waives the right to payment. ${savings}
`);
  check(
    `${label}: unrelated bare-payment savings do not hide late-invoice forfeiture`,
    unrelatedBarePaymentSavings.findings.some(
      (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
    )
  );
}
'''

test_path.write_text(tests.replace(marker, additions + marker, 1))
