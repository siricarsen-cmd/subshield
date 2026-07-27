import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  executeRegulatoryImplementationWithProductionAdapter,
  regulatoryImplementationProductionAdapterTestSurface as surface,
} from "../registry-implementation-production-adapter.ts";

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
equal(
  surface.normalizeOriginUrl("git@github.com:siricarsen-cmd/subshield.git"),
  "siricarsen-cmd/subshield",
  "canonical SCP-style SSH origin must normalize"
);
equal(
  surface.normalizeOriginUrl("ssh://git@github.com/siricarsen-cmd/subshield.git"),
  "siricarsen-cmd/subshield",
  "canonical SSH URL must normalize"
);
rejects(
  () => surface.normalizeOriginUrl("http://github.com/siricarsen-cmd/subshield.git"),
  /protocol/i,
  "plain HTTP must be refused"
);
rejects(
  () => surface.normalizeOriginUrl("https://token@github.com/siricarsen-cmd/subshield.git"),
  /credentials/i,
  "credential-bearing HTTPS origins must be refused"
);
rejects(
  () => surface.normalizeOriginUrl("https://github.example.com/siricarsen-cmd/subshield.git"),
  /host/i,
  "alternate hosts must be refused"
);
rejects(
  () => surface.normalizeOriginUrl("git@evil.example:siricarsen-cmd/subshield.git"),
  /invalid/i,
  "alternate SCP hosts must be refused"
);
rejects(
  () => surface.normalizeOriginUrl("ssh://root@github.com/siricarsen-cmd/subshield.git"),
  /identity/i,
  "non-git SSH identities must be refused"
);
rejects(
  () => surface.normalizeOriginUrl("https://github.com/siricarsen-cmd/subshield/extra"),
  /repository/i,
  "lookalike nested repositories must be refused"
);

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

equal(
  surface.validateRepositoryPath(expectedPaths[0]),
  expectedPaths[0],
  "authorized mapping path must be accepted"
);
equal(
  surface.validateRepositoryPath(expectedPaths[1]),
  expectedPaths[1],
  "authorized history path must be accepted"
);
equal(
  surface.validateRepositoryPath(expectedPaths[2]),
  expectedPaths[2],
  "authorized citation path must be accepted"
);
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

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(
  join(here, "..", "registry-implementation-production-adapter.ts"),
  "utf8"
);
pass(source.includes('shell: false'), "process execution must explicitly disable shell mode");
pass(!source.includes('shell: true'), "production adapter must never enable shell mode");
pass(!/export\s+class\s+ProductionRegulatoryImplementationAdapter/.test(source), "real adapter class must remain internal");
pass(source.includes('worktree", "add"'), "production adapter must use an isolated Git worktree");
pass(source.includes('"--no-verify"'), "commit hooks must not execute");
pass(source.includes('commit.gpgSign=false'), "commit signing prompts must be disabled");
pass(source.includes('"push", "--porcelain"'), "push must use the exact non-force path");
pass(!source.includes('"--force-with-lease"'), "force-with-lease must not be available");
pass(!source.includes('"push", "--force"'), "force push must not be available");
pass(source.includes('"--body-file"'), "pull-request body must use a private file");
pass(source.includes('readDefaultBranchHead'), "remote main must be re-read through the adapter");
pass(source.includes('viewerPermission'), "authenticated repository permission must be checked");
pass(source.includes('github-user:'), "receipt principal must be tied to authenticated GitHub identity");
pass(source.includes('autoMergeRequest'), "hosted auto-merge state must be inspected");
pass(source.includes('createdAt'), "GitHub server creation time must be retained");
pass(!/\bmergePullRequest\b/.test(source), "adapter must expose no merge capability");
pass(!/\bdeploy\s*\(/.test(source), "adapter must expose no deployment capability");
pass(!/\bdeleteRef\b/.test(source), "adapter must expose no ref-deletion capability");
pass(!/\bcreateRelease\b/.test(source), "adapter must expose no release capability");

console.log(`Controlled production adapter regression passed: ${assertions} assertions.`);
