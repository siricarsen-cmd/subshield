# Controlled Regulatory Implementation Executor

Status: benchmark-only implementation foundation; production adapter not enabled  
Product scope: federal subcontractors reviewing prime-issued subcontract and solicitation packages  
Customer-facing status: not enabled

## Purpose

This layer consumes one original in-process live regulatory implementation plan and its original live implementation pull-request bundle, re-verifies every authorization and repository boundary, materializes only the exact authorized registry changes through a narrow adapter, runs the required checks against the created commit, opens one reviewable non-auto-merge pull request, and returns an immutable execution receipt.

The executor does not merge, deploy, approve evidence, change customer reports, or authorize customer-facing use.

## Implemented foundation

`lib/regulatory/registry-implementation-executor.ts` now provides:

- strict live-capability checks for the original plan and bundle;
- independent plan and bundle validation before any adapter mutation;
- exact SubShield repository and `main` default-branch enforcement;
- reviewed-base existence and byte/checksum verification;
- exact authorized path enforcement for the three canonical regulatory registry files;
- deterministic branch, file, commit, check, push, and pull-request sequencing;
- explicit preflight, execution, check, push, and pull-request failure results;
- a deeply frozen checksum-bound success receipt; and
- module-local receipt branding that is lost when the receipt is cloned or serialized.

The production GitHub/local-Git adapter and any automatic execution command are intentionally not included in this phase. The adapter contract is exercised through a deterministic in-memory regression fixture. No customer-facing regulatory value is applied by this module.

## Required live inputs

Execution requires both:

- the original live-authorized `RegulatoryRegistryImplementationPlan`; and
- the original live `RegulatoryImplementationPullRequestBundle` produced from that plan.

Cloned, serialized, stored, loaded, checksum-consistent, or caller-reconstructed plans and bundles are audit evidence only and cannot authorize execution.

The executor validates the plan and bundle together before any repository mutation.

## Repository adapter boundary

Repository effects are isolated behind `RegulatoryImplementationRepositoryAdapter`. The adapter exposes only the operations needed to:

1. identify the repository and default branch;
2. prove the reviewed commit exists;
3. read an exact file blob at an exact commit;
4. determine whether the deterministic branch or pull request already exists;
5. create the exact target branch from the reviewed base commit;
6. write the exact bundle file contents;
7. inspect the worktree and created commit tree;
8. create one commit with the deterministic bundle commit message;
9. run each exact required check against that commit;
10. push the branch without force; and
11. open one pull request with the deterministic title and body and auto-merge disabled.

The adapter contains no merge, deployment, tag, release, secret, environment, customer-record, database, payment, authentication, email, or unrelated repository operation.

## Preflight requirements

Before creating a branch, the executor proves:

- the plan is valid and still live-authorized;
- the bundle is valid, still live, and exactly reproduces from the plan;
- the repository identity is exactly `siricarsen-cmd/subshield`;
- the default branch is exactly `main`;
- the reviewed base commit exists;
- the target branch name equals the deterministic plan and bundle branch;
- no target branch or equivalent execution pull request exists;
- the bundle file set exactly equals the authorized plan file set;
- every base file checksum and byte content matches the reviewed Git commit;
- every after-file checksum and byte content matches the live bundle;
- no customer-facing, analyzer, authentication, payment, database, email, deployment, or unrelated path is present; and
- required checks and prohibited actions exactly match the validated plan.

Any preflight failure produces no branch, commit, push, pull request, or execution receipt.

## Controlled mutation sequence

After successful preflight, the executor:

1. creates the deterministic branch from the reviewed base commit;
2. writes only the exact authorized files with the exact bundle contents;
3. verifies the worktree contains no extra, missing, duplicated, or unrelated changes;
4. creates one commit with the exact deterministic commit message;
5. verifies the commit tree and exact after-file bytes/checksums;
6. runs every required check against that exact commit;
7. refuses push or pull-request creation if a required check fails or reports a different commit;
8. pushes the branch without force; and
9. opens one pull request with exact deterministic metadata and auto-merge disabled.

The result clearly distinguishes preflight refusal, repository mutation failure, check failure, push failure, pull-request failure, and successful review-pull-request creation. None of these outcomes grants merge authorization.

## Execution receipt

A successful execution produces a deeply frozen, checksum-bound receipt containing:

- repository identity;
- plan ID and checksum;
- bundle ID and checksum;
- reviewed base commit;
- deterministic target branch;
- created implementation commit SHA;
- exact changed paths and before/after checksums;
- exact required checks and per-check conclusions bound to the created commit;
- pull-request number and canonical URL;
- exact pull-request title and body fingerprint;
- execution timestamp and executor principal;
- `authorizationStatus: audit-evidence-only`;
- `applicationStatus: not-applied`;
- `customerFacingStatus: benchmark-only`; and
- `mergeStatus: not-authorized`.

Only the original in-process successful receipt receives module-local live capability for a later phase. Cloning, serialization, storage, loading, or checksum reproduction destroys that capability.

## Idempotency and retry safety

The executor refuses a pre-existing target branch or pull request before mutation. It never overwrites a branch, force-updates a ref, edits an existing pull request, or creates a second pull request for the same in-process execution.

A future production adapter may recognize an existing completed execution only after independently reproducing every remote identity, exact commit tree, exact commit message, pull-request metadata, and check result. That recovery behavior is not enabled by this foundation.

## Regression coverage

`lib/regulatory/__tests__/registry-implementation-executor.test.mjs` uses a narrow in-memory adapter and proves that:

- a complete original live plan and bundle create one exact non-auto-merge review pull request;
- cloned plans and bundles cannot execute;
- cloned receipts lose live capability;
- wrong repository identity, wrong default branch, missing base commits, and mismatched base bytes are refused without mutation;
- existing branches and pull requests are refused without mutation;
- unrelated worktree changes and mismatched commit contents are refused;
- all required checks are bound to the exact created commit;
- failed or mismatched checks create no push or pull request;
- push and pull-request failures produce explicit non-success outcomes;
- altered pull-request metadata and enabled auto-merge are refused;
- deterministic inputs reproduce deterministic commit and receipt identity; and
- the adapter exposes no merge, deployment, release, secret, payment, database, or email capability.

## Required validation

The implementation pull request runs:

```text
npm run test:regulatory:implementation-executor
npm run test:regulatory
npm run test:accuracy
npx tsc --noEmit
npm run build
```

## Next phase

A separate production-adapter phase must implement the narrow repository contract using authenticated local Git and GitHub operations without expanding its capabilities. After that, a separate merge-authorization phase must independently query GitHub, verify the exact reviewed execution commit and pull request, require fresh successful checks and deliberate human authorization, and issue a one-time live merge authorization. The executor and its stored receipt must never merge code by themselves.
