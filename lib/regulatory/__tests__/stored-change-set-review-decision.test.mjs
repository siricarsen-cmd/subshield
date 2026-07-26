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
import {
  buildVerifiedStoredRegulatoryChangeSetDraft,
  loadVerifiedStoredRegulatoryChangeSetDraft,
  reverifyStoredRegulatoryChangeSetDraft,
  storeVerifiedStoredRegulatoryChangeSetDraft,
} from "../stored-change-set-draft.ts";
import {
  buildStoredRegulatoryChangeSetReviewRecord,
  isReverifiedStoredRegulatoryChangeSetReviewReceipt,
  loadStoredRegulatoryChangeSetReviewRecord,
  reverifyStoredRegulatoryChangeSetReviewRecord,
  storeStoredRegulatoryChangeSetReviewRecord,
  validateStoredRegulatoryChangeSetReviewRecord,
} from "../stored-change-set-review.ts";
import { recordStoredRegulatoryChangeSetReviewDecision } from "../stored-change-set-review-command.ts";
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

function recomputeReviewChecksum(record) {
  const { reviewRecordChecksum: _ignored, ...payload } = record;
  return fingerprintRegulatoryRegistryValue(JSON.parse(JSON.stringify(payload)));
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
  next.provenanceNotes = ["Controlled stored change-set review fixture."];
  return next;
}

function approveSnapshot(snapshot, reviewedAt, anchors) {
  return reviewRegulatorySnapshot(snapshot, {
    decision: "approved",
    reviewedBy: "Morgan Ellis, independent source reviewer",
    reviewedAt,
    reviewNotes: ["Verified retained official-source text for controlled change review."],
    requiredTextAnchors: anchors,
    verifiedVersionIdentifier: snapshot.versionIdentifier,
    verifiedEffectiveDate: snapshot.effectiveDate,
  });
}

const insertedSentence =
  "The offeror shall retain the independently reviewed notice before accepting the updated requirement.";
const changedText = retained.text.replace(
  citation.extractionEndAnchor,
  `${insertedSentence}\n${citation.extractionEndAnchor}`
);

const snapshotRoot = await mkdtemp(path.join(tmpdir(), "subshield-review-decision-snapshots-"));
const packetRoot = await mkdtemp(path.join(tmpdir(), "subshield-review-decision-packets-"));
const draftRoot = await mkdtemp(path.join(tmpdir(), "subshield-review-decision-drafts-"));
const reviewRoot = await mkdtemp(path.join(tmpdir(), "subshield-review-decision-records-"));
const rejectionRoot = await mkdtemp(path.join(tmpdir(), "subshield-review-rejection-records-"));

