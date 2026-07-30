# Deliberate Regulatory Implementation PR Merge Authorization

## Status

This specification defines the next controlled phase after regulatory implementation invocation/orchestration. It authorizes at most one deliberate merge of one generated regulatory implementation pull request. It does not authorize automatic merging, customer-facing registry application, deployment, release, tagging, branch rewriting, or destructive recovery.

## Product and trust boundary

SubShield remains exclusively a federal government subcontract risk-review tool for subcontractors reviewing prime-issued subcontract and solicitation packages. The merge layer must preserve the existing benchmark-only, not-applied regulatory boundary unless a later, separately reviewed phase explicitly changes that boundary.

A generated regulatory implementation pull request may be merged only after the system has re-established the complete evidence chain and exact hosted state. Stored JSON, cloned objects, reconstructed receipts, caller-supplied booleans, display names, PR numbers, URLs, branch names, SHA values, reviews, check summaries, or audit files are evidence only and cannot become live merge authority.

## Required original live evidence

Authorization construction must require the original in-process live objects that already carry opaque module-local authority:

1. the original live-authorized `RegulatoryRegistryImplementationPlan`;
2. the original live `RegulatoryImplementationPullRequestBundle`;
3. the original live `RegulatoryImplementationExecutionReceipt` produced by the controlled executor for that plan and bundle.

The implementation must validate all three objects independently and together. The execution receipt must bind the exact repository, reviewed base commit, deterministic target branch, generated commit SHA, exact PR number and canonical URL, exact authorized file set and checksums, exact required check sequence, authenticated executor principal, and `autoMergeEnabled: false`.

The existing invocation audit record may be retained as evidence, but neither it nor any serialized copy may substitute for the original live objects above.

## Hosted preauthorization inspection

Merge authorization creation must perform a fresh hosted inspection through a deliberately narrow production adapter. The adapter must authenticate its own GitHub principal from the protected GitHub CLI configuration and must not trust caller-supplied identity.

Before creating live authorization, it must verify at least:

- repository is exactly `siricarsen-cmd/subshield`;
- default branch is exactly `main`;
- authenticated GitHub principal is stable, normalized, and has sufficient merge permission;
- the PR number and canonical URL exactly match the execution receipt;
- the PR is open, not draft, and has no auto-merge request;
- base branch is exactly `main`;
- head branch is exactly the receipt target branch;
- hosted head SHA is exactly the receipt commit SHA;
- current remote `main` is exactly the reviewed base commit and has not drifted;
- the generated commit has exactly one parent, the reviewed base commit;
- the PR diff contains exactly the authorized regulatory registry files and no others;
- each changed file's hosted content and before/after checksums reproduce the plan, bundle, and execution receipt;
- required checks are fresh, complete, successful, ordered, and bound to the exact hosted head;
- the exact-head security/review evidence is current and not stale relative to the hosted head;
- no unresolved P1, P2, correctness, security, or test-quality review thread remains;
- the PR has not been replaced, retargeted, force-pushed, closed, or already merged.

If the repository cannot provide sufficiently strong exact-head review evidence, authorization must refuse rather than infer approval.

## Delegated operator authority

Carsen's standing delegation must not be represented by a caller-controlled boolean, display name, free-form label, or unverified environment value.

The merge authorization request must contain an exact operator confirmation string derived by the trusted module from immutable identifiers, including at least:

- plan checksum;
- bundle checksum;
- execution receipt checksum;
- exact PR number and canonical URL;
- exact reviewed base SHA;
- exact hosted head SHA;
- authenticated GitHub principal;
- deterministic merge method;
- audit-authentication key identifier.

The request may identify the expected GitHub login, but the adapter must independently authenticate and match it before authorization and again immediately before merge.

## Live one-use authorization

The module must create an opaque, frozen, checksum-bound `RegulatoryImplementationMergeAuthorization` with private module-local binding. A serialized, cloned, spread, parsed, loaded, or reconstructed authorization must never be live.

The private binding must retain the original live plan, bundle, and execution receipt; exact runtime paths; exact authenticated-principal expectation; exact hosted snapshot; audit output location; copied audit-authentication key; and a private monotonic creation observation.

