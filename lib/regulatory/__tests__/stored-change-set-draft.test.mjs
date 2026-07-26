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
  loadRegulatorySnapshotManifest,
  persistRegulatorySnapshotReview,
  storeRegulatorySnapshot,
} from "../snapshot-store.ts";
import {
  buildVerifiedStoredRegulatoryChangeSetDraft,
  isReverifiedStoredRegulatoryChangeSetDraftReceipt,
  loadVerifiedStoredRegulatoryChangeSetDraft,
  reverifyStoredRegulatoryChangeSetDraft,
  storeVerifiedStoredRegulatoryChangeSetDraft,
  validateVerifiedStoredRegulatoryChangeSetDraft,
} from "../stored-change-set-draft.ts";
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

function recomputeDraftChecksum(draft) {
  const { draftChecksum: _ignored, ...payload } = draft;
  return fingerprintRegulatoryRegistryValue(payload);
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
  next.provenanceNotes = ["Controlled stored change-set draft fixture."];
  return next;
}

function approve(snapshot, reviewedAt, anchors) {
  return reviewRegulatorySnapshot(snapshot, {
    decision: "approved",
    reviewedBy: "Morgan Ellis, independent regulatory reviewer",
    reviewedAt,
    reviewNotes: ["Verified retained official-source text for controlled change-set drafting."],
    requiredTextAnchors: anchors,
    verifiedVersionIdentifier: snapshot.versionIdentifier,
    verifiedEffectiveDate: snapshot.effectiveDate,
  });
}

