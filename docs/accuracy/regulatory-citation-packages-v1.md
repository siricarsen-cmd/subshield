# Regulatory Citation Packages v1

Status: controlled benchmark foundation  
Product scope: federal government subcontractors reviewing prime-issued subcontract and solicitation packages  
Customer-facing status: not enabled

## Purpose

A regulatory citation package joins two evidence sets without confusing them:

1. the exact language in the subcontract package; and
2. a bounded excerpt from an approved, versioned official-source snapshot.

The package preserves contractual imposition, regulatory applicability, comparison status, supporting facts, missing facts, prohibited inferences, and document requests. It is not itself a legal conclusion and does not make a contract safe to sign.

## Extraction controls

An official-source excerpt may be created only when:

- the snapshot has passed controlled source review and is eligible for citation;
- the requested source matches the applicability mapping;
- unique start and end anchors are found in the retained source text;
- all source-specific required anchors occur inside the extracted range;
- the excerpt remains within a defined size limit;
- the source checksum, excerpt checksum, source locator, and source line range are retained.

Whitespace and source quotation marks may vary without breaking an otherwise exact anchor. The extractor rejects missing or ambiguous anchors rather than selecting a likely occurrence.

## Source coverage

A package reports its official-source coverage as either:

- **complete** — every source comparison declared by the applicability mapping has an approved excerpt; or
- **partial** — one or more declared sources remain uncovered and are identified explicitly.

Partial coverage is not converted into a complete regulatory conclusion. It remains a visible implementation and review gap.

## QA-D construction and labor packages

### Certified payroll

The QA-D package compares the Prime's three-business-day submission requirement to FAR 52.222-8 language concerning payroll certifications and the Statement of Compliance.

The official excerpt supports that a properly executed certification on Optional Form WH-347 satisfies the Statement of Compliance requirement. It does not establish that WH-347 is the only allowed form, and it does not convert the Prime's three-business-day deadline into a federal deadline.

The first package remains partial until the relevant 29 CFR part 3 excerpt is separately approved and linked.

### Conditional SCLS coverage

The QA-D package preserves the contract's conditional Service Contract Labor Standards language. FAR 52.222-41 provides an official baseline for applicability, attached wage determinations, exemptions, and flowdown to subcontracts that are themselves subject to the statute.

The package does not conclude that SCLS applies merely because the Prime reserves the right to make that determination. Principal purpose, employee duties, exemptions, and an applicable service wage determination remain required facts. The first package remains partial until the 29 CFR part 4 source is linked.

## QA-C cyber and CUI packages

### Incorrect DFARS 252.204-7002 citation

The official DFARS identifies 252.204-7002 as a payment clause for contract line or subline items that are not separately priced. It does not support cybersecurity assessment, access, or cooperation duties.

The citation package compares that source to DFARS 252.204-7020, which separately addresses NIST SP 800-171 DoD assessment applicability and Government access. SubShield must report the citation defect and request corrected clause text. It must not silently guess which clause the Prime intended.

### Assessment score of 110

The DFARS 252.204-7019 and 252.204-7020 excerpts preserve official assessment fields that allow a summary score below 110 and a date when a score of 110 is expected based on associated plans of action.

Those excerpts do not create the Prime's separate promise that a score of 110 will remain unchanged throughout performance, nor do they create automatic material breach for every lower score. The Prime warranty remains a separately identified commercial risk.

### CMMC level

The DFARS 252.204-7021 and 252.204-7025 excerpts require an identified CMMC level and tie the obligation to systems that process, store, or transmit FCI or CUI. They also preserve scope-specific subcontract flowdown.

The citation package does not infer a CMMC level from a generic reference to future requirements or from an email or portal posting. The first package remains partial until the relevant 32 CFR part 170 excerpt is approved and linked.

### Incident reporting and preservation

The DFARS 252.204-7012 excerpt preserves the official 72-hour rapid-reporting definition and the requirement to preserve affected-system images and relevant monitoring or packet-capture data for at least 90 days.

The Prime's eight-hour notice for suspected events and policy violations is separate. It must not be described as the DFARS reporting deadline.

### Lower-tier flowdown

The DFARS 252.204-7012 excerpt ties flowdown to operationally critical support or performance involving covered defense information. The DFARS 252.204-7021 excerpt ties the CMMC level to the information flowed to the lower tier and excludes commercially available off-the-shelf items from the quoted flowdown rule.

The package therefore rejects a blanket conclusion that every cyber term applies identically to every supplier.

## Benchmark fixture boundary

The controlled source excerpts in this phase are review fixtures used to prove extraction, comparison, and refusal behavior. They are marked benchmark-only and cannot be emitted in current customer reports.

Before customer-facing integration, SubShield must:

1. retrieve and retain the exact live official-source snapshots;
2. complete non-automated source review and persisted approval;
3. link each contract finding to the applicable approved package;
4. prove correct current-version and historical-version selection;
5. prove that partial coverage and missing applicability facts remain visible;
6. add report presentation that clearly separates contract evidence from government-source evidence;
7. obtain explicit approval before changing customer-facing analyzer conclusions.
