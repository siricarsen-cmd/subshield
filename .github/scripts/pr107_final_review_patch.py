from pathlib import Path


def replace_section(text: str, start: str, end: str, replacement: str) -> str:
    start_index = text.index(start)
    end_index = text.index(end, start_index)
    return text[:start_index] + replacement.rstrip() + "\n" + text[end_index:]


deterministic_path = Path("lib/analyzer/deterministic.ts")
test_path = Path("lib/analyzer/__tests__/orion-parity-regression.test.mjs")

deterministic = deterministic_path.read_text(encoding="utf-8")
tests = test_path.read_text(encoding="utf-8")

if "DIRECT_PRIME_UNPAID_IMPROVEMENT_RIGHTS_RE" in deterministic:
    raise SystemExit("ownership-rights patch already present")
if "deadline-before-actor Prime-only passive invoice duty remains excluded" in tests:
    raise SystemExit("final review regressions already present")

non_subcontractor_actor = r'''const EXPLICIT_NON_SUBCONTRACTOR_INVOICE_DUTY_RE =
  /\b(?:Prime(?:\s+Contractor)?|Government|Customer)(?:(?:'s|\u2019s)\s+failure\s+to\s+(?:submit|do\s+so)|\s+(?:(?:must|shall|should|will)\s+submit|is\s+required\s+to\s+submit|fails?\s+to\s+submit))\b|\binvoices?\b[^.]{0,120}(?:(?:must|shall|should|will)\s+be\s+submitted|are\s+required\s+to\s+be\s+submitted)(?:\s+(?!(?:by|and|but|or)\b)[A-Za-z][A-Za-z-]*){0,12}\s+by\s+(?:Prime(?:\s+Contractor)?|Government|Customer)\b|\binvoices?\b[^.]{0,120}(?:(?:must|shall|should|will)\s+be\s+submitted|are\s+required\s+to\s+be\s+submitted)[^.]{0,140}(?:within|no\s+later\s+than)\s+\d{1,3}\s*(?:calendar|business|working)?\s*days?[^.;]{0,80}\bby\s+(?:Prime(?:\s+Contractor)?|Government|Customer)\b/i;'''

deterministic = replace_section(
    deterministic,
    "const EXPLICIT_NON_SUBCONTRACTOR_INVOICE_DUTY_RE =",
    "const EXPLICIT_SUBCONTRACTOR_INVOICE_DUTY_RE =",
    non_subcontractor_actor,
)

subcontractor_actor = r'''const EXPLICIT_SUBCONTRACTOR_INVOICE_DUTY_RE =
  /\bSubcontractor(?:(?:'s|\u2019s)\s+failure\s+to\s+(?:submit|do\s+so)|\s+(?:(?:must|shall|should|will)\s+submit|is\s+required\s+to\s+submit|fails?\s+to\s+submit))\b|\binvoices?\b[^.]{0,160}(?:(?:must|shall|should|will)\s+be\s+submitted|are\s+required\s+to\s+be\s+submitted)(?:\s+(?!(?:by|and|but|or)\b)[A-Za-z][A-Za-z-]*){0,12}\s+by[^.]{0,120}\bSubcontractor\b|\binvoices?\b[^.]{0,160}(?:(?:must|shall|should|will)\s+be\s+submitted|are\s+required\s+to\s+be\s+submitted)[^.]{0,140}(?:within|no\s+later\s+than)\s+\d{1,3}\s*(?:calendar|business|working)?\s*days?[^.;]{0,120}\bby\s+Subcontractor\b/i;'''

deterministic = replace_section(
    deterministic,
    "const EXPLICIT_SUBCONTRACTOR_INVOICE_DUTY_RE =",
    "const INVOICE_PAYMENT_WAIVER_RE =",
    subcontractor_actor,
)

ownership_rights_constants = r'''const NEGATED_PRIME_UNPAID_IMPROVEMENT_RIGHTS_RE =
  /\b(?:Prime\s+Contractor|Prime)\b[^.;]{0,60}(?:(?:(?:does|shall|will|may|can)\s+not|never)\s+(?:own|hold|have|receive|obtain)|(?:refuses?|declines?)\s+to\s+(?:own|hold|receive|obtain))\b[^.;]{0,120}\b(?:royalty[\s-]?free|free\s+of\s+charge|without\s+(?:additional\s+)?(?:payment|compensation|charge|fee))\b[^.;]{0,100}\b(?:rights?|interests?)\b[^.;]{0,80}\b(?:improvements?|adaptations?)\b|\b(?:royalty[\s-]?free|free\s+of\s+charge|without\s+(?:additional\s+)?(?:payment|compensation|charge|fee))\b[^.;]{0,100}\b(?:rights?|interests?)\b[^.;]{0,80}\b(?:improvements?|adaptations?)\b[^.;]{0,80}(?:(?:are|shall|will|may|can)\s+not|cannot|never)\s+(?:be\s+)?(?:held|owned)\s+by\s+(?:the\s+)?(?:Prime\s+Contractor|Prime)\b/i;
const DIRECT_PRIME_UNPAID_IMPROVEMENT_RIGHTS_RE =
  /\b(?:Prime\s+Contractor|Prime)\b[^.;]{0,40}\b(?:owns?|holds?|has|receives?|obtains?)\b[^.;]{0,60}\b(?<!non-)(?<!non\s)(?<!not\s)(?:royalty[\s-]?free|free\s+of\s+charge|without\s+(?:additional\s+)?(?:payment|compensation|charge|fee))\b[^.;]{0,80}\b(?:rights?|interests?)\b[^.;]{0,60}\b(?:in|to)\s+(?:(?:all|any|the|such)\s+){0,2}(?:improvements?|adaptations?)\b|\b(?<!non-)(?<!non\s)(?<!not\s)(?:royalty[\s-]?free|free\s+of\s+charge|without\s+(?:additional\s+)?(?:payment|compensation|charge|fee))\b[^.;]{0,80}\b(?:rights?|interests?)\b[^.;]{0,60}\b(?:in|to)\s+(?:(?:all|any|the|such)\s+){0,2}(?:improvements?|adaptations?)\b[^.;]{0,80}\b(?:are|shall\s+be|will\s+be)\s+(?:held|owned)\s+by\s+(?:the\s+)?(?:Prime\s+Contractor|Prime)\b/i;

'''

