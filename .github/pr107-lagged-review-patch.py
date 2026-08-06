from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)


deterministic_path = Path("lib/analyzer/deterministic.ts")
deterministic = deterministic_path.read_text()

old_actor_guard = r'''const EXPLICIT_NON_SUBCONTRACTOR_INVOICE_DUTY_RE =
  /\b(?:Prime(?:\s+Contractor)?|Government|Customer)(?:(?:'s|\u2019s)\s+failure\s+to\s+(?:submit|do\s+so)|\s+(?:(?:must|shall|should|will)\s+submit|is\s+required\s+to\s+submit|fails?\s+to\s+submit))\b/i;'''
new_actor_guard = r'''const EXPLICIT_NON_SUBCONTRACTOR_INVOICE_DUTY_RE =
  /\b(?:Prime(?:\s+Contractor)?|Government|Customer)(?:(?:'s|\u2019s)\s+failure\s+to\s+(?:submit|do\s+so)|\s+(?:(?:must|shall|should|will)\s+submit|is\s+required\s+to\s+submit|fails?\s+to\s+submit))\b|\binvoices?\b[^.]{0,120}(?:(?:must|shall|should|will)\s+be\s+submitted|are\s+required\s+to\s+be\s+submitted)\s+by\s+(?:Prime(?:\s+Contractor)?|Government|Customer)\b/i;'''
deterministic = replace_once(
    deterministic,
    old_actor_guard,
    new_actor_guard,
    "passive non-Subcontractor invoice-duty guard",
)

old_license_negation = r'''const NEGATED_PRIME_IMPROVEMENT_LICENSE_RE =
  /\bSubcontractor\b[^.]{0,100}(?:(?:does|shall|will|may)\s+not|never)\s+grant\b[^.]{0,220}\b(?:the\s+)?Prime(?:\s+Contractor)?\b[^.]{0,220}\blicense\b[^.]{0,160}\b(?:improvements?|adaptations?)\b|\bno\s+(?:royalty[\s-]?free\s+)?license\b[^.]{0,180}\b(?:improvements?|adaptations?)\b[^.]{0,120}\b(?:is|shall|will)\s+be\s+granted\b[^.]{0,100}\b(?:to\s+)?(?:the\s+)?Prime(?:\s+Contractor)?\b/i;'''
new_license_negation = r'''const NEGATED_PRIME_IMPROVEMENT_LICENSE_RE =
  /\bSubcontractor\b[^.]{0,100}(?:(?:(?:does|shall|will|may)\s+not|never)\s+grant|(?:expressly\s+)?(?:refuses?|declines?)\s+to\s+grant)\b[^.]{0,220}\b(?:the\s+)?Prime(?:\s+Contractor)?\b[^.]{0,220}\blicense\b[^.]{0,160}\b(?:improvements?|adaptations?)\b|\bno\s+(?:royalty[\s-]?free\s+)?license\b[^.]{0,180}\b(?:improvements?|adaptations?)\b[^.]{0,120}\b(?:is|shall|will)\s+be\s+granted\b[^.]{0,100}\b(?:to\s+)?(?:the\s+)?Prime(?:\s+Contractor)?\b/i;'''
deterministic = replace_once(
    deterministic,
    old_license_negation,
    new_license_negation,
    "refusal and declination license negation",
)

old_governing_block = r'''const GOVERNING_LAW_EVIDENCE_RE = new RegExp(
  String.raw`(?:\bgoverned\s+by\s+the\s+laws?\s+of|\bgoverning\s+law(?:\s+of[^.]{0,80}?)?\s*(?::|[-–—]|(?:shall|will|is)\s+be)\s*(?:(?:the\s+)?laws?\s+of\s+)?)\s*(?:the\s+)?(?:(?:State|Commonwealth)\s+of\s+)?${GOVERNING_LAW_JURISDICTION_RE.source}\b`,
  "i"
);
const MANDATORY_ARBITRATION_EVIDENCE_RE ='''
new_governing_block = r'''const GOVERNING_LAW_EVIDENCE_RE = new RegExp(
  String.raw`(?:\bgoverned\s+by\s+the\s+laws?\s+of|\bgoverning\s+law(?:\s+of[^.]{0,80}?)?\s*(?::|[-–—]|(?:shall|will|is)\s+be)\s*(?:(?:the\s+)?laws?\s+of\s+)?)\s*(?:the\s+)?(?:(?:State|Commonwealth)\s+of\s+)?${GOVERNING_LAW_JURISDICTION_RE.source}\b`,
  "i"
);
const NEGATED_GOVERNING_LAW_EVIDENCE_RE =
  /\b(?:this\s+)?(?:Agreement|Subcontract|Contract)\b[^.]{0,100}(?:(?:shall|will|must)\s+not\s+be|is\s+not)\s+governed\s+by\s+the\s+laws?\s+of\b|\bgoverning\s+law\b[^.]{0,100}(?:(?:shall|will|must)\s+not\s+be|is\s+not)\b/i;
const MANDATORY_ARBITRATION_EVIDENCE_RE ='''
deterministic = replace_once(
    deterministic,
    old_governing_block,
    new_governing_block,
    "governing-law negation evidence",
)

