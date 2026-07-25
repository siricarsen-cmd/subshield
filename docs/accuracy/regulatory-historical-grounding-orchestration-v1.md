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

A benchmark citation package is ready only when every declared official source has an explicit date basis, that date is grounded in exact document text, one approved source snapshot covers that date, and the citation package cites that exact selected snapshot.

## No default governing date

The orchestrator does not assign one universal date to every regulatory source.

Each source in each QA-C and QA-D mapping has an explicit policy. Most subcontract clause comparisons use the verified subcontract execution date. A source that serves a different legal or procurement function may use another basis. For example, DFARS 252.204-7025 is a solicitation provision, so the QA-C CMMC mapping uses the verified solicitation issue date for that source while the related contract clause and program rule use the verified subcontract execution date.

A source without an explicit policy is refused. It does not inherit the first available date, the document upload date, the source retrieval date, or another source's date basis.

## Ready conditions

The orchestration result is `ready` only when all of the following are true:

- the mapping has exactly one benchmark-only historical policy;
- the policy covers every and only the mapping's declared official sources;
- each required contract date resolves to one exact document-grounded date;
- each source has one approved, citation-eligible, non-proposed snapshot effective on that date;
- the source history contains no unresolved gap, overlap, or version metadata defect;
- the citation package is itself valid and source-complete; and
- every citation uses the exact snapshot selected for that source and date.

The result remains benchmark-only even when every condition passes.

## Refusal conditions

The citation package is refused when:

- no policy exists for the mapping;
- a policy omits a declared source, adds an undeclared source, duplicates a source, or lacks a rationale;
- a required solicitation, execution, modification, proposal, or performance date is absent or ambiguous;
- approved historical coverage is unavailable for the grounded date;
- source versions contain gaps, overlaps, missing effective dates, or improper supersession boundaries;
- the package is partial or otherwise invalid;
- a citation uses today's snapshot when an older snapshot was selected;
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
- a missing solicitation date cannot borrow the execution date;
- multiple execution dates refuse execution-governed sources;
- missing historical coverage and effective-date gaps refuse the package;
- partial citation packages are rejected; and
- a policy belonging to another mapping cannot govern the request.

## Customer-facing boundary

This orchestration is not connected to the live analyzer or report renderer. It does not change risk findings, ranking, signing posture, redlines, payments, authentication, stored customer records, deployment, or production configuration.

Before customer-facing integration, SubShield still requires complete reviewed current and historical source archives, production-safe retrieval and storage, source-specific excerpt extraction from the selected snapshots, report language for unresolved dates and historical gaps, privacy/security review, and explicit approval for analyzer behavior changes.
