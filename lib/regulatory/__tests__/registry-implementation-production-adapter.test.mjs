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

equal(surface.allowedPaths, expectedPaths, "only exact regulatory registry files are authorized");
equal(surface.requiredChecks, expectedChecks, "required check identities remain exact and ordered");
pass(surface.regulatoryTestFiles.length >= 30, "regulatory command expands to the complete fixed test sequence");
equal(surface.accuracyTestFiles.length, 2, "accuracy command expands to two fixed benchmark files");
pass(typeof executeRegulatoryImplementationWithProductionAdapter === "function", "high-level production runner is exported");

for (const canonical of [
  "https://github.com/siricarsen-cmd/subshield",
  "https://github.com/siricarsen-cmd/subshield.git",
]) {
  equal(surface.normalizeOriginUrl(canonical), "siricarsen-cmd/subshield", "canonical HTTPS origin normalizes");
}
for (const rejected of [
  "http://github.com/siricarsen-cmd/subshield.git",
  "git@github.com:siricarsen-cmd/subshield.git",
  "ssh://git@github.com/siricarsen-cmd/subshield.git",
  "https://token@github.com/siricarsen-cmd/subshield.git",
  "https://github.example.com/siricarsen-cmd/subshield.git",
  "https://github.com:444/siricarsen-cmd/subshield.git",
  "https://github.com/siricarsen-cmd/subshield.git?x=1",
  "https://github.com/siricarsen-cmd/subshield.git#x",
  "https://github.com/siricarsen-cmd/subshield/extra",
]) {
  rejects(() => surface.normalizeOriginUrl(rejected), /origin|HTTPS|repository/i, `refuse origin ${rejected}`);
}

equal(
  surface.normalizeGitHubInstant("2026-07-27T12:00:00Z", "createdAt"),
  "2026-07-27T12:00:00.000Z",
  "GitHub time without a fraction normalizes"
);
equal(
  surface.normalizeGitHubInstant("2026-07-27T12:00:00.123456789Z", "createdAt"),
  "2026-07-27T12:00:00.123Z",
  "GitHub nanosecond precision normalizes deterministically"
);
equal(
  surface.normalizeGitStrictInstant("2026-07-27T06:30:00-07:00", "commitDate"),
  "2026-07-27T13:30:00.000Z",
  "Git strict ISO time with the reviewed-base negative offset normalizes"
);
equal(
  surface.normalizeGitStrictInstant("2026-07-27T20:00:00+05:30", "commitDate"),
  "2026-07-27T14:30:00.000Z",
  "Git strict ISO time with a positive fractional-hour offset normalizes"
);
for (const rejected of [
  "2026-02-29T00:00:00Z",
  "2026-04-31T00:00:00Z",
  "2026-01-01T24:00:00Z",
  "2026-01-01T00:60:00Z",
  "2026-01-01T00:00:60Z",
  "2026-01-01 00:00:00Z",
]) {
  rejects(() => surface.normalizeGitHubInstant(rejected, "createdAt"), /invalid/i, `refuse impossible GitHub time ${rejected}`);
}
for (const rejected of [
  "2026-02-29T00:00:00-07:00",
  "2026-01-01T24:00:00-07:00",
  "2026-01-01T00:00:00+14:01",
  "2026-01-01T00:00:00+15:00",
  "2026-01-01T00:00:00-07",
]) {
  rejects(() => surface.normalizeGitStrictInstant(rejected, "commitDate"), /invalid/i, `refuse impossible Git time ${rejected}`);
}

const benignConfig = `[core]\n\trepositoryformatversion = 0\n\tfilemode = true\n\tbare = false\n\tlogallrefupdates = true\n[remote "origin"]\n\turl = https://github.com/siricarsen-cmd/subshield.git\n\tfetch = +refs/heads/*:refs/remotes/origin/*\n[branch "main"]\n\tremote = origin\n\tmerge = refs/heads/main\n`;
const benignEntries = surface.parseLocalGitConfig(benignConfig);
equal(benignEntries.length, 8, "benign structural Git config parses exactly");
equal(
  surface.validateLocalGitConfig(benignEntries),
  {
    fetchUrl: "https://github.com/siricarsen-cmd/subshield.git",
    pushUrl: "https://github.com/siricarsen-cmd/subshield.git",
  },
  "minimal structural Git config is accepted"
);
for (const malicious of [
  `${benignConfig}\n[filter "steal"]\n\tclean = /tmp/steal-token\n`,
  `${benignConfig}\n[core]\n\tattributesFile = /tmp/attacker-attributes\n`,
  `${benignConfig}\n[http]\n\tcurloptResolve = github.com:443:127.0.0.1\n`,
  `${benignConfig}\n[http]\n\tsslCAInfo = /tmp/attacker-ca\n`,
  `${benignConfig}\n[http]\n\tproxy = http://127.0.0.1:9999\n`,
  `${benignConfig}\n[credential]\n\thelper = /tmp/steal-token\n`,
  `${benignConfig}\n[include]\n\tpath = /tmp/attacker-config\n`,
  `${benignConfig}\n[includeIf "gitdir:~/work/"]\n\tpath = /tmp/attacker-config\n`,
  `${benignConfig}\n[diff "driver"]\n\tcommand = /tmp/driver\n`,
  `${benignConfig}\n[remote "origin"]\n\tpushurl = https://evil.example/repo.git\n`,
]) {
  rejects(
    () => surface.validateLocalGitConfig(surface.parseLocalGitConfig(malicious)),
    /prohibited|canonical|config|origin/i,
    "behavior-changing local Git configuration must fail closed"
  );
}