try {
  const baseline = pendingClone(
    retained,
    `${SOURCE_ID}:review-decision-baseline`,
    "2026-06-01T12:00:00.000Z"
  );
  await storeRegulatorySnapshot(snapshotRoot, baseline);
  await persistRegulatorySnapshotReview(
    snapshotRoot,
    approveSnapshot(baseline, "2026-06-02T12:00:00.000Z", [
      citation.extractionStartAnchor,
      citation.extractionEndAnchor,
    ])
  );

  const candidate = pendingClone(
    retained,
    `${SOURCE_ID}:review-decision-candidate`,
    "2026-07-01T12:00:00.000Z",
    changedText
  );
  await storeRegulatorySnapshot(snapshotRoot, candidate);
  await persistRegulatorySnapshotReview(
    snapshotRoot,
    approveSnapshot(candidate, "2026-07-02T12:00:00.000Z", [
      citation.extractionStartAnchor,
      insertedSentence,
    ])
  );

  const prepared = await prepareStoredRegulatoryUpdateReview({
    snapshotRoot,
    packetRoot,
    sourceId: SOURCE_ID,
    requestedBy: "SubShield regulatory change-control preparer",
    createdAt: "2026-07-03T12:00:00.000Z",
  });
  if (prepared.status !== "packet-stored" || !prepared.packetRelativePath) {
    throw new Error(`Expected stored update-review packet: ${JSON.stringify(prepared)}`);
  }
  const packet = await loadRegulatoryUpdateReviewPacket(
    packetRoot,
    prepared.packetRelativePath,
    SOURCE_ID
  );
  const pair = await loadVerifiedStoredRegulatoryUpdatePair(snapshotRoot, SOURCE_ID);
  const draft = buildVerifiedStoredRegulatoryChangeSetDraft(
    packet,
    pair,
    "SubShield regulatory change-control preparer",
    "2026-07-04T12:00:00.000Z"
  );
  const storedDraft = await storeVerifiedStoredRegulatoryChangeSetDraft(draftRoot, draft);
  const loadedDraft = await loadVerifiedStoredRegulatoryChangeSetDraft(
    draftRoot,
    storedDraft.relativePath,
    SOURCE_ID
  );
  const draftReceipt = reverifyStoredRegulatoryChangeSetDraft(loadedDraft, packet, pair);
  const registryFingerprintBefore = getRegisteredCitationTemplate(MAPPING_ID)?.fingerprint;

  const approvalRequest = {
    decision: "approved",
    reviewedBy: "Alex Rivera, independent registry reviewer",
    reviewedAt: "2026-07-05T12:00:00.000Z",
    reviewNotes: [
      "Reviewed the citation-template transition against the human-approved source evidence and exact extraction anchors.",
      "Reviewed mapping and historical-policy impact and confirmed that this record authorizes only a future explicit code-change pull request.",
    ],
    reviewedKinds: ["mapping", "historical-policy", "citation-template"],
    benchmarkValidation: {
      evidenceStatus: "reviewer-attested-not-machine-verified",
      repository: "siricarsen-cmd/subshield",
      commitSha: "a".repeat(40),
      regulatoryWorkflowRunId: 41001,
      analyzerWorkflowRunId: 41002,
      completedAt: "2026-07-05T11:00:00.000Z",
      regulatoryConclusion: "success",
      analyzerConclusion: "success",
    },
    releaseCreatedAt: "2026-07-05T12:05:00.000Z",
  };

  const liveHumanRecord = buildStoredRegulatoryChangeSetReviewRecord(
    loadedDraft,
    packet,
    pair,
    draftReceipt,
    approvalRequest
  );
  const liveReceipt = reverifyStoredRegulatoryChangeSetReviewRecord(
    liveHumanRecord,
    loadedDraft,
    packet,
    pair
  );
  check(
    "the original in-process human decision can issue one ephemeral authorization receipt",
    isReverifiedStoredRegulatoryChangeSetReviewReceipt(liveReceipt) &&
      !isReverifiedStoredRegulatoryChangeSetReviewReceipt(structuredClone(liveReceipt)) &&
      liveHumanRecord.releaseRecord?.applicationStatus === "not-applied"
  );

  const commandResult = await recordStoredRegulatoryChangeSetReviewDecision({
    snapshotRoot,
    packetRoot,
    draftRoot,
    reviewRoot,
    sourceId: SOURCE_ID,
    packetRelativePath: prepared.packetRelativePath,
    draftRelativePath: storedDraft.relativePath,
    ...approvalRequest,
  });
  check(
    "the operator command persists an immutable non-applied approval and release audit record",
    commandResult.decisionStatus === "approved-for-explicit-implementation-pr" &&
      commandResult.applicationStatus === "not-applied" &&
      commandResult.customerFacingStatus === "benchmark-only" &&
      commandResult.implementationStatus === "requires-explicit-code-change-pr" &&
      Boolean(commandResult.releaseRecordId) &&
      Boolean(commandResult.releaseRecordFingerprint)
  );

  const loadedRecord = await loadStoredRegulatoryChangeSetReviewRecord(
    reviewRoot,
    commandResult.reviewRecordRelativePath,
    SOURCE_ID
  );
  check(
    "the loaded audit record binds all evidence while excluding full official-source bodies",
    loadedRecord.draftChecksum === loadedDraft.draftChecksum &&
      loadedRecord.packetChecksum === packet.packetChecksum &&
      loadedRecord.pairVerificationChecksum === pair.verificationChecksum &&
      loadedRecord.sourceReviewedBy === pair.candidate.reviewedBy &&
      loadedRecord.reviewedKinds.join("|") ===
        "mapping|historical-policy|citation-template" &&
      validateStoredRegulatoryChangeSetReviewRecord(loadedRecord, loadedDraft).length === 0 &&
      !JSON.stringify(loadedRecord).includes('"text":') &&
      !JSON.stringify(loadedRecord).includes('"rawBody":')
  );
  await checkRejects(
    "a loaded serialized approval record cannot recreate human authorization trust",
    () =>
      Promise.resolve(
        reverifyStoredRegulatoryChangeSetReviewRecord(
          loadedRecord,
          loadedDraft,
          packet,
          pair
        )
      ),
    /original in-process human decision record|serialized or loaded records cannot recreate trust/i
  );

  await checkRejects(
    "a conflicting later decision cannot overwrite the draft-bound final audit record",
    () =>
      recordStoredRegulatoryChangeSetReviewDecision({
        snapshotRoot,
        packetRoot,
        draftRoot,
        reviewRoot,
        sourceId: SOURCE_ID,
        packetRelativePath: prepared.packetRelativePath,
        draftRelativePath: storedDraft.relativePath,
        ...approvalRequest,
        decision: "rejected",
        benchmarkValidation: undefined,
        releaseCreatedAt: undefined,
        reviewNotes: ["This conflicting decision must not overwrite the existing approval."],
        reviewedKinds: ["citation-template"],
        reviewedAt: "2026-07-06T12:00:00.000Z",
      }),
    /EEXIST|file exists/i
  );

  await checkRejects(
    "an automated identity cannot approve a stored change-set draft",
    () =>
      Promise.resolve(
        buildStoredRegulatoryChangeSetReviewRecord(
          loadedDraft,
          packet,
          pair,
          draftReceipt,
          { ...approvalRequest, reviewedBy: "SubShield automation bot" }
        )
      ),
    /non-automated reviewer/i
  );
  await checkRejects(
    "the source reviewer cannot also approve the registry draft",
    () =>
      Promise.resolve(
        buildStoredRegulatoryChangeSetReviewRecord(
          loadedDraft,
          packet,
          pair,
          draftReceipt,
          { ...approvalRequest, reviewedBy: pair.candidate.reviewedBy }
        )
      ),
    /independent from the source reviewer and draft preparer/i
  );
  await checkRejects(
    "approval is refused when required mapping or historical-policy review is omitted",
    () =>
      Promise.resolve(
        buildStoredRegulatoryChangeSetReviewRecord(
          loadedDraft,
          packet,
          pair,
          draftReceipt,
          { ...approvalRequest, reviewedKinds: ["citation-template"] }
        )
      ),
    /explicit review of mapping, historical-policy, and citation-template/i
  );
  await checkRejects(
    "approval is refused without benchmark validation attestation",
    () =>
      Promise.resolve(
        buildStoredRegulatoryChangeSetReviewRecord(
          loadedDraft,
          packet,
          pair,
          draftReceipt,
          { ...approvalRequest, benchmarkValidation: undefined }
        )
      ),
    /benchmark validation attestation/i
  );
  await checkRejects(
    "a cloned draft receipt cannot authorize a human decision",
    () =>
      Promise.resolve(
        buildStoredRegulatoryChangeSetReviewRecord(
          loadedDraft,
          packet,
          pair,
          structuredClone(draftReceipt),
          approvalRequest
        )
      ),
    /opaque draft reverification receipt/i
  );

  const tampered = structuredClone(loadedRecord);
  tampered.reviewNotes[0] = "Caller-altered review conclusion that no reviewer made.";
  tampered.releaseRecord.reviewNotes[0] = tampered.reviewNotes[0];
  tampered.releaseRecordFingerprint = fingerprintRegulatoryRegistryValue(
    JSON.parse(JSON.stringify(tampered.releaseRecord))
  );
  tampered.reviewRecordChecksum = recomputeReviewChecksum(tampered);
  check(
    "a checksum-consistent serialized decision remains only structurally valid audit data",
    validateStoredRegulatoryChangeSetReviewRecord(tampered, loadedDraft).length === 0
  );
  await checkRejects(
    "a checksum-consistent altered decision cannot issue an authorization receipt",
    () =>
      Promise.resolve(
        reverifyStoredRegulatoryChangeSetReviewRecord(
          tampered,
          loadedDraft,
          packet,
          pair
        )
      ),
    /original in-process human decision record|serialized or loaded records cannot recreate trust/i
  );

  const rejection = buildStoredRegulatoryChangeSetReviewRecord(
    loadedDraft,
    packet,
    pair,
    draftReceipt,
    {
      decision: "rejected",
      reviewedBy: "Jamie Patel, independent registry reviewer",
      reviewedAt: "2026-07-05T13:00:00.000Z",
      reviewNotes: [
        "Rejected because the citation transition requires additional benchmark fixture coverage before reconsideration.",
      ],
      reviewedKinds: ["citation-template"],
    }
  );
  const rejectionReceipt = reverifyStoredRegulatoryChangeSetReviewRecord(
    rejection,
    loadedDraft,
    packet,
    pair
  );
  const storedRejection = await storeStoredRegulatoryChangeSetReviewRecord(
    rejectionRoot,
    rejection
  );
  const loadedRejection = await loadStoredRegulatoryChangeSetReviewRecord(
    rejectionRoot,
    storedRejection.relativePath,
    SOURCE_ID
  );
  check(
    "a live human rejection is final, non-applied, and has no release evidence",
    isReverifiedStoredRegulatoryChangeSetReviewReceipt(rejectionReceipt) &&
      loadedRejection.decisionStatus === "rejected-final" &&
      loadedRejection.applicationStatus === "not-applied" &&
      !loadedRejection.releaseRecord &&
      !loadedRejection.benchmarkValidation
  );
  await checkRejects(
    "a loaded rejection record also cannot recreate human authorization trust",
    () =>
      Promise.resolve(
        reverifyStoredRegulatoryChangeSetReviewRecord(
          loadedRejection,
          loadedDraft,
          packet,
          pair
        )
      ),
    /original in-process human decision record|serialized or loaded records cannot recreate trust/i
  );

  check(
    "review decisions and release records never mutate the canonical citation registry",
    getRegisteredCitationTemplate(MAPPING_ID)?.fingerprint === registryFingerprintBefore
  );
} finally {
  await rm(snapshotRoot, { recursive: true, force: true });
  await rm(packetRoot, { recursive: true, force: true });
  await rm(draftRoot, { recursive: true, force: true });
  await rm(reviewRoot, { recursive: true, force: true });
  await rm(rejectionRoot, { recursive: true, force: true });
}

if (failures > 0) {
  console.error(`\n${failures} of ${assertions} stored change-set review assertions failed.`);
  process.exit(1);
}

console.log(`\nAll ${assertions} stored change-set review assertions passed.`);
