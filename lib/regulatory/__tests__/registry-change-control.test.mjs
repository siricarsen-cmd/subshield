import { createHash } from "node:crypto";

import {
  approveRegulatoryRegistryChangeSet,
  createRegulatoryRegistryReleaseRecord,
  validateRegulatoryRegistryChangeSet,
} from "../registry-change-control.ts";
import {
  fingerprintRegulatoryRegistryValue,
  getRegisteredCitationTemplate,
  getRegisteredHistoricalGroundingPolicy,
  getRegisteredRegulatoryMapping,
  validateRegulatoryRegistryIntegrity,
} from "../registry-integrity.ts";

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

function expectThrow(label, action, pattern) {
  let message = "";
  try {
    action();
  } catch (error) {
    message = error instanceof Error ? error.message : String(error);
  }
  check(label, pattern.test(message), message);
}

function sha256Text(value) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

const MAPPING_ID = "qa-c-future-cmmc-by-notice";
const mappingEntry = getRegisteredRegulatoryMapping(MAPPING_ID);
const policyEntry = getRegisteredHistoricalGroundingPolicy(MAPPING_ID);
const templateEntry = getRegisteredCitationTemplate(MAPPING_ID);
if (!mappingEntry || !policyEntry || !templateEntry) {
  throw new Error("Missing canonical future-CMMC registry entries");
}

function officialEvidence(sourceId = "dfars-252-204-7025") {
  const citation = templateEntry.value.citations.find(
    (candidate) => candidate.sourceId === sourceId
  );
  if (!citation) throw new Error(`Missing registered citation evidence for ${sourceId}`);
  return {
    sourceId,
    snapshotId: citation.snapshotId,
    citation: citation.citation,
    checksum: citation.checksum,
    evidenceNote:
      "Reviewed official-source snapshot supports the controlled benchmark registry transition.",
  };
}

function change(kind, entry, afterValue, overrides = {}) {
  return {
    kind,
    id: MAPPING_ID,
    beforeFingerprint: entry.fingerprint,
    afterValue,
    afterFingerprint: fingerprintRegulatoryRegistryValue(afterValue),
    reason:
      "Update a controlled benchmark registry value in response to reviewed official-source evidence.",
    officialEvidence: [officialEvidence()],
    benchmarkImpact: [
      "Re-run historical grounding and citation regeneration for the affected QA-C mapping.",
    ],
    regressionPlan: [
      "Preserve positive, negative, historical selection, and exact citation regressions.",
    ],
    ...overrides,
  };
}

function pendingChangeSet(changes, overrides = {}) {
  return {
    changeSetId: "registry-change-qa-c-cmmc-2026-07-25-01",
    createdAt: "2026-07-25T21:00:00.000Z",
    requestedBy: "SubShield regulatory maintainer",
    changes,
    customerFacingStatus: "benchmark-only",
    reviewStatus: "pending",
    ...overrides,
  };
}

const updatedTemplate = structuredClone(templateEntry.value);
updatedTemplate.citations[0].locator = `${updatedTemplate.citations[0].locator} — reviewed locator clarification`;
const validTemplateChange = change(
  "citation-template",
  templateEntry,
  updatedTemplate
);
const validPending = pendingChangeSet([validTemplateChange]);
const validPendingResult = validateRegulatoryRegistryChangeSet(validPending);
check(
  "a source-preserving benchmark template change with approved retained evidence is a valid pending change set",
  validPendingResult.valid,
  validPendingResult.errors.join(" | ")
);

const stale = structuredClone(validPending);
stale.changes[0].beforeFingerprint = `sha256:${"0".repeat(64)}`;
check(
  "a stale before fingerprint is rejected",
  validateRegulatoryRegistryChangeSet(stale).errors.some((error) =>
    /stale before fingerprint/i.test(error)
  )
);

const tamperedAfterFingerprint = structuredClone(validPending);
tamperedAfterFingerprint.changes[0].afterFingerprint = `sha256:${"1".repeat(64)}`;
check(
  "a caller-supplied after fingerprint must reproduce from the after value",
  validateRegulatoryRegistryChangeSet(tamperedAfterFingerprint).errors.some((error) =>
    /after fingerprint does not reproduce/i.test(error)
  )
);

const noOp = pendingChangeSet([
  change(
    "citation-template",
    templateEntry,
    structuredClone(templateEntry.value)
  ),
]);
check(
  "a no-op registry transition is rejected",
  validateRegulatoryRegistryChangeSet(noOp).errors.some((error) =>
    /no-op registry transitions/i.test(error)
  )
);

const missingEvidence = structuredClone(validPending);
missingEvidence.changes[0].officialEvidence = [];
check(
  "official-source evidence is required for every transition",
  validateRegulatoryRegistryChangeSet(missingEvidence).errors.some((error) =>
    /official source evidence is required/i.test(error)
  )
);

const unknownEvidence = structuredClone(validPending);
unknownEvidence.changes[0].officialEvidence[0].sourceId = "unknown-government-source";
check(
  "official evidence must use an approved source catalog ID",
  validateRegulatoryRegistryChangeSet(unknownEvidence).errors.some((error) =>
    /unknown approved source ID/i.test(error)
  )
);

