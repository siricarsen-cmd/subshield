# Regulatory Historical Version Selection v1

Status: controlled benchmark foundation  
Product scope: federal government subcontractors reviewing prime-issued subcontract and solicitation packages  
Customer-facing status: not enabled

## Purpose

SubShield must not compare an older subcontract to today's FAR, DFARS, labor, NIST, CMMC, CUI, agency, or deviation text unless the current source is proven to be the version that governed the relevant date.

This phase selects a reviewed official-source snapshot from explicit effective-date windows. It does not change current analyzer findings or customer reports.

## Grounded analysis date

Every historical selection requires one explicit `YYYY-MM-DD` analysis date and a recorded basis:

- solicitation issued;
- proposal due;
- subcontract executed;
- modification effective;
- performance started; or
- user specified.

A contract-derived date requires the analyzed document text and at least one exact contract evidence quote. Every supplied quote must exist in that document after whitespace and smart-quote normalization, and at least one verified quote must contain a calendar date that resolves to the stated analysis date. ISO, slash-date, and named-month forms are handled deterministically.

An invented quote, a quote absent from the uploaded text, a real quote containing a different date, or a date supplied without the analyzed document produces `invalid-request`. A user-specified date remains labeled user-provided and is rejected if it is represented as verified contract evidence.

The date basis is preserved in the selection result because different questions may require different dates. For example, solicitation provisions, executed subcontract clauses, and later modifications may not be governed by the same source snapshot.

## Effective windows

A version is active when:

- its verified effective date is on or before the analysis date; and
- the analysis date is earlier than its `expirationOrSupersededDate`, when that boundary is supplied.

The superseded or expiration date is treated as the first date the old version is no longer effective. It is therefore an exclusive boundary. A new version effective on that date is selected instead of the old version.

A snapshot marked `superseded` must retain this first non-effective date. Without that boundary, the selector returns unresolved version metadata rather than treating the obsolete text as effective forever.

Retrieval time, file creation time, and the order in which archives were discovered never determine legal version selection.

## Refusal conditions

The selector refuses to choose a source when:

- the date is invalid or lacks required authority, document text, exact quote, or matching date evidence;
- the source is not in the approved catalog;
- snapshots from different source families are mixed;
- no approved, citation-eligible, non-proposed snapshot exists;
- any approved candidate lacks a verified version identifier or effective window;
- a superseded snapshot lacks its first non-effective date;
- the analysis date predates retained approved history;
- approved windows contain a gap; or
- more than one approved window covers the same date.

SubShield must surface the missing fact or conflict. It must not use retrieval dates, choose the nearest version, assume the latest source is close enough, or silently substitute the current rule.

## Source eligibility

Historical selection considers only snapshots that:

- are stored under the requested approved source ID;
- have completed non-automated review;
- remain eligible for official-source citation;
- are not merely proposed rules; and
- retain valid version and effective-date metadata.

Pending, rejected, proposed, checksum-invalid, wrong-source, and duplicate-identity snapshots cannot become the selected baseline.

## Storage behavior

The historical storage helper loads every approved snapshot for a source from the immutable snapshot store and applies the persisted review envelope from the manifest. Pending snapshots remain stored for auditability but are excluded from the approved history returned for selection.

The returned approved history is ordered by effective date for deterministic review. Selection itself still evaluates every effective window and does not rely on array order.

## Benchmark coverage

The regression suite proves that:

- an exact quote in the analyzed document must contain the stated analysis date;
- invented, absent, unrelated-date, or document-less evidence is rejected;
- an older contract selects the older approved version even when that archive was retrieved later;
- the exact supersession boundary selects the new version;
- a superseded version without an end boundary is unresolved rather than perpetual;
- gaps and overlaps refuse selection;
- incomplete version metadata blocks a definitive result;
- pending, rejected, and proposed snapshots are excluded;
- mixed sources, duplicate identities, invalid dates, and unsupported date authority are rejected;
- explicitly user-provided dates remain distinguishable from contract-derived dates; and
- approved history loaded from persisted storage selects the same version as the pure deterministic path.

## Customer-facing boundary

This foundation is not yet connected to customer findings or report citations. Before integration, SubShield must:

1. extract and rank the relevant contract dates from the uploaded package;
2. define which date basis applies to each regulatory question;
3. retain complete current and historical official-source snapshots;
4. prove effective and supersession dates through reviewed source metadata;
5. link the selected snapshot to the source-backed citation package;
6. expose date uncertainty, gaps, and overlaps in the report; and
7. receive explicit approval before changing customer-facing analyzer conclusions.
