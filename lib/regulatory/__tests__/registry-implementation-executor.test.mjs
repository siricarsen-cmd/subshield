import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { getApprovedRegulatoryEvidenceSnapshot } from "../approved-evidence-registry.ts";
import {
  executeRegulatoryImplementationPullRequest,
  isLiveRegulatoryImplementationExecutionReceipt,
  validateRegulatoryImplementationExecutionReceipt,
} from "../registry-implementation-executor.ts";
import { getRegisteredCitationTemplate } from "../registry-integrity.ts";
import { buildRegulatoryRegistryImplementationPlan } from "../registry-implementation-plan.ts";
import { buildRegulatoryImplementationPullRequestBundle } from "../registry-implementation-pr-bundle.ts";
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

function sha256(value) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function gitSha(value) {
  return createHash("sha1").update(value).digest("hex");
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
  next.provenanceNotes = ["Controlled implementation-executor fixture."];
  return next;
}

function approveSnapshot(snapshot, reviewedAt, anchors) {
  return reviewRegulatorySnapshot(snapshot, {
    decision: "approved",
    reviewedBy: "Morgan Ellis, independent source reviewer",
    reviewedAt,
    reviewNotes: ["Verified retained official-source text for executor planning."],
    requiredTextAnchors: anchors,
    verifiedVersionIdentifier: snapshot.versionIdentifier,
    verifiedEffectiveDate: snapshot.effectiveDate,
  });
}

