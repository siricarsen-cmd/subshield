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

old_invoice_deadline = r'''  /(?:\binvoices?\b[^.]{0,120}(?:(?:must|shall|should)\s+be\s+submitted|are\s+required\s+to\s+be\s+submitted)|\b(?:must|shall|should|is\s+required\s+to)\s+submit\s+(?:a\s+|all\s+|complete\s+|timely\s+)*invoices?\b)[^.]{0,80}(?:within|no\s+later\s+than)\s+\d{1,3}\s*(?:calendar|business|working)?\s*days?/i;'''
new_invoice_deadline = r'''  /(?:\binvoices?\b[^.]{0,120}(?:(?:must|shall|should)\s+be\s+submitted|are\s+required\s+to\s+be\s+submitted)|\b(?:must|shall|should|is\s+required\s+to)\s+submit\s+(?:(?:a|all|the|complete|timely|monthly|proper|final|correct|accurate|valid|itemized|detailed|supported|compliant|periodic|interim|recurring|certified|acceptable)\s+)*invoices?\b)[^.]{0,80}(?:within|no\s+later\s+than)\s+\d{1,3}\s*(?:calendar|business|working)?\s*days?/i;'''
deterministic = replace_once(
    deterministic,
    old_invoice_deadline,
    new_invoice_deadline,
    "described active invoice deadline",
)

old_actor_guard = r'''(?!\s+(?:customer|client|affiliate|agency|end[\s-]?user)\b)'''
new_actor_guard = r'''(?![\s-]+(?:customers?|clients?|affiliates?|agenc(?:y|ies)|end[\s-]?users?|affiliated(?:[\s-]+entities?)?)\b)'''
actor_count = deterministic.count(old_actor_guard)
if actor_count != 4:
    raise SystemExit(f"Prime third-party actor guard: expected four matches, found {actor_count}")
deterministic = deterministic.replace(old_actor_guard, new_actor_guard)

old_forum_split = r'''/\s*;\s*|,\s*(?:but|however|while|whereas)\s+|\s+(?:and|but)\s+(?=(?:(?:all|any)\s+)?(?:actions?|lawsuits?|claims?|disputes?|proceedings?)\b[^.]{0,120}(?:(?:must|shall|will)\s+be|(?:is|are)\s+required\s+to\s+be)\s+(?:brought|filed)\b)/i'''
new_forum_split = r'''/\s*;\s*|,\s*(?:but|however|while|whereas)\s+|\s+(?:and|but)\s+(?=(?:(?:(?:all|any)\s+)?(?:actions?|lawsuits?|claims?|disputes?|proceedings?)\b[^.]{0,120}(?:(?:must|shall|will)\s+be|(?:is|are)\s+required\s+to\s+be)\s+(?:brought|filed)\b|(?:exclusive\s+)?(?:venue|jurisdiction)\s+(?:(?:must|shall|will)\s+be|is|lies)\s+(?:in|located\s+in)\b))/i'''
deterministic = replace_once(
    deterministic,
    old_forum_split,
    new_forum_split,
    "mandatory venue noun branch split",
)

regressions = r'''
for (const descriptor of ["monthly", "proper", "final"]) {
  const describedInvoiceDeadline = productionPath(`
2.8 Invoice Requirements
Subcontractor shall submit ${descriptor} invoices within 30 calendar days. Failure to do so waives the right to payment.
`);
  const describedInvoiceFinding = describedInvoiceDeadline.findings.find(
    (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
  );
  check(
    `${descriptor} invoice descriptor preserves adjacent pronoun-waiver detection`,
    Boolean(
      describedInvoiceFinding &&
        /30 calendar days/i.test(describedInvoiceFinding.riskAnalysis)
    ),
    describedInvoiceFinding?.riskAnalysis ?? "missing finding"
  );
}

for (const thirdPartyActor of [
  "Prime Contractor affiliates",
  "Prime Contractor customers",
  "Prime Contractor-affiliated entities",
]) {
  const thirdPartyPassiveUse = productionPath(`
2.17 Improvements
Improvements may be used by ${thirdPartyActor} without additional payment to Subcontractor.
`);
  check(
    `${thirdPartyActor}: passive third-party use does not become direct Prime use`,
    !thirdPartyPassiveUse.findings.some(
      (finding) => finding.regulation === "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements"
    )
  );
}

for (const clause of [
  "The parties may agree to venue in Fairfax County or another mutually convenient forum and venue shall be in Arlington County, Virginia.",
  "The parties may agree to jurisdiction in Fairfax County or another mutually convenient forum but jurisdiction must be located in Arlington County, Virginia.",
]) {
  const mandatoryVenueNounBranch = productionPath(`
2.23 Venue
${clause}
`);
  const mandatoryVenueNounFinding = mandatoryVenueNounBranch.findings.find(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  );
  check(
    "optional forum language does not hide a mandatory venue/jurisdiction noun branch",
    Boolean(mandatoryVenueNounFinding && /Arlington County/i.test(mandatoryVenueNounFinding.foundText)),
    mandatoryVenueNounFinding?.foundText ?? "missing finding"
  );
  check(
    "mandatory venue/jurisdiction noun analysis remains finding-local",
    Boolean(
      mandatoryVenueNounFinding &&
        verifyFindings([mandatoryVenueNounFinding], mandatoryVenueNounFinding.foundText).verified.length === 1
    )
  );
}

'''
marker = "if (failures > 0) {\n"
if tests.count(marker) != 1:
    raise SystemExit(f"test summary marker: expected one match, found {tests.count(marker)}")
tests = tests.replace(marker, regressions + marker, 1)

deterministic_path.write_text(deterministic, encoding="utf-8")
test_path.write_text(tests, encoding="utf-8")
print("Applied final described-invoice, Prime-third-party, and venue-branch corrections.")
