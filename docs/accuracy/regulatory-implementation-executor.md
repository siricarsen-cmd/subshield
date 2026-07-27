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
- verification that the created commit has exactly the reviewed base as its single parent and the exact bundle commit message;
- exact GitHub pull-request number and canonical repository URL verification;
- receipt time derived from the adapter's narrow trusted clock rather than caller-supplied time;
- receipt attribution derived from the adapter's authenticated principal when supplied, otherwise from the executor's fixed service principal bound to the independently verified repository identity;
- caller-supplied `executedBy` data treated as non-authoritative and ignored;
- explicit preflight, execution, check, push, pull-request, and receipt failure results;
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
9. inspect the created commit's exact parent and message;
10. run each exact required check against that commit;
11. push the branch without force;
12. open one pull request with the deterministic title and body and auto-merge disabled;
13. optionally read one authenticated executor or service principal for receipt attribution; and
14. read one trusted execution-clock instant for receipt provenance.

The optional principal read is strictly read-only. If a production adapter provides it, the returned value must be nonblank and becomes the receipt principal. The benchmark-only in-memory adapter may omit it, in which case the executor records the fixed service identity `service:subshield-regulatory-executor@siricarsen-cmd/subshield` after independently verifying that exact repository. Caller-provided attribution is never trusted.

The adapter contains no merge, deployment, tag, release, secret, environment, customer-record, database, payment, authentication mutation, email, or unrelated repository operation.

## Preflight requirements

Before creating a branch, the executor proves:

- the plan is valid and still live-authorized;
- the bundle is valid, still live, and exactly reproduces from the plan;
- the repository identity is exactly `siricarsen-cmd/subshield`;
- the default branch is exactly `main`;
- the executor principal is obtained from trusted adapter or repository-bound service context and is nonblank;
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
5. verifies that commit has exactly one parent and that parent is the reviewed base commit;
6. verifies the commit message, tree, and exact after-file bytes/checksums;
7. runs every required check against that exact commit;
8. refuses push or pull-request creation if a required check fails or reports a different commit;
9. pushes the branch without force;
10. opens one pull request with exact deterministic metadata and auto-merge disabled;
11. verifies the returned pull-request number and canonical URL identify that exact pull request in `siricarsen-cmd/subshield`; and
12. reads a trusted clock instant before constructing the receipt.

The result clearly distinguishes preflight refusal, repository mutation failure, check failure, push failure, pull-request failure, receipt-provenance failure, and successful review-pull-request creation. None of these outcomes grants merge authorization.

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
- exact pull-request number and canonical repository URL;
- exact pull-request title and body fingerprint;
- execution timestamp from the trusted adapter clock;
- executor principal from trusted adapter or repository-bound service context, never caller input;
- `authorizationStatus: audit-evidence-only`;
- `applicationStatus: not-applied`;
- `customerFacingStatus: benchmark-only`; and
- `mergeStatus: not-authorized`.

Only the original in-process successful receipt receives module-local live capability for a later phase. Cloning, serialization, storage, loading, or checksum reproduction destroys that capability.

## Idempotency and retry safety

The executor refuses a pre-existing target branch or pull request before mutation. It never overwrites a branch, force-updates a ref, edits an existing pull request, or creates a second pull request for the same in-process execution.

A future production adapter may recognize an existing completed execution only after independently reproducing every remote identity, exact commit parent and tree, exact commit message, pull-request identity and metadata, and check result. That recovery behavior is not enabled by this foundation.

## Regression coverage

`lib/regulatory/__tests__/registry-implementation-executor.test.mjs` uses a narrow in-memory adapter and proves that:

- a complete original live plan and bundle create one exact non-auto-merge review pull request;
- cloned plans and bundles cannot execute;
- cloned receipts lose live capability;
- wrong repository identity, wrong default branch, missing base commits, and mismatched base bytes are refused without mutation;
- existing branches and pull requests are refused without mutation;
- unrelated worktree changes and mismatched commit contents are refused;
- a wrong commit parent or altered commit message is refused;
- all required checks are bound to the exact created commit;
- failed or mismatched checks create no push or pull request;
- push and pull-request failures produce explicit non-success outcomes;
- altered pull-request metadata, invalid pull-request number, wrong-repository URL, and enabled auto-merge are refused;
- caller-supplied executor attribution is ignored by the implementation;
- an invalid trusted clock cannot produce a live receipt;
- deterministic inputs reproduce deterministic commit and receipt identity; and
- the adapter exposes no merge, deployment, release, secret, payment, database, or email capability.

The production-adapter phase must add explicit regressions for authenticated-principal success, blank-principal refusal, and failed-principal reads when it makes that optional adapter operation mandatory for live GitHub execution.

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

A separate production-adapter phase must implement the narrow repository contract using authenticated local Git and GitHub operations without expanding its capabilities. It must make authenticated-principal reporting mandatory, prove blank or failed identity reads fail closed, and preserve the fixed service principal only for the benchmark-only in-memory foundation. After that, a separate merge-authorization phase must independently query GitHub, verify the exact reviewed execution commit and pull request, require fresh successful checks and deliberate human authorization, and issue a one-time live merge authorization. The executor and its stored receipt must never merge code by themselves.
