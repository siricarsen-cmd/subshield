import assert from "node:assert/strict";
import {
  chmod,
  mkdtemp,
  mkdir,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  createRegulatoryImplementationMergeProductionAdapter,
  REGULATORY_MERGE_HOSTED_POLICY,
  regulatoryImplementationMergeProductionAdapterTestSurface,
} from "../registry-implementation-merge-production-adapter.ts";

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
  full_name: "siricarsen-cmd/subshield",
  node_id: state.repositoryNodeId,
  default_branch: "main",
  delete_branch_on_merge: state.deleteBranchOnMerge === true,
  allow_squash_merge: true,
  allow_merge_commit: true,
  allow_rebase_merge: true,
  permissions: { admin: false, maintain: false, push: true }
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
    if (state.atomicAmbiguous) fail("atomic response unavailable");
    if (state.mainSha !== state.baseSha || state.headRefSha !== state.headSha) {
      output({ errors: [{ type: "STALE_DATA", message: "beforeOid mismatch" }] });
    }
    state.mainSha = state.headSha;
    state.merged = true;
    state.mergeSha = state.headSha;
    output({ data: { updateRefs: { clientMutationId: null } } });
  }
  const afterArguments = api.filter(value => value.startsWith("after="));
  const hasAfterVariable = query.includes("$after");
  const hasAfterField = query.includes("after:$after");
  if (afterArguments.length === 0) {
    if (hasAfterVariable || hasAfterField) fail("first-page cursor must be omitted");
    output({
      data: { repository: { pullRequest: { reviewThreads: {
        nodes: [{ isResolved: !state.unresolvedThread }],
        pageInfo: { hasNextPage: true, endCursor: state.missingThreadCursor ? null : "cursor-1" }
      } } } }
    });
  }
  if (
    afterArguments.length !== 1 ||
    afterArguments[0] !== "after=cursor-1" ||
    !hasAfterVariable ||
    !hasAfterField
  ) fail("wrong review thread cursor");
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
  output({
    number: 57,
    html_url: "https://github.com/siricarsen-cmd/subshield/pull/57",
    state: state.merged ? "closed" : "open",
    draft: false,
    auto_merge: null,
    merged: state.merged,
    merge_commit_sha: state.merged ? state.mergeSha : null,
    base: { ref: "main", sha: state.baseSha },
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
  output({ parents: [{ sha: state.baseSha }], commit: { tree: { sha: state.headTreeSha || "c".repeat(40) } } });
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

async function createRuntime(overrides = {}) {
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
      await rm(root, { recursive: true, force: true });
    },
  };
}

const runtimes = [];

