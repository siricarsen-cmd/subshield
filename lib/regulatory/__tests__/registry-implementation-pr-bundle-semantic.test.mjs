import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";

import {
  fingerprintRegulatoryRegistryValue,
  getRegisteredCitationTemplate,
} from "../registry-integrity.ts";
import {
  applyRegulatoryImplementationStepsToFile,
  buildRegulatoryImplementationPullRequestMetadata,
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

function finalizePlan(payload) {
  return {
    ...payload,
    planChecksum: fingerprintRegulatoryRegistryValue(payload),
  };
}

function recomputeBundleChecksum(bundle) {
  bundle.bundleChecksum = fingerprintRegulatoryRegistryValue(
    (({ bundleChecksum: _ignored, ...rest }) => rest)(bundle)
  );
  return bundle;
}

function recomputePlanChecksum(plan) {
  plan.planChecksum = fingerprintRegulatoryRegistryValue(
    (({ planChecksum: _ignored, ...rest }) => rest)(plan)
  );
  return plan;
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

const REQUIRED_CHECKS = [
  "npm run test:regulatory",
  "npm run test:accuracy",
  "npx tsc --noEmit",
  "npm run build",
];
const PROHIBITED_ACTIONS = [
  "Do not edit or apply registry values outside an explicit code-change pull request.",
  "Do not merge an implementation pull request without fresh required checks and deliberate merge authorization.",
  "Do not use this plan, its stored JSON, or its checksum as a replacement for live human authorization.",
  "Do not change customer reports, analyzer conclusions, payments, authentication, databases, or deployment configuration from this plan.",
];

function buildTestPlan(sourceId, step, label) {
  const reviewRecordChecksum = sha256(`${label}:review-record`);
  const draftChecksum = sha256(`${label}:draft`);
  const payload = {
    schemaVersion: 1,
    planId: `regulatory-registry-implementation:${sourceId}:${reviewRecordChecksum}`,
    sourceId,
    baseCommitSha: BASE_COMMIT,
    reviewRecordChecksum,
    reviewAuthorizationChecksum: sha256(`${label}:review-authorization`),
    draftId: `regulatory-change-set:${sourceId}:${label}`,
    draftChecksum,
    releaseRecordId: `regulatory-release:${sourceId}:${label}`,
    releaseRecordFingerprint: sha256(`${label}:release-record`),
    reviewerPrincipal: "Alex Rivera",
    createdAt: "2026-07-26T12:00:00.000Z",
    preparedBy: "SubShield controlled implementation planner",
    targetBranch: `regulatory-update/${sourceId}/${draftChecksum.replace(/^sha256:/, "").slice(0, 12)}`,
    steps: [step],
    requiredChecks: [...REQUIRED_CHECKS],
    prohibitedActions: [...PROHIBITED_ACTIONS],
    authorizationStatus: "live-human-review-receipt-required",
    applicationStatus: "not-applied",
    customerFacingStatus: "benchmark-only",
    mergeStatus: "not-authorized",
  };
  return finalizePlan(payload);
}

function buildTestBundle(plan, source, after, mappingId) {
  const metadata = buildRegulatoryImplementationPullRequestMetadata(plan);
  return finalizeBundle({
    schemaVersion: 1,
    ...metadata,
    planId: plan.planId,
    planChecksum: plan.planChecksum,
    baseCommitSha: plan.baseCommitSha,
    targetBranch: plan.targetBranch,
    files: [
      {
        path: TARGET_FILE,
        beforeChecksum: sha256(source),
        afterChecksum: sha256(after),
        changedRegistryIds: [mappingId],
        content: after,
      },
    ],
    requiredChecks: [...plan.requiredChecks],
    prohibitedActions: [...plan.prohibitedActions],
    authorizationStatus: "live-plan-required",
    applicationStatus: "not-applied",
    customerFacingStatus: "benchmark-only",
    mergeStatus: "not-authorized",
  });
}

const MAPPING_ID = "qa-c-future-cmmc-by-notice";
const SOURCE_ID = "dfars-252-204-7025";
const BASELINE_MAPPING_ID = "qa-c-incident-reporting-and-preservation";
const BASELINE_SOURCE_ID = "dfars-252-204-7012";
const TARGET_FILE = "lib/regulatory/source-coverage-citation-packages.ts";
const EXTRA_ALLOWED_FILE = "lib/regulatory/benchmark-applicability-mappings.ts";
const BASE_COMMIT = execFileSync("git", ["rev-parse", "HEAD"], {
  encoding: "utf8",
}).trim();
const current = getRegisteredCitationTemplate(MAPPING_ID);
if (!current) throw new Error(`Missing citation package: ${MAPPING_ID}`);

const source = execFileSync("git", ["show", `${BASE_COMMIT}:${TARGET_FILE}`], {
  encoding: "utf8",
});
const proposed = jsonClone(current.value);
const changedCitation = proposed.citations.find(
  (citation) => citation.sourceId === SOURCE_ID
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

const plan = buildTestPlan(SOURCE_ID, step, "semantic-regression");
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

const bundle = buildTestBundle(plan, source, after, MAPPING_ID);
check(
  "plan-bound validation accepts an exact deterministic semantic reproduction",
  validateRegulatoryImplementationPullRequestBundle(bundle, plan).length === 0
);

const baselineCurrent = getRegisteredCitationTemplate(BASELINE_MAPPING_ID);
if (!baselineCurrent) throw new Error(`Missing baseline citation package: ${BASELINE_MAPPING_ID}`);
const baselineProposed = jsonClone(baselineCurrent.value);
const baselineCitation = baselineProposed.citations.find(
  (citation) => citation.sourceId === BASELINE_SOURCE_ID
);
if (!baselineCitation) throw new Error("Missing baseline DFARS 252.204-7012 citation");
const baselineSentence =
  "The reviewed baseline-only citation package is retained through the full registry override.";
baselineCitation.snapshotId = "dfars-252-204-7012:baseline-only-semantic-candidate";
baselineCitation.checksum = sha256("baseline-only-approved-snapshot");
baselineCitation.excerpt = `${baselineCitation.excerpt}\n${baselineSentence}`;
baselineCitation.excerptChecksum = sha256(baselineCitation.excerpt);
const baselineProposedFingerprint = fingerprintRegulatoryRegistryValue(baselineProposed);
const baselineStep = {
  ...step,
  id: BASELINE_MAPPING_ID,
  currentFingerprint: baselineCurrent.fingerprint,
  proposedFingerprint: baselineProposedFingerprint,
  proposedValue: baselineProposed,
  officialSourceIds: baselineProposed.citations.map((citation) => citation.sourceId),
  officialSnapshotIds: baselineProposed.citations.map((citation) => citation.snapshotId),
  reason: "Baseline-only full citation-registry override regression.",
};
const baselinePlan = buildTestPlan(
  BASELINE_SOURCE_ID,
  baselineStep,
  "baseline-only-semantic-regression"
);
const baselineAfter = applyRegulatoryImplementationStepsToFile(source, [baselineStep]);
const baselineEmitted = emittedOverrides(baselineAfter)[BASELINE_MAPPING_ID];
check(
  "a baseline-only citation package is emitted through the full registry override surface",
  baselineEmitted?.packageId === baselineCurrent.value.packageId &&
    baselineEmitted.citations.some(
      (citation) =>
        citation.snapshotId === baselineCitation.snapshotId &&
        citation.checksum === baselineCitation.checksum &&
        citation.excerpt.includes(baselineSentence)
    ) &&
    fingerprintRegulatoryRegistryValue(baselineEmitted) === baselineProposedFingerprint
);
const baselineBundle = buildTestBundle(
  baselinePlan,
  source,
  baselineAfter,
  BASELINE_MAPPING_ID
);
check(
  "plan-bound regeneration accepts a baseline-only citation transition",
  validateRegulatoryImplementationPullRequestBundle(baselineBundle, baselinePlan).length === 0
);

const unknownTarget = structuredClone(baselineStep);
unknownTarget.id = "qa-c-unregistered-citation-target";
unknownTarget.proposedValue.mappingId = unknownTarget.id;
unknownTarget.proposedValue.packageId = `${unknownTarget.id}-package`;
unknownTarget.proposedFingerprint = fingerprintRegulatoryRegistryValue(
  unknownTarget.proposedValue
);
checkRejects(
  "an unregistered citation mapping cannot use the override surface",
  () => applyRegulatoryImplementationStepsToFile(source, [unknownTarget]),
  /citation target is not registered/i
);

const unauthorizedPlan = structuredClone(plan);
unauthorizedPlan.requiredChecks = ["npm run test:regulatory"];
unauthorizedPlan.prohibitedActions = [];
recomputePlanChecksum(unauthorizedPlan);
const unauthorizedBundle = structuredClone(bundle);
const unauthorizedMetadata = buildRegulatoryImplementationPullRequestMetadata(unauthorizedPlan);
unauthorizedBundle.planChecksum = unauthorizedPlan.planChecksum;
unauthorizedBundle.bundleId = unauthorizedMetadata.bundleId;
unauthorizedBundle.commitMessage = unauthorizedMetadata.commitMessage;
unauthorizedBundle.pullRequestTitle = unauthorizedMetadata.pullRequestTitle;
unauthorizedBundle.pullRequestBody = unauthorizedMetadata.pullRequestBody;
unauthorizedBundle.requiredChecks = [...unauthorizedPlan.requiredChecks];
unauthorizedBundle.prohibitedActions = [...unauthorizedPlan.prohibitedActions];
recomputeBundleChecksum(unauthorizedBundle);
check(
  "a checksum-consistent caller-reconstructed plan cannot remove required safeguards",
  validateRegulatoryImplementationPullRequestBundle(unauthorizedBundle, unauthorizedPlan).some(
    (error) => /implementation pr bundle plan is invalid|escaped its non-applied/i.test(error)
  )
);

const requestOnly = structuredClone(bundle);
requestOnly.files[0].content = requestOnly.files[0].content
  .replace(
    /(export\s+const\s+APPROVED_COVERAGE_PACKAGE_OVERRIDES[\s\S]*?=\s*)\{[\s\S]*?\};/,
    "$1{};"
  )
  .replace("DFARS 252.204-7025(b)", "DFARS   252.204-7025(b)");
requestOnly.files[0].afterChecksum = sha256(requestOnly.files[0].content);
recomputeBundleChecksum(requestOnly);
check(
  "request-only output cannot substitute for the approved complete-package override",
  validateRegulatoryImplementationPullRequestBundle(requestOnly, plan).some((error) =>
    /citation override is missing|fingerprint does not match plan|do not exactly reproduce/i.test(error)
  )
);

const tampered = structuredClone(bundle);
tampered.files[0].content = tampered.files[0].content.replace(
  insertedSentence,
  "Tampered approved citation excerpt."
);
tampered.files[0].afterChecksum = sha256(tampered.files[0].content);
recomputeBundleChecksum(tampered);
check(
  "recomputed file and bundle checksums cannot hide semantic citation tampering",
  validateRegulatoryImplementationPullRequestBundle(tampered, plan).some((error) =>
    /fingerprint does not match plan|do not exactly reproduce/i.test(error)
  )
);

const unplannedId = structuredClone(bundle);
unplannedId.files[0].changedRegistryIds.push("unplanned-registry-id");
recomputeBundleChecksum(unplannedId);
check(
  "a checksum-consistent unplanned registry ID is refused",
  validateRegulatoryImplementationPullRequestBundle(unplannedId, plan).some((error) =>
    /do not exactly reproduce/i.test(error)
  )
);

const unrelatedContent = structuredClone(bundle);
unrelatedContent.files[0].content = `${unrelatedContent.files[0].content}\n// unrelated caller byte\n`;
unrelatedContent.files[0].beforeChecksum = sha256("caller-selected-unrelated-base");
unrelatedContent.files[0].afterChecksum = sha256(unrelatedContent.files[0].content);
recomputeBundleChecksum(unrelatedContent);
check(
  "caller-selected unrelated content and before checksum are refused",
  validateRegulatoryImplementationPullRequestBundle(unrelatedContent, plan).some((error) =>
    /do not exactly reproduce/i.test(error)
  )
);

const extraBase = execFileSync("git", ["show", `${BASE_COMMIT}:${EXTRA_ALLOWED_FILE}`], {
  encoding: "utf8",
});
const extraContent = `${extraBase}\n// allowed path but not authorized by this plan\n`;
const extraAllowedFile = structuredClone(bundle);
extraAllowedFile.files.push({
  path: EXTRA_ALLOWED_FILE,
  beforeChecksum: sha256(extraBase),
  afterChecksum: sha256(extraContent),
  changedRegistryIds: ["unplanned-mapping-id"],
  content: extraContent,
});
recomputeBundleChecksum(extraAllowedFile);
check(
  "an allowed-but-unplanned file is refused after checksum recomputation",
  validateRegulatoryImplementationPullRequestBundle(extraAllowedFile, plan).some((error) =>
    /do not exactly reproduce/i.test(error)
  )
);

for (const [field, replacement] of [
  ["bundleId", `${bundle.bundleId}:tampered`],
  ["commitMessage", "feat(regulatory): bypass controlled implementation"],
  ["pullRequestTitle", "Merge regulatory changes immediately"],
  [
    "pullRequestBody",
    bundle.pullRequestBody.replace(
      "It does not authorize merge or deployment.",
      "Merge and deploy immediately without further review."
    ),
  ],
]) {
  const metadataTampered = structuredClone(bundle);
  metadataTampered[field] = replacement;
  recomputeBundleChecksum(metadataTampered);
  check(
    `checksum-consistent ${field} tampering is refused`,
    validateRegulatoryImplementationPullRequestBundle(metadataTampered, plan).some((error) =>
      /metadata does not reproduce/i.test(error)
    )
  );
}

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
