# Controlled Regulatory Implementation Production Adapter

## Status

This phase adds a narrowly scoped production boundary for the benchmark-only regulatory implementation executor introduced in PR #57.

The adapter remains:

- application status: `not-applied`;
- customer-facing status: `benchmark-only`;
- merge status: `not-authorized`.

It does not merge, deploy, release, tag, approve regulatory evidence, alter analyzer behavior, load stored artifacts as live authority, access customer records, or mutate authentication, payments, databases, email, or deployment configuration.

## Authorized outcome

Only an explicit call with the original in-process live-authorized implementation plan and original in-process live PR bundle may start execution. Stored JSON, a checksum, a cloned object, a service-principal fallback, or caller-supplied identity is not authority.

A successful invocation may perform exactly this sequence:

1. Validate the exact plan, bundle, checksums, three-file set, target branch, and reviewed base.
2. Establish the canonical repository and authenticated GitHub principal.
3. Verify remote `main` equals the reviewed base.
4. Create one isolated temporary Git worktree from that base.
5. Reproduce only the authorized registry files.
6. Create one deterministic single-parent commit.
7. Run the four exact ordered validations.
8. Reverify remote `main`.
9. Atomically create one previously absent implementation branch.
10. Reverify remote `main` again.
11. Open and refetch one exact open, non-draft, non-auto-merge review PR.
12. Return the executor’s checksum-bound audit receipt.

No automatic retry, recovery from stored artifacts, branch overwrite, merge authorization, or deployment follows.

## Public API

The high-level entry point is:

```ts
executeRegulatoryImplementationWithProductionAdapter(plan, bundle, options)
```

Production options require explicit absolute canonical paths for:

- the repository root;
- the Git executable;
- the GitHub CLI executable;
- the GitHub CLI configuration directory containing the operator’s authenticated `github.com` context;
- the exact expected GitHub login deliberately bound by the invocation authorization.

`process.execPath` is used as the trusted Node executable. The adapter never resolves Git, GitHub CLI, npm, npx, TypeScript, or Next.js from an inherited `PATH`.

The real repository adapter class remains internal. The module exports only the high-level runner, result types, options, and a pure non-mutating test surface.

## Repository and identity binding

Production execution requires:

- repository `siricarsen-cmd/subshield`;
- default branch `main`;
- exactly one canonical HTTPS fetch endpoint;
- exactly one canonical effective HTTPS push endpoint;
- no SSH, embedded credentials, alternate host, explicit port, query, fragment, lookalike path, or URL rewrite;
- a non-fork GitHub repository view;
- authenticated repository permission of `WRITE`, `MAINTAIN`, or `ADMIN`;
- a nonblank validated GitHub login;
- an exact case-normalized match between that authenticated login and the expected login bound by the invocation authorization.

The token is obtained from the explicitly configured GitHub CLI context. The same token is used for later GitHub CLI requests and the canonical HTTPS Git transport. The recorded executor principal is derived from that attested login.

The token is never placed in command argv, command labels, errors, receipts, required-check environments, or returned output. Command failures are sanitized.

## Trusted executable boundary

Before authentication or repository mutation, the adapter requires the Git executable, GitHub CLI executable, Node executable, GitHub CLI configuration directory, repository root, and direct test/build tooling to be canonical absolute paths to regular non-symlink files or directories.

Subprocess environments are constructed from a minimal operating-system set. An inherited `PATH` is not copied. Each subprocess receives only a `PATH` assembled from validated executable directories needed for that operation.

Required checks do not invoke npm or npx. The checksum-bound command identities remain unchanged, but they map internally to fixed direct invocations:

- `npm run test:regulatory` → the complete immutable ordered regulatory test file list, executed with trusted Node and the fixed TypeScript loader;
- `npm run test:accuracy` → the two immutable accuracy benchmark files;
- `npx tsc --noEmit` → trusted Node plus `node_modules/typescript/bin/tsc --noEmit`;
- `npm run build` → trusted Node plus `node_modules/next/dist/bin/next build`.

Tests execute from the isolated worktree. The already installed dependency directory is linked into that worktree only after the authorized commit has been created and verified. The link is not staged or committed and is removed with the worktree.

## Local Git configuration isolation

The source checkout must be a canonical primary worktree with a real `.git` directory and real `.git/config` file.

Before any repository operation, the adapter parses that exact local config and accepts only minimal structural keys:

- selected `core.*` repository-format values;
- the one `remote.origin` URL/fetch/push definition;
- structural `branch.<name>.remote` and `branch.<name>.merge` values.

All other local keys fail closed, including:

- `include.*` and `includeIf.*`;
- `filter.*` clean/smudge/process commands;
- `core.attributesFile`;
- `diff.*` or `merge.*` executable drivers;
- `http.curloptResolve`, CA overrides, proxies, cookies, or redirects;
- credentials and helpers;
- SSH or external transport commands;
- URL rewrite rules;
- any duplicate or additional fetch/push endpoint.

