from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)


deterministic_path = Path("lib/analyzer/deterministic.ts")
deterministic = deterministic_path.read_text(encoding="utf-8")

old_predicate = '''function hasMandatoryVenueOrArbitrationEvidence(text: string): boolean {
  return hasMandatoryForumEvidence(text) || MANDATORY_ARBITRATION_EVIDENCE_RE.test(text);
}

function findVenueOrGoverningLawCandidate(documentText: string): string | null {
  return findClauseCandidate(
    documentText,
    (block) =>
      hasMandatoryVenueOrArbitrationEvidence(block) || GOVERNING_LAW_EVIDENCE_RE.test(block)
  );
}'''
new_predicate = '''function hasMandatoryVenueOrArbitrationEvidence(text: string): boolean {
  return hasMandatoryForumEvidence(text) || MANDATORY_ARBITRATION_EVIDENCE_RE.test(text);
}

export function hasVenueGoverningLawOrArbitrationEvidence(text: string): boolean {
  return hasMandatoryVenueOrArbitrationEvidence(text) || GOVERNING_LAW_EVIDENCE_RE.test(text);
}

function findVenueOrGoverningLawCandidate(documentText: string): string | null {
  return findClauseCandidate(documentText, hasVenueGoverningLawOrArbitrationEvidence);
}'''
deterministic = replace_once(
    deterministic,
    old_predicate,
    new_predicate,
    "combined dispute evidence predicate",
)
deterministic_path.write_text(deterministic, encoding="utf-8")

sanity_path = Path("lib/analyzer/sanity.ts")
sanity = sanity_path.read_text(encoding="utf-8")
sanity = replace_once(
    sanity,
    "  hasMandatoryForumEvidence,\n",
    "  hasVenueGoverningLawOrArbitrationEvidence,\n",
    "sanity dispute evidence import",
)
sanity = replace_once(
    sanity,
    "  const forumBurdenEvidence = hasMandatoryForumEvidence(quote);",
    "  const forumBurdenEvidence = hasVenueGoverningLawOrArbitrationEvidence(quote);",
    "sanity dispute evidence guard",
)
sanity_path.write_text(sanity, encoding="utf-8")