const badChecksumEvidence = structuredClone(validPending);
badChecksumEvidence.changes[0].officialEvidence[0].checksum = "sha256:not-a-checksum";
check(
  "official evidence requires a valid SHA-256 checksum",
  validateRegulatoryRegistryChangeSet(badChecksumEvidence).errors.some((error) =>
    /evidence checksum must be a SHA-256/i.test(error)
  )
);

const fabricatedEvidence = structuredClone(validPending);
fabricatedEvidence.changes[0].officialEvidence[0] = {
  sourceId: "dfars-252-204-7025",
  snapshotId: "fabricated-approved-looking-snapshot",
  citation: "Fabricated citation label",
  checksum: `sha256:${"2".repeat(64)}`,
  evidenceNote: "Fabricated metadata must not become official support.",
};
check(
  "syntactically valid fabricated evidence is rejected when it is not a retained approved snapshot",
  validateRegulatoryRegistryChangeSet(fabricatedEvidence).errors.some((error) =>
    /does not resolve to a retained approved snapshot/i.test(error)
  )
);

const wrongRetainedEvidence = structuredClone(validPending);
wrongRetainedEvidence.changes[0].officialEvidence[0].citation =
  "Altered citation label for a real retained snapshot";
wrongRetainedEvidence.changes[0].officialEvidence[0].checksum =
  `sha256:${"3".repeat(64)}`;
const wrongRetainedErrors = validateRegulatoryRegistryChangeSet(
  wrongRetainedEvidence
).errors;
check(
  "evidence citation and checksum must match the retained approved snapshot",
  wrongRetainedErrors.some((error) => /evidence citation does not match/i.test(error)) &&
    wrongRetainedErrors.some((error) => /evidence checksum does not match/i.test(error))
);

const fabricatedTemplate = structuredClone(updatedTemplate);
const fabricatedText = "Fabricated regulatory excerpt that is absent from the approved source.";
fabricatedTemplate.citations[0].excerpt = fabricatedText;
fabricatedTemplate.citations[0].excerptChecksum = sha256Text(fabricatedText);
const fabricatedTemplateSet = pendingChangeSet([
  change("citation-template", templateEntry, fabricatedTemplate),
], {
  changeSetId: "registry-change-qa-c-cmmc-fabricated-excerpt",
});
check(
  "a proposed citation template with fabricated excerpt text is rejected after deterministic retained-snapshot extraction",
  validateRegulatoryRegistryChangeSet(fabricatedTemplateSet).errors.some((error) =>
    /citation excerpt does not match deterministic extraction/i.test(error)
  )
);

const pendingWithFakeReview = {
  ...structuredClone(validPending),
  reviewedBy: "Premature reviewer",
  reviewedAt: "2026-07-25T21:01:00.000Z",
  reviewNotes: ["This pending set should not claim final approval."],
};
check(
  "a pending change set cannot contain final reviewer provenance",
  validateRegulatoryRegistryChangeSet(pendingWithFakeReview).errors.some((error) =>
    /pending change sets must not contain final review provenance/i.test(error)
  )
);

const manuallyApprovedWithoutReviewer = {
  ...structuredClone(validPending),
  reviewStatus: "approved",
};
check(
  "an approved change set without reviewer provenance is rejected",
  validateRegulatoryRegistryChangeSet(manuallyApprovedWithoutReviewer).errors.some(
    (error) => /approved change sets require a reviewer/i.test(error)
  )
);

const duplicateTransition = pendingChangeSet([
  validTemplateChange,
  structuredClone(validTemplateChange),
]);
check(
  "duplicate kind-and-ID transitions are rejected",
  validateRegulatoryRegistryChangeSet(duplicateTransition).errors.some((error) =>
    /duplicate registry transition/i.test(error)
  )
);

const wrongIdentityTemplate = structuredClone(updatedTemplate);
wrongIdentityTemplate.mappingId = "qa-c-incident-reporting-and-preservation";
const wrongIdentity = pendingChangeSet([
  change("citation-template", templateEntry, wrongIdentityTemplate),
]);
check(
  "an after value cannot change its registered identity",
  validateRegulatoryRegistryChangeSet(wrongIdentity).errors.some((error) =>
    /after-value identity mismatch/i.test(error)
  )
);

const mappingWithout170 = structuredClone(mappingEntry.value);
mappingWithout170.sourceComparisons = mappingWithout170.sourceComparisons.filter(
  (comparison) => comparison.sourceId !== "ecfr-32-part-170"
);
const uncoordinatedSourceChange = pendingChangeSet([
  change("mapping", mappingEntry, mappingWithout170),
]);
check(
  "a mapping source-list change is rejected unless policy and template changes are coordinated",
  validateRegulatoryRegistryChangeSet(uncoordinatedSourceChange).errors.some((error) =>
    /source-list changes require coordinated/i.test(error)
  )
);

