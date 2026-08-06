from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)


deterministic_path = Path("lib/analyzer/deterministic.ts")
deterministic = deterministic_path.read_text()

old_invoice_constants = r'''const NEGATED_INVOICE_PAYMENT_WAIVER_RE =
  /failure\s+to\s+(?:submit[^.]{0,180}\binvoice\b|do\s+so|submit\s+(?:it|them)|timely\s+submit(?:\s+(?:it|them))?|submit\s+on\s+time)[^.]{0,200}(?:(?:does|shall|will|may)\s+not|never)\s+(?:waive|forfeit)\s+(?:Subcontractor(?:'s|\u2019s)?\s+)?(?:the\s+)?(?:right|entitlement)\s+to\s+payment/i;
const INVOICE_PAYMENT_WAIVER_RE ='''
new_invoice_constants = r'''const NEGATED_INVOICE_PAYMENT_WAIVER_RE =
  /failure\s+to\s+(?:submit[^.]{0,180}\binvoice\b|do\s+so|submit\s+(?:it|them)|timely\s+submit(?:\s+(?:it|them))?|submit\s+on\s+time)[^.]{0,200}(?:(?:does|shall|will|may)\s+not|never)\s+(?:waive|forfeit)\s+(?:Subcontractor(?:'s|\u2019s)?\s+)?(?:the\s+)?(?:right|entitlement)\s+to\s+payment/i;
const EXPLICIT_NON_SUBCONTRACTOR_INVOICE_DUTY_RE =
  /\b(?:Prime(?:\s+Contractor)?|Government|Customer)(?:(?:'s|\u2019s)\s+failure\s+to\s+(?:submit|do\s+so)|\s+(?:(?:must|shall|should|will)\s+submit|is\s+required\s+to\s+submit|fails?\s+to\s+submit))\b/i;
const INVOICE_PAYMENT_WAIVER_RE ='''
deterministic = replace_once(
    deterministic,
    old_invoice_constants,
    new_invoice_constants,
    "explicit non-Subcontractor invoice-duty guard",
)

old_affirmative_branches = r'''function affirmativeInvoiceWaiverBranches(sentence: string): string[] {
  return sentence
    .split(/\s*(?:;|,\s*but\b|\bbut\b)\s*/i)
    .map((branch) => branch.trim())
    .filter(Boolean)
    .filter((branch) => !NEGATED_INVOICE_PAYMENT_WAIVER_RE.test(branch));
}'''
new_affirmative_branches = r'''function invoiceSubmissionDutyTargetsSubcontractor(text: string): boolean {
  return !EXPLICIT_NON_SUBCONTRACTOR_INVOICE_DUTY_RE.test(text);
}

function affirmativeInvoiceWaiverBranches(sentence: string): string[] {
  return sentence
    .split(/\s*(?:;|,\s*but\b|\bbut\b)\s*/i)
    .map((branch) => branch.trim())
    .filter(Boolean)
    .filter(
      (branch) =>
        !NEGATED_INVOICE_PAYMENT_WAIVER_RE.test(branch) &&
        invoiceSubmissionDutyTargetsSubcontractor(branch)
    );
}'''
deterministic = replace_once(
    deterministic,
    old_affirmative_branches,
    new_affirmative_branches,
    "bind invoice-waiver branches to the Subcontractor",
)

old_sentence_deadline = r'''    if (sentenceCarriesInvoiceSubmissionDeadline) return [index];
    if (
      index > 0 &&
      INVOICE_SUBMISSION_DEADLINE_RE.test(sentences[index - 1])
    ) {
      return [index];
    }'''
new_sentence_deadline = r'''    if (
      sentenceCarriesInvoiceSubmissionDeadline &&
      invoiceSubmissionDutyTargetsSubcontractor(sentence)
    ) {
      return [index];
    }
    if (
      index > 0 &&
      INVOICE_SUBMISSION_DEADLINE_RE.test(sentences[index - 1]) &&
      invoiceSubmissionDutyTargetsSubcontractor(sentences[index - 1])
    ) {
      return [index];
    }'''
