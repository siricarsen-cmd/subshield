from pathlib import Path

path = Path("lib/analyzer/deterministic.ts")
text = path.read_text(encoding="utf-8")
old = r'''  /(?:\bgoverned\s+by\s+the\s+laws?\s+of|\bgoverning\s+law\s*(?::|[-–—])\s*(?:the\s+laws?\s+of\s+)?)(?:(?:the\s+)?(?:State|Commonwealth)\s+of\s+)?[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,2}/i;'''
new = r'''  /(?:\bgoverned\s+by\s+the\s+laws?\s+of|\bgoverning\s+law\s*(?::|[-–—])\s*(?:the\s+laws?\s+of)?)(?:\s+(?:(?:the\s+)?(?:State|Commonwealth)\s+of\s+)?[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,2})/i;'''
count = text.count(old)
if count != 1:
    raise SystemExit(f"governing-law regex: expected exactly one match, found {count}")
path.write_text(text.replace(old, new, 1), encoding="utf-8")
