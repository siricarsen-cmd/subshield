# Regulatory Source Registry v1

Status: Implemented foundation; retrieval and applicability logic not yet enabled in customer reports  
Product scope: Federal government subcontractors reviewing prime-issued subcontract and solicitation packages  
Verified source baseline: July 25, 2026

## Purpose

This registry is the first executable boundary for SubShield's authoritative regulatory grounding layer. It identifies the official government source families that future ingestion and retrieval code may use, defines the metadata required for versioned snapshots and client citations, and rejects unrestricted or non-government source domains.

This phase does **not** claim that SubShield is already checking live government sources during each customer review. Customer-facing conclusions remain on the existing contract-evidence and deterministic-analyzer path until the controlled ingestion, retrieval, applicability, and report-integration phases are completed and validated.

## Product boundary

SubShield remains exclusively for federal government subcontractors evaluating prime-issued subcontract agreements, solicitation packages, flowdown matrices, statements of work, exhibits, attachments, modifications, and prime-contract excerpts supplied to the subcontractor.

The regulatory layer must not silently become a prime-contract compliance tool, contracting-officer system, general commercial analyzer, or state/local procurement service.

## Approved official domains

Production retrieval is restricted to HTTPS sources under these official government domains and their government subdomains:

- acquisition.gov
- ecfr.gov
- federalregister.gov
- dol.gov
- sam.gov
- nist.gov
- defense.gov
- archives.gov

Blogs, law-firm pages, vendor summaries, search-result snippets, forums, and model-generated summaries are excluded as authority for client-facing regulatory conclusions.

## Initial source families

### FAR and DFARS

The registry includes the current FAR and DFARS roots, version metadata, labor clauses, and priority cyber/CMMC clauses. As of the verified baseline:

- FAR: FAC 2026-01, effective March 13, 2026
- DFARS: Change 5/7/2026, effective May 7, 2026

Historical snapshots remain required because contract award dates, solicitation dates, clause revision dates, deviations, and phased implementation may make a prior version relevant.

### Davis-Bacon, construction labor, and certified payroll

The registry includes:

- FAR 52.222-4, Contract Work Hours and Safety Standards—Overtime Compensation
- FAR 52.222-6, Construction Wage Rate Requirements
- FAR 52.222-8, Payrolls and Basic Records
- 29 CFR Parts 1, 3, and 5
- Department of Labor Davis-Bacon resources
- SAM.gov Wage Determinations

A wage-determination lookup must preserve the determination number, modification number, publication date, project location, construction type, classifications, base rates, fringe rates, and active or archived status. SubShield must never invent wage rates or classifications from a malformed, fictional, missing, or incomplete identifier.

### Service Contract Labor Standards

The registry includes:

- FAR 52.222-41, Service Contract Labor Standards
- 29 CFR Part 4
- Department of Labor service-contract resources
- SAM.gov Wage Determinations

A service-labor conclusion requires source-backed applicability facts, including the nature of the work, place of performance, employee classifications, value or threshold facts when relevant, exemptions, and the controlling wage determination.

### Cybersecurity, CUI, NIST, and CMMC

The registry includes:

- DFARS 252.204-7012, 7019, 7020, 7021, and 7025
- NIST SP 800-171 Revision 3 and SP 800-171A Revision 3
- 32 CFR Part 170
- official DoD CMMC resources
- the official CUI Registry

The applicable NIST revision and CMMC level must not be inferred from model memory. They must be established from the contractual vehicle, clause version, required level, phased implementation facts, and stored official-source snapshots.

## Data model

The implementation introduces:

- `RegulatorySourceCatalogEntry` for approved source definitions;
- `VerifiedSourceVersion` for current-version provenance;
- `RegulatorySourceSnapshot` for retained text, checksum, status, dates, and review state;
- `RegulatoryCitation` for client-report provenance;
- `RegulatoryGrounding` for applicability status, comparison status, supporting facts, missing facts, citations, and snapshot identifiers.

Existing findings remain unchanged. A finding may carry optional regulatory grounding only after later phases retrieve and verify approved snapshots. The optional field prevents the current analyzer from fabricating a source citation while allowing future source-backed findings to use a stable output shape.

## Validation requirements

The automated source-registry test enforces:

- unique source identifiers;
- HTTPS-only approved government domains;
- required FAR, DFARS, DOL, SAM, eCFR, NIST, CMMC, and CUI sources;
- ISO-formatted verified dates;
- current FAR, DFARS, and NIST baseline metadata;
- explicit dynamic treatment of wage determinations;
- separation between primary authority and official explanatory guidance;
- rejection of lookalike and non-government domains.

## Next implementation phase

The next phase should build a controlled ingestion and snapshot service that:

1. retrieves approved official source units;
2. records source version, effective date, retrieval time, checksum, and provenance;
3. stores historical versions rather than overwriting them;
4. detects source changes;
5. requires review before changed text can affect client-facing conclusions;
6. exposes only approved snapshots to the applicability and comparison engine.

No unrestricted web search should run against a customer's uploaded contract.
