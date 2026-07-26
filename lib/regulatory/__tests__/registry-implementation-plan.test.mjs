import { createHash } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { getApprovedRegulatoryEvidenceSnapshot } from "../approved-evidence-registry.ts";
import {
  buildRegulatoryRegistryImplementationPlan,
  isLiveAuthorizedRegulatoryRegistryImplementationPlan,
  loadRegulatoryRegistryImplementationPlan,
  storeRegulatoryRegistryImplementationPlan,
  validateRegulatoryRegistryImplementationPlan,
} from "../registry-implementation-plan.ts";
import { getRegisteredCitationTemplate } from "../registry-integrity.ts";
import { reviewRegulatorySnapshot } from "../source-review.ts";
import {
  persistRegulatorySnapshotReview,
  storeRegulatorySnapshot,
} from "../snapshot-store.ts";
import {
  buildVerifiedStoredRegulatoryChangeSetDraft,
  reverifyStoredRegulatoryChangeSetDraft,
} from "../stored-change-set-draft.ts";
import {
  buildStoredRegulatoryChangeSetReviewRecord,
  reverifyStoredRegulatoryChangeSetReviewRecord,
} from "../stored-change-set-review.ts";
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

const SOURCE_ID = "dfars-252-204-7025";
const MAPPING_ID = "qa-c-future-cmmc-by-notice";
const BASE_COMMIT = "b".repeat(40);
const templateEntry = getRegisteredCitationTemplate(MAPPING_ID);
if (!templateEntry) throw new Error(`Missing citation template: ${MAPPING_ID}`);
const citation = templateEntry.value.citations.find(
  (candidate) => candidate.sourceId === SOURCE_ID
);
if (!citation) throw new Error(`Missing citation for ${SOURCE_ID}`);
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
  next.provenanceNotes = ["Controlled implementation-plan fixture."];
  return next;
}

function approveSnapshot(snapshot, reviewedAt, anchors) {
  return reviewRegulatorySnapshot(snapshot, {
    decision: "approved",
    reviewedBy: "Morgan Ellis, independent source reviewer",
    reviewedAt,
    reviewNotes: ["Verified retained official-source text for implementation planning."],
    requiredTextAnchors: anchors,
    verifiedVersionIdentifier: snapshot.versionIdentifier,
    verifiedEffectiveDate: snapshot.effectiveDate,
  });
}

const insertedSentence =
  "The offeror shall retain the independently reviewed implementation notice before accepting the updated requirement.";
const changedText = retained.text.replace(
  citation.extractionEndAnchor,
  `${insertedSentence}\n${citation.extractionEndAnchor}`
);

const snapshotRoot = await mkdtemp(path.join(tmpdir(), "subshield-plan-snapshots-"));
const packetRoot = await mkdtemp(path.join(tmpdir(), "subshield-plan-packets-"));
const planRoot = await mkdtemp(path.join(tmpdir(), "subshield-plan-records-"));

