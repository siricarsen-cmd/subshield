# Verified Stored-Pair Regulatory Update Intake

Status: controlled regulatory review foundation  
Product scope: federal government subcontractors reviewing prime-issued subcontract and solicitation packages  
Customer-facing status: not enabled

## Purpose

The regulatory update-intake engine originally trusted only immutable benchmark approved-evidence fixtures. Live retained sources require a separate trust path, but a public boolean such as `trusted: true` would allow callers to bypass baseline verification.

This phase adds a second intake entry point that accepts only the opaque in-memory pair issued by the controlled snapshot-store verifier.

## Two isolated trust paths

### Benchmark approved-evidence intake

`prepareRegulatoryUpdateIntake` keeps its existing behavior. The baseline and any approved candidate must exactly match the immutable benchmark approved-evidence registry.

### Verified stored-pair intake

`prepareVerifiedStoredRegulatoryUpdateIntake` requires a `VerifiedStoredRegulatoryUpdatePair` that passes the module-local WeakSet brand and complete fingerprint verification. It does not accept a caller-supplied trust flag, serialized receipt, clone, or matching-looking object.

Both entry points use the same private validation, difference, impact, deterministic extraction, package-validation, and proposal logic.

## Trust provenance

Every proposal now records one explicit trust source:

- `benchmark-approved-evidence`; or
- `verified-stored-pair`.

This field is audit provenance only. It does not change the benchmark-only, not-applied, independent-review, or customer-facing boundaries.

## Readiness behavior

For a verified stored pair:

- a pending retained candidate remains `awaiting-snapshot-approval`;
- an approved candidate verified and retained by the controlled store may become `ready-for-controlled-change-set-draft`;
- mapping conclusions and historical governing-date policies remain mandatory human-review subjects; and
- every generated transition remains non-applied.

The ordinary intake path does not trust the same stored snapshot objects when the opaque receipt is absent.

## Shared validation

Storage verification does not bypass ordinary intake controls. Both paths still require:

- a named requester;
- an ISO intake timestamp after candidate retrieval;
- distinct source-bound snapshot IDs;
- an approved baseline;
- candidate status exactly `pending` or `approved`;
- no final review provenance on pending candidates;
- valid snapshot checksums and official-source provenance;
- current/interim/corrected source status;
- candidate retrieval after baseline retrieval;
- valid approved-candidate review timing;
- intact immutable registries;
- deterministic citation anchors; and
- structurally valid proposed citation packages.

## Regression coverage

The benchmark proves that:

- an opaque pending stored pair enters update intake;
- its proposal records `verified-stored-pair` provenance;
- pending readiness remains conservative;
- the proposal remains benchmark-only and non-applied;
- the ordinary intake path refuses the same snapshots without the receipt;
- cloning the pair destroys trust;
- requester validation still applies;
- an approved retained stored candidate becomes change-set-draft ready; and
- mapping and historical-policy review are not skipped.

## Customer-facing boundary

This phase is not connected to the live ingestion workflow, analyzer, report renderer, customer uploads, authentication, billing, database, or deployment. It only creates a safe bridge between already-verified stored source pairs and the existing benchmark-only update-intake engine.
