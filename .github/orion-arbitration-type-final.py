from pathlib import Path


def replace_exact(path: str, old: str, new: str, expected_count: int = 1) -> None:
    file = Path(path)
    text = file.read_text()
    actual = text.count(old)
    if actual != expected_count:
        raise SystemExit(f"{path}: expected {expected_count} matches, found {actual}: {old[:120]}")
    file.write_text(text.replace(old, new))


# Add a dedicated, mandatory-only predicate for arbitration clauses that insert
# a bounded rules/administrator phrase between the settlement verb and the
# operative "by binding arbitration" language. Pair it with an equivalent
# negation predicate so reversed clauses remain excluded.
replace_exact(
    "lib/analyzer/deterministic.ts",
    "const BINDING_ARBITRATION_REQUIREMENT_RE =\n",
    "const RULE_QUALIFIED_MANDATORY_ARBITRATION_RE =\n"
    "  /\\b(?:disputes?|claims?|controvers(?:y|ies))\\b[^.]{0,180}(?:must|shall|will)\\s+be\\s+(?:finally\\s+)?(?:resolved|settled|decided)\\s+under\\s+(?:(?!\\b(?:may|might|option|elect|mutual\\s+agreement)\\b)[^.]){1,180}?\\b(?:Arbitration\\s+Rules|AAA|American\\s+Arbitration\\s+Association|JAMS)\\b(?:(?!\\b(?:may|might|option|elect|mutual\\s+agreement)\\b)[^.]){0,100}?\\bby\\s+(?:binding\\s+)?arbitration\\b/i;\n"
    "const NEGATED_RULE_QUALIFIED_MANDATORY_ARBITRATION_RE =\n"
    "  /\\b(?:disputes?|claims?|controvers(?:y|ies))\\b[^.]{0,180}(?:must|shall|will)\\s+not\\s+be\\s+(?:finally\\s+)?(?:resolved|settled|decided)\\s+under\\s+[^.]{1,180}?\\b(?:Arbitration\\s+Rules|AAA|American\\s+Arbitration\\s+Association|JAMS)\\b[^.]{0,100}?\\bby\\s+(?:binding\\s+)?arbitration\\b/i;\n"
    "const BINDING_ARBITRATION_REQUIREMENT_RE =\n",
)
replace_exact(
    "lib/analyzer/deterministic.ts",
    "      !NEGATED_MANDATORY_ARBITRATION_EVIDENCE_RE.test(clause) &&\n"
    "      (MANDATORY_ARBITRATION_EVIDENCE_RE.test(clause) ||\n"
    "        BINDING_ARBITRATION_REQUIREMENT_RE.test(clause))\n",
    "      !NEGATED_MANDATORY_ARBITRATION_EVIDENCE_RE.test(clause) &&\n"
    "      !NEGATED_RULE_QUALIFIED_MANDATORY_ARBITRATION_RE.test(clause) &&\n"
    "      (MANDATORY_ARBITRATION_EVIDENCE_RE.test(clause) ||\n"
    "        RULE_QUALIFIED_MANDATORY_ARBITRATION_RE.test(clause) ||\n"
    "        BINDING_ARBITRATION_REQUIREMENT_RE.test(clause))\n",
)

