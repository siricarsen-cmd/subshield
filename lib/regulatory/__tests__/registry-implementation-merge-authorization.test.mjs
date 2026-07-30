import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  chmod,
  mkdtemp,
  readFile,
  rm,
  stat,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { getApprovedRegulatoryEvidenceSnapshot } from "../approved-evidence-registry.ts";
import {
  buildRegulatoryImplementationMergeConfirmation,
  createRegulatoryImplementationMergeAuthorization,
  executeRegulatoryImplementationMerge,
  isLiveRegulatoryImplementationMergeAuthorization,
  validateRegulatoryImplementationMergeAuditRecord,
  validateRegulatoryImplementationMergeExecutionResult,
  validateRegulatoryImplementationMergeReceipt,
  regulatoryImplementationMergeAuthorizationTestSurface,
} from "../registry-implementation-merge-authorization.ts";
import {
  REGULATORY_MERGE_HOSTED_POLICY,
  regulatoryImplementationMergeProductionAdapterTestSurface,
} from "../registry-implementation-merge-production-adapter.ts";
import {
  executeRegulatoryImplementationPullRequest,
  isLiveRegulatoryImplementationExecutionReceipt,
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

function check(condition, message) {
  assertions += 1;
  assert.ok(condition, message);
}

function equal(actual, expected, message) {
  assertions += 1;
  assert.deepEqual(actual, expected, message);
}

async function rejects(callback, pattern, message) {
  assertions += 1;
  await assert.rejects(callback, pattern, message);
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
  next.provenanceNotes = ["Controlled implementation-merge fixture."];
  return next;
}

function approveSnapshot(snapshot, reviewedAt, anchors) {
  return reviewRegulatorySnapshot(snapshot, {
    decision: "approved",
    reviewedBy: "Morgan Ellis, independent source reviewer",
    reviewedAt,
    reviewNotes: ["Verified retained official-source text for merge planning."],
    requiredTextAnchors: anchors,
    verifiedVersionIdentifier: snapshot.versionIdentifier,
    verifiedEffectiveDate: snapshot.effectiveDate,
  });
}

function createExecutorAdapter(baseCommitSha, baseFiles) {
  const baseByPath = new Map(baseFiles.map((file) => [file.path, file.content]));
  const branches = new Map();
  const commits = new Map();
  const pullRequests = [];

  return {
    async inspectRepository() {
      return {
        repositoryFullName: "siricarsen-cmd/subshield",
        defaultBranch: "main",
      };
    },
    async commitExists(commitSha) {
      return commitSha === baseCommitSha;
    },
    async readFileAtCommit(commitSha, filePath) {
      if (commitSha !== baseCommitSha) throw new Error("unknown base");
      const content = baseByPath.get(filePath);
      if (content === undefined) throw new Error("unknown file");
      return content;
    },
    async branchExists(branch) {
      return branches.has(branch);
    },
    async findPullRequestByHead(branch) {
      return pullRequests.find((candidate) => candidate.headBranch === branch) ?? null;
    },
    async createBranch(branch, commitSha) {
      branches.set(branch, {
        baseCommitSha: commitSha,
        files: new Map(baseByPath),
      });
    },
    async writeFile(branch, filePath, content) {
      const worktree = branches.get(branch);
      if (!worktree) throw new Error("unknown branch");
      worktree.files.set(filePath, content);
    },
    async listChangedFiles(branch) {
      const worktree = branches.get(branch);
      if (!worktree) throw new Error("unknown branch");
      return [...worktree.files]
        .filter(([filePath, content]) => baseByPath.get(filePath) !== content)
        .map(([filePath]) => filePath);
    },
    async createCommit(branch, message) {
      const worktree = branches.get(branch);
      if (!worktree) throw new Error("unknown branch");
      const serialized = JSON.stringify(
        [...worktree.files.entries()].sort(([left], [right]) =>
          left.localeCompare(right)
        )
      );
      const commitSha = gitSha(`${branch}\n${message}\n${serialized}`);
      commits.set(commitSha, {
        parentCommitShas: [baseCommitSha],
        message,
        files: new Map(worktree.files),
      });
      return commitSha;
    },
    async inspectCommit(commitSha) {
      const commit = commits.get(commitSha);
      if (!commit) throw new Error("unknown commit");
      return {
        parentCommitShas: [...commit.parentCommitShas],
        message: commit.message,
      };
    },
    async listCommitChangedFiles(commitSha, expectedBaseCommitSha) {
      const commit = commits.get(commitSha);
      if (!commit || expectedBaseCommitSha !== baseCommitSha) {
        throw new Error("unknown commit");
      }
      return [...commit.files]
        .filter(([filePath, content]) => baseByPath.get(filePath) !== content)
        .map(([filePath]) => filePath);
    },
    async readFileFromCommit(commitSha, filePath) {
      const commit = commits.get(commitSha);
      if (!commit) throw new Error("unknown commit");
      const content = commit.files.get(filePath);
      if (content === undefined) throw new Error("unknown file");
      return content;
    },
    async runCheck(command, commitSha) {
      return { command, commitSha, conclusion: "success" };
    },
    async pushBranch(_branch, _commitSha, force) {
      if (force !== false) throw new Error("force push prohibited");
    },
    async createPullRequest(request) {
      const record = {
        number: 57,
        url: "https://github.com/siricarsen-cmd/subshield/pull/57",
        baseBranch: request.baseBranch,
        headBranch: request.headBranch,
        headCommitSha: request.headCommitSha,
        title: request.title,
        body: request.body,
        autoMergeEnabled: false,
      };
      pullRequests.push(record);
      return record;
    },
    async readTrustedClock() {
      return "2026-07-07T12:00:00.000Z";
    },
  };
}

function createClock(wallMs = Date.parse("2026-07-09T12:00:00.000Z")) {
  return {
    wallMs,
    monotonicNs: 0n,
    wallNow() {
      return this.wallMs;
    },
    monotonicNow() {
      return this.monotonicNs;
    },
  };
}

function createHostedSnapshot(plan, bundle, receipt, overrides = {}) {
  const base = {
    repositoryFullName: REGULATORY_MERGE_HOSTED_POLICY.repository,
    defaultBranch: REGULATORY_MERGE_HOSTED_POLICY.defaultBranch,
    deleteBranchOnMerge: false,
    viewerLogin: REGULATORY_MERGE_HOSTED_POLICY.operatorLogin,
    viewerPermission: "WRITE",
    number: receipt.pullRequest.number,
    url: receipt.pullRequest.url,
    state: "open",
    draft: false,
    autoMergeEnabled: false,
    merged: false,
    baseBranch: "main",
    baseSha: plan.baseCommitSha,
    remoteMainSha: plan.baseCommitSha,
    headBranch: plan.targetBranch,
    headSha: receipt.commitSha,
    headRefSha: receipt.commitSha,
    headParents: [plan.baseCommitSha],
    mergeCommitSha: null,
    files: bundle.files
      .map((file) => ({
        path: file.path,
        baseChecksum: file.beforeChecksum,
        headChecksum: file.afterChecksum,
      }))
      .sort((left, right) => left.path.localeCompare(right.path)),
    checks: [
      {
        workflowId: REGULATORY_MERGE_HOSTED_POLICY.workflowId,
        workflowName: REGULATORY_MERGE_HOSTED_POLICY.workflowName,
        workflowPath: REGULATORY_MERGE_HOSTED_POLICY.workflowPath,
        workflowRunId: 50001,
        attempt: 1,
        jobId: 60001,
        jobName: REGULATORY_MERGE_HOSTED_POLICY.jobName,
        event: REGULATORY_MERGE_HOSTED_POLICY.workflowEvent,
        headSha: receipt.commitSha,
        status: "completed",
        conclusion: "success",
        completedAt: "2026-07-08T12:00:00.000Z",
      },
    ],
    codexEvidence: {
      login: REGULATORY_MERGE_HOSTED_POLICY.codexLogin,
      accountId: REGULATORY_MERGE_HOSTED_POLICY.codexAccountId,
      reviewId: 70001,
      reviewState: REGULATORY_MERGE_HOSTED_POLICY.codexReviewState,
      reviewCommit: receipt.commitSha,
      reviewSubmittedAt: "2026-07-08T12:05:00.000Z",
      attestationCommentId: 80001,
      attestationCreatedAt: "2026-07-08T12:10:00.000Z",
      reviewedCommit: receipt.commitSha,
      clean: true,
    },
    unresolvedThreadCount: 0,
    paginationComplete: true,
    runtimeFingerprint: sha256("runtime"),
    configFingerprint: sha256("config"),
    repositoryFingerprint: sha256("repository"),
  };
  return { ...base, ...overrides };
}

function mergedSnapshot(snapshot, mergeCommitSha) {
  return {
    ...snapshot,
    state: "closed",
    merged: true,
    mergeCommitSha,
    remoteMainSha: mergeCommitSha,
  };
}

function createMergeAdapter(snapshot, options = {}) {
  const calls = [];
  const mergeCommitSha = options.mergeCommitSha ?? "f".repeat(40);
  let mergeRequested = false;
  let inspectCount = 0;
  return regulatoryImplementationMergeProductionAdapterTestSurface.registerAdapter({
    calls,
    async authenticate() {
      calls.push("authenticate");
      return {
        login: snapshot.viewerLogin,
        permission: snapshot.viewerPermission,
        runtimeFingerprint: snapshot.runtimeFingerprint,
        configFingerprint: snapshot.configFingerprint,
        repositoryFingerprint: snapshot.repositoryFingerprint,
      };
    },
    async inspectExactPullRequest() {
      calls.push("inspect");
      inspectCount += 1;
      if (!mergeRequested) return structuredClone(snapshot);
      if (options.postInspectionFailure) throw new Error("controlled");
      if (options.postSnapshot) return structuredClone(options.postSnapshot);
      if (options.mutationKind === "refused" && !options.alreadyMerged) {
        return structuredClone(snapshot);
      }
      return structuredClone(mergedSnapshot(snapshot, mergeCommitSha));
    },
    async requestExpectedHeadSquashMerge(prNumber, expectedHeadSha) {
      calls.push(`merge:${prNumber}:${expectedHeadSha}`);
      mergeRequested = true;
      if (options.mutationFailure) throw new Error("controlled");
      if (options.mutationKind === "refused") return { kind: "refused" };
      if (options.mutationKind === "ambiguous") return { kind: "ambiguous" };
      return {
        kind: "accepted",
        mergeCommitSha: options.returnedMergeCommitSha ?? mergeCommitSha,
      };
    },
    get inspectCount() {
      return inspectCount;
    },
  });
}

async function createAuthorization({
  plan,
  bundle,
  receipt,
  snapshot,
  clock,
  auditRoot,
  adapterOptions,
  confirmationOverride,
}) {
  const adapter = createMergeAdapter(snapshot, adapterOptions);
  const key = new Uint8Array(32).fill(7);
  const keyId = "regulatory-merge-hmac:primary";
  const confirmation =
    confirmationOverride ??
    buildRegulatoryImplementationMergeConfirmation(
      plan,
      bundle,
      receipt,
      snapshot,
      keyId
    );
  const result = await createRegulatoryImplementationMergeAuthorization(
    plan,
    bundle,
    receipt,
    {
      expectedGitHubLogin: "siricarsen-cmd",
      authorizedAt: new Date(clock.wallNow()).toISOString(),
      confirmation,
      auditDirectory: auditRoot,
      auditKeyId: keyId,
      auditKey: key,
      adapter,
      clock,
    }
  );
  return { result, adapter, key };
}

const SOURCE_ID = "dfars-252-204-7025";
const MAPPING_ID = "qa-c-future-cmmc-by-notice";
const BASE_COMMIT = execFileSync("git", ["rev-parse", "HEAD"], {
  encoding: "utf8",
}).trim();
const templateEntry = getRegisteredCitationTemplate(MAPPING_ID);
if (!templateEntry) throw new Error(`Missing citation template: ${MAPPING_ID}`);
const citation = templateEntry.value.citations.find(
  (candidate) => candidate.sourceId === SOURCE_ID
);
if (!citation) throw new Error(`Missing citation for ${SOURCE_ID}`);
const retained = getApprovedRegulatoryEvidenceSnapshot(
  SOURCE_ID,
  citation.snapshotId
);
if (!retained) throw new Error(`Missing retained source fixture: ${citation.snapshotId}`);

const insertedSentence =
  "The offeror shall retain the independently reviewed merge notice before accepting the updated requirement.";
const changedText = retained.text.replace(
  citation.extractionEndAnchor,
  `${insertedSentence}\n${citation.extractionEndAnchor}`
);

const snapshotRoot = await mkdtemp(
  path.join(tmpdir(), "subshield-merge-snapshots-")
);
const packetRoot = await mkdtemp(
  path.join(tmpdir(), "subshield-merge-packets-")
);
const auditRoots = [];

try {
  const baseline = pendingClone(
    retained,
    `${SOURCE_ID}:merge-baseline`,
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
    `${SOURCE_ID}:merge-candidate`,
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
  const pair = await loadVerifiedStoredRegulatoryUpdatePair(
    snapshotRoot,
    SOURCE_ID
  );
  const draft = buildVerifiedStoredRegulatoryChangeSetDraft(
    packet,
    pair,
    "SubShield regulatory change-control preparer",
    "2026-07-04T12:00:00.000Z"
  );
  const draftReceipt = reverifyStoredRegulatoryChangeSetDraft(
    draft,
    packet,
    pair
  );
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
        "Reviewed the exact merge transition and retained official-source evidence.",
        "Authorized only a future explicit implementation pull request after fresh checks.",
      ],
      reviewedKinds: ["mapping", "historical-policy", "citation-template"],
      benchmarkValidation: {
        evidenceStatus: "reviewer-attested-not-machine-verified",
        repository: "siricarsen-cmd/subshield",
        commitSha: BASE_COMMIT,
        regulatoryWorkflowRunId: 53001,
        analyzerWorkflowRunId: 53002,
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
  const baseFiles = targetPaths.map((targetPath) => ({
    path: targetPath,
    content: execFileSync("git", ["show", `${BASE_COMMIT}:${targetPath}`], {
      encoding: "utf8",
    }),
  }));
  const bundle = buildRegulatoryImplementationPullRequestBundle(
    plan,
    baseFiles
  );
  const executorResult = await executeRegulatoryImplementationPullRequest(
    plan,
    bundle,
    createExecutorAdapter(BASE_COMMIT, baseFiles),
    { executedBy: "Carsen controlled regulatory executor" }
  );
  check(executorResult.status === "success", "real executor fixture succeeds");
  if (executorResult.status !== "success") {
    throw new Error(JSON.stringify(executorResult));
  }
  const receipt = executorResult.receipt;
  check(
    isLiveRegulatoryImplementationExecutionReceipt(receipt),
    "executor produced the original live receipt"
  );

  async function newAuditRoot() {
    const root = await mkdtemp(path.join(tmpdir(), "subshield-merge-audit-"));
    await chmod(root, 0o700);
    auditRoots.push(root);
    return root;
  }

  const snapshot = createHostedSnapshot(plan, bundle, receipt);
  equal(
    regulatoryImplementationMergeAuthorizationTestSurface.validateRegulatoryMergeHostedSnapshot(
      snapshot,
      plan,
      bundle,
      receipt
    ),
    [],
    "complete hosted evidence validates"
  );

  const successClock = createClock();
  const successAuth = await createAuthorization({
    plan,
    bundle,
    receipt,
    snapshot,
    clock: successClock,
    auditRoot: await newAuditRoot(),
  });
  check(
    successAuth.result.status === "authorization-created",
    "original live plan, bundle, and receipt create authorization"
  );
  if (successAuth.result.status !== "authorization-created") {
    throw new Error(JSON.stringify(successAuth.result));
  }
  const authorization = successAuth.result.authorization;
  check(Object.isFrozen(authorization), "authorization is frozen");
  check(
    isLiveRegulatoryImplementationMergeAuthorization(authorization),
    "authorization is live before use"
  );
  const success = await executeRegulatoryImplementationMerge(
    plan,
    bundle,
    receipt,
    authorization
  );
  equal(success.status, "terminal", "merge returns a terminal result");
  if (success.status !== "terminal") throw new Error("terminal result required");
  equal(success.outcome.status, "merge-succeeded", "exact hosted merge succeeds");
  check(
    success.outcome.receipt &&
      validateRegulatoryImplementationMergeReceipt(success.outcome.receipt)
        .length === 0,
    "merge receipt validates"
  );
  equal(
    validateRegulatoryImplementationMergeAuditRecord(success.audit, successAuth.key),
    [],
    "HMAC audit validates"
  );
  equal(
    validateRegulatoryImplementationMergeExecutionResult(success, successAuth.key),
    [],
    "terminal result validates"
  );
  check(
    regulatoryImplementationMergeAuthorizationTestSurface.wasKeyZeroed(
      authorization
    ),
    "copied audit key is zeroed after terminal use"
  );
  check(
    successAuth.key.every((value) => value === 7),
    "caller audit key is not mutated"
  );
  check(
    !isLiveRegulatoryImplementationMergeAuthorization(authorization),
    "authorization is no longer live"
  );
  check(
    successAuth.adapter.calls.filter((value) => value.startsWith("merge:"))
      .length === 1,
    "one expected-head merge mutation occurs"
  );
  const auditInfo = await stat(success.auditPath);
  check((auditInfo.mode & 0o777) === 0o600, "audit file is private");
  const storedAudit = JSON.parse(await readFile(success.auditPath, "utf8"));
  equal(
    validateRegulatoryImplementationMergeAuditRecord(storedAudit, successAuth.key),
    [],
    "stored audit reproduces"
  );
  check(!JSON.stringify(storedAudit).includes("777777"), "audit excludes key bytes");
  equal(
    validateRegulatoryImplementationMergeAuditRecord(storedAudit),
    [],
    "audit structure validates without an HMAC key"
  );
  const rotatedAudit = structuredClone(storedAudit);
  rotatedAudit.keyId = "regulatory-merge-hmac:rotated";
  rotatedAudit.authentication.keyId = "regulatory-merge-hmac:rotated";
  check(
    validateRegulatoryImplementationMergeAuditRecord(rotatedAudit, successAuth.key)
      .includes("audit-relationship-invalid"),
    "audit key IDs remain bound to the authorization"
  );
  const malformedOutcomeResult = structuredClone(success);
  delete malformedOutcomeResult.outcome.authorizationId;
  check(
    validateRegulatoryImplementationMergeExecutionResult(
      malformedOutcomeResult,
      successAuth.key
    ).includes("outcome-shape-invalid"),
    "hosted outcomes require every exact field"
  );
  const fabricatedAdapter = { ...successAuth.adapter };
  const fabricated = await createRegulatoryImplementationMergeAuthorization(
    plan,
    bundle,
    receipt,
    {
      expectedGitHubLogin: "siricarsen-cmd",
      authorizedAt: new Date(successClock.wallNow()).toISOString(),
      confirmation: buildRegulatoryImplementationMergeConfirmation(
        plan,
        bundle,
        receipt,
        snapshot,
        "regulatory-merge-hmac:primary"
      ),
      auditDirectory: await newAuditRoot(),
      auditKeyId: "regulatory-merge-hmac:primary",
      auditKey: new Uint8Array(32).fill(7),
      adapter: fabricatedAdapter,
      clock: successClock,
    }
  );
  equal(
    fabricated.status,
    "authorization-refused",
    "structurally compatible fabricated adapters are refused"
  );

  const replay = await executeRegulatoryImplementationMerge(
    plan,
    bundle,
    receipt,
    authorization
  );
  equal(replay.status, "authorization-refused", "replay is refused");

  const clonedAuthorization = structuredClone(authorization);
  const clonedExecution = await executeRegulatoryImplementationMerge(
    plan,
    bundle,
    receipt,
    clonedAuthorization
  );
  equal(
    clonedExecution.status,
    "authorization-refused",
    "cloned authorization is never live"
  );

  for (const [label, candidatePlan, candidateBundle, candidateReceipt] of [
    ["cloned plan", structuredClone(plan), bundle, receipt],
    ["cloned bundle", plan, structuredClone(bundle), receipt],
    ["cloned receipt", plan, bundle, structuredClone(receipt)],
  ]) {
    const clock = createClock();
    const candidateSnapshot = createHostedSnapshot(
      candidatePlan,
      candidateBundle,
      candidateReceipt
    );
    const candidate = await createAuthorization({
      plan: candidatePlan,
      bundle: candidateBundle,
      receipt: candidateReceipt,
      snapshot: candidateSnapshot,
      clock,
      auditRoot: await newAuditRoot(),
    });
    equal(
      candidate.result.status,
      "authorization-refused",
      `${label} cannot authorize`
    );
  }

  const wrongConfirmation = await createAuthorization({
    plan,
    bundle,
    receipt,
    snapshot,
    clock: createClock(),
    auditRoot: await newAuditRoot(),
    confirmationOverride: "AUTHORIZE",
  });
  equal(
    wrongConfirmation.result.status,
    "authorization-refused",
    "caller-shaped confirmation is refused"
  );

  const driftCases = [
    ["repository", { repositoryFullName: "other/repository" }],
    ["permission", { viewerPermission: "READ" }],
    ["PR URL", { url: "https://github.com/other/repository/pull/57" }],
    ["draft", { draft: true }],
    ["auto merge", { autoMergeEnabled: true }],
    ["main drift", { remoteMainSha: "c".repeat(40) }],
    ["head drift", { headRefSha: "c".repeat(40) }],
    ["parent drift", { headParents: ["c".repeat(40)] }],
    ["files", { files: [] }],
    ["check missing", { checks: [] }],
    [
      "check wrong head",
      { checks: [{ ...snapshot.checks[0], headSha: "c".repeat(40) }] },
    ],
    [
      "check failed",
      { checks: [{ ...snapshot.checks[0], conclusion: "failure" }] },
    ],
    [
      "review stale",
      {
        codexEvidence: {
          ...snapshot.codexEvidence,
          reviewedCommit: "c".repeat(40),
        },
      },
    ],
    ["unresolved thread", { unresolvedThreadCount: 1 }],
    ["pagination", { paginationComplete: false }],
  ];
  for (const [label, override] of driftCases) {
    const drifted = { ...snapshot, ...override };
    const candidate = await createAuthorization({
      plan,
      bundle,
      receipt,
      snapshot: drifted,
      clock: createClock(),
      auditRoot: await newAuditRoot(),
    });
    equal(
      candidate.result.status,
      "authorization-refused",
      `${label} drift is refused`
    );
  }

  async function createTimedAuthorization(clock, adapterOptions = {}) {
    const timedSnapshot = createHostedSnapshot(plan, bundle, receipt);
    return createAuthorization({
      plan,
      bundle,
      receipt,
      snapshot: timedSnapshot,
      clock,
      auditRoot: await newAuditRoot(),
      adapterOptions,
    });
  }

  const boundaryClock = createClock();
  const boundaryAuth = await createTimedAuthorization(boundaryClock);
  if (boundaryAuth.result.status !== "authorization-created") {
    throw new Error("boundary authorization required");
  }
  boundaryClock.wallMs += 300_000;
  boundaryClock.monotonicNs += 300_000_000_000n;
  const boundaryResult = await executeRegulatoryImplementationMerge(
    plan,
    bundle,
    receipt,
    boundaryAuth.result.authorization
  );
  check(
    boundaryResult.status === "terminal" &&
      boundaryResult.outcome.status === "merge-succeeded",
    "exact five-minute boundary remains usable"
  );

  const expiredClock = createClock();
  const expiredAuth = await createTimedAuthorization(expiredClock);
  if (expiredAuth.result.status !== "authorization-created") {
    throw new Error("expired authorization fixture required");
  }
  expiredClock.wallMs += 300_001;
  expiredClock.monotonicNs += 300_001_000_000n;
  const expiredResult = await executeRegulatoryImplementationMerge(
    plan,
    bundle,
    receipt,
    expiredAuth.result.authorization
  );
  check(
    expiredResult.status === "terminal" &&
      expiredResult.outcome.code === "authorization-expired",
    "authorization expires after five monotonic minutes"
  );
  check(
    !expiredAuth.adapter.calls.some((value) => value.startsWith("merge:")),
    "expired authorization mutates nothing"
  );

  const backwardClock = createClock();
  const backwardAuth = await createTimedAuthorization(backwardClock);
  if (backwardAuth.result.status !== "authorization-created") {
    throw new Error("backward-clock fixture required");
  }
  backwardClock.monotonicNs = -1n;
  const backwardResult = await executeRegulatoryImplementationMerge(
    plan,
    bundle,
    receipt,
    backwardAuth.result.authorization
  );
  check(
    backwardResult.status === "terminal" &&
      backwardResult.outcome.code === "monotonic-clock-moved-backward",
    "backward monotonic clock terminally invalidates"
  );

  const futureClock = createClock();
  const futureSnapshot = createHostedSnapshot(plan, bundle, receipt);
  const futureAdapter = createMergeAdapter(futureSnapshot);
  const futureKey = new Uint8Array(32).fill(9);
  const futureKeyId = "regulatory-merge-hmac:future";
  const futureConfirmation = buildRegulatoryImplementationMergeConfirmation(
    plan,
    bundle,
    receipt,
    futureSnapshot,
    futureKeyId
  );
  const futureAuthorization = await createRegulatoryImplementationMergeAuthorization(
    plan,
    bundle,
    receipt,
    {
      expectedGitHubLogin: "siricarsen-cmd",
      authorizedAt: new Date(futureClock.wallNow() + 300_000).toISOString(),
      confirmation: futureConfirmation,
      auditDirectory: await newAuditRoot(),
      auditKeyId: futureKeyId,
      auditKey: futureKey,
      adapter: futureAdapter,
      clock: futureClock,
    }
  );
  if (futureAuthorization.status !== "authorization-created") {
    throw new Error("future-skew fixture required");
  }
  futureClock.wallMs += 300_001;
  futureClock.monotonicNs += 300_001_000_000n;
  const futureResult = await executeRegulatoryImplementationMerge(
    plan,
    bundle,
    receipt,
    futureAuthorization.authorization
  );
  check(
    futureResult.status === "terminal" &&
      futureResult.outcome.code === "authorization-expired",
    "future wall skew never extends monotonic authority"
  );

  for (const [label, adapterOptions, expectedStatus] of [
    [
      "deterministic refusal",
      { mutationKind: "refused" },
      "github-deterministic-refusal",
    ],
    [
      "already merged race",
      { mutationKind: "refused", alreadyMerged: true },
      "already-merged-exact",
    ],
    [
      "ambiguous response verified by hosted state",
      { mutationKind: "ambiguous" },
      "merge-succeeded",
    ],
    [
      "accepted response with mismatched merge SHA",
      {
        returnedMergeCommitSha: "e".repeat(40),
        mergeCommitSha: "f".repeat(40),
      },
      "ambiguous-hosted-mutation",
    ],
    [
      "postmerge inspection failure",
      { postInspectionFailure: true },
      "ambiguous-hosted-mutation",
    ],
  ]) {
    const clock = createClock();
    const candidate = await createTimedAuthorization(clock, adapterOptions);
    if (candidate.result.status !== "authorization-created") {
      throw new Error(`${label} authorization required`);
    }
    const terminal = await executeRegulatoryImplementationMerge(
      plan,
      bundle,
      receipt,
      candidate.result.authorization
    );
    check(
      terminal.status === "terminal" &&
        terminal.outcome.status === expectedStatus,
      label
    );
    check(
      candidate.adapter.calls.filter((value) => value.startsWith("merge:"))
        .length === 1,
      `${label} never retries`
    );
  }

  const retentionRoot = await newAuditRoot();
  const retentionClock = createClock();
  const retentionAuth = await createAuthorization({
    plan,
    bundle,
    receipt,
    snapshot,
    clock: retentionClock,
    auditRoot: retentionRoot,
  });
  if (retentionAuth.result.status !== "authorization-created") {
    throw new Error("retention fixture required");
  }
  await chmod(retentionRoot, 0o755);
  const retentionResult = await executeRegulatoryImplementationMerge(
    plan,
    bundle,
    receipt,
    retentionAuth.result.authorization
  );
  check(
    retentionResult.status === "terminal" &&
      retentionResult.outcome.status === "merge-succeeded" &&
      retentionResult.auditRetention === "failed",
    "known hosted success is preserved when audit retention fails"
  );

  const tamperedAudit = structuredClone(success.audit);
  tamperedAudit.outcome.code = "tampered";
  check(
    validateRegulatoryImplementationMergeAuditRecord(
      tamperedAudit,
      successAuth.key
    ).length > 0,
    "audit tampering is detected"
  );

  const cycle = {};
  cycle.self = cycle;
  const accessor = {};
  Object.defineProperty(accessor, "secret", {
    enumerable: true,
    get() {
      throw new Error("must not run");
    },
  });
  for (const value of [
    cycle,
    accessor,
    { value: 1n },
    { value: Number.NaN },
    { value: undefined },
  ]) {
    assert.throws(
      () =>
        regulatoryImplementationMergeAuthorizationTestSurface.sha256Canonical(
          value
        ),
      /Noncanonical value/
    );
    assertions += 1;
  }

  check(Object.isFrozen(success), "terminal result is frozen");
  check(Object.isFrozen(success.audit), "audit record is frozen");
  check(Object.isFrozen(success.outcome), "hosted outcome is frozen");
} finally {
  await rm(snapshotRoot, { recursive: true, force: true });
  await rm(packetRoot, { recursive: true, force: true });
  for (const root of auditRoots) {
    await chmod(root, 0o700).catch(() => undefined);
    await rm(root, { recursive: true, force: true });
  }
}

console.log(
  `registry implementation merge authorization: ${assertions} behavioral assertions passed`
);
