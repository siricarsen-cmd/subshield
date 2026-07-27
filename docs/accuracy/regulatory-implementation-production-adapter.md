# Controlled Regulatory Implementation Production Adapter

Status: implemented for adversarial review  
Product scope: federal subcontractors reviewing prime-issued subcontract and solicitation packages  
Customer-facing status: not enabled

## Purpose

This phase connects the benchmark-only controlled executor to authenticated local Git and GitHub operations without expanding the executor's authority.

The production adapter may create one exact regulatory implementation branch and commit, run four approved checks, publish that branch with a create-only compare-and-swap, and open one non-auto-merge pull request. It must never merge, deploy, approve evidence, change analyzer behavior, alter customer data, or treat stored artifacts as live authorization.

The adapter is a capability boundary. Every operation fails closed and remains bound to the original in-process live `RegulatoryRegistryImplementationPlan` and `RegulatoryImplementationPullRequestBundle` required by `registry-implementation-executor.ts`.

## Non-goals

This phase does not:

- merge or approve an implementation pull request;
- enable auto-merge;
- deploy to Vercel or another environment;
- change analyzer logic, reports, customer documents, authentication, payments, databases, email, secrets, or environment configuration;
- approve official-source evidence or regulatory registry transitions;
- restore live capability from a stored plan, bundle, or receipt;
- create a scheduled or automatic invocation entry point; or
- expose a generic GitHub administration client.

A later phase must separately implement deliberate merge authorization. A separate orchestration phase may connect the already controlled live review path to this adapter.

## Public API and capability boundary

The focused implementation module is:

```text
lib/regulatory/registry-implementation-production-adapter.ts
```

The public production API exposes only the high-level runner:

```text
executeRegulatoryImplementationWithProductionAdapter(plan, bundle, options)
```

It requires the original live plan and bundle, constructs an internal adapter, invokes the controlled executor, and cleans up temporary resources. The real adapter class is not exported. Only pure validation helpers are exposed through an explicitly named test surface.

## Reviewed-base control

The authenticated remote repository's current `main` head must exactly equal `plan.baseCommitSha`:

1. during preflight before branch or worktree mutation;
2. immediately before branch publication; and
3. immediately before pull-request creation.

If `main` moves, execution stops. The plan and bundle must be rebuilt and re-authorized from the new base. The adapter must not rebase, reset, force-update an existing ref, retry automatically, or replay an old authorization.

## Repository identity and transport

Production execution requires:

- repository identity exactly `siricarsen-cmd/subshield`;
- default branch exactly `main`;
- exactly one configured fetch URL and one effective push URL;
- both URLs canonicalizing to the exact GitHub repository over HTTPS;
- no SSH transport, credentials embedded in URLs, alternate hosts, nondefault ports, queries, fragments, lookalikes, forks, or Git URL rewrites;
- a nonblank authenticated GitHub principal; and
- `write`, `maintain`, or `admin` permission on the exact repository.

The adapter enumerates every `remote.origin.url` and `remote.origin.pushurl`. A canonical first URL does not make an additional URL acceptable. Ambiguous or multiple endpoints fail before mutation.

All network Git operations use the fixed endpoint:

```text
https://github.com/siricarsen-cmd/subshield.git
```

They do not rely on a caller-controlled remote name.

## Principal-bound authentication

The adapter obtains a token from the same authenticated `gh` context used to read the GitHub login and repository permission. Subsequent `gh` operations reuse that token.

Git transport uses the same token through process-environment Git configuration. It disables credential helpers and interactive prompting. The token must never appear in argv, returned output, errors, receipts, required-check environments, committed files, PR metadata, or logs produced by the adapter.

Ambient SSH keys, unrelated credential helpers, inherited Git credential configuration, and caller-supplied principals are not authoritative. The receipt principal is normalized as:

```text
github-user:<authenticated-login>
```

The in-memory token reference is cleared during cleanup.

## Process and Git isolation