# A real separator is strong evidence that the document is supplying its own
# type. Preserve structurally valid labels outside the fallback vocabulary, but
# reject deferred, negated, or sentence-like values.
replace_exact(
    "lib/analyzer/anchors.ts",
    "const DEADLINE_PATTERN = /\\b(?:within|no\\s+later\\s+than|not\\s+to\\s+exceed)\\s+\\d{1,3}\\s*(?:calendar|business|working)?\\s*days?\\b[^.\\n]{0,90}/gi;\n",
    "const INVALID_EXPLICIT_TYPE_LABEL_RE =\n"
    "  /\\b(?:not|never|none|unknown|pending|tbd|will|shall|may|must|can|could|should|determined|negotiated|selected|specified|provided)\\b|\\bn\\s*\\/\\s*a\\b/i;\n"
    "const EXPLICIT_TYPE_LABEL_SHAPE_RE =\n"
    "  /^(?=.{2,100}$)[A-Za-z0-9][A-Za-z0-9&+/'(),.\\-\\s]*$/;\n\n"
    "function isValidExplicitTypeLabelCandidate(candidate: string): boolean {\n"
    "  const normalized = candidate.trim().replace(/\\s+/g, \" \" );\n"
    "  return (\n"
    "    EXPLICIT_TYPE_LABEL_SHAPE_RE.test(normalized) &&\n"
    "    /[A-Za-z]/.test(normalized) &&\n"
    "    !INVALID_EXPLICIT_TYPE_LABEL_RE.test(normalized)\n"
    "  );\n"
    "}\n\n"
    "const DEADLINE_PATTERN = /\\b(?:within|no\\s+later\\s+than|not\\s+to\\s+exceed)\\s+\\d{1,3}\\s*(?:calendar|business|working)?\\s*days?\\b[^.\\n]{0,90}/gi;\n",
)
replace_exact(
    "lib/analyzer/anchors.ts",
    "  const explicitTypeLabel =\n"
    "    explicitTypeLabelCandidate &&\n"
    "    (CONTRACT_TYPE_PATTERNS.some((pattern) => pattern.pattern.test(explicitTypeLabelCandidate)) ||\n"
    "      /^Hybrid(?:\\s+(?:subcontract|contract|agreement))?$/i.test(explicitTypeLabelCandidate))\n"
    "      ? explicitTypeLabelCandidate.trim()\n"
    "      : undefined;\n",
    "  const explicitTypeLabel =\n"
    "    explicitTypeLabelCandidate && isValidExplicitTypeLabelCandidate(explicitTypeLabelCandidate)\n"
    "      ? explicitTypeLabelCandidate.trim()\n"
    "      : undefined;\n",
)

# Add positive, negative, and mixed controls for both exact-head findings.
tests = Path("lib/analyzer/__tests__/orion-parity-regression.test.mjs")
text = tests.read_text()
marker = "if (failures > 0) {"
if text.count(marker) != 1:
    raise SystemExit("Orion test completion marker was not unique")
block = r'''

const ruleQualifiedMandatoryArbitration = productionPath(`
2.23 Dispute Resolution
All disputes shall be finally settled under the Commercial Arbitration Rules of the AAA by binding arbitration.
`);
check(
  "rule-qualified mandatory binding arbitration is detected",
  ruleQualifiedMandatoryArbitration.findings.some(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  )
);
const optionalRuleQualifiedArbitration = productionPath(`
2.23 Dispute Resolution
All disputes may be finally settled under the Commercial Arbitration Rules of the AAA by binding arbitration only by mutual written agreement.
`);
check(
  "optional rule-qualified arbitration remains clean",
  !optionalRuleQualifiedArbitration.findings.some(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  )
);
const negatedThenRuleQualifiedMandatoryArbitration = productionPath(`
2.23 Dispute Resolution
Invoice disputes shall not be finally settled under the Commercial Arbitration Rules of the AAA by binding arbitration, but intellectual-property claims shall be finally settled under the Commercial Arbitration Rules of the AAA by binding arbitration.
`);
check(
  "negated rule-qualified branch does not hide a later affirmative mandatory branch",
  negatedThenRuleQualifiedMandatoryArbitration.findings.some(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  )
);

const cpafExplicitType = extractAnchorCandidates(
  "Contract Type: Cost-Plus-Award-Fee (CPAF)",
  "cpaf-explicit-label.txt"
).subcontractType;
check(
  "explicit CPAF contract type is preserved outside the fallback allowlist",
  cpafExplicitType === "Cost-Plus-Award-Fee (CPAF)",
  `anchor=${cpafExplicitType ?? "missing"}`
);
const deferredExplicitType = extractAnchorCandidates(
  "Contract Type: to be determined after negotiations",
  "deferred-explicit-label.txt"
).subcontractType;
check(
  "deferred prose after an explicit type label is rejected",
  deferredExplicitType === undefined,
  `anchor=${deferredExplicitType ?? "missing"}`
);
const negatedProseThenCpafType = extractAnchorCandidates(
  "The contract type will not be Time-and-Materials.\nContract Type: Cost-Plus-Award-Fee (CPAF)",
  "mixed-explicit-label.txt"
).subcontractType;
check(
  "negated prose does not hide a later structurally valid CPAF label",
  negatedProseThenCpafType === "Cost-Plus-Award-Fee (CPAF)",
  `anchor=${negatedProseThenCpafType ?? "missing"}`
);

'''
tests.write_text(text.replace(marker, block + marker))
