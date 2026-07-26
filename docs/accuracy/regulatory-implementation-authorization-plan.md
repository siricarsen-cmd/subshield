# Git-Bound Regulatory Registry Implementation Plan

Status: controlled implementation-planning foundation  
Product scope: federal government subcontractors reviewing prime-issued subcontract and solicitation packages  
Customer-facing status: not enabled

## Purpose

This phase converts one live, independently approved regulatory change-set review into an exact implementation plan without editing any registry value.

The plan identifies the current and proposed fingerprints, canonical source files, official evidence IDs, required regressions, required repository checks, deterministic target branch, and prohibited actions. It does not contain an apply function, create a pull request, authorize a merge, change analyzer behavior, or change a customer report.

## Required live authorization

A plan can be built only while the module-local opaque human-review receipt from the original in-process decision is still available.

The following cannot authorize a plan:

- a cloned receipt;
- a serialized review decision;
- a loaded review audit record;
- a release-record checksum;
- a stored implementation plan; or
- a caller-supplied approval flag.

## Git binding

The plan's base commit must be a 40-character lowercase Git SHA and must exactly match the commit identified in the human review's benchmark attestation.

This prevents the plan from silently targeting another registry state. The builder also reads the current in-memory canonical registry and refuses every transition whose `beforeFingerprint` no longer matches.

## Exact implementation targets

Registry kinds map only to these canonical files:

- `mapping` → `lib/regulatory/benchmark-applicability-mappings.ts`
- `historical-policy` → `lib/regulatory/historical-grounding-policy.ts`
- `citation-template` → `lib/regulatory/source-coverage-citation-packages.ts`

A plan cannot redirect a regulatory transition into analyzer, authentication, payment, database, deployment, or unrelated application code.

## Required checks

Every planned implementation pull request must run:

```text
npm run test:regulatory
npm run test:accuracy
npx tsc --noEmit
npm run build
```

The plan records the transition-specific benchmark impact and regression plan in addition to these repository-wide checks.

## Immutable plan behavior

Plans use checksum-derived canonical paths and create-only writes. A second write cannot overwrite an existing plan for the same approved review.

The original in-process plan is branded as live-authorized. Cloning, serializing, storing, or loading it removes that brand permanently. Stored plans remain inspectable audit artifacts only.

## Non-applied boundary

Every plan is fixed to:

- `authorizationStatus: live-human-review-receipt-required`
- `applicationStatus: not-applied`
- `customerFacingStatus: benchmark-only`
- `mergeStatus: not-authorized`

The plan explicitly prohibits applying registry changes outside an implementation pull request, merging without fresh checks and deliberate authorization, treating stored JSON as authorization, and changing customer-facing or sensitive systems from the plan.

## Current limitation

No implementation command or pull-request generator consumes the plan. That future phase must preserve the live authorization boundary, verify the actual Git base commit through GitHub rather than reviewer attestation alone, create a reviewable code diff, run every required check, and require deliberate merge authorization before any canonical registry value changes.
