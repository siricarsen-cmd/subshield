# Controlled Regulatory Source Ingestion v1

Status: implementation foundation  
Product scope: federal government subcontractors reviewing prime-issued subcontract and solicitation packages  
Last updated: July 2026

## Purpose

This phase creates an auditable path from an approved official government source to a retained, checksum-protected snapshot. It does **not** yet place regulatory conclusions into customer reports.

The ingestion boundary is:

> approved source catalog → approved HTTPS retrieval → bounded response → conservative normalization → raw and normalized checksums → immutable pending-review snapshot → change comparison → human/controlled approval before client citation

## Security and provenance controls

The ingestion code:

- accepts only source IDs already present in `lib/regulatory/source-catalog.ts`;
- permits only HTTPS URLs on approved official government domains;
- requires the requested route to match the selected catalog source, including the approved eCFR API transformation;
- validates every redirect instead of following redirects blindly;
- rejects redirects to non-approved domains;
- applies request timeouts through both header retrieval and response-body transfer;
- enforces redirect limits, content-type restrictions, and streaming response-size limits;
- stores the requested URL, final URL, redirect chain, HTTP status, content type, byte count, ETag, and Last-Modified value when supplied;
- calculates separate SHA-256 checksums for the raw response and normalized text;
- marks every newly fetched snapshot `pending`;
- blocks pending, rejected, altered, mismatched-provenance, or checksum-invalid snapshots from client-facing citation use.

No customer document, customer identifier, payment data, authentication data, or production secret is sent to a government source.

## Normalization

Normalization is deliberately conservative and versioned.

- HTML: removes scripts, styles, templates, comments, SVG content, and markup while preserving visible text and block boundaries.
- XML: removes markup while preserving legal text and major structural boundaries.
- JSON: parses and serializes with stable key ordering.
- Text: normalizes line endings, nonbreaking spaces, repeated horizontal whitespace, and excessive blank lines.

The normalized-text checksum determines whether substantive stored content changed. Raw checksums and retrieval receipts identify markup, redirect, or transport-metadata changes that did not alter normalized legal text.

A future normalization change must use a new normalization version and must not silently overwrite historical snapshots.

## eCFR retrieval

Programmatic eCFR retrieval is routed through the official eCFR Versioner API rather than scraping reader pages. A catalog URL such as:

```text
https://www.ecfr.gov/current/title-29/subtitle-A/part-5
```

is resolved to:

```text
https://www.ecfr.gov/api/versioner/v1/full/current/title-29.xml?part=5
```

The canonical reader URL remains the customer-facing citation link; the API URL is retained as retrieval provenance. Historical retrieval accepts only `current` or an exact `YYYY-MM-DD` date.

## Historical storage

Snapshots are stored under:

```text
data/regulatory-snapshots/<source-id>/
```

Each source has a manifest containing:

- all retained normalized snapshot IDs and file paths;
- raw and normalized checksums;
- retrieval timestamps;
- version identifiers when available;
- review status;
- lightweight retrieval observations when raw markup or transport provenance changes without a normalized legal-text change;
- the latest observed normalized snapshot;
- the latest approved snapshot, when one exists.

Changed normalized content creates a new immutable snapshot while preserving all prior versions. When normalized text is unchanged but raw markup, redirect provenance, ETag, Last-Modified, or related transport metadata changes, the manifest records a lightweight observation instead of duplicating the normalized text. An identical repeat retrieval creates no repository churn.

Snapshot paths are constrained to the controlled source directory, manifest entries are validated against their files, and an existing snapshot file cannot be overwritten.

## Automated update proposals

The scheduled GitHub workflow runs only against public approved sources. When a normalized source snapshot or retained raw-provenance observation changes, it creates a pull request containing **pending** source records. The workflow does not merge the pull request and does not approve the snapshots.

A source change therefore cannot silently alter customer conclusions. The update must be reviewed for:

- authenticity and provenance;
- version/effective-date changes;
- substantive regulatory changes;
- normalization quality;
- source scope and completeness;
- applicability or flowdown consequences;
- benchmark updates required before customer use.

## Initial ingestion set

The starter set covers the most important labor and cybersecurity source families already represented in the benchmark architecture:

- FAR and DFARS current-version index pages;
- FAR 52.222-6, 52.222-8, and 52.222-41;
- 29 CFR Parts 1, 3, 4, and 5 through the eCFR API;
- DOL Davis-Bacon and Service Contract Labor Standards guidance;
- DFARS 252.204-7012, 7019, 7020, 7021, and 7025;
- 32 CFR Part 170 through the eCFR API;
- NIST SP 800-171 Revision 3 and SP 800-171A Revision 3;
- official DoD CMMC resources;
- the official CUI Registry.

## Wage-determination limitation

The SAM.gov wage-determination landing page is in the approved catalog, but the generic page-ingestion path is not sufficient to establish a project-specific wage determination, modification, classification, rate, or fringe benefit.

A separate wage-determination adapter is required. It must preserve at least:

- determination number;
- modification number;
- publication date;
- active/inactive status;
- state and county/locality;
- construction type or service category;
- classifications;
- base rates;
- fringe rates;
- conformance information;
- the exact official record retrieved.

Until that adapter is implemented and tested, SubShield must continue to treat missing or unverifiable wage determinations as a document request and applicability question. It must never infer rates or classifications.

## Federal Register limitation

The Federal Register is retained in the approved catalog for rule provenance, effective dates, corrections, and interim/final rule history. A targeted Federal Register query adapter is still required; the generic root page is not an adequate regulatory snapshot.

## Customer-facing status

This phase does not change existing analyzer findings or report display. A snapshot can become eligible for future client citation only when:

1. its source remains approved;
2. its checksum validates;
3. its canonical and requested routes match the selected catalog source;
4. its redirect chain and final URL remain approved and internally consistent;
5. its review status is `approved` with reviewer provenance;
6. later applicability logic ties the source to the facts and exact contract evidence.

The next phase after reliable ingestion is source review/approval plus clause-level retrieval and applicability mapping for QA-C and QA-D.
