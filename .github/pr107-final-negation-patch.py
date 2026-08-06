from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)


deterministic_path = Path("lib/analyzer/deterministic.ts")
deterministic = deterministic_path.read_text()

old_passive = r'''const DIRECT_PRIME_PASSIVE_IMPROVEMENT_USE_RE =
  /(?:any\s+)?(?:improvements?(?:\s+or\s+adaptations?)?|adaptations?)(?:\s*,\s*(?:including|such\s+as)\s+(?:any\s+)?(?:adaptations?|enhancements?|modifications?)(?:\s+(?:and|or)\s+(?:adaptations?|enhancements?|modifications?))*\s*,)?(?:\s+(?!(?:deliverables?|services?|work\s+products?|may|shall|will)\b)[A-Za-z][A-Za-z'-]*){0,20}\s+(?:may|shall|will)\s+be\s+used\s+by\s+(?:the\s+)?(?:Prime\s+Contractor\b(?!['\u2019]s\b)(?![\s-]+(?:customers?|clients?|affiliates?|agenc(?:y|ies)|end[\s-]?users?|affiliated(?:[\s-]+entities?)?)\b)|Prime\b(?!['\u2019]s\b)(?!\s+Contractor\b)(?![\s-]+(?:customers?|clients?|affiliates?|agenc(?:y|ies)|end[\s-]?users?|affiliated(?:[\s-]+entities?)?)\b))/i;'''
new_passive = r'''const NEGATED_PASSIVE_PRIME_IMPROVEMENT_USE_RE =
  /\b(?:no|neither)\s+(?:any\s+)?(?:improvements?(?:\s+or\s+adaptations?)?|adaptations?)\b[^.]{0,180}\b(?:may|shall|will)\s+be\s+used\s+by\s+(?:the\s+)?(?:Prime\s+Contractor|Prime)\b|\b(?:improvements?(?:\s+or\s+adaptations?)?|adaptations?)\b[^.]{0,180}\b(?:may|shall|will)\s+not\s+be\s+used\s+by\s+(?:the\s+)?(?:Prime\s+Contractor|Prime)\b/i;
const DIRECT_PRIME_PASSIVE_IMPROVEMENT_USE_RE =
  /(?:any\s+)?(?:improvements?(?:\s+or\s+adaptations?)?|adaptations?)(?:\s*,\s*(?:including|such\s+as)\s+(?:any\s+)?(?:adaptations?|enhancements?|modifications?)(?:\s+(?:and|or)\s+(?:adaptations?|enhancements?|modifications?))*\s*,)?(?:\s+(?!(?:deliverables?|services?|work\s+products?|may|shall|will)\b)[A-Za-z][A-Za-z'-]*){0,20}\s+(?:may|shall|will)\s+be\s+used\s+by\s+(?:the\s+)?(?:Prime\s+Contractor\b(?!['\u2019]s\b)(?![\s-]+(?:customers?|clients?|affiliates?|agenc(?:y|ies)|end[\s-]?users?|affiliated(?:[\s-]+entities?)?)\b)|Prime\b(?!['\u2019]s\b)(?!\s+Contractor\b)(?![\s-]+(?:customers?|clients?|affiliates?|agenc(?:y|ies)|end[\s-]?users?|affiliated(?:[\s-]+entities?)?)\b))/i;'''
deterministic = replace_once(
    deterministic,
    old_passive,
    new_passive,
    "negated passive Prime improvement-use guard",
)

old_ip_split = r'''      /;\s*|,\s*(?:and|but|while|whereas)\s+|\s+and\s+(?=(?:deliverables?|services?|work\s+products?|improvements?|adaptations?)\b[^.]{0,80}\b(?:may|shall|will|is|are|has|have)\b)|\s+and\s+(?=(?:(?:a|an|the)\s+)?[^.;]{0,80}\blicense\b)/i'''
new_ip_split = r'''      /;\s*|,\s*(?:and|but|while|whereas)\s+|\s+(?:and|but)\s+(?=(?:deliverables?|services?|work\s+products?|improvements?|adaptations?)\b[^.]{0,80}\b(?:may|shall|will|is|are|has|have)\b)|\s+and\s+(?=(?:(?:a|an|the)\s+)?[^.;]{0,80}\blicense\b)/i'''
deterministic = replace_once(
    deterministic,
    old_ip_split,
    new_ip_split,
    "split plain-but IP grant branches",
)

old_grant_window = r'''function primeImprovementsUseGrantWindow(segment: string): string | null {
  if (NEGATED_PRIME_IMPROVEMENT_LICENSE_RE.test(segment)) return null;'''
