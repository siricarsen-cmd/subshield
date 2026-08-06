from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)


deterministic_path = Path("lib/analyzer/deterministic.ts")
deterministic = deterministic_path.read_text()

old_branch_split = r'''.split(/\s*(?:;|,\s*but\b|\bbut\b)\s*/i)'''
new_branch_split = r'''.split(
      /\s*(?:;|,\s*but\b|\bbut\b|\band\b\s+(?=(?:Subcontractor(?:'s|\u2019s)?\s+)?failure\s+to\s+))\s*/i
    )'''
deterministic = replace_once(
    deterministic,
    old_branch_split,
    new_branch_split,
    "split coordinated Subcontractor invoice-waiver branches",
)

old_jurisdiction_negation = r'''const NEGATED_EXCLUSIVE_JURISDICTION_RE =
  /\b(?:neither\s+party|no\s+party)\b[^.]{0,120}(?:irrevocably\s+)?(?:submits?|consents?)\s+to\s+(?:the\s+)?exclusive\s+jurisdiction\b|\b(?:each|either|both|the)\s+part(?:y|ies)\b[^.]{0,120}(?:(?:does|do|shall|will|may)\s+not|never)\s+(?:submit|consent)\b[^.]{0,120}\bexclusive\s+jurisdiction\b|\b(?:does|do|shall|will|may)\s+not\s+(?:submit|consent)\b[^.]{0,120}\bexclusive\s+jurisdiction\b|\b(?:each|either|both|the)\s+part(?:y|ies)\b[^.]{0,140}(?:expressly\s+)?(?:refuses?|declines?)\s+to\s+(?:submit|consent)\b[^.]{0,140}\bexclusive\s+jurisdiction\b|\b(?:each|either|both|the)\s+part(?:y|ies)\b[^.]{0,140}(?:expressly\s+)?disclaims?\s+(?:any\s+)?(?:submission|consent)\s+to\s+(?:the\s+)?exclusive\s+jurisdiction\b/i;'''
new_jurisdiction_negation = r'''const NEGATED_EXCLUSIVE_JURISDICTION_RE =
  /\b(?:neither\s+party|no\s+party)\b[^.]{0,120}(?:irrevocably\s+)?(?:submits?|consents?)\s+to\s+(?:the\s+)?exclusive\s+jurisdiction\b|\b(?:each|either|both|the)\s+part(?:y|ies)\b[^.]{0,120}(?:(?:does|do|shall|will|may)\s+not|never)\s+(?:submit|consent)\b[^.]{0,120}\bexclusive\s+jurisdiction\b|\b(?:does|do|shall|will|may)\s+not\s+(?:submit|consent)\b[^.]{0,120}\bexclusive\s+jurisdiction\b|\b(?:each|either|both|the)\s+part(?:y|ies)\b[^.]{0,140}(?:expressly\s+)?(?:refuses?|declines?)\s+to\s+(?:submit|consent)\b[^.]{0,140}\bexclusive\s+jurisdiction\b|\b(?:each|either|both|the)\s+part(?:y|ies)\b[^.]{0,140}(?:expressly\s+)?disclaims?\s+(?:any\s+)?(?:submission|consent)\s+to\s+(?:the\s+)?exclusive\s+jurisdiction\b|\b(?:each|either|both|the)\s+part(?:y|ies)\b[^.]{0,140}(?:expressly\s+)?den(?:y|ies|ied)\s+(?:any\s+)?consent\s+to\s+(?:the\s+)?exclusive\s+jurisdiction\b|\bden(?:y|ies|ied)\s+(?:any\s+)?consent\s+to\s+(?:the\s+)?exclusive\s+jurisdiction\b/i;'''
deterministic = replace_once(
    deterministic,
    old_jurisdiction_negation,
    new_jurisdiction_negation,
    "deny-consent exclusive-jurisdiction guard",
)

