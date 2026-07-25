import { createHash } from "node:crypto";

import { getApprovedRegulatoryEvidenceSnapshot } from "../approved-evidence-registry.ts";
import { getRegisteredCitationTemplate } from "../registry-integrity.ts";
import {
  compareRegulatoryUpdateCandidate,
  prepareRegulatoryUpdateIntake,
} from "../update-intake.ts";

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

function sha256(value) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

const SOURCE_ID = "dfars-252-204-7025";
const MAPPING_ID = "qa-c-future-cmmc-by-notice";
const templateEntry = getRegisteredCitationTemplate(MAPPING_ID);
if (!templateEntry) throw new Error(`Missing registered citation template: ${MAPPING_ID}`);
const registeredCitation = templateEntry.value.citations.find(
  (citation) => citation.sourceId === SOURCE_ID
);
if (!registeredCitation) throw new Error(`Missing registered citation for ${SOURCE_ID}`);
const baseline = getApprovedRegulatoryEvidenceSnapshot(
  SOURCE_ID,
  registeredCitation.snapshotId
);
if (!baseline) throw new Error(`Missing approved evidence snapshot: ${registeredCitation.snapshotId}`);

function candidate(overrides = {}) {
  const next = structuredClone(baseline);
  next.snapshotId = `${SOURCE_ID}:update-candidate:${overrides.idSuffix ?? "default"}`;
  next.retrievedAt = overrides.retrievedAt ?? "2026-08-01T12:00:00.000Z";
  next.retrieval.retrievedAt = next.retrievedAt;
  next.reviewStatus = overrides.reviewStatus ?? "pending";
  delete next.reviewedBy;
  delete next.reviewedAt;
  delete next.reviewNotes;
  next.provenanceNotes = [
    "Controlled benchmark update candidate.",
    "Not approved or customer-facing.",
  ];
  if (overrides.text !== undefined) next.text = overrides.text;
  next.checksum = overrides.checksum ?? sha256(next.text);
  next.rawChecksum = overrides.rawChecksum ?? baseline.rawChecksum;
  if (overrides.citation !== undefined) next.citation = overrides.citation;
  if (overrides.versionIdentifier !== undefined) {
    next.versionIdentifier = overrides.versionIdentifier;
  }
  if (overrides.historicalStatus !== undefined) {
    next.historicalStatus = overrides.historicalStatus;
  }
  if (overrides.etag !== undefined) next.retrieval.etag = overrides.etag;
  if (overrides.reviewStatus === "approved") {
    next.reviewedBy = "Independent regulatory reviewer";
    next.reviewedAt = "2026-08-01T13:00:00.000Z";
    next.reviewNotes = ["Approved only for controlled benchmark update intake."];
  }
  return next;
}

function intake(next, overrides = {}) {
  return prepareRegulatoryUpdateIntake({
    baseline,
    candidate: next,
    requestedBy: overrides.requestedBy ?? "SubShield regulatory update monitor",
    createdAt: overrides.createdAt ?? "2026-08-01T12:30:00.000Z",
  });
}

const unchanged = candidate({ idSuffix: "unchanged" });
const unchangedResult = intake(unchanged);
check(
  "a later identical retrieval produces no registry change",
  unchangedResult.status === "no-change" &&
    unchangedResult.difference.classification === "unchanged" &&
    !unchangedResult.proposal
);

const transport = candidate({
  idSuffix: "transport",
  rawChecksum: sha256("same normalized text with changed transport markup"),
  etag: '"new-transport-etag"',
});
const transportDifference = compareRegulatoryUpdateCandidate(baseline, transport);
const transportResult = intake(transport);
check(
  "raw or transport changes without normalized or regulatory changes remain observation-only",
  transportDifference.classification === "transport-only" &&
    transportResult.status === "observation-only" &&
    !transportResult.proposal
);

const metadata = candidate({
  idSuffix: "metadata",
  citation: `${baseline.citation} — reviewed metadata update`,
  versionIdentifier: `${baseline.versionIdentifier ?? baseline.citation} — metadata update`,
});
const metadataResult = intake(metadata);
check(
  "regulatory metadata changes prepare a citation-template proposal",
  metadataResult.status === "proposal-prepared" &&
    metadataResult.difference.classification === "metadata-only" &&
    metadataResult.proposal?.readiness === "awaiting-snapshot-approval" &&
    metadataResult.proposal.transitions.length >= 1 &&
    metadataResult.proposal.transitions.every(
      (transition) => transition.kind === "citation-template"
    ),
  metadataResult.refusalReasons.join(" | ")
);
check(
  "mapping and governing-date conclusions remain explicit human-review questions",
  metadataResult.proposal?.registryKindsRequiringHumanReview.join("|") ===
    "mapping|historical-policy" &&
    metadataResult.proposal.applicationStatus === "not-applied" &&
    metadataResult.proposal.customerFacingStatus === "benchmark-only"
);

