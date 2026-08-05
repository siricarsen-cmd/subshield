from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)


deterministic_path = Path("lib/analyzer/deterministic.ts")
test_path = Path("lib/analyzer/__tests__/orion-parity-regression.test.mjs")

deterministic = deterministic_path.read_text(encoding="utf-8")
tests = test_path.read_text(encoding="utf-8")

old_passive_actor = r'''\s+(?:may|shall|will)\s+be\s+used\s+by\s+(?:Prime\s+Contractor\b(?!['\u2019]s\b)(?!\s+(?:customer|client|affiliate|agency|end[\s-]?user)\b)|Prime\b(?!['\u2019]s\b)(?!\s+Contractor\b)(?!\s+(?:customer|client|affiliate|agency|end[\s-]?user)\b))/i;'''
new_passive_actor = r'''\s+(?:may|shall|will)\s+be\s+used\s+by\s+(?:the\s+)?(?:Prime\s+Contractor\b(?!['\u2019]s\b)(?!\s+(?:customer|client|affiliate|agency|end[\s-]?user)\b)|Prime\b(?!['\u2019]s\b)(?!\s+Contractor\b)(?!\s+(?:customer|client|affiliate|agency|end[\s-]?user)\b))/i;'''
deterministic = replace_once(
    deterministic,
    old_passive_actor,
    new_passive_actor,
    "passive Prime actor article",
)

old_plain_and_split = r'''\s+and\s+(?=(?:(?:all|any)\s+)?(?:actions?|lawsuits?|claims?|disputes?|proceedings?)\b[^.]{0,120}(?:(?:must|shall|will)\s+be|(?:is|are)\s+required\s+to\s+be)\s+(?:brought|filed)\b)'''
new_plain_and_split = r'''\s+(?:and|but)\s+(?=(?:(?:all|any)\s+)?(?:actions?|lawsuits?|claims?|disputes?|proceedings?)\b[^.]{0,120}(?:(?:must|shall|will)\s+be|(?:is|are)\s+required\s+to\s+be)\s+(?:brought|filed)\b)'''
deterministic = replace_once(
    deterministic,
    old_plain_and_split,
    new_plain_and_split,
    "plain but forum branch split",
)

regressions = r'''
const definiteArticlePassivePrimeUse = productionPath(`
2.17 Improvements
Improvements may be used by the Prime Contractor without additional payment to Subcontractor.
`);
const definiteArticleIpFinding = definiteArticlePassivePrimeUse.findings.find(
  (finding) => finding.regulation === "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements"
);
check(
  "passive unpaid-use grant with the Prime Contractor triggers",
  Boolean(definiteArticleIpFinding)
);
check(
  "definite-article passive Prime-use analysis remains finding-local",
  Boolean(
    definiteArticleIpFinding &&
      verifyFindings([definiteArticleIpFinding], definiteArticleIpFinding.foundText).verified.length === 1
  )
);

const plainButOptionalThenMandatoryForum = productionPath(`
2.23 Venue
The parties may agree to venue in Fairfax County or another mutually convenient forum but any action shall be brought in Arlington County, Virginia.
`);
const plainButForumFinding = plainButOptionalThenMandatoryForum.findings.find(
  (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
);
check(
  "plain-but optional venue does not hide the later mandatory forum",
  Boolean(plainButForumFinding && /Arlington County/i.test(plainButForumFinding.foundText))
);
check(
  "plain-but mandatory forum analysis remains finding-local",
  Boolean(
    plainButForumFinding &&
      verifyFindings([plainButForumFinding], plainButForumFinding.foundText).verified.length === 1
  )
);

'''
marker = "if (failures > 0) {\n"
if tests.count(marker) != 1:
    raise SystemExit(f"test summary marker: expected one match, found {tests.count(marker)}")
tests = tests.replace(marker, regressions + marker, 1)

deterministic_path.write_text(deterministic, encoding="utf-8")
test_path.write_text(tests, encoding="utf-8")
print("Applied passive Prime actor and plain-but venue corrections.")
