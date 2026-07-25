# Regulatory Applicability Mapping v1

Status: benchmark and review foundation  
Product scope: federal government subcontractors reviewing prime-issued subcontract and solicitation packages  
Customer-facing status: not enabled

## Purpose

This phase separates four questions that must never be collapsed into one:

1. What does the subcontract expressly or conditionally impose?
2. What federal source is relevant to that language?
3. Do the available facts establish regulatory applicability?
4. Is the Prime language aligned with, missing from, inconsistent with, or broader than the official baseline?

A clause reference in a subcontract is not proof that the cited rule applies, that the citation is correct, or that the Prime's interpretation matches the official source.

## Applicability statuses

Each mapping records both:

- **Contractual imposition**: expressly imposed, conditionally imposed, not stated, or citation inconsistent.
- **Regulatory applicability**: Confirmed, Potentially applicable, Not established, or Not applicable based on stated facts.

The first QA-C and QA-D mappings intentionally do not use `Confirmed`. The fictional fixtures do not supply all facts needed to establish actual regulatory coverage, even when they expressly impose a clause commercially.

## QA-D labor and construction mapping

The QA-D package supports a strong construction trigger: a $3.6 million firm-fixed-price construction scope with excavation, concrete, structural repairs, and site restoration. It also expressly imposes construction wage and certified-payroll obligations.

The mapping nevertheless preserves these limits:

- `WD 2026-CA-9999` is fictional and unattached. It cannot establish locality, construction type, modification, classification, wages, or fringe benefits.
- The wage determination must be requested before execution and mobilization.
- The Prime's three-business-day payroll deadline must be compared to the controlling federal submission rule; it must not be mislabeled as the federal deadline.
- SCLS is only conditionally imposed in QA-D. The package does not establish principal purpose, covered service employees, exemptions, or an applicable service wage determination.
- Prime-directed classification or wage changes without assured price relief are treated separately as a commercial risk broader than a verified federal baseline.
- Lower-tier labor flowdowns must be tied to each lower-tier scope and covered employees rather than applied identically to every supplier.

Primary source families include FAR 52.222-6, FAR 52.222-8, FAR 52.222-41, 29 CFR Parts 3, 4, and 5, and SAM.gov wage determinations.

## QA-C cyber and CUI mapping

The QA-C package expressly anticipates FCI, CUI, covered defense information, and covered contractor information systems. It also cites DFARS 252.204-7012, DFARS 252.204-7020, NIST SP 800-171, and future CMMC obligations.

The mapping preserves these distinctions:

- Express contractual language is not the same as confirmed external applicability.
- The actual Prime clause set, clause versions, covered-system boundary, CUI categories, COTS status, NIST revision, and CMMC level remain required facts.
- The Prime's eight-hour suspicion-based notice is separate from the stated seventy-two-hour DoD portal report and ninety-day preservation duties.
- A permanent score-of-110 warranty and automatic material breach are Prime-drafted risk allocations, not automatically the federal baseline.
- Future CMMC requirements cannot be grounded without the exact clause, level, covered systems, assessment status, and implementation date.
- Lower-tier cyber flowdowns must be mapped supplier by supplier based on information and system access.

## Verified citation defect in QA-C

QA-C section 2.2 states that DFARS 252.204-7002 creates cybersecurity assessment, access, and cooperation duties.

The current official DFARS identifies 252.204-7002 as **Payment for Contract Line or Subline Items Not Separately Priced**. It is not a cybersecurity assessment clause. DFARS 252.204-7020 separately addresses NIST SP 800-171 DoD assessment requirements.

SubShield must therefore:

- identify the citation mismatch;
- preserve the exact subcontract quote;
- compare the cited identifier to the official DFARS source;
- request the complete intended clause text;
- never silently replace 252.204-7002 with 252.204-7008, 252.204-7020, or another guessed citation.

This fixture now tests a critical regulatory-grounding capability: detecting when a Prime-provided clause number does not support the obligation attributed to it.

## Controlled source approval

A fetched official-source snapshot remains `pending` until a non-automated reviewer:

- verifies its source identity and retained checksum;
- confirms required source-specific text anchors;
- confirms version and effective-date metadata when supplied;
- records substantive review notes and an exact ISO review timestamp;
- approves or rejects the snapshot.

Automated identities cannot approve snapshots. A checksum-invalid snapshot, missing source anchor, mismatched version, or source-provenance failure cannot become citation eligible.

## Customer-facing boundary

This phase does not modify analyzer findings or report display. The mappings are benchmark truth and future grounding inputs only.

Before these mappings may affect a customer report, the next phase must:

1. ingest and review the exact official clause snapshots;
2. extract clause-level official text and citations;
3. match contract evidence to applicability facts;
4. generate source-backed comparison objects;
5. prove correct behavior against QA-C and QA-D negative and positive cases;
6. expose uncertainty and missing facts without overstating legal conclusions.
