# Regulatory Update Intake and Source Difference Pipeline

Status: controlled benchmark foundation  
Product scope: federal government subcontractors reviewing prime-issued subcontract and solicitation packages  
Customer-facing status: not enabled

## Purpose

This phase handles the point between official-source retrieval and controlled registry change review. It compares a newly retrieved official-source snapshot with the retained approved baseline, identifies what actually changed, determines which QA-C or QA-D regulatory mappings are affected, and prepares a non-applied citation-template transition draft when deterministic extraction remains valid.

It does not approve a source, apply a registry change, change an analyzer conclusion, or alter a customer report.

## Required inputs

Every intake requires:

- one retained approved baseline snapshot;
- one later pending or approved candidate snapshot for the same official source;
- a named requester;
- an ISO creation timestamp; and
- complete checksum and retrieval provenance.

Rejected snapshots, proposed regulations, invalid checksums, mismatched source IDs, duplicate snapshot IDs, or candidates retrieved before the baseline are refused.

## Difference classes

The pipeline separates:

1. **Unchanged** — normalized text, raw payload, regulatory metadata, and retained transport metadata match.
2. **Transport-only** — official normalized text and regulatory metadata match, but markup, payload, redirect, ETag, or similar retrieval details changed.
3. **Metadata-only** — normalized official text matches, but retained version, effective-date, citation, or other regulatory metadata changed.
4. **Content-changed** — the normalized official text checksum changed.

Content changes include a bounded line-level review record with common prefix/suffix counts, changed line ranges, and short before/after excerpts. Large source bodies are never copied wholesale into the intake result.

## Registry impact analysis

The pipeline reads the immutable mapping, governing-date policy, and citation-template registries. For every mapping that declares the changed source, it records the current fingerprints and finds each registered citation locator that depends on that source.

The candidate snapshot is then tested with the existing registered extraction anchors:

- start anchor;
- end anchor;
- required in-passage anchors; and
- maximum excerpt length.

This is a benchmark-only preview. A pending snapshot does not become client-citation eligible merely because its anchors can be evaluated.

## Proposal behavior

When all registered anchors remain deterministic, the pipeline can prepare citation-template transition drafts containing:

- current and proposed fingerprints;
- the complete proposed citation-template value;
- exact candidate snapshot evidence;
- changed locators;
- benchmark impact;
- regression plan; and
- explicit `not-applied` and `benchmark-only` status.

The proposal never assumes that the existing applicability conclusion or governing-date policy remains correct. Both remain mandatory human-review questions.

A pending candidate is marked `awaiting-snapshot-approval`. An approved candidate may be marked `ready-for-controlled-change-set-draft`, but the result is still not applied and must pass the separate registry change-control process.

## Anchor drift

Automatic proposal preparation stops when any registered anchor is missing, duplicated, reversed, overlong, or otherwise non-deterministic in the candidate snapshot.

The result becomes `manual-review-required`, contains the precise anchor failures, and includes no proposed citation-template transition. The system does not broaden anchors, select approximate text, or silently substitute a different passage.

## Observation-only outcomes

No registry transition is prepared when:

- the candidate is unchanged;
- only transport/markup details changed; or
- the official source changed but no registered citation template requires a deterministic transition.

These outcomes may still warrant retention or source review, but they cannot alter customer-facing conclusions.

## Regression coverage

The benchmark proves that:

- later identical retrievals produce no change;
- transport-only changes remain observation-only;
- metadata changes prepare non-applied citation-template drafts;
- substantive in-passage changes are deterministically re-extracted;
- line-level differences remain bounded;
- pending and approved candidates receive different readiness states;
- missing anchors force manual review;
- invalid checksums are refused;
- proposed and rejected sources are refused;
- stale retrievals are refused; and
- requester provenance is mandatory.

## Customer-facing boundary

This feature is not connected to the live analyzer, report renderer, customer uploads, authentication, billing, database records, or deployment configuration. It cannot modify the immutable regulatory registry. A future customer-facing integration would still require approved official snapshots, independent regulatory review, complete benchmark validation, explicit release approval, and safe failure language for unavailable or ambiguous source history.
