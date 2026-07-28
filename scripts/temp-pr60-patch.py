from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"Expected exactly one match in {path}, observed {count}: {old[:80]!r}")
    target.write_text(text.replace(old, new, 1), encoding="utf-8")


adapter = "lib/regulatory/registry-implementation-production-adapter.ts"
replace_once(
    adapter,
    'const CHECKSUM_RE = /^sha256:[a-f0-9]{64}$/;\n',
    'const CHECKSUM_RE = /^sha256:[a-f0-9]{64}$/;\n'
    'const GITHUB_LOGIN_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;\n',
)
replace_once(
    adapter,
    '  "lib/regulatory/__tests__/registry-implementation-production-adapter.test.mjs",\n',
    '  "lib/regulatory/__tests__/registry-implementation-production-adapter.test.mjs",\n'
    '  "lib/regulatory/__tests__/registry-implementation-invocation.test.mjs",\n',
)
replace_once(
    adapter,
    '  /** Canonical absolute real directory containing the authenticated gh host config. */\n'
    '  githubCliConfigDir: string;\n',
    '  /** Canonical absolute real directory containing the authenticated gh host config. */\n'
    '  githubCliConfigDir: string;\n'
    '  /** Exact github.com login deliberately authorized to perform this invocation. */\n'
    '  expectedGitHubLogin: string;\n',
)
replace_once(
    adapter,
    'function normalizedJson<T>(value: string, label: string): T {\n',
    'function normalizeGitHubLogin(value: string): string {\n'
    '  const normalized = value.trim().toLowerCase();\n'
    '  if (normalized !== value.toLowerCase() || !GITHUB_LOGIN_RE.test(normalized)) {\n'
    '    throw new Error("Controlled production adapter authenticated principal is invalid");\n'
    '  }\n'
    '  return normalized;\n'
    '}\n\n'
    'function normalizedJson<T>(value: string, label: string): T {\n',
)
replace_once(
    adapter,
    '  private readonly requiredChecks: readonly string[];\n',
    '  private readonly requiredChecks: readonly string[];\n'
    '  private readonly expectedGitHubLogin: string;\n',
)
replace_once(
    adapter,
    '    this.requiredChecks = [...bundle.requiredChecks];\n',
    '    this.requiredChecks = [...bundle.requiredChecks];\n'
    '    this.expectedGitHubLogin = normalizeGitHubLogin(options.expectedGitHubLogin);\n',
)
replace_once(
    adapter,
    '    if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(login)) {\n'
    '      throw new Error("Controlled production adapter authenticated principal is invalid");\n'
    '    }\n',
    '    const normalizedLogin = normalizeGitHubLogin(login);\n'
    '    if (normalizedLogin !== this.expectedGitHubLogin) {\n'
    '      throw new Error(\n'
    '        "Controlled production adapter authenticated principal does not match the authorized operator"\n'
    '      );\n'
    '    }\n',
)
replace_once(
    adapter,
    '    this.trustedPrincipal = `github-user:${login.toLowerCase()}`;\n',
    '    this.trustedPrincipal = `github-user:${normalizedLogin}`;\n',
)
replace_once(
    adapter,
    '  normalizeOriginUrl,\n  normalizeGitHubInstant,\n',
    '  normalizeGitHubLogin,\n  normalizeOriginUrl,\n  normalizeGitHubInstant,\n',
)

package = "package.json"
replace_once(
    package,
    '    "test:regulatory:implementation-production-adapter": "node --experimental-loader ./lib/analyzer/__tests__/ts-relative-import.loader.mjs lib/regulatory/__tests__/registry-implementation-production-adapter.test.mjs",\n',
    '    "test:regulatory:implementation-production-adapter": "node --experimental-loader ./lib/analyzer/__tests__/ts-relative-import.loader.mjs lib/regulatory/__tests__/registry-implementation-production-adapter.test.mjs",\n'
    '    "test:regulatory:implementation-invocation": "node --experimental-loader ./lib/analyzer/__tests__/ts-relative-import.loader.mjs lib/regulatory/__tests__/registry-implementation-invocation.test.mjs",\n',
)
replace_once(
    package,
    ' && npm run test:regulatory:implementation-production-adapter",\n',
    ' && npm run test:regulatory:implementation-production-adapter && npm run test:regulatory:implementation-invocation",\n',
)

doc = "docs/accuracy/regulatory-implementation-production-adapter.md"
replace_once(
    doc,
    '- the GitHub CLI configuration directory containing the operator’s authenticated `github.com` context.\n',
    '- the GitHub CLI configuration directory containing the operator’s authenticated `github.com` context;\n'
    '- the exact expected GitHub login deliberately bound by the invocation authorization.\n',
)
replace_once(
    doc,
    '- authenticated repository permission of `WRITE`, `MAINTAIN`, or `ADMIN`;\n- a nonblank validated GitHub login.\n',
    '- authenticated repository permission of `WRITE`, `MAINTAIN`, or `ADMIN`;\n'
    '- a nonblank validated GitHub login;\n'
    '- an exact case-normalized match between that authenticated login and the expected login bound by the invocation authorization.\n',
)

test = "lib/regulatory/__tests__/registry-implementation-invocation.test.mjs"
replace_once(
    test,
    'adapterSource.includes("login.toLowerCase() !== this.expectedGitHubLogin")',
    'adapterSource.includes("normalizedLogin !== this.expectedGitHubLogin")',
)

print("PR #60 temporary patch completed")
