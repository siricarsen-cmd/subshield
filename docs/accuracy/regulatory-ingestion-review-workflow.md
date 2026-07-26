# Controlled Regulatory Ingestion and Review Workflow

Status: controlled regulatory review foundation  
Product scope: federal government subcontractors reviewing prime-issued subcontract and solicitation packages  
Customer-facing status: not enabled

## Purpose

This workflow connects scheduled or manually dispatched official-source ingestion to the pending regulatory update-review process. It does not approve a source, apply a registry change, change an analyzer conclusion, or alter a customer report.

## Evidence lifecycle

For every requested official source, the workflow:

1. retrieves the source through the approved catalog and controlled ingestion code;
2. stores a new normalized snapshot, a retrieval observation, or no duplicate evidence according to the immutable snapshot-store rules;
3. writes a separate machine-readable ingestion result;
4. classifies the result into first snapshot, unchanged/transport-only observation, substantive change, or ingestion failure;
5. prepares an immutable pending update-review packet only when a substantive or metadata comparison is possible and warranted;
6. retains snapshots and packets on a dedicated review branch;
7. opens a pull request that requires independent review; and
8. never auto-approves, auto-applies, or auto-merges the regulatory evidence.

## Controlled outcomes

### First snapshot

A first retained snapshot has no earlier approved comparison baseline. It remains pending and is listed as `initial-snapshot-pending-review`. No difference packet is invented.

### Exact duplicate or transport-only retrieval

The snapshot store may deduplicate the retrieval or retain only a retrieval observation. The review batch verifies the controlled manifest state and returns `no-review-packet`. No regulatory transition is prepared.

### Substantive or metadata change with an approved baseline

The batch loads the opaque verified stored pair, runs deterministic source-difference and registered-anchor impact analysis, and stores a pending immutable review packet. The packet remains `not-applied` and `benchmark-only`.

### Change without an approved baseline

The changed snapshot remains pending, but the batch returns `manual-baseline-review-required`. No packet or registry transition is created because a trusted comparison baseline is unavailable.

### Ingestion or review-preparation failure

The workflow uploads available diagnostics and fails before opening a source-update pull request. Partial automation success is not treated as sufficient.

## Pull-request boundary

The automated pull request may contain:

- immutable pending official-source snapshots;
- retrieval observations in controlled manifests; and
- immutable pending update-review packets that exclude complete source bodies.

The pull request body reports packet, first-snapshot, missing-baseline, and no-packet counts. It explicitly requires independent review of source authenticity, normalization, version/effective-date changes, anchor impacts, applicability mappings, historical policies, citation templates, and benchmarks.

The pull request must not be merged merely because the workflow passed.

## Data minimization and security

The review-batch result and update packets do not contain customer contracts, customer uploads, authentication data, payment data, secrets, credentials, or complete official-source bodies. Retrieval uses public approved government sources only.

Generated evidence is isolated under:

```text
data/regulatory-snapshots
data/regulatory-update-reviews
```

The workflow does not access Supabase, Stripe, OpenAI, Resend, customer records, or production deployment configuration.

## Regression requirements

The controlled suite proves that:

- a first snapshot stays pending without a fabricated comparison;
- a substantive change with an approved baseline creates one pending packet;
- transport-only evidence creates no packet;
- output remains data-minimized, not applied, and benchmark-only;
- duplicate source records are refused;
- successful ingestion cannot claim an approved review state; and
- the complete regulatory and analyzer benchmark suites remain green.

## Current limitation

This workflow prepares review evidence only. A separate independently reviewed change-control process is still required before any approved source version, applicability conclusion, governing-date policy, citation template, benchmark expectation, or customer-facing report behavior can change.
