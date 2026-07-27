import assert from "node:assert/strict";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import ts from "typescript";

const here = dirname(fileURLToPath(import.meta.url));
const sourcePath = join(here, "..", "registry-implementation-production-adapter.ts");
const source = readFileSync(sourcePath, "utf8");
const transpiledPath = join(
  here,
  "..",
  `.registry-implementation-production-adapter.${process.pid}.mjs`
);
const transpiled = ts.transpileModule(source, {
  fileName: sourcePath,
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
  },
}).outputText;
writeFileSync(transpiledPath, transpiled, { encoding: "utf8", mode: 0o600 });
let adapterModule;
try {
  adapterModule = await import(`${pathToFileURL(transpiledPath).href}?pid=${process.pid}`);
} finally {
  rmSync(transpiledPath, { force: true });
}
const {
  executeRegulatoryImplementationWithProductionAdapter,
  regulatoryImplementationProductionAdapterTestSurface: surface,
} = adapterModule;

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

const expectedPaths = [
  "lib/regulatory/benchmark-applicability-mappings.ts",
  "lib/regulatory/historical-grounding-policy.ts",
  "lib/regulatory/source-coverage-citation-packages.ts",
];
const expectedChecks = [
  "npm run test:regulatory",
  "npm run test:accuracy",
  "npx tsc --noEmit",
  "npm run build",
];

equal(surface.allowedPaths, expectedPaths, "production adapter must expose only the exact registry paths");
equal(surface.requiredChecks, expectedChecks, "production adapter must expose only the exact required checks");
pass(
  typeof executeRegulatoryImplementationWithProductionAdapter === "function",
  "high-level production runner must be exported"
);

equal(
  surface.normalizeOriginUrl("https://github.com/siricarsen-cmd/subshield.git"),
  "siricarsen-cmd/subshield",
  "canonical HTTPS origin must normalize"
);
equal(
  surface.normalizeOriginUrl("https://github.com/siricarsen-cmd/subshield"),
  "siricarsen-cmd/subshield",
  "canonical extensionless HTTPS origin must normalize"
);
for (const origin of [
  "http://github.com/siricarsen-cmd/subshield.git",
  "git@github.com:siricarsen-cmd/subshield.git",
  "ssh://git@github.com/siricarsen-cmd/subshield.git",
  "https://token@github.com/siricarsen-cmd/subshield.git",
  "https://github.example.com/siricarsen-cmd/subshield.git",
  "https://github.com:444/siricarsen-cmd/subshield.git",
  "https://github.com/siricarsen-cmd/subshield.git?ref=main",
  "https://github.com/siricarsen-cmd/subshield.git#main",
  "https://github.com/siricarsen-cmd/subshield/extra",
  "https://github.com/siricarsen-cmd/subshield.git.evil",
]) {
  rejects(
    () => surface.normalizeOriginUrl(origin),
    /origin|HTTPS|repository/i,
    `noncanonical origin must be refused: ${origin}`
  );
}

equal(
  surface.normalizeRfc3339Instant("2026-07-27T12:00:00Z", "timestamp"),
  "2026-07-27T12:00:00.000Z",
  "RFC 3339 server time without fractional seconds must normalize"
);
equal(
  surface.normalizeRfc3339Instant("2026-07-27T12:00:00.123Z", "timestamp"),
  "2026-07-27T12:00:00.123Z",
  "RFC 3339 server time with milliseconds must normalize"
);
equal(
  surface.normalizeRfc3339Instant("2026-07-27T12:00:00.123456789Z", "timestamp"),
  "2026-07-27T12:00:00.123Z",
  "higher precision RFC 3339 server time must normalize deterministically"
);
equal(
  surface.normalizeRfc3339Instant("2024-02-29T23:59:59.9Z", "timestamp"),
  "2024-02-29T23:59:59.900Z",
  "valid leap-day server time must normalize"
);
for (const timestamp of [
  "2026-07-27 12:00:00Z",
  "2026-07-27T12:00:00+00:00",
  "2026-07-27T12:00:00",
  "2026-02-29T00:00:00Z",
  "2026-04-31T00:00:00Z",
  "2026-01-01T24:00:00Z",
  "2026-01-01T00:60:00Z",
  "2026-01-01T00:00:60Z",
  "not-a-date",
]) {
  rejects(
    () => surface.normalizeRfc3339Instant(timestamp, "timestamp"),
    /timestamp.*invalid/i,
    `invalid, impossible, or noncanonical server time must be refused: ${timestamp}`
  );
}

