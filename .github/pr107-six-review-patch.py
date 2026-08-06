from pathlib import Path
import subprocess

# Replay the immutable original six-review patch from the commit that introduced
# it, then apply the narrowly refined subtype classifier discovered by the
# guarded diagnostics.
original_patch = subprocess.check_output(
    [
        "git",
        "show",
        "7b171025f88ae24d42e84cb0ff4514a7448c3a8e:.github/pr107-six-review-patch.py",
    ],
    text=True,
)
exec(compile(original_patch, "pr107-six-review-patch-original.py", "exec"), {"__name__": "__main__"})

sanity_path = Path("lib/analyzer/sanity.ts")
sanity = sanity_path.read_text()
old = r'''  const arbitrationRequirementClaim =
    /(?:requires?|must|shall|required\s+to)[^.]{0,120}\b(?:binding\s+)?arbitration\b|\bresolved\s+(?:exclusively\s+)?through\s+(?:binding\s+)?arbitration\b/i.test(claim);
  const governingLawSelectionClaim =
    /\bselects?\s+(?:the\s+)?governing\s+law\b|\bgoverned\s+by\s+the\s+laws?\s+of\b|\bgoverning\s+law\s+(?:is|shall|will)\b/i.test(claim);
  const explicitForumSelectionClaim =
    /forum\s+(?:far|stated|required)|(?:requires?|must|shall|required\s+to|permits?)[^.]{0,120}\b(?:litigat|courts?|venue|jurisdiction|forum)\b|must\s+be\s+brought/i.test(claim) ||
    filedInForumClaim;'''
new = r'''  const affirmativeClaim = claim.replace(
    /\b(?:does|do|did|is|are|was|were|shall|will|would|can|could|may|might)\s+not\b[^.]*\.?/gi,
    " "
  );
  const arbitrationRequirementClaim =
    /(?:requires?|must|shall|required\s+to)[^.]{0,80}\b(?:disputes?|claims?|controvers(?:y|ies))\b[^.]{0,100}\b(?:resolved|settled|decided|submitted)\b[^.]{0,60}\b(?:binding\s+)?arbitration\b|\bresolved\s+(?:exclusively\s+)?through\s+(?:binding\s+)?arbitration\b|\bbinding\s+arbitration\b[^.]{0,100}\b(?:required|mandatory|exclusive\s+(?:remedy|means|method|procedure))\b/i.test(affirmativeClaim);
  const governingLawSelectionClaim =
    /\bselects?\s+(?:the\s+)?governing\s+law\b|\bgoverned\s+by\s+the\s+laws?\s+of\b|\bgoverning\s+law\s+(?:is|shall|will)\b/i.test(affirmativeClaim);
  const explicitForumSelectionClaim =
    /\bforum\s+(?:far|stated|required|selected)\b|(?:requires?|must|shall|required\s+to|permits?)[^.]{0,80}\b(?:disputes?|actions?|lawsuits?|claims?|proceedings?)\b[^.]{0,100}\b(?:litigat(?:e|ed|ion)|brought|filed)\b|\b(?:exclusive\s+)?(?:venue|jurisdiction)\b[^.]{0,100}\b(?:required|selected|shall|must|will)\b/i.test(affirmativeClaim) ||
    filedInForumClaim;'''
if sanity.count(old) != 1:
    raise SystemExit(f"subtype classifier refinement: expected one match, found {sanity.count(old)}")
sanity = sanity.replace(old, new, 1)

old_filed = r'''  const filedInForumClaim =
    /filed\s+in\s+(?:(?:a|the)\s+)?(?:courts?|forum)\b|filed\s+in\s+(?:(?:the\s+)?(?:State|Commonwealth)\s+of\s+)?[A-Z][A-Za-z.'-]*(?:\s+[A-Z][A-Za-z.'-]*){0,4}\s+(?:County|State|Commonwealth|District|City)\b/i.test(claim);'''
new_filed = r'''  const filedInForumClaim =
    !/\bfiled\s+in\s+writing\b/i.test(claim) &&
    /filed\s+in\s+(?:(?:a|the)\s+)?(?:courts?|forum)\b|filed\s+in\s+(?:(?:the\s+)?(?:State|Commonwealth)\s+of\s+)?[A-Z][A-Za-z.'-]*(?:\s+[A-Z][A-Za-z.'-]*){0,4}\s+(?:County|State|Commonwealth|District|City)\b/i.test(claim);'''
if sanity.count(old_filed) != 1:
    raise SystemExit(f"filed-in-writing exclusion: expected one match, found {sanity.count(old_filed)}")
sanity_path.write_text(sanity.replace(old_filed, new_filed, 1))

# The temporary V2 workflow was created only to investigate GitHub's run
# surfacing. Remove and stage it here so the original guarded workflow's exact
# six-file scope check and final commit cannot retain it.
v2_workflow = Path(".github/workflows/pr107-verified-six-v2.yml")
if v2_workflow.exists():
    v2_workflow.unlink()
    subprocess.run(
        ["git", "add", "-A", ".github/workflows/pr107-verified-six-v2.yml"],
        check=True,
    )
