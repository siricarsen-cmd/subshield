import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import ts from "typescript";

const here = dirname(fileURLToPath(import.meta.url));
const sourcePath = join(here, "..", "registry-implementation-invocation.ts");
const adapterSourcePath = join(here, "..", "registry-implementation-production-adapter.ts");
const source = readFileSync(sourcePath, "utf8");
const adapterSource = readFileSync(adapterSourcePath, "utf8");
const isolatedDependencyStubs = `
const executeRegulatoryImplementationWithProductionAdapter = async () => ({
  status: "preflight-refused",
  errors: ["isolated-test-stub"],
  applicationStatus: "not-applied",
  customerFacingStatus: "benchmark-only",
  mergeStatus: "not-authorized",
});
const isLiveAuthorizedRegulatoryRegistryImplementationPlan = () => true;
const validateRegulatoryRegistryImplementationPlan = () => [];
const isLiveRegulatoryImplementationPullRequestBundle = () => true;
const validateRegulatoryImplementationPullRequestBundle = () => [];
const validateRegulatoryImplementationExecutionReceipt = () => [];
const fingerprintRegulatoryRegistryValue = (value) =>
  \`sha256:\${createHash("sha256").update(JSON.stringify(value)).digest("hex")}\`;
`;
const isolatedSource = source
  .replace(
    /import\s+\{\s*executeRegulatoryImplementationWithProductionAdapter,[\s\S]*?\}\s+from "\.\/registry-implementation-production-adapter";/,
    isolatedDependencyStubs
  )
  .replace(
    /import\s+\{\s*isLiveAuthorizedRegulatoryRegistryImplementationPlan,[\s\S]*?\}\s+from "\.\/registry-implementation-plan";/,
    ""
  )
  .replace(
    /import\s+\{\s*isLiveRegulatoryImplementationPullRequestBundle,[\s\S]*?\}\s+from "\.\/registry-implementation-pr-bundle";/,
    ""
  )
  .replace(
    /import\s+\{\s*fingerprintRegulatoryRegistryValue\s*\}\s+from "\.\/registry-integrity";/,
    ""
  )
  .replace(
    /import\s+\{\s*validateRegulatoryImplementationExecutionReceipt,[\s\S]*?\}\s+from "\.\/registry-implementation-executor";/,
    ""
  );
assert.ok(
  !isolatedSource.includes('from "./registry-implementation-'),
  "isolated invocation test must not load privileged production dependencies"
);
const transpiledPath = join(
  here,
  "..",
  `.registry-implementation-invocation.${process.pid}.mjs`
);
const transpiled = ts.transpileModule(isolatedSource, {
  fileName: sourcePath,
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
  },
}).outputText;
writeFileSync(transpiledPath, transpiled, { encoding: "utf8", mode: 0o600 });
let invocationModule;
try {
  invocationModule = await import(`${pathToFileURL(transpiledPath).href}?pid=${process.pid}`);
} finally {
  rmSync(transpiledPath, { force: true });
}

const {
  buildRegulatoryImplementationInvocationConfirmation,
  createRegulatoryImplementationInvocationAuthorization,
  executeRegulatoryImplementationInvocation,
  isLiveRegulatoryImplementationInvocationAuthorization,
  validateRegulatoryImplementationInvocationAuthorization,
  validateRegulatoryImplementationInvocationAuditRecord,
  validateRegulatoryImplementationProductionResult,
  regulatoryImplementationInvocationTestSurface: surface,
} = invocationModule;

let assertions = 0;
function pass(condition, message) {
  assert.ok(condition, message);
  assertions += 1;
}
function equal(actual, expected, message) {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
}
function rejects(fn, pattern, message) {
  assert.throws(fn, pattern, message);
  assertions += 1;
}

const originalDateNow = Date.now;
const testBaseMs = originalDateNow();
const testIso = (offsetMs = 0) => new Date(testBaseMs + offsetMs).toISOString();
let testNow = testBaseMs;
Date.now = () => testNow;

