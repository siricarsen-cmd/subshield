import { createHash } from "node:crypto";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { getApprovedRegulatoryEvidenceSnapshot } from "../approved-evidence-registry.ts";
import { prepareRegulatoryIngestionReviewBatch } from "../ingestion-review-batch.ts";
import { getRegisteredCitationTemplate } from "../registry-integrity.ts";
import { reviewRegulatorySnapshot } from "../source-review.ts";
import {
  persistRegulatorySnapshotReview,
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

function sha256(value) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

async function countJsonFiles(root) {
  let count = 0;
  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(fullPath);
      else if (entry.isFile() && entry.name.endsWith(".json")) count++;
    }
  }
  await visit(root);
  return count;
}

const SOURCE_ID = "dfars-252-204-7025";
const MAPPING_ID = "qa-c-future-cmmc-by-notice";
const template = getRegisteredCitationTemplate(MAPPING_ID);
if (!template) throw new Error(`Missing citation template: ${MAPPING_ID}`);
const citation = template.value.citations.find((candidate) => candidate.sourceId === SOURCE_ID);
if (!citation) throw new Error(`Missing citation for ${SOURCE_ID}`);
const retained = getApprovedRegulatoryEvidenceSnapshot(SOURCE_ID, citation.snapshotId);
if (!retained) throw new Error(`Missing approved evidence fixture: ${citation.snapshotId}`);

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
  next.provenanceNotes = ["Controlled repeat-suppression fixture."];
  return next;
}

function approve(snapshot, reviewedAt, anchors) {
  return reviewRegulatorySnapshot(snapshot, {
    decision: "approved",
    reviewedBy: "Independent regulatory reviewer",
    reviewedAt,
    reviewNotes: ["Reviewed for repeat-suppression coverage."],
    requiredTextAnchors: anchors,
    verifiedVersionIdentifier: snapshot.versionIdentifier,
    verifiedEffectiveDate: snapshot.effectiveDate,
  });
}

function record(snapshot, stored) {
  return {
    sourceId: snapshot.sourceId,
    status: stored.status,
    changeStatus: stored.comparison.status,
    checksum: snapshot.checksum,
    rawChecksum: snapshot.rawChecksum,
    snapshotId: snapshot.snapshotId,
    normalizedSnapshotId:
      stored.status === "observed" || stored.status === "unchanged"
        ? stored.comparison.previousSnapshotId
        : snapshot.snapshotId,
    reviewStatus: snapshot.reviewStatus,
  };
}

function documentFor(item) {
  return {
    outputRoot: "controlled-repeat-root",
    sourceCount: 1,
    failures: 0,
    results: [item],
  };
}

const snapshotRoot = await mkdtemp(path.join(tmpdir(), "subshield-repeat-snapshots-"));
const packetRoot = await mkdtemp(path.join(tmpdir(), "subshield-repeat-packets-"));
try {
  const baseline = pendingClone(
    retained,
    `${SOURCE_ID}:repeat-baseline`,
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

  const inserted =
    "The offeror shall retain the reviewed notice before accepting the updated requirement.";
  const changedText = retained.text.replace(
    citation.extractionEndAnchor,
    `${inserted}\n${citation.extractionEndAnchor}`
  );
  const changedCandidate = pendingClone(
    retained,
    `${SOURCE_ID}:repeat-pending-change`,
    "2026-08-01T12:00:00.000Z",
    changedText
  );
  const changedStore = await storeRegulatorySnapshot(snapshotRoot, changedCandidate);
  const firstBatch = await prepareRegulatoryIngestionReviewBatch({
    ingestion: documentFor(record(changedCandidate, changedStore)),
    snapshotRoot,
    packetRoot,
    requestedBy: "SubShield regulatory update monitor",
    createdAt: "2026-08-01T14:00:00.000Z",
  });
  const packetFilesAfterChange = await countJsonFiles(packetRoot);
  check(
    "the original pending substantive change creates one review packet",
    firstBatch.packetCount === 1 && packetFilesAfterChange === 1
  );

  const transportRetry = pendingClone(
    changedCandidate,
    `${SOURCE_ID}:repeat-transport-retrieval`,
    "2026-08-08T12:00:00.000Z",
    changedText
  );
  transportRetry.rawChecksum = sha256("same-normalized-text-different-markup");
  transportRetry.retrieval.etag = '"repeat-transport"';
  const transportStore = await storeRegulatorySnapshot(snapshotRoot, transportRetry);
  const transportBatch = await prepareRegulatoryIngestionReviewBatch({
    ingestion: documentFor(record(transportRetry, transportStore)),
    snapshotRoot,
    packetRoot,
    requestedBy: "SubShield regulatory update monitor",
    createdAt: "2026-08-08T14:00:00.000Z",
  });
  const packetFilesAfterTransport = await countJsonFiles(packetRoot);
  check(
    "a later transport-only retrieval does not regenerate the pending candidate packet",
    transportStore.status === "observed" &&
      transportBatch.noPacketCount === 1 &&
      transportBatch.items[0].differenceClassification === "transport-only" &&
      packetFilesAfterTransport === packetFilesAfterChange
  );

  const exactRetry = pendingClone(
    changedCandidate,
    `${SOURCE_ID}:repeat-exact-retrieval`,
    "2026-08-15T12:00:00.000Z",
    changedText
  );
  exactRetry.rawChecksum = transportRetry.rawChecksum;
  exactRetry.retrieval.etag = transportRetry.retrieval.etag;
  const exactStore = await storeRegulatorySnapshot(snapshotRoot, exactRetry);
  const exactBatch = await prepareRegulatoryIngestionReviewBatch({
    ingestion: documentFor(record(exactRetry, exactStore)),
    snapshotRoot,
    packetRoot,
    requestedBy: "SubShield regulatory update monitor",
    createdAt: "2026-08-15T14:00:00.000Z",
  });
  const packetFilesAfterExact = await countJsonFiles(packetRoot);
  check(
    "an exact scheduled retry also leaves the prior pending packet unchanged",
    exactStore.status === "unchanged" &&
      exactBatch.noPacketCount === 1 &&
      exactBatch.items[0].differenceClassification === "unchanged" &&
      packetFilesAfterExact === packetFilesAfterChange
  );
} finally {
  await rm(snapshotRoot, { recursive: true, force: true });
  await rm(packetRoot, { recursive: true, force: true });
}

if (failures > 0) {
  console.error(`\n${failures} of ${assertions} repeat-suppression assertions failed.`);
  process.exit(1);
}

console.log(`\nAll ${assertions} repeat-suppression assertions passed.`);