async function seedApprovedBaseline(snapshotRoot, suffix) {
  const baseline = pendingClone(
    retained,
    `${SOURCE_ID}:${suffix}-baseline`,
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
  return baseline;
}

const insertedSentence =
  "The offeror shall retain the independently reviewed notice before accepting the updated requirement.";
const changedText = retained.text.replace(
  citation.extractionEndAnchor,
  `${insertedSentence}\n${citation.extractionEndAnchor}`
);

const snapshotRoot = await mkdtemp(path.join(tmpdir(), "subshield-draft-snapshots-"));
const packetRoot = await mkdtemp(path.join(tmpdir(), "subshield-draft-packets-"));
const draftRoot = await mkdtemp(path.join(tmpdir(), "subshield-draft-artifacts-"));
try {
  const baseline = await seedApprovedBaseline(snapshotRoot, "draft");
  const candidate = pendingClone(
    retained,
    `${SOURCE_ID}:draft-candidate`,
    "2026-07-01T12:00:00.000Z",
    changedText
  );
  await storeRegulatorySnapshot(snapshotRoot, candidate);
  await persistRegulatorySnapshotReview(
    snapshotRoot,
    approve(candidate, "2026-07-02T12:00:00.000Z", [
      citation.extractionStartAnchor,
      insertedSentence,
    ])
  );

  const reviewResult = await prepareStoredRegulatoryUpdateReview({
    snapshotRoot,
    packetRoot,
    sourceId: SOURCE_ID,
    requestedBy: "SubShield regulatory change-control preparer",
    createdAt: "2026-07-03T12:00:00.000Z",
  });
  if (reviewResult.status !== "packet-stored" || !reviewResult.packetRelativePath) {
    throw new Error(`Expected ready review packet: ${JSON.stringify(reviewResult)}`);
  }
  const packet = await loadRegulatoryUpdateReviewPacket(
    packetRoot,
    reviewResult.packetRelativePath,
    SOURCE_ID
  );
  const pair = await loadVerifiedStoredRegulatoryUpdatePair(snapshotRoot, SOURCE_ID);
  const draft = buildVerifiedStoredRegulatoryChangeSetDraft(
    packet,
    pair,
    "SubShield regulatory change-control preparer",
    "2026-07-04T12:00:00.000Z"
  );

  check(
    "an approved verified source update creates a pending non-applied citation-template draft",
    draft.sourceId === SOURCE_ID &&
      draft.baselineSnapshotId === baseline.snapshotId &&
      draft.candidateSnapshotId === candidate.snapshotId &&
      draft.reviewStatus === "pending" &&
      draft.applicationStatus === "not-applied" &&
      draft.customerFacingStatus === "benchmark-only" &&
      draft.promotionStatus === "requires-opaque-pair-reverification" &&
      draft.changes.length >= 1 &&
      draft.changes.every((change) => change.kind === "citation-template"),
    validateVerifiedStoredRegulatoryChangeSetDraft(draft).join(" | ")
  );
  check(
    "the draft preserves required human review and excludes complete source bodies",
    draft.requiredHumanReviewKinds.join("|") ===
      "mapping|historical-policy|citation-template" &&
      draft.changes.every(
        (change) =>
          change.officialEvidence.length === 1 &&
          change.officialEvidence[0].snapshotId === candidate.snapshotId &&
          change.officialEvidence[0].checksum === candidate.checksum
      ) &&
      !JSON.stringify(draft).includes('"text":') &&
      !JSON.stringify(draft).includes('"rawBody":')
  );

  const receipt = reverifyStoredRegulatoryChangeSetDraft(draft, packet, pair);
  check(
    "draft reuse requires an opaque in-memory reverification receipt",
    isReverifiedStoredRegulatoryChangeSetDraftReceipt(receipt) &&
      !isReverifiedStoredRegulatoryChangeSetDraftReceipt(structuredClone(receipt)) &&
      !isReverifiedStoredRegulatoryChangeSetDraftReceipt(draft)
  );

  const stored = await storeVerifiedStoredRegulatoryChangeSetDraft(draftRoot, draft);
  const loaded = await loadVerifiedStoredRegulatoryChangeSetDraft(
    draftRoot,
    stored.relativePath,
    SOURCE_ID
  );
  const loadedReceipt = reverifyStoredRegulatoryChangeSetDraft(loaded, packet, pair);
  check(
    "an immutable loaded draft can be reused only after fresh packet and pair reverification",
    loaded.draftChecksum === draft.draftChecksum &&
      isReverifiedStoredRegulatoryChangeSetDraftReceipt(loadedReceipt)
  );
  await checkRejects(
    "an identical draft cannot overwrite immutable change-control evidence",
    () => storeVerifiedStoredRegulatoryChangeSetDraft(draftRoot, draft),
    /EEXIST|file exists/i
  );

  await checkRejects(
    "a cloned or fabricated stored pair cannot create a change-set draft",
    () =>
      Promise.resolve(
        buildVerifiedStoredRegulatoryChangeSetDraft(
          packet,
          structuredClone(pair),
          "SubShield regulatory change-control preparer",
          "2026-07-04T12:00:00.000Z"
        )
      ),
    /opaque verified source pair/i
  );

  const tampered = structuredClone(draft);
  tampered.changes[0].reason = "Caller-altered transition rationale.";
  tampered.draftChecksum = recomputeDraftChecksum(tampered);
  check(
    "a recomputed structurally valid serialized draft is still not a trust credential",
    validateVerifiedStoredRegulatoryChangeSetDraft(tampered).length === 0
  );
  await checkRejects(
    "opaque reverification refuses a draft that no longer reproduces from its packet",
    () => Promise.resolve(reverifyStoredRegulatoryChangeSetDraft(tampered, packet, pair)),
    /does not reproduce from current verified evidence/i
  );

  const manifest = await loadRegulatorySnapshotManifest(snapshotRoot, SOURCE_ID);
  check(
    "draft creation does not mutate source review state or registry application state",
    manifest.latestApprovedSnapshotId === candidate.snapshotId &&
      manifest.snapshots.find((entry) => entry.snapshotId === candidate.snapshotId)
        ?.reviewStatus === "approved" &&
      draft.applicationStatus === "not-applied"
  );
} finally {
  await rm(snapshotRoot, { recursive: true, force: true });
  await rm(packetRoot, { recursive: true, force: true });
  await rm(draftRoot, { recursive: true, force: true });
}

const pendingSnapshotRoot = await mkdtemp(
  path.join(tmpdir(), "subshield-pending-draft-snapshots-")
);
const pendingPacketRoot = await mkdtemp(
  path.join(tmpdir(), "subshield-pending-draft-packets-")
);
try {
  await seedApprovedBaseline(pendingSnapshotRoot, "pending-draft");
  const pendingCandidate = pendingClone(
    retained,
    `${SOURCE_ID}:pending-draft-candidate`,
    "2026-07-01T12:00:00.000Z",
    changedText
  );
  await storeRegulatorySnapshot(pendingSnapshotRoot, pendingCandidate);
  const pendingReview = await prepareStoredRegulatoryUpdateReview({
    snapshotRoot: pendingSnapshotRoot,
    packetRoot: pendingPacketRoot,
    sourceId: SOURCE_ID,
    requestedBy: "SubShield regulatory change-control preparer",
    createdAt: "2026-07-03T12:00:00.000Z",
  });
  if (pendingReview.status !== "packet-stored" || !pendingReview.packetRelativePath) {
    throw new Error(`Expected pending review packet: ${JSON.stringify(pendingReview)}`);
  }
  const packet = await loadRegulatoryUpdateReviewPacket(
    pendingPacketRoot,
    pendingReview.packetRelativePath,
    SOURCE_ID
  );
  const pair = await loadVerifiedStoredRegulatoryUpdatePair(
    pendingSnapshotRoot,
    SOURCE_ID
  );
  await checkRejects(
    "a pending source candidate cannot create a registry change-set draft",
    () =>
      Promise.resolve(
        buildVerifiedStoredRegulatoryChangeSetDraft(
          packet,
          pair,
          "SubShield regulatory change-control preparer",
          "2026-07-04T12:00:00.000Z"
        )
      ),
    /candidate must be human-approved retained evidence/i
  );
} finally {
  await rm(pendingSnapshotRoot, { recursive: true, force: true });
  await rm(pendingPacketRoot, { recursive: true, force: true });
}

if (failures > 0) {
  console.error(`\n${failures} of ${assertions} stored change-set draft assertions failed.`);
  process.exit(1);
}

console.log(`\nAll ${assertions} stored change-set draft assertions passed.`);