const checksum = (character) => `sha256:${character.repeat(64)}`;
const auditAuthenticationKey = new Uint8Array(32).fill(7);
const wrongAuditAuthenticationKey = new Uint8Array(32).fill(8);
const fakePlan = {
  planId: "regulatory-registry-implementation:test-source:review",
  planChecksum: checksum("a"),
  baseCommitSha: "b".repeat(40),
  targetBranch: "regulatory-update/test-source/abcdefghijkl",
  createdAt: testIso(-60_000),
};
const fakeBundle = {
  bundleId: "regulatory-implementation-pr:test-source:bundle",
  bundleChecksum: checksum("c"),
  planId: fakePlan.planId,
  planChecksum: fakePlan.planChecksum,
  baseCommitSha: fakePlan.baseCommitSha,
  targetBranch: fakePlan.targetBranch,
};
const confirmation = buildRegulatoryImplementationInvocationConfirmation(
  fakePlan,
  fakeBundle,
  auditAuthenticationKey
);
equal(
  confirmation,
  `AUTHORIZE SUBSHIELD REGULATORY IMPLEMENTATION PR plan=${fakePlan.planChecksum} bundle=${fakeBundle.bundleChecksum} base=${fakePlan.baseCommitSha} branch=${fakePlan.targetBranch} audit-key=${surface.auditAuthenticationKeyIdFor(auditAuthenticationKey)}`,
  "operator confirmation binds the exact plan, bundle, base, branch, and external audit key"
);

for (const [candidate, expected] of [
  ["siricarsen-cmd", "siricarsen-cmd"],
  ["SiriCarsen-Cmd", "siricarsen-cmd"],
]) {
  equal(surface.normalizeGitHubLogin(candidate), expected, "GitHub login normalizes exactly");
}
for (const candidate of ["", " bad-login ", "bad_login", "-bad", "bad-", "bad/login"]) {
  rejects(
    () => surface.normalizeGitHubLogin(candidate),
    /login/i,
    `invalid GitHub login is refused: ${JSON.stringify(candidate)}`
  );
}

equal(
  surface.exactAbsolutePath("/trusted/repository", "repository root"),
  "/trusted/repository",
  "exact absolute runtime path is accepted"
);
for (const candidate of ["relative/path", " /trusted/path", "/trusted/path\nnext"]) {
  rejects(
    () => surface.exactAbsolutePath(candidate, "runtime path"),
    /absolute path/i,
    `unsafe runtime path is refused: ${JSON.stringify(candidate)}`
  );
}

