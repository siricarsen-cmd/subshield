from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)


deterministic_path = Path("lib/analyzer/deterministic.ts")
deterministic = deterministic_path.read_text(encoding="utf-8")

old_analysis = '''function buildInvoicePaymentWaiverAnalysis(foundText: string): string {
  const deadline = /(?:within|no\\s+later\\s+than)\\s+(\\d{1,3}\\s*(?:calendar|business|working)?\\s*days?)/i.exec(foundText)?.[1];
  return `This clause makes a missed invoice-submission deadline${deadline ? ` of ${deadline}` : ""} waive or forfeit the Subcontractor's right to payment, creating a permanent payment-loss risk even when the underlying work was performed.`;
}'''
new_analysis = '''function invoicePaymentWaiverDeadline(foundText: string): string | undefined {
  const invoiceSentenceSafeText = foundText.replace(
    /\\binvoice\\s+no\\.\\s*(?=[A-Z0-9-]*\\d)/gi,
    "Invoice No "
  );
  const sentences = invoiceSentenceSafeText.split(/(?<=[.!?])\\s+/);
  const waiverIndex = invoiceWaiverSentenceIndexes(sentences).find(
    (index) => !invoiceWaiverIsPreserved(sentences, index)
  );
  if (waiverIndex === undefined) return undefined;

  const deadlinePattern = /(?:within|no\\s+later\\s+than)\\s+(\\d{1,3}\\s*(?:calendar|business|working)?\\s*days?)/i;
  return (
    deadlinePattern.exec(sentences[waiverIndex])?.[1] ??
    deadlinePattern.exec(sentences[waiverIndex - 1] ?? "")?.[1]
  );
}

function buildInvoicePaymentWaiverAnalysis(foundText: string): string {
  const deadline = invoicePaymentWaiverDeadline(foundText);
  return `This clause makes a missed invoice-submission deadline${deadline ? ` of ${deadline}` : ""} waive or forfeit the Subcontractor's right to payment, creating a permanent payment-loss risk even when the underlying work was performed.`;
}'''
deterministic = replace_once(
    deterministic,
    old_analysis,
    new_analysis,
    "invoice waiver analysis deadline",
)

old_forum = '''const DIRECT_MANDATORY_FORUM_RE =
  /(?:(?:(?:all|any)\\s+)?(?:actions?|lawsuits?|claims?|disputes?|proceedings?)|arbitration|mediation|court\\s+proceedings?)[^.]{0,180}(?:(?:must|shall|will)\\s+be|(?:is|are)\\s+required\\s+to\\s+be)\\s+(?:brought|filed)\\s+(?:exclusively\\s+)?in/i;'''
new_forum = '''const DIRECT_MANDATORY_FORUM_RE =
  /(?:(?:(?:all|any)\\s+)?(?:actions?|lawsuits?|claims?|disputes?|proceedings?)|arbitration|mediation|court\\s+proceedings?)[^.]{0,180}(?:(?:must|shall|will)\\s+be|(?:is|are)\\s+required\\s+to\\s+be)\\s+(?:brought|filed)\\s+(?:exclusively\\s+)?in\\s+(?:(?:the\\s+)?(?:(?:state|federal|county|municipal|district|circuit|superior|commonwealth)\\s+)?(?:courts?|forum)\\b|(?:[A-Za-z][A-Za-z.'-]*\\s+){0,5}(?:County|State|Commonwealth|District|City)\\b|(?:the\\s+)?(?:Commonwealth|State)\\s+of\\s+[A-Za-z][A-Za-z.'-]*\\b)/i;'''
deterministic = replace_once(
    deterministic,
    old_forum,
    new_forum,
    "direct mandatory forum location",
)

deterministic_path.write_text(deterministic, encoding="utf-8")

test_path = Path("lib/analyzer/__tests__/orion-parity-regression.test.mjs")
tests = test_path.read_text(encoding="utf-8")
marker = "if (failures > 0) {"
additions = '''const competingInvoiceDeadlines = productionPath(`
2.8 Invoice Requirements
Invoices must be submitted within 7 calendar days for routine processing. Failure to submit a complete invoice within 30 calendar days waives the right to payment.
`);
const competingDeadlineFinding = competingInvoiceDeadlines.findings.find(
  (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
);
check(
  "invoice waiver analysis uses the forfeiture deadline rather than an earlier ordinary deadline",
  Boolean(
    competingDeadlineFinding &&
      /30 calendar days/i.test(competingDeadlineFinding.riskAnalysis) &&
      !/7 calendar days/i.test(competingDeadlineFinding.riskAnalysis)
  ),
  competingDeadlineFinding?.riskAnalysis ?? "missing finding"
);

const filedInWritingClaim = productionPath(`
2.23 Claim Notice
Any claim must be filed in writing within three business days after the event giving rise to the claim.
`);
check(
  "filed-in-writing claim notice does not become mandatory forum evidence",
  !filedInWritingClaim.findings.some(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  )
);

const geographicMandatoryForum = productionPath(`
2.23 Venue
Any action shall be brought in Arlington County, Virginia.
`);
check(
  "geographic mandatory forum still triggers after location grounding",
  geographicMandatoryForum.findings.some(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  )
);

'''
tests = replace_once(tests, marker, additions + marker, "Orion test insertion marker")
test_path.write_text(tests, encoding="utf-8")