for (const branch of ["regulatory-update/source/packet", "regulatory-implementation/source-1"]) {
  equal(surface.validateBranchName(branch), branch, "safe deterministic branch is accepted");
}
for (const branch of [
  "../main",
  "-option",
  "regulatory update/packet",
  "regulatory-update//packet",
  "regulatory-update/packet.lock",
  "regulatory-update/packet@{1}",
  "regulatory-update\\packet",
  "regulatory-update/packet\nmalicious",
]) {
  rejects(() => surface.validateBranchName(branch), /branch/i, `refuse unsafe branch ${JSON.stringify(branch)}`);
}
for (const path of expectedPaths) {
  equal(surface.validateRepositoryPath(path), path, "authorized file path is accepted");
}
for (const path of [
  "app/api/analyze-contract/route.ts",
  "lib/regulatory/../analyzer/detectors.ts",
  "lib\\regulatory\\benchmark-applicability-mappings.ts",
  "/tmp/file.ts",
  "lib/regulatory/source-coverage-citation-packages.ts\0x",
]) {
  rejects(() => surface.validateRepositoryPath(path), /path/i, `refuse unauthorized path ${JSON.stringify(path)}`);
}

const cleanupFailure = surface.productionBoundaryFailure("cleanup", {
  status: "push-failed",
  checks: [],
  errors: ["structured evidence"],
  applicationStatus: "not-applied",
  customerFacingStatus: "benchmark-only",
  mergeStatus: "not-authorized",
});
equal(cleanupFailure.status, "production-boundary-failed", "cleanup failure is structured");
equal(cleanupFailure.stage, "cleanup", "cleanup stage is retained");
pass(Boolean(cleanupFailure.priorResult), "prior executor result is retained after cleanup failure");
pass(Object.isFrozen(cleanupFailure), "production failure is deeply frozen at its root");
pass(Object.isFrozen(cleanupFailure.errors), "production failure errors are frozen");
pass(!cleanupFailure.errors[0].includes("structured evidence"), "raw prior error text is not copied into boundary errors");

