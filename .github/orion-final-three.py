from pathlib import Path


def replace_exact(path: str, old: str, new: str, expected_count: int = 1) -> None:
    file = Path(path)
    text = file.read_text()
    actual = text.count(old)
    if actual != expected_count:
        raise SystemExit(f"{path}: expected {expected_count} matches, found {actual}: {old[:160]}")
    file.write_text(text.replace(old, new))


# Governing-law evidence is evaluated clause-by-clause. Expand the local
# negation guard to ordinary pronoun and document-noun subjects without making
# a negated Virginia branch suppress a later affirmative Maryland branch.
replace_exact(
    "lib/analyzer/deterministic.ts",
    "const NEGATED_GOVERNING_LAW_EVIDENCE_RE =\n"
    "  /\\b(?:this\\s+)?(?:Agreement|Subcontract|Contract)\\b[^.]{0,100}(?:(?:shall|will|must)\\s+not\\s+be|is\\s+not)\\s+governed\\s+by\\s+the\\s+laws?\\s+of\\b|\\bgoverning\\s+law\\b[^.]{0,100}(?:(?:shall|will|must)\\s+not\\s+be|is\\s+not)\\b/i;\n",
    "const NEGATED_GOVERNING_LAW_EVIDENCE_RE =\n"
    "  /\\b(?:(?:(?:this|that|the)\\s+)?(?:Agreement|Subcontract|Contract|instrument|document)|it|this|that)\\b[^.;]{0,100}(?:(?:shall|will|must|may|can)\\s+not\\s+be|(?:is|are|was|were)\\s+not)\\s+governed\\s+by\\s+the\\s+laws?\\s+of\\b|\\b(?:(?:shall|will|must|may|can)\\s+not\\s+be|(?:is|are|was|were)\\s+not)\\s+governed\\s+by\\s+the\\s+laws?\\s+of\\b|\\bgoverning\\s+law\\b[^.;]{0,100}(?:(?:shall|will|must|may|can)\\s+not\\s+be|(?:is|are|was|were)\\s+not)\\b/i;\n",
)

