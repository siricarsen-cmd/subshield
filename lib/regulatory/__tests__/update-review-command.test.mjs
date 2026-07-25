import { createHash } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { getApprovedRegulatoryEvidenceSnapshot } from "../approved-evidence-registry.ts";
import { getRegisteredCitationTemplate } from "../registry-integrity.ts";
import { reviewRegulatorySnapshot } from "../source-review.ts";
import {
  persistRegulatorySnapshotReview,
  storeRegulatorySnapshot,
} from "../snapshot-store.ts";
import { loadRegulatoryUpdateReviewPacket } from "../update-review-packet.ts";
import { prepareStoredRegulatoryUpdateReview } from "../update-review-command.ts";

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
const templateEntry = getRegisteredCitationTemplate(MAPPING_ID);
if (!templateEntry) throw new Error(`Missing citation template: ${MAPPING_ID}`);
const citation = templateEntry.value.citations.find(
  (candidate) => candidate.sourceId === SOURCE_ID
);
if (!citation) throw new Error(`Missing citation: ${SOURCE_ID}`);
const retained = getApprovedRegulatoryEvidenceSnapshot(SOURCE_ID, citation.snapshotId);
if (!retained) throw new Error(`Missing retained source fixture: ${citation.snapshotId}`);

function pendingClone(snapshot, snapshotId, retrievedAt, text = snapshot.text) {
  const next = structuredClone(snapshot);
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
  next.provenanceNotes = ["Controlled review-command fixture."];
  return next;
}

function approve(snapshot, reviewedAt, anchors) {
  return reviewRegulatorySnapshot(snapshot, {
    decision: "approved",
    reviewedBy: "Independent regulatory reviewer",
    reviewedAt,
    reviewNotes: ["Reviewed for the controlled update-review command benchmark."],
    requiredTextAnchors: anchors,
    verifiedVersionIdentifier: snapshot.versionIdentifier,
    verifiedEffectiveDate: snapshot.effectiveDate,
  });
}

async function seedBaseline(snapshotRoot) {
  const baseline = pendingClone(
    retained,
    `${SOURCE_ID}:review-command-baseline`,
    "2026-07-01T12:00:00.000Z"
  );
  await storeRegulatorySnapshot(snapshotRoot, baseline);
  await persistRegulatorySnapshotReview(
    snapshotRoot,
    approve(baseline, "2026-07-01T13:00:00.000Z", [
      citation.extractionStartAnchor,
      citation.extractionEndAnchor,
    ])
  );
  return baseline;
}

const insertedSentence =
  "The offeror shall retain the reviewed notice before accepting the updated requirement.";
const changedText = retained.text.replace(
  citation.extractionEndAnchor,
  `${insertedSentence}\n${citation.extractionEndAnchor}`
);

