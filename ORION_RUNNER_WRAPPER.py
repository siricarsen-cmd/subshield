from pathlib import Path

script = Path('ORION_DECOMPRESSED_BUILDER.py').read_text()

flexible_replace = '''def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count == 1:
        return text.replace(old, new, 1)
    lines = old.splitlines(keepends=True)
    pattern_parts = []
    for line in lines:
        stripped = line.lstrip(" \\t")
        prefix = r"^[ \\t]*" if line != stripped else ""
        pattern_parts.append(prefix + re.escape(stripped))
    pattern = "".join(pattern_parts)
    matches = list(re.finditer(pattern, text, flags=re.MULTILINE))
    if len(matches) != 1:
        raise SystemExit(f"{label}: expected one exact or indentation-tolerant match, found {len(matches)}")
    match = matches[0]
    return text[:match.start()] + new + text[match.end():]

'''
start = script.index('def replace_once')
end = script.index('def replace_block', start)
script = script[:start] + flexible_replace + script[end:]

for prop in ('familyKey', 'regulation', 'severity', 'patterns', 'findCandidate', 'riskAnalysis', 'redlineFix', 'buildRiskAnalysis'):
    script = script.replace(f'\n  {prop}:', f'\n    {prop}:')

robust_sanity_patch = r"""sanity_path = Path('lib/analyzer/sanity.ts')
sanity = sanity_path.read_text()
function_start = sanity.index('function unsupportedFindingLocalClaim')
return_marker = '  return null;\n}'
insert_at = sanity.index(return_marker, function_start)
guards = r'''  const forumBurdenClaim =
    /litigat|arbitrat|forum\s+(?:far|stated|required)|must\s+be\s+brought|filed\s+in/i.test(claim);
  const forumBurdenEvidence =
    /(?:exclusive\s+)?(?:venue|jurisdiction)\b|binding\s+arbitration|(?:arbitration|mediation|court\s+proceeding)[^.]{0,180}(?:brought|filed)\s+in|Prime(?:\s+Contractor)?\s+elects?\s+(?:another|a\s+different|an\s+alternate)\s+forum/i.test(quote);
  if (forumBurdenClaim && !forumBurdenEvidence) {
    return "Finding's analysis claims a litigation, arbitration, or forum requirement that is not stated in the finding's own verified quote.";
  }

  const unpaidImprovementClaim =
    /improvements?|adaptations?[^.]{0,100}(?:without\s+(?:additional\s+)?(?:payment|compensation)|unpaid|free\s+use)|(?:without\s+(?:additional\s+)?(?:payment|compensation)|unpaid|free\s+use)[^.]{0,100}(?:improvements?|adaptations?)/i.test(claim);
  const unpaidImprovementEvidence =
    /improvements?|adaptations?/i.test(quote) &&
    /without\s+(?:additional\s+)?(?:payment|compensation|charge|fee)/i.test(quote);
  if (unpaidImprovementClaim && !unpaidImprovementEvidence) {
    return "Finding's analysis claims unpaid Prime use of improvements or adaptations that is not stated in the finding's own verified quote.";
  }

'''
sanity = sanity[:insert_at] + guards + sanity[insert_at:]
sanity_path.write_text(sanity)

"""
sanity_start = script.index("sanity_path = Path('lib/analyzer/sanity.ts')")
sanity_end = script.index("fixture_path = Path('lib/analyzer/__fixtures__/orion-parity-regression-fixture.mjs')", sanity_start)
script = script[:sanity_start] + robust_sanity_patch + script[sanity_end:]

exec(compile(script, '<orion-parity-builder>', 'exec'))

deterministic_path = Path('lib/analyzer/deterministic.ts')
deterministic = deterministic_path.read_text()
venue_re_start = deterministic.index('const VENUE_OR_ARBITRATION_EVIDENCE_RE =')
venue_re_end = deterministic.index('const GOVERNING_LAW_EVIDENCE_RE =', venue_re_start)
adverse_venue_regex = r'''const VENUE_OR_ARBITRATION_EVIDENCE_RE =
  /(?:exclusive\s+)?(?:venue|jurisdiction)\s+(?:shall\s+be\s+|is\s+|lies\s+|must\s+be\s+)?(?:in|located\s+in)[^.]{0,120}(?:courts?|County|State|Commonwealth)|binding\s+arbitration|(?:arbitration|mediation|court\s+proceeding)[^.]{0,180}(?:(?:must|shall)\s+be\s+)?(?:brought|filed)\s+in|Prime(?:\s+Contractor)?\s+elects?\s+(?:another|a\s+different|an\s+alternate)\s+forum/i;
'''
deterministic = deterministic[:venue_re_start] + adverse_venue_regex + deterministic[venue_re_end:]
old_venue_gate = 'VENUE_OR_ARBITRATION_EVIDENCE_RE.test(block) || GOVERNING_LAW_EVIDENCE_RE.test(block)'
if deterministic.count(old_venue_gate) != 1:
    raise SystemExit(f'venue gate: expected one match, found {deterministic.count(old_venue_gate)}')
deterministic = deterministic.replace(old_venue_gate, 'VENUE_OR_ARBITRATION_EVIDENCE_RE.test(block)', 1)
deterministic_path.write_text(deterministic)

test_path = Path('lib/analyzer/__tests__/orion-parity-regression.test.mjs')
test_text = test_path.read_text()
law_start = test_text.index('check("governing-law-only finding does not invent a required forum"')
law_end = test_text.index('\n\nconst conditionedIpOnly', law_start)
test_text = test_text[:law_start] + 'check("governing-law-only text does not trigger venue finding", !lawOnly);' + test_text[law_end:]
test_path.write_text(test_text)

fixture_path = Path('lib/analyzer/__fixtures__/orion-parity-regression-fixture.mjs')
for generated_path in (fixture_path, test_path):
    generated = generated_path.read_text()
    generated_path.write_text(generated.replace('\\\\', '\\'))