try {
  const baseline = pendingClone(
    retained,
    `${SOURCE_ID}:implementation-plan-baseline`,
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
    `${SOURCE_ID}:implementation-plan-candidate`,
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
    throw new Error(`Expected stored review packet: ${JSON.stringify(prepared)}`);
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
  const draftReceipt = reverifyStoredRegulatoryChangeSetDraft(draft, packet, pair);
  const reviewRecord = buildStoredRegulatoryChangeSetReviewRecord(
    draft,
    packet,
    pair,
    draftReceipt,
    {
      decision: "approved",
      reviewedBy: "Alex Rivera, independent registry reviewer",
      reviewerPrincipal: "Alex Rivera",
      reviewedAt: "2026-07-05T12:00:00.000Z",
      reviewNotes: [
        "Reviewed the exact citation transition and retained official-source evidence.",
        "Reviewed mapping and historical-policy impacts and authorized only a future explicit code-change pull request.",
      ],
      reviewedKinds: ["mapping", "historical-policy", "citation-template"],
      benchmarkValidation: {
        evidenceStatus: "reviewer-attested-not-machine-verified",
        repository: "siricarsen-cmd/subshield",
        commitSha: BASE_COMMIT,
        regulatoryWorkflowRunId: 42001,
        analyzerWorkflowRunId: 42002,
        completedAt: "2026-07-05T11:00:00.000Z",
        regulatoryConclusion: "success",
        analyzerConclusion: "success",
      },
      releaseCreatedAt: "2026-07-05T12:05:00.000Z",
    }
  );
  const reviewReceipt = reverifyStoredRegulatoryChangeSetReviewRecord(
    reviewRecord,
    draft,
    packet,
    pair
  );

  const plan = buildRegulatoryRegistryImplementationPlan(
    reviewRecord,
    reviewReceipt,
    draft,
    {
      baseCommitSha: BASE_COMMIT,
      createdAt: "2026-07-06T12:00:00.000Z",
      preparedBy: "SubShield controlled implementation planner",
    }
  );
  check(
    "a live human authorization receipt creates one Git-bound non-applied implementation plan",
    isLiveAuthorizedRegulatoryRegistryImplementationPlan(plan) &&
      !isLiveAuthorizedRegulatoryRegistryImplementationPlan(structuredClone(plan)) &&
      plan.baseCommitSha === BASE_COMMIT &&
      plan.reviewRecordChecksum === reviewRecord.reviewRecordChecksum &&
      plan.reviewAuthorizationChecksum === reviewReceipt.verificationChecksum &&
      plan.applicationStatus === "not-applied" &&
      plan.mergeStatus === "not-authorized"
  );
  check(
    "the plan names exact canonical registry files and reproducible before/after fingerprints",
    plan.steps.length === draft.changes.length &&
      plan.steps.every(
        (step) =>
          step.targetFile === "lib/regulatory/source-coverage-citation-packages.ts" &&
          step.currentFingerprint === templateEntry.fingerprint &&
          step.proposedFingerprint !== step.currentFingerprint &&
          step.applicationStatus === "not-applied"
      )
  );
  check(
    "the plan carries complete checks and explicit prohibited actions without full source bodies",
    plan.requiredChecks.join("|") ===
      "npm run test:regulatory|npm run test:accuracy|npx tsc --noEmit|npm run build" &&
      plan.prohibitedActions.length >= 4 &&
      !JSON.stringify(plan).includes('"text":') &&
      !JSON.stringify(plan).includes('"rawBody":') &&
      validateRegulatoryRegistryImplementationPlan(plan, draft).length === 0
  );

  const stored = await storeRegulatoryRegistryImplementationPlan(planRoot, plan);
  const loaded = await loadRegulatoryRegistryImplementationPlan(
    planRoot,
    stored.relativePath,
    SOURCE_ID
  );
  check(
    "a stored implementation plan remains valid audit evidence but loses live authorization",
    validateRegulatoryRegistryImplementationPlan(loaded, draft).length === 0 &&
      !isLiveAuthorizedRegulatoryRegistryImplementationPlan(loaded) &&
      loaded.planChecksum === plan.planChecksum
  );
  await checkRejects(
    "a second write cannot overwrite the review-bound implementation plan",
    () => storeRegulatoryRegistryImplementationPlan(planRoot, plan),
    /EEXIST|file exists/i
  );

  await checkRejects(
    "a cloned human-review receipt cannot authorize a plan",
    () =>
      Promise.resolve(
        buildRegulatoryRegistryImplementationPlan(
          reviewRecord,
          structuredClone(reviewReceipt),
          draft,
          {
            baseCommitSha: BASE_COMMIT,
            createdAt: "2026-07-06T12:00:00.000Z",
            preparedBy: "SubShield controlled implementation planner",
          }
        )
      ),
    /live opaque human-review authorization receipt/i
  );
  await checkRejects(
    "a plan cannot target a commit other than the human-reviewed benchmark commit",
    () =>
      Promise.resolve(
        buildRegulatoryRegistryImplementationPlan(reviewRecord, reviewReceipt, draft, {
          baseCommitSha: "c".repeat(40),
          createdAt: "2026-07-06T12:00:00.000Z",
          preparedBy: "SubShield controlled implementation planner",
        })
      ),
    /base commit must equal the human-reviewed benchmark commit/i
  );
  await checkRejects(
    "a rejected human decision cannot create an implementation plan",
    () =>
      Promise.resolve(
        buildRegulatoryRegistryImplementationPlan(
          { ...reviewRecord, decision: "rejected", decisionStatus: "rejected-final" },
          reviewReceipt,
          draft,
          {
            baseCommitSha: BASE_COMMIT,
            createdAt: "2026-07-06T12:00:00.000Z",
            preparedBy: "SubShield controlled implementation planner",
          }
        )
      ),
    /review record is invalid|complete approved human review/i
  );

  const tamperedPlan = structuredClone(loaded);
  tamperedPlan.steps[0].targetFile = "lib/analyzer/deterministic.ts";
  check(
    "a plan cannot redirect a regulatory transition into analyzer code",
    validateRegulatoryRegistryImplementationPlan(tamperedPlan, draft).some((error) =>
      /target file is invalid/i.test(error)
    )
  );
  const tamperedValue = structuredClone(loaded);
  tamperedValue.steps[0].proposedValue.mappingId = "caller-altered-mapping";
  check(
    "a changed proposed value invalidates the recorded transition fingerprint",
    validateRegulatoryRegistryImplementationPlan(tamperedValue, draft).some((error) =>
      /step fingerprint is invalid/i.test(error)
    )
  );
} finally {
  await rm(snapshotRoot, { recursive: true, force: true });
  await rm(packetRoot, { recursive: true, force: true });
  await rm(planRoot, { recursive: true, force: true });
}

if (failures > 0) {
  console.error(`\n${failures} of ${assertions} implementation-plan assertions failed.`);
  process.exit(1);
}

console.log(`\nAll ${assertions} implementation-plan assertions passed.`);