const snapshotRoot = await mkdtemp(path.join(tmpdir(), "subshield-review-command-snapshots-"));
const packetRoot = await mkdtemp(path.join(tmpdir(), "subshield-review-command-packets-"));
try {
  const baseline = await seedBaseline(snapshotRoot);
  const candidate = pendingClone(
    retained,
    `${SOURCE_ID}:review-command-candidate`,
    "2026-08-01T12:00:00.000Z",
    changedText
  );
  await storeRegulatorySnapshot(snapshotRoot, candidate);

  const pendingResult = await prepareStoredRegulatoryUpdateReview({
    snapshotRoot,
    packetRoot,
    sourceId: SOURCE_ID,
    requestedBy: "SubShield regulatory update monitor",
    createdAt: "2026-08-01T14:00:00.000Z",
  });
  check(
    "substantive pending stored update creates one pending immutable review packet",
    pendingResult.status === "packet-stored" &&
      pendingResult.intakeStatus === "proposal-prepared" &&
      pendingResult.proposalReadiness === "awaiting-snapshot-approval" &&
      pendingResult.reviewStatus === "pending" &&
      Boolean(pendingResult.packetRelativePath) &&
      Boolean(pendingResult.packetChecksum),
    pendingResult.refusalReasons.join(" | ")
  );
  const packet = await loadRegulatoryUpdateReviewPacket(
    packetRoot,
    pendingResult.packetRelativePath,
    SOURCE_ID
  );
  check(
    "stored command packet retains verified-pair provenance without source bodies",
    packet.proposal?.trustSource === "verified-stored-pair" &&
      packet.baselineSnapshotId === baseline.snapshotId &&
      packet.candidateSnapshotId === candidate.snapshotId &&
      packet.applicationStatus === "not-applied" &&
      !JSON.stringify(packet).includes('"text":')
  );

  await checkRejects(
    "repeating the identical command cannot overwrite the immutable packet",
    () =>
      prepareStoredRegulatoryUpdateReview({
        snapshotRoot,
        packetRoot,
        sourceId: SOURCE_ID,
        requestedBy: "SubShield regulatory update monitor",
        createdAt: "2026-08-01T14:00:00.000Z",
      }),
    /EEXIST|file exists/i
  );

  await persistRegulatorySnapshotReview(
    snapshotRoot,
    approve(candidate, "2026-08-01T13:00:00.000Z", [
      citation.extractionStartAnchor,
      insertedSentence,
    ])
  );
  const approvedResult = await prepareStoredRegulatoryUpdateReview({
    snapshotRoot,
    packetRoot,
    sourceId: SOURCE_ID,
    requestedBy: "SubShield regulatory update monitor",
    createdAt: "2026-08-01T15:00:00.000Z",
  });
  check(
    "approved retained candidate creates a separate change-set-ready pending packet",
    approvedResult.status === "packet-stored" &&
      approvedResult.proposalReadiness === "ready-for-controlled-change-set-draft" &&
      approvedResult.packetRelativePath !== pendingResult.packetRelativePath &&
      approvedResult.applicationStatus === "not-applied"
  );

  const refusedResult = await prepareStoredRegulatoryUpdateReview({
    snapshotRoot,
    packetRoot,
    sourceId: SOURCE_ID,
    requestedBy: " ",
    createdAt: "2026-08-01T16:00:00.000Z",
  });
  check(
    "ordinary intake refusal produces no review packet",
    refusedResult.status === "intake-refused" &&
      refusedResult.reviewStatus === "not-created" &&
      !refusedResult.packetRelativePath &&
      refusedResult.refusalReasons.some((reason) => /requester must not be blank/i.test(reason))
  );
} finally {
  await rm(snapshotRoot, { recursive: true, force: true });
  await rm(packetRoot, { recursive: true, force: true });
}

const unchangedSnapshotRoot = await mkdtemp(
  path.join(tmpdir(), "subshield-review-command-unchanged-snapshots-")
);
const unchangedPacketRoot = await mkdtemp(
  path.join(tmpdir(), "subshield-review-command-unchanged-packets-")
);
try {
  const unchangedBaseline = await seedBaseline(unchangedSnapshotRoot);
  const identicalCandidate = pendingClone(
    retained,
    `${SOURCE_ID}:review-command-identical`,
    "2026-08-01T12:00:00.000Z"
  );
  identicalCandidate.rawChecksum = unchangedBaseline.rawChecksum;
  await storeRegulatorySnapshot(unchangedSnapshotRoot, identicalCandidate);
  const unchangedResult = await prepareStoredRegulatoryUpdateReview({
    snapshotRoot: unchangedSnapshotRoot,
    packetRoot: unchangedPacketRoot,
    sourceId: SOURCE_ID,
    requestedBy: "SubShield regulatory update monitor",
    createdAt: "2026-08-01T14:00:00.000Z",
  });
  check(
    "deduplicated unchanged retrieval observation creates no review packet",
    unchangedResult.status === "no-review-packet" &&
      unchangedResult.intakeStatus === "no-change" &&
      unchangedResult.differenceClassification === "unchanged" &&
      Boolean(unchangedResult.candidateObservationId) &&
      Boolean(unchangedResult.observationVerificationChecksum) &&
      unchangedResult.reviewStatus === "not-created" &&
      !unchangedResult.packetRelativePath
  );
} finally {
  await rm(unchangedSnapshotRoot, { recursive: true, force: true });
  await rm(unchangedPacketRoot, { recursive: true, force: true });
}

if (failures > 0) {
  console.error(`\n${failures} of ${assertions} update-review-command assertions failed.`);
  process.exit(1);
}

console.log(`\nAll ${assertions} update-review-command assertions passed.`);
