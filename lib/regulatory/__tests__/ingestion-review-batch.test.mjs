import { createHash } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
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
  next.provenanceNotes = ["Controlled ingestion-review batch fixture."];
  return next;
}

function approve(snapshot, reviewedAt, anchors) {
  return reviewRegulatorySnapshot(snapshot, {
    decision: "approved",
    reviewedBy: "Independent regulatory reviewer",
    reviewedAt,
    reviewNotes: ["Reviewed for controlled ingestion-review batch coverage."],
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
      stored.status === "observed"
        ? stored.comparison.previousSnapshotId
        : snapshot.snapshotId,
    reviewStatus: snapshot.reviewStatus,
  };
}

function documentFor(records, failureCount = 0) {
  return {
    outputRoot: "controlled-test-root",
    sourceCount: records.length,
    failures: failureCount,
    results: records,
  };
}

const firstSnapshotRoot = await mkdtemp(path.join(tmpdir(), "subshield-batch-first-snapshot-"));
const firstPacketRoot = await mkdtemp(path.join(tmpdir(), "subshield-batch-first-packet-"));
try {
  const first = pendingClone(
    retained,
    `${SOURCE_ID}:batch-first`,
    "2026-07-01T12:00:00.000Z"
  );
  const stored = await storeRegulatorySnapshot(firstSnapshotRoot, first);
  const result = await prepareRegulatoryIngestionReviewBatch({
    ingestion: documentFor([record(first, stored)]),
    snapshotRoot: firstSnapshotRoot,
    packetRoot: firstPacketRoot,
    requestedBy: "SubShield regulatory update monitor",
    createdAt: "2026-07-01T14:00:00.000Z",
  });
  check(
    "a first retained snapshot remains pending without inventing a comparison packet",
    result.initialSnapshotCount === 1 &&
      result.packetCount === 0 &&
      result.items[0].status === "initial-snapshot-pending-review" &&
      result.items[0].applicationStatus === "not-applied"
  );
} finally {
  await rm(firstSnapshotRoot, { recursive: true, force: true });
  await rm(firstPacketRoot, { recursive: true, force: true });
}

const changedSnapshotRoot = await mkdtemp(path.join(tmpdir(), "subshield-batch-changed-snapshot-"));
const changedPacketRoot = await mkdtemp(path.join(tmpdir(), "subshield-batch-changed-packet-"));
try {
  const baseline = pendingClone(
    retained,
    `${SOURCE_ID}:batch-baseline`,
    "2026-07-01T12:00:00.000Z"
  );
  await storeRegulatorySnapshot(changedSnapshotRoot, baseline);
  await persistRegulatorySnapshotReview(
    changedSnapshotRoot,
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
  const candidate = pendingClone(
    retained,
    `${SOURCE_ID}:batch-candidate`,
    "2026-08-01T12:00:00.000Z",
    changedText
  );
  const stored = await storeRegulatorySnapshot(changedSnapshotRoot, candidate);
  const result = await prepareRegulatoryIngestionReviewBatch({
    ingestion: documentFor([record(candidate, stored)]),
    snapshotRoot: changedSnapshotRoot,
    packetRoot: changedPacketRoot,
    requestedBy: "SubShield regulatory update monitor",
    createdAt: "2026-08-01T14:00:00.000Z",
  });
  check(
    "a substantive change with an approved baseline creates one pending immutable review packet",
    result.packetCount === 1 &&
      result.items[0].status === "packet-stored" &&
      result.items[0].proposalReadiness === "awaiting-snapshot-approval" &&
      Boolean(result.items[0].packetRelativePath) &&
      Boolean(result.items[0].packetChecksum),
    result.items[0].refusalReasons.join(" | ")
  );
  check(
    "batch output is data-minimized and remains benchmark-only",
    !JSON.stringify(result).includes('"text":') &&
      result.applicationStatus === "not-applied" &&
      result.customerFacingStatus === "benchmark-only"
  );
} finally {
  await rm(changedSnapshotRoot, { recursive: true, force: true });
  await rm(changedPacketRoot, { recursive: true, force: true });
}

const observedSnapshotRoot = await mkdtemp(path.join(tmpdir(), "subshield-batch-observed-snapshot-"));
const observedPacketRoot = await mkdtemp(path.join(tmpdir(), "subshield-batch-observed-packet-"));
try {
  const baseline = pendingClone(
    retained,
    `${SOURCE_ID}:batch-observed-baseline`,
    "2026-07-01T12:00:00.000Z"
  );
  await storeRegulatorySnapshot(observedSnapshotRoot, baseline);
  await persistRegulatorySnapshotReview(
    observedSnapshotRoot,
    approve(baseline, "2026-07-01T13:00:00.000Z", [
      citation.extractionStartAnchor,
      citation.extractionEndAnchor,
    ])
  );
  const transportOnly = pendingClone(
    retained,
    `${SOURCE_ID}:batch-observed-candidate`,
    "2026-08-01T12:00:00.000Z"
  );
  transportOnly.rawChecksum = sha256("transport-only-markup-change");
  transportOnly.retrieval.etag = '"transport-only"';
  const stored = await storeRegulatorySnapshot(observedSnapshotRoot, transportOnly);
  const result = await prepareRegulatoryIngestionReviewBatch({
    ingestion: documentFor([record(transportOnly, stored)]),
    snapshotRoot: observedSnapshotRoot,
    packetRoot: observedPacketRoot,
    requestedBy: "SubShield regulatory update monitor",
    createdAt: "2026-08-01T14:00:00.000Z",
  });
  check(
    "transport-only retrieval evidence creates no regulatory review packet",
    result.noPacketCount === 1 &&
      result.items[0].status === "no-review-packet" &&
      result.items[0].differenceClassification === "transport-only" &&
      !result.items[0].packetRelativePath
  );
} finally {
  await rm(observedSnapshotRoot, { recursive: true, force: true });
  await rm(observedPacketRoot, { recursive: true, force: true });
}

await checkRejects(
  "duplicate source records cannot ambiguously drive two review outcomes",
  () =>
    prepareRegulatoryIngestionReviewBatch({
      ingestion: documentFor([
        {
          sourceId: SOURCE_ID,
          status: "failed",
          error: "first failure",
        },
        {
          sourceId: SOURCE_ID,
          status: "failed",
          error: "second failure",
        },
      ], 2),
      snapshotRoot: "unused",
      packetRoot: "unused",
      requestedBy: "SubShield regulatory update monitor",
      createdAt: "2026-08-01T14:00:00.000Z",
    }),
  /duplicate regulatory ingestion source ID/i
);

await checkRejects(
  "successful ingestion records cannot claim an approved review state",
  () =>
    prepareRegulatoryIngestionReviewBatch({
      ingestion: documentFor([
        {
          sourceId: SOURCE_ID,
          status: "stored",
          changeStatus: "first-snapshot",
          snapshotId: `${SOURCE_ID}:invalid-approved`,
          normalizedSnapshotId: `${SOURCE_ID}:invalid-approved`,
          reviewStatus: "approved",
        },
      ]),
      snapshotRoot: "unused",
      packetRoot: "unused",
      requestedBy: "SubShield regulatory update monitor",
      createdAt: "2026-08-01T14:00:00.000Z",
    }),
  /must remain pending/i
);

if (failures > 0) {
  console.error(`\n${failures} of ${assertions} ingestion-review batch assertions failed.`);
  process.exit(1);
}

console.log(`\nAll ${assertions} ingestion-review batch assertions passed.`);