# Evaluate generic payment-preservation language per coordinated branch. A
# Subcontractor payment right under a separate task order or agreement is not
# the payment right forfeited by the affected invoice clause.
replace_exact(
    "lib/analyzer/deterministic.ts",
    "const OTHER_INVOICE_SCOPE_RE = /\\b(?:other|unrelated|separate)\\s+invoices?\\b|\\brather\\s+than\\b/i;\n"
    "const PAYMENT_PRESERVATION_CONNECTOR_RE =\n",
    "const OTHER_INVOICE_SCOPE_RE = /\\b(?:other|unrelated|separate)\\s+invoices?\\b|\\brather\\s+than\\b/i;\n"
    "const UNRELATED_PAYMENT_RIGHT_SCOPE_RE =\n"
    "  /\\b(?:under|for|arising\\s+(?:under|from)|related\\s+to)\\s+(?:(?:a|the)\\s+)?(?:separate|other|unrelated|different)\\s+(?:Task\\s+Order(?:\\s+(?:No\\.?\\s*)?[A-Z0-9-]+)?|agreement|contract|subcontract|purchase\\s+order|invoice)\\b/i;\n"
    "const PAYMENT_PRESERVATION_BRANCH_SPLIT_RE =\n"
    "  /\\s*;\\s*|,\\s*(?:but|however|while|whereas)\\s+|\\s+(?:and|but)\\s+(?=(?:Subcontractor(?:'s|\\u2019s)?\\s+(?:rights?|entitlements?)\\s+to\\s+payment|(?:the\\s+)?(?:affected|subject|late|delayed)\\s+(?:invoice|amount|payment)\\b))/i;\n"
    "const PAYMENT_PRESERVATION_CONNECTOR_RE =\n",
)
replace_exact(
    "lib/analyzer/deterministic.ts",
    "  if (OTHER_INVOICE_SCOPE_RE.test(sentence)) return false;\n"
    "  const sameScopeExplicitPaymentPreservation =\n"
    "    EXPLICIT_PAYMENT_RIGHT_PRESERVED_RE.test(sentence) &&\n"
    "    (!PRIME_PAYMENT_RIGHT_PRESERVATION_RE.test(sentence) ||\n"
    "      SUBCONTRACTOR_PAYMENT_RIGHT_PRESERVATION_RE.test(sentence)) &&\n"
    "    (isWaiverSentenceScope ||\n"
    "      SAME_SCOPE_EXPLICIT_PAYMENT_CONTEXT_RE.test(sentence) ||\n"
    "      SUBCONTRACTOR_PAYMENT_RIGHT_PRESERVATION_RE.test(sentence));\n"
    "  const sameScopeBarePaymentPreservation =\n"
    "    BARE_PAYMENT_PRESERVED_RE.test(sentence) &&\n"
    "    SAME_SCOPE_BARE_PAYMENT_CONTEXT_RE.test(sentence);\n"
    "  return (\n"
    "    sameScopeExplicitPaymentPreservation ||\n"
    "    sameScopeBarePaymentPreservation ||\n"
    "    SAME_SCOPE_PAYMENT_REMAINS_RE.test(sentence) ||\n"
    "    ADJACENT_SAME_SCOPE_PAYMENT_REMAINS_RE.test(sentence)\n"
    "  );\n",
    "  return sentence\n"
    "    .split(PAYMENT_PRESERVATION_BRANCH_SPLIT_RE)\n"
    "    .map((branch) => branch.trim())\n"
    "    .filter(Boolean)\n"
    "    .some((branch) => {\n"
    "      if (OTHER_INVOICE_SCOPE_RE.test(branch)) return false;\n"
    "      if (UNRELATED_PAYMENT_RIGHT_SCOPE_RE.test(branch)) return false;\n"
    "      const sameScopeExplicitPaymentPreservation =\n"
    "        EXPLICIT_PAYMENT_RIGHT_PRESERVED_RE.test(branch) &&\n"
    "        (!PRIME_PAYMENT_RIGHT_PRESERVATION_RE.test(branch) ||\n"
    "          SUBCONTRACTOR_PAYMENT_RIGHT_PRESERVATION_RE.test(branch)) &&\n"
    "        (isWaiverSentenceScope ||\n"
    "          SAME_SCOPE_EXPLICIT_PAYMENT_CONTEXT_RE.test(branch) ||\n"
    "          SUBCONTRACTOR_PAYMENT_RIGHT_PRESERVATION_RE.test(branch));\n"
    "      const sameScopeBarePaymentPreservation =\n"
    "        BARE_PAYMENT_PRESERVED_RE.test(branch) &&\n"
    "        SAME_SCOPE_BARE_PAYMENT_CONTEXT_RE.test(branch);\n"
    "      return (\n"
    "        sameScopeExplicitPaymentPreservation ||\n"
    "        sameScopeBarePaymentPreservation ||\n"
    "        SAME_SCOPE_PAYMENT_REMAINS_RE.test(branch) ||\n"
    "        ADJACENT_SAME_SCOPE_PAYMENT_REMAINS_RE.test(branch)\n"
    "      );\n"
    "    });\n",
)

# Remove only the locally negated proposition from a finding's analysis. Stop
# before a coordinated affirmative clause so a later venue/arbitration claim is
# still classified and must be verified against its own quote.
replace_exact(
    "lib/analyzer/sanity.ts",
    "  const affirmativeClaim = claim.replace(\n"
    "    /\\b(?:does|do|did|is|are|was|were|shall|will|would|can|could|may|might)\\s+not\\b[^.]*\\.?/gi,\n"
    "    \" \"\n"
    "  );\n",
    "  const affirmativeClaim = claim.replace(\n"
    "    /\\b(?:does|do|did|is|are|was|were|shall|will|would|can|could|may|might)\\s+not\\b[^.;]*?(?=\\s*,\\s*(?:and|but|however|while|whereas)\\b|\\s+(?:and|but|however|while|whereas)\\b|[.;]|$)/gi,\n"
    "    \" \"\n"
    "  );\n",
)

