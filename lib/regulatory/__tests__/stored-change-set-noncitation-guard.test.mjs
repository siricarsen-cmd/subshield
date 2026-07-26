import { createHash } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { getApprovedRegulatoryEvidenceSnapshot } from "../approved-evidence-registry.ts";
import {
  fingerprintRegulatoryRegistryValue,
  getRegisteredCitationTemplate,
} from "../registry-integrity.ts";
import { reviewRegulatorySnapshot } from "../source-review.ts";
import {
  persistRegulatorySnapshotReview,
  storeRegulatorySnapshot,
} from "../snapshot-store.ts";
import { buildVerifiedStoredRegulatoryChangeSetDraft } from "../stored-change-set-draft.ts";
import { loadRegulatoryUpdateReviewPacket } from "../update-review-packet.ts";
import { prepareStoredRegulatoryUpdateReview } from "../update-review-command.ts";
import { loadVerifiedStoredRegulatoryUpdatePair } from "../verified-stored-update-pair.ts";

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

function packetChecksum(packet) {
  const { packetChecksum: _ignored, ...payload } = packet;
  return fingerprintRegulatoryRegistryValue(payload);
}

const SOURCE_ID = "dfars-252-204-7025";
const MAPPING_ID = "qa-c-future-cmmc-by-notice";
const template = getRegisteredCitationTemplate(MAPPING_ID);
if (!template) throw new Error(`Missing citation template: ${MAPPING_ID}`);
const citation = template.value.citations.find((candidate) => candidate.sourceId === SOURCE_ID);
if (!citation) throw new Error(`Missing citation: ${SOURCE_ID}`);
const retained = getApprovedRegulatoryEvidenceSnapshot(SOURCE_ID, citation.snapshotId);
if (!retained) throw new Error(`Missing approved source fixture: ${citation.snapshotId}`);

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
  next.provenanceNotes = ["Controlled non-citation guard fixture."];
  return next;
}

function approve(snapshot, reviewedAt, anchors) {
  return reviewRegulatorySnapshot(snapshot, {
    decision: "approved",
    reviewedBy: "Casey Nguyen, independent regulatory reviewer",
    reviewedAt,
    reviewNotes: ["Verified retained official-source text for non-citation guard coverage."],
    requiredTextAnchors: anchors,
    verifiedVersionIdentifier: snapshot.versionIdentifier,
    verifiedEffectiveDate: snapshot.effectiveDate,
  });
}

const inserted =
  "The offeror shall retain the reviewed notice before accepting the updated requirement.";
const changedText = retained.text.replace(
  citation.extractionEndAnchor,
  `${inserted}\n${citation.extractionEndAnchor}`
);

const snapshotRoot = await mkdtemp(path.join(tmpdir(), "subshield-noncitation-snapshots-"));
const packetRoot = await mkdtemp(path.join(tmpdir(), "subshield-noncitation-packets-"));
try {
  const baseline = pendingClone(
    `${SOURCE_ID}:noncitation-baseline`,
    "2026-06-01T12:00:00.000Z"
  );
  await storeRegulatorySnapshot(snapshotRoot, baseline);
  await persistRegulatorySnapshotReview(
    snapshotRoot,
    approve(baseline, "2026-06-02T12:00:00.000Z", [
      citation.extractionStartAnchor,
      citation.extractionEndAnchor,
    ])
  );

  const candidate = pendingClone(
    `${SOURCE_ID}:noncitation-candidate`,
    "2026-07-01T12:00:00.000Z",
    changedText
  );
  await storeRegulatorySnapshot(snapshotRoot, candidate);
  await persistRegulatorySnapshotReview(
    snapshotRoot,
    approve(candidate, "2026-07-02T12:00:00.000Z", [
      citation.extractionStartAnchor,
      inserted,
    ])
  );

  const review = await prepareStoredRegulatoryUpdateReview({
    snapshotRoot,
    packetRoot,
    sourceId: SOURCE_ID,
    requestedBy: "SubShield regulatory change-control preparer",
    createdAt: "2026-07-03T12:00:00.000Z",
  });
  if (review.status !== "packet-stored" || !review.packetRelativePath) {
    throw new Error(`Expected stored review packet: ${JSON.stringify(review)}`);
  }
  const packet = await loadRegulatoryUpdateReviewPacket(
    packetRoot,
    review.packetRelativePath,
    SOURCE_ID
  );
  const pair = await loadVerifiedStoredRegulatoryUpdatePair(snapshotRoot, SOURCE_ID);

  const valid = buildVerifiedStoredRegulatoryChangeSetDraft(
    packet,
    pair,
    "SubShield regulatory change-control preparer",
    "2026-07-04T12:00:00.000Z"
  );
  check(
    "the legitimate packet changes citations without changing reviewer conclusions",
    valid.changes.every(
      (change) =>
        change.afterValue.reviewerConclusion === template.value.reviewerConclusion &&
        fingerprintRegulatoryRegistryValue(change.afterValue.contractEvidenceQuotes) ===
          fingerprintRegulatoryRegistryValue(template.value.contractEvidenceQuotes) &&
        fingerprintRegulatoryRegistryValue(change.afterValue.prohibitedInferences) ===
          fingerprintRegulatoryRegistryValue(template.value.prohibitedInferences)
    )
  );

  const tampered = structuredClone(packet);
  tampered.proposal.transitions[0].afterValue.reviewerConclusion =
    "Caller-supplied conclusion that was never approved by the mapping review.";
  tampered.proposal.transitions[0].afterFingerprint = fingerprintRegulatoryRegistryValue(
    tampered.proposal.transitions[0].afterValue
  );
  tampered.packetChecksum = packetChecksum(tampered);

  await checkRejects(
    "a checksum-consistent packet cannot smuggle non-citation conclusion changes through a legitimate opaque pair",
    () =>
      Promise.resolve(
        buildVerifiedStoredRegulatoryChangeSetDraft(
          tampered,
          pair,
          "SubShield regulatory change-control preparer",
          "2026-07-04T12:00:00.000Z"
        )
      ),
    /non-citation package changes require coordinated mapping and historical-policy review/i
  );
} finally {
  await rm(snapshotRoot, { recursive: true, force: true });
  await rm(packetRoot, { recursive: true, force: true });
}

if (failures > 0) {
  console.error(`\n${failures} of ${assertions} non-citation guard assertions failed.`);
  process.exit(1);
}

console.log(`\nAll ${assertions} non-citation guard assertions passed.`);
