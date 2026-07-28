import assert from "node:assert/strict";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
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
const isLiveAuthorizedRegulatoryRegistryImplementationPlan = () => false;
const validateRegulatoryRegistryImplementationPlan = () => [];
const isLiveRegulatoryImplementationPullRequestBundle = () => false;
const validateRegulatoryImplementationPullRequestBundle = () => [];
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
  isLiveRegulatoryImplementationInvocationAuthorization,
  validateRegulatoryImplementationInvocationAuthorization,
  validateRegulatoryImplementationInvocationAuditRecord,
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

const checksum = (character) => `sha256:${character.repeat(64)}`;
const fakePlan = {
  planId: "regulatory-registry-implementation:test-source:review",
  planChecksum: checksum("a"),
  baseCommitSha: "b".repeat(40),
  targetBranch: "regulatory-update/test-source/abcdefghijkl",
};
const fakeBundle = {
  bundleId: "regulatory-implementation-pr:test-source:bundle",
  bundleChecksum: checksum("c"),
};
const confirmation = buildRegulatoryImplementationInvocationConfirmation(
  fakePlan,
  fakeBundle
);
equal(
  confirmation,
  `AUTHORIZE SUBSHIELD REGULATORY IMPLEMENTATION PR plan=${fakePlan.planChecksum} bundle=${fakeBundle.bundleChecksum} base=${fakePlan.baseCommitSha} branch=${fakePlan.targetBranch}`,
  "operator confirmation binds the exact plan, bundle, base, and target branch"
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
  authorizedAt: "2026-07-27T20:00:00.000Z",
  runtimeFingerprint: checksum("d"),
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

const auditPayload = {
  schemaVersion: 1,
  auditId: `regulatory-implementation-audit:${storedAuthorization.authorizationChecksum}`,
  authorizationId: storedAuthorization.authorizationId,
  authorizationChecksum: storedAuthorization.authorizationChecksum,
  repositoryFullName: "siricarsen-cmd/subshield",
  planId: fakePlan.planId,
  planChecksum: fakePlan.planChecksum,
  bundleId: fakeBundle.bundleId,
  bundleChecksum: fakeBundle.bundleChecksum,
  baseCommitSha: fakePlan.baseCommitSha,
  targetBranch: fakePlan.targetBranch,
  expectedExecutorPrincipal: "github-user:siricarsen-cmd",
  authorizedAt: storedAuthorization.authorizedAt,
  recordedAt: "2026-07-27T20:01:00.000Z",
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
const audit = {
  ...auditPayload,
  auditChecksum: surface.checksumForAudit(auditPayload),
};
equal(
  validateRegulatoryImplementationInvocationAuditRecord(audit),
  [],
  "evidence-only invocation audit reproduces"
);
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

const sourceGuards = [
  [source.includes("LIVE_AUTHORIZATIONS = new WeakSet"), "live authorization uses opaque in-process identity"],
  [source.includes("AUTHORIZATION_BINDINGS = new WeakMap"), "original live plan and bundle stay in memory"],
  [source.includes("CONSUMED_AUTHORIZATIONS.add"), "authorization is consumed before privileged execution"],
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