old_arbitration_negation = r'''const NEGATED_MANDATORY_ARBITRATION_EVIDENCE_RE =
  /\b(?:no|neither)\s+(?:disputes?|claims?|controvers(?:y|ies))\b[^.]{0,220}(?:binding\s+)?arbitration\b|\b(?:disputes?|claims?|controvers(?:y|ies))\b[^.]{0,180}(?:(?:must|shall|will)\s+not\s+be|(?:is|are)\s+not\s+required\s+to\s+be)\s+(?:resolved|settled|decided|submitted)\s+(?:exclusively\s+)?(?:by|through|to)\s+(?:binding\s+)?arbitration\b|\b(?:neither|no)\s+part(?:y|ies)\b[^.]{0,160}(?:agree|consent)\s+to\s+binding\s+arbitration\b|\b(?:no|neither)\s+binding\s+arbitration\b[^.]{0,160}(?:(?:is|shall|must|will)\s+(?:be\s+)?(?:required|mandatory)\b|(?:is|shall|must|will)\s+(?:be\s+)?(?:the\s+)?exclusive\s+(?:remedy|means|method|forum|procedure)\b)|\bbinding\s+arbitration\b[^.]{0,160}(?:is|shall|must|will)\s+not\s+(?:be\s+)?(?:(?:required|mandatory)\b|(?:the\s+)?exclusive\s+(?:remedy|means|method|forum|procedure)\b)/i;'''
new_arbitration_negation = r'''const NEGATED_MANDATORY_ARBITRATION_EVIDENCE_RE =
  /\b(?:no|neither)\s+(?:disputes?|claims?|controvers(?:y|ies))\b[^.]{0,220}(?:binding\s+)?arbitration\b|\b(?:disputes?|claims?|controvers(?:y|ies))\b[^.]{0,180}(?:(?:must|shall|will)\s+not\s+be|(?:is|are)\s+not\s+required\s+to\s+be)\s+(?:resolved|settled|decided|submitted)\s+(?:exclusively\s+)?(?:by|through|to)\s+(?:binding\s+)?arbitration\b|\b(?:neither|no)\s+part(?:y|ies)\b[^.]{0,160}(?:agree|consent)\s+to\s+binding\s+arbitration\b|\b(?:the\s+)?part(?:y|ies)\b[^.]{0,120}(?:(?:do|does|shall|will)\s+not\s+(?:agree|consent)|(?:expressly\s+)?(?:refuse|refuses|decline|declines)\s+to\s+(?:agree|consent))\s+to\s+binding\s+arbitration\b|\b(?:no|neither)\s+binding\s+arbitration\b[^.]{0,160}(?:(?:is|shall|must|will)\s+(?:be\s+)?(?:required|mandatory)\b|(?:is|shall|must|will)\s+(?:be\s+)?(?:the\s+)?exclusive\s+(?:remedy|means|method|forum|procedure)\b)|\bbinding\s+arbitration\b[^.]{0,160}(?:is|shall|must|will)\s+not\s+(?:be\s+)?(?:(?:required|mandatory)\b|(?:the\s+)?exclusive\s+(?:remedy|means|method|forum|procedure)\b)/i;'''
deterministic = replace_once(
    deterministic,
    old_arbitration_negation,
    new_arbitration_negation,
    "party rejection of arbitration",
)

old_governing_export = r'''export function hasVenueGoverningLawOrArbitrationEvidence(text: string): boolean {
  return (
    hasMandatoryVenueOrArbitrationEvidence(text) ||
    (GOVERNING_LAW_EVIDENCE_RE.test(text) &&
      !DEFERRED_OR_UNSELECTED_GOVERNING_LAW_RE.test(text))
  );
}'''
new_governing_export = r'''function governingLawEvidenceClauses(text: string): string[] {
  return text
    .split(
      /(?<=[.!?])\s+|\s*;\s*|,\s*(?:but|however|while|whereas)\s+|\s+(?:and|but)\s+(?=(?:(?:this\s+)?(?:Agreement|Subcontract|Contract)\b[^.]{0,100}(?:(?:shall|will|must)\s+(?:not\s+)?be|is\s+(?:not\s+)?)\s+governed\s+by|governing\s+law\b))/i
    )
    .map((clause) => clause.trim())
    .filter(Boolean);
}

function hasSelectedGoverningLawEvidence(text: string): boolean {
  return governingLawEvidenceClauses(text).some(
    (clause) =>
      GOVERNING_LAW_EVIDENCE_RE.test(clause) &&
      !DEFERRED_OR_UNSELECTED_GOVERNING_LAW_RE.test(clause) &&
      !NEGATED_GOVERNING_LAW_EVIDENCE_RE.test(clause)
  );
}

export function hasVenueGoverningLawOrArbitrationEvidence(text: string): boolean {
  return hasMandatoryVenueOrArbitrationEvidence(text) || hasSelectedGoverningLawEvidence(text);
}'''
deterministic = replace_once(
    deterministic,
    old_governing_export,
    new_governing_export,
    "branch-local selected governing law",
)

deterministic_path.write_text(deterministic)