const authorizationPayload = {
  schemaVersion: 1,
  authorizationId: `regulatory-implementation-invocation:${fakeBundle.bundleChecksum}`,
  repositoryFullName: "siricarsen-cmd/subshield",
  defaultBranch: "main",
  planId: fakePlan.planId,
  planChecksum: fakePlan.planChecksum,
  bundleId: fakeBundle.bundleId,
  bundleChecksum: fakeBundle.bundleChecksum,
  baseCommitSha: fakePlan.baseCommitSha,
  targetBranch: fakePlan.targetBranch,
  expectedExecutorPrincipal: "github-user:siricarsen-cmd",
  authorizedAt: testIso(),
  runtimeFingerprint: checksum("d"),
  auditAuthenticationKeyId: surface.auditAuthenticationKeyIdFor(auditAuthenticationKey),
  confirmationFingerprint: checksum("e"),
  authorizationStatus: "live-one-use-operator-authorization",
  applicationStatus: "not-applied",
  customerFacingStatus: "benchmark-only",
  mergeStatus: "not-authorized",
};
const storedAuthorization = {
  ...authorizationPayload,
  authorizationChecksum: surface.checksumForAuthorization(authorizationPayload),
};
const validStoredReceipt = {
  schemaVersion: 1,
  receiptId: `regulatory-implementation-execution:${fakeBundle.bundleId}:${"d".repeat(40)}`,
  repositoryFullName: "siricarsen-cmd/subshield",
  planId: fakePlan.planId,
  planChecksum: fakePlan.planChecksum,
  bundleId: fakeBundle.bundleId,
  bundleChecksum: fakeBundle.bundleChecksum,
  baseCommitSha: fakePlan.baseCommitSha,
  targetBranch: fakePlan.targetBranch,
  commitSha: "d".repeat(40),
  files: [{ path: "lib/regulatory/example.ts", beforeChecksum: checksum("e"), afterChecksum: checksum("f") }],
  checks: [
    "npm run test:regulatory", "npm run test:accuracy", "npx tsc --noEmit", "npm run build",
  ].map((command) => ({ command, commitSha: "d".repeat(40), conclusion: "success" })),
  pullRequest: {
    number: 60,
    url: "https://github.com/siricarsen-cmd/subshield/pull/60",
    baseBranch: "main",
    headBranch: fakePlan.targetBranch,
    headCommitSha: "d".repeat(40),
    title: "Controlled update",
    bodyFingerprint: checksum("1"),
    autoMergeEnabled: false,
  },
  executedAt: testIso(30_000),
  executedBy: "github-user:siricarsen-cmd",
  authorizationStatus: "audit-evidence-only",
  receiptChecksum: checksum("2"),
  applicationStatus: "not-applied",
  customerFacingStatus: "benchmark-only",
  mergeStatus: "not-authorized",
};
equal(
  validateRegulatoryImplementationInvocationAuthorization(storedAuthorization),
  [],
  "stored authorization shape and checksum can be audited"
);
pass(
  !isLiveRegulatoryImplementationInvocationAuthorization(storedAuthorization),
  "stored or reconstructed authorization is not live execution authority"
);
const tamperedAuthorization = {
  ...storedAuthorization,
  targetBranch: "regulatory-update/test-source/changed",
};
pass(
  validateRegulatoryImplementationInvocationAuthorization(tamperedAuthorization).some((error) =>
    /checksum/i.test(error)
  ),
  "authorization tampering breaks its checksum"
);
const recomputedAuthorizationIdPayload = {
  ...authorizationPayload,
  authorizationId: "regulatory-implementation-invocation:forged",
};
const recomputedAuthorizationId = {
  ...recomputedAuthorizationIdPayload,
  authorizationChecksum: surface.checksumForAuthorization(
    recomputedAuthorizationIdPayload
  ),
};
pass(
  validateRegulatoryImplementationInvocationAuthorization(
    recomputedAuthorizationId
  ).some((error) => /authorization ID/i.test(error)),
  "checksum-consistent authorization ID forgery is refused"
);

