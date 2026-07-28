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
    "const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;\n",
    "const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;\n"
    "const PRODUCTION_RESULT_STATUSES = new Set([\n"
    '  "preflight-refused",\n'
    '  "execution-failed",\n'
    '  "check-failed",\n'
    '  "push-failed",\n'
    '  "pull-request-failed",\n'
    '  "receipt-failed",\n'
    '  "success",\n'
    '  "production-boundary-failed",\n'
    "]);\n",
)
replace_once(
    source,
    '  if (!authorization.authorizationId.startsWith("regulatory-implementation-invocation:")) {\n'
    '    errors.push("Invocation authorization ID is invalid");\n'
    "  }\n",
    "  if (\n"
    "    authorization.authorizationId !==\n"
    '    `regulatory-implementation-invocation:${authorization.bundleChecksum}`\n'
    "  ) {\n"
    '    errors.push("Invocation authorization ID is invalid");\n'
    "  }\n",
)
replace_once(
    source,
    '  if (!audit.auditId.startsWith("regulatory-implementation-audit:")) {\n'
    '    errors.push("Invocation audit ID is invalid");\n'
    "  }\n",
    "  if (\n"
    "    audit.auditId !==\n"
    '    `regulatory-implementation-audit:${audit.authorizationChecksum}`\n'
    "  ) {\n"
    '    errors.push("Invocation audit ID is invalid");\n'
    "  }\n",
)
replace_once(
    source,
    "  if (\n"
    "    audit.repositoryFullName !== EXPECTED_REPOSITORY ||\n"
    "    !audit.authorizationId.trim() ||\n"
    "    !CHECKSUM_RE.test(audit.authorizationChecksum) ||\n"
    "    !CHECKSUM_RE.test(audit.planChecksum) ||\n"
    "    !CHECKSUM_RE.test(audit.bundleChecksum) ||\n"
    "    !COMMIT_SHA_RE.test(audit.baseCommitSha) ||\n"
    "    !audit.targetBranch.trim()\n"
    "  ) {\n"
    '    errors.push("Invocation audit provenance is invalid");\n'
    "  }\n",
    "  if (\n"
    "    audit.repositoryFullName !== EXPECTED_REPOSITORY ||\n"
    "    audit.authorizationId !==\n"
    '      `regulatory-implementation-invocation:${audit.bundleChecksum}` ||\n'
    "    !audit.planId.trim() ||\n"
    "    !audit.bundleId.trim() ||\n"
    "    !CHECKSUM_RE.test(audit.authorizationChecksum) ||\n"
    "    !CHECKSUM_RE.test(audit.planChecksum) ||\n"
    "    !CHECKSUM_RE.test(audit.bundleChecksum) ||\n"
    "    !COMMIT_SHA_RE.test(audit.baseCommitSha) ||\n"
    "    !audit.targetBranch.trim()\n"
    "  ) {\n"
    '    errors.push("Invocation audit provenance is invalid");\n'
    "  }\n",
)
replace_once(
    source,
    "  try {\n"
    '    exactInstant(audit.authorizedAt, "Invocation audit authorizedAt");\n'
    '    exactInstant(audit.recordedAt, "Invocation audit recordedAt");\n'
    "  } catch (error) {\n"
    "    errors.push(error instanceof Error ? error.message : String(error));\n"
    "  }\n",
    "  try {\n"
    "    const authorizedAt = new Date(\n"
    '      exactInstant(audit.authorizedAt, "Invocation audit authorizedAt")\n'
    "    ).getTime();\n"
    "    const recordedAt = new Date(\n"
    '      exactInstant(audit.recordedAt, "Invocation audit recordedAt")\n'
    "    ).getTime();\n"
    "    if (recordedAt < authorizedAt || recordedAt > Date.now() + MAX_CLOCK_SKEW_MS) {\n"
    '      errors.push("Invocation audit recording timestamp is invalid");\n'
    "    }\n"
    "    const login = normalizeGitHubLogin(\n"
    "      audit.expectedExecutorPrincipal.replace(/^github-user:/, \"\")\n"
    "    );\n"
    "    if (audit.expectedExecutorPrincipal !== `github-user:${login}`) {\n"
    '      errors.push("Invocation audit expected executor principal is invalid");\n'
    "    }\n"
    "  } catch (error) {\n"
    "    errors.push(error instanceof Error ? error.message : String(error));\n"
    "  }\n",
)
replace_once(
    source,
    '  if (!audit.result || typeof audit.result !== "object" || !("status" in audit.result)) {\n'
    '    errors.push("Invocation audit result is invalid");\n'
    "  }\n",
    "  if (!audit.result || typeof audit.result !== \"object\" || !(\"status\" in audit.result)) {\n"
    '    errors.push("Invocation audit result is invalid");\n'
    "  } else if (\n"
    "    !PRODUCTION_RESULT_STATUSES.has(audit.result.status) ||\n"
    '    audit.result.applicationStatus !== "not-applied" ||\n'
    '    audit.result.customerFacingStatus !== "benchmark-only" ||\n'
    '    audit.result.mergeStatus !== "not-authorized"\n'
    "  ) {\n"
    '    errors.push("Invocation audit production result escaped its controlled boundary");\n'
    "  }\n",
)
replace_once(
    source,
    "  CONSUMED_AUTHORIZATIONS.add(authorization as object);\n"
    "  const productionResult = await executeRegulatoryImplementationWithProductionAdapter(\n"
    "    plan,\n"
    "    bundle,\n"
    "    binding.productionOptions\n"
    "  );\n",
    "  CONSUMED_AUTHORIZATIONS.add(authorization as object);\n"
    "  let productionResult: RegulatoryImplementationProductionResult;\n"
    "  try {\n"
    "    productionResult = await executeRegulatoryImplementationWithProductionAdapter(\n"
    "      plan,\n"
    "      bundle,\n"
    "      binding.productionOptions\n"
    "    );\n"
    "  } catch {\n"
    "    productionResult = deepFreeze({\n"
    '      status: "production-boundary-failed" as const,\n'
    '      stage: "execution" as const,\n'
    '      errors: ["Controlled regulatory invocation production adapter failed unexpectedly"],\n'
    "      ...INVOCATION_BOUNDARY,\n"
    "    });\n"
    "  }\n",
)

