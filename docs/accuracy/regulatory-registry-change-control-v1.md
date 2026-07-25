# Regulatory Registry Change Control v1

Status: controlled benchmark foundation  
Product scope: federal government subcontractors reviewing prime-issued subcontract and solicitation packages  
Customer-facing status: not enabled

## Purpose

The immutable regulatory registry prevents valid mapping, policy, and citation-template IDs from being reused with altered content. This phase defines the controlled process for proposing a legitimate future change when an official FAR, DFARS, NIST, labor, CUI, CMMC, or related source changes—or when benchmark review identifies a justified correction.

A change set validates and records a proposed transition. It does not mutate the canonical registry, change analyzer behavior, deploy code, or enable customer-facing citations.

## Required transition record

Every registry transition records:

- registry kind: mapping, historical policy, or citation template;
- registered mapping ID;
- current immutable fingerprint;
- proposed after value;
- reproduced after fingerprint;
- nonblank reason;
- reviewed official-source evidence;
- benchmark impact;
- regression plan; and
- benchmark-only status.

The before fingerprint must match the registry at validation time. This prevents a stale change set from overwriting a newer approved transition. The after fingerprint must reproduce from the proposed value and must differ from the current fingerprint; no-op changes are refused.

## Official-source evidence

Every transition requires at least one evidence record containing:

- an approved source-catalog ID;
- retained source snapshot ID;
- citation label;
- SHA-256 source checksum; and
- a nonblank explanation of how the source supports the proposed registry change.

Unknown source IDs, blank provenance, and malformed checksums are refused. The change-control record does not treat a general web page, model memory, or unsupported reviewer assertion as official evidence.

## Coordinated source-list changes

Mappings, governing-date policies, and citation templates all declare the official sources used for one benchmark topic.

When a proposed change adds or removes a source in any one of those registries, the same change set must include all three registry kinds for that mapping. Their proposed after-source sets must match exactly.

This prevents changes such as:

- adding a FAR clause to a mapping without assigning its governing date;
- removing a DFARS source while leaving its citation template active; or
- changing a citation template to use a source the applicability mapping never declared.

Source-preserving edits, such as a reviewed locator clarification, may update one registry kind when the other registered source sets remain unchanged.

## Review states

Change sets have one of three review states:

- `pending`: no final reviewer fields are permitted;
- `approved`: reviewer, exact ISO review timestamp, and nonblank review notes are required; or
- `rejected`: the same final-review provenance is required.

The approval and rejection helpers create deeply frozen copies. They do not modify the pending object or the canonical registry.

## Release record

An approved change set can produce an immutable release record containing:

- change-set identity;
- approver and approval timestamp;
- review notes;
- before and after fingerprints;
- official source IDs;
- reasons, benchmark impacts, and regression plans; and
- `applicationStatus: not-applied`.

The release record is an audit artifact, not an application mechanism. Applying a future approved change will require a separate controlled code change, full benchmark run, review, and merge.

## Refusal conditions

Validation refuses:

- blank or invalid change-set metadata;
- duplicate kind-and-ID transitions;
- unknown registry entries;
- stale before fingerprints;
- after fingerprints that do not reproduce;
- no-op transitions;
- changed identities;
- missing or unknown official-source evidence;
- malformed evidence checksums;
- blank reasons, impacts, or regression plans;
- customer-facing status;
- pending sets with fake final-review fields;
- approved or rejected sets without reviewer provenance;
- malformed mapping, policy, or citation-template structures; and
- uncoordinated or mismatched source-list changes.

## Regression coverage

The benchmark proves that:

- a source-preserving, officially supported template change can be proposed;
- stale, fabricated, and no-op fingerprints are rejected;
- missing, unknown, and malformed evidence is rejected;
- fake or missing review provenance is rejected;
- duplicate transitions and changed identities are rejected;
- a mapping-only source removal is rejected;
- coordinated three-registry source changes with matching after-source sets pass;
- mismatched coordinated source sets are rejected;
- approval and release records are deeply frozen;
- release records remain `not-applied`; and
- approval and release creation do not mutate any canonical registry fingerprint.

## Customer-facing boundary

This phase is not connected to the live analyzer or report renderer. It does not change findings, ranking, signing posture, redlines, customer records, payments, authentication, deployment, or production configuration.

Before a change can affect customers, the approved transition must be implemented through a separate reviewed pull request, all regulatory and analyzer benchmarks must pass, source snapshots and historical windows must remain valid, privacy/security impact must be reviewed, and explicit approval must be obtained for customer-facing analyzer behavior changes.