helper_marker = "export function hasUnpaidPrimeImprovementsUseEvidence(text: string): boolean {"
deterministic = deterministic.replace(helper_marker, ownership_rights_constants + helper_marker, 1)

old_helper_body = '''    coordinatedIpUseSegments(clause).some((segment) => {\n      const grantWindow = primeImprovementsUseGrantWindow(segment);\n      return Boolean(\n        grantWindow &&\n          WITHOUT_ADDITIONAL_PAYMENT_RE.test(grantWindow) &&\n          !unpaidQualifierTargetsCompetingIpObject(grantWindow)\n      );\n    })'''
new_helper_body = '''    coordinatedIpUseSegments(clause).some((segment) => {\n      if (NEGATED_PRIME_UNPAID_IMPROVEMENT_RIGHTS_RE.test(segment)) return false;\n      if (DIRECT_PRIME_UNPAID_IMPROVEMENT_RIGHTS_RE.test(segment)) return true;\n      const grantWindow = primeImprovementsUseGrantWindow(segment);\n      return Boolean(\n        grantWindow &&\n          WITHOUT_ADDITIONAL_PAYMENT_RE.test(grantWindow) &&\n          !unpaidQualifierTargetsCompetingIpObject(grantWindow)\n      );\n    })'''
if deterministic.count(old_helper_body) != 1:
    raise SystemExit("unexpected unpaid-use helper body")
deterministic = deterministic.replace(old_helper_body, new_helper_body, 1)

regressions = r'''

const primeDeadlineBeforePassiveActor = productionPath(`
2.8 Invoice Requirements
Invoices must be submitted within 30 calendar days by Prime Contractor; failure to do so waives the right to payment.
`);
check(
  "deadline-before-actor Prime-only passive invoice duty remains excluded",
  !primeDeadlineBeforePassiveActor.findings.some(
    (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
  )
);

const subcontractorDeadlineBeforePassiveActor = productionPath(`
2.8 Invoice Requirements
Invoices must be submitted within 30 calendar days by Subcontractor; failure to do so waives Subcontractor's right to payment.
`);
check(
  "deadline-before-actor Subcontractor passive invoice duty still triggers",
  subcontractorDeadlineBeforePassiveActor.findings.some(
    (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
  )
);

const jointDeadlineBeforePassiveActors = productionPath(`
2.8 Invoice Requirements
Invoices must be submitted within 30 calendar days by Prime Contractor and by Subcontractor; failure to do so waives Subcontractor's right to payment.
`);
check(
  "deadline-before-actor joint passive duty preserves the Subcontractor finding",
  jointDeadlineBeforePassiveActors.findings.some(
    (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
  )
);

const directRoyaltyFreeOwnershipQuote =
  "Prime Contractor owns royalty-free rights in Improvements.";
const directRoyaltyFreeOwnershipFinding = unpaidIpFinding(
  directRoyaltyFreeOwnershipQuote,
  "Prime Contractor owns royalty-free rights in Improvements."
);
check(
  "direct Prime ownership of royalty-free Improvements rights verifies against identical evidence",
  verifyFindings(
    [directRoyaltyFreeOwnershipFinding],
    directRoyaltyFreeOwnershipQuote
  ).verified.length === 1
);

const heldRoyaltyFreeOwnershipQuote =
  "Royalty-free rights in Improvements are held by Prime Contractor.";
const heldRoyaltyFreeOwnershipFinding = unpaidIpFinding(
  heldRoyaltyFreeOwnershipQuote,
  "Royalty-free rights in Improvements are held by Prime Contractor."
);
check(
  "passive Prime holding of royalty-free Improvements rights verifies against identical evidence",
  verifyFindings(
    [heldRoyaltyFreeOwnershipFinding],
    heldRoyaltyFreeOwnershipQuote
  ).verified.length === 1
);

const negatedRoyaltyFreeOwnershipQuote =
  "Prime Contractor does not own royalty-free rights in Improvements.";
const inventedOwnershipAgainstNegation = unpaidIpFinding(
  negatedRoyaltyFreeOwnershipQuote,
  "Prime Contractor owns royalty-free rights in Improvements."
);
check(
  "negated Prime ownership does not verify an affirmative royalty-free Improvements claim",
  verifyFindings(
    [inventedOwnershipAgainstNegation],
    negatedRoyaltyFreeOwnershipQuote
  ).verified.length === 0
);
'''

final_marker = "\nif (failures > 0) {"
if tests.count(final_marker) != 1:
    raise SystemExit("unexpected Orion test ending")
tests = tests.replace(final_marker, regressions + final_marker, 1)

deterministic_path.write_text(deterministic, encoding="utf-8")
test_path.write_text(tests, encoding="utf-8")

print("Applied two exact-head review fixes and six Orion regressions.")
