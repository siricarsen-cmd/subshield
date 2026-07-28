# Controlled Regulatory Implementation Invocation and Orchestration

## Status

This phase adds the explicit manual/on-demand operator boundary that connects a newly approved original live regulatory implementation plan and original live pull-request bundle to:

```ts
executeRegulatoryImplementationWithProductionAdapter(...)
```

The orchestration layer remains:

- application status: `not-applied`;
- customer-facing status: `benchmark-only`;
- generated implementation-PR merge status: `not-authorized`.

It may authorize and invoke creation of one tightly controlled regulatory implementation branch and pull request. It does not merge that generated pull request, deploy code, alter customer-facing analyzer behavior, approve evidence, access customer records, or mutate payments, authentication, databases, email, or deployment configuration.

## Who may initiate

The operation is limited to an explicit operator action performed in the same process that still holds:

- the original live-authorized `RegulatoryRegistryImplementationPlan`;
- the original live `RegulatoryImplementationPullRequestBundle`; and
- a configured GitHub CLI context whose authenticated login exactly matches the login named in the one-use authorization.

The production adapter independently verifies the authenticated GitHub login, repository identity, default branch, non-fork status, and `WRITE`, `MAINTAIN`, or `ADMIN` permission before repository mutation.

A caller-supplied display name, stored JSON, reconstructed object, checksum, service-principal fallback, ambient SSH key, or unrelated credential helper is not authorization.

## Exact operator action

The deliberate action is the creation of one in-process authorization with:

```ts
createRegulatoryImplementationInvocationAuthorization(plan, bundle, request)
```

The request must contain:

- an exact ISO authorization timestamp;
- the expected GitHub login;
- canonical absolute repository, Git, GitHub CLI, GitHub CLI configuration, and audit-output paths;
- the exact plan-and-bundle-bound confirmation returned by:

```ts
buildRegulatoryImplementationInvocationConfirmation(plan, bundle)
```

The confirmation binds:

- the plan checksum;
- the bundle checksum;
- the reviewed base commit; and
- the exact target branch.

The authorization is deeply frozen, checksum-bound, retained in a `WeakSet`, and linked through a `WeakMap` to the original live plan, original live bundle, and exact runtime configuration. A serialized copy can be audited but cannot be used to execute.

## One-use and no automatic retry

The live authorization is consumed before the production adapter is invoked.

After consumption:

- the same authorization cannot be replayed;
- stored or cloned copies are not live;
- a scheduler, delayed callback, CLI reconstruction, or stored-artifact loader cannot restore it;
- no automatic retry, reset, rebase, branch overwrite, branch deletion, or PR deletion occurs.

A later attempt requires a new explicit in-process authorization. Existing branch/PR protections in the executor and production adapter still fail closed if a partial hosted mutation already exists.

## Runtime-path binding

Authorization binds the exact runtime inputs:

- repository root;
- Git executable;
- GitHub CLI executable;
- GitHub CLI configuration directory;
- expected GitHub login; and
- audit-output directory.

Only a fingerprint is retained in the serializable authorization. The actual paths and original live objects remain in the private in-memory binding.

The production adapter continues to perform canonical path, regular-file/directory, Git configuration, transport, token, repository, remote-main, file, commit, check, branch, PR, and cleanup validation.

## Invocation

The operator-controlled invocation is:

```ts
executeRegulatoryImplementationInvocation(plan, bundle, authorization)
```

Before privileged execution it verifies:

1. the authorization is the unused original live authorization;
2. the plan and bundle are the exact original live objects bound to that authorization;
3. the plan and bundle remain valid and live-authorized;
4. plan, bundle, base, and branch identities still match;
5. the runtime fingerprint still matches the authorized paths and expected GitHub login.

It then calls the production adapter with no caller-selected commands, shell strings, scripts, flags, paths, or identities beyond the already-bound options.

## Structured operator results

The orchestration layer presents these top-level outcomes:

- `invocation-refused` — no privileged operation started; authorization remains unconsumed when the binding itself is invalid;
- `invocation-succeeded` — the production adapter returned `success` and the audit file was retained;
- `invocation-failed` — the production adapter returned a structured preflight, execution, check, push, pull-request, receipt, or production-boundary failure, and the audit file was retained;
- `audit-retention-failed` — the production result is preserved, but the evidence-only audit record or file could not be retained.

The complete underlying production result is preserved. This includes a prior structured executor result when the production adapter reports cleanup failure after a branch or PR may already exist.

No failure path automatically deletes, retries, overwrites, rebases, resets, or merges a hosted branch or pull request.

## Audit retention

Every consumed invocation attempts to create one deterministic private audit file with exclusive creation mode.

The audit record includes:

- authorization, plan, bundle, base, branch, and expected-principal identities;
- authorization and recording timestamps;
- the complete sanitized structured production result;
- a checksum over the complete audit payload;
- `auditStatus: evidence-only-not-execution-authority`;
- `applicationStatus: not-applied`;
- `customerFacingStatus: benchmark-only`;
- `mergeStatus: not-authorized`.

Audit files are evidence only. They are not placed in the live authorization `WeakSet`, do not retain the original plan/bundle references, and cannot be loaded as execution authority.

The output directory must already exist as the exact canonical non-symlink directory explicitly bound during authorization. Audit files use `open(..., "wx", 0o600)` and are never overwritten.

## Why there is no reconstructive CLI

This phase intentionally does not add a CLI that loads stored plan, bundle, or authorization JSON.

A CLI that reconstructed those objects would weaken the original-live-object authority boundary. The invocation must occur inside the same deliberate in-process workflow that creates the approved live plan and bundle.

Future operator UI or automation may call the in-process functions, but it must not deserialize stored artifacts into authority or schedule the invocation automatically.

## Preserved separation from merge and deployment

This phase authorizes only creation of a generated regulatory implementation branch and review pull request.

It does not add:

- pull-request merge capability;
- auto-merge;
- deployment;
- release or tag creation;
- production environment changes;
- customer-facing registry application;
- analyzer behavior changes;
- destructive hosted recovery.

A separate later phase must implement deliberate generated implementation-PR merge authorization with fresh exact-head and check verification. Deployment must remain a separate explicit operation after that.

## Validation gate

Before this orchestration phase is merged, the exact hosted head must pass:

- invocation authorization and audit regressions;
- production-adapter adversarial regressions;
- implementation-executor regressions;
- implementation-plan and PR-bundle regressions;
- the full regulatory suite;
- analyzer accuracy benchmarks;
- TypeScript validation;
- production build with established non-secret placeholders;
- changed-file review and a fresh security-focused review.
