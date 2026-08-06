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
        "const EXPLICIT_NON_SUBCONTRACTOR_INVOICE_DUTY_RE =\n  /\\b(?:Prime(?:\\s+Contractor)?|Government|Customer)(?:(?:'s|\\u2019s)\\s+failure\\s+to\\s+(?:submit|do\\s+so)|\\s+(?:(?:must|shall|should|will)\\s+submit|is\\s+required\\s+to\\s+submit|fails?\\s+to\\s+submit))\\b|\\binvoices?\\b[^.]{0,120}(?:(?:must|shall|should|will)\\s+be\\s+submitted|are\\s+required\\s+to\\s+be\\s+submitted)\\s+by\\s+(?:Prime(?:\\s+Contractor)?|Government|Customer)\\b/i;",
        "const EXPLICIT_NON_SUBCONTRACTOR_INVOICE_DUTY_RE =\n  /\\b(?:Prime(?:\\s+Contractor)?|Government|Customer)(?:(?:'s|\\u2019s)\\s+failure\\s+to\\s+(?:submit|do\\s+so)|\\s+(?:(?:must|shall|should|will)\\s+submit|is\\s+required\\s+to\\s+submit|fails?\\s+to\\s+submit))\\b|\\binvoices?\\b[^.]{0,120}(?:(?:must|shall|should|will)\\s+be\\s+submitted|are\\s+required\\s+to\\s+be\\s+submitted)\\s+by\\s+(?:Prime(?:\\s+Contractor)?|Government|Customer)\\b/i;\nconst EXPLICIT_SUBCONTRACTOR_INVOICE_DUTY_RE =\n  /\\bSubcontractor(?:(?:'s|\\u2019s)\\s+failure\\s+to\\s+(?:submit|do\\s+so)|\\s+(?:(?:must|shall|should|will)\\s+submit|is\\s+required\\s+to\\s+submit|fails?\\s+to\\s+submit))\\b|\\binvoices?\\b[^.]{0,160}(?:(?:must|shall|should|will)\\s+be\\s+submitted|are\\s+required\\s+to\\s+be\\s+submitted)\\s+by[^.]{0,120}\\bSubcontractor\\b/i;",
        "joint passive Subcontractor invoice duty evidence",
    )
    deterministic = replace_once(
        deterministic,
        "function invoiceSubmissionDutyTargetsSubcontractor(text: string): boolean {\n  return !EXPLICIT_NON_SUBCONTRACTOR_INVOICE_DUTY_RE.test(text);\n}",
        "function invoiceSubmissionDutyTargetsSubcontractor(text: string): boolean {\n  if (EXPLICIT_SUBCONTRACTOR_INVOICE_DUTY_RE.test(text)) return true;\n  return !EXPLICIT_NON_SUBCONTRACTOR_INVOICE_DUTY_RE.test(text);\n}",
        "joint passive invoice actor resolution",
    )

    sanity = replace_once(
        sanity,
        "  const explicitForumSelectionClaim =\n    /\\bforum\\s+(?:far|stated|required|selected)\\b|(?:requires?|must|shall|required\\s+to|permits?)[^.]{0,80}\\b(?:disputes?|actions?|lawsuits?|claims?|proceedings?)\\b[^.]{0,100}\\b(?:litigat(?:e|ed|ion)|brought)\\b|\\b(?:exclusive\\s+)?(?:venue|jurisdiction)\\b[^.]{0,100}\\b(?:required|selected|shall|must|will)\\b/i.test(affirmativeClaim) ||",
        "  const explicitForumSelectionClaim =\n    /\\bforum\\s+(?:far|stated|required|selected)\\b|(?:requires?|must|shall|required\\s+to|permits?)[^.]{0,80}\\b(?:disputes?|actions?|lawsuits?|claims?|proceedings?)\\b[^.]{0,100}\\b(?:litigat(?:e|ed|ion)|brought)\\b|\\b(?:imposes?|establishes?|mandates?|requires?|selects?|sets?)\\s+(?:(?:an?|the)\\s+)?(?:(?:exclusive|mandatory)\\s+)?(?:venue|forum|jurisdiction)\\b|\\b(?:exclusive|mandatory)\\s+(?:venue|forum|jurisdiction)\\b[^.]{0,100}\\b(?:in|at|within|required|selected|shall|must|will)\\b|\\b(?:exclusive\\s+)?(?:venue|jurisdiction)\\b[^.]{0,100}\\b(?:required|selected|shall|must|will)\\b/i.test(affirmativeClaim) ||",
        "common mandatory forum claim classifier",
    )

    sanity = replace_once(
        sanity,
        "  const primeImprovementUseClaim =\n    /\\bPrime(?:\\s+Contractor)?\\b[^.]{0,180}\\b(?:use|uses|using|license|licensed|receives?|retains?|may\\s+use|right\\s+to\\s+use)\\b[^.]{0,140}\\b(?:improvements?|adaptations?)\\b|\\b(?:improvements?|adaptations?)\\b[^.]{0,140}\\b(?:used|licensed)\\b[^.]{0,80}\\b(?:by|to)\\s+(?:the\\s+)?Prime(?:\\s+Contractor)?\\b/i.test(claim);",
        "  const primeImprovementUseClaim =\n    /\\bPrime(?:\\s+Contractor)?\\b[^.]{0,180}\\b(?:use|uses|using|license|licensed|receives?|retains?|obtains?|acquires?|is\\s+vested\\s+with|may\\s+use|right\\s+to\\s+use)\\b[^.]{0,140}\\b(?:improvements?|adaptations?)\\b|\\b(?:improvements?|adaptations?)\\b[^.]{0,140}\\b(?:used|licensed)\\b[^.]{0,80}\\b(?:by|to)\\s+(?:the\\s+)?Prime(?:\\s+Contractor)?\\b|\\b(?:royalty[\\s-]?free|free\\s+of\\s+charge|unpaid)\\s+rights?\\s+in\\s+(?:improvements?|adaptations?)\\b[^.]{0,120}\\b(?:vests?|accrues?|belongs?|are\\s+(?:granted|conveyed|assigned|transferred))\\s+(?:in|to)\\s+(?:the\\s+)?Prime(?:\\s+Contractor)?\\b/i.test(claim);",
        "common unpaid IP rights claim classifier",
    )

    regression_block = r'''

const jointPassiveSubcontractorInvoiceDuty = productionPath(`
2.8 Invoice Requirements
Invoices must be submitted by Prime Contractor and by Subcontractor within 30 calendar days; failure to do so waives Subcontractor's right to payment.
`);
check(
  "joint passive Prime and Subcontractor invoice duty preserves the Subcontractor waiver finding",
  jointPassiveSubcontractorInvoiceDuty.findings.some(
    (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
  )
);
const reverseJointPassiveSubcontractorInvoiceDuty = productionPath(`
2.8 Invoice Requirements
Invoices must be submitted by Subcontractor and by Prime Contractor within 30 calendar days; failure to do so waives Subcontractor's right to payment.
`);
check(
  "reverse-order joint passive invoice duty preserves the Subcontractor waiver finding",
  reverseJointPassiveSubcontractorInvoiceDuty.findings.some(
    (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
  )
);
const primeOnlyPassiveInvoiceDuty = productionPath(`
2.8 Invoice Requirements
Invoices must be submitted by Prime Contractor within 30 calendar days; failure to do so waives the right to payment.
`);
check(
  "Prime-only passive invoice duty remains excluded from Subcontractor payment-waiver findings",
  !primeOnlyPassiveInvoiceDuty.findings.some(
    (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
  )
);

const imposedExclusiveVenueAgainstLawOnly = forumSubtypeFinding(
  governingLawQuoteOnly,
  "This clause imposes exclusive venue in Fairfax County."
);
check(
  "governing-law evidence does not verify an imposed exclusive-venue claim",
  verifyFindings([imposedExclusiveVenueAgainstLawOnly], governingLawQuoteOnly).verified.length === 0
);
const imposedExclusiveVenueGrounded = forumSubtypeFinding(
  ArlingtonForumQuoteOnly,
  "This clause imposes exclusive venue in Arlington County, Virginia."
);
check(
  "imposed exclusive-venue analysis verifies against actual forum evidence",
  verifyFindings([imposedExclusiveVenueGrounded], ArlingtonForumQuoteOnly).verified.length === 1
);
const governingLawStillVerifiesAfterForumClassifierExpansion = forumSubtypeFinding(
  governingLawQuoteOnly,
  "This clause selects the governing law stated in the quote."
);
check(
  "forum-claim classifier expansion does not disturb grounded governing-law analysis",
  verifyFindings([governingLawStillVerifiesAfterForumClassifierExpansion], governingLawQuoteOnly).verified.length === 1
);

function unpaidIpFinding(foundText, riskAnalysis) {
  return {
    triggerType: "Contract Risk Trigger",
    regulation: "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements",
    severity: "High",
    foundText,
    riskAnalysis,
    redlineFix: "Confirm the actual Improvements license rights.",
  };
}

const preExistingToolsQuoteOnly = "Subcontractor retains ownership of its pre-existing tools and background materials.";
const inventedVestedRoyaltyFreeRights = unpaidIpFinding(
  preExistingToolsQuoteOnly,
  "Royalty-free rights in Improvements vest in Prime Contractor."
);
check(
  "pre-existing-tools evidence does not verify invented vested royalty-free Improvements rights",
  verifyFindings([inventedVestedRoyaltyFreeRights], preExistingToolsQuoteOnly).verified.length === 0
);
const royaltyFreeImprovementsGrantQuote = "Subcontractor grants Prime Contractor a royalty-free license to all Improvements.";
const groundedVestedRoyaltyFreeRights = unpaidIpFinding(
  royaltyFreeImprovementsGrantQuote,
  "Royalty-free rights in Improvements vest in Prime Contractor under the license stated in the quote."
);
check(
  "vested royalty-free Improvements analysis verifies against an actual royalty-free Prime license",
  verifyFindings([groundedVestedRoyaltyFreeRights], royaltyFreeImprovementsGrantQuote).verified.length === 1
);
const ordinaryPreExistingOwnershipFinding = unpaidIpFinding(
  preExistingToolsQuoteOnly,
  "Subcontractor retains ownership of its pre-existing tools."
);
check(
  "unpaid-IP claim classifier expansion does not disturb ordinary pre-existing ownership analysis",
  verifyFindings([ordinaryPreExistingOwnershipFinding], preExistingToolsQuoteOnly).verified.length === 1
);
'''

    marker = "\nif (failures > 0) {"
    if regression_block.strip() in tests:
        raise RuntimeError("regression block already present")
    tests = replace_once(tests, marker, regression_block + marker, "Orion regression insertion")

    DETERMINISTIC_PATH.write_text(deterministic)
    SANITY_PATH.write_text(sanity)
    TESTS_PATH.write_text(tests)
    print("Applied three PR107 fixes and 9 permanent Orion assertions.")


if __name__ == "__main__":
    main()
