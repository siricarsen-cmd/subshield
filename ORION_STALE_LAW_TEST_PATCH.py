from pathlib import Path
import re

path = Path("lib/analyzer/__tests__/orion-parity-regression.test.mjs")
text = path.read_text(encoding="utf-8")

pattern = re.compile(
    r'''const governingLawOnly = productionPath\(`\n2\.23 Governing Law\nThis subcontract is governed by the laws of the Commonwealth of Virginia\. The parties have not selected an exclusive venue or arbitration forum\.\n`\);\nconst lawOnly = governingLawOnly\.findings\.find\(\(finding\) => finding\.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"\);\ncheck\("governing-law-only text does not trigger venue finding", !lawOnly\);'''
)

replacement = '''const governingLawOnly = productionPath(`
2.23 Governing Law
This subcontract is governed by the laws of the Commonwealth of Virginia. The parties have not selected an exclusive venue or arbitration forum.
`);
const lawOnly = governingLawOnly.findings.find(
  (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
);
check("governing-law-only text triggers governing-law analysis", Boolean(lawOnly));
check(
  "governing-law-only analysis does not invent a required forum",
  Boolean(
    lawOnly &&
      /selects the governing law/i.test(lawOnly.riskAnalysis) &&
      !/requires or permits disputes/i.test(lawOnly.riskAnalysis)
  ),
  lawOnly?.riskAnalysis ?? "missing finding"
);'''

updated, count = pattern.subn(replacement, text)
if count != 1:
    raise SystemExit(f"Expected one stale governing-law assertion, found {count}")

path.write_text(updated, encoding="utf-8")
print("Updated the stale governing-law regression assertion.")
