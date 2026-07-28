from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"Expected exactly one match in {path}, observed {count}: {old[:100]!r}")
    target.write_text(text.replace(old, new, 1), encoding="utf-8")


source = "lib/regulatory/registry-implementation-invocation.ts"
replace_once(
    source,
    "  authorizationId: string;\n  authorizationChecksum: string;\n  repositoryFullName: typeof EXPECTED_REPOSITORY;\n",
    "  authorizationId: string;\n"
    "  authorizationChecksum: string;\n"
    "  authorization: RegulatoryImplementationInvocationAuthorization;\n"
    "  repositoryFullName: typeof EXPECTED_REPOSITORY;\n",
)
replace_once(
    source,
    "  try {\n"
    "    const authorizedAt = new Date(\n"
    '      exactInstant(audit.authorizedAt, "Invocation audit authorizedAt")\n'
    "    ).getTime();\n",
    "  if (!audit.authorization || typeof audit.authorization !== \"object\") {\n"
    '    errors.push("Invocation audit authorization snapshot is invalid");\n'
    "  } else {\n"
    "    const authorizationErrors =\n"
    "      validateRegulatoryImplementationInvocationAuthorization(audit.authorization);\n"
    "    if (authorizationErrors.length > 0) {\n"
    '      errors.push("Invocation audit authorization snapshot does not reproduce");\n'
    "    }\n"
    "    if (\n"
    "      audit.authorizationChecksum !== audit.authorization.authorizationChecksum ||\n"
    "      audit.authorizationId !== audit.authorization.authorizationId ||\n"
    "      audit.repositoryFullName !== audit.authorization.repositoryFullName ||\n"
    "      audit.planId !== audit.authorization.planId ||\n"
    "      audit.planChecksum !== audit.authorization.planChecksum ||\n"
    "      audit.bundleId !== audit.authorization.bundleId ||\n"
    "      audit.bundleChecksum !== audit.authorization.bundleChecksum ||\n"
    "      audit.baseCommitSha !== audit.authorization.baseCommitSha ||\n"
    "      audit.targetBranch !== audit.authorization.targetBranch ||\n"
    "      audit.expectedExecutorPrincipal !==\n"
    "        audit.authorization.expectedExecutorPrincipal ||\n"
    "      audit.authorizedAt !== audit.authorization.authorizedAt\n"
    "    ) {\n"
    '      errors.push("Invocation audit fields do not match the authorization snapshot");\n'
    "    }\n"
    "  }\n"
    "  try {\n"
    "    const authorizedAt = new Date(\n"
    '      exactInstant(audit.authorizedAt, "Invocation audit authorizedAt")\n'
    "    ).getTime();\n",
)
replace_once(
    source,
    "    authorizationId: authorization.authorizationId,\n"
    "    authorizationChecksum: authorization.authorizationChecksum,\n"
    "    repositoryFullName: EXPECTED_REPOSITORY,\n",
    "    authorizationId: authorization.authorizationId,\n"
    "    authorizationChecksum: authorization.authorizationChecksum,\n"
    "    authorization: jsonClone(authorization),\n"
    "    repositoryFullName: EXPECTED_REPOSITORY,\n",
)

test = "lib/regulatory/__tests__/registry-implementation-invocation.test.mjs"
replace_once(
    test,
    "  authorizationId: storedAuthorization.authorizationId,\n"
    "  authorizationChecksum: storedAuthorization.authorizationChecksum,\n"
    '  repositoryFullName: "siricarsen-cmd/subshield",\n',
    "  authorizationId: storedAuthorization.authorizationId,\n"
    "  authorizationChecksum: storedAuthorization.authorizationChecksum,\n"
    "  authorization: storedAuthorization,\n"
    '  repositoryFullName: "siricarsen-cmd/subshield",\n',
)

doc = "docs/accuracy/regulatory-implementation-invocation-orchestration.md"
replace_once(
    doc,
    "- authorization, plan, bundle, base, branch, and expected-principal identities;\n",
    "- the complete checksum-valid but non-live authorization snapshot;\n"
    "- authorization, plan, bundle, base, branch, and expected-principal identities cross-checked against that snapshot;\n",
)
replace_once(
    doc,
    "Audit files are evidence only. They are not placed in the live authorization `WeakSet`, do not retain the original plan/bundle references, and cannot be loaded as execution authority.\n",
    "Audit files are evidence only. The authorization snapshot is serialized audit data, is not placed in the live authorization `WeakSet`, does not retain the original plan/bundle references, and cannot be loaded as execution authority.\n",
)

print("PR #60 authorization snapshot patch completed")
