from pathlib import Path


def replace_exact(path: str, old: str, new: str, expected_count: int) -> None:
    file = Path(path)
    text = file.read_text()
    actual = text.count(old)
    if actual != expected_count:
        raise SystemExit(f"{path}: expected {expected_count} matches, found {actual}: {old}")
    file.write_text(text.replace(old, new))


# Mandatory modal + subject-to + binding arbitration is compulsory even without
# the redundant word "mandatory". Keep non-modal present-tense subject-to forms
# limited to an express mandatory qualifier so permissive language stays clean.
replace_exact(
    "lib/analyzer/deterministic.ts",
    r"(?:is|are|shall|must|will)\s+(?:be\s+)?subject\s+to\s+mandatory\s+(?:binding\s+)?arbitration\b",
    r"(?:(?:is|are)\s+subject\s+to\s+mandatory\s+(?:binding\s+)?arbitration|(?:shall|must|will)\s+be\s+subject\s+to\s+(?:(?:mandatory\s+(?:binding\s+)?)|(?:binding\s+))arbitration)\b",
    2,
)

# Recognize ordinary active invoice descriptions used by the contextual waiver
# path, including "each invoice".
replace_exact(
    "lib/analyzer/deterministic.ts",
    r"(?:a|all|the|its|complete|timely|monthly|proper|final|correct|accurate|valid|itemized|detailed|supported|compliant|periodic|interim|recurring|certified|acceptable)",
    r"(?:a|all|each|the|its|complete|timely|monthly|proper|final|correct|accurate|valid|itemized|detailed|supported|compliant|periodic|interim|recurring|certified|acceptable)",
    1,
)

positive_consequence = r"(?:waives?|forfeits?)"
extended_consequence = r"(?:waives?|forfeits?|(?:shall\s+|will\s+|must\s+)?constitutes?\s+(?:a\s+)?waiver\s+of|(?:is|shall\s+be|will\s+be|must\s+be)\s+deemed\s+(?:a\s+)?waiver\s+of|results?\s+in\s+(?:the\s+)?forfeiture\s+of)"
replace_exact(
    "lib/analyzer/deterministic.ts",
    positive_consequence,
    extended_consequence,
    3,
)

replace_exact(
    "lib/analyzer/deterministic.ts",
    r"(?:(?:does|shall|will|may|can)\s+not|cannot|never)\s+(?:waive|forfeit)\s+",
    r"(?:(?:(?:does|shall|will|may|can)\s+not|cannot|never)\s+(?:waive|forfeit|constitute\s+(?:a\s+)?waiver\s+of|result\s+in\s+(?:the\s+)?forfeiture\s+of)|(?:is|shall|will|may|can)\s+not\s+(?:be\s+)?deemed\s+(?:a\s+)?waiver\s+of)\s+",
    1,
)

tests = Path("lib/analyzer/__tests__/orion-parity-regression.test.mjs")
text = tests.read_text()
marker = "if (failures > 0) {"
if text.count(marker) != 1:
    raise SystemExit("Orion test completion marker was not unique")
block = r'''

const shallBeSubjectToBindingArbitration = productionPath(`
2.23 Dispute Resolution
All disputes shall be subject to binding arbitration.
`);
check(
  "shall-be-subject-to binding arbitration is detected without redundant mandatory wording",
  shallBeSubjectToBindingArbitration.findings.some(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  )
);
const mayBeSubjectToBindingArbitration = productionPath(`
2.23 Dispute Resolution
All disputes may be subject to binding arbitration only by mutual written agreement.
`);
check(
  "may-be-subject-to binding arbitration remains optional and clean",
  !mayBeSubjectToBindingArbitration.findings.some(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  )
);
const negatedThenMandatorySubjectToBindingArbitration = productionPath(`
2.23 Dispute Resolution
No invoice disputes shall be subject to binding arbitration, but all intellectual-property claims shall be subject to binding arbitration.
`);
check(
  "negated subject-to branch does not hide a later mandatory subject-to binding branch",
  negatedThenMandatorySubjectToBindingArbitration.findings.some(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  )
);

const nominalInvoiceWaiver = productionPath(`
2.8 Invoice Requirements
Subcontractor shall submit each invoice within 30 calendar days. Failure to do so shall constitute a waiver of the Subcontractor's right to payment.
`);
check(
  "constitutes-a-waiver invoice language triggers permanent payment-loss detection",
  nominalInvoiceWaiver.findings.some(
    (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
  )
);
const negatedNominalInvoiceWaiver = productionPath(`
2.8 Invoice Requirements
Subcontractor shall submit each invoice within 30 calendar days. Failure to do so shall not be deemed a waiver of the Subcontractor's right to payment.
`);
check(
  "not-deemed-a-waiver invoice language remains clean",
  !negatedNominalInvoiceWaiver.findings.some(
    (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
  )
);
const mixedActorNominalInvoiceWaivers = productionPath(`
2.8 Invoice Requirements
Prime Contractor shall submit each invoice within 20 calendar days. Failure to do so shall constitute a waiver of Prime Contractor's right to payment.
Subcontractor shall submit each invoice within 30 calendar days. Failure to do so results in forfeiture of the Subcontractor's right to payment.
`);
check(
  "Prime-only nominal waiver does not hide a later Subcontractor forfeiture branch",
  mixedActorNominalInvoiceWaivers.findings.some(
    (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
  )
);

'''
tests.write_text(text.replace(marker, block + marker))