Authorization must be one use. It must be consumed before the hosted merge mutation. There is no automatic retry. Replay must refuse. Any terminal freshness or exact-state refusal must permanently invalidate the authorization, delete its private binding, and zero copied key material.

Use the same hardened five-minute lifetime model as invocation authorization:

- exact ISO `authorizedAt` validation;
- no material future timestamp beyond the existing five-minute skew tolerance;
- no timestamp older than five minutes at creation;
- private process-monotonic lifetime capped at five minutes from object creation;
- refusal if monotonic time moves backward;
- exact five-minute boundary remains usable;
- future wall-clock skew must never extend real authority beyond five monotonic minutes.

## Immediate premerge revalidation

Immediately before consumption and merge, the adapter must re-fetch the hosted PR and repository state. It must compare the fresh state against the private authorization snapshot and the original live evidence.

Refuse on any change, including:

- PR head changed;
- base changed;
- remote `main` drifted;
- branch replaced or deleted;
- PR closed, converted to draft, or already merged before the authorized attempt;
- auto-merge enabled;
- files changed;
- file content/checksum drift;
- required checks absent, pending, skipped unexpectedly, stale, failed, or attached to another commit;
- review evidence stale or no longer clean;
- unresolved qualifying review thread;
- authenticated principal changed;
- repository permission weakened;
- runtime path or GitHub CLI configuration drift.

The implementation must not silently update the branch, rebase, merge `main`, reset, force-push, reopen, recreate, or replace the PR to recover from drift.

## Deterministic merge operation

The adapter must expose only the narrow merge action required for this phase. It must not add generic repository administration, deployment, release, tag, billing, database, authentication, email, customer-record, or secret-management capabilities.

Requirements:

- GitHub auto-merge is prohibited;
- use one deterministic repository-approved merge method: an atomic fast-forward is authorized only when the generated head is exactly one commit whose sole parent is the reviewed base;
- use GitHub's atomic multi-ref update with `beforeOid` guards for both remote `main` at the reviewed base SHA and the generated branch at the exact reviewed head SHA; advance only `main`, keep the generated branch unchanged, and set `force=false` for both updates;
- do not delete the generated branch automatically;
- do not rewrite history;
- do not retry automatically after any ambiguous or partial hosted mutation;
- do not treat a local command exit alone as proof of merge success.

After the atomic ref request returns, re-fetch the PR, generated branch, and remote `main`. Verify the PR's indirect merged state, exact merged head identity, unchanged generated branch, resulting default-branch state, and that the fast-forwarded commit retains the reviewed base as its sole parent and the reviewed head tree. If GitHub reports a partial or ambiguous result, preserve all evidence and return a structured failure requiring operator review.

A race in which the PR becomes already merged must be represented explicitly. The implementation must distinguish a verified already-merged exact state from an ambiguous or mismatched merged state and must never attempt destructive recovery.

## Merge receipt and audit evidence

Every terminal result must be a deeply frozen, exact-shape, checksum-bound structured record.

A successful merge receipt must retain at least:

- schema version and receipt ID;
- authorization ID/checksum;
- plan, bundle, and execution receipt IDs/checksums;
- repository and authenticated GitHub principal;
- exact PR number and canonical URL;
- base branch and reviewed base SHA;
- head branch and exact premerge head SHA;
- exact authorized file/check evidence fingerprints;
- exact-head review evidence fingerprint;
- deterministic merge method;
- merge request time and trusted hosted verification time;
- merge commit SHA;
- postmerge remote-main SHA;
- structured status showing merge completed but customer-facing registry application and deployment remain separately controlled.

The audit record must be HMAC-SHA-256 authenticated with a caller-supplied secret key copied only into protected process memory. The key itself must never appear in authorization objects, receipts, audit files, logs, errors, argv, environment dumps, or repository content. Only a nonsecret key identifier may be serialized.

Audit files must use exclusive private creation in an exact authorized directory. Audit records are evidence only and cannot be replayed as authority.