const priorResult = Object.freeze({
  status: "preflight-refused",
  errors: ["prior structured result"],
  applicationStatus: "not-applied",
  customerFacingStatus: "benchmark-only",
  mergeStatus: "not-authorized",
});
const cleanupFailure = surface.productionBoundaryFailure("cleanup", priorResult);
equal(cleanupFailure.status, "production-boundary-failed", "cleanup failure must remain structured");
equal(cleanupFailure.stage, "cleanup", "cleanup failure stage must be retained");
equal(cleanupFailure.priorResult, priorResult, "cleanup failure must preserve the prior executor result");
pass(Object.isFrozen(cleanupFailure), "production-boundary failure must be frozen");
pass(Object.isFrozen(cleanupFailure.errors), "production-boundary failure errors must be frozen");
pass(!cleanupFailure.errors[0].includes("prior structured result"), "cleanup errors must remain generic and sanitized");

equal(
  surface.validateBranchName("regulatory-update/source-id/packet-id"),
  "regulatory-update/source-id/packet-id",
  "deterministic regulatory branches must be accepted"
);
for (const branch of [
  "../main",
  "regulatory-update//packet",
  "regulatory update/packet",
  "regulatory-update/packet.lock",
  "regulatory-update/packet@{1}",
  "regulatory-update\\packet",
  "-option",
  "regulatory-update/packet\nmalicious",
]) {
  rejects(
    () => surface.validateBranchName(branch),
    /branch/i,
    `unsafe branch must be refused: ${JSON.stringify(branch)}`
  );
}

for (const path of expectedPaths) {
  equal(
    surface.validateRepositoryPath(path),
    path,
    `authorized registry path must be accepted: ${path}`
  );
}
for (const path of [
  "app/api/analyze-contract/route.ts",
  "lib/regulatory/../analyzer/detectors.ts",
  "lib\\regulatory\\benchmark-applicability-mappings.ts",
  "/tmp/source-coverage-citation-packages.ts",
  "lib/regulatory/source-coverage-citation-packages.ts\0escape",
  "lib/regulatory/source-coverage-citation-packages.ts\nextra",
]) {
  rejects(
    () => surface.validateRepositoryPath(path),
    /path/i,
    `unauthorized path must be refused: ${JSON.stringify(path)}`
  );
}

const expectedInvocations = [
  ["npm run test:regulatory", ["run", "test:regulatory"]],
  ["npm run test:accuracy", ["run", "test:accuracy"]],
  ["npx tsc --noEmit", ["tsc", "--noEmit"]],
  ["npm run build", ["run", "build"]],
];
for (const [command, args] of expectedInvocations) {
  const invocation = surface.checkInvocation(command);
  equal(invocation.args, args, `${command} must map to fixed argv`);
  pass(
    /^(npm|npm\.cmd|npx|npx\.cmd)$/.test(invocation.executable),
    `${command} must use a platform-specific npm/npx executable`
  );
}
for (const command of [
  "npm run test:regulatory && echo pwned",
  "npm run test:regulatory -- --watch",
  "npx tsc --noEmit; env",
  "npm install",
  "git status",
]) {
  rejects(
    () => surface.checkInvocation(command),
    /allowlisted/i,
    `modified command must be refused: ${command}`
  );
}

