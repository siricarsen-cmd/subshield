from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)


deterministic_path = Path("lib/analyzer/deterministic.ts")
deterministic = deterministic_path.read_text(encoding="utf-8")

old_deadline = '''  const latestDeadline = (sentence: string): string | undefined => {
    const matches = [
      ...sentence.matchAll(
        /(?:within|no\\s+later\\s+than)\\s+(\\d{1,3}\\s*(?:calendar|business|working)?\\s*days?)/gi
      ),
    ];
    return matches.at(-1)?.[1];
  };

  return latestDeadline(sentences[waiverIndex]) ?? latestDeadline(sentences[waiverIndex - 1] ?? "");'''
new_deadline = '''  const invoiceSubmissionDeadline = (sentence: string): string | undefined => {
    const deadlines = [
      ...sentence.matchAll(
        /(?:within|no\\s+later\\s+than)\\s+(\\d{1,3}\\s*(?:calendar|business|working)?\\s*days?)/gi
      ),
    ].filter((deadline) => {
      const prefix = sentence.slice(0, deadline.index ?? 0);
      const boundaries = [
        ...prefix.matchAll(/(?:;|,\\s*(?:and|but|while|whereas)\\s+|\\s+(?:and|but|while|whereas)\\s+)/gi),
      ];
      const lastBoundary = boundaries.at(-1);
      const localPrefix = lastBoundary
        ? prefix.slice((lastBoundary.index ?? 0) + lastBoundary[0].length)
        : prefix;
      return (
        /\\binvoices?\\b/i.test(localPrefix) &&
        /\\b(?:submit(?:ted|ting)?|submission)\\b/i.test(localPrefix)
      );
    });
    return deadlines.at(-1)?.[1];
  };

  return (
    invoiceSubmissionDeadline(sentences[waiverIndex]) ??
    invoiceSubmissionDeadline(sentences[waiverIndex - 1] ?? "")
  );'''
deterministic = replace_once(
    deterministic,
    old_deadline,
    new_deadline,
    "invoice submission deadline binding",
)

old_dispute = '''const GOVERNING_LAW_EVIDENCE_RE =
  /(?:governing\\s+law|governed\\s+by\\s+the\\s+laws\\s+of)[^.]{0,100}(?:State\\s+of|Commonwealth\\s+of)\\s+[A-Z][a-zA-Z]+/i;

function findVenueOrGoverningLawCandidate(documentText: string): string | null {
  return findClauseCandidate(documentText, hasMandatoryForumEvidence);
}

function buildVenueOrGoverningLawAnalysis(foundText: string): string {
  if (hasMandatoryForumEvidence(foundText)) {
    return "This clause requires or permits disputes to be litigated, mediated, or arbitrated in the forum stated in the quote, which can increase the cost and difficulty of pursuing or defending a claim for a Subcontractor located elsewhere.";
  }
  return "This clause selects the governing law stated in the quote. If that law differs from the Subcontractor's home jurisdiction, it can increase legal-review complexity, but the quote does not by itself establish a required litigation or arbitration venue.";
}'''
new_dispute = '''const GOVERNING_LAW_EVIDENCE_RE =
  /(?:\\bgoverned\\s+by\\s+the\\s+laws?\\s+of|\\bgoverning\\s+law\\s*(?::|[-–—])\\s*(?:the\\s+laws?\\s+of\\s+)?)(?:(?:the\\s+)?(?:State|Commonwealth)\\s+of\\s+)?[A-Z][A-Za-z]+(?:\\s+[A-Z][A-Za-z]+){0,2}/i;
const MANDATORY_ARBITRATION_EVIDENCE_RE =
  /\\b(?:disputes?|claims?|controvers(?:y|ies))\\b[^.]{0,180}(?:(?:must|shall|will)\\s+be|(?:is|are)\\s+required\\s+to\\s+be)\\s+(?:resolved|settled|decided|submitted)\\s+(?:exclusively\\s+)?(?:by|through|to)\\s+(?:binding\\s+)?arbitration\\b/i;

function hasMandatoryVenueOrArbitrationEvidence(text: string): boolean {
  return hasMandatoryForumEvidence(text) || MANDATORY_ARBITRATION_EVIDENCE_RE.test(text);
}

function findVenueOrGoverningLawCandidate(documentText: string): string | null {
  return findClauseCandidate(
    documentText,
    (block) =>
      hasMandatoryVenueOrArbitrationEvidence(block) || GOVERNING_LAW_EVIDENCE_RE.test(block)
  );
}

function buildVenueOrGoverningLawAnalysis(foundText: string): string {
  if (MANDATORY_ARBITRATION_EVIDENCE_RE.test(foundText)) {
    return "This clause requires disputes to be resolved through arbitration as stated in the quote, which can limit access to court and add arbitration-administration, forum, or travel costs.";
  }
  if (hasMandatoryForumEvidence(foundText)) {
    return "This clause requires or permits disputes to be litigated, mediated, or arbitrated in the forum stated in the quote, which can increase the cost and difficulty of pursuing or defending a claim for a Subcontractor located elsewhere.";
  }
  return "This clause selects the governing law stated in the quote. If that law differs from the Subcontractor's home jurisdiction, it can increase legal-review complexity, but the quote does not by itself establish a required litigation or arbitration venue.";
}'''
deterministic = replace_once(
    deterministic,
    old_dispute,
    new_dispute,
    "governing law and arbitration candidate preservation",
)

deterministic_path.write_text(deterministic, encoding="utf-8")

test_path = Path("lib/analyzer/__tests__/orion-parity-regression.test.mjs")
tests = test_path.read_text(encoding="utf-8")
marker = "if (failures > 0) {"
addition = '''const submissionDeadlineBeforePrimeReviewDeadline = productionPath(`
2.8 Invoice Requirements
Invoices must be submitted within 30 calendar days for payment eligibility, and Prime shall review invoices within 45 calendar days. Failure to do so waives the right to payment.
`);
const submissionDeadlineFinding = submissionDeadlineBeforePrimeReviewDeadline.findings.find(
  (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
);
check(
  "adjacent waiver analysis ignores a later Prime review deadline",
  Boolean(
    submissionDeadlineFinding &&
      /30 calendar days/i.test(submissionDeadlineFinding.riskAnalysis) &&
      !/45 calendar days/i.test(submissionDeadlineFinding.riskAnalysis)
  ),
  submissionDeadlineFinding?.riskAnalysis ?? "missing finding"
);

const governingLawOnlyClause = productionPath(`
2.23 Governing Law
This Agreement shall be governed by the laws of Virginia.
`);
check(
  "governing-law-only clause still produces the combined dispute-law finding",
  governingLawOnlyClause.findings.some(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  )
);

const mandatoryArbitrationWithoutBindingWord = productionPath(`
2.23 Dispute Resolution
All disputes shall be resolved exclusively through arbitration.
`);
check(
  "mandatory arbitration without the word binding still produces the dispute finding",
  mandatoryArbitrationWithoutBindingWord.findings.some(
    (finding) =>
      finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden" &&
      /requires disputes to be resolved through arbitration/i.test(finding.riskAnalysis)
  )
);

const permissiveArbitrationChoice = productionPath(`
2.23 Dispute Resolution
The parties may agree to resolve a dispute through arbitration.
`);
check(
  "permissive arbitration choice remains clean",
  !permissiveArbitrationChoice.findings.some(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  )
);

'''
tests = replace_once(tests, marker, addition + marker, "Orion regression insertion marker")
test_path.write_text(tests, encoding="utf-8")
