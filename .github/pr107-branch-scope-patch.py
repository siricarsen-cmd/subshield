from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)


deterministic_path = Path("lib/analyzer/deterministic.ts")
deterministic = deterministic_path.read_text()

old_indexes = r'''function invoiceWaiverSentenceIndexes(sentences: string[]): number[] {
  return sentences.flatMap((sentence, index) => {
    if (NEGATED_INVOICE_PAYMENT_WAIVER_RE.test(sentence)) return [];
    if (INVOICE_PAYMENT_WAIVER_RE.test(sentence)) return [index];
    if (
      INVOICE_PAYMENT_FORFEITURE_CONTEXT_RE.test(sentence) &&
      INVOICE_SUBMISSION_DEADLINE_RE.test(sentence)
    ) {
      return [index];
    }
    const carriesPriorInvoiceDeadline =
      INVOICE_PAYMENT_FORFEITURE_SENTENCE_RE.test(sentence) ||
      INVOICE_PAYMENT_FORFEITURE_CONTEXT_RE.test(sentence);
    if (
      carriesPriorInvoiceDeadline &&
      index > 0 &&
      INVOICE_SUBMISSION_DEADLINE_RE.test(sentences[index - 1])
    ) {
      return [index];
    }
    return [];
  });
}'''
new_indexes = r'''function stripNegatedInvoicePaymentWaiverBranches(sentence: string): string {
  let remaining = sentence;
  while (NEGATED_INVOICE_PAYMENT_WAIVER_RE.test(remaining)) {
    remaining = remaining.replace(NEGATED_INVOICE_PAYMENT_WAIVER_RE, " ");
  }
  return remaining;
}

function invoiceWaiverSentenceIndexes(sentences: string[]): number[] {
  return sentences.flatMap((sentence, index) => {
    const affirmativeScope = stripNegatedInvoicePaymentWaiverBranches(sentence);
    if (INVOICE_PAYMENT_WAIVER_RE.test(affirmativeScope)) return [index];
    if (
      INVOICE_PAYMENT_FORFEITURE_CONTEXT_RE.test(affirmativeScope) &&
      INVOICE_SUBMISSION_DEADLINE_RE.test(sentence)
    ) {
      return [index];
    }
    const carriesPriorInvoiceDeadline =
      INVOICE_PAYMENT_FORFEITURE_SENTENCE_RE.test(affirmativeScope) ||
      INVOICE_PAYMENT_FORFEITURE_CONTEXT_RE.test(affirmativeScope);
    if (
      carriesPriorInvoiceDeadline &&
      index > 0 &&
      INVOICE_SUBMISSION_DEADLINE_RE.test(sentences[index - 1])
    ) {
      return [index];
    }
    return [];
  });
}'''
deterministic = replace_once(
    deterministic,
    old_indexes,
    new_indexes,
    "branch-scoped invoice waiver negation",
)

old_non_royalty = r'''const NON_ROYALTY_FREE_IMPROVEMENT_LICENSE_RE =
  /\bnon[\s-]+royalty[\s-]?free\b|\broyalty[\s-]+bearing\b|\bsubject\s+to\s+(?:a\s+)?royalt(?:y|ies)\b/i;
'''
deterministic = replace_once(
    deterministic,
    old_non_royalty,
    "",
    "remove segment-wide paid-license exclusion",
)

old_unpaid_qualifier = r'''const WITHOUT_ADDITIONAL_PAYMENT_RE =
  /without\s+(?:additional\s+)?(?:payment|compensation|charge|fee)|royalty[\s-]?free|free\s+of\s+charge|at\s+no\s+(?:additional\s+)?(?:cost|charge|fee|expense)/i;'''
new_unpaid_qualifier = r'''const WITHOUT_ADDITIONAL_PAYMENT_RE =
  /without\s+(?:additional\s+)?(?:payment|compensation|charge|fee)|(?<!non-)(?<!non\s)royalty[\s-]?free|free\s+of\s+charge|at\s+no\s+(?:additional\s+)?(?:cost|charge|fee|expense)/i;'''
deterministic = replace_once(
    deterministic,
    old_unpaid_qualifier,
    new_unpaid_qualifier,
    "affirmative royalty-free qualifier",
)

old_grant_guard = r'''function primeImprovementsUseGrantWindow(segment: string): string | null {
  if (
    NEGATED_PRIME_IMPROVEMENT_LICENSE_RE.test(segment) ||
    NON_ROYALTY_FREE_IMPROVEMENT_LICENSE_RE.test(segment)
  ) {
    return null;
  }'''
new_grant_guard = r'''function primeImprovementsUseGrantWindow(segment: string): string | null {
  if (NEGATED_PRIME_IMPROVEMENT_LICENSE_RE.test(segment)) return null;'''
deterministic = replace_once(
    deterministic,
    old_grant_guard,
    new_grant_guard,
    "scope paid-license exclusion to affirmative grant",
)