function createMemoryAdapter(baseCommitSha, baseFiles, options = {}) {
  const baseByPath = new Map(baseFiles.map((file) => [file.path, file.content]));
  const branches = new Map();
  const commits = new Map();
  const mutations = [];
  const checks = [];
  const pushes = [];
  const pullRequests = [];

  return {
    mutations,
    checks,
    pushes,
    pullRequests,

    async inspectRepository() {
      return {
        repositoryFullName: options.repositoryFullName ?? "siricarsen-cmd/subshield",
        defaultBranch: options.defaultBranch ?? "main",
      };
    },

    async commitExists(commitSha) {
      return options.missingBase !== true && commitSha === baseCommitSha;
    },

    async readFileAtCommit(commitSha, filePath) {
      if (commitSha !== baseCommitSha) throw new Error("Unknown reviewed base commit");
      const content = baseByPath.get(filePath);
      if (content === undefined) throw new Error(`Unknown base file: ${filePath}`);
      return options.baseContentMismatchPath === filePath ? `${content} ` : content;
    },

    async branchExists(branch) {
      return options.existingBranch === true || branches.has(branch);
    },

    async findPullRequestByHead(branch) {
      if (options.existingPullRequest === true) {
        return {
          number: 99,
          url: "https://github.com/siricarsen-cmd/subshield/pull/99",
          baseBranch: "main",
          headBranch: branch,
          headCommitSha: baseCommitSha,
          title: "Existing executor PR",
          body: "Existing executor PR",
          autoMergeEnabled: false,
        };
      }
      return pullRequests.find((candidate) => candidate.headBranch === branch) ?? null;
    },

    async createBranch(branch, commitSha) {
      if (options.failBranch) throw new Error("Controlled branch creation failure");
      if (branches.has(branch)) throw new Error("Branch already exists");
      branches.set(branch, { baseCommitSha: commitSha, files: new Map(baseByPath) });
      mutations.push(`branch:${branch}:${commitSha}`);
    },

    async writeFile(branch, filePath, content) {
      if (options.failWritePath === filePath) throw new Error("Controlled file write failure");
      const worktree = branches.get(branch);
      if (!worktree) throw new Error("Unknown executor branch");
      worktree.files.set(filePath, content);
      mutations.push(`write:${filePath}`);
    },

    async listChangedFiles(branch) {
      const worktree = branches.get(branch);
      if (!worktree) throw new Error("Unknown executor branch");
      const changed = [];
      for (const [filePath, content] of worktree.files) {
        if (baseByPath.get(filePath) !== content) changed.push(filePath);
      }
      if (options.extraWorktreePath) changed.push(options.extraWorktreePath);
      return changed;
    },

    async createCommit(branch, message) {
      if (options.failCommit) throw new Error("Controlled commit failure");
      const worktree = branches.get(branch);
      if (!worktree) throw new Error("Unknown executor branch");
      const serialized = JSON.stringify([...worktree.files.entries()].sort(([a], [b]) => a.localeCompare(b)));
      const commitSha = gitSha(`${branch}\n${message}\n${serialized}`);
      const snapshot = new Map(worktree.files);
      if (options.commitContentMismatchPath) {
        snapshot.set(
          options.commitContentMismatchPath,
          `${snapshot.get(options.commitContentMismatchPath) ?? ""}\n// controlled mismatch\n`
        );
      }
      commits.set(commitSha, {
        parentCommitShas: [
          options.commitParentMismatch
            ? "1111111111111111111111111111111111111111"
            : baseCommitSha,
        ],
        message: options.commitMessageMismatch ? `${message} altered` : message,
        files: snapshot,
      });
      mutations.push(`commit:${commitSha}:${message}`);
      return commitSha;
    },

    async inspectCommit(commitSha) {
      const commit = commits.get(commitSha);
      if (!commit) throw new Error("Unknown executor commit");
      return {
        parentCommitShas: [...commit.parentCommitShas],
        message: commit.message,
      };
    },

    async listCommitChangedFiles(commitSha, expectedBaseCommitSha) {
      const commit = commits.get(commitSha);
      if (!commit || expectedBaseCommitSha !== baseCommitSha) {
        throw new Error("Unknown executor commit");
      }
      const changed = [];
      for (const [filePath, content] of commit.files) {
        if (baseByPath.get(filePath) !== content) changed.push(filePath);
      }
      if (options.extraCommitPath) changed.push(options.extraCommitPath);
      return changed;
    },

    async readFileFromCommit(commitSha, filePath) {
      const commit = commits.get(commitSha);
      if (!commit) throw new Error("Unknown executor commit");
      const content = commit.files.get(filePath);
      if (content === undefined) throw new Error(`Unknown committed file: ${filePath}`);
      return content;
    },

    async runCheck(command, commitSha) {
      const result = {
        command,
        commitSha: options.checkCommitMismatch ? baseCommitSha : commitSha,
        conclusion: options.failedCheck === command ? "failure" : "success",
      };
      checks.push(result);
      mutations.push(`check:${command}:${result.commitSha}:${result.conclusion}`);
      return result;
    },

    async pushBranch(branch, commitSha, force) {
      if (force !== false) throw new Error("Executor attempted a force push");
      if (options.failPush) throw new Error("Controlled push failure");
      pushes.push({ branch, commitSha, force });
      mutations.push(`push:${branch}:${commitSha}:force=${force}`);
    },

    async createPullRequest(request) {
      if (options.failPullRequest) throw new Error("Controlled pull-request failure");
      const number = options.pullRequestNumberMismatch ? 0 : 57;
      const record = {
        number,
        url: options.pullRequestUrlMismatch
          ? "https://github.com/other/repository/pull/57"
          : `https://github.com/siricarsen-cmd/subshield/pull/${number}`,
        baseBranch: request.baseBranch,
        headBranch: request.headBranch,
        headCommitSha: request.headCommitSha,
        title: options.pullRequestTitleMismatch ? `${request.title} altered` : request.title,
        body: request.body,
        autoMergeEnabled: options.autoMergeMismatch ? true : request.autoMergeEnabled,
      };
      pullRequests.push(record);
      mutations.push(`pr:${record.number}:${record.headCommitSha}:autoMerge=${record.autoMergeEnabled}`);
      return record;
    },

    async readTrustedClock() {
      if (options.failTrustedClock) throw new Error("Controlled trusted-clock failure");
      return options.trustedTime ?? "2026-07-07T12:00:00.000Z";
    },
  };
}

const SOURCE_ID = "dfars-252-204-7025";
const MAPPING_ID = "qa-c-future-cmmc-by-notice";
const BASE_COMMIT = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const templateEntry = getRegisteredCitationTemplate(MAPPING_ID);
if (!templateEntry) throw new Error(`Missing citation template: ${MAPPING_ID}`);
const citation = templateEntry.value.citations.find(
  (candidate) => candidate.sourceId === SOURCE_ID
);
if (!citation) throw new Error(`Missing citation for ${SOURCE_ID}`);
const retained = getApprovedRegulatoryEvidenceSnapshot(SOURCE_ID, citation.snapshotId);
if (!retained) throw new Error(`Missing retained source fixture: ${citation.snapshotId}`);

const insertedSentence =
  "The offeror shall retain the independently reviewed executor notice before accepting the updated requirement.";
const changedText = retained.text.replace(
  citation.extractionEndAnchor,
  `${insertedSentence}\n${citation.extractionEndAnchor}`
);

const snapshotRoot = await mkdtemp(path.join(tmpdir(), "subshield-executor-snapshots-"));
const packetRoot = await mkdtemp(path.join(tmpdir(), "subshield-executor-packets-"));

