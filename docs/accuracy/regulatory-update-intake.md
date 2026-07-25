# Regulatory Update Intake and Source Difference Pipeline

Status: controlled benchmark foundation  
Product scope: federal government subcontractors reviewing prime-issued subcontract and solicitation packages  
Customer-facing status: not enabled

## Purpose

This phase handles the point between official-source retrieval and controlled registry change review. It compares a newly retrieved official-source snapshot with the retained approved baseline, identifies what actually changed, determines which QA-C or QA-D regulatory mappings are affected, and prepares a non-applied citation-template transition draft when deterministic extraction remains valid.

It does not approve a source, apply a registry change, change an analyzer conclusion, or alter a customer report.

## Required inputs

Every intake requires:

- one baseline that exactly matches the immutable retained approved-evidence registry;
- one later pending or approved candidate snapshot for the same official source;
- a candidate snapshot ID tied to its source ID;
- a named requester;
- an ISO creation timestamp after retrieval; and
- complete checksum and retrieval provenance.

Rejected snapshots, proposed/superseded/archived source states, invalid checksums, mismatched source IDs, duplicate snapshot IDs, premature review timestamps, pending snapshots with final-review fields, or candidates retrieved before the baseline are refused.

## Difference classes

The pipeline separates:

1. **Unchanged** — normalized text, raw payload, regulatory metadata, and retained transport metadata match.
2. **Transport-only** — official normalized text and regulatory metadata match, but markup, payload, redirect, ETag, or similar retrieval details changed.
3. **Metadata-only** — normalized official text matches, but retained version, effective-date, citation, or other regulatory metadata changed.
4. **Content-changed** — the normalized official text checksum changed.

Content changes include a bounded line-level review record with common prefix/suffix counts, changed line ranges, and short before/after excerpts. Large source bodies are never copied wholesale into the intake result.

## Registry impact analysis

The pipeline first validates the immutable registry itself, then reads the mapping, governing-date policy, and citation-template registries. For every mapping that declares the changed source, it records the current fingerprints and finds each registered citation locator that depends on that source.

The candidate snapshot is then tested with the existing registered extraction anchors:

- start anchor;
- end anchor;
- required in-passage anchors; and
- maximum excerpt length.

This is a benchmark-only preview. A pending snapshot does not become client-citation eligible merely because its anchors can be evaluated.

## Proposal behavior

When all registered anchors remain deterministic, the pipeline can prepare citation-template transition drafts containing:

- current and proposed fingerprints;
- the complete structurally validated proposed citation-template value;
- exact candidate snapshot evidence;
- changed locators;
- benchmark impact;
- regression plan; and
- explicit `not-applied` and `benchmark-only` status.

The proposal never assumes that the existing applicability conclusion or governing-date policy remains correct. Both remain mandatory human-review questions.

A pending candidate is marked `awaiting-snapshot-approval`. An approved-looking candidate that has not yet been retained in the immutable approved-evidence registry is marked `awaiting-approved-evidence-registration`. Only an exact retained approved candidate may become `ready-for-controlled-change-set-draft`, and even then the result is not applied and must pass the separate registry change-control process.

## Anchor or package drift

Automatic proposal preparation stops when any registered anchor is missing, duplicated, reversed, overlong, or otherwise non-deterministic in the candidate snapshot. It also stops when the regenerated proposed citation package fails structural validation.

The result becomes `manual-review-required`, contains the precise failures, and releases no usable citation-template transition. The system does not broaden anchors, select approximate text, silently substitute a different passage, or accept an invalid package.

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
- proposed transition packages remain structurally valid;
- line-level differences remain bounded;
- pending and approved-but-unretained candidates receive conservative readiness states;
- caller-supplied approval fields cannot bypass approved-evidence retention;
- altered approved-looking baselines are refused;
- missing anchors force manual review;
- invalid checksums are refused;
- proposed, superseded, archived, and rejected sources are refused;
- pending snapshots cannot claim final reviewer provenance;
- stale or future-dated intake sequencing is refused; and
- requester provenance is mandatory.

## Customer-facing boundary

This feature is not connected to the live analyzer, report renderer, customer uploads, authentication, billing, database records, or deployment configuration. It cannot modify the immutable regulatory registry. A future customer-facing integration would still require approved official snapshots, independent regulatory review, complete benchmark validation, explicit release approval, and safe failure language for unavailable or ambiguous source history.
