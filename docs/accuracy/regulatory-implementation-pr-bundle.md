# Controlled Regulatory Implementation PR Bundle

Status: benchmark-only implementation foundation  
Product scope: federal subcontractors reviewing prime-issued subcontract and solicitation packages  
Customer-facing status: not enabled

## Purpose

This layer converts one original in-process, live-authorized regulatory implementation plan into a deterministic pull-request bundle. The bundle describes the exact authorized registry-file replacements, target branch, commit message, pull-request record, required checks, and merge prohibitions.

It does not write a Git branch, open a pull request, merge code, deploy, or change customer reports.

## Required live authorization

A bundle can be created only from the original live implementation-plan object produced from the complete human-approved evidence chain. A cloned, serialized, loaded, or caller-reconstructed plan is audit evidence only and cannot create a bundle.

The bundle itself also receives module-local in-memory branding. Serialization or cloning destroys that live status.

## Exact target boundary

Only these canonical registry files are allowed:

- `lib/regulatory/benchmark-applicability-mappings.ts`
- `lib/regulatory/historical-grounding-policy.ts`
- `lib/regulatory/source-coverage-citation-packages.ts`

The input file set must exactly equal the authorized target-file set. Extra files, missing files, duplicate paths, analyzer files, payment code, authentication code, database code, and deployment files are refused.

Each input is also byte-compared with the file blob read independently from the local Git object database at `plan.baseCommitSha:path`. A caller-provided checksum is not trusted. That reviewed blob must also byte-match the current canonical registry source, and every target's live registry fingerprint must equal the step's approved `currentFingerprint`. This transitive binding refuses an older base containing an older target even when the caller supplies that old blob exactly. Pre-edited content, including unrelated comments or whitespace, and unavailable or mismatched base commits are refused before any replacement is applied.

## Deterministic replacement

For each approved registry step, the generator:

1. identifies the exact registry object by its registered ID; citation-template steps require the unique canonical `COVERAGE_REQUESTS` association and insert or replace the mapping-keyed complete package in `APPROVED_COVERAGE_PACKAGE_OVERRIDES`, while historical-policy steps locate exactly one string/comment-aware, balanced `createPolicy(mappingId, ...)` call;
2. requires exactly one matching object or controlled override registry;
3. finds the complete object boundary using string/comment-aware balanced scanning;
4. renders only the approved JSON-serializable proposed value;
5. replaces only the identified object or bounded override-registry range; and
6. records before and after SHA-256 file checksums.

Missing IDs, duplicate IDs, overlapping ranges, malformed objects, no-op files, and checksum mismatches are refused.

Historical policies are rendered back into the editable `createPolicy(mappingId, sourcePolicies)` representation. Source policies use explicit JSON-compatible objects, preserving the runtime mapping identity, policy identity, benchmark-only status, date bases, and rationales without depending on the optional `executionSource(...)` shorthand.

Citation overrides contain the complete bounded, approved `RegulatoryCitationPackage`, including exact excerpts, source identity, extraction anchors, snapshot identity, checksum provenance, and every package field included in the approved transition. An empty override registry changes no runtime package: each unchanged mapping continues through the canonical `COVERAGE_REQUESTS` plus approved-fixture build path. Override identities, benchmark-only status, package schema, and mapping/package IDs are validated before use.

After rendering, bundle construction and plan-bound validation independently reconstruct every emitted mapping, historical policy, and citation override and require its canonical fingerprint to reproduce the approved `proposedFingerprint`. Recomputed file and bundle checksums cannot make semantically incorrect generated code trusted.

## Exact plan-bound audit validation

Plan-bound validation does not trust serialized file bodies, caller-selected before checksums, or a reproducible bundle checksum. It independently reloads every authorized file from `plan.baseCommitSha:path`, groups only the plan's exact transitions for that file, reapplies the production renderer, and regenerates the complete expected file array. The supplied bundle must exactly match the regenerated path order, before and after checksums, changed registry IDs, and full file contents. Extra allowed files, unplanned overrides, unrelated byte changes, missing files, duplicate transitions, or reordered output are refused.

The bundle ID, commit message, pull-request title, and pull-request body are also regenerated from the plan through the same deterministic metadata builder used by construction. A checksum-consistent clone cannot remove the no-merge warning, add deployment instructions, or alter other human-facing review metadata. Audit validation can perform these checks without recreating the original live-plan capability; only initial bundle construction requires that live authorization.

## Pull-request record

The generated record includes:

- deterministic branch name from the approved plan;
- exact base commit reviewed by the human reviewer;
- exact plan and review checksums;
- authorized registry identities and fingerprints;
- deterministic commit title and pull-request title/body;
- the full required validation command list; and
- explicit statements that merge and deployment are not authorized.

## Non-applied boundary

Every bundle remains:

- `applicationStatus: not-applied`;
- `customerFacingStatus: benchmark-only`; and
- `mergeStatus: not-authorized`.

A later executor must independently reverify the live bundle, base commit, current file checksums, exact target branch, generated file contents, fresh checks, and deliberate merge authorization. A stored bundle or checksum must never serve as a merge credential.

## Regression coverage

The focused benchmark proves that:

- the complete human-approved evidence chain can produce one live implementation plan and one bundle;
- cloning the plan destroys authorization;
- cloning the bundle destroys live bundle status;
- only the exact authorized file set is accepted;
- each changed file has reproducible before/after checksums;
- missing or renamed registry objects block replacement;
- unrelated edits and mismatched reviewed-base contents block construction;
- an exact older Git blob with stale canonical targets blocks construction;
- emitted citation overrides preserve the approved snapshot ID, checksum, excerpt, and proposed fingerprint;
- request-only edits, stale or missing direct overrides, and checksum-recomputed override tampering are refused;
- allowed-but-unplanned files and registry IDs are refused;
- unrelated content plus caller-selected before checksums cannot survive exact regeneration;
- checksum-consistent changes to bundle identity, commit message, PR title, or no-merge PR body are refused;
- caller-added files are refused; and
- serialized content mutation invalidates bundle provenance.

## Safety

This layer does not retrieve government sources, approve evidence, modify the canonical registry, create GitHub branches, open pull requests, merge changes, deploy, or touch customer contracts, authentication, billing, databases, or email.
