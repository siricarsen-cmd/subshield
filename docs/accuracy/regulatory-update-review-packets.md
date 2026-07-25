# Regulatory Update Review Packets

Status: controlled benchmark foundation  
Product scope: federal government subcontractors reviewing prime-issued subcontract and solicitation packages  
Customer-facing status: not enabled

## Purpose

A regulatory update intake may identify changed official text, affected QA-C or QA-D mappings, stable extraction anchors, or anchor drift. This phase converts eligible intake results into a small, immutable review packet that can be inspected and retained without copying the complete government source into another artifact.

The packet does not approve the candidate source, apply a registry transition, alter an analyzer conclusion, or change a customer report.

## Eligible intake results

A packet may be created only for a substantive or regulatory-metadata review outcome:

- `proposal-prepared`;
- `manual-review-required`; or
- `observation-only` when the source change is metadata/content related and still warrants review.

Unchanged, transport-only, or refused intake results do not create review packets.

## Packet contents

Each packet retains:

- source ID;
- approved baseline and candidate snapshot IDs;
- requester and creation provenance;
- difference classification and bounded line excerpts;
- affected immutable-registry fingerprints;
- deterministic citation impact results;
- an optional non-applied update proposal;
- refusal and review notes;
- pending review status;
- benchmark-only and not-applied boundaries; and
- a deterministic packet checksum.

## Data minimization

Review packets explicitly prohibit nested fields named `text`, `rawBody`, or `fileContents`. They do not retain the full normalized source body or original transport payload.

Exact citation excerpts needed to explain a changed registered passage may remain inside a proposal. Those excerpts are bounded by the controlled extraction limits already assigned to each citation locator.

## Immutable persistence

Packets are serialized into canonical JSON before their checksum is calculated. This prevents optional/undefined fields from producing a checksum that changes after JSON persistence.

Stored packet paths use the controlled form:

```text
<source-id>/<created-date>-<checksum-prefix>.json
```

Storage uses create-only semantics. An existing packet cannot be overwritten. Loading revalidates the path, source scope, schema, boundaries, forbidden payload fields, and complete packet checksum.

## Refusal controls

The packet validator refuses:

- unsupported schema versions;
- blank or unsafe source IDs;
- packet IDs not tied to the source;
- missing or identical baseline/candidate IDs;
- candidate IDs not tied to the source;
- malformed timestamps or blank requester provenance;
- ineligible intake or difference statuses;
- missing proposals for proposal-prepared intake;
- proposal source/snapshot identity mismatches;
- packets that predate their intake proposal;
- applied or customer-facing status;
- invalid or non-reproducible checksums;
- full-source payload fields;
- path traversal; and
- source/path scope mismatches.

## Anchor-drift packets

A `manual-review-required` intake remains eligible for a packet. The packet preserves the exact anchor failure and the non-applied manual-redesign proposal, which contains no usable citation-template transitions.

This supports review without silently broadening or replacing the missing official-source anchors.

## Regression coverage

The benchmark proves that:

- eligible metadata intake creates a pending packet;
- nested packet structures are frozen;
- packet checksums survive JSON persistence;
- full source text does not enter the packet;
- controlled paths round-trip successfully;
- duplicate writes are refused;
- traversal and source-scope errors are refused;
- content tampering is detected;
- proposal identity mismatches are detected;
- nested full-source fields are detected;
- unchanged, transport-only, and refused intake cannot create packets;
- manual anchor drift creates a pending packet without transitions; and
- packets cannot predate their intake proposal.

## Customer-facing boundary

This feature is not connected to the live analyzer, report renderer, customer uploads, authentication, billing, database records, or production deployment. It is a review and evidence-management foundation only. A future workflow connection must preserve pending status, approved-evidence requirements, immutable storage, independent review, complete benchmarks, and explicit release control.
