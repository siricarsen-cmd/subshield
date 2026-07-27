# Controlled Regulatory Implementation Production Adapter

Status: specification for implementation and adversarial review  
Product scope: federal subcontractors reviewing prime-issued subcontract and solicitation packages  
Customer-facing status: not enabled

## Purpose

This phase connects the benchmark-only controlled executor to authenticated local Git and GitHub operations without expanding the executor's authority.

The production adapter may create one exact regulatory implementation branch, one exact commit, run the four approved checks, push without force, and open one non-auto-merge pull request. It must never merge, deploy, alter customer data, approve regulatory evidence, or treat stored artifacts as live authorization.

The adapter is a capability boundary, not a convenience wrapper. Every operation must fail closed, use exact argv-based process execution, and remain bound to the original in-process live plan and bundle already required by `registry-implementation-executor.ts`.

## Non-goals

This phase does not:

- merge an implementation pull request;
- enable auto-merge;
- deploy to Vercel or any other environment;
- change analyzer logic, report behavior, customer documents, authentication, payments, databases, email, secrets, or environment configuration;
- approve source evidence or regulatory registry transitions;
- load a stored plan, bundle, or receipt and restore live capability;
- add a scheduled workflow or automatic invocation entry point; or
- create a generic GitHub administration client.

A later phase must separately implement deliberate merge authorization. An additional orchestration phase may later connect the production adapter to the already controlled live in-process review path.

## Required architecture

Add a focused module such as:

```text
lib/regulatory/registry-implementation-production-adapter.ts
```

The public production API should expose only a high-level function similar to:

```text
executeRegulatoryImplementationWithProductionAdapter(plan, bundle, options)
```

It must require the original live `RegulatoryRegistryImplementationPlan` and original live `RegulatoryImplementationPullRequestBundle`, construct an internal narrow adapter, call the existing executor, and clean up temporary resources.

Do not publicly expose a reusable low-level GitHub client with unrelated operations. Test-only dependency injection may exist behind an explicitly named test seam, but the production factory must own the real process runner and capability set.

## Strengthened reviewed-base control

The production adapter must not merely prove that `plan.baseCommitSha` exists. It must prove that the authenticated remote repository's current default-branch head is exactly that SHA.

Extend the narrow executor contract as needed so preflight obtains and verifies the exact current remote `main` head before any branch creation. The adapter must:

1. authenticate to the exact repository;
2. fetch `origin/main` without changing the developer's current branch;
3. read the resulting remote head SHA;
4. require it to equal `plan.baseCommitSha`; and
5. re-check that equality immediately before push and immediately before pull-request creation.

If `main` moves at any point, execution must stop. The plan and bundle must be rebuilt and re-authorized from the new base rather than rebased, force-updated, or silently replayed.

## Repository identity and authentication

The production adapter must require all of the following:

- canonical repository identity exactly `siricarsen-cmd/subshield`;
- default branch exactly `main`;
- canonical `origin` remote resolving only to that repository;
- authenticated GitHub CLI context for the same repository;
- a nonblank authenticated GitHub principal;
- repository permission sufficient to create a branch and pull request; and
- no caller override for repository identity, principal, base branch, target branch, commit metadata, PR metadata, required checks, or allowed paths.

Accept only canonical HTTPS or SSH remote forms that normalize exactly to `github.com/siricarsen-cmd/subshield`. Reject forks, alternate hosts, URL rewrites, ambiguous remotes, and repository-name lookalikes.

Obtain the principal through authenticated GitHub context, such as `gh api user`, normalize it to a stable value such as `github-user:<login>`, and verify the principal has `write`, `maintain`, or `admin` permission on the exact repository. Blank, failed, anonymous, or insufficient-permission identity reads must fail before branch creation.

The fixed benchmark-only service-principal fallback in the executor must not be used by the production adapter.

## Process execution boundary

Use argv-based process execution only, such as `execFile` or `spawn` with `shell: false`.

Never concatenate plan, bundle, branch, path, commit, title, body, or check values into a shell command. Never invoke `sh`, `bash -c`, `cmd /c`, PowerShell command strings, `eval`, or an equivalent shell interpreter.

The production runner must:

- use explicit executable and argv arrays;
- set an explicit working directory for every command;
- reject NUL bytes, control characters, traversal, absolute paths, backslashes in repository-relative paths, and malformed branch names;
- use bounded stdout/stderr capture;
- avoid returning command output, environment values, or tokens in executor errors or receipts;
- never print or persist `GH_TOKEN`, GitHub credentials, Supabase credentials, Stripe credentials, or other environment secrets; and
- use platform-correct `npm`/`npm.cmd` and `npx`/`npx.cmd` binaries without invoking a shell.

## Exact command allowlist

Only these plan-bound checks may execute:

```text
npm run test:regulatory
npm run test:accuracy
npx tsc --noEmit
npm run build
```

Map each exact string to a fixed executable and fixed argv array. Reject any unknown, reordered, duplicated, parameterized, shell-metacharacter, or caller-modified command.

The check result returned to the executor may contain only the exact command, exact created commit SHA, and `success` or `failure`. A failed check may report a generic command and exit-code message but must not include raw captured output or environment values.

## Isolated worktree

Do not switch or modify the user's active branch or working tree.

The production adapter must create a private temporary Git worktree from the exact reviewed base commit under an operating-system temporary directory. It must:

- verify the source repository is a real Git worktree;
- create the deterministic target branch exactly once from the exact reviewed base;
- use a newly created private temporary directory;
- reject symlinks or junctions that could escape the worktree;
- write only the three authorized canonical registry paths;
- create missing parent directories only within the isolated worktree;
- use atomic file replacement with restrictive temporary-file permissions;
- stage only the exact authorized paths;
- create exactly one commit with the bundle's exact commit message; and
- remove the temporary worktree and temporary PR-body files when the high-level runner finishes.

A partial local or remote branch created before a later failure must not be overwritten, force-updated, or automatically deleted. Preserve fail-closed evidence and return an explicit failure state for deliberate operator review.

## Exact path and content controls

Only these paths are permitted:

```text
lib/regulatory/benchmark-applicability-mappings.ts
lib/regulatory/historical-grounding-policy.ts
lib/regulatory/source-coverage-citation-packages.ts
```

For each file, independently verify:

- the path is present exactly once in the live bundle;
- the path resolves inside the isolated worktree;
- no path segment is a symlink, junction, or device;
- the base bytes loaded from `plan.baseCommitSha:path` reproduce `beforeChecksum`;
- the written bytes reproduce the exact bundle content and `afterChecksum`;
- Git reports exactly the authorized changed path set;
- the created commit reports exactly the authorized changed path set;
- the created commit has exactly one parent equal to `plan.baseCommitSha`;
- the created commit message exactly equals `bundle.commitMessage`; and
- reading each path back from the created commit reproduces the exact bundle bytes and checksum.

Do not normalize whitespace, line endings, encoding, final newlines, or formatting. The bundle bytes are authoritative.

## Git operation requirements

Permitted Git operations are limited to inspection, fetch of exact `origin/main`, temporary worktree creation, deterministic branch creation, exact file staging, one commit, exact-tree inspection, non-force push, and temporary worktree cleanup.

The adapter must never expose or invoke:

- `git push --force` or `--force-with-lease`;
- ref deletion;
- branch reset or rebase;
- merge, cherry-pick, revert, tag, release, or stash operations;
- global or system Git configuration changes;
- credential printing or credential-helper changes;
- submodule commands;
- arbitrary Git config keys supplied by callers; or
- pathspecs outside the exact authorized files.

Push the exact created commit to the exact deterministic target branch using a non-force refspec. A race that creates the branch remotely must cause the push to fail.

## GitHub pull-request requirements

Use authenticated GitHub CLI/API operations only for the exact repository and exact deterministic branch.

Before PR creation, re-fetch and require remote `main` to remain exactly `plan.baseCommitSha`. Then create exactly one pull request with:

- base `main`;
- head equal to `plan.targetBranch`;
- head commit equal to the exact created commit;
- title exactly equal to `bundle.pullRequestTitle`;
- body exactly equal to `bundle.pullRequestBody`; and
- auto-merge disabled.

Write the body to a private temporary file rather than passing it through a shell or command-line string.

After creation, independently refetch the pull request and require:

- a positive safe integer PR number;
- canonical URL `https://github.com/siricarsen-cmd/subshield/pull/<number>`;
- exact base branch, head branch, and head SHA;
- exact title and body;
- open state;
- not draft unless the bundle explicitly and immutably requires draft state;
- no auto-merge request; and
- no existing or duplicate PR for the same head branch.

Store the GitHub server-issued PR creation time as the adapter's trusted clock evidence. Do not use a caller-supplied timestamp or the local system clock for the execution receipt.