const sourceGuards = [
  [source.includes("shell: false"), "parent subprocess boundary disables shell mode"],
  [!source.includes("shell: true"), "no parent subprocess enables shell mode"],
  [source.includes("gitExecutable: string"), "Git executable is explicit production input"],
  [source.includes("githubCliExecutable: string"), "GitHub CLI executable is explicit production input"],
  [source.includes("githubCliConfigDir: string"), "GitHub auth config directory is explicit production input"],
  [source.includes("validateAbsoluteRegularFile"), "executables and direct tooling are canonical regular files"],
  [source.includes("validateAbsoluteDirectory"), "trusted directories are canonical non-symlink directories"],
  [source.includes("process.execPath"), "Node uses the already-running absolute executable"],
  [!source.includes('executable: "git"'), "Git is never resolved from inherited PATH"],
  [!source.includes('executable: "gh"'), "GitHub CLI is never resolved from inherited PATH"],
  [!source.includes('executable: "npm"'), "npm executable is absent from the privileged check path"],
  [!source.includes('executable: "npx"'), "npx executable is absent from the privileged check path"],
  [source.includes("REGULATORY_TEST_FILES"), "regulatory check maps to an immutable direct test list"],
  [source.includes("ACCURACY_TEST_FILES"), "accuracy check maps to immutable direct benchmarks"],
  [source.includes('node_modules", "typescript", "bin", "tsc"'), "TypeScript uses a direct local JavaScript entry point"],
  [source.includes('node_modules", "next", "dist", "bin", "next"'), "Next build uses a direct local JavaScript entry point"],
  [source.includes("private-home"), "required checks use an adapter-owned private home"],
  [source.includes("NPM_CONFIG_USERCONFIG"), "user npm configuration is redirected to an empty private file"],
  [source.includes("NPM_CONFIG_SCRIPT_SHELL"), "npm script shell environment is neutralized"],
  [source.includes("NPM_CONFIG_IGNORE_SCRIPTS"), "dependency lifecycle scripts remain disabled"],
  [source.includes("localConfigFingerprint"), "local Git config bytes are fingerprint-bound"],
  [source.includes("assertLocalConfigUnchanged"), "local Git config is revalidated before every Git operation"],
  [source.includes("ALLOWED_LOCAL_CONFIG_EXACT"), "local Git config uses a strict structural allowlist"],
  [source.includes('"hash-object", "-w", "--no-filters"'), "authorized files are hashed without clean filters"],
  [source.includes('"update-index", "--add", "--cacheinfo"'), "filter-free blobs are staged with Git plumbing"],
  [source.includes("GIT_CONFIG_GLOBAL"), "global Git config is redirected"],
  [source.includes("GIT_CONFIG_SYSTEM"), "system Git config is redirected"],
  [source.includes("GIT_CONFIG_NOSYSTEM"), "system Git config loading is disabled"],
  [source.includes("credential.helper"), "ambient credential helpers are disabled"],
  [source.includes("protocol.https.allow"), "only HTTPS Git transport is enabled"],
  [source.includes("core.sshCommand"), "executable SSH transport is neutralized"],
  [source.includes("http.sslVerify"), "TLS verification is forced"],
  [source.includes("http.proxy"), "ambient HTTP proxy settings are reset"],
  [source.includes("x-access-token:"), "Git transport derives from the attested GitHub token"],
  [!source.includes("${this.githubToken}"), "token is never interpolated into argv"],
  [source.includes("this.githubToken = undefined"), "token is cleared before cleanup"],
  [source.includes("core.hooksPath=${this.hooksPath}"), "every Git call has adapter-owned hook isolation"],
  [source.includes("commit.gpgSign=false"), "commit signing is disabled"],
  [source.includes("GIT_AUTHOR_NAME"), "commit author identity is fixed"],
  [source.includes("GIT_AUTHOR_DATE = commitDate"), "commit timestamp is deterministic"],
  [source.includes("normalizeGitStrictInstant"), "offset-bearing Git timestamp normalization is used"],
  [source.includes("--force-with-lease=${targetRef}:"), "publication is atomic create-only compare-and-swap"],
  [source.includes("readDefaultBranchHead"), "remote main is revalidated at production checkpoints"],
  [source.includes('"--body-file"'), "PR body is supplied through a private file"],
  [source.includes("autoMergeRequest"), "PR auto-merge state is refetched"],
  [source.includes("normalizeGitHubInstant"), "GitHub server time is strictly normalized"],
  [!source.includes("allowedExitCodes: [0, 128]"), "cleanup does not accept fatal exit 128"],
  [source.includes("worktree-removal-verification"), "cleanup independently verifies worktree removal"],
  [source.includes('status: "production-boundary-failed"'), "cleanup exceptions preserve a structured production result"],
  [!/\bmergePullRequest\b/.test(source), "adapter exposes no merge capability"],
  [!/\bdeploy\s*\(/.test(source), "adapter exposes no deployment capability"],
  [!/\bcreateRelease\b/.test(source), "adapter exposes no release capability"],
  [!/\bdeleteRef\b/.test(source), "adapter exposes no ref-deletion capability"],
];
for (const [condition, message] of sourceGuards) pass(condition, message);

const regulatoryInvocations = surface.buildCheckInvocations(
  "npm run test:regulatory",
  "/trusted/node",
  "/trusted/repository",
  "/trusted/worktree"
);
equal(regulatoryInvocations.length, surface.regulatoryTestFiles.length, "regulatory check runs every fixed test exactly once");
pass(regulatoryInvocations.every((item) => item.executable === "/trusted/node"), "all regulatory tests use the trusted Node executable");
pass(regulatoryInvocations.every((item) => item.args[1].startsWith("/trusted/repository/")), "loader comes from the trusted dependency checkout");
pass(regulatoryInvocations.every((item) => item.args[2].startsWith("/trusted/worktree/")), "tests execute against the generated worktree commit");
const typeInvocations = surface.buildCheckInvocations(
  "npx tsc --noEmit",
  "/trusted/node",
  "/trusted/repository",
  "/trusted/worktree"
);
equal(typeInvocations[0].executable, "/trusted/node", "TypeScript uses trusted Node");
pass(typeInvocations[0].args[0].endsWith("/node_modules/typescript/bin/tsc"), "TypeScript entry point is exact");
const buildInvocations = surface.buildCheckInvocations(
  "npm run build",
  "/trusted/node",
  "/trusted/repository",
  "/trusted/worktree"
);
pass(buildInvocations[0].args[0].endsWith("/node_modules/next/dist/bin/next"), "Next entry point is exact");
for (const command of [
  "npm run test:regulatory && echo pwned",
  "npm run test:accuracy -- --watch",
  "npx tsc --noEmit; env",
  "npm install",
]) {
  rejects(
    () => surface.buildCheckInvocations(command, "/node", "/repo", "/worktree"),
    /allowlisted/i,
    `modified check is refused: ${command}`
  );
}

console.log(`Controlled production adapter regression passed: ${assertions} assertions.`);
