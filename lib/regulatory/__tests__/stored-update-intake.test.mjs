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
import {
  prepareRegulatoryUpdateIntake,
  prepareVerifiedStoredRegulatoryUpdateIntake,
} from "../update-intake.ts";
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

function checkThrows(label, action, pattern) {
  assertions++;
  try {
    action();
    failures++;
    console.error(`FAIL: ${label} — expected throw`);
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

function pendingStoredClone(snapshot, snapshotId, retrievedAt, text = snapshot.text) {
  const pending = structuredClone(snapshot);
  pending.snapshotId = snapshotId;
  pending.retrievedAt = retrievedAt;
  pending.text = text;
  pending.checksum = sha256(text);
  pending.rawChecksum = sha256(`stored-raw:${snapshotId}:${text}`);
  pending.reviewStatus = "pending";
  delete pending.reviewedBy;
  delete pending.reviewedAt;
  delete pending.reviewNotes;
  pending.retrieval.retrievedAt = retrievedAt;
  pending.retrieval.rawByteLength = Buffer.byteLength(text, "utf8");
  pending.provenanceNotes = [
    "Controlled stored-pair update-intake fixture.",
    "Not customer evidence and not automatically applied.",
  ];
  return pending;
}

function approveStoredSnapshot(snapshot, reviewedAt, anchors) {
  return reviewRegulatorySnapshot(snapshot, {
    decision: "approved",
    reviewedBy: "Independent regulatory reviewer",
    reviewedAt,
    reviewNotes: [
      "Reviewed the retained official-source text and metadata for the stored-pair intake bridge.",
    ],
    requiredTextAnchors: anchors,
    verifiedVersionIdentifier: snapshot.versionIdentifier,
    verifiedEffectiveDate: snapshot.effectiveDate,
  });
}

const SOURCE_ID = "dfars-252-204-7025";
const MAPPING_ID = "qa-c-future-cmmc-by-notice";
const templateEntry = getRegisteredCitationTemplate(MAPPING_ID);
if (!templateEntry) throw new Error(`Missing citation template: ${MAPPING_ID}`);
const citation = templateEntry.value.citations.find(
  (candidate) => candidate.sourceId === SOURCE_ID
);
if (!citation) throw new Error(`Missing registered citation: ${SOURCE_ID}`);
const retainedFixture = getApprovedRegulatoryEvidenceSnapshot(
  SOURCE_ID,
  citation.snapshotId
);
if (!retainedFixture) throw new Error(`Missing approved source fixture: ${citation.snapshotId}`);

const insertedSentence =
  "The offeror shall retain the reviewed notice with the solicitation record before acceptance.";
if (!retainedFixture.text.includes(citation.extractionEndAnchor)) {
  throw new Error("Registered citation end anchor is absent from retained fixture");
}
const candidateText = retainedFixture.text.replace(
  citation.extractionEndAnchor,
  `${insertedSentence}\n${citation.extractionEndAnchor}`
);

const root = await mkdtemp(path.join(tmpdir(), "subshield-stored-pair-intake-"));
try {
  const baseline = pendingStoredClone(
    retainedFixture,
    `${SOURCE_ID}:stored-intake-baseline`,
    "2026-07-01T12:00:00.000Z"
  );
  await storeRegulatorySnapshot(root, baseline);
  await persistRegulatorySnapshotReview(
    root,
    approveStoredSnapshot(baseline, "2026-07-01T13:00:00.000Z", [
      citation.extractionStartAnchor,
      citation.extractionEndAnchor,
    ])
  );

  const candidate = pendingStoredClone(
    retainedFixture,
    `${SOURCE_ID}:stored-intake-candidate`,
    "2026-08-01T12:00:00.000Z",
    candidateText
  );
  await storeRegulatorySnapshot(root, candidate);
  const pendingPair = await loadVerifiedStoredRegulatoryUpdatePair(root, SOURCE_ID);

  const pendingResult = prepareVerifiedStoredRegulatoryUpdateIntake(
    pendingPair,
    "SubShield controlled stored-source monitor",
    "2026-08-01T14:00:00.000Z"
  );
  check(
    "an opaque pending stored pair can enter update intake without benchmark-fixture identity",
    pendingResult.status === "proposal-prepared" &&
      pendingResult.proposal?.trustSource === "verified-stored-pair" &&
      pendingResult.proposal?.baselineSnapshotId === baseline.snapshotId &&
      pendingResult.proposal?.candidateSnapshotId === candidate.snapshotId &&
      pendingResult.proposal?.readiness === "awaiting-snapshot-approval" &&
      pendingResult.proposal?.candidateRetainedAsApprovedEvidence === false,
    pendingResult.refusalReasons.join(" | ")
  );
  check(
    "the stored-pair proposal remains benchmark-only and non-applied",
    pendingResult.proposal?.customerFacingStatus === "benchmark-only" &&
      pendingResult.proposal?.applicationStatus === "not-applied"
  );

  const directUntrustedResult = prepareRegulatoryUpdateIntake({
    baseline: pendingPair.baseline,
    candidate: pendingPair.candidate,
    requestedBy: "Direct caller without opaque receipt",
    createdAt: "2026-08-01T14:00:00.000Z",
  });
  check(
    "the ordinary intake path does not trust the same stored snapshots without the opaque pair",
    directUntrustedResult.status === "refused" &&
      directUntrustedResult.refusalReasons.some((reason) =>
        /does not match the immutable retained approved-evidence registry/i.test(reason)
      )
  );

  checkThrows(
    "a cloned verified pair loses trust and cannot enter the stored intake bridge",
    () =>
      prepareVerifiedStoredRegulatoryUpdateIntake(
        structuredClone(pendingPair),
        "Cloned-pair caller",
        "2026-08-01T14:00:00.000Z"
      ),
    /requires an opaque pair loaded from the controlled snapshot store/i
  );

  const blankRequester = prepareVerifiedStoredRegulatoryUpdateIntake(
    pendingPair,
    " ",
    "2026-08-01T14:00:00.000Z"
  );
  check(
    "verified storage trust does not bypass ordinary requester validation",
    blankRequester.status === "refused" &&
      blankRequester.refusalReasons.some((reason) => /requester must not be blank/i.test(reason))
  );

  const approvedCandidate = approveStoredSnapshot(
    candidate,
    "2026-08-01T13:00:00.000Z",
    [citation.extractionStartAnchor, insertedSentence]
  );
  await persistRegulatorySnapshotReview(root, approvedCandidate);
  const approvedPair = await loadVerifiedStoredRegulatoryUpdatePair(root, SOURCE_ID);
  const approvedResult = prepareVerifiedStoredRegulatoryUpdateIntake(
    approvedPair,
    "SubShield controlled stored-source monitor",
    "2026-08-01T14:00:00.000Z"
  );
  check(
    "an approved retained stored candidate can become change-set-draft ready",
    approvedResult.status === "proposal-prepared" &&
      approvedResult.proposal?.trustSource === "verified-stored-pair" &&
      approvedResult.proposal?.readiness ===
        "ready-for-controlled-change-set-draft" &&
      approvedResult.proposal?.candidateRetainedAsApprovedEvidence === true
  );
  check(
    "stored-pair approval does not skip mapping and date-policy human review",
    approvedResult.proposal?.registryKindsRequiringHumanReview.join("|") ===
      "mapping|historical-policy" &&
      approvedResult.proposal?.reviewQuestions.length >= 4
  );
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures > 0) {
  console.error(`\n${failures} of ${assertions} stored-pair intake assertions failed.`);
  process.exit(1);
}

console.log(`\nAll ${assertions} stored-pair intake assertions passed.`);