const sourceGuards = [
  [source.includes("shell: false"), "process execution must explicitly disable shell mode"],
  [!source.includes("shell: true"), "production adapter must never enable shell mode"],
  [! /export\s+class\s+ProductionRegulatoryImplementationAdapter/.test(source), "real adapter class must remain internal"],
  [source.includes('"worktree",\n        "add"'), "production adapter must use an isolated Git worktree"],
  [source.includes("core.hooksPath=${this.hooksPath}"), "every Git invocation must receive the controlled hooks path"],
  [source.includes('environment.GIT_CONFIG_NOSYSTEM = "1"'), "system Git configuration must be disabled"],
  [source.includes("environment.GIT_CONFIG_GLOBAL"), "global Git configuration must be redirected to an adapter-owned path"],
  [source.includes("environment.GIT_CONFIG_SYSTEM"), "system Git configuration must be redirected to an adapter-owned path"],
  [source.includes("GIT_CONFIG_COUNT"), "Git process configuration must be supplied through a controlled environment"],
  [source.includes("local Git includes are prohibited"), "local include and includeIf configuration must be refused"],
  [source.includes('"--includes", "--get-all"'), "effective local fetch and push URLs must be enumerated"],
  [source.includes('["credential.helper", ""]'), "ambient credential helpers must be disabled"],
  [source.includes('["http.extraHeader", ""]'), "inherited HTTP headers must be reset"],
  [source.includes('["http.proxy", ""]'), "inherited HTTP proxies must be reset"],
  [source.includes('["http.sslVerify", "true"]'), "TLS verification must be required"],
  [source.includes('["protocol.allow", "never"]'), "unapproved Git protocols must be denied by default"],
  [source.includes('["protocol.https.allow", "always"]'), "only HTTPS transport must be enabled"],
  [source.includes('["protocol.ext.allow", "never"]'), "external transport helpers must be denied"],
  [source.includes('["core.sshCommand", ""]'), "inherited SSH command execution must be neutralized"],
  [source.includes('environment.GIT_TERMINAL_PROMPT = "0"'), "interactive Git credential prompts must be disabled"],
  [source.includes("GH_TOKEN"), "later GitHub calls must reuse the attested token"],
  [source.includes("GITHUB_TOKEN"), "GitHub CLI authentication must be explicitly bound"],
  [source.includes("this.githubToken = undefined"), "in-memory authentication must be cleared during cleanup"],
  [source.includes("CANONICAL_GIT_ENDPOINT"), "network Git operations must use one fixed canonical endpoint"],
  [source.includes('"remote.origin.url"'), "every configured fetch URL must be enumerated"],
  [source.includes('"remote.origin.pushurl"'), "every configured push URL must be enumerated"],
  [source.includes("insteadOf|pushInsteadOf"), "Git URL rewrites must be detected and refused"],
  [source.includes("--force-with-lease=${targetRef}:"), "publication must use the exact absent-ref compare-and-swap lease"],
  [!source.includes('"push", "--force"'), "ordinary force push must remain unavailable"],
  [source.includes('"ls-remote"'), "the hosted branch must be refetched after publication"],
  [source.includes("package metadata changed after review"), "changed package metadata must be refused before npm checks"],
  [source.includes('GIT_AUTHOR_NAME = "SubShield Regulatory Executor"'), "commit author identity must be deterministic"],
  [source.includes("GIT_AUTHOR_DATE = commitDate"), "commit author time must derive from reviewed evidence"],
  [source.includes("commit.gpgSign=false"), "commit signing must be disabled"],
  [source.includes("tag.gpgSign=false"), "tag signing configuration must be neutralized"],
  [source.includes('"--body-file"'), "pull-request body must use a private file"],
  [source.includes("readDefaultBranchHead"), "remote main must be re-read through the adapter"],
  [source.includes("viewerPermission"), "authenticated repository permission must be checked"],
  [source.includes("github-user:"), "receipt principal must be tied to authenticated GitHub identity"],
  [source.includes("autoMergeRequest"), "hosted auto-merge state must be inspected"],
  [source.includes("createdAt"), "GitHub server creation time must be retained"],
  [source.includes("stats.isDirectory()"), "every authorized parent segment must be a real directory"],
  [source.includes("assertImmutablePackageMetadata"), "the npm shell exception must be bound to reviewed package metadata"],
  [source.includes('status: "production-boundary-failed"'), "unexpected execution and cleanup failures must remain structured"],
  [source.includes('"execution-and-cleanup"'), "combined execution and cleanup failure must be represented"],
  [! /\bmergePullRequest\b/.test(source), "adapter must expose no merge capability"],
  [! /\bdeploy\s*\(/.test(source), "adapter must expose no deployment capability"],
  [! /\bdeleteRef\b/.test(source), "adapter must expose no ref-deletion capability"],
  [! /\bcreateRelease\b/.test(source), "adapter must expose no release capability"],
];
for (const [condition, message] of sourceGuards) pass(condition, message);

console.log(`Controlled production adapter regression passed: ${assertions} assertions.`);