try {
  const runtime = await createRuntime();
  runtimes.push(runtime);
  let injectedAuthenticateCalled = false;
  const adapter = await createRegulatoryImplementationMergeProductionAdapter({
    repositoryRoot: runtime.repositoryRoot,
    gitExecutable: runtime.gitExecutable,
    githubCliExecutable: runtime.githubCliExecutable,
    githubCliConfigDir: runtime.githubCliConfigDir,
    authenticate() {
      injectedAuthenticateCalled = true;
    },
  });
  equal(
    Object.keys(adapter).sort(),
    [
      "authenticate",
      "inspectExactPullRequest",
      "requestAtomicReviewedBaseHeadFastForward",
    ],
    "adapter exposes only the three narrow methods"
  );
  check(!injectedAuthenticateCalled, "caller-injected hosted facts are ignored");
  for (const forbidden of [
    "deleteBranch",
    "forcePush",
    "rebase",
    "reset",
    "enableAutoMerge",
    "deploy",
    "release",
    "administer",
  ]) {
    check(!(forbidden in adapter), `forbidden method is absent: ${forbidden}`);
  }

  const identity = await adapter.authenticate();
  equal(identity.login, "siricarsen-cmd", "principal authenticates exactly");
  equal(identity.permission, "WRITE", "merge permission is independently read");
  const snapshot = await adapter.inspectExactPullRequest(57);
  equal(snapshot.number, 57, "exact PR is inspected");
  equal(snapshot.files.length, 2, "all changed files are checksummed");
  equal(snapshot.unresolvedThreadCount, 0, "all review thread pages are inspected");
  equal(snapshot.paginationComplete, true, "pagination completion is explicit");
  equal(
    snapshot.codexEvidence.reviewCommit,
    "b".repeat(40),
    "COMMENTED review is exact-head bound"
  );
  equal(
    snapshot.checks[0].jobName,
    REGULATORY_MERGE_HOSTED_POLICY.workflows[0].jobName,
    "immutable hosted job is selected"
  );

  const stateAfterInspection = await runtime.state();
  const ghCalls = stateAfterInspection.calls.filter((call) => call.tool === "gh");
  for (const fragment of [
    "/files?per_page=100",
    "/actions/workflows/320336946/runs?",
    "/actions/workflows/320319820/runs?",
    "/reviews?per_page=100",
    "/comments?per_page=100",
    "/commits?per_page=100",
    "/runs/9001/attempts/2/jobs?per_page=100",
    "/runs/9002/attempts/2/jobs?per_page=100",
  ]) {
    check(
      ghCalls.some(
        (call) =>
          call.argv.includes("--paginate") &&
          call.argv.includes("--slurp") &&
          call.argv.some((value) => value.includes(fragment))
      ),
      `authority list is fully paginated: ${fragment}`
    );
  }
  const reviewThreadCalls = ghCalls.filter(
    (call) =>
      call.argv.includes("graphql") &&
      !call.argv.some((value) => value.includes("updateRefs"))
  );
  equal(
    reviewThreadCalls.length,
    2,
    "review-thread cursor pagination requests every page"
  );
  const firstReviewThreadQuery =
    reviewThreadCalls[0].argv.find((value) => value.startsWith("query=")) ?? "";
  const secondReviewThreadQuery =
    reviewThreadCalls[1].argv.find((value) => value.startsWith("query=")) ?? "";
  check(
    !firstReviewThreadQuery.includes("$after") &&
      !firstReviewThreadQuery.includes("after:$after") &&
      !reviewThreadCalls[0].argv.some((value) => value.startsWith("after=")),
    "first review-thread request omits every cursor declaration, field, and argument"
  );
  check(
    secondReviewThreadQuery.includes("$after:String!") &&
      secondReviewThreadQuery.includes("after:$after") &&
      reviewThreadCalls[1].argv.filter((value) => value === "after=cursor-1").length === 1,
    "later review-thread request uses the exact returned cursor"
  );
  check(
    ghCalls.every(
      (call) =>
        call.env.PATH === "" &&
        call.env.GH_CONFIG_DIR === runtime.githubCliConfigDir &&
        call.env.GIT_TERMINAL_PROMPT === "0"
    ),
    "commands use the minimal protected environment"
  );

  const authenticatedUserCallsBeforeMerge = ghCalls.filter(
    (call) => call.argv.includes("user")
  ).length;
  const mutation = await adapter.requestAtomicReviewedBaseHeadFastForward(
    snapshot.repositoryNodeId,
    snapshot.headBranch,
    snapshot.remoteMainSha,
    snapshot.headSha
  );
  equal(mutation.kind, "accepted", "atomic reviewed-base/head fast-forward is accepted");
  const stateImmediatelyAfterMutation = await runtime.state();
  equal(
    stateImmediatelyAfterMutation.calls.filter(
      (call) => call.tool === "gh" && call.argv.includes("user")
    ).length,
    authenticatedUserCallsBeforeMerge,
    "guarded merge begins without a post-freshness authentication await"
  );
  const post = await adapter.inspectExactPullRequest(57);
  equal(post.merged, true, "postmerge state is re-fetched");
  equal(post.remoteMainSha, "b".repeat(40), "postmerge main is exact");
  const stateAfterMerge = await runtime.state();
  const mergeCalls = stateAfterMerge.calls.filter(
    (call) =>
      call.tool === "gh" &&
      call.argv.includes("graphql") &&
      call.argv.some((value) => value.includes("updateRefs"))
  );
  equal(mergeCalls.length, 1, "atomic ref mutation is called once");
  const atomicQuery = mergeCalls[0].argv.find((value) => value.startsWith("query=")) ?? "";
  check(atomicQuery.includes(`beforeOid:"${"a".repeat(40)}"`), "atomic request binds reviewed main");
  check(atomicQuery.includes(`afterOid:"${"b".repeat(40)}"`), "atomic request advances main to exact head");
  check(atomicQuery.includes(`name:"refs/heads/${snapshot.headBranch}"`), "atomic request guards exact head branch");
  check(!stateAfterMerge.calls.some((call) => call.argv.includes("pulls/57/merge")), "ordinary PR merge endpoint is never called");

  const symlinkRuntime = await createRuntime();
  runtimes.push(symlinkRuntime);
  const link = path.join(symlinkRuntime.root, "gh-link");
  await symlink(symlinkRuntime.githubCliExecutable, link);
  await rejects(
    () =>
      createRegulatoryImplementationMergeProductionAdapter({
        repositoryRoot: symlinkRuntime.repositoryRoot,
        gitExecutable: symlinkRuntime.gitExecutable,
        githubCliExecutable: link,
        githubCliConfigDir: symlinkRuntime.githubCliConfigDir,
      }),
    /identity was invalid/,
    "symlink executable is refused"
  );

  const changedRuntime = await createRuntime();
  runtimes.push(changedRuntime);
  const changedAdapter =
    await createRegulatoryImplementationMergeProductionAdapter({
      repositoryRoot: changedRuntime.repositoryRoot,
      gitExecutable: changedRuntime.gitExecutable,
      githubCliExecutable: changedRuntime.githubCliExecutable,
      githubCliConfigDir: changedRuntime.githubCliConfigDir,
    });
  await writeFile(
    changedRuntime.githubCliExecutable,
    `${await readFile(changedRuntime.githubCliExecutable, "utf8")}\n`,
    { mode: 0o700 }
  );
  await rejects(
    () => changedAdapter.authenticate(),
    /identity changed/,
    "runtime executable drift is refused"
  );

  const configRuntime = await createRuntime();
  runtimes.push(configRuntime);
  const configAdapter =
    await createRegulatoryImplementationMergeProductionAdapter({
      repositoryRoot: configRuntime.repositoryRoot,
      gitExecutable: configRuntime.gitExecutable,
      githubCliExecutable: configRuntime.githubCliExecutable,
      githubCliConfigDir: configRuntime.githubCliConfigDir,
    });
  await chmod(configRuntime.githubCliConfigDir, 0o755);
  await rejects(
    () => configAdapter.authenticate(),
    /directory identity was invalid|identity changed/,
    "gh config permission drift is refused"
  );

  for (const [label, overrides, pattern] of [
    ["empty pagination", { emptyPagination: true }, /pagination was incomplete/],
    [
      "missing thread cursor",
      { missingThreadCursor: true },
      /pagination was incomplete/,
    ],
    [
      "duplicate workflow",
      { duplicateWorkflow: true },
      /workflow evidence was missing|workflow evidence was ambiguous|job evidence was ambiguous/,
    ],
    ["failed job", { failedJob: true }, null],
    [
      "stale review",
      { staleReview: true },
      /Codex review evidence was missing/,
    ],
    [
      "missing clean attestation",
      { missingCleanComment: true },
      /attestation was missing/,
    ],
    [
      "later finding",
      { laterFinding: true },
      /attestation was superseded/,
    ],
  ]) {
    const candidateRuntime = await createRuntime(overrides);
    runtimes.push(candidateRuntime);
    const candidate =
      await createRegulatoryImplementationMergeProductionAdapter({
        repositoryRoot: candidateRuntime.repositoryRoot,
        gitExecutable: candidateRuntime.gitExecutable,
        githubCliExecutable: candidateRuntime.githubCliExecutable,
        githubCliConfigDir: candidateRuntime.githubCliConfigDir,
      });
    if (label === "failed job") {
      const candidateSnapshot = await candidate.inspectExactPullRequest(57);
      equal(
        candidateSnapshot.checks[0].conclusion,
        "failure",
        "failed hosted conclusion is preserved for authorization refusal"
      );
    } else {
      await rejects(
        () => candidate.inspectExactPullRequest(57),
        pattern,
        `${label} is refused`
      );
    }
  }

  for (const workflow of REGULATORY_MERGE_HOSTED_POLICY.workflows) {
    for (const [label, overrides, pattern] of [
      ["missing", { missingWorkflowId: workflow.workflowId }, /workflow evidence was missing/],
      ["duplicate", { duplicateWorkflowId: workflow.workflowId }, /workflow evidence was ambiguous/],
      ["wrong-head", { wrongCheckHeadId: workflow.workflowId }, /workflow evidence was missing/],
    ]) {
      const candidateRuntime = await createRuntime(overrides);
      runtimes.push(candidateRuntime);
      const candidate = await createRegulatoryImplementationMergeProductionAdapter({
        repositoryRoot: candidateRuntime.repositoryRoot,
        gitExecutable: candidateRuntime.gitExecutable,
        githubCliExecutable: candidateRuntime.githubCliExecutable,
        githubCliConfigDir: candidateRuntime.githubCliConfigDir,
      });
      await rejects(
        () => candidate.inspectExactPullRequest(57),
        pattern,
        `${workflow.workflowName} ${label} evidence is refused independently`
      );
    }
    for (const [label, overrides] of [
      ["pending", { pendingWorkflowId: workflow.workflowId }],
      ["failed", { failedWorkflowId: workflow.workflowId }],
    ]) {
      const candidateRuntime = await createRuntime(overrides);
      runtimes.push(candidateRuntime);
      const candidate = await createRegulatoryImplementationMergeProductionAdapter({
        repositoryRoot: candidateRuntime.repositoryRoot,
        gitExecutable: candidateRuntime.gitExecutable,
        githubCliExecutable: candidateRuntime.githubCliExecutable,
        githubCliConfigDir: candidateRuntime.githubCliConfigDir,
      });
      const candidateSnapshot = await candidate.inspectExactPullRequest(57);
      const checkEvidence = candidateSnapshot.checks.find(
        (checkRun) => checkRun.workflowId === workflow.workflowId
      );
      check(
        checkEvidence?.status !== "completed" || checkEvidence.conclusion !== "success",
        `${workflow.workflowName} ${label} evidence remains fail-closed for authorization`
      );
    }
  }

  const unresolvedRuntime = await createRuntime({ unresolvedThread: true });
  runtimes.push(unresolvedRuntime);
  const unresolvedAdapter =
    await createRegulatoryImplementationMergeProductionAdapter({
      repositoryRoot: unresolvedRuntime.repositoryRoot,
      gitExecutable: unresolvedRuntime.gitExecutable,
      githubCliExecutable: unresolvedRuntime.githubCliExecutable,
      githubCliConfigDir: unresolvedRuntime.githubCliConfigDir,
    });
  const unresolved = await unresolvedAdapter.inspectExactPullRequest(57);
  equal(
    unresolved.unresolvedThreadCount,
    1,
    "unresolved review thread count is retrieved, not hardcoded"
  );

  for (const [label, overrides] of [
    ["main drift", { atomicMainDrift: true }],
    ["head drift", { atomicHeadDrift: true }],
    ["both refs drift", { atomicMainDrift: true, atomicHeadDrift: true }],
  ]) {
    const atomicRuntime = await createRuntime(overrides);
    runtimes.push(atomicRuntime);
    const atomicAdapter = await createRegulatoryImplementationMergeProductionAdapter({
      repositoryRoot: atomicRuntime.repositoryRoot,
      gitExecutable: atomicRuntime.gitExecutable,
      githubCliExecutable: atomicRuntime.githubCliExecutable,
      githubCliConfigDir: atomicRuntime.githubCliConfigDir,
    });
    const before = await atomicAdapter.inspectExactPullRequest(57);
    const atomicResult = await atomicAdapter.requestAtomicReviewedBaseHeadFastForward(
      before.repositoryNodeId,
      before.headBranch,
      before.remoteMainSha,
      before.headSha
    );
    equal(atomicResult.kind, "refused", `${label} is refused atomically`);
    const atomicState = await atomicRuntime.state();
    check(atomicState.mainSha !== atomicState.headSha, `${label} never advances main to the reviewed head`);
    equal(
      atomicState.calls.filter(
        (call) => call.tool === "gh" && call.argv.some((value) => value.includes("updateRefs"))
      ).length,
      1,
      `${label} performs no retry`
    );
  }

  const ambiguousRuntime = await createRuntime({ atomicAmbiguous: true });
  runtimes.push(ambiguousRuntime);
  const ambiguousAdapter = await createRegulatoryImplementationMergeProductionAdapter({
    repositoryRoot: ambiguousRuntime.repositoryRoot,
    gitExecutable: ambiguousRuntime.gitExecutable,
    githubCliExecutable: ambiguousRuntime.githubCliExecutable,
    githubCliConfigDir: ambiguousRuntime.githubCliConfigDir,
  });
  const ambiguousBefore = await ambiguousAdapter.inspectExactPullRequest(57);
  const ambiguousMutation = await ambiguousAdapter.requestAtomicReviewedBaseHeadFastForward(
    ambiguousBefore.repositoryNodeId,
    ambiguousBefore.headBranch,
    ambiguousBefore.remoteMainSha,
    ambiguousBefore.headSha
  );
  equal(ambiguousMutation.kind, "ambiguous", "atomic transport failure is ambiguous");
  const ambiguousState = await ambiguousRuntime.state();
  equal(ambiguousState.mainSha, ambiguousState.baseSha, "ambiguous response leaves main unchanged in the harness");

  const secretRuntime = await createRuntime({ failUser: true });
  runtimes.push(secretRuntime);
  const secretAdapter =
    await createRegulatoryImplementationMergeProductionAdapter({
      repositoryRoot: secretRuntime.repositoryRoot,
      gitExecutable: secretRuntime.gitExecutable,
      githubCliExecutable: secretRuntime.githubCliExecutable,
      githubCliConfigDir: secretRuntime.githubCliConfigDir,
    });
  try {
    await secretAdapter.authenticate();
    assert.fail("secret failure must reject");
  } catch (error) {
    assertions += 1;
    check(
      error instanceof Error &&
        error.message === "Protected repository command failed" &&
        !error.message.includes("SUPER-SECRET"),
      "command errors are generic and secret-safe"
    );
  }

  check(Object.isFrozen(REGULATORY_MERGE_HOSTED_POLICY), "policy is frozen");
  equal(
    REGULATORY_MERGE_HOSTED_POLICY.mergeMethod,
    "fast-forward",
    "merge policy cannot be caller-selected"
  );

  equal(
    regulatoryImplementationMergeProductionAdapterTestSurface.extractReviewPrefix(
      `Codex Review: Didn't find any major issues. Bravo.\nReviewed commit: ${"a".repeat(12)}`
    ),
    null,
    "short reviewed commit prefixes are refused"
  );

  const contentDriftRuntime = await createRuntime();
  runtimes.push(contentDriftRuntime);
  const contentDriftAdapter = await createRegulatoryImplementationMergeProductionAdapter({
    repositoryRoot: contentDriftRuntime.repositoryRoot,
    gitExecutable: contentDriftRuntime.gitExecutable,
    githubCliExecutable: contentDriftRuntime.githubCliExecutable,
    githubCliConfigDir: contentDriftRuntime.githubCliConfigDir,
  });
  await writeFile(
    path.join(contentDriftRuntime.githubCliConfigDir, "hosts.yml"),
    "github.com: replaced\n",
    { mode: 0o600 }
  );
  await rejects(
    () => contentDriftAdapter.authenticate(),
    /identity changed/,
    "in-place hosts.yml content drift is refused"
  );

  const deletionRuntime = await createRuntime({ deleteBranchOnMerge: true });
  runtimes.push(deletionRuntime);
  const deletionAdapter = await createRegulatoryImplementationMergeProductionAdapter({
    repositoryRoot: deletionRuntime.repositoryRoot,
    gitExecutable: deletionRuntime.gitExecutable,
    githubCliExecutable: deletionRuntime.githubCliExecutable,
    githubCliConfigDir: deletionRuntime.githubCliConfigDir,
  });
  await rejects(
    () => deletionAdapter.authenticate(),
    /repository identity was invalid/,
    "automatic branch deletion is refused"
  );

  equal(
    createRegulatoryImplementationMergeProductionAdapter.length,
    0,
    "public production factory accepts no runtime path arguments"
  );

  for (const [overrides, message] of [
    [{ foreignWorkflowPr: true }, "foreign workflow PR association is refused"],
    [{ wrongWorkflowBase: true }, "wrong workflow base association is refused"],
    [{ wrongWorkflowHead: true }, "wrong workflow head association is refused"],
    [{ forkedWorkflow: true }, "forked workflow repository association is refused"],
  ]) {
    const associationRuntime = await createRuntime(overrides);
    runtimes.push(associationRuntime);
    const associationAdapter = await createRegulatoryImplementationMergeProductionAdapter({
      repositoryRoot: associationRuntime.repositoryRoot,
      gitExecutable: associationRuntime.gitExecutable,
      githubCliExecutable: associationRuntime.githubCliExecutable,
      githubCliConfigDir: associationRuntime.githubCliConfigDir,
    });
    await rejects(
      () => associationAdapter.inspectExactPullRequest(57),
      /workflow pull request evidence was foreign/,
      message
    );
  }
  const analyzerWorkflow = await readFile(
  path.join(process.cwd(), ".github", "workflows", "analyzer-accuracy.yml"),
  "utf8"
);
const implementationPlanSource = await readFile(
  path.join(process.cwd(), "lib", "regulatory", "registry-implementation-plan.ts"),
  "utf8"
);
const targetFileBlock = implementationPlanSource.match(
  /const TARGET_FILE_BY_KIND:[\s\S]*?= \{([\s\S]*?)\n\};/
);
check(Boolean(targetFileBlock), "implementation-plan target file policy is discoverable");
const generatedTargetFiles = [
  ...targetFileBlock[1].matchAll(/:\s*"([^"]+\.ts)"/g),
].map((match) => match[1]);
equal(
  [...generatedTargetFiles].sort(),
  [
    "lib/regulatory/benchmark-applicability-mappings.ts",
    "lib/regulatory/historical-grounding-policy.ts",
    "lib/regulatory/source-coverage-citation-packages.ts",
  ].sort(),
  "implementation plan exposes exactly the generated registry target files"
);
for (const targetFile of generatedTargetFiles) {
  check(
    analyzerWorkflow.includes(`      - "${targetFile}"`),
    `Analyzer Accuracy pull-request trigger covers generated target: ${targetFile}`
  );
}

} finally {
  for (const runtime of runtimes.reverse()) {
    await chmod(runtime.githubCliConfigDir, 0o700).catch(() => undefined);
    await runtime.cleanup();
  }
}

console.log(
  `registry implementation merge production adapter: ${assertions} behavioral assertions passed`
);