new_grant_window = r'''function primeImprovementsUseGrantWindow(segment: string): string | null {
  if (NEGATED_PRIME_IMPROVEMENT_LICENSE_RE.test(segment)) return null;
  if (NEGATED_PASSIVE_PRIME_IMPROVEMENT_USE_RE.test(segment)) return null;'''
deterministic = replace_once(
    deterministic,
    old_grant_window,
    new_grant_window,
    "apply passive Prime-use negation locally",
)

old_base_forum = r'''const BASE_FORUM_EVIDENCE_RE =
  /(?:exclusive\s+(?:venue|jurisdiction)\s+(?:(?:shall|must|will)\s+be\s+|is\s+|lies\s+)?(?:in|located\s+in)|(?:venue|jurisdiction)\s+(?:(?:shall|must|will)\s+be\s+|is\s+|lies\s+)(?:in|located\s+in))[^.]{0,120}(?:courts?|County|State|Commonwealth)|binding\s+arbitration|Prime(?:\s+Contractor)?\s+elects?\s+(?:another|a\s+different|an\s+alternate)\s+forum/i;'''
new_base_forum = r'''const BASE_FORUM_EVIDENCE_RE =
  /(?:exclusive\s+(?:venue|jurisdiction)\s+(?:(?:shall|must|will)\s+be\s+|is\s+|lies\s+)?(?:in|located\s+in)|(?:venue|jurisdiction)\s+(?:(?:shall|must|will)\s+be\s+|is\s+|lies\s+)(?:in|located\s+in))[^.]{0,120}(?:courts?|County|State|Commonwealth)|Prime(?:\s+Contractor)?\s+elects?\s+(?:another|a\s+different|an\s+alternate)\s+forum/i;'''
deterministic = replace_once(
    deterministic,
    old_base_forum,
    new_base_forum,
    "remove unscoped binding-arbitration substring from forum evidence",
)

old_arbitration = r'''const MANDATORY_ARBITRATION_EVIDENCE_RE =
  /\b(?:disputes?|claims?|controvers(?:y|ies))\b[^.]{0,180}(?:(?:must|shall|will)\s+be|(?:is|are)\s+required\s+to\s+be)\s+(?:resolved|settled|decided|submitted)\s+(?:exclusively\s+)?(?:by|through|to)\s+(?:binding\s+)?arbitration\b/i;

function hasMandatoryVenueOrArbitrationEvidence(text: string): boolean {
  return hasMandatoryForumEvidence(text) || MANDATORY_ARBITRATION_EVIDENCE_RE.test(text);
}'''
new_arbitration = r'''const MANDATORY_ARBITRATION_EVIDENCE_RE =
  /\b(?:disputes?|claims?|controvers(?:y|ies))\b[^.]{0,180}(?:(?:must|shall|will)\s+be|(?:is|are)\s+required\s+to\s+be)\s+(?:resolved|settled|decided|submitted)\s+(?:exclusively\s+)?(?:by|through|to)\s+(?:binding\s+)?arbitration\b/i;
const BINDING_ARBITRATION_REQUIREMENT_RE =
  /\b(?:disputes?|claims?|controvers(?:y|ies))\b[^.]{0,180}\bbinding\s+arbitration\b|\b(?:parties?|Subcontractor|Prime(?:\s+Contractor)?)\b[^.]{0,140}\b(?:agree|consent)\s+to\s+binding\s+arbitration\b|\bbinding\s+arbitration\b[^.]{0,120}\b(?:is|shall|must|will)\s+(?:required|mandatory|exclusive)\b/i;
const NEGATED_MANDATORY_ARBITRATION_EVIDENCE_RE =
  /\b(?:no|neither)\s+(?:disputes?|claims?|controvers(?:y|ies))\b[^.]{0,220}(?:binding\s+)?arbitration\b|\b(?:disputes?|claims?|controvers(?:y|ies))\b[^.]{0,180}(?:(?:must|shall|will)\s+not\s+be|(?:is|are)\s+not\s+required\s+to\s+be)\s+(?:resolved|settled|decided|submitted)\s+(?:exclusively\s+)?(?:by|through|to)\s+(?:binding\s+)?arbitration\b|\b(?:neither|no)\s+part(?:y|ies)\b[^.]{0,160}(?:agree|consent)\s+to\s+binding\s+arbitration\b/i;

function arbitrationEvidenceClauses(text: string): string[] {
  return text
    .split(
      /(?<=[.!?])\s+|\s*;\s*|,\s*(?:but|however|while|whereas)\s+|\s+(?:and|but)\s+(?=(?:(?:all|any|the)\s+)?(?:disputes?|claims?|controvers(?:y|ies))\b[^.]{0,120}(?:(?:must|shall|will)\s+be|(?:is|are)\s+required\s+to\s+be))/i
    )
    .map((clause) => clause.trim())
    .filter(Boolean);
}

function hasMandatoryArbitrationEvidence(text: string): boolean {
  return arbitrationEvidenceClauses(text).some(
    (clause) =>
      !NEGATED_MANDATORY_ARBITRATION_EVIDENCE_RE.test(clause) &&
      (MANDATORY_ARBITRATION_EVIDENCE_RE.test(clause) ||
        BINDING_ARBITRATION_REQUIREMENT_RE.test(clause))
  );
}

function hasMandatoryVenueOrArbitrationEvidence(text: string): boolean {
  return hasMandatoryForumEvidence(text) || hasMandatoryArbitrationEvidence(text);
}'''
deterministic = replace_once(
    deterministic,
    old_arbitration,
    new_arbitration,
    "branch-local mandatory-arbitration evidence",
)

