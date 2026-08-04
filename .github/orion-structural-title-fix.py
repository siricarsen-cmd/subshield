from pathlib import Path

path = Path('.github/orion-structural-final-patch.py')
text = path.read_text()
old = r'prime\s+contract(?:\s+excerpts?)?'
new = r'prime\s+contract(?:\s+flow[\s-]?down\s+(?:matrix|matrices)|\s+excerpts?)?'
index = text.rfind(old)
if index < 0:
    raise SystemExit('complete Prime Contract Flow-Down Matrix title marker not found')
path.write_text(text[:index] + new + text[index + len(old):])
