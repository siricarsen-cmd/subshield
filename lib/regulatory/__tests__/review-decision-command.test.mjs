import { createHash } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { getApprovedRegulatoryEvidenceSnapshot } from "../approved-evidence-registry.ts";
import { getRegisteredCitationTemplate } from "../registry-integrity.ts";
import { recordRegulatorySnapshotReviewDecision } from "../review-decision-command.ts";
import {
  loadRegulatorySnapshotManifest,
  storeRegulatorySnapshot,
} from "../snapshot-store.ts";

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

async function checkRejects(label, action, pattern) {
  assertions++;
  try {
    await action();
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

const SOURCE_ID = "dfars-252-204-7025";
const MAPPING_ID = "qa-c-future-cmmc-by-notice";
const template = getRegisteredCitationTemplate(MAPPING_ID);
if (!template) throw new Error(`Missing citation template: ${MAPPING_ID}`);
const citation = template.value.citations.find((candidate) => candidate.sourceId === SOURCE_ID);
if (!citation) throw new Error(`Missing citation for ${SOURCE_ID}`);
const retained = getApprovedRegulatoryEvidenceSnapshot(SOURCE_ID, citation.snapshotId);
if (!retained) throw new Error(`Missing approved evidence fixture: ${citation.snapshotId}`);

function pendingClone(snapshotId, retrievedAt, text = retained.text) {
  const next = structuredClone(retained);
  next.snapshotId = snapshotId;
  next.retrievedAt = retrievedAt;
  next.retrieval.retrievedAt = retrievedAt;
  next.retrieval.rawByteLength = Buffer.byteLength(text, "utf8");
  next.text = text;
  next.checksum = sha256(text);
  next.rawChecksum = sha256(`raw:${snapshotId}:${text}`);
  next.reviewStatus = "pending";
  delete next.reviewedBy;
  delete next.reviewedAt;
  delete next.reviewNotes;
  next.provenanceNotes = ["Controlled human-review command fixture."];
  return next;
}

function approvalRequest(snapshotRoot, snapshot, overrides = {}) {
  return {
    snapshotRoot,
    sourceId: SOURCE_ID,
    snapshotId: snapshot.snapshotId,
    decision: "approved",
    reviewedBy: "Jane Smith, independent regulatory reviewer",
    reviewedAt: "2026-07-02T12:00:00.000Z",
    reviewNotes: [
      "Compared the retained normalized source text to the official publication and verified the listed metadata.",
    ],
    requiredTextAnchors: [
      citation.extractionStartAnchor,
      citation.extractionEndAnchor,
    ],
    verifiedVersionIdentifier: snapshot.versionIdentifier,
    verifiedEffectiveDate: snapshot.effectiveDate,
    ...overrides,
  };
}

const approvalRoot = await mkdtemp(path.join(tmpdir(), "subshield-human-review-approve-"));
try {
  const snapshot = pendingClone(
    `${SOURCE_ID}:human-review-approved`,
    "2026-07-01T12:00:00.000Z"
  );
  await storeRegulatorySnapshot(approvalRoot, snapshot);
  const result = await recordRegulatorySnapshotReviewDecision(
    approvalRequest(approvalRoot, snapshot)
  );
  const manifest = await loadRegulatorySnapshotManifest(approvalRoot, SOURCE_ID);
  const entry = manifest.snapshots.find((candidate) => candidate.snapshotId === snapshot.snapshotId);
  check(
    "an explicit human approval persists reviewer provenance and advances the approved pointer",
    result.decision === "approved" &&
      result.reviewPersistenceStatus === "persisted" &&
      result.latestApprovedSnapshotId === snapshot.snapshotId &&
      entry?.reviewStatus === "approved" &&
      entry.reviewedBy === "Jane Smith, independent regulatory reviewer" &&
      manifest.latestApprovedSnapshotId === snapshot.snapshotId
  );
  check(
    "approval output is deeply frozen, data-minimized, and does not apply registry changes",
    Object.isFrozen(result) &&
      !JSON.stringify(result).includes('"text":') &&
      result.registryApplicationStatus === "not-applied" &&
      result.customerFacingStatus === "not-enabled" &&
      result.verifiedAnchorCount === 2 &&
      result.reviewNoteCount === 1
  );
  await checkRejects(
    "a final source-review decision cannot be overwritten",
    () => recordRegulatorySnapshotReviewDecision(approvalRequest(approvalRoot, snapshot)),
    /already final/i
  );
} finally {
  await rm(approvalRoot, { recursive: true, force: true });
}

const rejectionRoot = await mkdtemp(path.join(tmpdir(), "subshield-human-review-reject-"));
try {
  const snapshot = pendingClone(
    `${SOURCE_ID}:human-review-rejected`,
    "2026-07-01T12:00:00.000Z"
  );
  await storeRegulatorySnapshot(rejectionRoot, snapshot);
  const result = await recordRegulatorySnapshotReviewDecision({
    snapshotRoot: rejectionRoot,
    sourceId: SOURCE_ID,
    snapshotId: snapshot.snapshotId,
    decision: "rejected",
    reviewedBy: "John Lee, independent regulatory reviewer",
    reviewedAt: "2026-07-02T12:00:00.000Z",
    reviewNotes: ["Rejected because the retained version metadata could not be independently confirmed."],
    requiredTextAnchors: [citation.extractionStartAnchor],
  });
  const manifest = await loadRegulatorySnapshotManifest(rejectionRoot, SOURCE_ID);
  check(
    "an explicit rejection persists without creating an approved source pointer",
    result.decision === "rejected" &&
      result.latestApprovedSnapshotId === undefined &&
      manifest.latestApprovedSnapshotId === undefined &&
      manifest.snapshots[0].reviewStatus === "rejected"
  );
} finally {
  await rm(rejectionRoot, { recursive: true, force: true });
}

const automationRoot = await mkdtemp(path.join(tmpdir(), "subshield-human-review-automation-"));
try {
  const snapshot = pendingClone(
    `${SOURCE_ID}:human-review-automation`,
    "2026-07-01T12:00:00.000Z"
  );
  await storeRegulatorySnapshot(automationRoot, snapshot);
  await checkRejects(
    "automation identities cannot approve regulatory source evidence",
    () =>
      recordRegulatorySnapshotReviewDecision(
        approvalRequest(automationRoot, snapshot, {
          reviewedBy: "SubShield regulatory bot",
        })
      ),
    /identified non-automated reviewer/i
  );
} finally {
  await rm(automationRoot, { recursive: true, force: true });
}

const metadataRoot = await mkdtemp(path.join(tmpdir(), "subshield-human-review-metadata-"));
try {
  const snapshot = pendingClone(
    `${SOURCE_ID}:human-review-metadata`,
    "2026-07-01T12:00:00.000Z"
  );
  await storeRegulatorySnapshot(metadataRoot, snapshot);
  await checkRejects(
    "approval cannot omit retained version verification",
    () =>
      recordRegulatorySnapshotReviewDecision(
        approvalRequest(metadataRoot, snapshot, {
          verifiedVersionIdentifier: undefined,
        })
      ),
    /requires verification of retained version identifier/i
  );
  await checkRejects(
    "approval cannot substitute different effective-date metadata",
    () =>
      recordRegulatorySnapshotReviewDecision(
        approvalRequest(metadataRoot, snapshot, {
          verifiedEffectiveDate: "1999-01-01",
        })
      ),
    /effective date does not match/i
  );
} finally {
  await rm(metadataRoot, { recursive: true, force: true });
}

const timeRoot = await mkdtemp(path.join(tmpdir(), "subshield-human-review-time-"));
try {
  const snapshot = pendingClone(
    `${SOURCE_ID}:human-review-time`,
    "2026-07-10T12:00:00.000Z"
  );
  await storeRegulatorySnapshot(timeRoot, snapshot);
  await checkRejects(
    "a review decision cannot predate official-source retrieval",
    () =>
      recordRegulatorySnapshotReviewDecision(
        approvalRequest(timeRoot, snapshot, {
          reviewedAt: "2026-07-09T12:00:00.000Z",
        })
      ),
    /cannot predate source retrieval/i
  );
} finally {
  await rm(timeRoot, { recursive: true, force: true });
}

const rollbackRoot = await mkdtemp(path.join(tmpdir(), "subshield-human-review-rollback-"));
try {
  const older = pendingClone(
    `${SOURCE_ID}:human-review-older`,
    "2026-07-01T12:00:00.000Z"
  );
  const newer = pendingClone(
    `${SOURCE_ID}:human-review-newer`,
    "2026-07-10T12:00:00.000Z"
  );
  await storeRegulatorySnapshot(rollbackRoot, older);
  await storeRegulatorySnapshot(rollbackRoot, newer);
  await recordRegulatorySnapshotReviewDecision(
    approvalRequest(rollbackRoot, newer, {
      reviewedAt: "2026-07-11T12:00:00.000Z",
    })
  );
  await checkRejects(
    "an older pending snapshot cannot roll back a later approved source version",
    () =>
      recordRegulatorySnapshotReviewDecision(
        approvalRequest(rollbackRoot, older, {
          reviewedAt: "2026-07-12T12:00:00.000Z",
        })
      ),
    /would roll back a later approved source version/i
  );
} finally {
  await rm(rollbackRoot, { recursive: true, force: true });
}

const missingRoot = await mkdtemp(path.join(tmpdir(), "subshield-human-review-missing-"));
try {
  await checkRejects(
    "review requires an exact snapshot already retained in controlled storage",
    () =>
      recordRegulatorySnapshotReviewDecision({
        ...approvalRequest(missingRoot, retained),
        snapshotId: `${SOURCE_ID}:not-stored`,
      }),
    /not present in controlled storage/i
  );
} finally {
  await rm(missingRoot, { recursive: true, force: true });
}

if (failures > 0) {
  console.error(`\n${failures} of ${assertions} human-review command assertions failed.`);
  process.exit(1);
}

console.log(`\nAll ${assertions} human-review command assertions passed.`);