## State machine and idempotency

The internal production adapter must enforce one ordered execution state:

```text
created -> preflighted -> branch-created -> files-written -> committed -> checked -> pushed -> pr-created -> completed
```

Reject method calls that are repeated, skipped, reordered, or reference different branches, commits, paths, or metadata than the live plan and bundle.

Preflight must be mutation-free. No branch, worktree, file, commit, push, or PR may be created until every repository, identity, remote-main, live-capability, path, byte, checksum, required-check, and prohibited-action validation succeeds.

A retry must refuse any existing local branch, remote branch, or PR unless a future separately authorized recovery phase reproduces every remote identity and receipt field. This phase must not implement automatic recovery or overwrite behavior.

## Result and receipt boundaries

Return the existing executor result types without adding merge authority.

A successful receipt must retain:

```text
applicationStatus: not-applied
customerFacingStatus: benchmark-only
mergeStatus: not-authorized
authorizationStatus: audit-evidence-only
```

The receipt must identify the authenticated adapter principal, exact remote-main base, exact branch and commit, exact files and checks, exact PR identity and metadata fingerprint, and GitHub server time.

Stored or cloned receipts remain audit evidence only. They cannot be reloaded as live execution or merge authorization.

## Required adversarial regressions

Add focused tests using temporary local repositories and a deterministic fake GitHub boundary. Tests must make no live GitHub, government-source, Vercel, Supabase, Stripe, email, or customer-data request.

Prove at minimum:

1. exact successful execution through the production high-level runner;
2. original-live plan and bundle required;
3. authenticated principal is mandatory for the production adapter;
4. blank, failed, spoofed, or insufficient-permission principals fail before mutation;
5. exact repository/default branch/origin normalization;
6. fork, alternate host, URL rewrite, and lookalike repository refusal;
7. remote `main` must exactly equal `plan.baseCommitSha` at preflight;
8. remote `main` movement before push refuses push;
9. remote `main` movement before PR creation refuses PR creation;
10. active developer branch and working tree remain untouched;
11. isolated worktree containment and cleanup;
12. symlink, junction, traversal, absolute-path, backslash, NUL, and control-character refusal;
13. exact allowed path set and byte/checksum reproduction;
14. extra, missing, duplicated, reordered, or unrelated changes refused;
15. exact single commit parent and exact commit message;
16. exact check allowlist and argv mapping;
17. shell metacharacters and command injection never execute;
18. every check is bound to the exact created commit;
19. failed checks produce no push or PR;
20. push is non-force and races fail closed;
21. exact PR metadata and canonical URL refetch;
22. draft, closed, wrong-head, wrong-body, duplicate, or auto-merge PR refusal;
23. GitHub server PR time used as trusted receipt time;
24. no raw command output, environment value, or secret appears in results or receipts;
25. partial branch/push/PR failures return explicit non-success outcomes;
26. deterministic successful inputs reproduce deterministic identities;
27. cloned/serialized receipts lose live capability; and
28. adapter and high-level API expose no merge, deployment, release, tag, secret, payment, database, authentication mutation, email, or customer-record capability.

## Validation

Wire the focused production-adapter suite into `npm run test:regulatory` and run:

```text
npm run test:regulatory:implementation-production-adapter
npm run test:regulatory
npm run test:accuracy
npx tsc --noEmit
npm run build
git diff --check
```

Hosted CI must pass on the exact final PR head before merge.

## Review and merge boundary

This production-adapter pull request may be merged only after:

- all adversarial tests pass;
- both hosted workflows pass on the exact head;
- TypeScript and production build pass;
- all automated review findings are resolved;
- one fresh final automated review of the exact head returns no findings; and
- Carsen's standing authorization to continue this controlled project remains in effect.

Merging this adapter implementation does not invoke it, apply a regulatory update, merge an implementation PR, or deploy SubShield.

## Later phases

After this adapter is merged, continue in separate phases:

1. controlled in-process orchestration that connects the live approved plan/bundle to the production adapter without loading stored authority;
2. deliberate one-time merge authorization that independently verifies the exact implementation PR, current base, fresh required checks, human authorization, and unchanged metadata;
3. an end-to-end dry-run/simulation proving unchanged and transport-only source retrievals create no packet, substantive changes create pending review, and no customer-facing behavior changes without the complete authorized path; and
4. operational monitoring and recovery procedures that never weaken fail-closed controls.