const auditPayload = {
  schemaVersion: 1,
  auditId: `regulatory-implementation-audit:${storedAuthorization.authorizationChecksum}`,
  authorizationId: storedAuthorization.authorizationId,
  authorizationChecksum: storedAuthorization.authorizationChecksum,
  authorization: storedAuthorization,
  repositoryFullName: "siricarsen-cmd/subshield",
  planId: fakePlan.planId,
  planChecksum: fakePlan.planChecksum,
  bundleId: fakeBundle.bundleId,
  bundleChecksum: fakeBundle.bundleChecksum,
  baseCommitSha: fakePlan.baseCommitSha,
  targetBranch: fakePlan.targetBranch,
  expectedExecutorPrincipal: "github-user:siricarsen-cmd",
  authorizedAt: storedAuthorization.authorizedAt,
  recordedAt: testIso(60_000),
  recordedAtSource: "operator-clock-audit-only",
  result: {
    status: "preflight-refused",
    errors: ["structured refusal"],
    applicationStatus: "not-applied",
    customerFacingStatus: "benchmark-only",
    mergeStatus: "not-authorized",
  },
  auditStatus: "evidence-only-not-execution-authority",
  applicationStatus: "not-applied",
  customerFacingStatus: "benchmark-only",
  mergeStatus: "not-authorized",
};
const auditWithChecksum = {
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
  [],
  "evidence-only invocation audit reproduces"
);
for (const [mutation, pattern, message] of [
  [
    { auditId: "regulatory-implementation-audit:forged" },
    /audit ID/i,
    "checksum-consistent audit ID forgery is refused",
  ],
  [
    { expectedExecutorPrincipal: "github-user:other-operator" },
    /authorization snapshot/i,
    "checksum-consistent audit principal forgery is refused",
  ],
  [
    {
      result: {
        ...auditPayload.result,
        customerFacingStatus: "customer-facing",
      },
    },
    /controlled boundary/i,
    "checksum-consistent production-boundary forgery is refused",
  ],
]) {
  const forgedPayload = { ...auditPayload, ...mutation };
  const forgedWithChecksum = {
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
      pattern.test(error)
    ),
    message
  );
}

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
  recordedAt: testIso(-3 * 60_000),
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
  [
    {
      status: "success",
      applicationStatus: "not-applied",
      customerFacingStatus: "benchmark-only",
      mergeStatus: "not-authorized",
    },
    /complete receipt/i,
    "success without a receipt is refused",
  ],
  [
    {
      status: "success",
      receipt: {},
      applicationStatus: "not-applied",
      customerFacingStatus: "benchmark-only",
      mergeStatus: "not-authorized",
    },
    /receipt/i,
    "truncated untrusted success receipt is safely refused",
  ],
  [
    {
      status: "success",
      receipt: { ...validStoredReceipt, receiptId: "regulatory-implementation-execution:forged" },
      applicationStatus: "not-applied",
      customerFacingStatus: "benchmark-only",
      mergeStatus: "not-authorized",
    },
    /receipt ID/i,
    "forged execution receipt identity is refused",
  ],
  [
    {
      status: "success",
      receipt: { ...validStoredReceipt, pullRequest: { ...validStoredReceipt.pullRequest, extra: true } },
      applicationStatus: "not-applied",
      customerFacingStatus: "benchmark-only",
      mergeStatus: "not-authorized",
    },
    /nested evidence/i,
    "extra nested receipt fields are refused",
  ],
  [
    {
      status: "execution-failed",
      errors: ["failure"],
      applicationStatus: "not-applied",
      customerFacingStatus: "benchmark-only",
      mergeStatus: "not-authorized",
    },
    /execution failure/i,
    "execution failure without a valid stage is refused",
  ],
  [
    {
      status: "check-failed",
      checks: [{ command: "wrong", commitSha: "d".repeat(40), conclusion: "success" }],
      errors: ["failure"],
      applicationStatus: "not-applied",
      customerFacingStatus: "benchmark-only",
      mergeStatus: "not-authorized",
    },
    /required sequence/i,
    "check failure with a forged command sequence is refused",
  ],
  [
    {
      status: "push-failed",
      checks: [],
      errors: ["failure"],
      applicationStatus: "not-applied",
      customerFacingStatus: "benchmark-only",
      mergeStatus: "not-authorized",
    },
    /invalid length/i,
    "push failure without complete successful checks is refused",
  ],
  [
    {
      status: "production-boundary-failed",
      stage: "cleanup",
      errors: ["cleanup failed"],
      applicationStatus: "not-applied",
      customerFacingStatus: "benchmark-only",
      mergeStatus: "not-authorized",
    },
    /prior structured result/i,
    "cleanup boundary failure without its prior result is refused",
  ],
  [
    {
      status: "check-failed",
      checks: validStoredReceipt.checks,
      errors: ["failure"],
      applicationStatus: "not-applied",
      customerFacingStatus: "benchmark-only",
      mergeStatus: "not-authorized",
    },
    /complete successful/i,
    "check failure with all four successful checks is refused",
  ],
  [
    {
      status: "production-boundary-failed",
      stage: "execution-and-cleanup",
      errors: ["combined failure"],
      priorResult: auditPayload.result,
      applicationStatus: "not-applied",
      customerFacingStatus: "benchmark-only",
      mergeStatus: "not-authorized",
    },
    /must not claim a prior result/i,
    "combined execution-and-cleanup failure cannot claim a prior result",
  ],
]) {
  pass(
    validateRegulatoryImplementationProductionResult(candidate, storedAuthorization).some((error) =>
      pattern.test(error)
    ),
    message
  );
}
equal(
  surface.auditFilename(storedAuthorization.authorizationChecksum),
  `${storedAuthorization.authorizationChecksum.slice(7, 31)}-invocation-audit.json`,
  "audit filename is deterministic and checksum-bound"
);
const refusal = surface.refusal("manual authorization missing");
equal(refusal.status, "invocation-refused", "manual refusal is structured");
equal(refusal.authorizationStatus, "refused", "refused authorization is not consumed");
pass(Object.isFrozen(refusal), "refusal result is deeply frozen");
pass(Object.isFrozen(refusal.errors), "refusal errors are frozen");

