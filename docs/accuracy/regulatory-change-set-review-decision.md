# Human Review of Stored Regulatory Change-Set Drafts

Status: controlled registry change-review foundation  
Product scope: federal government subcontractors reviewing prime-issued subcontract and solicitation packages  
Customer-facing status: not enabled

## Purpose

This phase records an explicit independent human approval or rejection of one verified stored regulatory change-set draft.

It does not apply a registry change, alter analyzer behavior, approve a government source, change a customer report, or deploy anything. An approval creates only a non-applied release record that may support a future explicit code-change pull request.

## Required evidence chain

A decision requires all of the following in one process:

1. the immutable update-review packet;
2. the immutable stored change-set draft;
3. the opaque verified stored baseline/candidate pair;
4. a fresh opaque draft-reverification receipt;
5. an identified independent human reviewer and stable reviewer principal;
6. substantive review notes; and
7. explicit review of the required registry-impact kinds.

The decision process reloads and deterministically rebuilds the draft before accepting a review.

## Separation of duties

The change-set reviewer must be different from:

- the human who approved the official-source snapshot; and
- the person or process that prepared the change-set draft.

Display labels and stable principals are stored separately. The readable display label may include a role suffix, but the principal must match the label's identity portion and must not contain a role suffix. Separation of duties compares normalized principals, not the complete display strings. Therefore, `Morgan Ellis, source reviewer` and `Morgan Ellis, registry reviewer` are treated as the same person.

Automation, bots, workflows, monitors, and preparers cannot be named as the approving reviewer.

## Approval requirements

Approval requires explicit review of:

- applicability mapping impact;
- historical governing-date policy impact; and
- citation-template impact.

It also requires at least two substantive notes and a reviewer attestation identifying successful regulatory and analyzer benchmark workflow runs for one repository commit.

The attestation is deliberately labeled `reviewer-attested-not-machine-verified`. It is audit provenance, not a reusable CI trust credential. A future implementation pull request must still run and pass the repository's required checks.

## Rejection requirements

A rejection requires an identified independent reviewer, stable principal, substantive notes, and at least one reviewed registry-impact kind. Rejections cannot contain release timestamps or benchmark approval evidence.

## Release-record boundary

An approved decision creates a separate immutable release record containing:

- the draft and source identities;
- reviewer display and principal provenance;
- before and after registry fingerprints;
- official source IDs;
- benchmark impact and regression plans; and
- `not-applied` and `benchmark-only` boundaries.

The release record does not contain a complete official-source body and cannot apply its transitions. Approval and release timestamps must be exact ISO instants, must follow their prerequisite evidence, and cannot be materially in the future.

## Finality and storage

Decision records use create-only storage. The canonical path is bound to the draft checksum rather than the review date, so a later approval or conflicting rejection cannot create a second final decision for the same draft.

Loaded records validate their canonical path, checksum, decision envelope, release record, stable-principal separation-of-duties provenance, benchmark attestation, and data-minimization boundary.

Serialized review records are audit artifacts, not trust credentials. The original in-process human decision object may issue one module-local opaque authorization receipt. Cloning, serializing, storing, or loading the decision destroys that authorization capability permanently.

A future implementation step cannot regain human approval merely by rebuilding the packet, source pair, draft, checksums, or review JSON. It must require a renewed independent human decision in the same controlled process or a separately designed cryptographically signed or Git-bound authorization mechanism.

## Command-line interface

The operator command is:

```text
npm run regulatory:review-change-set-draft -- \
  --source <approved-source-id> \
  --packet-path <source-relative-packet-path> \
  --draft-path <source-relative-draft-path> \
  --decision approved|rejected \
  --reviewed-by <identified-human-display-label> \
  --reviewer-principal <stable-human-principal> \
  --reviewed-at <exact-ISO-timestamp> \
  --note <substantive-note> \
  --review-kind mapping|historical-policy|citation-template
```

Approval additionally requires:

```text
--release-created-at <exact-ISO-timestamp>
--validation-commit <40-character-lowercase-Git-SHA>
--regulatory-run-id <positive-GitHub-run-ID>
--analyzer-run-id <different-positive-GitHub-run-ID>
--validation-completed-at <exact-ISO-timestamp>
```

Optional controlled roots and result output:

```text
--snapshot-root <path>
--packet-root <path>
--draft-root <path>
--review-root <path>
--result-file <create-only-path>
```

The parser rejects unknown options, missing values, blank values, duplicate single-value options, duplicate review kinds, unsupported review kinds, and rejection attempts that include approval-only evidence. The decision validator rejects a principal that does not reproduce from the reviewer display label.

## Current limitation

No code in this phase applies an approved release record. A future implementation path must require an explicit code-change pull request, current registry fingerprints, complete regulatory and analyzer checks, a new human authorization boundary that cannot be reconstructed from stored JSON, and deliberate merge authorization before any registry value can change.
