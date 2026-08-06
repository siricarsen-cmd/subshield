from pathlib import Path


def replace_exact(path: str, old: str, new: str, expected_count: int = 1) -> None:
    file = Path(path)
    text = file.read_text()
    actual = text.count(old)
    if actual != expected_count:
        raise SystemExit(f"{path}: expected {expected_count} matches, found {actual}: {old[:140]}")
    file.write_text(text.replace(old, new))


# Classify ordinary mandatory subject-to-arbitration analysis before the generic
# forum-category fallback can accept unrelated governing-law evidence.
replace_exact(
    "lib/analyzer/sanity.ts",
    r"|\bbinding\s+arbitration\b[^.]{0,100}\b(?:required|mandatory|exclusive\s+(?:remedy|means|method|procedure))\b/i.test(affirmativeClaim);",
    r"|\bbinding\s+arbitration\b[^.]{0,100}\b(?:required|mandatory|exclusive\s+(?:remedy|means|method|procedure))\b|\b(?:disputes?|claims?|controvers(?:y|ies))\b[^.]{0,80}\b(?:is|are|shall|must|will)\s+(?:be\s+)?subject\s+to\s+(?:mandatory\s+)?(?:binding\s+)?arbitration\b/i.test(affirmativeClaim);",
)

# Iterate over explicit labels until the first structurally valid candidate is
# found instead of validating only the first textual occurrence.
replace_exact(
    "lib/analyzer/anchors.ts",
    "  const explicitTypeLabelCandidate =\n"
    "    firstMatch(text, EXPLICIT_TYPE_LABEL_WITH_SEPARATOR) ||\n"
    "    firstMatch(text, EXPLICIT_TYPE_LABEL_DIRECT);\n"
    "  const explicitTypeLabel =\n"
    "    explicitTypeLabelCandidate && isValidExplicitTypeLabelCandidate(explicitTypeLabelCandidate)\n"
    "      ? explicitTypeLabelCandidate.trim()\n"
    "      : undefined;\n",
    "  const explicitTypeLabelCandidate =\n"
    "    firstValidMatch(text, EXPLICIT_TYPE_LABEL_WITH_SEPARATOR, isValidExplicitTypeLabelCandidate) ||\n"
    "    firstValidMatch(text, EXPLICIT_TYPE_LABEL_DIRECT, isValidExplicitTypeLabelCandidate);\n"
    "  const explicitTypeLabel = explicitTypeLabelCandidate?.trim();\n",
)

tests = Path("lib/analyzer/__tests__/orion-parity-regression.test.mjs")
text = tests.read_text()
marker = "if (failures > 0) {"
if text.count(marker) != 1:
    raise SystemExit("Orion test completion marker was not unique")
block = r'''

const subjectToArbitrationAgainstLawOnly = forumSubtypeFinding(
  governingLawQuoteOnly,
  "All disputes are subject to binding arbitration."
);
check(
  "governing-law evidence does not verify an invented subject-to-arbitration claim",
  verifyFindings([subjectToArbitrationAgainstLawOnly], governingLawQuoteOnly).verified.length === 0
);
const subjectToArbitrationGroundedQuote = "All disputes shall be subject to binding arbitration.";
const subjectToArbitrationGrounded = forumSubtypeFinding(
  subjectToArbitrationGroundedQuote,
  "All disputes are subject to binding arbitration."
);
check(
  "subject-to-arbitration analysis verifies against actual mandatory arbitration evidence",
  verifyFindings([subjectToArbitrationGrounded], subjectToArbitrationGroundedQuote).verified.length === 1
);
const lawClaimStillVerifiesAfterSubjectToClassifier = forumSubtypeFinding(
  governingLawQuoteOnly,
  "This clause selects Virginia governing law."
);
check(
  "subject-to-arbitration classifier does not disturb grounded governing-law analysis",
  verifyFindings([lawClaimStillVerifiesAfterSubjectToClassifier], governingLawQuoteOnly).verified.length === 1
);

const invalidThenCpafExplicitType = extractAnchorCandidates(
  "Contract Type: TBD\nContract Type: Cost-Plus-Award-Fee (CPAF)",
  "invalid-then-cpaf-label.txt"
).subcontractType;
check(
  "explicit type extraction skips TBD and preserves the later CPAF label",
  invalidThenCpafExplicitType === "Cost-Plus-Award-Fee (CPAF)",
  `anchor=${invalidThenCpafExplicitType ?? "missing"}`
);
const onlyInvalidExplicitTypes = extractAnchorCandidates(
  "Contract Type: TBD\nSubcontract Type: to be determined after negotiations",
  "invalid-type-labels-only.txt"
).subcontractType;
check(
  "documents containing only invalid explicit type labels remain without a type anchor",
  onlyInvalidExplicitTypes === undefined,
  `anchor=${onlyInvalidExplicitTypes ?? "missing"}`
);
const firstValidExplicitTypeWins = extractAnchorCandidates(
  "Contract Type: TBD\nContract Type: Firm-Fixed-Price (FFP)\nContract Type: Cost-Plus-Award-Fee (CPAF)",
  "ordered-valid-type-labels.txt"
).subcontractType;
check(
  "explicit type extraction preserves the first valid label after invalid candidates",
  firstValidExplicitTypeWins === "Firm-Fixed-Price (FFP)",
  `anchor=${firstValidExplicitTypeWins ?? "missing"}`
);

'''
tests.write_text(text.replace(marker, block + marker))