test_path = Path("lib/analyzer/__tests__/orion-parity-regression.test.mjs")
tests = test_path.read_text()
marker = "\nif (failures > 0) {\n"
if tests.count(marker) != 1:
    raise SystemExit(f"test marker: expected one match, found {tests.count(marker)}")

additions = r'''

for (const [label, clause] of [
  ["refuses", "Subcontractor expressly refuses to grant Prime Contractor a royalty-free license to all Improvements."],
  ["declines", "Subcontractor declines to grant Prime Contractor a royalty-free license to all Adaptations."],
]) {
  const rejectedLicense = productionPath(`
2.17 Improvements
${clause}
`);
  check(
    `${label}: refusal to grant an unpaid Improvements license remains clean`,
    !rejectedLicense.findings.some(
      (finding) => finding.regulation === "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements"
    )
  );
}

const affirmativeLicenseAfterRefusalGuard = productionPath(`
2.17 Improvements
Subcontractor grants Prime Contractor a royalty-free license to all Improvements.
`);
const affirmativeLicenseAfterRefusalFinding = affirmativeLicenseAfterRefusalGuard.findings.find(
  (finding) => finding.regulation === "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements"
);
check(
  "affirmative royalty-free license still triggers after refusal guard",
  Boolean(affirmativeLicenseAfterRefusalFinding)
);
check(
  "affirmative royalty-free license remains quote-local after refusal guard",
  Boolean(
    affirmativeLicenseAfterRefusalFinding &&
      verifyFindings(
        [affirmativeLicenseAfterRefusalFinding],
        affirmativeLicenseAfterRefusalFinding.foundText
      ).verified.length === 1
  )
);

const mixedRefusedAndGrantedLicense = productionPath(`
2.17 Improvements
Subcontractor refuses to grant Prime Contractor a royalty-free license to Adaptations, but Subcontractor grants Prime Contractor a royalty-free license to Improvements.
`);
check(
  "refused Adaptations license does not hide a later affirmative Improvements license",
  mixedRefusedAndGrantedLicense.findings.some(
    (finding) => finding.regulation === "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements"
  )
);

for (const actor of ["Prime Contractor", "Government", "Customer"]) {
  const passiveOtherActorInvoiceDuty = productionPath(`
2.8 Invoice Requirements
Invoices must be submitted by ${actor} within 30 calendar days; failure to do so waives the right to payment.
`);
  check(
    `passive invoice duty assigned to ${actor} remains clean`,
    !passiveOtherActorInvoiceDuty.findings.some(
      (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
    )
  );
}

const passiveSubcontractorInvoiceDuty = productionPath(`
2.8 Invoice Requirements
Invoices must be submitted by Subcontractor within 30 calendar days; failure to do so waives the right to payment.
`);
check(
  "passive invoice duty assigned to Subcontractor still triggers payment-waiver analysis",
  passiveSubcontractorInvoiceDuty.findings.some(
    (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
  )
);

for (const clause of [
  "This Agreement shall not be governed by the laws of the Commonwealth of Virginia.",
  "This Subcontract is not governed by the laws of New York.",
]) {
  const negatedGoverningLaw = productionPath(`
2.23 Governing Law
${clause}
`);
  check(
    `negated governing-law selection remains clean: ${clause}`,
    !negatedGoverningLaw.findings.some(
      (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
    )
  );
}

const affirmativeLawAfterNegationGuard = productionPath(`
2.23 Governing Law
This Agreement shall be governed by the laws of the Commonwealth of Virginia.
`);
check(
  "affirmative governing-law selection still triggers after negation guard",
  affirmativeLawAfterNegationGuard.findings.some(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  )
);

const mixedNegatedAndAffirmativeLaw = productionPath(`
2.23 Governing Law
This Agreement shall not be governed by the laws of Virginia, but this Agreement shall be governed by the laws of New York.
`);
check(
  "negated Virginia branch does not hide affirmative New York governing law",
  mixedNegatedAndAffirmativeLaw.findings.some(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  )
);

for (const clause of [
  "The parties do not agree to binding arbitration.",
  "The parties refuse to consent to binding arbitration.",
  "The parties decline to agree to binding arbitration.",
]) {
  const rejectedArbitration = productionPath(`
2.23 Dispute Resolution
${clause}
`);
  check(
    `express rejection of arbitration remains clean: ${clause}`,
    !rejectedArbitration.findings.some(
      (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
    )
  );
}

const affirmativeAgreementToArbitrate = productionPath(`
2.23 Dispute Resolution
The parties agree to binding arbitration.
`);
check(
  "affirmative agreement to binding arbitration still triggers after rejection guard",
  affirmativeAgreementToArbitrate.findings.some(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  )
);

const mixedRejectedAndMandatoryArbitration = productionPath(`
2.23 Dispute Resolution
The parties do not agree to binding arbitration for invoice disputes, but all intellectual-property claims shall be resolved through binding arbitration.
`);
check(
  "rejected invoice arbitration does not hide later mandatory IP arbitration",
  mixedRejectedAndMandatoryArbitration.findings.some(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  )
);
'''

test_path.write_text(tests.replace(marker, additions + marker, 1))