The exact local config bytes are SHA-256 fingerprinted. Every later Git operation re-reads the real config file and refuses execution if its bytes, type, or path change after preflight.

Global and system Git configuration are redirected to adapter-owned empty files. System loading is disabled. The adapter also supplies controlled configuration that:

- uses an adapter-owned empty hooks directory for every Git process;
- disables commit/tag signing;
- disables fsmonitor and untracked-cache helpers;
- disables credential helpers and prompts;
- clears inherited HTTP headers, proxies, and cookies;
- requires TLS verification;
- disables redirects;
- denies every protocol except canonical HTTPS;
- neutralizes SSH and external transport commands.

## Exact file and commit construction

Only these paths are authorized:

- `lib/regulatory/benchmark-applicability-mappings.ts`;
- `lib/regulatory/historical-grounding-policy.ts`;
- `lib/regulatory/source-coverage-citation-packages.ts`.

Each path is checked for traversal, absolute paths, backslashes, NUL/control characters, symlinks, junction-like escapes, special files, and non-directory parent components.

The executor independently verifies each reviewed-base checksum and after-content checksum.

Staging does not use `git add`. To prevent repository attributes or clean filters from changing authorized bytes, the adapter:

1. hashes each exact worktree file using `git hash-object -w --no-filters`;
2. reads its reviewed file mode;
3. stages the exact blob with `git update-index --cacheinfo`;
4. verifies the exact staged path set.

The commit has:

- exactly one parent: the reviewed base;
- the exact bundle message;
- exact committed bytes for every authorized file;
- fixed author and committer names/emails;
- a deterministic timestamp normalized from the reviewed base’s strict Git ISO `%cI` value;
- disabled hooks and signing.

Git strict ISO timestamps with `Z` or valid `±HH:MM` offsets are accepted and normalized to UTC. Impossible calendar dates, rollover times, invalid offsets, hour 24, leap-second values, and malformed timestamps fail closed.

## Remote-main and publication controls

The authenticated remote `main` head must equal `plan.baseCommitSha`:

- during preflight;
- immediately before branch publication;
- immediately before PR creation.

If it moves, execution stops. The adapter never rebases, resets, replays, or updates the plan.

Publication uses only the exact absent-ref lease:

```text
--force-with-lease=refs/heads/<exact-target>:
```

The empty expected value makes publication create-only. It fails if another actor created the target ref after preflight, even when that ref points to the reviewed base. No ordinary force push, existing-value lease, `+` refspec, ref deletion, overwrite, retry, reset, or recovery capability exists.

After publication, the hosted ref is refetched and must equal the exact created commit.

## Pull-request verification and trusted time

The adapter creates one PR using a private restrictive body file, then refetches it and requires exact:

- canonical URL and positive number;
- base branch;
- head branch and head commit;
- title and body;
- `OPEN` state;
- non-draft state;
- no auto-merge request.

The receipt uses GitHub’s `createdAt`. Valid UTC RFC 3339 values with zero to nine fractional digits are normalized to milliseconds. Impossible dates, rollover clock values, offsets, and noncanonical values are rejected.

## Required-check environment

Checks run with a fresh adapter-owned private home, XDG directories, cache, and empty npm configuration files. The adapter does not inherit caller `HOME`, `USERPROFILE`, `.npmrc`, npm environment settings, npm script-shell settings, or an arbitrary `PATH`.

The production build receives only established non-secret CI placeholders. GitHub credentials are never present in the check environment.

`package.json` in the isolated worktree must remain byte-for-byte equal to the reviewed base before every check. The direct fixed invocation mapping is code-controlled and cannot accept a caller-selected script, file, flag, or shell command.

## State, failures, and cleanup

The internal operation order is enforced. Repeated, skipped, reordered, mismatched, or concurrent-capability use fails closed.

Normal executor failures remain explicit structured results such as preflight, check, push, PR, or receipt failure.

Unexpected adapter execution or cleanup exceptions return a deeply frozen `production-boundary-failed` result with stage:

- `execution`;
- `cleanup`;
- `execution-and-cleanup`.

The result contains only sanitized generic errors and preserves the prior structured executor result when one exists. This ensures a caller does not lose evidence that a branch or PR may already exist.

Cleanup requires successful `git worktree remove --force`, successful `git worktree prune`, independent verification that the worktree path is gone, and removal of private temporary files. Fatal Git exit 128 is not accepted as success. Cleanup failure is reported through the structured production boundary rather than masking prior evidence.

The adapter does not automatically delete a partially published remote branch or PR.

## Validation gate

Before merge, the exact hosted head must pass:

- focused production-adapter adversarial regressions;
- implementation-executor regressions;
- full regulatory suite;
- analyzer accuracy suite;
- TypeScript validation;
- production build with established non-secret placeholders;
- diff checks;
- fresh security-focused automated review.

Review threads may be resolved only after the exact hosted implementation and hosted checks prove their fixes. Merge and deployment remain separate deliberate owner-authorized actions.