const auditDirectory = mkdtempSync(join(tmpdir(), "subshield-invocation-test-"));
try {
  testNow = testBaseMs + 5 * 60_000 + 1;
  rejects(
    () => createRegulatoryImplementationInvocationAuthorization(fakePlan, fakeBundle, {
      authorizedAt: testIso(), expectedGitHubLogin: "SiriCarsen-Cmd",
      repositoryRoot: "/trusted/repository", gitExecutable: "/trusted/bin/git",
      githubCliExecutable: "/trusted/bin/gh", githubCliConfigDir: "/trusted/gh-config",
      auditOutputDirectory: auditDirectory, auditAuthenticationKey, confirmation,
    }),
    /freshness window/i,
    "authorization older than five minutes is refused at creation"
  );
  testNow = testBaseMs;
  const futureSkewAuthorization = createRegulatoryImplementationInvocationAuthorization(
    fakePlan,
    fakeBundle,
    {
      authorizedAt: testIso(5 * 60_000),
      expectedGitHubLogin: "SiriCarsen-Cmd",
      repositoryRoot: "/trusted/repository",
      gitExecutable: "/trusted/bin/git",
      githubCliExecutable: "/trusted/bin/gh",
      githubCliConfigDir: "/trusted/gh-config",
      auditOutputDirectory: auditDirectory,
      auditAuthenticationKey,
      confirmation,
    }
  );
  pass(
    isLiveRegulatoryImplementationInvocationAuthorization(futureSkewAuthorization),
    "five-minute future clock skew remains accepted"
  );
  const futureSkewInvocation = await executeRegulatoryImplementationInvocation(
    fakePlan,
    fakeBundle,
    futureSkewAuthorization
  );
  equal(futureSkewInvocation.status, "invocation-failed", "future-skew authorization remains consumable");
  const liveAuthorization = createRegulatoryImplementationInvocationAuthorization(
    fakePlan,
    fakeBundle,
    {
      authorizedAt: testIso(),
      expectedGitHubLogin: "SiriCarsen-Cmd",
      repositoryRoot: "/trusted/repository",
      gitExecutable: "/trusted/bin/git",
      githubCliExecutable: "/trusted/bin/gh",
      githubCliConfigDir: "/trusted/gh-config",
      auditOutputDirectory: auditDirectory,
      auditAuthenticationKey,
      confirmation,
    }
  );
  pass(
    isLiveRegulatoryImplementationInvocationAuthorization(liveAuthorization),
    "fresh original authorization is live before invocation"
  );
  pass(Object.isFrozen(liveAuthorization), "live authorization is deeply frozen");
  pass(
    !isLiveRegulatoryImplementationInvocationAuthorization(
      JSON.parse(JSON.stringify(liveAuthorization))
    ),
    "serialized authorization cannot recreate live authority"
  );

  testNow = testBaseMs + 5 * 60_000 + 1;
  const expired = await executeRegulatoryImplementationInvocation(fakePlan, fakeBundle, liveAuthorization);
  equal(expired.status, "invocation-refused", "authorization expiration is rechecked before consumption");
  pass(isLiveRegulatoryImplementationInvocationAuthorization(liveAuthorization), "expired refusal does not consume authorization");
  testNow = testBaseMs;

  const invocation = await executeRegulatoryImplementationInvocation(
    fakePlan,
    fakeBundle,
    liveAuthorization
  );
  equal(invocation.status, "invocation-failed", "structured adapter refusal is preserved");
  equal(invocation.authorizationStatus, "consumed", "authorization is consumed before execution");
  equal(
    invocation.productionResult.status,
    "preflight-refused",
    "underlying production result remains visible"
  );
  pass(
    !isLiveRegulatoryImplementationInvocationAuthorization(liveAuthorization),
    "consumed authorization loses live status"
  );
  equal(
    validateRegulatoryImplementationInvocationAuditRecord(
      invocation.auditRecord,
      auditAuthenticationKey
    ),
    [],
    "consumed invocation produces a valid evidence-only audit record"
  );
  const storedAudit = JSON.parse(readFileSync(invocation.auditPath, "utf8"));
  equal(
    validateRegulatoryImplementationInvocationAuditRecord(
      storedAudit,
      auditAuthenticationKey
    ),
    [],
    "retained audit file reproduces without becoming authority"
  );
  equal(
    storedAudit.auditStatus,
    "evidence-only-not-execution-authority",
    "retained audit remains explicitly non-authoritative"
  );

  const replay = await executeRegulatoryImplementationInvocation(
    fakePlan,
    fakeBundle,
    liveAuthorization
  );
  equal(replay.status, "invocation-refused", "consumed authorization cannot be replayed");
  equal(replay.authorizationStatus, "refused", "replay does not create another execution");
} finally {
  Date.now = originalDateNow;
  rmSync(auditDirectory, { recursive: true, force: true });
}

