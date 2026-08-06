from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)


deterministic_path = Path("lib/analyzer/deterministic.ts")
deterministic = deterministic_path.read_text()

old_binding = r'''const BINDING_ARBITRATION_REQUIREMENT_RE =
  /\b(?:disputes?|claims?|controvers(?:y|ies))\b[^.]{0,180}\bbinding\s+arbitration\b|\b(?:parties?|Subcontractor|Prime(?:\s+Contractor)?)\b[^.]{0,140}\b(?:agree|consent)\s+to\s+binding\s+arbitration\b|\bbinding\s+arbitration\b[^.]{0,120}(?:(?:is|shall|must|will)\s+(?:be\s+)?(?:required|mandatory)\b|(?:is|shall|must|will)\s+(?:be\s+)?(?:the\s+)?exclusive\s+(?:remedy|means|method|forum|procedure)\b)/i;'''
new_binding = r'''const BINDING_ARBITRATION_REQUIREMENT_RE =
  /\b(?:parties?|Subcontractor|Prime(?:\s+Contractor)?)\b[^.]{0,140}\b(?:agree|consent)\s+to\s+binding\s+arbitration\b|\bbinding\s+arbitration\b[^.]{0,120}(?:(?:is|shall|must|will)\s+(?:be\s+)?(?:required|mandatory)\b|(?:is|shall|must|will)\s+(?:be\s+)?(?:the\s+)?exclusive\s+(?:remedy|means|method|forum|procedure)\b)/i;'''
deterministic = replace_once(
    deterministic,
    old_binding,
    new_binding,
    "require an affirmative arbitration mandate",
)

old_split = r'''      /(?<=[.!?])\s+|\s*;\s*|,\s*(?:but|however|while|whereas)\s+|\s+(?:and|but)\s+(?=(?:(?:all|any|the)\s+)?(?:disputes?|claims?|controvers(?:y|ies))\b[^.]{0,120}(?:(?:must|shall|will)\s+be|(?:is|are)\s+required\s+to\s+be))/i'''
new_split = r'''      /(?<=[.!?])\s+|\s*;\s*|,\s*(?:but|however|while|whereas)\s+|\s+(?:and|but)\s+(?=(?:(?:(?:all|any|the)\s+)?(?:disputes?|claims?|controvers(?:y|ies))\b[^.]{0,120}(?:(?:must|shall|will)\s+be|(?:is|are)\s+required\s+to\s+be)|binding\s+arbitration\b[^.]{0,120}(?:is|shall|must|will)\s+(?:be\s+)?(?:(?:required|mandatory)\b|(?:the\s+)?exclusive\s+(?:remedy|means|method|forum|procedure)\b)))/i'''
deterministic = replace_once(
    deterministic,
    old_split,
    new_split,
    "split coordinated reverse-order arbitration branches",
)

deterministic_path.write_text(deterministic)


test_path = Path("lib/analyzer/__tests__/orion-parity-regression.test.mjs")
tests = test_path.read_text()
marker = "\nif (failures > 0) {\n"
if tests.count(marker) != 1:
    raise SystemExit(f"test marker: expected one match, found {tests.count(marker)}")

additions = r'''

const optionalMutualArbitration = productionPath(`
2.23 Dispute Resolution
Disputes may, by mutual written agreement, be submitted to binding arbitration.
`);
check(
  "optional mutual-agreement arbitration remains clean",
  !optionalMutualArbitration.findings.some(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  )
);

const mandatoryArbitrationAfterOptionalGuard = productionPath(`
2.23 Dispute Resolution
All disputes shall be resolved through binding arbitration.
`);
const mandatoryArbitrationAfterOptionalFinding = mandatoryArbitrationAfterOptionalGuard.findings.find(
  (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
);
check(
  "mandatory arbitration still triggers after optional-arbitration guard",
  Boolean(mandatoryArbitrationAfterOptionalFinding)
);
check(
  "mandatory arbitration remains quote-local after optional-arbitration guard",
  Boolean(
    mandatoryArbitrationAfterOptionalFinding &&
      verifyFindings(
        [mandatoryArbitrationAfterOptionalFinding],
        mandatoryArbitrationAfterOptionalFinding.foundText
      ).verified.length === 1
  )
);

const coordinatedReverseOrderArbitration = productionPath(`
2.23 Dispute Resolution
No disputes arising from invoices shall be resolved by binding arbitration and binding arbitration shall be required for intellectual-property claims.
`);
check(
  "negated invoice-dispute arbitration does not hide later reverse-order IP arbitration mandate",
  coordinatedReverseOrderArbitration.findings.some(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  )
);

const coordinatedNegatedReverseOrderArbitration = productionPath(`
2.23 Dispute Resolution
No disputes arising from invoices shall be resolved by binding arbitration and binding arbitration shall not be required for intellectual-property claims.
`);
check(
  "coordinated negated arbitration branches remain clean",
  !coordinatedNegatedReverseOrderArbitration.findings.some(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  )
);
'''

test_path.write_text(tests.replace(marker, additions + marker, 1))