Every child process uses an explicit executable and argv array with `shell: false`. No plan, bundle, branch, path, commit, title, body, or check value is concatenated into a shell command.

Every Git subprocess, including inspection, worktree creation, status, add, commit, publication, verification, and cleanup, receives:

- an adapter-owned empty/nonexistent `core.hooksPath`;
- disabled commit and tag signing;
- `GIT_CONFIG_NOSYSTEM=1`;
- a controlled `GIT_CONFIG_COUNT` configuration;
- no inherited arbitrary `GIT_*` injection values;
- disabled credential helpers; and
- noninteractive authentication.

Repository hooks such as `post-checkout`, `pre-commit`, `commit-msg`, and `pre-push` must never execute.

Command output is bounded and suppressed from executor errors and receipts. Secret values are never returned.

## Exact check allowlist

Only these exact, ordered checks may execute:

```text
npm run test:regulatory
npm run test:accuracy
npx tsc --noEmit
npm run build
```

Each string maps to a fixed executable and argv sequence. Unknown, reordered, duplicated, parameterized, or modified commands fail closed.

The adapter itself never invokes a shell. The three immutable `npm run` commands are a narrow exception only in the sense that npm may internally use its script shell for the exact scripts already present in the reviewed `package.json`. Before every check, the adapter proves the worktree's `package.json` bytes exactly reproduce `plan.baseCommitSha:package.json`. No caller-selected script, argument, package metadata, or shell string may enter this path. `npx tsc --noEmit` also uses a fixed argv sequence.

## Isolated worktree and path controls

The adapter never switches or modifies the user's active branch or working tree. It creates a private temporary worktree from the exact reviewed base commit.

Only these registry files may be written:

```text
lib/regulatory/benchmark-applicability-mappings.ts
lib/regulatory/historical-grounding-policy.ts
lib/regulatory/source-coverage-citation-packages.ts
```

For every file, the adapter verifies:

- the path is present exactly once in the live bundle;
- the path is relative, allowlisted, and contained inside the isolated worktree;
- every existing parent component is a real directory, not a symlink, junction, file, or special object;
- the base bytes reproduce `beforeChecksum`;
- atomic written bytes reproduce the exact bundle content and `afterChecksum`;
- Git reports exactly the authorized changed path set;
- the commit has exactly one parent equal to `plan.baseCommitSha`;
- the commit message exactly equals `bundle.commitMessage`; and
- reading each path from the commit reproduces the exact bundle bytes and checksum.

No whitespace, line-ending, encoding, formatting, or final-newline normalization is allowed.

## Deterministic commit

The adapter creates one commit with:

- fixed author and committer name `SubShield Regulatory Executor`;
- fixed author and committer email `regulatory-executor@subshield.invalid`;
- author and committer timestamps deterministically derived from the reviewed base commit;
- hooks disabled;
- commit and tag signing disabled;
- the exact reviewed parent;
- the exact bundle message; and
- the exact authorized tree.

Local Git identity, local time, signing configuration, hooks, and unrelated configuration must not affect the resulting commit identity.

## Atomic create-only publication

A normal non-force push is insufficient because a competing actor could create the target branch at the reviewed base after preflight and then be fast-forwarded.

The only force-like operation permitted is the precisely scoped absent-ref lease:

```text
--force-with-lease=refs/heads/<exact-target>:
```

The empty expected value means the remote target ref must not exist. This operation may create only the exact deterministic target branch at the exact commit. It cannot overwrite an existing ref. Ordinary force, a lease against an existing value, `+` refspecs, deletion, reset, rebase, and overwrite remain prohibited.

After publication, the adapter independently reads the hosted ref and requires it to equal the exact created commit. A branch-creation race fails without altering the competing branch.

## Pull-request requirements

Before PR creation, remote `main` must still equal the reviewed base. The adapter then creates exactly one PR with:

- base `main`;
- head equal to `plan.targetBranch`;
- exact created head commit;
- title exactly equal to `bundle.pullRequestTitle`;
- body exactly equal to `bundle.pullRequestBody`; and
- auto-merge disabled.

