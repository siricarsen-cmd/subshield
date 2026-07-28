from pathlib import Path

path = Path("lib/regulatory/__tests__/registry-implementation-invocation.test.mjs")
text = path.read_text(encoding="utf-8")
old = '''  [
    { expectedExecutorPrincipal: "github-user:other-operator" },
    /executor principal/i,
    "checksum-consistent audit principal forgery is refused",
  ],
'''
new = '''  [
    { expectedExecutorPrincipal: "github-user:other-operator" },
    /authorization snapshot/i,
    "checksum-consistent audit principal forgery is refused",
  ],
'''
if text.count(old) != 1:
    raise SystemExit("Expected exactly one audit principal assertion pattern")
path.write_text(text.replace(old, new, 1), encoding="utf-8")
print("PR #60 test pattern corrected")