test = "lib/regulatory/__tests__/registry-implementation-invocation.test.mjs"
replace_once(
    test,
    "pass(\n"
    "  validateRegulatoryImplementationInvocationAuthorization(tamperedAuthorization).some((error) =>\n"
    "    /checksum/i.test(error)\n"
    "  ),\n"
    '  "authorization tampering breaks its checksum"\n'
    ");\n",
    "pass(\n"
    "  validateRegulatoryImplementationInvocationAuthorization(tamperedAuthorization).some((error) =>\n"
    "    /checksum/i.test(error)\n"
    "  ),\n"
    '  "authorization tampering breaks its checksum"\n'
    ");\n"
    "const recomputedAuthorizationIdPayload = {\n"
    "  ...authorizationPayload,\n"
    '  authorizationId: "regulatory-implementation-invocation:forged",\n'
    "};\n"
    "const recomputedAuthorizationId = {\n"
    "  ...recomputedAuthorizationIdPayload,\n"
    "  authorizationChecksum: surface.checksumForAuthorization(\n"
    "    recomputedAuthorizationIdPayload\n"
    "  ),\n"
    "};\n"
    "pass(\n"
    "  validateRegulatoryImplementationInvocationAuthorization(\n"
    "    recomputedAuthorizationId\n"
    "  ).some((error) => /authorization ID/i.test(error)),\n"
    '  "checksum-consistent authorization ID forgery is refused"\n'
    ");\n",
)
replace_once(
    test,
    "equal(\n"
    "  validateRegulatoryImplementationInvocationAuditRecord(audit),\n"
    "  [],\n"
    '  "evidence-only invocation audit reproduces"\n'
    ");\n",
    "equal(\n"
    "  validateRegulatoryImplementationInvocationAuditRecord(audit),\n"
    "  [],\n"
    '  "evidence-only invocation audit reproduces"\n'
    ");\n"
    "for (const [mutation, pattern, message] of [\n"
    "  [\n"
    "    { auditId: \"regulatory-implementation-audit:forged\" },\n"
    "    /audit ID/i,\n"
    '    "checksum-consistent audit ID forgery is refused",\n'
    "  ],\n"
    "  [\n"
    '    { expectedExecutorPrincipal: "github-user:other-operator" },\n'
    "    /executor principal/i,\n"
    '    "checksum-consistent audit principal forgery is refused",\n'
    "  ],\n"
    "  [\n"
    "    {\n"
    "      result: {\n"
    "        ...auditPayload.result,\n"
    '        customerFacingStatus: "customer-facing",\n'
    "      },\n"
    "    },\n"
    "    /controlled boundary/i,\n"
    '    "checksum-consistent production-boundary forgery is refused",\n'
    "  ],\n"
    "]) {\n"
    "  const forgedPayload = { ...auditPayload, ...mutation };\n"
    "  const forgedAudit = {\n"
    "    ...forgedPayload,\n"
    "    auditChecksum: surface.checksumForAudit(forgedPayload),\n"
    "  };\n"
    "  pass(\n"
    "    validateRegulatoryImplementationInvocationAuditRecord(forgedAudit).some((error) =>\n"
    "      pattern.test(error)\n"
    "    ),\n"
    "    message\n"
    "  );\n"
    "}\n",
)
replace_once(
    test,
    '  [source.includes("CONSUMED_AUTHORIZATIONS.add"), "authorization is consumed before privileged execution"],\n',
    '  [source.includes("CONSUMED_AUTHORIZATIONS.add"), "authorization is consumed before privileged execution"],\n'
    '  [source.includes("production adapter failed unexpectedly"), "unexpected adapter failures remain structured"],\n',
)

doc = "docs/accuracy/regulatory-implementation-invocation-orchestration.md"
replace_once(
    doc,
    "The complete underlying production result is preserved. This includes a prior structured executor result when the production adapter reports cleanup failure after a branch or PR may already exist.\n",
    "The complete underlying production result is preserved. This includes a prior structured executor result when the production adapter reports cleanup failure after a branch or PR may already exist. An unexpected adapter throw is converted into a sanitized `production-boundary-failed` execution result so authorization consumption and audit handling remain explicit.\n",
)

print("PR #60 evidence hardening patch completed")