## Structured results

The public API should distinguish at least:

- authorization refused;
- merge authorization created;
- merge refused before consumption;
- merge authorization consumed and merge succeeded;
- merge authorization consumed and GitHub returned a deterministic refusal;
- ambiguous/partial hosted mutation requiring manual inspection;
- exact already-merged state observed during a race;
- audit retention failed after a known hosted result.

Do not hide a known merge result merely because audit retention failed. Preserve the hosted result and report audit failure separately.

## Separation from customer-facing application and deployment

This phase authorizes only merging the generated benchmark regulatory implementation PR. It must not:

- apply a registry transition to customer analyzer conclusions merely because the PR merged;
- invoke Vercel, enable a deployment, create a release, or promote an environment;
- alter customer contracts, reports, credits, payments, authentication, database, storage, email, or production configuration;
- claim a regulation is currently applicable without the existing evidence and analyzer controls.

Any normal repository integration deployment triggered externally by GitHub remains outside this adapter's authority and must be reported separately. The merge receipt itself must not claim deployment or customer-facing application.

## Corrective follow-up and rollback

The module must never silently revert, reset, force-push, or rewrite a merged regulatory change. A correction requires a new evidence chain, new implementation plan, new bundle, new generated PR, new exact-head review, and new one-use merge authorization. An emergency operational response may stop later customer-facing application, but it must not alter historical audit evidence.

## Required implementation shape

Prefer a narrow new module and focused adapter rather than broadening the existing executor adapter with generic merge power. Expected files are approximately:

- `lib/regulatory/registry-implementation-merge-authorization.ts`;
- `lib/regulatory/registry-implementation-merge-production-adapter.ts`;
- `lib/regulatory/__tests__/registry-implementation-merge-authorization.test.mjs`;
- `lib/regulatory/__tests__/registry-implementation-merge-production-adapter.test.mjs`;
- this specification;
- `package.json` only to wire focused and full regulatory test scripts.

Small extraction of shared hardened GitHub/Git process helpers is acceptable only when it reduces duplicated security-sensitive behavior without broadening capability or weakening existing PR #59-#61 tests.

## Required regression coverage

Focused tests must cover positive and negative behavior, including at least:

- original live plan, bundle, and execution receipt are accepted together;
- cloned/serialized/reconstructed objects cannot authorize;
- caller-controlled approval flags and display names have no authority;
- exact confirmation binding and authenticated principal matching;
- wrong repository, PR number, URL, base, branch, head, file set, file content, checksum, or merge method refusal;
- changed head, replaced branch, main drift, stale review, unresolved P1/P2, and stale/pending/failed/wrong-head checks refusal;
- draft, closed, auto-merge-enabled, and already-merged preauthorization refusal;
- one-use consumption before hosted mutation;
- replay and automatic retry refusal;
- five-minute monotonic lifetime, backward-clock invalidation, exact boundary, and future-skew nonextension;
- exact expected-head merge request and deterministic merge method;
- no branch deletion, rebase, reset, force-push, auto-merge, deployment, release, or unrelated API call;
- successful postmerge re-fetch and receipt reproduction;
- mismatched or ambiguous already-merged state refusal;
- partial hosted mutation evidence preservation;
- audit HMAC validation, tamper detection, exclusive retention, secret exclusion, and key zeroing;
- all outputs deeply frozen and exact-shape validated;
- existing invocation, production-adapter, executor, bundle, plan, regulatory, and analyzer accuracy behavior remains unchanged.

## Validation before development PR merge

Run and report the exact results of:

1. focused merge-authorization tests;
2. focused merge production-adapter tests;
3. all existing implementation plan/bundle/executor/production-adapter/invocation tests;
4. `npm run test:regulatory`;
5. `npm run test:accuracy`;
6. `npx tsc --noEmit`;
7. the configured production build using established nonsecret placeholders;
8. `git diff --check`;
9. exact changed-file inspection;
10. a fresh exact-head Codex security review.

Every valid P1, P2, correctness, security, and test-quality finding must be resolved, followed by exact-head reruns, before the development PR is merged.
