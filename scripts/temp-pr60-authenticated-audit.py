from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"Expected exactly one match in {path}, observed {count}: {old[:140]!r}")
    target.write_text(text.replace(old, new, 1), encoding="utf-8")


source = "lib/regulatory/registry-implementation-invocation.ts"
replace_once(
    source,
    'import { createHash } from "node:crypto";\n',
    'import { createHash, createHmac, timingSafeEqual } from "node:crypto";\n',
)
replace_once(
    source,
    'const AUDIT_FILENAME_RE = /^[a-f0-9]{24}-invocation-audit\\.json$/;\n',
    'const AUDIT_FILENAME_RE = /^[a-f0-9]{24}-invocation-audit\\.json$/;\n'
    'const HMAC_TAG_RE = /^hmac-sha256:[a-f0-9]{64}$/;\n',
)
replace_once(
    source,
    '  auditOutputDirectory: string;\n  confirmation: string;\n',
    '  auditOutputDirectory: string;\n'
    '  /** Secret audit-authentication key retained only in protected process memory. */\n'
    '  auditAuthenticationKey: Uint8Array;\n'
    '  confirmation: string;\n',
)
replace_once(
    source,
    '  runtimeFingerprint: string;\n  confirmationFingerprint: string;\n',
    '  runtimeFingerprint: string;\n'
    '  auditAuthenticationKeyId: string;\n'
    '  confirmationFingerprint: string;\n',
)
replace_once(
    source,
    'export interface RegulatoryImplementationInvocationAuditRecord extends InvocationBoundary {\n',
    'export interface RegulatoryImplementationInvocationAuditAuthentication {\n'
    '  algorithm: "hmac-sha256";\n'
    '  keyId: string;\n'
    '  tag: string;\n'
    '}\n\n'
    'export interface RegulatoryImplementationInvocationAuditRecord extends InvocationBoundary {\n',
)
replace_once(
    source,
    '  auditStatus: "evidence-only-not-execution-authority";\n  auditChecksum: string;\n',
    '  auditStatus: "evidence-only-not-execution-authority";\n'
    '  auditChecksum: string;\n'
    '  auditAuthentication: RegulatoryImplementationInvocationAuditAuthentication;\n',
)
replace_once(
    source,
    '  productionOptions: RegulatoryImplementationProductionOptions;\n  auditOutputDirectory: string;\n',
    '  productionOptions: RegulatoryImplementationProductionOptions;\n'
    '  auditOutputDirectory: string;\n'
    '  auditAuthenticationKey: Buffer;\n',
)
replace_once(
    source,
    '''function sha256(value: string): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}
''',
    '''function sha256(value: string): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function copyAuditAuthenticationKey(value: unknown): Buffer {
  if (!(value instanceof Uint8Array) || value.byteLength < 32 || value.byteLength > 4096) {
    throw new Error("Invocation audit authentication key must contain 32 to 4096 bytes");
  }
  return Buffer.from(value);
}

function auditAuthenticationKeyIdFor(value: Uint8Array): string {
  if (!(value instanceof Uint8Array) || value.byteLength < 32 || value.byteLength > 4096) {
    throw new Error("Invocation audit authentication key must contain 32 to 4096 bytes");
  }
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}
''',
)
old_audit_helpers = '''function auditPayload(
  audit:
    | Omit<RegulatoryImplementationInvocationAuditRecord, "auditChecksum">
    | RegulatoryImplementationInvocationAuditRecord
): Omit<RegulatoryImplementationInvocationAuditRecord, "auditChecksum"> {
  const { auditChecksum: _ignored, ...payload } =
    audit as RegulatoryImplementationInvocationAuditRecord;
  return jsonClone(payload);
}

function checksumForAudit(
  audit:
    | Omit<RegulatoryImplementationInvocationAuditRecord, "auditChecksum">
    | RegulatoryImplementationInvocationAuditRecord
): string {
  return fingerprint(auditPayload(audit));
}

function runtimeFingerprintFor(
  options: RegulatoryImplementationProductionOptions,
  auditOutputDirectory: string
): string {
  return fingerprint({
    repositoryRoot: options.repositoryRoot,
    gitExecutable: options.gitExecutable,
    githubCliExecutable: options.githubCliExecutable,
    githubCliConfigDir: options.githubCliConfigDir,
    auditOutputDirectory,
    expectedGitHubLogin: options.expectedGitHubLogin,
  });
}
'''
new_audit_helpers = '''function auditPayload(audit: unknown): UnknownRecord {
  if (!isRecord(audit)) throw new Error("Invocation audit payload is invalid");
  const {
    auditChecksum: _ignoredChecksum,
    auditAuthentication: _ignoredAuthentication,
    ...payload
  } = audit;
  return jsonClone(payload);
}

function checksumForAudit(audit: unknown): string {
  return fingerprint(auditPayload(audit));
}

function auditAuthenticationPayload(audit: unknown): UnknownRecord {
  if (!isRecord(audit)) throw new Error("Invocation audit authentication payload is invalid");
  const { auditAuthentication: _ignoredAuthentication, ...payload } = audit;
  return jsonClone(payload);
}

function buildAuditAuthentication(
  audit: unknown,
  auditAuthenticationKey: Uint8Array
): RegulatoryImplementationInvocationAuditAuthentication {
  const key = copyAuditAuthenticationKey(auditAuthenticationKey);
  try {
    const keyId = auditAuthenticationKeyIdFor(key);
    const tag = `hmac-sha256:${createHmac("sha256", key)
      .update(fingerprint(auditAuthenticationPayload(audit)))
      .digest("hex")}`;
    return deepFreeze({ algorithm: "hmac-sha256" as const, keyId, tag });
  } finally {
    key.fill(0);
  }
}

function validateAuditAuthentication(
  audit: RegulatoryImplementationInvocationAuditRecord,
  auditAuthenticationKey: Uint8Array
): string[] {
  const errors: string[] = [];
  let key: Buffer | undefined;
  try {
    key = copyAuditAuthenticationKey(auditAuthenticationKey);
    const expectedKeyId = auditAuthenticationKeyIdFor(key);
    if (
      !audit.auditAuthentication ||
      typeof audit.auditAuthentication !== "object" ||
      audit.auditAuthentication.algorithm !== "hmac-sha256" ||
      audit.auditAuthentication.keyId !== expectedKeyId ||
      audit.authorization.auditAuthenticationKeyId !== expectedKeyId ||
      !HMAC_TAG_RE.test(audit.auditAuthentication.tag)
    ) {
      errors.push("Invocation audit authentication metadata is invalid");
      return errors;
    }
    const expected = buildAuditAuthentication(audit, key).tag;
    const actualBytes = Buffer.from(audit.auditAuthentication.tag, "utf8");
    const expectedBytes = Buffer.from(expected, "utf8");
    if (
      actualBytes.length !== expectedBytes.length ||
      !timingSafeEqual(actualBytes, expectedBytes)
    ) {
      errors.push("Invocation audit authentication tag does not reproduce");
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  } finally {
    key?.fill(0);
  }
  return [...new Set(errors)];
}

function runtimeFingerprintFor(
  options: RegulatoryImplementationProductionOptions,
  auditOutputDirectory: string,
  auditAuthenticationKeyId: string
): string {
  return fingerprint({
    repositoryRoot: options.repositoryRoot,
    gitExecutable: options.gitExecutable,
    githubCliExecutable: options.githubCliExecutable,
    githubCliConfigDir: options.githubCliConfigDir,
    auditOutputDirectory,
    expectedGitHubLogin: options.expectedGitHubLogin,
    auditAuthenticationKeyId,
  });
}
'''
replace_once(source, old_audit_helpers, new_audit_helpers)
replace_once(
    source,
    '''export function buildRegulatoryImplementationInvocationConfirmation(
  plan: RegulatoryRegistryImplementationPlan,
  bundle: RegulatoryImplementationPullRequestBundle
): string {
''',
    '''export function buildRegulatoryImplementationInvocationConfirmation(
  plan: RegulatoryRegistryImplementationPlan,
  bundle: RegulatoryImplementationPullRequestBundle,
  auditAuthenticationKey: Uint8Array
): string {
''',
)
replace_once(
    source,
    '    `branch=${plan.targetBranch}`,\n',
    '    `branch=${plan.targetBranch}`,\n'
    '    `audit-key=${auditAuthenticationKeyIdFor(auditAuthenticationKey)}`,\n',
)
replace_once(
    source,
    '    !CHECKSUM_RE.test(authorization.runtimeFingerprint) ||\n    !CHECKSUM_RE.test(authorization.confirmationFingerprint) ||\n',
    '    !CHECKSUM_RE.test(authorization.runtimeFingerprint) ||\n'
    '    !CHECKSUM_RE.test(authorization.auditAuthenticationKeyId) ||\n'
    '    !CHECKSUM_RE.test(authorization.confirmationFingerprint) ||\n',
)
create_start = '''  const expectedConfirmation = buildRegulatoryImplementationInvocationConfirmation(plan, bundle);
  if (request.confirmation !== expectedConfirmation) {
    throw new Error("Invocation requires the exact plan-and-bundle-bound operator confirmation");
  }
  const productionOptions: RegulatoryImplementationProductionOptions = {
    repositoryRoot,
    gitExecutable,
    githubCliExecutable,
    githubCliConfigDir,
    expectedGitHubLogin,
  };
  const runtimeFingerprint = runtimeFingerprintFor(productionOptions, auditOutputDirectory);
  const payload: Omit<
    RegulatoryImplementationInvocationAuthorization,
    "authorizationChecksum"
  > = {
    schemaVersion: 1,
    authorizationId: `regulatory-implementation-invocation:${bundle.bundleChecksum}`,
    repositoryFullName: EXPECTED_REPOSITORY,
    defaultBranch: EXPECTED_DEFAULT_BRANCH,
    planId: plan.planId,
    planChecksum: plan.planChecksum,
    bundleId: bundle.bundleId,
    bundleChecksum: bundle.bundleChecksum,
    baseCommitSha: plan.baseCommitSha,
    targetBranch: plan.targetBranch,
    expectedExecutorPrincipal: `github-user:${expectedGitHubLogin}`,
    authorizedAt,
    runtimeFingerprint,
    confirmationFingerprint: sha256(request.confirmation),
    authorizationStatus: "live-one-use-operator-authorization",
    ...INVOCATION_BOUNDARY,
  };
  const authorization: RegulatoryImplementationInvocationAuthorization = {
    ...payload,
    authorizationChecksum: checksumForAuthorization(payload),
  };
  const errors = validateRegulatoryImplementationInvocationAuthorization(authorization);
  if (errors.length > 0) {
    throw new Error(`Built invocation authorization failed validation: ${errors.join("; ")}`);
  }
  const frozen = deepFreeze(authorization);
  LIVE_AUTHORIZATIONS.add(frozen as object);
  AUTHORIZATION_BINDINGS.set(frozen as object, {
    plan,
    bundle,
    productionOptions,
    auditOutputDirectory,
  });
  return frozen;
'''
create_replacement = '''  const auditAuthenticationKey = copyAuditAuthenticationKey(request.auditAuthenticationKey);
  try {
    const auditAuthenticationKeyId = auditAuthenticationKeyIdFor(auditAuthenticationKey);
    const expectedConfirmation = buildRegulatoryImplementationInvocationConfirmation(
      plan,
      bundle,
      auditAuthenticationKey
    );
    if (request.confirmation !== expectedConfirmation) {
      throw new Error("Invocation requires the exact plan-and-bundle-bound operator confirmation");
    }
    const productionOptions: RegulatoryImplementationProductionOptions = {
      repositoryRoot,
      gitExecutable,
      githubCliExecutable,
      githubCliConfigDir,
      expectedGitHubLogin,
    };
    const runtimeFingerprint = runtimeFingerprintFor(
      productionOptions,
      auditOutputDirectory,
      auditAuthenticationKeyId
    );
    const payload: Omit<
      RegulatoryImplementationInvocationAuthorization,
      "authorizationChecksum"
    > = {
      schemaVersion: 1,
      authorizationId: `regulatory-implementation-invocation:${bundle.bundleChecksum}`,
      repositoryFullName: EXPECTED_REPOSITORY,
      defaultBranch: EXPECTED_DEFAULT_BRANCH,
      planId: plan.planId,
      planChecksum: plan.planChecksum,
      bundleId: bundle.bundleId,
      bundleChecksum: bundle.bundleChecksum,
      baseCommitSha: plan.baseCommitSha,
      targetBranch: plan.targetBranch,
      expectedExecutorPrincipal: `github-user:${expectedGitHubLogin}`,
      authorizedAt,
      runtimeFingerprint,
      auditAuthenticationKeyId,
      confirmationFingerprint: sha256(request.confirmation),
      authorizationStatus: "live-one-use-operator-authorization",
      ...INVOCATION_BOUNDARY,
    };
    const authorization: RegulatoryImplementationInvocationAuthorization = {
      ...payload,
      authorizationChecksum: checksumForAuthorization(payload),
    };
    const errors = validateRegulatoryImplementationInvocationAuthorization(authorization);
    if (errors.length > 0) {
      throw new Error(`Built invocation authorization failed validation: ${errors.join("; ")}`);
    }
    const frozen = deepFreeze(authorization);
    LIVE_AUTHORIZATIONS.add(frozen as object);
    AUTHORIZATION_BINDINGS.set(frozen as object, {
      plan,
      bundle,
      productionOptions,
      auditOutputDirectory,
      auditAuthenticationKey,
    });
    return frozen;
  } catch (error) {
    auditAuthenticationKey.fill(0);
    throw error;
  }
'''
replace_once(source, create_start, create_replacement)
replace_once(
    source,
    '''export function validateRegulatoryImplementationInvocationAuditRecord(
  audit: RegulatoryImplementationInvocationAuditRecord
): string[] {
''',
    '''export function validateRegulatoryImplementationInvocationAuditRecord(
  audit: RegulatoryImplementationInvocationAuditRecord,
  auditAuthenticationKey: Uint8Array
): string[] {
''',
)
replace_once(
    source,
    '    if (recordedAt < authorizedAt || recordedAt > Date.now() + MAX_CLOCK_SKEW_MS) {\n',
    '    if (recordedAt + MAX_CLOCK_SKEW_MS < authorizedAt || recordedAt > Date.now() + MAX_CLOCK_SKEW_MS) {\n',
)
replace_once(
    source,
    '''  if (!CHECKSUM_RE.test(audit.auditChecksum) || audit.auditChecksum !== checksumForAudit(audit)) {
    errors.push("Invocation audit checksum does not reproduce");
  }
  return [...new Set(errors)];
}
''',
    '''  if (!CHECKSUM_RE.test(audit.auditChecksum) || audit.auditChecksum !== checksumForAudit(audit)) {
    errors.push("Invocation audit checksum does not reproduce");
  }
  errors.push(...validateAuditAuthentication(audit, auditAuthenticationKey));
  return [...new Set(errors)];
}
''',
)
old_build = '''function buildAuditRecord(
  authorization: RegulatoryImplementationInvocationAuthorization,
  result: RegulatoryImplementationProductionResult
): Readonly<RegulatoryImplementationInvocationAuditRecord> {
  const payload: Omit<RegulatoryImplementationInvocationAuditRecord, "auditChecksum"> = {
    schemaVersion: 1,
    auditId: `regulatory-implementation-audit:${authorization.authorizationChecksum}`,
    authorizationId: authorization.authorizationId,
    authorizationChecksum: authorization.authorizationChecksum,
    authorization: jsonClone(authorization),
    repositoryFullName: EXPECTED_REPOSITORY,
    planId: authorization.planId,
    planChecksum: authorization.planChecksum,
    bundleId: authorization.bundleId,
    bundleChecksum: authorization.bundleChecksum,
    baseCommitSha: authorization.baseCommitSha,
    targetBranch: authorization.targetBranch,
    expectedExecutorPrincipal: authorization.expectedExecutorPrincipal,
    authorizedAt: authorization.authorizedAt,
    recordedAt: new Date().toISOString(),
    recordedAtSource: "operator-clock-audit-only",
    result: jsonClone(result),
    auditStatus: "evidence-only-not-execution-authority",
    ...INVOCATION_BOUNDARY,
  };
  const audit: RegulatoryImplementationInvocationAuditRecord = {
    ...payload,
    auditChecksum: checksumForAudit(payload),
  };
  const errors = validateRegulatoryImplementationInvocationAuditRecord(audit);
  if (errors.length > 0) {
    throw new Error(`Invocation audit failed validation: ${errors.join("; ")}`);
  }
  return deepFreeze(audit);
}
'''
new_build = '''function buildAuditRecord(
  authorization: RegulatoryImplementationInvocationAuthorization,
  result: RegulatoryImplementationProductionResult,
  auditAuthenticationKey: Uint8Array
): Readonly<RegulatoryImplementationInvocationAuditRecord> {
  const payload: Omit<
    RegulatoryImplementationInvocationAuditRecord,
    "auditChecksum" | "auditAuthentication"
  > = {
    schemaVersion: 1,
    auditId: `regulatory-implementation-audit:${authorization.authorizationChecksum}`,
    authorizationId: authorization.authorizationId,
    authorizationChecksum: authorization.authorizationChecksum,
    authorization: jsonClone(authorization),
    repositoryFullName: EXPECTED_REPOSITORY,
    planId: authorization.planId,
    planChecksum: authorization.planChecksum,
    bundleId: authorization.bundleId,
    bundleChecksum: authorization.bundleChecksum,
    baseCommitSha: authorization.baseCommitSha,
    targetBranch: authorization.targetBranch,
    expectedExecutorPrincipal: authorization.expectedExecutorPrincipal,
    authorizedAt: authorization.authorizedAt,
    recordedAt: new Date().toISOString(),
    recordedAtSource: "operator-clock-audit-only",
    result: jsonClone(result),
    auditStatus: "evidence-only-not-execution-authority",
    ...INVOCATION_BOUNDARY,
  };
  const withChecksum: Omit<
    RegulatoryImplementationInvocationAuditRecord,
    "auditAuthentication"
  > = {
    ...payload,
    auditChecksum: checksumForAudit(payload),
  };
  const audit: RegulatoryImplementationInvocationAuditRecord = {
    ...withChecksum,
    auditAuthentication: buildAuditAuthentication(withChecksum, auditAuthenticationKey),
  };
  const errors = validateRegulatoryImplementationInvocationAuditRecord(
    audit,
    auditAuthenticationKey
  );
  if (errors.length > 0) {
    throw new Error(`Invocation audit failed validation: ${errors.join("; ")}`);
  }
  return deepFreeze(audit);
}
'''
replace_once(source, old_build, new_build)
replace_once(
    source,
    '''  const runtimeFingerprint = runtimeFingerprintFor(
    binding.productionOptions,
    binding.auditOutputDirectory
  );
''',
    '''  const runtimeFingerprint = runtimeFingerprintFor(
    binding.productionOptions,
    binding.auditOutputDirectory,
    authorization.auditAuthenticationKeyId
  );
''',
)
old_execute = '''  CONSUMED_AUTHORIZATIONS.add(authorization as object);
  let productionResult: RegulatoryImplementationProductionResult;
  try {
    productionResult = await executeRegulatoryImplementationWithProductionAdapter(
      plan,
      bundle,
      binding.productionOptions
    );
  } catch {
    productionResult = deepFreeze({
      status: "production-boundary-failed" as const,
      stage: "execution" as const,
      errors: ["Controlled regulatory invocation production adapter failed unexpectedly"],
      ...INVOCATION_BOUNDARY,
    });
  }
  let auditRecord: Readonly<RegulatoryImplementationInvocationAuditRecord>;
  try {
    auditRecord = buildAuditRecord(authorization, productionResult);
  } catch {
    return deepFreeze({
      status: "audit-retention-failed" as const,
      authorizationStatus: "consumed" as const,
      productionResult,
      errors: ["Invocation result was preserved, but the audit record could not be constructed"],
      ...INVOCATION_BOUNDARY,
    });
  }

  try {
    const auditPath = await storeAuditRecord(binding.auditOutputDirectory, auditRecord);
    return deepFreeze({
      status:
        productionResult.status === "success"
          ? ("invocation-succeeded" as const)
          : ("invocation-failed" as const),
      authorizationStatus: "consumed" as const,
      productionResult,
      auditRecord,
      auditPath,
      ...INVOCATION_BOUNDARY,
    });
  } catch {
    return deepFreeze({
      status: "audit-retention-failed" as const,
      authorizationStatus: "consumed" as const,
      productionResult,
      auditRecord,
      errors: ["Invocation result was preserved, but the evidence-only audit file was not retained"],
      ...INVOCATION_BOUNDARY,
    });
  }
'''
new_execute = '''  CONSUMED_AUTHORIZATIONS.add(authorization as object);
  try {
    let productionResult: RegulatoryImplementationProductionResult;
    try {
      productionResult = await executeRegulatoryImplementationWithProductionAdapter(
        plan,
        bundle,
        binding.productionOptions
      );
    } catch {
      productionResult = deepFreeze({
        status: "production-boundary-failed" as const,
        stage: "execution" as const,
        errors: ["Controlled regulatory invocation production adapter failed unexpectedly"],
        ...INVOCATION_BOUNDARY,
      });
    }
    let auditRecord: Readonly<RegulatoryImplementationInvocationAuditRecord>;
    try {
      auditRecord = buildAuditRecord(
        authorization,
        productionResult,
        binding.auditAuthenticationKey
      );
    } catch {
      return deepFreeze({
        status: "audit-retention-failed" as const,
        authorizationStatus: "consumed" as const,
        productionResult,
        errors: ["Invocation result was preserved, but the audit record could not be constructed"],
        ...INVOCATION_BOUNDARY,
      });
    }

    try {
      const auditPath = await storeAuditRecord(binding.auditOutputDirectory, auditRecord);
      return deepFreeze({
        status:
          productionResult.status === "success"
            ? ("invocation-succeeded" as const)
            : ("invocation-failed" as const),
        authorizationStatus: "consumed" as const,
        productionResult,
        auditRecord,
        auditPath,
        ...INVOCATION_BOUNDARY,
      });
    } catch {
      return deepFreeze({
        status: "audit-retention-failed" as const,
        authorizationStatus: "consumed" as const,
        productionResult,
        auditRecord,
        errors: ["Invocation result was preserved, but the evidence-only audit file was not retained"],
        ...INVOCATION_BOUNDARY,
      });
    }
  } finally {
    binding.auditAuthenticationKey.fill(0);
    AUTHORIZATION_BINDINGS.delete(authorization as object);
  }
'''
replace_once(source, old_execute, new_execute)
replace_once(
    source,
    '  auditPayload,\n  checksumForAudit,\n',
    '  auditPayload,\n'
    '  checksumForAudit,\n'
    '  auditAuthenticationKeyIdFor,\n'
    '  buildAuditAuthentication,\n'
    '  validateAuditAuthentication,\n',
)

