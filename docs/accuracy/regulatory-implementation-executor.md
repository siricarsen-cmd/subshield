# Controlled Regulatory Implementation Executor

Status: implementation phase specification  
Product scope: federal subcontractors reviewing prime-issued subcontract and solicitation packages  
Customer-facing status: not enabled

## Purpose

This phase consumes one original in-process live regulatory implementation plan and its original live implementation pull-request bundle, re-verifies every authorization and Git boundary, materializes the exact authorized registry changes on a dedicated branch, runs the required checks, creates one reviewable non-auto-merge pull request, and returns an immutable execution receipt.

The executor does not merge, deploy, approve evidence, change customer reports, or authorize customer-facing use.

## Required live inputs

Execution requires both:

- the original live-authorized `RegulatoryRegistryImplementationPlan`; and
- the original live `RegulatoryImplementationPullRequestBundle` produced from that plan.

Cloned, serialized, stored, loaded, checksum-consistent, or caller-reconstructed plans and bundles are audit evidence only and cannot authorize execution.

The executor must validate the plan and bundle together before any repository mutation.

## Repository adapter boundary

Repository effects must be isolated behind a narrow adapter so focused regressions can use an in-memory implementation without live GitHub or network access. The production adapter may use local Git and an authenticated GitHub client, but the command may invoke only these operations:

1. identify the repository and current default branch;
2. read an exact file blob at an exact commit;
3. verify whether the deterministic target branch or pull request already exists;
4. create the exact target branch from the reviewed base commit;
5. write the exact bundle file contents;
6. create one commit with the deterministic bundle commit message;
7. run the exact required checks against that commit;
8. push the branch; and
9. open one pull request with the deterministic title and body, with auto-merge disabled.

No force-push, merge, deployment, tag, release, secret, environment, issue, customer record, database, payment, authentication, email, or unrelated file operation is allowed.

## Preflight requirements

Before creating a branch, the executor must prove:

- the plan is valid and still live-authorized;
- the bundle is valid, still live, and exactly reproduces from the plan;
- the repository identity is exactly the configured SubShield repository;
- the reviewed base commit exists and is the exact expected base;
- the target branch name equals the deterministic plan and bundle branch;
- no target branch or equivalent execution pull request already exists;
- the bundle file set exactly equals the authorized plan file set;
- every base file checksum and byte content matches the reviewed Git commit;
- every after-file checksum and byte content matches the live bundle;
- no customer-facing, analyzer, authentication, payment, database, email, deployment, or unrelated path is present; and
- required checks and prohibited actions exactly match the validated plan.

Any preflight failure must produce no branch, commit, push, pull request, or execution receipt.

## Controlled mutation sequence

After successful preflight, the executor must:

1. create the deterministic branch from the reviewed base commit;
2. write only the exact authorized files with the exact bundle contents;
3. verify the worktree contains no extra, missing, or unrelated changes;
4. create one commit with the exact deterministic commit message;
5. verify the commit tree contains only the expected file changes and exact after checksums;
6. run every required check against that exact commit;
7. refuse pull-request creation unless every check succeeds;
8. push the branch without force; and
9. open one pull request with the exact deterministic title and body, auto-merge disabled.

A check failure may leave a local or remote review branch, but must create no successful execution receipt and no merge authorization. The result must clearly distinguish preflight refusal, check failure, push failure, pull-request failure, and successful review-pull-request creation.

## Execution receipt

A successful execution produces a deeply frozen, checksum-bound receipt containing:

- repository identity;
- plan ID and checksum;
- bundle ID and checksum;
- reviewed base commit;
- deterministic target branch;
- created implementation commit SHA;
- exact changed paths and before/after checksums;
- exact required checks and per-check conclusions;
- pull-request number and canonical URL;
- exact pull-request title/body fingerprint;
- execution timestamp and executor principal;
- `applicationStatus: not-applied`;
- `customerFacingStatus: benchmark-only`;
- `mergeStatus: not-authorized`; and
- a statement that the receipt is audit evidence, not reusable authorization.

Only the original in-process successful receipt receives a module-local live capability for a later merge-authorization phase. Cloning, serialization, storage, loading, or checksum reproduction destroys that capability.

## Idempotency and retry safety

The executor must refuse ambiguous or partial repeats. A retry may return an existing successful result only when the remote branch, exact commit tree, exact commit message, exact pull-request metadata, and all check evidence reproduce the same plan and bundle. Otherwise it must fail closed and require manual cleanup.

The adapter must never overwrite an existing branch, force-update a ref, edit an existing pull request, or create multiple pull requests for the same plan/bundle execution.

## Regression requirements

Permanent regressions must prove:

- a complete live plan and bundle can create one exact non-auto-merge review pull request;
- cloned plans and bundles cannot execute;
- invalid or checksum-consistent reconstructed plans cannot execute;
- wrong repository identity and wrong default branch are refused;
- missing, stale, or mismatched base commits and files are refused before mutation;
- extra, missing, duplicate, reordered, or unrelated file changes are refused;
- an existing target branch or execution pull request is refused;
- branch creation occurs only after all preflight checks;
- exact commit tree and file checksums reproduce the bundle;
- required checks run against the created commit and all must succeed;
- failed checks create no pull request or successful receipt;
- pull-request metadata cannot be altered;
- auto-merge remains disabled;
- cloned or serialized receipts lose live capability;
- no merge or deployment operation exists in the adapter or executor; and
- no analyzer, report, customer upload, authentication, payment, database, email, or production configuration changes occur.

## Required validation

The implementation pull request must run:

```text
npm run test:regulatory
npm run test:accuracy
npx tsc --noEmit
npm run build
```

## Next phase

A separate merge-authorization phase must independently query GitHub, verify the exact reviewed execution commit and pull request, require fresh successful checks and deliberate human authorization, and issue a one-time live merge authorization. The executor and its stored receipt must never merge code by themselves.