# Add positive, negative, and mixed controls for all three exact-head findings.
tests = Path("lib/analyzer/__tests__/orion-parity-regression.test.mjs")
text = tests.read_text()
marker = "if (failures > 0) {"
if text.count(marker) != 1:
    raise SystemExit("Orion test completion marker was not unique")
block = r'''

const pronounNegatedGoverningLaw = productionPath(`
2.23 Governing Law
It shall not be governed by the laws of Virginia.
`);
check(
  "pronoun-subject negated governing law remains clean",
  !pronounNegatedGoverningLaw.findings.some(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  )
);
const ordinarySelectedGoverningLaw = productionPath(`
2.23 Governing Law
This Agreement shall be governed by the laws of Virginia.
`);
check(
  "ordinary affirmative governing-law selection remains detected",
  ordinarySelectedGoverningLaw.findings.some(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  )
);
const replacementGoverningLawAfterPronounNegation = productionPath(`
2.23 Governing Law
It shall not be governed by the laws of Virginia, but the Subcontract shall be governed by the laws of Maryland.
`);
check(
  "pronoun negation does not hide a later affirmative replacement governing law",
  replacementGoverningLawAfterPronounNegation.findings.some(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  )
);

const unrelatedTaskOrderPaymentSavings = productionPath(`
2.8 Invoice Requirements
Subcontractor shall submit each invoice within 30 calendar days. Failure to do so waives the Subcontractor's right to payment. Subcontractor's right to payment under separate Task Order 7 is not waived.
`);
check(
  "unrelated Task Order payment savings do not suppress the affected invoice waiver",
  unrelatedTaskOrderPaymentSavings.findings.some(
    (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
  )
);
const affectedInvoicePaymentSavings = productionPath(`
2.8 Invoice Requirements
Subcontractor shall submit each invoice within 30 calendar days. Failure to do so waives the Subcontractor's right to payment. Subcontractor's right to payment for the affected invoice is not waived.
`);
check(
  "affected-invoice payment savings still suppress permanent payment loss",
  !affectedInvoicePaymentSavings.findings.some(
    (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
  )
);
const mixedTaskOrderAndAffectedInvoiceSavings = productionPath(`
2.8 Invoice Requirements
Subcontractor shall submit each invoice within 30 calendar days. Failure to do so waives the Subcontractor's right to payment. Subcontractor's right to payment under separate Task Order 7 is not waived; however, Subcontractor's right to payment for the affected invoice is not waived.
`);
check(
  "unrelated Task Order savings do not hide a later affected-invoice preservation branch",
  !mixedTaskOrderAndAffectedInvoiceSavings.findings.some(
    (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
  )
);

const negatedLawThenInventedVenue = forumSubtypeFinding(
  governingLawQuoteOnly,
  "Virginia law does not govern, and exclusive venue is Fairfax County."
);
check(
  "negated governing-law prose does not hide an unsupported later venue claim",
  verifyFindings([negatedLawThenInventedVenue], governingLawQuoteOnly).verified.length === 0
);
const negatedLawThenGroundedVenue = forumSubtypeFinding(
  ArlingtonForumQuoteOnly,
  "Virginia law does not govern, and exclusive venue is Arlington County."
);
check(
  "later affirmative venue survives negated-law parsing when grounded by the quote",
  verifyFindings([negatedLawThenGroundedVenue], ArlingtonForumQuoteOnly).verified.length === 1
);
const groundedVenueThenNegatedLaw = forumSubtypeFinding(
  ArlingtonForumQuoteOnly,
  "Exclusive venue is Arlington County, but Virginia law does not govern."
);
check(
  "an affirmative venue before a negated-law branch remains classifiable and grounded",
  verifyFindings([groundedVenueThenNegatedLaw], ArlingtonForumQuoteOnly).verified.length === 1
);

'''
tests.write_text(text.replace(marker, block + marker))