test = "lib/regulatory/__tests__/registry-implementation-invocation.test.mjs"
replace_once(
    test,
    'const checksum = (character) => `sha256:${character.repeat(64)}`;\n',
    'const checksum = (character) => `sha256:${character.repeat(64)}`;\n'
    'const auditAuthenticationKey = new Uint8Array(32).fill(7);\n'
    'const wrongAuditAuthenticationKey = new Uint8Array(32).fill(8);\n',
)
replace_once(
    test,
    '''const confirmation = buildRegulatoryImplementationInvocationConfirmation(
  fakePlan,
  fakeBundle
);
''',
    '''const confirmation = buildRegulatoryImplementationInvocationConfirmation(
  fakePlan,
  fakeBundle,
  auditAuthenticationKey
);
''',
)
replace_once(
    test,
    '  `AUTHORIZE SUBSHIELD REGULATORY IMPLEMENTATION PR plan=${fakePlan.planChecksum} bundle=${fakeBundle.bundleChecksum} base=${fakePlan.baseCommitSha} branch=${fakePlan.targetBranch}`,\n'
    '  "operator confirmation binds the exact plan, bundle, base, and target branch"\n',
    '  `AUTHORIZE SUBSHIELD REGULATORY IMPLEMENTATION PR plan=${fakePlan.planChecksum} bundle=${fakeBundle.bundleChecksum} base=${fakePlan.baseCommitSha} branch=${fakePlan.targetBranch} audit-key=${surface.auditAuthenticationKeyIdFor(auditAuthenticationKey)}`,\n'
    '  "operator confirmation binds the exact plan, bundle, base, branch, and external audit key"\n',
)
replace_once(
    test,
    '  runtimeFingerprint: checksum("d"),\n  confirmationFingerprint: checksum("e"),\n',
    '  runtimeFingerprint: checksum("d"),\n'
    '  auditAuthenticationKeyId: surface.auditAuthenticationKeyIdFor(auditAuthenticationKey),\n'
    '  confirmationFingerprint: checksum("e"),\n',
)
replace_once(
    test,
    '''const audit = {
  ...auditPayload,
  auditChecksum: surface.checksumForAudit(auditPayload),
};
equal(
  validateRegulatoryImplementationInvocationAuditRecord(audit),
''',
    '''const auditWithChecksum = {
  ...auditPayload,
  auditChecksum: surface.checksumForAudit(auditPayload),
};
const audit = {
  ...auditWithChecksum,
  auditAuthentication: surface.buildAuditAuthentication(
    auditWithChecksum,
    auditAuthenticationKey
  ),
};
equal(
  validateRegulatoryImplementationInvocationAuditRecord(audit, auditAuthenticationKey),
''',
)
replace_once(
    test,
    '''  const forgedAudit = {
    ...forgedPayload,
    auditChecksum: surface.checksumForAudit(forgedPayload),
  };
  pass(
    validateRegulatoryImplementationInvocationAuditRecord(forgedAudit).some((error) =>
''',
    '''  const forgedWithChecksum = {
    ...forgedPayload,
    auditChecksum: surface.checksumForAudit(forgedPayload),
  };
  const forgedAudit = {
    ...forgedWithChecksum,
    auditAuthentication: surface.buildAuditAuthentication(
      forgedWithChecksum,
      auditAuthenticationKey
    ),
  };
  pass(
    validateRegulatoryImplementationInvocationAuditRecord(
      forgedAudit,
      auditAuthenticationKey
    ).some((error) =>
''',
)
insert_after_forgery_loop = '''}


for (const [candidate, pattern, message] of [
'''
hmac_tests = '''}

const fileOnlyTamperedPayload = {
  ...auditPayload,
  result: {
    ...auditPayload.result,
    errors: ["forged retained result"],
  },
};
const fileOnlyTamperedWithChecksum = {
  ...fileOnlyTamperedPayload,
  auditChecksum: surface.checksumForAudit(fileOnlyTamperedPayload),
};
const fileOnlyTamperedAudit = {
  ...fileOnlyTamperedWithChecksum,
  auditAuthentication: audit.auditAuthentication,
};
pass(
  validateRegulatoryImplementationInvocationAuditRecord(
    fileOnlyTamperedAudit,
    auditAuthenticationKey
  ).some((error) => /authentication tag/i.test(error)),
  "file-only tampering cannot reproduce the external audit authentication tag"
);
pass(
  validateRegulatoryImplementationInvocationAuditRecord(
    audit,
    wrongAuditAuthenticationKey
  ).some((error) => /authentication/i.test(error)),
  "an unrelated key cannot authenticate retained audit evidence"
);
const skewedPayload = {
  ...auditPayload,
  recordedAt: "2026-07-27T19:57:00.000Z",
};
const skewedWithChecksum = {
  ...skewedPayload,
  auditChecksum: surface.checksumForAudit(skewedPayload),
};
const skewedAudit = {
  ...skewedWithChecksum,
  auditAuthentication: surface.buildAuditAuthentication(
    skewedWithChecksum,
    auditAuthenticationKey
  ),
};
equal(
  validateRegulatoryImplementationInvocationAuditRecord(
    skewedAudit,
    auditAuthenticationKey
  ),
  [],
  "audit recording accepts the same five-minute clock skew as authorization"
);

for (const [candidate, pattern, message] of [
'''
replace_once(test, insert_after_forgery_loop, hmac_tests)
replace_once(
    test,
    '      auditOutputDirectory: auditDirectory,\n      confirmation,\n',
    '      auditOutputDirectory: auditDirectory,\n'
    '      auditAuthenticationKey,\n'
    '      confirmation,\n',
)
replace_once(
    test,
    '    validateRegulatoryImplementationInvocationAuditRecord(invocation.auditRecord),\n',
    '    validateRegulatoryImplementationInvocationAuditRecord(\n'
    '      invocation.auditRecord,\n'
    '      auditAuthenticationKey\n'
    '    ),\n',
)
replace_once(
    test,
    '    validateRegulatoryImplementationInvocationAuditRecord(storedAudit),\n',
    '    validateRegulatoryImplementationInvocationAuditRecord(\n'
    '      storedAudit,\n'
    '      auditAuthenticationKey\n'
    '    ),\n',
)
replace_once(
    test,
    '  [source.includes("CONSUMED_AUTHORIZATIONS.add"), "authorization is consumed before privileged execution"],\n',
    '  [source.includes("CONSUMED_AUTHORIZATIONS.add"), "authorization is consumed before privileged execution"],\n'
    '  [source.includes("createHmac"), "retained audits use external HMAC authentication"],\n'
    '  [source.includes("auditAuthenticationKey.fill(0)"), "the private audit key copy is erased after one-use invocation"],\n'
    '  [source.includes("timingSafeEqual"), "audit tags use timing-safe verification"],\n',
)