try {
  const baseline = pendingClone(
    retained,
    `${SOURCE_ID}:executor-baseline`,
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
    `${SOURCE_ID}:executor-candidate`,
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
        "Reviewed the exact executor transition and retained official-source evidence.",
        "Authorized only a future explicit implementation pull request after fresh checks.",
      ],
      reviewedKinds: ["mapping", "historical-policy", "citation-template"],
      benchmarkValidation: {
        evidenceStatus: "reviewer-attested-not-machine-verified",
        repository: "siricarsen-cmd/subshield",
        commitSha: BASE_COMMIT,
        regulatoryWorkflowRunId: 43001,
        analyzerWorkflowRunId: 43002,
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
  const files = targetPaths.map((targetPath) => ({
    path: targetPath,
    content: execFileSync("git", ["show", `${BASE_COMMIT}:${targetPath}`], {
      encoding: "utf8",
    }),
  }));
  const bundle = buildRegulatoryImplementationPullRequestBundle(plan, files);
  const executionRequest = { executedBy: "Carsen controlled regulatory executor" };

  const successAdapter = createMemoryAdapter(BASE_COMMIT, files);
  const success = await executeRegulatoryImplementationPullRequest(
    plan,
    bundle,
    successAdapter,
    executionRequest
  );
  check(
    "a complete live plan and bundle create one exact review pull request",
    success.status === "success" && successAdapter.pullRequests.length === 1
  );
  check(
    "the success receipt is immutable, checksum-bound, and loses live status when cloned",
    success.status === "success" &&
      Object.isFrozen(success.receipt) &&
      success.receipt.executedAt === "2026-07-07T12:00:00.000Z" &&
      isLiveRegulatoryImplementationExecutionReceipt(success.receipt) &&
      !isLiveRegulatoryImplementationExecutionReceipt(structuredClone(success.receipt)) &&
      validateRegulatoryImplementationExecutionReceipt(success.receipt).length === 0
  );
  check(
    "all required checks are bound to the exact created commit",
    success.status === "success" &&
      success.receipt.checks.length === bundle.requiredChecks.length &&
      success.receipt.checks.every(
        (result) =>
          result.commitSha === success.receipt.commitSha && result.conclusion === "success"
      )
  );
  check(
    "the executor writes and commits only the exact authorized bundle files",
    success.status === "success" &&
      success.receipt.files.map((file) => file.path).sort().join("|") ===
        bundle.files.map((file) => file.path).sort().join("|")
  );
  check(
    "pull-request identity and metadata are exact and auto-merge remains disabled",
    success.status === "success" &&
      success.receipt.pullRequest.url ===
        `https://github.com/siricarsen-cmd/subshield/pull/${success.receipt.pullRequest.number}` &&
      success.receipt.pullRequest.title === bundle.pullRequestTitle &&
      success.receipt.pullRequest.headBranch === bundle.targetBranch &&
      success.receipt.pullRequest.autoMergeEnabled === false &&
      successAdapter.pushes.every((push) => push.force === false)
  );
  check(
    "the narrow adapter exposes no merge or deployment capability",
    !Object.keys(successAdapter).some((key) => /merge|deploy|release|secret|payment|database|email/i.test(key))
  );

  const repeat = await executeRegulatoryImplementationPullRequest(
    plan,
    bundle,
    createMemoryAdapter(BASE_COMMIT, files),
    executionRequest
  );
  check(
    "identical trusted inputs reproduce deterministic commit metadata and receipt",
    success.status === "success" &&
      repeat.status === "success" &&
      repeat.receipt.commitSha === success.receipt.commitSha &&
      repeat.receipt.receiptChecksum === success.receipt.receiptChecksum
  );

  for (const [label, candidatePlan, candidateBundle] of [
    ["a cloned plan cannot execute", structuredClone(plan), bundle],
    ["a cloned bundle cannot execute", plan, structuredClone(bundle)],
  ]) {
    const adapter = createMemoryAdapter(BASE_COMMIT, files);
    const result = await executeRegulatoryImplementationPullRequest(
      candidatePlan,
      candidateBundle,
      adapter,
      executionRequest
    );
    check(label, result.status === "preflight-refused" && adapter.mutations.length === 0);
  }

  for (const [label, options] of [
    ["a wrong repository is refused before mutation", { repositoryFullName: "other/repository" }],
    ["a wrong default branch is refused before mutation", { defaultBranch: "develop" }],
    ["a missing reviewed base is refused before mutation", { missingBase: true }],
    [
      "a mismatched reviewed base file is refused before mutation",
      { baseContentMismatchPath: bundle.files[0].path },
    ],
    ["an existing target branch is refused before mutation", { existingBranch: true }],
    ["an existing execution pull request is refused before mutation", { existingPullRequest: true }],
  ]) {
    const adapter = createMemoryAdapter(BASE_COMMIT, files, options);
    const result = await executeRegulatoryImplementationPullRequest(
      plan,
      bundle,
      adapter,
      executionRequest
    );
    check(label, result.status === "preflight-refused" && adapter.mutations.length === 0);
  }

  const extraWorktreeAdapter = createMemoryAdapter(BASE_COMMIT, files, {
    extraWorktreePath: "lib/analyzer/deterministic.ts",
  });
  const extraWorktree = await executeRegulatoryImplementationPullRequest(
    plan,
    bundle,
    extraWorktreeAdapter,
    executionRequest
  );
  check(
    "an unrelated worktree change is refused before commit",
    extraWorktree.status === "execution-failed" &&
      extraWorktree.stage === "worktree-verification" &&
      !extraWorktreeAdapter.mutations.some((item) => item.startsWith("commit:"))
  );

  for (const [label, options] of [
    ["a commit tree that differs from the bundle is refused", { commitContentMismatchPath: bundle.files[0].path }],
    ["a commit with the wrong parent is refused", { commitParentMismatch: true }],
    ["a commit with the wrong message is refused", { commitMessageMismatch: true }],
  ]) {
    const adapter = createMemoryAdapter(BASE_COMMIT, files, options);
    const result = await executeRegulatoryImplementationPullRequest(
      plan,
      bundle,
      adapter,
      executionRequest
    );
    check(
      label,
      result.status === "execution-failed" && result.stage === "commit-verification"
    );
  }

  const failedCheckAdapter = createMemoryAdapter(BASE_COMMIT, files, {
    failedCheck: bundle.requiredChecks[1],
  });
  const failedCheck = await executeRegulatoryImplementationPullRequest(
    plan,
    bundle,
    failedCheckAdapter,
    executionRequest
  );
  check(
    "a failed required check creates no push pull request or success receipt",
    failedCheck.status === "check-failed" &&
      failedCheckAdapter.pushes.length === 0 &&
      failedCheckAdapter.pullRequests.length === 0
  );

  const mismatchedCheckAdapter = createMemoryAdapter(BASE_COMMIT, files, {
    checkCommitMismatch: true,
  });
  const mismatchedCheck = await executeRegulatoryImplementationPullRequest(
    plan,
    bundle,
    mismatchedCheckAdapter,
    executionRequest
  );
  check(
    "a check result for a different commit is refused",
    mismatchedCheck.status === "check-failed" && mismatchedCheckAdapter.pushes.length === 0
  );

  const failedPushAdapter = createMemoryAdapter(BASE_COMMIT, files, { failPush: true });
  const failedPush = await executeRegulatoryImplementationPullRequest(
    plan,
    bundle,
    failedPushAdapter,
    executionRequest
  );
  check(
    "a push failure creates no pull request or success receipt",
    failedPush.status === "push-failed" && failedPushAdapter.pullRequests.length === 0
  );

  const failedPrAdapter = createMemoryAdapter(BASE_COMMIT, files, { failPullRequest: true });
  const failedPr = await executeRegulatoryImplementationPullRequest(
    plan,
    bundle,
    failedPrAdapter,
    executionRequest
  );
  check(
    "a pull-request failure is explicit and creates no successful receipt",
    failedPr.status === "pull-request-failed" && failedPrAdapter.pullRequests.length === 0
  );

  for (const [label, options] of [
    ["altered pull-request metadata is refused", { pullRequestTitleMismatch: true }],
    ["an enabled auto-merge flag is refused", { autoMergeMismatch: true }],
    ["a pull-request URL for another repository is refused", { pullRequestUrlMismatch: true }],
    ["an invalid pull-request number is refused", { pullRequestNumberMismatch: true }],
  ]) {
    const result = await executeRegulatoryImplementationPullRequest(
      plan,
      bundle,
      createMemoryAdapter(BASE_COMMIT, files, options),
      executionRequest
    );
    check(label, result.status === "pull-request-failed");
  }

  const clockFailure = await executeRegulatoryImplementationPullRequest(
    plan,
    bundle,
    createMemoryAdapter(BASE_COMMIT, files, { trustedTime: "not-an-instant" }),
    executionRequest
  );
  check(
    "an invalid trusted execution clock cannot create a live receipt",
    clockFailure.status === "receipt-failed"
  );
} finally {
  await rm(snapshotRoot, { recursive: true, force: true });
  await rm(packetRoot, { recursive: true, force: true });
}

if (failures > 0) {
  console.error(`\n${failures} of ${assertions} implementation-executor assertions failed.`);
  process.exit(1);
}

console.log(`\nAll ${assertions} implementation-executor assertions passed.`);
