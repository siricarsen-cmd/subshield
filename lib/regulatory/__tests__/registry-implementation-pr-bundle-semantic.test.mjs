import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { fingerprintRegulatoryRegistryValue, getRegisteredCitationTemplate } from "../registry-integrity.ts";
import {
  applyRegulatoryImplementationStepsToFile,
  validateRegulatoryImplementationPullRequestBundle,
} from "../registry-implementation-pr-bundle.ts";

let assertions = 0;
let failures = 0;

function check(label, condition, details = "") {
  assertions++;
  if (condition) console.log(`PASS: ${label}`);
  else {
    failures++;
    console.error(`FAIL: ${label}${details ? ` — ${details}` : ""}`);
  }
}

function checkRejects(label, action, pattern) {
  assertions++;
  try {
    action();
    failures++;
    console.error(`FAIL: ${label} — expected rejection`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (pattern.test(message)) console.log(`PASS: ${label}`);
    else {
      failures++;
      console.error(`FAIL: ${label} — ${message}`);
    }
  }
}

function sha256(value) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function jsonClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function finalizeBundle(payload) {
  return {
    ...payload,
    bundleChecksum: fingerprintRegulatoryRegistryValue(payload),
  };
}

function emittedOverrides(content) {
  const declaration = content.indexOf("export const APPROVED_COVERAGE_PACKAGE_OVERRIDES");
  if (declaration < 0) throw new Error("Emitted citation override registry was not found");
  const assignment = content.indexOf("=", declaration);
  const start = content.indexOf("{", assignment);
  let depth = 0;
  let quote;
  let escaped = false;
  for (let index = start; index < content.length; index++) {
    const character = content[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === quote) quote = undefined;
      continue;
    }
    if (character === '"' || character === "'") quote = character;
    else if (character === "{") depth++;
    else if (character === "}" && --depth === 0) {
      return JSON.parse(content.slice(start, index + 1));
    }
  }
  throw new Error("Emitted citation override registry is malformed");
}

const MAPPING_ID = "qa-c-future-cmmc-by-notice";
const TARGET_FILE = "lib/regulatory/source-coverage-citation-packages.ts";
const current = getRegisteredCitationTemplate(MAPPING_ID);
if (!current) throw new Error(`Missing citation package: ${MAPPING_ID}`);

const source = readFileSync(TARGET_FILE, "utf8");
const proposed = jsonClone(current.value);
const changedCitation = proposed.citations.find(
  (citation) => citation.sourceId === "dfars-252-204-7025"
);
if (!changedCitation) throw new Error("Missing DFARS 252.204-7025 citation");

const insertedSentence =
  "The offeror shall retain the independently reviewed semantic bundle notice.";
changedCitation.snapshotId = "dfars-252-204-7025:semantic-bundle-candidate";
changedCitation.checksum = sha256("semantic-bundle-approved-snapshot");
changedCitation.excerpt = `${changedCitation.excerpt}\n${insertedSentence}`;
changedCitation.excerptChecksum = sha256(changedCitation.excerpt);

const proposedFingerprint = fingerprintRegulatoryRegistryValue(proposed);
const step = {
  kind: "citation-template",
  id: MAPPING_ID,
  targetFile: TARGET_FILE,
  currentFingerprint: current.fingerprint,
  proposedFingerprint,
  proposedValue: proposed,
  officialSourceIds: proposed.citations.map((citation) => citation.sourceId),
  officialSnapshotIds: proposed.citations.map((citation) => citation.snapshotId),
  reason: "Semantic complete-package implementation-bundle regression.",
  benchmarkImpact: ["Citation grounding"],
  regressionPlan: ["Complete package semantic reproduction"],
  applicationStatus: "not-applied",
};

const plan = {
  planId: "regulatory-implementation-plan:semantic-regression",
  planChecksum: sha256("semantic-regression-plan"),
  baseCommitSha: "a".repeat(40),
  targetBranch: "regulatory/semantic-regression",
  requiredChecks: ["npm run test:regulatory"],
  prohibitedActions: ["merge-without-explicit-authorization"],
  steps: [step],
};

const after = applyRegulatoryImplementationStepsToFile(source, [step]);
const emitted = emittedOverrides(after)[MAPPING_ID];
check(
  "the emitted complete-package override reproduces the approved semantic fingerprint",
  emitted?.citations.some(
    (citation) =>
      citation.snapshotId === changedCitation.snapshotId &&
      citation.checksum === changedCitation.checksum &&
      citation.excerpt.includes(insertedSentence)
  ) && fingerprintRegulatoryRegistryValue(emitted) === proposedFingerprint
);
check(
  "the unchanged canonical source retains an empty override registry and current fingerprint",
  Object.keys(emittedOverrides(source)).length === 0 &&
    getRegisteredCitationTemplate(MAPPING_ID)?.fingerprint === current.fingerprint
);

