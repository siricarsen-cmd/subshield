from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)


deterministic_path = Path("lib/analyzer/deterministic.ts")
deterministic = deterministic_path.read_text()

old_binding = r'''const BINDING_ARBITRATION_REQUIREMENT_RE =
  /\b(?:disputes?|claims?|controvers(?:y|ies))\b[^.]{0,180}\bbinding\s+arbitration\b|\b(?:parties?|Subcontractor|Prime(?:\s+Contractor)?)\b[^.]{0,140}\b(?:agree|consent)\s+to\s+binding\s+arbitration\b|\bbinding\s+arbitration\b[^.]{0,120}\b(?:is|shall|must|will)\s+(?:required|mandatory|exclusive)\b/i;'''
new_binding = r'''const BINDING_ARBITRATION_REQUIREMENT_RE =
  /\b(?:disputes?|claims?|controvers(?:y|ies))\b[^.]{0,180}\bbinding\s+arbitration\b|\b(?:parties?|Subcontractor|Prime(?:\s+Contractor)?)\b[^.]{0,140}\b(?:agree|consent)\s+to\s+binding\s+arbitration\b|\bbinding\s+arbitration\b[^.]{0,120}(?:(?:is|shall|must|will)\s+(?:be\s+)?(?:required|mandatory)\b|(?:is|shall|must|will)\s+(?:be\s+)?(?:the\s+)?exclusive\s+(?:remedy|means|method|forum|procedure)\b)/i;'''
deterministic = replace_once(
    deterministic,
    old_binding,
    new_binding,
    "reverse-order binding-arbitration requirements",
)

old_negated = r'''const NEGATED_MANDATORY_ARBITRATION_EVIDENCE_RE =
  /\b(?:no|neither)\s+(?:disputes?|claims?|controvers(?:y|ies))\b[^.]{0,220}(?:binding\s+)?arbitration\b|\b(?:disputes?|claims?|controvers(?:y|ies))\b[^.]{0,180}(?:(?:must|shall|will)\s+not\s+be|(?:is|are)\s+not\s+required\s+to\s+be)\s+(?:resolved|settled|decided|submitted)\s+(?:exclusively\s+)?(?:by|through|to)\s+(?:binding\s+)?arbitration\b|\b(?:neither|no)\s+part(?:y|ies)\b[^.]{0,160}(?:agree|consent)\s+to\s+binding\s+arbitration\b/i;'''
new_negated = r'''const NEGATED_MANDATORY_ARBITRATION_EVIDENCE_RE =
  /\b(?:no|neither)\s+(?:disputes?|claims?|controvers(?:y|ies))\b[^.]{0,220}(?:binding\s+)?arbitration\b|\b(?:disputes?|claims?|controvers(?:y|ies))\b[^.]{0,180}(?:(?:must|shall|will)\s+not\s+be|(?:is|are)\s+not\s+required\s+to\s+be)\s+(?:resolved|settled|decided|submitted)\s+(?:exclusively\s+)?(?:by|through|to)\s+(?:binding\s+)?arbitration\b|\b(?:neither|no)\s+part(?:y|ies)\b[^.]{0,160}(?:agree|consent)\s+to\s+binding\s+arbitration\b|\b(?:no|neither)\s+binding\s+arbitration\b[^.]{0,160}(?:(?:is|shall|must|will)\s+(?:be\s+)?(?:required|mandatory)\b|(?:is|shall|must|will)\s+(?:be\s+)?(?:the\s+)?exclusive\s+(?:remedy|means|method|forum|procedure)\b)|\bbinding\s+arbitration\b[^.]{0,160}(?:is|shall|must|will)\s+not\s+(?:be\s+)?(?:(?:required|mandatory)\b|(?:the\s+)?exclusive\s+(?:remedy|means|method|forum|procedure)\b)/i;'''
deterministic = replace_once(
    deterministic,
    old_negated,
    new_negated,
    "reverse-order arbitration negation guards",
)

deterministic_path.write_text(deterministic)


test_path = Path("lib/analyzer/__tests__/orion-parity-regression.test.mjs")
tests = test_path.read_text()
marker = "\nif (failures > 0) {\n"
if tests.count(marker) != 1:
    raise SystemExit(f"test marker: expected one match, found {tests.count(marker)}")

additions = r'''

for (const [label, clause] of [
  ["required for disputes", "Binding arbitration shall be required for all disputes."],
  ["exclusive remedy", "Binding arbitration shall be the exclusive remedy for all claims."],
]) {
  const reverseOrderArbitration = productionPath(`
2.23 Dispute Resolution
${clause}
`);
  const reverseOrderFinding = reverseOrderArbitration.findings.find(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  );
  check(`${label}: reverse-order binding-arbitration mandate triggers`, Boolean(reverseOrderFinding));
  check(
    `${label}: reverse-order arbitration finding remains quote-local`,
    Boolean(
      reverseOrderFinding &&
        verifyFindings([reverseOrderFinding], reverseOrderFinding.foundText).verified.length === 1
    )
  );
}

for (const [label, clause] of [
  ["leading no", "No binding arbitration shall be required for disputes."],
  ["shall not", "Binding arbitration shall not be required for disputes."],
  ["not exclusive remedy", "Binding arbitration shall not be the exclusive remedy for claims."],
]) {
  const negatedReverseOrderArbitration = productionPath(`
2.23 Dispute Resolution
${clause}
`);
  check(
    `${label}: negated reverse-order binding arbitration remains clean`,
    !negatedReverseOrderArbitration.findings.some(
      (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
    )
  );
}

const mixedReverseOrderArbitration = productionPath(`
2.23 Dispute Resolution
No binding arbitration shall be required for disputes; binding arbitration shall be required for claims.
`);
check(
  "negated reverse-order branch does not hide a later affirmative arbitration mandate",
  mixedReverseOrderArbitration.findings.some(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  )
);
'''

test_path.write_text(tests.replace(marker, additions + marker, 1))
