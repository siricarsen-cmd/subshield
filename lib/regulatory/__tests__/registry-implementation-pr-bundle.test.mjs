import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { getApprovedRegulatoryEvidenceSnapshot } from "../approved-evidence-registry.ts";
import {
  getRegisteredCitationTemplate,
  getRegisteredHistoricalGroundingPolicy,
} from "../registry-integrity.ts";
import { buildRegulatoryRegistryImplementationPlan } from "../registry-implementation-plan.ts";
import {
  buildRegulatoryImplementationPullRequestBundle,
  applyRegulatoryImplementationStepsToFile,
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
const STALE_TARGET_FILE = "lib/regulatory/source-coverage-citation-packages.ts";
const BASE_COMMIT = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const templateEntry = getRegisteredCitationTemplate(MAPPING_ID);
if (!templateEntry) throw new Error(`Missing citation template: ${MAPPING_ID}`);
const citation = templateEntry.value.citations.find(
  (candidate) => candidate.sourceId === SOURCE_ID
);
if (!citation) throw new Error(`Missing citation for ${SOURCE_ID}`);
const retained = getApprovedRegulatoryEvidenceSnapshot(SOURCE_ID, citation.snapshotId);
if (!retained) throw new Error(`Missing retained source fixture: ${citation.snapshotId}`);

function createStaleBaseCommit(baseCommit, indexPath) {
  const currentSource = execFileSync("git", ["show", `${baseCommit}:${STALE_TARGET_FILE}`], {
    encoding: "utf8",
  });
  const staleSource = currentSource.replace(
    `packageId: "${MAPPING_ID}-complete-source-coverage"`,
    `packageId: "${MAPPING_ID}-stale-source-coverage"`
  );
  if (staleSource === currentSource) {
    throw new Error("Controlled stale-base fixture could not alter the canonical target");
  }
  const blobSha = execFileSync("git", ["hash-object", "-w", "--stdin"], {
    encoding: "utf8",
    input: staleSource,
  }).trim();
  const gitEnv = {
    ...process.env,
    GIT_INDEX_FILE: indexPath,
    GIT_AUTHOR_NAME: "SubShield Regression Fixture",
    GIT_AUTHOR_EMAIL: "regression@example.invalid",
    GIT_COMMITTER_NAME: "SubShield Regression Fixture",
    GIT_COMMITTER_EMAIL: "regression@example.invalid",
  };
  execFileSync("git", ["read-tree", baseCommit], { env: gitEnv, encoding: "utf8" });
  execFileSync(
    "git",
    ["update-index", "--add", "--cacheinfo", "100644", blobSha, STALE_TARGET_FILE],
    { env: gitEnv, encoding: "utf8" }
  );
  const treeSha = execFileSync("git", ["write-tree"], {
    env: gitEnv,
    encoding: "utf8",
  }).trim();
  return execFileSync(
    "git",
    ["commit-tree", treeSha, "-p", baseCommit, "-m", "test: stale regulatory target fixture"],
    { env: gitEnv, encoding: "utf8" }
  ).trim();
}

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
      content: execFileSync("git", ["show", `${BASE_COMMIT}:${targetPath}`], {
        encoding: "utf8",
      }),
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
  const historicalEntry = getRegisteredHistoricalGroundingPolicy(MAPPING_ID);
  if (!historicalEntry) throw new Error(`Missing historical policy: ${MAPPING_ID}`);
  const historicalSource =
    files.find((file) => file.path === "lib/regulatory/historical-grounding-policy.ts")?.content ??
    execFileSync("git", ["show", `${BASE_COMMIT}:lib/regulatory/historical-grounding-policy.ts`], {
      encoding: "utf8",
    });
  const proposedHistoricalPolicy = structuredClone(historicalEntry.value);
  proposedHistoricalPolicy.sourcePolicies = proposedHistoricalPolicy.sourcePolicies.map(
    (sourcePolicy) =>
      sourcePolicy.sourceId === SOURCE_ID
        ? { ...sourcePolicy, rationale: `${sourcePolicy.rationale} Independently reverified.` }
        : sourcePolicy
  );
  const renderedHistoricalSource = applyRegulatoryImplementationStepsToFile(historicalSource, [
    {
      kind: "historical-policy",
      id: MAPPING_ID,
      targetFile: "lib/regulatory/historical-grounding-policy.ts",
      currentFingerprint: historicalEntry.fingerprint,
      proposedFingerprint: sha256("focused-render-fixture"),
      proposedValue: proposedHistoricalPolicy,
      officialSourceIds: [SOURCE_ID],
      officialSnapshotIds: [citation.snapshotId],
      reason: "Focused canonical historical-policy renderer regression.",
      benchmarkImpact: ["Historical grounding"],
      regressionPlan: ["Focused bundle renderer"],
      applicationStatus: "not-applied",
    },
  ]);
  check(
    "a canonical historical-policy transition is rendered through createPolicy",
    renderedHistoricalSource.includes(`createPolicy("${MAPPING_ID}", [`) &&
      renderedHistoricalSource.includes('"sourcePolicies"') === false &&
      renderedHistoricalSource.includes('"dateBasis": "solicitation-issued"') &&
      renderedHistoricalSource.includes("Independently reverified.")
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
    content: file.content.replace(
      `packageId: "${MAPPING_ID}-complete-source-coverage"`,
      `packageId: "removed-id-complete-source-coverage"`
    ),
  }));
  checkRejects(
    "a missing or renamed target object blocks deterministic replacement",
    () => buildRegulatoryImplementationPullRequestBundle(plan, missingObjectFiles),
    /does not match reviewed Git base/i
  );

  checkRejects(
    "a missing or renamed canonical createPolicy target is refused",
    () =>
      applyRegulatoryImplementationStepsToFile(
        historicalSource.replace(
          `createPolicy("${MAPPING_ID}", [`,
          `createPolicy("removed-${MAPPING_ID}", [`
        ),
        [
          {
            ...plan.steps[0],
            kind: "historical-policy",
            id: MAPPING_ID,
            targetFile: "lib/regulatory/historical-grounding-policy.ts",
            proposedValue: proposedHistoricalPolicy,
          },
        ]
      ),
    /exactly one createPolicy call/i
  );

  const staleBaseCommit = createStaleBaseCommit(
    BASE_COMMIT,
    path.join(snapshotRoot, "stale-base-index")
  );
  const olderReviewRecord = buildStoredRegulatoryChangeSetReviewRecord(
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
        "Adversarial fixture approving the exact transition against a synthetic stale Git base.",
        "The bundle must independently refuse stale canonical registry targets.",
      ],
      reviewedKinds: ["mapping", "historical-policy", "citation-template"],
      benchmarkValidation: {
        evidenceStatus: "reviewer-attested-not-machine-verified",
        repository: "siricarsen-cmd/subshield",
        commitSha: staleBaseCommit,
        regulatoryWorkflowRunId: 42003,
        analyzerWorkflowRunId: 42004,
        completedAt: "2026-07-05T11:00:00.000Z",
        regulatoryConclusion: "success",
        analyzerConclusion: "success",
      },
      releaseCreatedAt: "2026-07-05T12:05:00.000Z",
    }
  );
  const olderReviewReceipt = reverifyStoredRegulatoryChangeSetReviewRecord(
    olderReviewRecord,
    draft,
    packet,
    pair
  );
  const olderPlan = buildRegulatoryRegistryImplementationPlan(
    olderReviewRecord,
    olderReviewReceipt,
    draft,
    {
      baseCommitSha: staleBaseCommit,
      createdAt: "2026-07-06T12:00:00.000Z",
      preparedBy: "SubShield controlled implementation planner",
    }
  );
  const olderFiles = [...new Set(olderPlan.steps.map((step) => step.targetFile))].map(
    (targetPath) => ({
      path: targetPath,
      content: execFileSync("git", ["show", `${staleBaseCommit}:${targetPath}`], {
        encoding: "utf8",
      }),
    })
  );
  checkRejects(
    "a synthetic reviewed base containing stale target objects is refused",
    () => buildRegulatoryImplementationPullRequestBundle(olderPlan, olderFiles),
    /does not match the current canonical registry file|approved current fingerprint/i
  );

  const unrelatedEditFiles = files.map((file) =>
    file.path === "lib/regulatory/source-coverage-citation-packages.ts"
      ? { ...file, content: `${file.content}\n// unrelated caller edit\n` }
      : file
  );
  checkRejects(
    "an unrelated edit outside the authorized request is refused",
    () => buildRegulatoryImplementationPullRequestBundle(plan, unrelatedEditFiles),
    /does not match reviewed Git base/i
  );

  const mismatchedBaseFiles = files.map((file, index) =>
    index === 0 ? { ...file, content: `${file.content} ` } : file
  );
  checkRejects(
    "a mismatched reviewed base-file set is refused",
    () => buildRegulatoryImplementationPullRequestBundle(plan, mismatchedBaseFiles),
    /does not match reviewed Git base/i
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
