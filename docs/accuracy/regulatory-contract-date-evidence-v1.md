# Regulatory Contract Date Evidence v1

Status: controlled benchmark foundation  
Product scope: federal government subcontractors reviewing prime-issued subcontract and solicitation packages  
Customer-facing status: not enabled

## Purpose

Historical regulatory selection requires the date that governs the particular question. SubShield must extract that date from exact uploaded contract language rather than guessing from file metadata, today's date, a model inference, or the nearest calendar reference.

This phase detects and resolves five contract-date bases:

- solicitation issued;
- proposal due;
- subcontract executed;
- modification effective; and
- performance started.

The extractor does not create a user-specified date. That remains a separate, explicitly user-provided path.

## Evidence rules

A candidate must contain:

- a recognized governing-date label;
- a valid calendar date after that local label;
- an exact evidence window that exists in the normalized uploaded text; and
- a supported date format: `YYYY-MM-DD`, `MM/DD/YYYY`, or a named-month date such as `March 1, 2026`.

The evidence window is an individual normalized line or two adjacent normalized lines. This allows PDF and DOCX extraction wraps such as a modification label on one line and its date on the next. A flattened paste is scanned as a single normalized document, and repeated anchors are evaluated independently.

Dates must occur within a bounded distance after their local anchor. This prevents an unrelated later audit, notice, or narrative date from being attached to an earlier label.

## Basis separation

The extractor preserves these distinctions:

- a proposal due date is not the solicitation issue date;
- a period-of-performance start is not the subcontract execution date;
- a modification effective date is not the original subcontract effective date;
- a clause-specific effective date is not the contract's execution date; and
- a notice deadline is not a governing regulatory analysis date.

The solicitation-issued anchor requires issuance or release language. Generic solicitation wording followed by a proposal due date does not qualify.

The subcontract-executed label requires an explicit document, subcontract, agreement, or contract effective/execution label, or prose stating that the agreement was entered into, executed, or effective as of a date.

## Excluded date-like text

The extractor does not use:

- FAR, DFARS, NIST, CMMC, or clause revision dates;
- contract, solicitation, or modification numbers that contain digits and hyphens;
- cure, notice, reporting, or claim periods expressed as a number of days;
- retention periods;
- unrelated calendar dates in narrative text;
- the ending date of a period of performance as its start date; or
- impossible calendar dates.

Invalid date text is retained only in a rejected-date list for diagnostics. It cannot generate a historical selection context.

## Resolution behavior

For a requested basis:

- `resolved` means one unique normalized date is supported by exact document evidence;
- `not-found` means no supported local label/date pair exists;
- `ambiguous` means more than one distinct date is stated for that basis; and
- `invalid-document` means readable text or exact evidence is unavailable.

Repeated references to the same normalized date do not create false ambiguity. Multiple different modification or execution dates do. The ambiguity result preserves every candidate and requests the document or modification to which each date applies.

A resolved result emits the exact evidence quote, original analyzed document text, normalized date, basis, and `contract-evidence` authority expected by the historical version selector. The historical selector independently re-verifies the quote and date before using it.

## Cross-format benchmark

The benchmark requires the same period-of-performance start across paragraph and flattened-paste representations of QA-B and QA-D. It also proves that neither fixture's performance start is silently reclassified as its execution date.

The regression suite covers:

- all five date bases and three supported date formats;
- next-line PDF-style wrapping;
- flattened repeated modification dates;
- same-date repetition versus true ambiguity;
- proposal-due and clause-effective false-positive traps;
- invalid and distant unrelated dates;
- clause revision, contract number, and notice-period exclusions;
- QA-B and QA-D cross-format parity; and
- compatibility with historical selector evidence verification.

## Customer-facing boundary

The extractor is not yet connected to current customer reports. Before integration, SubShield must define which date basis controls each regulatory comparison, preserve unresolved ambiguity in the report, and receive explicit approval before historical source selection changes customer-facing findings or citations.
