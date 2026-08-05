from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)


sanity_path = Path("lib/analyzer/sanity.ts")
deterministic_path = Path("lib/analyzer/deterministic.ts")
test_path = Path("lib/analyzer/__tests__/orion-parity-regression.test.mjs")

sanity = sanity_path.read_text(encoding="utf-8")
deterministic = deterministic_path.read_text(encoding="utf-8")
tests = test_path.read_text(encoding="utf-8")

old_forum_guard = r'''  const forumBurdenClaim =
    /litigat|arbitrat|forum\s+(?:far|stated|required)|must\s+be\s+brought|filed\s+in/i.test(claim);
  const forumBurdenEvidence = hasVenueGoverningLawOrArbitrationEvidence(quote);
  if (forumBurdenClaim && !forumBurdenEvidence) {
    return "Finding's analysis claims a litigation, arbitration, or forum requirement that is not stated in the finding's own verified quote.";
  }
'''
new_forum_guard = r'''  const forumSelectionCategory =
    /out-of-state\s+venue|governing\s+law|arbitration\s+burden/i.test(reg);
  const explicitForumSelectionClaim =
    /forum\s+(?:far|stated|required)|must\s+be\s+brought|filed\s+in|(?:must|shall|required\s+to)\s+(?:litigate|arbitrate)/i.test(claim);
  const forumBurdenClaim = forumSelectionCategory || explicitForumSelectionClaim;
  const forumBurdenEvidence = hasVenueGoverningLawOrArbitrationEvidence(quote);
  if (forumBurdenClaim && !forumBurdenEvidence) {
    return "Finding's analysis claims a litigation, arbitration, or forum requirement that is not stated in the finding's own verified quote.";
  }
'''
sanity = replace_once(sanity, old_forum_guard, new_forum_guard, "forum-selection sanity guard")

old_named_branch = "  if (preservedInvoiceIds.length > 0) {\n"
new_named_branch = "  if (preservedInvoiceIds.length > 0 && waivedInvoiceIds.length > 0) {\n"
deterministic = replace_once(
    deterministic,
    old_named_branch,
    new_named_branch,
    "generic preservation fallthrough",
)

regressions = r'''
const arbitrationCostQuote =
  "Subcontractor shall pay all AAA filing fees and arbitrator compensation.";
const arbitrationCostFinding = {
  triggerType: "Contract Risk Trigger",
  regulation: "Arbitration Fee Allocation",
  severity: "Medium-High",
  foundText: arbitrationCostQuote,
  riskAnalysis:
    "This clause assigns all AAA filing fees and arbitrator compensation to the Subcontractor, creating direct dispute-resolution expense exposure.",
  redlineFix:
    "Allocate filing fees and arbitrator compensation equitably or as determined by the arbitrator.",
};
check(
  "grounded arbitration-cost allocation survives the forum-selection sanity guard",
  verifyFindings([arbitrationCostFinding], arbitrationCostQuote).verified.length === 1,
  verifyFindings([arbitrationCostFinding], arbitrationCostQuote).dropped
    .map(({ reason }) => reason)
    .join(" | ")
);

const genericPreservationWithIncidentalInvoiceId = productionPath(`
2.8 Invoice Requirements
Failure to submit a complete invoice within 30 calendar days waives the right to payment. Invoice 104 remains disputed; however, the affected amount remains payable.
`);
check(
  "incidental invoice number does not block generic affected-amount preservation",
  !genericPreservationWithIncidentalInvoiceId.findings.some(
    (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
  )
);

'''
marker = "if (failures > 0) {\n"
if tests.count(marker) != 1:
    raise SystemExit(f"test summary marker: expected one match, found {tests.count(marker)}")
tests = tests.replace(marker, regressions + marker, 1)

sanity_path.write_text(sanity, encoding="utf-8")
deterministic_path.write_text(deterministic, encoding="utf-8")
test_path.write_text(tests, encoding="utf-8")
print("Applied final sanity and generic payment-preservation corrections.")
