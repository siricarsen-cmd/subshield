import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { getApprovedRegulatoryEvidenceSnapshot } from "../approved-evidence-registry.ts";
import { getRegisteredCitationTemplate } from "../registry-integrity.ts";
import { buildRegulatoryRegistryImplementationPlan } from "../registry-implementation-plan.ts";
import {
  buildRegulatoryImplementationPullRequestBundle,
  isLiveRegulatoryImplementationPullRequestBundle,
  validateRegulatoryImplementationPullRequestBundle,
} from "../registry-implementation-pr-bundle.ts";
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

function checkRejects(label, action, pattern) {
  assertions++;
  try {
    action();
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
  next.provenanceNotes = ["Controlled implementation-PR bundle fixture."];
  return next;
}

function approveSnapshot(snapshot, reviewedAt, anchors) {
  return reviewRegulatorySnapshot(snapshot, {
    decision: "approved",
    reviewedBy: "Morgan Ellis, independent source reviewer",
    reviewedAt,
    reviewNotes: ["Verified retained official-source text for implementation PR planning."],
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

const snapshotRoot = await mkdtemp(path.join(tmpdir(), "subshield-pr-bundle-snapshots-"));
const packetRoot = await mkdtemp(path.join(tmpdir(), "subshield-pr-bundle-packets-"));

try {
  const baseline = pendingClone(
    retained,
    `${SOURCE_ID}:pr-bundle-baseline`,
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
    `${SOURCE_ID}:pr-bundle-candidate`,
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
        "Authorized only a future explicit implementation pull request after fresh checks.",
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

  const targetPaths = [...new Set(plan.steps.map((step) => step.targetFile))];
  const files = await Promise.all(
    targetPaths.map(async (targetPath) => ({
      path: targetPath,
      content: await readFile(targetPath, "utf8"),
    }))
  );
  const bundle = buildRegulatoryImplementationPullRequestBundle(plan, files);
  check(
    "a live-authorized plan creates one immutable non-applied implementation PR bundle",
    isLiveRegulatoryImplementationPullRequestBundle(bundle) &&
      !isLiveRegulatoryImplementationPullRequestBundle(structuredClone(bundle)) &&
      bundle.baseCommitSha === BASE_COMMIT &&
      bundle.targetBranch === plan.targetBranch &&
      bundle.applicationStatus === "not-applied" &&
      bundle.mergeStatus === "not-authorized"
  );
  check(
    "the bundle changes only exact authorized registry files and IDs",
    bundle.files.length === targetPaths.length &&
      bundle.files.every(
        (file) =>
          targetPaths.includes(file.path) &&
          file.changedRegistryIds.length > 0 &&
          file.beforeChecksum !== file.afterChecksum &&
          sha256(file.content) === file.afterChecksum
      )
  );
  check(
    "the generated PR record carries exact checks and deliberate merge boundaries",
    bundle.requiredChecks.join("|") === plan.requiredChecks.join("|") &&
      bundle.pullRequestBody.includes(plan.planChecksum) &&
      bundle.pullRequestBody.includes("does not authorize merge") &&
      validateRegulatoryImplementationPullRequestBundle(bundle, plan).length === 0
  );

  checkRejects(
    "a cloned implementation plan cannot create a PR bundle",
    () => buildRegulatoryImplementationPullRequestBundle(structuredClone(plan), files),
    /original live-authorized plan/i
  );
  checkRejects(
    "extra caller-selected files cannot enter the implementation bundle",
    () =>
      buildRegulatoryImplementationPullRequestBundle(plan, [
        ...files,
        { path: "lib/analyzer/deterministic.ts", content: "export {};\n" },
      ]),
    /exactly match the authorized target-file set/i
  );
  const missingObjectFiles = files.map((file) => ({
    ...file,
    content: file.content.replace(`mappingId: \"${MAPPING_ID}\"`, `mappingId: \"removed-id\"`),
  }));
  checkRejects(
    "a missing or renamed target object blocks deterministic replacement",
    () => buildRegulatoryImplementationPullRequestBundle(plan, missingObjectFiles),
    /exactly one mappingId/i
  );

  const tampered = structuredClone(bundle);
  tampered.files[0].content += "\n// caller mutation\n";
  check(
    "a serialized bundle mutation invalidates its checksum and file provenance",
    validateRegulatoryImplementationPullRequestBundle(tampered, plan).some((error) =>
      /content does not match|checksum does not reproduce/i.test(error)
    )
  );
} finally {
  await rm(snapshotRoot, { recursive: true, force: true });
  await rm(packetRoot, { recursive: true, force: true });
}

if (failures > 0) {
  console.error(`\n${failures} of ${assertions} implementation-PR bundle assertions failed.`);
  process.exit(1);
}

console.log(`\nAll ${assertions} implementation-PR bundle assertions passed.`);