old_forum_split = r'''      /\s*;\s*|,\s*(?:but|however|while|whereas)\s+|\s+(?:and|but)\s+(?=(?:(?:(?:all|any)\s+)?(?:actions?|lawsuits?|claims?|disputes?|proceedings?)\b[^.]{0,120}(?:(?:must|shall|will)\s+be|(?:is|are)\s+required\s+to\s+be)\s+(?:brought|filed)\b|(?:exclusive\s+)?(?:venue|jurisdiction)\s+(?:(?:must|shall|will)\s+be|is|lies)\s+(?:in|located\s+in)\b))/i'''
new_forum_split = r'''      /\s*;\s*|,\s*(?:but|however|while|whereas)\s+|\s+(?:and|but)\s+instead\s+(?=(?:irrevocably\s+)?(?:submits?|consents?)\s+to\s+(?:the\s+)?exclusive\s+jurisdiction\b)|\s+(?:and|but)\s+(?=(?:(?:(?:all|any)\s+)?(?:actions?|lawsuits?|claims?|disputes?|proceedings?)\b[^.]{0,120}(?:(?:must|shall|will)\s+be|(?:is|are)\s+required\s+to\s+be)\s+(?:brought|filed)\b|(?:exclusive\s+)?(?:venue|jurisdiction)\s+(?:(?:must|shall|will)\s+be|is|lies)\s+(?:in|located\s+in)\b))/i'''
deterministic = replace_once(
    deterministic,
    old_forum_split,
    new_forum_split,
    "split refusal from later affirmative forum consent",
)

deterministic_path.write_text(deterministic)


test_path = Path("lib/analyzer/__tests__/orion-parity-regression.test.mjs")
tests = test_path.read_text()
marker = "\nif (failures > 0) {\n"
if tests.count(marker) != 1:
    raise SystemExit(f"test marker: expected one match, found {tests.count(marker)}")

additions = r'''

const temporarySavingsThenUltimateWaiver = productionPath(`
2.8 Invoice Requirements
Failure to submit a complete invoice within 30 calendar days does not waive the right to payment during a 10-day cure period, but failure to do so after that period waives the right to payment.
`);
check(
  "temporary invoice savings do not hide a later ultimate payment waiver",
  temporarySavingsThenUltimateWaiver.findings.some(
    (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
  )
);

const pureNegatedInvoiceWaiverBranch = productionPath(`
2.8 Invoice Requirements
Failure to submit a complete invoice within 30 calendar days does not waive the right to payment during the cure period.
`);
check(
  "pure negated invoice-payment waiver remains clean after branch scoping",
  !pureNegatedInvoiceWaiverBranch.findings.some(
    (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
  )
);

const mixedPaidAndFreeImprovementLicenses = productionPath(`
2.17 Improvements
Subcontractor grants Prime Contractor a royalty-bearing license to Adaptations and a royalty-free license to Improvements.
`);
check(
  "paid Adaptations license does not hide a royalty-free Improvements license",
  mixedPaidAndFreeImprovementLicenses.findings.some(
    (finding) => finding.regulation === "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements"
  )
);

const nonRoyaltyFreeImprovementLicense = productionPath(`
2.17 Improvements
Subcontractor grants Prime Contractor a non-royalty-free license to Improvements.
`);
check(
  "non-royalty-free Improvements license remains clean without a segment-wide exclusion",
  !nonRoyaltyFreeImprovementLicense.findings.some(
    (finding) => finding.regulation === "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements"
  )
);

const competingFreeDeliverablesLicense = productionPath(`
2.17 Improvements
Subcontractor grants Prime Contractor a royalty-bearing license to Improvements and a royalty-free license to Deliverables.
`);
check(
  "royalty-free Deliverables license does not become an unpaid Improvements finding",
  !competingFreeDeliverablesLicense.findings.some(
    (finding) => finding.regulation === "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements"
  )
);

const refusalThenAffirmativeJurisdiction = productionPath(`
2.23 Dispute Resolution
Each party refuses to consent to exclusive jurisdiction in Fairfax County and instead irrevocably consents to exclusive jurisdiction of the courts located in Arlington County, Virginia.
`);
const refusalThenConsentFinding = refusalThenAffirmativeJurisdiction.findings.find(
  (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
);
check(
  "refusal of one forum does not hide a later affirmative exclusive-jurisdiction consent",
  Boolean(refusalThenConsentFinding && /Arlington County/i.test(refusalThenConsentFinding.foundText))
);
check(
  "later affirmative jurisdiction finding remains quote-local",
  Boolean(
    refusalThenConsentFinding &&
      verifyFindings([refusalThenConsentFinding], refusalThenConsentFinding.foundText).verified.length === 1
  )
);
'''

test_path.write_text(tests.replace(marker, additions + marker, 1))