deterministic = replace_once(
    deterministic,
    old_sentence_deadline,
    new_sentence_deadline,
    "bind same- and adjacent-sentence invoice deadlines to the Subcontractor",
)

old_direct_forum = r'''const DIRECT_MANDATORY_FORUM_RE =
  /(?:(?:(?:all|any)\s+)?(?:actions?|lawsuits?|claims?|disputes?|proceedings?)|arbitration|mediation|court\s+proceedings?)[^.]{0,180}(?:(?:must|shall|will)\s+be|(?:is|are)\s+required\s+to\s+be)\s+(?:brought|filed)\s+(?:exclusively\s+)?in\s+(?:(?:the\s+)?(?:(?:state|federal|county|municipal|district|circuit|superior|commonwealth)\s+)?(?:courts?|forum)\b|(?:[A-Za-z][A-Za-z.'-]*\s+){0,5}(?:County|State|Commonwealth|District|City)\b|(?:the\s+)?(?:Commonwealth|State)\s+of\s+[A-Za-z][A-Za-z.'-]*\b)/i;
const EXCLUSIVE_FORUM_RE ='''
new_direct_forum = r'''const DIRECT_MANDATORY_FORUM_RE =
  /(?:(?:(?:all|any)\s+)?(?:actions?|lawsuits?|claims?|disputes?|proceedings?)|arbitration|mediation|court\s+proceedings?)[^.]{0,180}(?:(?:must|shall|will)\s+be|(?:is|are)\s+required\s+to\s+be)\s+(?:brought|filed)\s+(?:exclusively\s+)?in\s+(?:(?:the\s+)?(?:(?:state|federal|county|municipal|district|circuit|superior|commonwealth)\s+)?(?:courts?|forum)\b|(?:[A-Za-z][A-Za-z.'-]*\s+){0,5}(?:County|State|Commonwealth|District|City)\b|(?:the\s+)?(?:Commonwealth|State)\s+of\s+[A-Za-z][A-Za-z.'-]*\b)/i;
const NEGATED_DIRECT_MANDATORY_FORUM_RE =
  /\b(?:no|neither)\s+(?:(?:all|any)\s+)?(?:actions?|lawsuits?|claims?|disputes?|proceedings?)\b[^.]{0,180}(?:(?:must|shall|will)\s+be|(?:is|are)\s+required\s+to\s+be)\s+(?:brought|filed)\b/i;
const EXCLUSIVE_FORUM_RE ='''
deterministic = replace_once(
    deterministic,
    old_direct_forum,
    new_direct_forum,
    "negated direct mandatory-forum guard",
)

old_forum_guard = r'''function clauseHasMandatoryForumEvidence(clause: string): boolean {
  if (clauseHasOptionalForumChoice(clause)) return false;
  if (BILATERAL_DEFENDANT_VENUE_RE.test(clause)) return false;
  if (NEGATED_EXCLUSIVE_JURISDICTION_RE.test(clause)) return false;'''
new_forum_guard = r'''function clauseHasMandatoryForumEvidence(clause: string): boolean {
  if (clauseHasOptionalForumChoice(clause)) return false;
  if (BILATERAL_DEFENDANT_VENUE_RE.test(clause)) return false;
  if (NEGATED_EXCLUSIVE_JURISDICTION_RE.test(clause)) return false;
  if (NEGATED_DIRECT_MANDATORY_FORUM_RE.test(clause)) return false;'''
deterministic = replace_once(
    deterministic,
    old_forum_guard,
    new_forum_guard,
    "apply negated brought/filed forum guard",
)

old_deferred_law = r'''const DEFERRED_OR_UNSELECTED_GOVERNING_LAW_RE =
  /\bgoverning\s+law\b[^.]{0,140}\b(?:has|have|is|was)\s+not\s+(?:been\s+)?selected\b|\bgoverning\s+law\b[^.]{0,140}\bshall\s+be\s+(?:agreed|selected|determined)\s+later\b/i;'''