old_analysis = r'''  if (MANDATORY_ARBITRATION_EVIDENCE_RE.test(foundText)) {'''
new_analysis = r'''  if (hasMandatoryArbitrationEvidence(foundText)) {'''
deterministic = replace_once(
    deterministic,
    old_analysis,
    new_analysis,
    "build arbitration analysis from guarded evidence",
)

deterministic_path.write_text(deterministic)


test_path = Path("lib/analyzer/__tests__/orion-parity-regression.test.mjs")
tests = test_path.read_text()
marker = "\nif (failures > 0) {\n"
if tests.count(marker) != 1:
    raise SystemExit(f"test marker: expected one match, found {tests.count(marker)}")

additions = r'''

const negatedMandatoryArbitration = productionPath(`
2.23 Dispute Resolution
No disputes shall be resolved by binding arbitration.
`);
check(
  "negated mandatory-arbitration language remains clean",
  !negatedMandatoryArbitration.findings.some(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  )
);

const affirmativeMandatoryArbitrationAfterNegationGuard = productionPath(`
2.23 Dispute Resolution
All disputes shall be resolved by binding arbitration.
`);
const affirmativeArbitrationFinding = affirmativeMandatoryArbitrationAfterNegationGuard.findings.find(
  (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
);
check(
  "affirmative mandatory arbitration still triggers after the negation guard",
  Boolean(affirmativeArbitrationFinding)
);
check(
  "affirmative mandatory-arbitration finding remains quote-local",
  Boolean(
    affirmativeArbitrationFinding &&
      verifyFindings([affirmativeArbitrationFinding], affirmativeArbitrationFinding.foundText).verified
        .length === 1
  )
);

const mixedNegatedAndAffirmativeArbitration = productionPath(`
2.23 Dispute Resolution
No disputes shall be resolved by binding arbitration; all claims shall be resolved through arbitration.
`);
check(
  "negated arbitration branch does not hide a later affirmative arbitration requirement",
  mixedNegatedAndAffirmativeArbitration.findings.some(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  )
);

const negatedPassivePrimeImprovementUse = productionPath(`
2.17 Improvements
No Improvements may be used by Prime Contractor without additional payment.
`);
check(
  "negated passive Prime improvement-use language remains clean",
  !negatedPassivePrimeImprovementUse.findings.some(
    (finding) => finding.regulation === "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements"
  )
);

const affirmativePassivePrimeImprovementUseAfterNegationGuard = productionPath(`
2.17 Improvements
Improvements may be used by Prime Contractor without additional payment.
`);
const affirmativePassiveUseFinding = affirmativePassivePrimeImprovementUseAfterNegationGuard.findings.find(
  (finding) => finding.regulation === "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements"
);
check(
  "affirmative passive Prime improvement use still triggers after the negation guard",
  Boolean(affirmativePassiveUseFinding)
);
check(
  "affirmative passive Prime-use finding remains quote-local",
  Boolean(
    affirmativePassiveUseFinding &&
      verifyFindings([affirmativePassiveUseFinding], affirmativePassiveUseFinding.foundText).verified
        .length === 1
  )
);

const mixedNegatedAndAffirmativePassiveUse = productionPath(`
2.17 Improvements
No Improvements may be used by Prime Contractor without additional payment but Adaptations may be used by Prime Contractor without additional payment.
`);
check(
  "negated passive-use branch does not hide a later affirmative Adaptations grant",
  mixedNegatedAndAffirmativePassiveUse.findings.some(
    (finding) => finding.regulation === "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements"
  )
);
'''

test_path.write_text(tests.replace(marker, additions + marker, 1))
