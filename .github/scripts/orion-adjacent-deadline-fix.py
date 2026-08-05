from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)


deterministic_path = Path("lib/analyzer/deterministic.ts")
deterministic = deterministic_path.read_text(encoding="utf-8")

old = '''  const deadlinePattern = /(?:within|no\\s+later\\s+than)\\s+(\\d{1,3}\\s*(?:calendar|business|working)?\\s*days?)/i;
  return (
    deadlinePattern.exec(sentences[waiverIndex])?.[1] ??
    deadlinePattern.exec(sentences[waiverIndex - 1] ?? "")?.[1]
  );'''
new = '''  const latestDeadline = (sentence: string): string | undefined => {
    const matches = [
      ...sentence.matchAll(
        /(?:within|no\\s+later\\s+than)\\s+(\\d{1,3}\\s*(?:calendar|business|working)?\\s*days?)/gi
      ),
    ];
    return matches.at(-1)?.[1];
  };

  return latestDeadline(sentences[waiverIndex]) ?? latestDeadline(sentences[waiverIndex - 1] ?? "");'''
deterministic = replace_once(deterministic, old, new, "invoice waiver deadline fallback")
deterministic_path.write_text(deterministic, encoding="utf-8")

test_path = Path("lib/analyzer/__tests__/orion-parity-regression.test.mjs")
tests = test_path.read_text(encoding="utf-8")
marker = "if (failures > 0) {"
addition = '''const adjacentCompetingInvoiceDeadlines = productionPath(`
2.8 Invoice Requirements
Invoices should be submitted within 7 calendar days for routine processing and complete invoices must be submitted no later than 30 calendar days. Failure to do so waives the right to payment.
`);
const adjacentCompetingDeadlineFinding = adjacentCompetingInvoiceDeadlines.findings.find(
  (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
);
check(
  "adjacent pronoun waiver analysis uses the final operative deadline from the referenced invoice sentence",
  Boolean(
    adjacentCompetingDeadlineFinding &&
      /30 calendar days/i.test(adjacentCompetingDeadlineFinding.riskAnalysis) &&
      !/7 calendar days/i.test(adjacentCompetingDeadlineFinding.riskAnalysis)
  ),
  adjacentCompetingDeadlineFinding?.riskAnalysis ?? "missing finding"
);

'''
tests = replace_once(tests, marker, addition + marker, "Orion test insertion marker")
test_path.write_text(tests, encoding="utf-8")