The body is written to a private temporary file. After creation, the adapter refetches the PR and requires:

- a positive safe integer number;
- canonical URL `https://github.com/siricarsen-cmd/subshield/pull/<number>`;
- exact base, head, SHA, title, and body;
- state `OPEN`;
- not draft;
- no auto-merge request; and
- no existing or duplicate PR for the head branch.

GitHub's RFC 3339 `createdAt` is validated and normalized to `Date.toISOString()`. Valid server timestamps with or without fractional seconds are accepted; invalid or non-UTC/noncanonical values fail. This server-issued time is the trusted receipt clock.

## State, failure, and cleanup

The adapter enforces one ordered state machine and refuses repeated, skipped, reordered, or identity-mismatched operations.

Preflight is mutation-free. No worktree, branch, file, commit, push, or PR is created until repository identity, principal, permission, remote base, live capability, exact paths, bytes, checksums, and required checks validate.

A partial local or remote branch created before a later failure is not overwritten or automatically deleted. Automatic recovery is out of scope. Temporary worktree and PR-body resources are cleaned, and in-memory authentication is cleared.

## Receipt boundary

A successful executor receipt remains:

```text
applicationStatus: not-applied
customerFacingStatus: benchmark-only
mergeStatus: not-authorized
authorizationStatus: audit-evidence-only
```

The receipt identifies the authenticated principal, reviewed base, target branch, exact commit, files, checks, exact PR identity, metadata fingerprint, and GitHub server time. Stored or cloned receipts remain audit evidence only and cannot restore live execution or merge authority.

## Required adversarial regressions

The focused suite must prove at minimum:

1. canonical HTTPS repository acceptance and SSH, ambiguous, multiple, rewritten, credential-bearing, alternate-host, port, query, fragment, fork, and lookalike refusal;
2. authenticated principal and sufficient permission required before mutation;
3. Git transport bound to the attested principal with no token disclosure;
4. every Git subprocess is hook-free and sanitized;
5. remote `main` equality at preflight, before publication, and before PR creation;
6. active worktree isolation and temporary-worktree cleanup;
7. traversal, absolute path, backslash, NUL, control character, symlink, junction, file-parent, and special-object refusal;
8. exact three-file, byte, checksum, commit parent, message, and tree reproduction;
9. exact ordered check argv and immutable `package.json` guard;
10. deterministic commit identity independent of local identity, time, signing, and hooks;
11. failed checks produce no publication or PR;
12. the exact absent-ref lease refuses branch races without altering the existing ref;
13. exact PR metadata, open/non-draft/non-auto-merge state, canonical URL, and server time;
14. RFC 3339 timestamps with and without fractional seconds normalize correctly;
15. partial failures return explicit non-success outcomes; and
16. the public API exposes no merge, deployment, release, tag, secret, payment, database, authentication mutation, email, or customer-record capability.

Tests must make no live GitHub, government-source, Vercel, Supabase, Stripe, email, or customer-data request.

## Validation and merge boundary

Run:

```text
npm run test:regulatory:implementation-production-adapter
npm run test:regulatory:implementation-executor
npm run test:regulatory
npm run test:accuracy
npx tsc --noEmit
npm run build
git diff --check
```

This PR may merge only after both hosted workflows pass on the exact final head, TypeScript and production build pass, all review findings are resolved, and a fresh final automated review of that exact head returns no findings.

Merging the adapter does not invoke it, apply a regulatory update, merge an implementation PR, or deploy SubShield.

## Later phases

After this adapter is merged, continue separately with:

1. controlled in-process orchestration connecting the live approved plan and bundle to this adapter without loading stored authority;
2. deliberate human merge authorization with fresh verification of the exact PR, checks, branch, commit, and approved regulatory transitions; and
3. an end-to-end controlled simulation proving unchanged and transport-only source updates create no packet, substantive updates require every review gate, and customer-facing behavior changes only after deliberate authorized merge.
