from pathlib import Path


def replace_once(path: str, old: str, new: str, label: str) -> None:
    file_path = Path(path)
    text = file_path.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    file_path.write_text(text.replace(old, new, 1))


replace_once(
    "lib/analyzer/anchors.ts",
    r'''const EXPLICIT_TYPE_LABEL =
  /(?:subcontract\s+type|type\s+of\s+(?:subcontract|agreement)|contract\s+type)\s*(?::|[-\u2010-\u2015])?\s*(?:\n\s*)?([^\n.]{1,100})/i;''',
    r'''const EXPLICIT_TYPE_LABEL_WITH_SEPARATOR =
  /(?:subcontract\s+type|type\s+of\s+(?:subcontract|agreement)|contract\s+type)\s*(?::|[-\u2010-\u2015])\s*(?:\n\s*)?([^\n.]{1,100})/i;
const EXPLICIT_TYPE_LABEL_DIRECT =
  /(?:subcontract\s+type|type\s+of\s+(?:subcontract|agreement)|contract\s+type)\s*(?:\n\s*)?((?:Hybrid\s*(?:\(\s*)?)?(?:T\s*&\s*M|FFP\b|firm[\s-]*fixed[\s-]*price|time[\s-]*(?:and|&)[\s-]*materials|labor[\s-]hour|cost[\s-]*plus[\s-]*fixed[\s-]*fee|cost[\s-]reimburs(?:ement|able)|indefinite[\s-]delivery|IDIQ\b|purchase\s+order|teaming\s+agreement)[^\n.]{0,60})/i;''',
    "separate explicit separators from recognized direct type values",
)

replace_once(
    "lib/analyzer/anchors.ts",
    r'''  const explicitTypeLabelCandidate = firstMatch(text, EXPLICIT_TYPE_LABEL);''',
    r'''  const explicitTypeLabelCandidate =
    firstMatch(text, EXPLICIT_TYPE_LABEL_WITH_SEPARATOR) ||
    firstMatch(text, EXPLICIT_TYPE_LABEL_DIRECT);''',
    "prefer separated type labels while retaining recognized direct labels",
)

replace_once(
    "lib/analyzer/deterministic.ts",
    r'''const DIRECT_PRIME_PASSIVE_IMPROVEMENT_USE_RE =
  /(?:any\s+)?(?:improvements?(?:\s+or\s+adaptations?)?|adaptations?)(?:\s+(?:that|which|are|were|is|was|created|developed|generated|made|produced|conceived|arising|during|under|in|for|through|the|this|such|subcontract|agreement|performance|by|Subcontractor)){0,16}\s+(?:may|shall|will)\s+be\s+used\s+by\s+(?:Prime\s+Contractor\b(?!['\u2019]s\b)(?!\s+(?:customer|client|affiliate|agency|end[\s-]?user)\b)|Prime\b(?!['\u2019]s\b)(?!\s+Contractor\b)(?!\s+(?:customer|client|affiliate|agency|end[\s-]?user)\b))/i;''',
    r'''const DIRECT_PRIME_PASSIVE_IMPROVEMENT_USE_RE =
  /(?:any\s+)?(?:improvements?(?:\s+or\s+adaptations?)?|adaptations?)(?:\s*,\s*(?:including|such\s+as)\s+(?:any\s+)?(?:adaptations?|enhancements?|modifications?)(?:\s+(?:and|or)\s+(?:adaptations?|enhancements?|modifications?))*\s*,)?(?:\s+(?:that|which|are|were|is|was|created|developed|generated|made|produced|conceived|arising|during|under|in|for|through|the|this|such|subcontract|agreement|performance|by|Subcontractor)){0,16}\s+(?:may|shall|will)\s+be\s+used\s+by\s+(?:Prime\s+Contractor\b(?!['\u2019]s\b)(?!\s+(?:customer|client|affiliate|agency|end[\s-]?user)\b)|Prime\b(?!['\u2019]s\b)(?!\s+Contractor\b)(?!\s+(?:customer|client|affiliate|agency|end[\s-]?user)\b))/i;''',
    "accept bounded appositives in passive improvements-use grants",
)

test_path = Path("lib/analyzer/__tests__/orion-parity-regression.test.mjs")
tests = test_path.read_text()
marker = "\nif (failures > 0) {"
additions = r'''
const proseBeforeRealTypeLabel = extractAnchorCandidates(
  normalizeWhitespace(`The contract type will not be Time-and-Materials.\nSubcontract Type: Firm-Fixed-Price (FFP)`),
  "real-type-label.docx"
);
check(
  "ordinary contract-type prose does not preempt a later explicit label",
  Boolean(
    proseBeforeRealTypeLabel.subcontractType &&
      /Firm-Fixed-Price|FFP/i.test(proseBeforeRealTypeLabel.subcontractType) &&
      !/will not be/i.test(proseBeforeRealTypeLabel.subcontractType)
  ),
  proseBeforeRealTypeLabel.subcontractType ?? "missing anchor"
);

const appositivePassiveImprovementsGrant = productionPath(`
2.17 Improvements
Improvements, including adaptations, may be used by Prime Contractor without additional payment to Subcontractor.
`);
check(
  "appositive passive Prime improvements-use grant triggers",
  appositivePassiveImprovementsGrant.findings.some(
    (finding) => finding.regulation === "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements"
  )
);
'''
if tests.count(marker) != 1:
    raise SystemExit("last-review regression insertion marker missing or duplicated")
test_path.write_text(tests.replace(marker, additions + marker, 1))