const policyWithout170 = structuredClone(policyEntry.value);
policyWithout170.sourcePolicies = policyWithout170.sourcePolicies.filter(
  (sourcePolicy) => sourcePolicy.sourceId !== "ecfr-32-part-170"
);
const templateWithout170 = structuredClone(templateEntry.value);
templateWithout170.citations = templateWithout170.citations.filter(
  (citation) => citation.sourceId !== "ecfr-32-part-170"
);
templateWithout170.uncoveredSourceIds = [];
templateWithout170.sourceCoverage = "complete";
const coordinatedChanges = pendingChangeSet([
  change("mapping", mappingEntry, mappingWithout170),
  change("historical-policy", policyEntry, policyWithout170),
  change("citation-template", templateEntry, templateWithout170),
], {
  changeSetId: "registry-change-qa-c-cmmc-2026-07-25-coordinated",
});
const coordinatedResult = validateRegulatoryRegistryChangeSet(coordinatedChanges);
check(
  "coordinated mapping, policy, and template source-list changes with matching after sets pass validation",
  coordinatedResult.valid,
  coordinatedResult.errors.join(" | ")
);

const mismatchedCoordinated = structuredClone(coordinatedChanges);
const mismatchedPolicyChange = mismatchedCoordinated.changes.find(
  (candidate) => candidate.kind === "historical-policy"
);
const extraSourcePolicy = structuredClone(policyEntry.value.sourcePolicies[0]);
extraSourcePolicy.sourceId = "dfars-252-204-7012";
extraSourcePolicy.rationale =
  "Deliberately mismatched approved source for coordinated-set regression coverage.";
mismatchedPolicyChange.afterValue.sourcePolicies.push(extraSourcePolicy);
mismatchedPolicyChange.afterFingerprint = fingerprintRegulatoryRegistryValue(
  mismatchedPolicyChange.afterValue
);
check(
  "coordinated source changes are rejected when the three after-source sets differ",
  validateRegulatoryRegistryChangeSet(mismatchedCoordinated).errors.some((error) =>
    /coordinated after-source sets must match/i.test(error)
  )
);

const beforeRegistryFingerprints = {
  mapping: mappingEntry.fingerprint,
  policy: policyEntry.fingerprint,
  template: templateEntry.fingerprint,
};
const approved = approveRegulatoryRegistryChangeSet(
  validPending,
  "Independent SubShield regulatory reviewer",
  "2026-07-25T21:30:00.000Z",
  [
    "Reviewed official-source evidence, benchmark impact, and regression plan.",
    "Approval authorizes a future controlled registry update but does not apply it.",
  ]
);
check(
  "approval creates an immutable approved copy with reviewer provenance",
  approved.reviewStatus === "approved" &&
    approved.reviewedBy === "Independent SubShield regulatory reviewer" &&
    Object.isFrozen(approved) &&
    Object.isFrozen(approved.changes) &&
    Object.isFrozen(approved.changes[0].afterValue)
);

const releaseRecord = createRegulatoryRegistryReleaseRecord(
  approved,
  "2026-07-25T21:31:00.000Z"
);
check(
  "an approved change set creates an immutable not-applied release record",
  releaseRecord.applicationStatus === "not-applied" &&
    releaseRecord.customerFacingStatus === "benchmark-only" &&
    releaseRecord.transitions[0].beforeFingerprint ===
      validTemplateChange.beforeFingerprint &&
    releaseRecord.transitions[0].afterFingerprint ===
      validTemplateChange.afterFingerprint &&
    Object.isFrozen(releaseRecord) &&
    Object.isFrozen(releaseRecord.transitions)
);
check(
  "approval and release records do not mutate or apply the canonical registries",
  getRegisteredRegulatoryMapping(MAPPING_ID)?.fingerprint ===
    beforeRegistryFingerprints.mapping &&
    getRegisteredHistoricalGroundingPolicy(MAPPING_ID)?.fingerprint ===
      beforeRegistryFingerprints.policy &&
    getRegisteredCitationTemplate(MAPPING_ID)?.fingerprint ===
      beforeRegistryFingerprints.template &&
    validateRegulatoryRegistryIntegrity().length === 0
);

expectThrow(
  "approval refuses invalid pending sets",
  () =>
    approveRegulatoryRegistryChangeSet(
      stale,
      "Reviewer",
      "2026-07-25T21:40:00.000Z",
      ["Reviewed but stale."]
    ),
  /Pending regulatory registry change set is invalid/i
);
expectThrow(
  "approval refuses blank reviewer provenance",
  () =>
    approveRegulatoryRegistryChangeSet(
      validPending,
      "",
      "2026-07-25T21:40:00.000Z",
      ["Review note."]
    ),
  /approved change sets require a reviewer/i
);
expectThrow(
  "release records cannot be created from pending sets",
  () =>
    createRegulatoryRegistryReleaseRecord(
      validPending,
      "2026-07-25T21:41:00.000Z"
    ),
  /requires an approved regulatory registry change set/i
);

if (failures > 0) {
  console.error(`\n${failures} of ${assertions} registry-change-control assertions failed.`);
  process.exit(1);
}

console.log(`\nAll ${assertions} registry-change-control assertions passed.`);