new_deferred_law = r'''const DEFERRED_OR_UNSELECTED_GOVERNING_LAW_RE =
  /\bgoverning\s+law\b[^.]{0,140}\b(?:has|have|is|was)\s+not\s+(?:been\s+)?selected\b|\bgoverning\s+law\b[^.]{0,140}\b(?:shall|will|is\s+to)\s+be\s+(?:agreed|selected|determined)\s+(?:later|by\s+(?:(?:mutual\s+)?agreement(?:\s+of\s+(?:the\s+)?parties)?|(?:the\s+)?parties))\b/i;'''
deterministic = replace_once(
    deterministic,
    old_deferred_law,
    new_deferred_law,
    "mutual-agreement governing-law deferral guard",
)

deterministic_path.write_text(deterministic)


test_path = Path("lib/analyzer/__tests__/orion-parity-regression.test.mjs")
tests = test_path.read_text()
marker = "\nif (failures > 0) {\n"
if tests.count(marker) != 1:
    raise SystemExit(f"test marker: expected one match, found {tests.count(marker)}")

additions = r'''

const primeInvoiceDutyWaiver = productionPath(`
2.8 Invoice Requirements
Prime Contractor's failure to submit a complete invoice within 30 calendar days waives the right to payment.
`);
check(
  "Prime Contractor invoice duty does not become a Subcontractor payment-waiver finding",
  !primeInvoiceDutyWaiver.findings.some(
    (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
  )
);

const primeAdjacentInvoiceDutyWaiver = productionPath(`
2.8 Invoice Requirements
Prime Contractor shall submit complete invoices within 30 calendar days. Failure to do so waives the right to payment.
`);
check(
  "adjacent Prime Contractor invoice duty does not become a Subcontractor payment-waiver finding",
  !primeAdjacentInvoiceDutyWaiver.findings.some(
    (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
  )
);

const subcontractorInvoiceDutyWaiver = productionPath(`
2.8 Invoice Requirements
Subcontractor's failure to submit a complete invoice within 30 calendar days waives the right to payment.
`);
check(
  "explicit Subcontractor invoice duty still triggers payment-waiver analysis",
  subcontractorInvoiceDutyWaiver.findings.some(
    (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
  )
);

const negatedMandatoryForum = productionPath(`
2.23 Dispute Resolution
No action shall be brought in the courts of the Commonwealth of Virginia.
`);
check(
  "negated brought-in forum language remains clean",
  !negatedMandatoryForum.findings.some(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  )
);

const affirmativeMandatoryForumAfterNegationGuard = productionPath(`
2.23 Dispute Resolution
Any action shall be brought in the courts of the Commonwealth of Virginia.
`);
const affirmativeForumAfterNegationFinding = affirmativeMandatoryForumAfterNegationGuard.findings.find(
  (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
);
check(
  "affirmative brought-in forum still triggers after the negation guard",
  Boolean(affirmativeForumAfterNegationFinding)
);
check(
  "affirmative brought-in forum remains quote-local after the negation guard",
  Boolean(
    affirmativeForumAfterNegationFinding &&
      verifyFindings(
        [affirmativeForumAfterNegationFinding],
        affirmativeForumAfterNegationFinding.foundText
      ).verified.length === 1
  )
);

const mutuallyDeferredGoverningLaw = productionPath(`
2.23 Governing Law
The governing law shall be determined by mutual agreement of the parties.
`);
check(
  "mutual-agreement governing-law deferral remains clean",
  !mutuallyDeferredGoverningLaw.findings.some(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  )
);

const selectedGoverningLawAfterDeferralGuard = productionPath(`
2.23 Governing Law
The governing law of this Agreement shall be the laws of the State of Virginia.
`);
check(
  "actually selected governing law still triggers after the deferral guard",
  selectedGoverningLawAfterDeferralGuard.findings.some(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  )
);
'''

test_path.write_text(tests.replace(marker, additions + marker, 1))
