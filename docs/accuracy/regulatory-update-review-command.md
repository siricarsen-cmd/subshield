# Controlled Regulatory Update Review Command

Status: controlled regulatory review foundation  
Product scope: federal government subcontractors reviewing prime-issued subcontract and solicitation packages  
Customer-facing status: not enabled

## Purpose

This phase connects the controlled snapshot store, opaque stored-pair verification, regulatory update intake, and immutable review-packet storage through one operator command.

The command does not retrieve a government source, approve a source, apply a registry transition, alter an analyzer conclusion, or change a customer report.

## Controlled sequence

The command performs the following steps in one process:

1. load the latest observed source candidate from the controlled snapshot store;
2. select and verify the most recent earlier approved baseline;
3. reject malformed, stale, rejected, untrusted, or rollback candidates;
4. issue an opaque in-memory stored-pair receipt;
5. run the shared regulatory update-intake engine;
6. create a pending immutable review packet only when substantive or metadata review is warranted; and
7. return a compact operator result with no full source body.

The opaque receipt is never serialized as a reusable trust credential.

## Result statuses

### `packet-stored`

A substantive or metadata-related review packet was created. The packet remains:

- `pending`;
- `not-applied`; and
- `benchmark-only`.

### `no-review-packet`

The candidate was valid, but no packet was warranted. This includes:

- identical later retrievals; and
- transport/markup-only changes.

### `intake-refused`

The stored pair was valid, but the update intake failed a normal request or source-control rule, such as missing requester provenance. No packet is created.

Failures that prevent stored-pair verification—such as missing approved history, rejected candidates, rollback attempts, malformed manifests, or corrupted snapshot files—throw before intake and cannot create a packet.

## Immutable packet behavior

Review packets use checksum-derived canonical paths and create-only writes. Repeating an identical command with the same creation timestamp cannot overwrite the existing packet.

A later approved review state creates a different packet because the intake proposal, readiness state, and packet checksum differ. The prior pending packet remains an immutable record of the earlier review stage.

## Command-line interface

The repository command is:

```text
npm run regulatory:prepare-update-review -- \
  --source <approved-source-id> \
  --requested-by <named-operator>
```

Optional arguments:

```text
--snapshot-root <path>
--packet-root <path>
--created-at <ISO timestamp>
--candidate-snapshot-id <snapshot ID>
```

Default roots:

```text
data/regulatory-snapshots
data/regulatory-update-reviews
```

The CLI prints a compact JSON result. An `intake-refused` result uses exit code 2; storage, verification, or runtime errors use exit code 1.

## Data minimization

The command result contains:

- source ID;
- baseline and candidate snapshot IDs;
- opaque-pair verification checksum;
- intake and difference classifications;
- proposal readiness;
- packet path and checksum when stored;
- refusal reasons; and
- review notes.

It does not contain the full normalized official-source text, raw transport payload, customer contract content, secrets, or credentials.

## Regression coverage

The benchmark proves that:

- a substantive pending stored update creates one pending immutable packet;
- the packet retains `verified-stored-pair` provenance;
- packet output excludes full source text;
- an identical rerun cannot overwrite the packet;
- candidate approval creates a distinct change-set-draft-ready pending packet;
- intake refusal creates no packet; and
- an unchanged later retrieval creates no packet.

## Workflow boundary

This command is not yet connected to the scheduled GitHub source-ingestion workflow. That integration must preserve separate immutable roots for source snapshots and review packets, must not auto-approve or auto-apply any change, and must avoid committing generated regulatory evidence into the repository without an explicit controlled review design.

## Customer-facing boundary

This feature is not connected to the live analyzer, report renderer, customer uploads, authentication, billing, database, or production deployment. It is an operator-facing regulatory review foundation only.
