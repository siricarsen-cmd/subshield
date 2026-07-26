# Verified Stored Regulatory Change-Set Draft

Status: controlled registry change-control foundation  
Product scope: federal government subcontractors reviewing prime-issued subcontract and solicitation packages  
Customer-facing status: not enabled

## Purpose

This phase converts a human-approved official-source update packet into a pending citation-template change-set draft. The draft records what a future controlled registry transition could contain, but it does not approve, apply, release, or enable that transition.

## Required evidence chain

A draft can be built only when all of the following exist in one controlled process:

1. an immutable regulatory update review packet;
2. an opaque verified stored-source pair;
3. an earlier approved baseline snapshot;
4. a later human-approved retained candidate snapshot;
5. a packet proposal marked `ready-for-controlled-change-set-draft`;
6. deterministic citation extraction that reproduces from approved evidence; and
7. unchanged source coverage for the affected citation template.

Caller-supplied approval fields, cloned pairs, serialized pairs, pending candidates, stale registry fingerprints, source-list changes, and mismatched packet identities are refused.

## Draft boundary

The draft is always:

- `pending`;
- `not-applied`;
- `benchmark-only`;
- limited to citation-template transitions; and
- marked `requires-opaque-pair-reverification`.

Mapping conclusions and historical governing-date policies remain explicit required human-review subjects. This phase does not fabricate or infer those changes.

## Serialized artifacts are not trust credentials

The stored JSON draft is an audit artifact only. Its checksum and semantic validator can detect ordinary corruption and stale registry state, but serialized content can never recreate the module-local trust brands carried by the source pair or reverification receipt.

Before any later approval or promotion workflow may use a loaded draft, it must:

1. reload the immutable review packet;
2. reload and verify the approved stored baseline/candidate pair;
3. deterministically rebuild the entire draft from those current inputs;
4. confirm the rebuilt draft exactly matches the stored artifact; and
5. obtain a new opaque in-memory reverification receipt.

Cloning or serializing that receipt destroys its trusted status.

## Citation evidence

Every proposed citation-template transition must:

- match the current registered before fingerprint;
- reproduce its after fingerprint;
- preserve the existing mapping identity;
- preserve the source set;
- contain a citation to the human-approved candidate snapshot;
- deterministically reproduce all citations from either the verified stored candidate or the static approved evidence registry; and
- retain benchmark impact and regression plans.

Source-list changes are refused because they require coordinated mapping, historical-policy, and citation-template review.

## Immutable storage

Drafts use checksum-derived canonical paths and create-only writes. An identical draft cannot overwrite an earlier artifact. Loading validates the path, checksum, pending boundary, current registry fingerprints, citation-package structure, evidence identity, and data-minimization rules.

## Data minimization

Drafts retain:

- source, snapshot, packet, and verification identifiers;
- citation-template before and after fingerprints;
- data-minimized official evidence metadata;
- proposed citation packages;
- review questions, benchmark impact, and regression plans; and
- immutable checksums.

They exclude complete official-source bodies, raw transport payloads, customer contracts, customer uploads, authentication data, payment data, secrets, and credentials.

## Regression requirements

The required suite proves that:

- a human-approved verified source candidate creates a pending citation-template draft;
- pending candidates cannot create a draft;
- cloned or fabricated source pairs are refused;
- mapping and historical-policy review remains mandatory;
- complete source bodies do not enter the artifact;
- immutable duplicate writes are refused;
- a loaded draft requires fresh opaque reverification;
- cloned reverification receipts are untrusted;
- a caller can recompute a structurally valid checksum but still cannot bypass deterministic packet/pair reproduction; and
- draft creation does not mutate source review state or apply a registry transition.

## Current limitation

No operator CLI or automated workflow promotes these drafts. A future change-set approval path must preserve independent human review, rerun the full regulatory and analyzer benchmarks, create a separate release record, and remain non-applied until an explicitly authorized implementation change is reviewed and merged.