old_deferred_law = r'''const DEFERRED_OR_UNSELECTED_GOVERNING_LAW_RE =
  /\bgoverning\s+law\b[^.]{0,140}\b(?:has|have|is|was)\s+not\s+(?:been\s+)?selected\b|\bgoverning\s+law\b[^.]{0,140}\b(?:shall|will|is\s+to)\s+be\s+(?:agreed|selected|determined)\s+(?:later|by\s+(?:(?:mutual\s+)?agreement(?:\s+of\s+(?:the\s+)?parties)?|(?:the\s+)?parties))\b/i;'''
new_deferred_law = r'''const DEFERRED_OR_UNSELECTED_GOVERNING_LAW_RE =
  /\bgoverning\s+law\b[^.]{0,140}\b(?:has|have|is|was)\s+not\s+(?:been\s+)?selected\b|\bgoverning\s+law\b[^.]{0,140}\b(?:shall|will|is\s+to)\s+be\s+(?:agreed|selected|determined)\s+(?:later|by\s+(?:(?:mutual\s+)?agreement(?:\s+of\s+(?:the\s+)?parties)?|(?:the\s+)?parties))\b|\bgoverning\s+law\b[^.]{0,140}\b(?:shall|will|is\s+to)\s+be\s+(?:subject\s+to|specified|identified|provided|negotiated|finalized|established|set\s+forth)\b/i;'''
deterministic = replace_once(
    deterministic,
    old_deferred_law,
    new_deferred_law,
    "broader unresolved governing-law guard",
)

deterministic_path.write_text(deterministic)


test_path = Path("lib/analyzer/__tests__/orion-parity-regression.test.mjs")
tests = test_path.read_text()
marker = "\nif (failures > 0) {\n"
if tests.count(marker) != 1:
    raise SystemExit(f"test marker: expected one match, found {tests.count(marker)}")

additions = r'''

const coordinatedPrimeAndSubcontractorInvoiceDuties = productionPath(`
2.8 Invoice Requirements
Prime Contractor shall submit its invoice within 30 calendar days, and Subcontractor's failure to submit a complete invoice within 30 calendar days waives the right to payment.
`);
check(
  "Prime invoice duty does not hide a coordinated Subcontractor payment waiver",
  coordinatedPrimeAndSubcontractorInvoiceDuties.findings.some(
    (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
  )
);

const primeOnlyCoordinatedInvoiceDuty = productionPath(`
2.8 Invoice Requirements
Prime Contractor shall submit its invoice within 30 calendar days, and Prime Contractor's failure to submit a complete invoice within 30 calendar days waives the right to payment.
`);
check(
  "coordinated Prime-only invoice duties remain clean",
  !primeOnlyCoordinatedInvoiceDuty.findings.some(
    (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
  )
);

const deniedExclusiveJurisdictionConsent = productionPath(`
2.23 Dispute Resolution
Each party denies consent to the exclusive jurisdiction of the courts located in Fairfax County.
`);
check(
  "denied exclusive-jurisdiction consent remains clean",
  !deniedExclusiveJurisdictionConsent.findings.some(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  )
);

const affirmativeExclusiveJurisdictionConsentAfterDenialGuard = productionPath(`
2.23 Dispute Resolution
Each party irrevocably consents to the exclusive jurisdiction of the courts located in Fairfax County.
`);
check(
  "affirmative exclusive-jurisdiction consent still triggers after denial guard",
  affirmativeExclusiveJurisdictionConsentAfterDenialGuard.findings.some(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  )
);

for (const [label, clause] of [
  ["subject to further negotiation", "The governing law shall be subject to further negotiation."],
  ["specified in final subcontract", "The governing law shall be specified in the final subcontract."],
]) {
  const unresolvedLaw = productionPath(`
2.23 Governing Law
${clause}
`);
  check(
    `${label}: unresolved governing-law wording remains clean`,
    !unresolvedLaw.findings.some(
      (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
    )
  );
}

const selectedVirginiaLawAfterBroaderDeferralGuard = productionPath(`
2.23 Governing Law
The governing law of this Agreement shall be the laws of the State of Virginia.
`);
check(
  "selected Virginia law still triggers after broader deferral guard",
  selectedVirginiaLawAfterBroaderDeferralGuard.findings.some(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  )
);
'''

test_path.write_text(tests.replace(marker, additions + marker, 1))