const payload = {
  schemaVersion: 1,
  bundleId: "regulatory-implementation-pr:semantic-regression",
  planId: plan.planId,
  planChecksum: plan.planChecksum,
  baseCommitSha: plan.baseCommitSha,
  targetBranch: plan.targetBranch,
  commitMessage: "test: semantic regulatory bundle",
  pullRequestTitle: "Semantic regulatory bundle regression",
  pullRequestBody: "Does not authorize merge.",
  files: [
    {
      path: TARGET_FILE,
      beforeChecksum: sha256(source),
      afterChecksum: sha256(after),
      changedRegistryIds: [MAPPING_ID],
      content: after,
    },
  ],
  requiredChecks: [...plan.requiredChecks],
  prohibitedActions: [...plan.prohibitedActions],
  authorizationStatus: "live-plan-required",
  applicationStatus: "not-applied",
  customerFacingStatus: "benchmark-only",
  mergeStatus: "not-authorized",
};
const bundle = finalizeBundle(payload);
check(
  "plan-bound validation accepts a checksum-bound semantic reproduction",
  validateRegulatoryImplementationPullRequestBundle(bundle, plan).length === 0
);

const requestOnly = structuredClone(bundle);
requestOnly.files[0].content = requestOnly.files[0].content
  .replace(
    /(export\s+const\s+APPROVED_COVERAGE_PACKAGE_OVERRIDES[\s\S]*?=\s*)\{[\s\S]*?\};/,
    "$1{};"
  )
  .replace("DFARS 252.204-7025(b)", "DFARS   252.204-7025(b)");
requestOnly.files[0].afterChecksum = sha256(requestOnly.files[0].content);
requestOnly.bundleChecksum = fingerprintRegulatoryRegistryValue(
  (({ bundleChecksum: _ignored, ...rest }) => rest)(requestOnly)
);
check(
  "request-only output cannot substitute for the approved complete-package override",
  validateRegulatoryImplementationPullRequestBundle(requestOnly, plan).some((error) =>
    /citation override is missing|fingerprint does not match plan/i.test(error)
  )
);

const tampered = structuredClone(bundle);
tampered.files[0].content = tampered.files[0].content.replace(
  insertedSentence,
  "Tampered approved citation excerpt."
);
tampered.files[0].afterChecksum = sha256(tampered.files[0].content);
tampered.bundleChecksum = fingerprintRegulatoryRegistryValue(
  (({ bundleChecksum: _ignored, ...rest }) => rest)(tampered)
);
check(
  "recomputed file and bundle checksums cannot hide semantic citation tampering",
  validateRegulatoryImplementationPullRequestBundle(tampered, plan).some((error) =>
    /fingerprint does not match plan/i.test(error)
  )
);

const wrongMapping = structuredClone(step);
wrongMapping.proposedValue.mappingId = "qa-c-wrong-mapping";
wrongMapping.proposedFingerprint = fingerprintRegulatoryRegistryValue(wrongMapping.proposedValue);
checkRejects(
  "a complete-package override with the wrong mapping identity is refused",
  () => applyRegulatoryImplementationStepsToFile(source, [wrongMapping]),
  /citation override is invalid/i
);

const wrongPackage = structuredClone(step);
wrongPackage.proposedValue.packageId = `${MAPPING_ID}-wrong-package`;
wrongPackage.proposedFingerprint = fingerprintRegulatoryRegistryValue(wrongPackage.proposedValue);
checkRejects(
  "a complete-package override with the wrong package identity is refused",
  () => applyRegulatoryImplementationStepsToFile(source, [wrongPackage]),
  /citation override is invalid/i
);

const staleSnapshot = structuredClone(step);
staleSnapshot.proposedValue = jsonClone(current.value);
checkRejects(
  "an old snapshot package cannot satisfy the newly approved proposed fingerprint",
  () => applyRegulatoryImplementationStepsToFile(source, [staleSnapshot]),
  /citation override is invalid/i
);

if (failures > 0) {
  console.error(`\n${failures} of ${assertions} semantic implementation-bundle assertions failed.`);
  process.exit(1);
}

console.log(`\nAll ${assertions} semantic implementation-bundle assertions passed.`);
