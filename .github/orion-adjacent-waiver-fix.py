from pathlib import Path

path = Path("lib/analyzer/deterministic.ts")
text = path.read_text()
old = r'''const INVOICE_SUBMISSION_DEADLINE_RE =
  /\binvoices?\b[^.]{0,120}(?:must|shall|should|are\s+required\s+to\s+be)\s+submitted[^.]{0,80}(?:within|no\s+later\s+than)\s+\d{1,3}\s*(?:calendar|business|working)?\s*days?/i;'''
new = r'''const INVOICE_SUBMISSION_DEADLINE_RE =
  /\binvoices?\b[^.]{0,120}(?:(?:must|shall|should)\s+be\s+submitted|are\s+required\s+to\s+be\s+submitted)[^.]{0,80}(?:within|no\s+later\s+than)\s+\d{1,3}\s*(?:calendar|business|working)?\s*days?/i;'''
count = text.count(old)
if count != 1:
    raise SystemExit(f"adjacent invoice deadline regex: expected one match, found {count}")
path.write_text(text.replace(old, new, 1))
