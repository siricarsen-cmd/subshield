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

## Deterministic replacement

For each approved registry step, the generator:

1. identifies the exact registry object by its registered ID;
2. requires exactly one matching object;
3. finds the complete object boundary using a string/comment-aware brace scanner;
4. renders only the approved JSON-serializable proposed value;
5. replaces only the identified object range; and
6. records before and after SHA-256 file checksums.

Missing IDs, duplicate IDs, overlapping ranges, malformed objects, no-op files, and checksum mismatches are refused.

## Pull-request record

The generated record includes:

- deterministic branch name from the approved plan;
- exact base commit reviewed by the human reviewer;
- exact plan and review checksums;
- authorized registry identities and fingerprints;
- commit title and pull-request title/body;
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
- caller-added files are refused; and
- serialized content mutation invalidates bundle provenance.

## Safety

This layer does not retrieve government sources, approve evidence, modify the canonical registry, create GitHub branches, open pull requests, merge changes, deploy, or touch customer contracts, authentication, billing, databases, or email.
