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

old_deadline_logic = r'''  const latestDeadline = (sentence: string): string | undefined => {
    const matches = [
      ...sentence.matchAll(
        /(?:within|no\s+later\s+than)\s+(\d{1,3}\s*(?:calendar|business|working)?\s*days?)/gi
      ),
    ];
    return matches.at(-1)?.[1];
  };

  return latestDeadline(sentences[waiverIndex]) ?? latestDeadline(sentences[waiverIndex - 1] ?? "");
'''

new_deadline_logic = r'''  const latestDeadline = (sentence: string): string | undefined => {
    const matches = [
      ...sentence.matchAll(
        /(?:within|no\s+later\s+than)\s+(\d{1,3}\s*(?:calendar|business|working)?\s*days?)/gi
      ),
    ];
    return matches.at(-1)?.[1];
  };

  const latestInvoiceSubmissionDeadline = (sentence: string): string | undefined => {
    const matches = [
      ...sentence.matchAll(
        /(?:\binvoices?\b[^.]{0,120}(?:(?:must|shall|should)\s+be\s+submitted|are\s+required\s+to\s+be\s+submitted)|\b(?:Subcontractor\s+)?(?:must|shall|should|is\s+required\s+to)\s+submit\s+(?:a\s+|all\s+|complete\s+|timely\s+)*invoices?\b)[^.]{0,80}(?:within|no\s+later\s+than)\s+(\d{1,3}\s*(?:calendar|business|working)?\s*days?)/gi
      ),
    ];
    return matches.at(-1)?.[1];
  };

  return (
    latestDeadline(sentences[waiverIndex]) ??
    latestInvoiceSubmissionDeadline(sentences[waiverIndex - 1] ?? "")
  );
'''

deterministic = replace_once(
    deterministic,
    old_deadline_logic,
    new_deadline_logic,
    "invoice deadline grounding",
)

mandatory_marker = "const DIRECT_MANDATORY_FORUM_RE =\n"
mandatory_replacement = r'''const MANDATORY_ARBITRATION_RE =
  /(?:(?:(?:all|any)\s+)?(?:disputes?|claims?|controversies?)[^.]{0,120})?(?:must|shall|will)\s+(?:be\s+)?(?:resolved|decided|submitted)[^.]{0,80}(?:exclusively\s+)?(?:through|by|to)\s+(?:binding\s+)?arbitration/i;
const DIRECT_MANDATORY_FORUM_RE =
'''
deterministic = replace_once(
    deterministic,
    mandatory_marker,
    mandatory_replacement,
    "mandatory arbitration evidence",
)

old_forum_return = r'''    BASE_FORUM_EVIDENCE_RE.test(clause) ||
    DIRECT_MANDATORY_FORUM_RE.test(clause) ||
    EXCLUSIVE_FORUM_RE.test(clause)
'''
new_forum_return = r'''    BASE_FORUM_EVIDENCE_RE.test(clause) ||
    MANDATORY_ARBITRATION_RE.test(clause) ||
    DIRECT_MANDATORY_FORUM_RE.test(clause) ||
    EXCLUSIVE_FORUM_RE.test(clause)
'''
deterministic = replace_once(
    deterministic,
    old_forum_return,
    new_forum_return,
    "forum evidence predicate",
)

old_finder = r'''function findVenueOrGoverningLawCandidate(documentText: string): string | null {
  return findClauseCandidate(documentText, hasMandatoryForumEvidence);
}
'''
new_finder = r'''function findVenueOrGoverningLawCandidate(documentText: string): string | null {
  return findClauseCandidate(
    documentText,
    (block) => hasMandatoryForumEvidence(block) || GOVERNING_LAW_EVIDENCE_RE.test(block)
  );
}
'''
deterministic = replace_once(
    deterministic,
    old_finder,
    new_finder,
    "governing law candidate",
)

old_governing_test = r'''const governingLawOnly = productionPath(`
2.23 Governing Law
This subcontract is governed by the laws of the Commonwealth of Virginia. The parties have not selected an exclusive venue or arbitration forum.
`);
const lawOnly = governingLawOnly.findings.find((finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden");
check("governing-law-only text does not trigger venue finding", !lawOnly);
'''
new_governing_test = r'''const governingLawOnly = productionPath(`
2.23 Governing Law
This subcontract is governed by the laws of the Commonwealth of Virginia. The parties have not selected an exclusive venue or arbitration forum.
`);
const lawOnly = governingLawOnly.findings.find((finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden");
check("governing-law-only text triggers the governing-law category", Boolean(lawOnly));
check(
  "governing-law-only analysis does not invent a required forum",
  Boolean(
    lawOnly &&
      /selects the governing law/i.test(lawOnly.riskAnalysis) &&
      !/requires or permits disputes/i.test(lawOnly.riskAnalysis)
  ),
  lawOnly?.riskAnalysis ?? "missing finding"
);
'''
tests = replace_once(
    tests,
    old_governing_test,
    new_governing_test,
    "governing law regression",
)

final_tests = r'''
const adjacentSubmissionAndReviewDeadlines = productionPath(`
2.8 Invoice Requirements
Invoices must be submitted within 30 calendar days after the billing month, and Prime shall review invoices within 45 calendar days after receipt. Failure to do so waives the right to payment.
`);
const submissionDeadlineFinding = adjacentSubmissionAndReviewDeadlines.findings.find(
  (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
);
check(
  "adjacent waiver analysis ignores Prime's later invoice-review deadline",
  Boolean(
    submissionDeadlineFinding &&
      /30 calendar days/i.test(submissionDeadlineFinding.riskAnalysis) &&
      !/45 calendar days/i.test(submissionDeadlineFinding.riskAnalysis)
  ),
  submissionDeadlineFinding?.riskAnalysis ?? "missing finding"
);

const mandatoryArbitration = productionPath(`
2.23 Dispute Resolution
All disputes shall be resolved exclusively through arbitration.
`);
const mandatoryArbitrationFinding = mandatoryArbitration.findings.find(
  (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
);
check(
  "mandatory arbitration without the literal phrase binding arbitration triggers",
  Boolean(mandatoryArbitrationFinding)
);
check(
  "mandatory arbitration analysis remains finding-local",
  Boolean(
    mandatoryArbitrationFinding &&
      verifyFindings([mandatoryArbitrationFinding], mandatoryArbitrationFinding.foundText).verified.length === 1
  )
);

const optionalArbitration = productionPath(`
2.23 Dispute Resolution
The parties may mutually agree to resolve a dispute through arbitration.
`);
check(
  "optional arbitration language remains clean",
  !optionalArbitration.findings.some(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  )
);

'''
summary_marker = "if (failures > 0) {\n"
if summary_marker not in tests:
    raise SystemExit("test summary marker not found")
tests = tests.replace(summary_marker, final_tests + summary_marker, 1)

deterministic_path.write_text(deterministic, encoding="utf-8")
test_path.write_text(tests, encoding="utf-8")
print("Applied final invoice-submission and governing-law/arbitration corrections.")
