from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)


path = Path("lib/analyzer/deterministic.ts")
text = path.read_text()

old = r'''export function hasUnpaidPrimeImprovementsUseEvidence(text: string): boolean {
  const sentences = text.split(/(?<=[.!?])\s+/);
  return sentences.some((sentence) =>
    coordinatedIpUseSegments(sentence).some((segment) => {
      const grantWindow = primeImprovementsUseGrantWindow(segment);
      return Boolean(
        grantWindow &&
          WITHOUT_ADDITIONAL_PAYMENT_RE.test(grantWindow) &&
          !unpaidQualifierTargetsCompetingIpObject(grantWindow)
      );
    })
  );
}'''
new = r'''export function hasUnpaidPrimeImprovementsUseEvidence(text: string): boolean {
  const clauses = text.split(
    /(?<=[.!?])\s+|\s*;\s*|,\s*(?:but|however|while|whereas)\s+/i
  );
  return clauses.some((clause) =>
    coordinatedIpUseSegments(clause).some((segment) => {
      const grantWindow = primeImprovementsUseGrantWindow(segment);
      return Boolean(
        grantWindow &&
          WITHOUT_ADDITIONAL_PAYMENT_RE.test(grantWindow) &&
          !unpaidQualifierTargetsCompetingIpObject(grantWindow)
      );
    })
  );
}'''

text = replace_once(text, old, new, "top-level IP contrast-branch split")
path.write_text(text)
