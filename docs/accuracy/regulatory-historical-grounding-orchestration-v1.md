# Regulatory Historical Grounding Orchestration v1

Status: controlled benchmark foundation  
Product scope: federal government subcontractors reviewing prime-issued subcontract and solicitation packages  
Customer-facing status: not enabled

## Purpose

This phase joins four previously separate controls:

1. the regulatory applicability mapping;
2. the source-specific governing-date policy;
3. exact contract-date evidence extraction; and
4. approved historical source-version selection.

A benchmark citation package is ready only when every declared official source has an explicit date basis, that date is grounded in exact document text, one approved source snapshot covers that date, and the citation package is proven to originate from that exact selected snapshot.

## Registered policy authority

The repository's registered historical policy always governs. A caller may supply a policy only as an assertion for audit or transport purposes. The supplied policy must exactly match the registered policy ID, mapping ID, benchmark-only status, source order, source IDs, date bases, and rationales.

A caller cannot clone a policy and change a source from `solicitation-issued` to `subcontract-executed`, or otherwise replace a source-specific date basis. Any difference is refused as an invalid policy before date extraction or source selection occurs.

## No default governing date

The orchestrator does not assign one universal date to every regulatory source.

Each source in each QA-C and QA-D mapping has an explicit policy. Most subcontract clause comparisons use the verified subcontract execution date. A source that serves a different legal or procurement function may use another basis. For example, DFARS 252.204-7025 is a solicitation provision, so the QA-C CMMC mapping uses the verified solicitation issue date for that source while the related contract clause and program rule use the verified subcontract execution date.

A source without an explicit policy is refused. It does not inherit the first available date, the document upload date, the source retrieval date, or another source's date basis.

## Ready conditions

The orchestration result is `ready` only when all of the following are true:

- the mapping has exactly one registered benchmark-only historical policy;
- any supplied policy exactly matches the registered policy;
- the policy covers every and only the mapping's declared official sources;
- each required contract date resolves to one exact document-grounded date;
- each source has one approved, citation-eligible, non-proposed snapshot effective on that date;
- the source history contains no unresolved gap, overlap, or version metadata defect;
- the citation package is itself valid and source-complete; and
- every citation's complete provenance and excerpt match the exact selected snapshot.

The result remains benchmark-only even when every condition passes.

## Citation provenance

Matching a snapshot ID is not sufficient. Every citation is checked against the selected immutable snapshot for:

- source ID;
- snapshot ID;
- version identifier;
- effective date;
- snapshot checksum;
- canonical URL;
- canonical title;
- citation label;
- retrieval timestamp;
- exact excerpt presence in the selected source text; and
- excerpt checksum.

A citation cannot retain the selected snapshot ID while carrying another version's checksum, version label, effective date, URL, title, retrieval receipt, or text. Multiple excerpts from one source are permitted only when each excerpt is tied to the same selected snapshot and appears exactly in that snapshot.

## Refusal conditions

The citation package is refused when:

- no registered policy exists for the mapping;
- a supplied policy differs from the registered policy;
- a policy omits a declared source, adds an undeclared source, duplicates a source, or lacks a rationale;
- a required solicitation, execution, modification, proposal, or performance date is absent or ambiguous;
- approved historical coverage is unavailable for the grounded date;
- source versions contain gaps, overlaps, missing effective dates, or improper supersession boundaries;
- the package is partial or otherwise invalid;
- a citation uses today's snapshot when an older snapshot was selected;
- citation metadata or excerpt content does not match the selected snapshot;
- a package mixes multiple snapshots for one source; or
- a package contains a source for which no historical version was selected.

The refusal result preserves the source-specific date resolution, historical selection status, missing facts, and explanation. It does not silently select the nearest version or substitute current text.

## CMMC benchmark example

For the QA-C future-CMMC-by-notice mapping:

- DFARS 252.204-7025 uses `solicitation-issued`;
- DFARS 252.204-7021 uses `subcontract-executed`; and
- 32 CFR part 170 uses `subcontract-executed`.

A solicitation issued before a source-version boundary may therefore require an older 252.204-7025 snapshot even when the subcontract was executed after the boundary and the other sources require newer snapshots. Retrieval chronology does not affect the selection.

## Regression coverage

The benchmark proves that:

- all twelve QA-C and QA-D mappings have source-complete benchmark-only policies;
- source-specific dates can select different historical versions within one mapping;
- a current citation is rejected when the grounded date selects an older snapshot;
- a caller cannot override the registered solicitation-date policy;
- a selected snapshot ID cannot conceal another version's provenance;
- foreign excerpt text is rejected even when its checksum is internally consistent;
- a missing solicitation date cannot borrow the execution date;
- multiple execution dates refuse execution-governed sources;
- missing historical coverage and effective-date gaps refuse the package;
- partial citation packages are rejected; and
- a policy belonging to another mapping cannot govern the request.

## Customer-facing boundary

This orchestration is not connected to the live analyzer or report renderer. It does not change risk findings, ranking, signing posture, redlines, payments, authentication, stored customer records, deployment, or production configuration.

Before customer-facing integration, SubShield still requires complete reviewed current and historical source archives, production-safe retrieval and storage, source-specific excerpt extraction from the selected snapshots, report language for unresolved dates and historical gaps, privacy/security review, and explicit approval for analyzer behavior changes.
