from pathlib import Path

path = Path(".github/orion-final-three-patch.py")
text = path.read_text()
old = r'''  const otherInvoiceBoundary = String.raw`\\binvoice\\s+(?:no\\.?\\s*)?[A-Z0-9-]*\\d[A-Z0-9-]*\\b`;'''
new = r'''  const otherInvoiceBoundary = String.raw`\binvoice\s+(?:no\.?\s*)?[A-Z0-9-]*\d[A-Z0-9-]*\b`;'''
if text.count(old) != 1:
    raise SystemExit(f"invoice boundary builder literal: expected one match, found {text.count(old)}")
path.write_text(text.replace(old, new, 1))
