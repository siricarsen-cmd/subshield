from pathlib import Path

DETERMINISTIC_PATH = Path("lib/analyzer/deterministic.ts")
SANITY_PATH = Path("lib/analyzer/sanity.ts")
TESTS_PATH = Path("lib/analyzer/__tests__/orion-parity-regression.test.mjs")


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected 1 match, found {count}")
    return text.replace(old, new, 1)


def main() -> None:
    deterministic = DETERMINISTIC_PATH.read_text()
    sanity = SANITY_PATH.read_text()
    tests = TESTS_PATH.read_text()

    deterministic = replace_once(
        deterministic,
        "const EXPLICIT_NON_SUBCONTRACTOR_INVOICE_DUTY_RE =\n  /\\b(?:Prime(?:\\s+Contractor)?|Government|Customer)(?:(?:'s|\\u2019s)\\s+failure\\s+to\\s+(?:submit|do\\s+so)|\\s+(?:(?:must|shall|should|will)\\s+submit|is\\s+required\\s+to\\s+submit|fails?\\s+to\\s+submit))\\b|\\binvoices?\\b[^.]{0,120}(?:(?:must|shall|should|will)\\s+be\\s+submitted|are\\s+required\\s+to\\s+be\\s+submitted)\\s+by\\s+(?:Prime(?:\\s+Contractor)?|Government|Customer)\\b/i;\nconst EXPLICIT_SUBCONTRACTOR_INVOICE_DUTY_RE =\n  /\\bSubcontractor(?:(?:'s|\\u2019s)\\s+failure\\s+to\\s+(?:submit|do\\s+so)|\\s+(?:(?:must|shall|should|will)\\s+submit|is\\s+required\\s+to\\s+submit|fails?\\s+to\\s+submit))\\b|\\binvoices?\\b[^.]{0,160}(?:(?:must|shall|should|will)\\s+be\\s+submitted|are\\s+required\\s+to\\s+be\\s+submitted)\\s+by[^.]{0,120}\\bSubcontractor\\b/i;",
        "const EXPLICIT_NON_SUBCONTRACTOR_INVOICE_DUTY_RE =\n  /\\b(?:Prime(?:\\s+Contractor)?|Government|Customer)(?:(?:'s|\\u2019s)\\s+failure\\s+to\\s+(?:submit|do\\s+so)|\\s+(?:(?:must|shall|should|will)\\s+submit|is\\s+required\\s+to\\s+submit|fails?\\s+to\\s+submit))\\b|\\binvoices?\\b[^.]{0,120}(?:(?:must|shall|should|will)\\s+be\\s+submitted|are\\s+required\\s+to\\s+be\\s+submitted)(?:\\s+(?!(?:by|and|but|or)\\b)[A-Za-z][A-Za-z-]*){0,4}\\s+by\\s+(?:Prime(?:\\s+Contractor)?|Government|Customer)\\b/i;\nconst EXPLICIT_SUBCONTRACTOR_INVOICE_DUTY_RE =\n  /\\bSubcontractor(?:(?:'s|\\u2019s)\\s+failure\\s+to\\s+(?:submit|do\\s+so)|\\s+(?:(?:must|shall|should|will)\\s+submit|is\\s+required\\s+to\\s+submit|fails?\\s+to\\s+submit))\\b|\\binvoices?\\b[^.]{0,160}(?:(?:must|shall|should|will)\\s+be\\s+submitted|are\\s+required\\s+to\\s+be\\s+submitted)(?:\\s+(?!(?:by|and|but|or)\\b)[A-Za-z][A-Za-z-]*){0,4}\\s+by[^.]{0,120}\\bSubcontractor\\b/i;",
        "passive invoice submission qualifiers",
    )

    deterministic = replace_once(
        deterministic,
        "const DIRECT_PRIME_POSTFIX_UNPAID_IMPROVEMENT_LICENSE_RE =\n  /\\bSubcontractor\\b[^.]{0,100}\\bgrants?\\b(?:(?:(?!\\b(?:deliverables?|services?|work\\s+products?)\\b)[^.]){0,180})\\b(?:the\\s+)?Prime(?:\\s+Contractor)?\\b(?:(?:(?!\\b(?:deliverables?|services?|work\\s+products?)\\b)[^.]){0,160})\\blicense\\b(?:(?:(?!\\b(?:deliverables?|services?|work\\s+products?)\\b)[^.]){0,140})\\b(?:improvements?|adaptations?)\\b(?:(?:(?!\\b(?:deliverables?|services?|work\\s+products?|licenses?)\\b)[^.]){0,100})\\b(?:on\\s+(?:a\\s+)?royalty[\\s-]?free\\s+basis|royalty[\\s-]?free|free\\s+of\\s+charge|without\\s+(?:additional\\s+)?(?:payment|compensation|charge|fee)|at\\s+no\\s+(?:additional\\s+)?(?:cost|charge|fee|expense))\\b/i;\nconst WITHOUT_ADDITIONAL_PAYMENT_RE =",
        "const DIRECT_PRIME_POSTFIX_UNPAID_IMPROVEMENT_LICENSE_RE =\n  /\\bSubcontractor\\b[^.]{0,100}\\bgrants?\\b(?:(?:(?!\\b(?:deliverables?|services?|work\\s+products?)\\b)[^.]){0,180})\\b(?:the\\s+)?Prime(?:\\s+Contractor)?\\b(?:(?:(?!\\b(?:deliverables?|services?|work\\s+products?)\\b)[^.]){0,160})\\blicense\\b(?:(?:(?!\\b(?:deliverables?|services?|work\\s+products?)\\b)[^.]){0,140})\\b(?:improvements?|adaptations?)\\b(?:(?:(?!\\b(?:deliverables?|services?|work\\s+products?|licenses?)\\b)[^.]){0,100})\\b(?:on\\s+(?:a\\s+)?royalty[\\s-]?free\\s+basis|royalty[\\s-]?free|free\\s+of\\s+charge|without\\s+(?:additional\\s+)?(?:payment|compensation|charge|fee)|at\\s+no\\s+(?:additional\\s+)?(?:cost|charge|fee|expense))\\b/i;\nconst NEGATED_UNPAID_LICENSE_QUALIFIER_RE =\n  /\\blicense\\b[^.;]{0,140}\\b(?:is|are|was|were|shall|will|must)\\s+not\\s+(?:an?\\s+)?(?:royalty[\\s-]?free|free\\s+of\\s+charge|unpaid)\\b|\\bnot\\s+(?:an?\\s+)?(?:royalty[\\s-]?free|free\\s+of\\s+charge|unpaid)\\s+license\\b/i;\nconst WITHOUT_ADDITIONAL_PAYMENT_RE =",
        "determiner-separated unpaid-license negation",
    )
    deterministic = replace_once(
        deterministic,
        "function primeImprovementsUseGrantWindow(segment: string): string | null {\n  if (NEGATED_PRIME_IMPROVEMENT_LICENSE_RE.test(segment)) return null;\n  if (NEGATED_PASSIVE_PRIME_IMPROVEMENT_USE_RE.test(segment)) return null;",
        "function primeImprovementsUseGrantWindow(segment: string): string | null {\n  if (NEGATED_PRIME_IMPROVEMENT_LICENSE_RE.test(segment)) return null;\n  if (NEGATED_PASSIVE_PRIME_IMPROVEMENT_USE_RE.test(segment)) return null;\n  if (NEGATED_UNPAID_LICENSE_QUALIFIER_RE.test(segment)) return null;",
        "apply unpaid-license qualifier negation",
    )

    deterministic = replace_once(
        deterministic,
        "const MANDATORY_ARBITRATION_EVIDENCE_RE =\n  /\\b(?:disputes?|claims?|controvers(?:y|ies))\\b[^.]{0,180}(?:(?:must|shall|will)\\s+be|(?:is|are)\\s+required\\s+to\\s+be)\\s+(?:resolved|settled|decided|submitted)\\s+(?:exclusively\\s+)?(?:by|through|to)\\s+(?:binding\\s+)?arbitration\\b/i;",
        "const MANDATORY_ARBITRATION_EVIDENCE_RE =\n  /\\b(?:disputes?|claims?|controvers(?:y|ies))\\b[^.]{0,180}(?:(?:must|shall|will)\\s+be|(?:is|are)\\s+required\\s+to\\s+be)\\s+(?:resolved|settled|decided|submitted)\\s+(?:exclusively\\s+)?(?:by|through|to)\\s+(?:binding\\s+)?arbitration\\b|\\b(?:all\\s+)?(?:disputes?|claims?|controvers(?:y|ies))\\b[^.]{0,100}\\b(?:is|are)\\s+subject\\s+to\\s+mandatory\\s+(?:binding\\s+)?arbitration\\b/i;",
        "subject-to mandatory arbitration evidence",
    )
    deterministic = replace_once(
        deterministic,
        "|binding\\s+arbitration\\b[^.]{0,120}(?:is|shall|must|will)\\s+(?:be\\s+)?(?:(?:required|mandatory)\\b|(?:the\\s+)?exclusive\\s+(?:remedy|means|method|forum|procedure)\\b)))/i",
        "|binding\\s+arbitration\\b[^.]{0,120}(?:is|shall|must|will)\\s+(?:be\\s+)?(?:(?:required|mandatory)\\b|(?:the\\s+)?exclusive\\s+(?:remedy|means|method|forum|procedure)\\b)|(?:(?:all|any|the)\\s+)?(?:disputes?|claims?|controvers(?:y|ies))\\b[^.]{0,100}\\b(?:is|are)\\s+subject\\s+to\\s+mandatory\\s+(?:binding\\s+)?arbitration\\b))/i",
        "subject-to arbitration coordinated splitter",
    )

    sanity = replace_once(
        sanity,
        "|\\b(?:exclusive|mandatory)\\s+(?:venue|forum|jurisdiction)\\b[^.]{0,100}\\b(?:in|at|within|required|selected|shall|must|will)\\b|\\b(?:exclusive\\s+)?(?:venue|jurisdiction)\\b",
        "|\\b(?:exclusive|mandatory)\\s+(?:venue|forum|jurisdiction)\\s+(?:is|shall\\s+be|will\\s+be|must\\s+be)\\b|\\b(?:exclusive|mandatory)\\s+(?:venue|forum|jurisdiction)\\b[^.]{0,100}\\b(?:in|at|within|required|selected|shall|must|will)\\b|\\b(?:exclusive\\s+)?(?:venue|jurisdiction)\\b",
        "copular exclusive venue claim classifier",
    )
    sanity = replace_once(
        sanity,
        "(?:use|uses|using|license|licensed|receives?|retains?|obtains?|acquires?|is\\s+vested\\s+with|may\\s+use|right\\s+to\\s+use)",
        "(?:use|uses|using|license|licensed|receives?|retains?|obtains?|acquires?|owns?|holds?|possesses?|is\\s+assigned|is\\s+vested\\s+with|may\\s+use|right\\s+to\\s+use)",
        "Prime royalty-free ownership claim classifier",
    )

    regression_block = r'''

const primeElectronicPassiveInvoiceDuty = productionPath(`
2.8 Invoice Requirements
Invoices must be submitted electronically by Prime Contractor within 30 calendar days; failure to do so waives the right to payment.
`);
check(
  "Prime-only passive electronic invoice duty remains excluded from Subcontractor payment-waiver findings",
  !primeElectronicPassiveInvoiceDuty.findings.some(
    (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
  )
);
const subcontractorElectronicPassiveInvoiceDuty = productionPath(`
2.8 Invoice Requirements
Invoices must be submitted electronically by Subcontractor within 30 calendar days; failure to do so waives Subcontractor's right to payment.
`);
check(
  "Subcontractor passive electronic invoice duty preserves the payment-waiver finding",
  subcontractorElectronicPassiveInvoiceDuty.findings.some(
    (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
  )
);
const jointElectronicPassiveInvoiceDuty = productionPath(`
2.8 Invoice Requirements
Invoices must be submitted electronically by Prime Contractor and by Subcontractor within 30 calendar days; failure to do so waives Subcontractor's right to payment.
`);
check(
  "joint passive electronic invoice duty preserves the Subcontractor payment-waiver finding",
  jointElectronicPassiveInvoiceDuty.findings.some(
    (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
  )
);

const determinerSeparatedNegatedRoyaltyFreeLicense = productionPath(`
2.17 Improvements
Subcontractor grants Prime Contractor a license to Improvements that is not a royalty-free license and requires additional compensation.
`);
check(
  "determiner-separated not-a-royalty-free license remains clean",
  !determinerSeparatedNegatedRoyaltyFreeLicense.findings.some(
    (finding) => finding.regulation === "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements"
  )
);
const determinerSeparatedAffirmativeRoyaltyFreeLicense = productionPath(`
2.17 Improvements
Subcontractor grants Prime Contractor a license to Improvements that is a royalty-free license.
`);
check(
  "determiner-separated affirmative royalty-free Improvements license remains detectable",
  determinerSeparatedAffirmativeRoyaltyFreeLicense.findings.some(
    (finding) => finding.regulation === "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements"
  )
);
const negatedAdaptationsThenAffirmativeImprovementsLicense = productionPath(`
2.17 Improvements
Subcontractor grants Prime Contractor a license to Adaptations that is not a royalty-free license and Subcontractor grants Prime Contractor a royalty-free license to Improvements.
`);
check(
  "negated Adaptations qualifier does not hide a later affirmative royalty-free Improvements license",
  negatedAdaptationsThenAffirmativeImprovementsLicense.findings.some(
    (finding) => finding.regulation === "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements"
  )
);

const subjectToMandatoryBindingArbitration = productionPath(`
2.23 Dispute Resolution
All disputes are subject to mandatory binding arbitration.
`);
check(
  "subject-to mandatory binding arbitration remains detectable",
  subjectToMandatoryBindingArbitration.findings.some(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  )
);
const optionalSubjectToArbitration = productionPath(`
2.23 Dispute Resolution
All disputes may be subject to arbitration by mutual written agreement.
`);
check(
  "optional subject-to arbitration remains clean",
  !optionalSubjectToArbitration.findings.some(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  )
);
const negatedThenMandatorySubjectToArbitration = productionPath(`
2.23 Dispute Resolution
No invoice disputes are subject to mandatory binding arbitration, but all intellectual-property claims are subject to mandatory binding arbitration.
`);
check(
  "negated invoice arbitration does not hide a later subject-to mandatory IP arbitration branch",
  negatedThenMandatorySubjectToArbitration.findings.some(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  )
);

const copularExclusiveVenueAgainstLawOnly = forumSubtypeFinding(
  governingLawQuoteOnly,
  "Exclusive venue is Fairfax County."
);
check(
  "governing-law evidence does not verify a copular exclusive-venue claim",
  verifyFindings([copularExclusiveVenueAgainstLawOnly], governingLawQuoteOnly).verified.length === 0
);
const copularExclusiveVenueGrounded = forumSubtypeFinding(
  ArlingtonForumQuoteOnly,
  "Exclusive venue is Arlington County, Virginia."
);
check(
  "copular exclusive-venue analysis verifies against actual forum evidence",
  verifyFindings([copularExclusiveVenueGrounded], ArlingtonForumQuoteOnly).verified.length === 1
);
const lawClaimStillVerifiesAfterCopularVenueClassifier = forumSubtypeFinding(
  governingLawQuoteOnly,
  "This clause selects Virginia governing law."
);
check(
  "copular venue classifier does not disturb grounded governing-law analysis",
  verifyFindings([lawClaimStillVerifiesAfterCopularVenueClassifier], governingLawQuoteOnly).verified.length === 1
);

const inventedPrimeOwnershipOfRoyaltyFreeRights = unpaidIpFinding(
  preExistingToolsQuoteOnly,
  "Prime Contractor owns royalty-free rights in Improvements."
);
check(
  "pre-existing-tools evidence does not verify invented Prime ownership of royalty-free Improvements rights",
  verifyFindings([inventedPrimeOwnershipOfRoyaltyFreeRights], preExistingToolsQuoteOnly).verified.length === 0
);
const groundedPrimeOwnershipOfRoyaltyFreeRights = unpaidIpFinding(
  royaltyFreeImprovementsGrantQuote,
  "Prime Contractor owns royalty-free rights in Improvements under the license stated in the quote."
);
check(
  "Prime royalty-free Improvements ownership analysis verifies against an actual royalty-free Prime license",
  verifyFindings([groundedPrimeOwnershipOfRoyaltyFreeRights], royaltyFreeImprovementsGrantQuote).verified.length === 1
);
const ordinaryPreExistingOwnershipStillVerifies = unpaidIpFinding(
  preExistingToolsQuoteOnly,
  "Subcontractor owns its pre-existing tools and background materials."
);
check(
  "Prime ownership classifier expansion does not disturb ordinary Subcontractor pre-existing ownership analysis",
  verifyFindings([ordinaryPreExistingOwnershipStillVerifies], preExistingToolsQuoteOnly).verified.length === 1
);
'''

    marker = "\nif (failures > 0) {"
    if regression_block.strip() in tests:
        raise RuntimeError("regression block already present")
    tests = replace_once(tests, marker, regression_block + marker, "Orion regression insertion")

    DETERMINISTIC_PATH.write_text(deterministic)
    SANITY_PATH.write_text(sanity)
    TESTS_PATH.write_text(tests)
    print("Applied five PR107 fixes and 15 permanent Orion assertions.")


if __name__ == "__main__":
    main()
