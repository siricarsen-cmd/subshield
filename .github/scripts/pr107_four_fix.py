from pathlib import Path

DETERMINISTIC_PATH = Path("lib/analyzer/deterministic.ts")
TESTS_PATH = Path("lib/analyzer/__tests__/orion-parity-regression.test.mjs")


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected 1 match, found {count}")
    return text.replace(old, new, 1)


def main() -> None:
    deterministic = DETERMINISTIC_PATH.read_text()
    tests = TESTS_PATH.read_text()

    deterministic = replace_once(
        deterministic,
        "const EXPLICIT_PAYMENT_RIGHT_PRESERVED_RE =\n  /(?:does|shall|will)\\s+not\\s+(?:waive|forfeit)[^.]{0,80}(?:right|entitlement)\\s+to\\s+payment|(?:right|entitlement)\\s+to\\s+payment[^.]{0,80}(?:is|are|shall|will)\\s+not\\s+(?:waived|forfeited)/i;",
        "const EXPLICIT_PAYMENT_RIGHT_PRESERVED_RE =\n  /(?:does|shall|will)\\s+not\\s+(?:waive|forfeit)[^.]{0,80}(?:rights?|entitlements?)\\s+to\\s+payment|(?:rights?|entitlements?)\\s+to\\s+payment[^.]{0,80}(?:is|are|shall|will)\\s+not\\s+(?:waived|forfeited)/i;",
        "plural explicit payment preservation",
    )
    deterministic = replace_once(
        deterministic,
        "const PRIME_PAYMENT_RIGHT_PRESERVATION_RE =\n  /\\bPrime(?:\\s+Contractor)?(?:'s|\\u2019s)\\s+(?:right|entitlement)\\s+to\\s+payment\\b/i;\nconst SUBCONTRACTOR_PAYMENT_RIGHT_PRESERVATION_RE =\n  /\\bSubcontractor(?:'s|\\u2019s)\\s+(?:right|entitlement)\\s+to\\s+payment\\b/i;",
        "const PRIME_PAYMENT_RIGHT_PRESERVATION_RE =\n  /\\bPrime(?:\\s+Contractor)?(?:'s|\\u2019s)\\s+(?:rights?|entitlements?)\\s+to\\s+payment\\b/i;\nconst SUBCONTRACTOR_PAYMENT_RIGHT_PRESERVATION_RE =\n  /\\bSubcontractor(?:'s|\\u2019s)(?:\\s+and\\s+Prime(?:\\s+Contractor)?(?:'s|\\u2019s))?\\s+(?:rights?|entitlements?)\\s+to\\s+payment\\b|\\bPrime(?:\\s+Contractor)?(?:'s|\\u2019s)\\s+and\\s+Subcontractor(?:'s|\\u2019s)\\s+(?:rights?|entitlements?)\\s+to\\s+payment\\b/i;",
        "coordinated payment actors",
    )
    deterministic = replace_once(
        deterministic,
        "    (isWaiverSentenceScope || SAME_SCOPE_EXPLICIT_PAYMENT_CONTEXT_RE.test(sentence));",
        "    (isWaiverSentenceScope ||\n      SAME_SCOPE_EXPLICIT_PAYMENT_CONTEXT_RE.test(sentence) ||\n      SUBCONTRACTOR_PAYMENT_RIGHT_PRESERVATION_RE.test(sentence));",
        "payment preservation context",
    )

    forum_start = deterministic.index("const NEGATED_EXCLUSIVE_JURISDICTION_RE =")
    forum_end = deterministic.index("const EXCLUSIVE_JURISDICTION_SUBMISSION_RE =", forum_start)
    forum_guard = deterministic[forum_start:forum_end]
    generic_actor = r"(?:each|either|both|the)\s+part(?:y|ies)"
    named_actor = r"(?:(?:each|either|both|the)\s+part(?:y|ies)|Subcontractor|Prime(?:\s+Contractor)?)"
    actor_count = forum_guard.count(generic_actor)
    if actor_count < 3:
        raise RuntimeError(f"named forum refusal actors: expected >=3 matches, found {actor_count}")
    forum_guard = forum_guard.replace(generic_actor, named_actor)
    deterministic = deterministic[:forum_start] + forum_guard + deterministic[forum_end:]

    deterministic = replace_once(
        deterministic,
        "const EXCLUSIVE_JURISDICTION_SUBMISSION_RE =\n  /(?:\\b(?:each|either|both|the)\\s+part(?:y|ies)\\b[^.]{0,120})?(?:irrevocably\\s+)?(?:submits?|consents?)\\s+to\\s+(?:the\\s+)?exclusive\\s+jurisdiction\\s+of[^.]{0,220}(?:courts?|County|State|Commonwealth|District|City)|\\bcourts?\\b[^.]{0,180}\\b(?:shall|will)\\s+have\\s+exclusive\\s+jurisdiction\\b|\\bcourts?\\b[^.]{0,180}\\bhaving\\s+exclusive\\s+jurisdiction\\b/i;",
        "const EXCLUSIVE_JURISDICTION_SUBMISSION_RE =\n  /(?:\\b(?:(?:each|either|both|the)\\s+part(?:y|ies)|Subcontractor|Prime(?:\\s+Contractor)?)\\b[^.]{0,120})?(?:irrevocably\\s+)?(?:submits?|consents?)\\s+to\\s+(?:the\\s+)?exclusive\\s+jurisdiction\\s+of[^.]{0,220}(?:courts?|County|State|Commonwealth|District|City)|\\bcourts?\\b[^.]{0,180}\\b(?:shall|will)\\s+have\\s+exclusive\\s+jurisdiction\\b|\\bcourts?\\b[^.]{0,180}\\bhaving\\s+exclusive\\s+jurisdiction\\b/i;",
        "named affirmative forum actor",
    )
    deterministic = replace_once(
        deterministic,
        "(?:(?:each|either|both|the)\\s+part(?:y|ies)\\s+)?(?:(?:hereby|irrevocably|expressly)\\s+)*",
        "(?:(?:(?:each|either|both|the)\\s+part(?:y|ies)|Subcontractor|Prime(?:\\s+Contractor)?)\\s+)?(?:(?:hereby|irrevocably|expressly)\\s+)*",
        "named forum clause splitter",
    )

    deterministic = replace_once(
        deterministic,
        "      const trimmed = segment.trim();\n      if (!trimmed || index === 0 || !COORDINATED_LICENSE_CONTINUATION_RE.test(trimmed)) {",
        "      const trimmed = segment.trim();\n      if (/^Subcontractor\\s+grants?\\b/i.test(trimmed)) {\n        return trimmed;\n      }\n      if (!trimmed || index === 0 || !COORDINATED_LICENSE_CONTINUATION_RE.test(trimmed)) {",
        "repeated-subject IP grant",
    )

    deterministic = replace_once(
        deterministic,
        "|\\s+(?:and|but)\\s+instead\\s+(?=(?:shall|will|must)\\s+be\\s+governed\\s+by\\s+the\\s+laws?\\s+of\\b)|\\s+(?:and|but)\\s+(?=(?:(?:this\\s+)?(?:Agreement|Subcontract|Contract)\\b",
        "|\\s+(?:and|but)\\s+instead\\s+(?=(?:shall|will|must)\\s+be\\s+governed\\s+by\\s+the\\s+laws?\\s+of\\b)|\\s+(?:and|but)\\s+(?=(?:shall|will|must)\\s+(?:not\\s+)?be\\s+governed\\s+by\\s+the\\s+laws?\\s+of\\b)|\\s+(?:and|but)\\s+(?=(?:(?:this\\s+)?(?:Agreement|Subcontract|Contract)\\b",
        "plain conjunction replacement law",
    )

    regression_block = r'''

const coordinatedPluralPaymentPreservation = productionPath(`
2.8 Invoice Requirements
Failure to submit a complete invoice within 30 calendar days waives the right to payment, except that Prime Contractor's and Subcontractor's rights to payment are not waived.
`);
check(
  "coordinated plural Prime and Subcontractor payment rights preserve the Subcontractor waiver",
  !coordinatedPluralPaymentPreservation.findings.some(
    (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
  )
);
const reverseCoordinatedPluralPaymentPreservation = productionPath(`
2.8 Invoice Requirements
Failure to submit a complete invoice within 30 calendar days waives the right to payment, except that Subcontractor's and Prime Contractor's rights to payment are not waived.
`);
check(
  "reverse coordinated plural payment rights preserve the Subcontractor waiver",
  !reverseCoordinatedPluralPaymentPreservation.findings.some(
    (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
  )
);
const primeOnlyPluralPaymentPreservation = productionPath(`
2.8 Invoice Requirements
Failure to submit a complete invoice within 30 calendar days waives the right to payment. Prime Contractor's rights to payment are not waived.
`);
check(
  "Prime-only plural payment preservation does not protect the Subcontractor waiver",
  primeOnlyPluralPaymentPreservation.findings.some(
    (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
  )
);

const namedSubcontractorForumRefusalOnly = productionPath(`
2.23 Dispute Resolution
Subcontractor refuses to consent to the exclusive jurisdiction of the courts in Fairfax County, Virginia.
`);
check(
  "named Subcontractor forum refusal remains clean",
  !namedSubcontractorForumRefusalOnly.findings.some(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  )
);
const namedForumRefusalThenConsent = productionPath(`
2.23 Dispute Resolution
Subcontractor refuses to consent to the exclusive jurisdiction of the courts in Fairfax County, Virginia and Subcontractor hereby irrevocably consents to the exclusive jurisdiction of the courts in Arlington County, Virginia.
`);
check(
  "named Subcontractor refusal does not hide a later named affirmative forum consent",
  namedForumRefusalThenConsent.findings.some(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  )
);

const affirmativeRepeatedSubjectIpGrant = productionPath(`
2.17 Improvements
Subcontractor grants Prime Contractor a royalty-free license to Improvements.
`);
check(
  "standalone repeated-subject IP grant remains detectable",
  affirmativeRepeatedSubjectIpGrant.findings.some(
    (finding) => finding.regulation === "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements"
  )
);
const repeatedSubjectIpRefusalOnly = productionPath(`
2.17 Improvements
Subcontractor refuses to grant Prime Contractor a royalty-free license to Adaptations.
`);
check(
  "standalone repeated-subject IP refusal remains clean",
  !repeatedSubjectIpRefusalOnly.findings.some(
    (finding) => finding.regulation === "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements"
  )
);
const repeatedSubjectRefusalThenGrant = productionPath(`
2.17 Improvements
Subcontractor refuses to grant Prime Contractor a royalty-free license to Adaptations and Subcontractor grants Prime Contractor a royalty-free license to Improvements.
`);
check(
  "repeated-subject refused Adaptations grant does not hide affirmative Improvements grant",
  repeatedSubjectRefusalThenGrant.findings.some(
    (finding) => finding.regulation === "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements"
  )
);

const plainAndReplacementGoverningLaw = productionPath(`
2.23 Governing Law
This Agreement shall not be governed by the laws of Virginia and shall be governed by the laws of Maryland.
`);
const plainAndReplacementLawFinding = plainAndReplacementGoverningLaw.findings.find(
  (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
);
check(
  "plain-and negated Virginia law does not hide replacement Maryland law",
  Boolean(plainAndReplacementLawFinding && /Maryland/i.test(plainAndReplacementLawFinding.foundText))
);
const plainButReplacementGoverningLaw = productionPath(`
2.23 Governing Law
This Agreement shall not be governed by the laws of Virginia but shall be governed by the laws of Maryland.
`);
const plainButReplacementLawFinding = plainButReplacementGoverningLaw.findings.find(
  (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
);
check(
  "plain-but negated Virginia law does not hide replacement Maryland law",
  Boolean(plainButReplacementLawFinding && /Maryland/i.test(plainButReplacementLawFinding.foundText))
);
const plainNegatedGoverningLawOnly = productionPath(`
2.23 Governing Law
This Agreement shall not be governed by the laws of Virginia.
`);
check(
  "plain negated governing-law clause remains clean",
  !plainNegatedGoverningLawOnly.findings.some(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  )
);
'''
    marker = "\nif (failures > 0) {"
    if regression_block.strip() in tests:
        raise RuntimeError("regression block already present")
    tests = replace_once(tests, marker, regression_block + marker, "Orion regression insertion")

    DETERMINISTIC_PATH.write_text(deterministic)
    TESTS_PATH.write_text(tests)
    print("Applied four PR107 fixes and 11 permanent Orion assertions.")


if __name__ == "__main__":
    main()