const sourceGuards = [
  [source.includes("LIVE_AUTHORIZATIONS = new WeakSet"), "live authorization uses opaque in-process identity"],
  [source.includes("AUTHORIZATION_BINDINGS = new WeakMap"), "original live plan and bundle stay in memory"],
  [source.includes("CONSUMED_AUTHORIZATIONS.add"), "authorization is consumed before privileged execution"],
  [source.includes("createHmac"), "retained audits use external HMAC authentication"],
  [source.includes("auditAuthenticationKey.fill(0)"), "the private audit key copy is erased after one-use invocation"],
  [source.includes("timingSafeEqual"), "audit tags use timing-safe verification"],
  [source.includes("production adapter failed unexpectedly"), "unexpected adapter failures remain structured"],
  [source.includes("validateRegulatoryImplementationExecutionReceipt"), "success audits validate their nested execution receipt"],
  [source.includes("validateRegulatoryImplementationProductionResult"), "audit validation discriminates every production result variant"],
  [source.includes('open(target, "wx", 0o600)'), "audit evidence uses exclusive private file creation"],
  [source.includes("auditStatus: \"evidence-only-not-execution-authority\""), "audit records cannot become execution authority"],
  [source.includes("expectedGitHubLogin"), "operator authorization binds the expected GitHub principal"],
  [adapterSource.includes("expectedGitHubLogin: string"), "production adapter requires an expected GitHub login"],
  [adapterSource.includes("normalizedLogin !== this.expectedGitHubLogin"), "authenticated GitHub login must match authorization"],
  [!source.includes("loadRegulatoryRegistryImplementationPlan"), "stored plans are never reloaded as live authority"],
  [!source.includes("loadRegulatoryImplementationPullRequestBundle"), "stored bundles are never reloaded as live authority"],
  [!source.includes("setInterval("), "invocation is not scheduled"],
  [!source.includes("setTimeout("), "invocation has no delayed automatic execution"],
  [!source.includes("process.argv"), "invocation is not exposed as a reconstructive CLI"],
  [!/\bmergePullRequest\b/.test(source), "orchestration exposes no merge capability"],
  [!/\bdeploy\s*\(/.test(source), "orchestration exposes no deployment capability"],
  [!/\bdeleteRef\b/.test(source), "orchestration performs no automatic remote cleanup"],
];
for (const [condition, message] of sourceGuards) pass(condition, message);

console.log(`Controlled regulatory invocation regression passed: ${assertions} assertions.`);
