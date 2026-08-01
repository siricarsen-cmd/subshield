import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  chmod,
  mkdtemp,
  mkdir,
  readFile,
  rm,
  stat,
  writeFile,
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
  validateRegulatoryImplementationMergeAuthorization,
  validateRegulatoryImplementationMergeExecutionResult,
  validateRegulatoryImplementationMergeReceipt,
  regulatoryImplementationMergeAuthorizationTestSurface,
} from "../registry-implementation-merge-authorization.ts";
import {
  createRegulatoryImplementationMergeProductionAdapter,
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

function isAtomicMergeCall(call) {
  return Boolean(
    call.tool === "gh" &&
      call.argv.includes("graphql") &&
      call.argv.some((value) => value.includes("updateRefs"))
  );
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

const GIT_SCRIPT = String.raw`#!__NODE__
const fs = require("node:fs");
const statePath = __STATE__;
const lockPath = statePath + ".lock";
while (true) {
  try { fs.mkdirSync(lockPath); break; }
  catch { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 5); }
}
const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
state.calls.push({ tool: "git", argv: process.argv.slice(2), cwd: process.cwd(), env: { PATH: process.env.PATH, GH_CONFIG_DIR: process.env.GH_CONFIG_DIR, GIT_TERMINAL_PROMPT: process.env.GIT_TERMINAL_PROMPT } });
fs.writeFileSync(statePath, JSON.stringify(state));
fs.rmdirSync(lockPath);
const args = process.argv.slice(2);
if (args.includes("rev-parse") && args.includes("--show-toplevel")) {
  process.stdout.write(state.repositoryRoot + "\n");
} else if (args.includes("config") && args.includes("remote.origin.url")) {
  process.stdout.write("https://github.com/siricarsen-cmd/subshield.git\n");
} else {
  process.stderr.write("unexpected git invocation");
  process.exit(2);
}
`;

const GH_SCRIPT = String.raw`#!__NODE__
const fs = require("node:fs");
const statePath = __STATE__;
const lockPath = statePath + ".lock";
while (true) {
  try { fs.mkdirSync(lockPath); break; }
  catch { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 5); }
}
const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
const args = process.argv.slice(2);
state.calls.push({ tool: "gh", argv: args, cwd: process.cwd(), env: { PATH: process.env.PATH, GH_CONFIG_DIR: process.env.GH_CONFIG_DIR, GIT_TERMINAL_PROMPT: process.env.GIT_TERMINAL_PROMPT } });
const save = () => { fs.writeFileSync(statePath, JSON.stringify(state)); fs.rmdirSync(lockPath); };
const output = value => { save(); process.stdout.write(JSON.stringify(value)); process.exit(0); };
const fail = message => { save(); process.stderr.write(message); process.exit(1); };
if (args[0] !== "api") fail("unexpected command");
const api = args.slice(1);
const endpoint = api.find(value => typeof value === "string" && (value.startsWith("repos/") || value === "user" || value === "graphql"));
if (state.failUser && endpoint === "user") fail("SUPER-SECRET-TOKEN");
if (endpoint === "user") output({ login: "siricarsen-cmd" });
if (endpoint === "repos/siricarsen-cmd/subshield" && !api.includes("--method")) output({
  full_name: state.repositoryFullName || "siricarsen-cmd/subshield",
  node_id: state.repositoryNodeId,
  default_branch: state.defaultBranch || "main",
  delete_branch_on_merge: state.deleteBranchOnMerge === true,
  allow_squash_merge: true,
  allow_merge_commit: true,
  allow_rebase_merge: true,
  permissions: { admin: false, maintain: false, push: state.viewerPermission !== "READ" }
});
if (endpoint === "graphql") {
  const query = api.find(value => value.startsWith("query="))?.slice(6) ?? "";
  if (query.includes("updateRefs")) {
    const expectedMain = "name:\"refs/heads/main\",beforeOid:\"" + state.baseSha + "\",afterOid:\"" + state.headSha + "\",force:false";
    const expectedHead = "name:\"refs/heads/" + state.headBranch + "\",beforeOid:\"" + state.headSha + "\",afterOid:\"" + state.headSha + "\",force:false";
    if (!query.includes("repositoryId:\"" + state.repositoryNodeId + "\"") || !query.includes(expectedMain) || !query.includes(expectedHead)) {
      fail("wrong atomic ref guard");
    }
    if (state.atomicMainDrift) state.mainSha = state.otherSha;
    if (state.atomicHeadDrift) state.headRefSha = state.otherSha;
    if (state.failMerge) {
      if (state.ambiguousAccepted) { state.mainSha = state.headSha; state.merged = true; state.mergeSha = state.headSha; }
      fail("uncertain transport");
    }
    if (state.mergeRefused) {
      if (state.alreadyMerged) {
        const raceSha = state.concurrentSquash ? state.otherSha : state.headSha;
        state.mainSha = raceSha;
        state.merged = true;
        state.mergeSha = raceSha;
      }
      output({ errors: [{ type: "STALE_DATA", message: "refused" }] });
    }
    if (state.mainSha !== state.baseSha || state.headRefSha !== state.headSha) {
      output({ errors: [{ type: "STALE_DATA", message: "beforeOid mismatch" }] });
    }
    state.mainSha = state.headSha;
    state.merged = true;
    state.mergeSha = state.headSha;
    output({ data: { updateRefs: { clientMutationId: null } } });
  }
  const after = api.find(value => value.startsWith("after="))?.slice(6) ?? "";
  if (!after) output({
    data: { repository: { pullRequest: { reviewThreads: {
      nodes: [{ isResolved: !state.unresolvedThread }],
      pageInfo: { hasNextPage: true, endCursor: state.missingThreadCursor ? null : "cursor-1" }
    } } } }
  });
  output({
    data: { repository: { pullRequest: { reviewThreads: {
      nodes: [{ isResolved: true }],
      pageInfo: { hasNextPage: false, endCursor: null }
    } } } }
  });
}
if (api.includes("--paginate") && api.includes("--slurp")) {
  if (endpoint.includes("/files?")) {
    output([state.files.map(file => ({ filename: file.path }))]);
  }
  if (endpoint.includes("/actions/workflows/")) {
    if (state.emptyPagination) output([]);
    const accuracy = endpoint.includes("320319820");
    const run = {
      id: accuracy ? 9002 : 9001,
      workflow_id: accuracy ? 320319820 : 320336946,
      name: accuracy ? "Analyzer Accuracy Benchmarks" : "Regulatory Grounding Foundation",
      path: accuracy ? ".github/workflows/analyzer-accuracy.yml" : ".github/workflows/regulatory-grounding.yml",
      event: "pull_request",
      head_sha: state.wrongCheckHeadId === (accuracy ? 320319820 : 320336946) ? state.otherSha : state.headSha,
      run_attempt: 2,
      pull_requests: [{ number: state.foreignWorkflowPr ? 99 : 57, base: { ref: state.wrongWorkflowBase ? "develop" : "main", repo: { full_name: "siricarsen-cmd/subshield" } }, head: { ref: state.wrongWorkflowHead ? "foreign" : state.headBranch, repo: { full_name: state.forkedWorkflow ? "foreign/subshield" : "siricarsen-cmd/subshield" } } }]
    };
    if (state.missingWorkflowId === run.workflow_id) output([{ workflow_runs: [] }]);
    output(state.duplicateWorkflowId === run.workflow_id || state.duplicateWorkflow === true ? [{ workflow_runs: [run, { ...run, id: run.id + 100 }] }] : [{ workflow_runs: [run] }]);
  }
  if (endpoint.includes("/attempts/2/jobs?")) {
    const accuracy = endpoint.includes("/runs/9002/");
    output([{ jobs: [{
      id: accuracy ? 9102 : 9101,
      name: accuracy ? "QA-B / QA-C / QA-D / QA-E1" : "Official sources / types / analyzer regression",
      status: state.pendingWorkflowId === (accuracy ? 320319820 : 320336946) ? "in_progress" : "completed",
      conclusion: state.failedWorkflowId === (accuracy ? 320319820 : 320336946) || state.failedJob ? "failure" : "success",
      completed_at: "2026-07-08T12:00:00.000Z"
    }] }]);
  }
  if (endpoint.includes("/reviews?")) {
    output([
      [],
      [{
        id: 9201,
        state: "COMMENTED",
        commit_id: state.staleReview ? state.otherSha : state.headSha,
        submitted_at: "2026-07-08T12:05:00.000Z",
        user: { id: 199175422, login: "chatgpt-codex-connector[bot]" }
      }]
    ]);
  }
  if (endpoint.includes("/issues/57/comments?")) {
    const clean = {
      id: 9301,
      body: "Codex Review: Didn't find any major issues. Bravo.\n\nReviewed commit: " + state.headSha,
      created_at: "2026-07-08T12:10:00.000Z",
      user: { id: 199175422, login: "chatgpt-codex-connector[bot]" }
    };
    const later = {
      id: 9302,
      body: "P1 security finding remains unresolved",
      created_at: "2026-07-08T12:11:00.000Z",
      user: { id: 199175422, login: "chatgpt-codex-connector[bot]" }
    };
    output(state.missingCleanComment ? [[], []] : state.laterFinding ? [[clean], [later]] : [[], [clean]]);
  }
  if (endpoint.includes("/pulls/57/commits?")) {
    output([[{ sha: state.otherSha }], [{ sha: state.headSha }]]);
  }
}
if (endpoint === "repos/siricarsen-cmd/subshield/pulls/57") {
  if (state.postInspectionFailure && state.merged) fail("post inspection unavailable");
  output({
    number: 57,
    html_url: state.prUrl || "https://github.com/siricarsen-cmd/subshield/pull/57",
    state: state.closed || state.merged ? "closed" : "open",
    draft: state.draft === true,
    auto_merge: state.autoMerge ? {} : null,
    merged: state.merged,
    merge_commit_sha: state.merged ? state.mergeSha : null,
    base: { ref: state.baseBranch || "main", sha: state.baseSha },
    head: { ref: state.headBranch, sha: state.headSha }
  });
}
if (endpoint === "repos/siricarsen-cmd/subshield/git/ref/heads/main") {
  output({ object: { sha: state.mainSha } });
}
if (endpoint === "repos/siricarsen-cmd/subshield/git/ref/heads/" + encodeURIComponent(state.headBranch)) {
  output({ object: { sha: state.headRefSha } });
}
if (endpoint === "repos/siricarsen-cmd/subshield/commits/" + state.headSha) {
  output({ parents: [{ sha: state.wrongMergeParent && state.merged ? state.otherSha : (state.parentSha || state.baseSha) }], commit: { tree: { sha: state.wrongMergeTree && state.merged ? state.otherSha : (state.headTreeSha || "c".repeat(40)) } } });
}
if (endpoint === "repos/siricarsen-cmd/subshield/commits/" + state.mergeSha) {
  output({ parents: [{ sha: state.wrongMergeParent ? state.otherSha : state.baseSha }], commit: { tree: { sha: state.wrongMergeTree ? state.otherSha : (state.headTreeSha || "c".repeat(40)) } } });
}
if (endpoint?.startsWith("repos/siricarsen-cmd/subshield/contents/")) {
  const queryIndex = endpoint.indexOf("?ref=");
  const encodedPath = endpoint.slice("repos/siricarsen-cmd/subshield/contents/".length, queryIndex);
  const commit = endpoint.slice(queryIndex + 5);
  const filePath = encodedPath.split("/").map(decodeURIComponent).join("/");
  const file = state.files.find(candidate => candidate.path === filePath);
  if (!file) fail("unknown file");
  const content = commit === state.baseSha ? file.base : commit === state.headSha ? file.head : null;
  if (content === null) fail("unknown commit");
  output({ type: "file", encoding: "base64", content: Buffer.from(content).toString("base64") });
}
fail("unhandled gh invocation: " + api.join(" "));
`;

async function createMergeRuntime(overrides = {}) {
  const root = await mkdtemp(path.join(tmpdir(), "subshield-merge-adapter-"));
  const repositoryRoot = path.join(root, "repository");
  const githubCliConfigDir = path.join(root, "gh-config");
  const gitExecutable = path.join(root, "git-fixture");
  const githubCliExecutable = path.join(root, "gh-fixture");
  const statePath = path.join(root, "state.json");
  await mkdir(repositoryRoot, { mode: 0o700 });
  await mkdir(githubCliConfigDir, { mode: 0o700 });
  await writeFile(path.join(githubCliConfigDir, "hosts.yml"), "github.com: protected\n", { mode: 0o600 });
  const state = {
    repositoryRoot,
    calls: [],
    baseSha: "a".repeat(40),
    mainSha: "a".repeat(40),
    headSha: "b".repeat(40),
    headRefSha: "b".repeat(40),
    otherSha: "c".repeat(40),
    mergeSha: "b".repeat(40),
    repositoryNodeId: "R_kgDOATOMICTEST",
    headBranch: "regulatory-update/test-source/123456789abc",
    merged: false,
    files: [
      {
        path: "lib/regulatory/benchmark-applicability-mappings.ts",
        base: "export const value = 1;\n",
        head: "export const value = 2;\n",
      },
      {
        path: "lib/regulatory/historical-grounding-policy.ts",
        base: "export const policy = 1;\n",
        head: "export const policy = 2;\n",
      },
    ],
    ...overrides,
  };
  await writeFile(statePath, JSON.stringify(state), { mode: 0o600 });
  const node = process.execPath.replaceAll("\\", "\\\\");
  const stateLiteral = JSON.stringify(statePath);
  await writeFile(
    gitExecutable,
    GIT_SCRIPT.replace("__NODE__", node).replace("__STATE__", stateLiteral),
    { mode: 0o700 }
  );
  await writeFile(
    githubCliExecutable,
    GH_SCRIPT.replace("__NODE__", node).replace("__STATE__", stateLiteral),
    { mode: 0o700 }
  );
  await chmod(gitExecutable, 0o700);
  await chmod(githubCliExecutable, 0o700);

  return {
    root,
    repositoryRoot,
    githubCliConfigDir,
    gitExecutable,
    githubCliExecutable,
    statePath,
    async state() {
      return JSON.parse(await readFile(statePath, "utf8"));
    },
    async cleanup() {
      await rm(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 20 });
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

// The isolated test runner temporarily replaces the process clock primitives.
// Production has no request field, registration function, or environment switch
// capable of selecting these values.
const originalDateNow = Date.now;
const originalMonotonicNow = process.hrtime.bigint;
let activeClock = createClock();
Date.now = () => activeClock.wallNow();
process.hrtime.bigint = () => activeClock.monotonicNow();

function createHostedSnapshot(plan, bundle, receipt, overrides = {}) {
  const base = {
    repositoryFullName: REGULATORY_MERGE_HOSTED_POLICY.repository,
    repositoryNodeId: "R_kgDOATOMICTEST",
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
    squashMergeAllowed: true,
    mergeCommitAllowed: true,
    rebaseMergeAllowed: true,
    reviewedHeadTreeSha: "c".repeat(40),
    mergeCommitParents: [],
    mergeCommitTreeSha: null,
    files: bundle.files
      .map((file) => ({
        path: file.path,
        baseChecksum: file.beforeChecksum,
        headChecksum: file.afterChecksum,
      }))
      .sort((left, right) => left.path.localeCompare(right.path)),
    checks: REGULATORY_MERGE_HOSTED_POLICY.workflows.map((workflow, index) => ({
      workflowId: workflow.workflowId,
      workflowName: workflow.workflowName,
      workflowPath: workflow.workflowPath,
      workflowRunId: 50001 + index,
      attempt: 1,
      jobId: 60001 + index,
      jobName: workflow.jobName,
      event: REGULATORY_MERGE_HOSTED_POLICY.workflowEvent,
      headSha: receipt.commitSha,
      status: "completed",
      conclusion: "success",
      completedAt: "2026-07-08T12:00:00.000Z",
      pullRequestNumber: receipt.pullRequest.number,
      baseRef: "main",
      baseRepository: REGULATORY_MERGE_HOSTED_POLICY.repository,
      headRef: plan.targetBranch,
      headRepository: REGULATORY_MERGE_HOSTED_POLICY.repository,
    })),
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
    mergeCommitParents: [snapshot.baseSha],
    mergeCommitTreeSha: snapshot.reviewedHeadTreeSha,
  };
}

async function createMergeAdapter(snapshot, options = {}) {
  const hostedPaths = new Set(snapshot.files.map((file) => file.path));
  const files = options.bundle.files.filter((file) => hostedPaths.has(file.path)).map((file) => ({
    path: file.path,
    base: execFileSync("git", ["show", `${options.plan.baseCommitSha}:${file.path}`], { encoding: "utf8" }),
    head: file.content,
  }));
  const runtime = await createMergeRuntime({
    baseSha: snapshot.baseSha,
    headSha: snapshot.headSha,
    mergeSha: options.mergeCommitSha ?? snapshot.headSha,
    mainSha: snapshot.remoteMainSha,
    headRefSha: snapshot.headRefSha,
    repositoryNodeId: snapshot.repositoryNodeId,
    headBranch: snapshot.headBranch,
    files,
    snapshotOverrides: snapshot,
    mergeRefused: options.mutationKind === "refused",
    alreadyMerged: options.alreadyMerged === true,
    concurrentSquash: options.concurrentSquash === true,
    failMerge: options.mutationFailure || options.mutationKind === "ambiguous",
    ambiguousAccepted: options.mutationKind === "ambiguous",
    postInspectionFailure: options.postInspectionFailure === true,
    returnedMergeSha: options.returnedMergeCommitSha,
    atomicMainDrift: options.atomicMainDrift === true,
    atomicHeadDrift: options.atomicHeadDrift === true,
    repositoryFullName: snapshot.repositoryFullName,
    defaultBranch: snapshot.defaultBranch,
    viewerPermission: snapshot.viewerPermission,
    deleteBranchOnMerge: snapshot.deleteBranchOnMerge !== false,
    prUrl: snapshot.url,
    draft: snapshot.draft,
    autoMerge: snapshot.autoMergeEnabled,
    closed: snapshot.state !== "open",
    remoteMainSha: snapshot.remoteMainSha,
    headRefSha: snapshot.headRefSha,
    parentSha: snapshot.headParents[0],
    unresolvedThread: snapshot.unresolvedThreadCount > 0,
    emptyPagination: snapshot.paginationComplete !== true,
    staleReview: snapshot.codexEvidence.reviewedCommit !== snapshot.headSha,
    missingWorkflowId: snapshot.checks.length < 2
      ? REGULATORY_MERGE_HOSTED_POLICY.workflows.find(
          (policy) => !snapshot.checks.some((check) => check.workflowId === policy.workflowId)
        )?.workflowId
      : undefined,
    wrongCheckHeadId: snapshot.checks.find((check) => check.headSha !== snapshot.headSha)?.workflowId,
    failedWorkflowId: snapshot.checks.find((check) => check.conclusion !== "success")?.workflowId,
  });
  mergeRuntimes.push(runtime);
  const adapter = await createRegulatoryImplementationMergeProductionAdapter({
    repositoryRoot: runtime.repositoryRoot,
    gitExecutable: runtime.gitExecutable,
    githubCliExecutable: runtime.githubCliExecutable,
    githubCliConfigDir: runtime.githubCliConfigDir,
  });
  return { adapter, runtime };
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
  activeClock = clock;
  const { adapter, runtime } = await createMergeAdapter(snapshot, {
    ...adapterOptions, plan, bundle,
  });
  const key = new Uint8Array(32).fill(7);
  const keyId = "regulatory-merge-hmac:primary";
  let inspectedSnapshot;
  try {
    inspectedSnapshot = await adapter.inspectExactPullRequest(receipt.pullRequest.number);
  } catch (error) {
    void error;
    return {
      result: { status: "authorization-refused", errors: ["hosted-evidence-refused"] },
      adapter, runtime, key,
    };
  }
  const confirmation =
    confirmationOverride ??
    buildRegulatoryImplementationMergeConfirmation(
      plan, bundle, receipt, inspectedSnapshot, keyId
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
    }
  );
  return { result, adapter, runtime, key };
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
const mergeRuntimes = [];

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
  if (successAuth.result.status !== "authorization-created") {
    throw new Error(JSON.stringify(successAuth.result));
  }
  check(
    successAuth.result.status === "authorization-created",
    "original live plan, bundle, and receipt create authorization"
  );
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
    (await successAuth.runtime.state()).calls.filter(
      isAtomicMergeCall
    ).length === 1,
    "one atomic reviewed-base/head mutation occurs"
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
  const missingRetention = structuredClone(success);
  delete missingRetention.auditRetention;
  check(
    validateRegulatoryImplementationMergeExecutionResult(missingRetention).includes(
      "result-shape-invalid"
    ),
    "terminal results require an exact audit-retention shape"
  );
  const secretAuthentication = structuredClone(success.audit);
  secretAuthentication.authentication.secret = "must-not-be-accepted";
  check(
    validateRegulatoryImplementationMergeAuditRecord(secretAuthentication).includes(
      "audit-authentication-shape-invalid"
    ),
    "authentication rejects extra secret-bearing fields"
  );
  for (const [field, value] of [
    ["receiptId", 7],
    ["planId", null],
    ["pullRequestNumber", -1],
    ["pullRequestUrl", "https://example.invalid/pull/57"],
  ]) {
    const malformedReceipt = structuredClone(success.outcome.receipt);
    malformedReceipt[field] = value;
    check(
      validateRegulatoryImplementationMergeReceipt(malformedReceipt).length > 0,
      `receipt rejects malformed ${field}`
    );
  }
  check(
    !("registerAdapter" in regulatoryImplementationMergeProductionAdapterTestSurface),
    "no exported registration seam can grant adapter authority"
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
    !(await expiredAuth.runtime.state()).calls.some(
      isAtomicMergeCall
    ),
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
  const { adapter: futureAdapter, runtime: futureRuntime } = await createMergeAdapter(
    futureSnapshot, { plan, bundle }
  );
  const futureKey = new Uint8Array(32).fill(9);
  const futureKeyId = "regulatory-merge-hmac:future";
  const inspectedFutureSnapshot = await futureAdapter.inspectExactPullRequest(
    receipt.pullRequest.number
  );
  const futureConfirmation = buildRegulatoryImplementationMergeConfirmation(
    plan,
    bundle,
    receipt,
    inspectedFutureSnapshot,
    futureKeyId
  );
  activeClock = futureClock;
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
      "concurrent squash race",
      { mutationKind: "refused", alreadyMerged: true, concurrentSquash: true },
      "ambiguous-hosted-mutation",
    ],
    [
      "ambiguous response verified by hosted state",
      { mutationKind: "ambiguous" },
      "merge-succeeded",
    ],
    [
      "atomic reviewed-base drift refusal",
      { atomicMainDrift: true },
      "github-deterministic-refusal",
    ],
    [
      "atomic reviewed-head drift refusal",
      { atomicHeadDrift: true },
      "github-deterministic-refusal",
    ],
    [
      "atomic reviewed-base and head drift refusal",
      { atomicMainDrift: true, atomicHeadDrift: true },
      "github-deterministic-refusal",
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
      (await candidate.runtime.state()).calls.filter(
        isAtomicMergeCall
      ).length === 1,
      `${label} never retries`
    );
    if (label === "concurrent squash race") {
      check(
        terminal.status === "terminal" &&
          terminal.outcome.status === "ambiguous-hosted-mutation" &&
          terminal.outcome.receipt === undefined,
        "concurrent squash race emits no success receipt"
      );
    }
  }

  for (const label of [
    "expiry after delayed authentication refuses immediately before mutation",
    "expiry after delayed inspection refuses immediately before mutation",
  ]) {
    let monotonicReads = 0;
    const delayedClock = createClock();
    delayedClock.monotonicNow = () => {
      monotonicReads += 1;
      return monotonicReads >= 3
        ? regulatoryImplementationMergeAuthorizationTestSurface.fiveMinutesNs + 1n
        : 0n;
    };
    const delayed = await createTimedAuthorization(delayedClock);
    if (delayed.result.status !== "authorization-created") {
      throw new Error("delayed freshness fixture required");
    }
    const delayedResult = await executeRegulatoryImplementationMerge(
      plan,
      bundle,
      receipt,
      delayed.result.authorization
    );
    check(
      delayedResult.status === "terminal" &&
        delayedResult.outcome.status === "merge-refused-before-consumption" &&
        delayedResult.outcome.code === "authorization-expired",
      label
    );
    check(
      (await delayed.runtime.state()).calls.every(
        (call) => !isAtomicMergeCall(call)
      ),
      `${label} issues no merge request`
    );
  }


  const concurrentClock = createClock();
  const concurrentAuthorization = await createTimedAuthorization(concurrentClock);
  if (concurrentAuthorization.result.status !== "authorization-created") {
    throw new Error("concurrent authorization fixture required");
  }
  const firstConcurrentExecution = executeRegulatoryImplementationMerge(
    plan,
    bundle,
    receipt,
    concurrentAuthorization.result.authorization
  );
  check(
    !isLiveRegulatoryImplementationMergeAuthorization(
      concurrentAuthorization.result.authorization
    ),
    "authorization is claimed synchronously before the first await"
  );
  const secondConcurrentExecution = executeRegulatoryImplementationMerge(
    plan,
    bundle,
    receipt,
    concurrentAuthorization.result.authorization
  );
  const concurrentResults = await Promise.all([
    firstConcurrentExecution,
    secondConcurrentExecution,
  ]);
  equal(
    concurrentResults.filter((result) => result.status === "terminal").length,
    1,
    "exactly one concurrent execution owns the live authorization"
  );
  equal(
    concurrentResults.filter(
      (result) => result.status === "authorization-refused"
    ).length,
    1,
    "the concurrent loser refuses immediately"
  );
  equal(
    (await concurrentAuthorization.runtime.state()).calls.filter(
      isAtomicMergeCall
    ).length,
    1,
    "concurrent execution issues exactly one merge request"
  );

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

  for (const [field, value, label] of [
    ["authorizationId", null, "null authorization ID is refused"],
    ["planId", "wrong", "wrong plan ID prefix is refused"],
    ["bundleId", null, "null bundle ID is refused"],
    ["executionReceiptId", "wrong", "wrong execution receipt ID is refused"],
    ["pullRequestNumber", -1, "negative authorization PR number is refused"],
    ["pullRequestUrl", "https://example.test/1", "noncanonical authorization URL is refused"],
    ["headBranch", "", "empty authorization head branch is refused"],
  ]) {
    const malformed = structuredClone(authorization);
    malformed[field] = value;
    delete malformed.authorizationChecksum;
    malformed.authorizationChecksum =
      regulatoryImplementationMergeAuthorizationTestSurface.sha256Canonical(malformed);
    check(
      validateRegulatoryImplementationMergeAuthorization(malformed).length > 0,
      label
    );
  }

  for (const auditId of [null, "arbitrary", "regulatory-implementation-merge-audit:"]) {
    const malformed = structuredClone(success.audit);
    malformed.auditId = auditId;
    delete malformed.auditChecksum;
    const { authentication: ignored, ...auditPayload } = malformed;
    void ignored;
    malformed.auditChecksum =
      regulatoryImplementationMergeAuthorizationTestSurface.sha256Canonical(auditPayload);
    check(
      validateRegulatoryImplementationMergeAuditRecord(malformed).length > 0,
      "malformed checksum-recomputed audit ID is refused"
    );
  }
} finally {
  Date.now = originalDateNow;
  process.hrtime.bigint = originalMonotonicNow;
  await rm(snapshotRoot, { recursive: true, force: true });
  await rm(packetRoot, { recursive: true, force: true });
  for (const root of auditRoots) {
    await chmod(root, 0o700).catch(() => undefined);
    await rm(root, { recursive: true, force: true });
  }
  for (const runtime of mergeRuntimes) await runtime.cleanup();
}

console.log(
  `registry implementation merge authorization: ${assertions} behavioral assertions passed`
);