if (!baseline.text.includes(registeredCitation.extractionEndAnchor)) {
  throw new Error("Registered end anchor is not an exact benchmark substring");
}
const changedInsideText = baseline.text.replace(
  registeredCitation.extractionEndAnchor,
  `The offeror shall document the reviewed notice before accepting the requirement.\n${registeredCitation.extractionEndAnchor}`
);
const changedInside = candidate({
  idSuffix: "inside",
  text: changedInsideText,
  rawChecksum: sha256(changedInsideText),
});
const changedInsideResult = intake(changedInside);
const insideImpact = changedInsideResult.impacts.find(
  (impact) => impact.mappingId === MAPPING_ID
);
check(
  "a substantive in-passage source change is re-extracted into a draft transition",
  changedInsideResult.status === "proposal-prepared" &&
    changedInsideResult.difference.classification === "content-changed" &&
    insideImpact?.citationImpacts.some(
      (impact) =>
        impact.status === "stable" &&
        impact.changedFields.includes("excerpt") &&
        impact.nextExcerptChecksum !== impact.previousExcerptChecksum
    ) &&
    changedInsideResult.proposal?.transitions.some(
      (transition) =>
        transition.id === MAPPING_ID &&
        transition.changedLocators.includes(registeredCitation.locator) &&
        transition.afterFingerprint !== transition.beforeFingerprint
    )
);
check(
  "content differences retain bounded line-level review evidence",
  Boolean(changedInsideResult.difference.lineDifference) &&
    changedInsideResult.difference.lineDifference.nextExcerpt.length <= 12 &&
    changedInsideResult.difference.lineDifference.previousExcerpt.length <= 12
);

const approvedChanged = candidate({
  idSuffix: "approved",
  text: changedInsideText,
  rawChecksum: sha256(`approved:${changedInsideText}`),
  reviewStatus: "approved",
});
const approvedChangedResult = intake(approvedChanged);
check(
  "an approved candidate is marked ready only for a controlled change-set draft",
  approvedChangedResult.status === "proposal-prepared" &&
    approvedChangedResult.proposal?.readiness ===
      "ready-for-controlled-change-set-draft" &&
    approvedChangedResult.proposal.applicationStatus === "not-applied"
);

if (!baseline.text.includes(registeredCitation.extractionStartAnchor)) {
  throw new Error("Registered start anchor is not an exact benchmark substring");
}
const driftText = baseline.text.replace(
  registeredCitation.extractionStartAnchor,
  "Materially revised heading that removes the registered start anchor"
);
const drift = candidate({
  idSuffix: "drift",
  text: driftText,
  rawChecksum: sha256(driftText),
});
const driftResult = intake(drift);
check(
  "missing or changed registered anchors block automatic proposal generation",
  driftResult.status === "manual-review-required" &&
    driftResult.proposal?.readiness === "manual-redesign-required" &&
    driftResult.proposal.transitions.length === 0 &&
    driftResult.refusalReasons.some((reason) => /anchor was not found/i.test(reason))
);

const badChecksum = candidate({
  idSuffix: "bad-checksum",
  checksum: `sha256:${"0".repeat(64)}`,
});
const badChecksumResult = intake(badChecksum);
check(
  "a candidate with altered normalized-text provenance is refused",
  badChecksumResult.status === "refused" &&
    badChecksumResult.refusalReasons.some((reason) =>
      /normalized-text checksum is invalid/i.test(reason)
    )
);

const proposed = candidate({
  idSuffix: "proposed",
  historicalStatus: "proposed",
});
const proposedResult = intake(proposed);
check(
  "proposed regulations cannot silently replace the current controlled source",
  proposedResult.status === "refused" &&
    proposedResult.refusalReasons.some((reason) =>
      /proposed regulatory text cannot update/i.test(reason)
    )
);

const rejected = candidate({ idSuffix: "rejected" });
rejected.reviewStatus = "rejected";
rejected.reviewedBy = "Reviewer";
rejected.reviewedAt = "2026-08-01T13:00:00.000Z";
rejected.reviewNotes = ["Rejected for update use."];
const rejectedResult = intake(rejected);
check(
  "rejected snapshots cannot re-enter update intake",
  rejectedResult.status === "refused" &&
    rejectedResult.refusalReasons.some((reason) =>
      /rejected regulatory snapshots cannot enter/i.test(reason)
    )
);

const older = candidate({
  idSuffix: "older",
  retrievedAt: "2020-01-01T00:00:00.000Z",
});
const olderResult = intake(older);
check(
  "a stale retrieval cannot supersede a later approved baseline",
  olderResult.status === "refused" &&
    olderResult.refusalReasons.some((reason) => /retrieved after the approved baseline/i.test(reason))
);

const blankRequester = intake(candidate({ idSuffix: "blank-requester" }), {
  requestedBy: " ",
});
check(
  "update proposals require named requester provenance",
  blankRequester.status === "refused" &&
    blankRequester.refusalReasons.some((reason) => /requester must not be blank/i.test(reason))
);

if (failures > 0) {
  console.error(`\n${failures} of ${assertions} regulatory update-intake assertions failed.`);
  process.exit(1);
}

console.log(`\nAll ${assertions} regulatory update-intake assertions passed.`);