doc = "docs/accuracy/regulatory-implementation-invocation-orchestration.md"
replace_once(
    doc,
    '- canonical absolute repository, Git, GitHub CLI, GitHub CLI configuration, and audit-output paths;\n',
    '- canonical absolute repository, Git, GitHub CLI, GitHub CLI configuration, and audit-output paths;\n'
    '- a protected external audit-authentication key of at least 32 bytes, supplied only in process memory;\n',
)
replace_once(
    doc,
    '- the exact target branch.\n',
    '- the exact target branch; and\n'
    '- the external audit-authentication key identifier.\n',
)
replace_once(
    doc,
    'Every consumed invocation attempts to create one deterministic private audit file with exclusive creation mode.\n',
    'Every consumed invocation attempts to create one deterministic private audit file with exclusive creation mode. The file is authenticated with HMAC-SHA-256 using a protected key that is not serialized into the authorization or audit, is not written into the repository, and is erased from the orchestration binding after the one-use invocation. Later verification requires the same externally retained key; file contents and unkeyed checksums alone are insufficient.\n',
)
replace_once(
    doc,
    '- a checksum over the complete audit payload;\n',
    '- a checksum over the complete audit payload;\n'
    '- an HMAC-SHA-256 authentication tag and non-secret key identifier over the checksum-bound audit record;\n',
)
replace_once(
    doc,
    'The output directory must already exist as the exact canonical non-symlink directory explicitly bound during authorization. Audit files use `open(..., "wx", 0o600)` and are never overwritten.\n',
    'The output directory must already exist as the exact canonical non-symlink directory explicitly bound during authorization. Audit files use `open(..., "wx", 0o600)` and are never overwritten. The authentication key must be retained separately in an operator-controlled secret store; losing it prevents later authentication, while exposing it would allow a file editor to forge tags.\n',
)

print("PR #60 authenticated audit and clock-skew patch completed")
