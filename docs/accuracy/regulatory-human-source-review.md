# Human Regulatory Source Review Decision

Status: controlled source-evidence review foundation  
Product scope: federal government subcontractors reviewing prime-issued subcontract and solicitation packages  
Customer-facing status: not enabled

## Purpose

This command records an explicit human decision on one exact pending official-source snapshot. It supports `approved` and `rejected` decisions, but it does not make the decision, recommend approval, apply a regulatory registry transition, alter analyzer logic, or change a customer report.

## Human-only boundary

The reviewer must be an identified person. Reviewer names containing automation indicators such as bot, workflow, automation, or GitHub Actions are refused by the source-review controls.

The command requires:

- exact source ID;
- exact stored snapshot ID;
- explicit `approved` or `rejected` decision;
- identified reviewer;
- exact ISO review timestamp;
- one or more substantive review notes;
- one or more exact source-specific text anchors; and
- for approval, verification of all retained version and effective-date metadata.

Approval requires at least two distinct source-specific anchors. Rejection requires at least one.

## Storage and audit controls

The command loads the exact pending snapshot through the controlled manifest and immutable snapshot-file validator. It refuses:

- snapshots not present in controlled storage;
- snapshots with a final review state;
- altered files or manifest mismatches;
- invalid checksums;
- unapproved source IDs;
- automated reviewer identities;
- blank notes or anchors;
- anchors absent from the retained source text;
- metadata mismatches;
- review timestamps before retrieval or materially in the future; and
- approvals that would roll back a later approved source version.

A successful decision updates only the source-review fields in the controlled manifest. The immutable source snapshot file is not overwritten.

## Approval behavior

An approved decision advances `latestApprovedSnapshotId` only when doing so cannot roll back a later approved source version. The result records fingerprints for the persisted snapshot view and manifest.

Approval of source evidence does not automatically:

- change applicability mappings;
- change historical governing-date policies;
- change citation templates;
- apply a prepared update proposal;
- change benchmark expectations;
- alter the analyzer; or
- affect a customer report.

Those remain separate controlled and independently reviewed changes.

## Rejection behavior

A rejected decision records the reviewer, timestamp, notes, and final rejection state. It does not create or change an approved source pointer.

## Command-line interface

```text
npm run regulatory:review-snapshot -- \
  --source <source-id> \
  --snapshot-id <exact-stored-snapshot-id> \
  --decision approved|rejected \
  --reviewed-by <identified-human-reviewer> \
  --reviewed-at <exact-ISO-instant> \
  --note <substantive-review-note> \
  --anchor <exact-source-anchor>
```

Repeat `--note` and `--anchor` as needed.

Approval may also require:

```text
--verified-version <retained-version-identifier>
--verified-effective-date <retained-effective-date>
```

Optional controlled paths:

```text
--snapshot-root <path>
--result-file <create-only-output-path>
```

The argument parser refuses unknown options, duplicate single-value options, missing values, blank values, positional arguments, and decisions other than exact `approved` or `rejected`.

## Data minimization

The command result contains identifiers, reviewer provenance, counts, retained version/effective-date metadata, fingerprints, and status fields. It excludes complete source text, raw transport payloads, customer contracts, customer uploads, secrets, credentials, authentication data, and payment data.

## Regression requirements

The required suite proves that:

- explicit human approval persists provenance and advances the approved pointer;
- explicit rejection does not create an approved pointer;
- final decisions cannot be overwritten;
- automated reviewers cannot approve source evidence;
- retained version/effective-date metadata must be verified for approval;
- review cannot predate source retrieval;
- older pending evidence cannot roll back a later approved version;
- exact controlled snapshot selection is mandatory;
- output is frozen and data-minimized; and
- strict CLI argument handling is preserved.
