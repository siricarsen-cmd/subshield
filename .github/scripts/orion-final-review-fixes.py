from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)


deterministic_path = Path("lib/analyzer/deterministic.ts")
deterministic = deterministic_path.read_text(encoding="utf-8")

deterministic = replace_once(
    deterministic,
    r"(?:all|any|the|such|stated|those|Subcontractor[\s-]created)",
    r"(?:all|any|the|such|stated|those|Subcontractor(?:['\u2019]s|[\s-](?:created|owned)))",
    "active Improvements object prefix",
)

deterministic = replace_once(
    deterministic,
    r'''  return /^\s*(?:[-–—:]\s*)?(?:is\s+)?$/i.test(betweenTitleAndStatus);''',
    r'''  return /^\s*(?:\([A-Z0-9][A-Z0-9&/.\s-]{0,30}\)\s*)?(?:,\s*(?:dated|effective|revision|rev\.?|version)\s+[A-Za-z0-9,./\s-]{1,50}\s*)?(?:[-–—:]\s*)?(?:is\s+)?$/i.test(
    betweenTitleAndStatus
  );''',
    "Attachment List title/status guard",
)

deterministic = replace_once(
    deterministic,
    r'''    .split(/\s*;\s*|,\s*(?:but|however|while|whereas)\s+/i)''',
    r'''    .split(
      /\s*;\s*|,\s*(?:but|however|while|whereas)\s+|\s+and\s+(?=(?:(?:all|any)\s+)?(?:actions?|lawsuits?|claims?|disputes?|proceedings?)\b[^.]{0,120}(?:(?:must|shall|will)\s+be|(?:is|are)\s+required\s+to\s+be)\s+(?:brought|filed)\b)/i
    )''',
    "forum clause splitter",
)

deterministic_path.write_text(deterministic, encoding="utf-8")

test_path = Path("lib/analyzer/__tests__/orion-parity-regression.test.mjs")
tests = test_path.read_text(encoding="utf-8")
marker = "if (failures > 0) {"
additions = '''for (const [label, clause] of [
  ["possessive Improvements grant", "Prime Contractor may use Subcontractor's Improvements without additional payment to Subcontractor."],
  ["curly possessive Improvements grant", "Prime Contractor may use Subcontractor’s Improvements without additional payment to Subcontractor."],
  ["owned Improvements grant", "Prime Contractor may use Subcontractor-owned Improvements without additional payment to Subcontractor."],
]) {
  const result = productionPath(`2.17 Improvements\n${clause}`);
  check(
    `${label}: genuine unpaid Prime use still triggers`,
    result.findings.some(
      (finding) => finding.regulation === "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements"
    )
  );
}

const plainAndOptionalThenMandatoryForum = productionPath(`
2.23 Venue
The parties may agree to venue in Fairfax County or another mutually convenient forum and any action shall be brought in Arlington County, Virginia.
`);
check(
  "plain-and optional forum does not hide later mandatory Arlington forum",
  plainAndOptionalThenMandatoryForum.findings.some(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  )
);

const detailedAttachmentRows = productionPath(`
5. Attachment List
1. Statement of Work (SOW) Not included.
2. Prime Contract Flow-Down Matrix, dated July 1 - Not provided.
6. Certifications
Subcontractor certifies that its representations remain current.
`);
const detailedAttachmentFinding = detailedAttachmentRows.findings.find(
  (finding) => finding.regulation === "Missing / Deferred Contract Documents"
);
check(
  "parenthetical and dated Attachment List rows remain in bounded evidence",
  Boolean(
    detailedAttachmentFinding &&
      /Statement of Work/i.test(detailedAttachmentFinding.foundText) &&
      /Flow-Down Matrix/i.test(detailedAttachmentFinding.foundText)
  ),
  detailedAttachmentFinding?.foundText ?? "missing finding"
);
check(
  "detailed Attachment List rows do not pull in the next peer section",
  Boolean(detailedAttachmentFinding && !/Certifications/i.test(detailedAttachmentFinding.foundText)),
  detailedAttachmentFinding?.foundText ?? "missing finding"
);

'''

tests = replace_once(tests, marker, additions + marker, "Orion test insertion marker")
test_path.write_text(tests, encoding="utf-8")
