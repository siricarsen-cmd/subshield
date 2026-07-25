# Regulatory Source Coverage v1

Status: controlled benchmark foundation  
Product scope: federal government subcontractors reviewing prime-issued subcontract and solicitation packages  
Customer-facing status: not enabled

## Purpose

This phase provides at least one reviewed official-source excerpt for every government source declared by the twelve QA-C and QA-D regulatory applicability mappings.

Complete source coverage means that the benchmark has a controlled comparison source for each declared source ID. It does **not** mean that regulatory applicability is confirmed, that a missing contract attachment has been supplied, or that a contract is safe to sign.

## Source-route correction

The official CMMC program rule is located in 32 CFR Part 170 under Title 32, Subtitle A, Chapter I, Subchapter G. The source catalog previously pointed to Subchapter D. This phase corrects the canonical route and adds a regression assertion so live retrieval cannot silently return the wrong regulatory location.

## Construction and labor coverage

### Missing wage determination

The QA-D package now compares the subcontract language with:

- FAR 52.222-6 for the attached wage determination and contracting-officer conformance process;
- SAM.gov for wage-determination search dimensions such as determination number, labor category, locality, and construction or service category; and
- 29 CFR 5.5 for wage-determination incorporation and lower-tier flowdown.

The fictional `WD 2026-CA-9999` remains unverified. Source coverage does not create a wage rate, fringe rate, classification, locality, construction type, or modification number.

### Certified payroll

The official comparison preserves two separate deadlines:

- the Prime's contract requires submission within three business days after each payroll period; and
- the controlled 29 CFR part 3 source states delivery within 7 days after the regular payment date.

The package also preserves that Form WH-347 or a form with identical wording may satisfy the referenced certification language. It does not state that WH-347 is the only permissible format.

### Conditional SCLS

The 29 CFR part 4 comparison preserves principal-purpose and service-employee coverage questions. Service work that is merely incidental to a contract for another principal purpose does not establish SCLS coverage by itself.

The subcontract's statement that SCLS applies if the Prime later decides it applies remains a conditional commercial obligation, not proof of external statutory applicability.

### Labor changes and lower tiers

FAR 52.222-6 assigns construction classification conformance and approval functions to the contracting officer process. The Prime's unilateral direction and pass-through-only price relief remain separately identified commercial risks.

FAR 52.222-41 limits its quoted flowdown to subcontracts that are themselves subject to the Service Contract Labor Standards statute. The benchmark therefore rejects a blanket conclusion that every labor clause applies identically to every supplier.

## Cyber, CUI, and CMMC coverage

### NIST SP 800-171 Revision 3

The NIST source limits the technical baseline to components of nonfederal systems that process, store, or transmit CUI or provide protection for those components. It does not establish that every subcontractor system is covered.

The benchmark continues to require the actual contractually specified NIST revision, system boundary, data-flow map, and CUI facts.

### CUI Registry

The controlled CUI source establishes that the program concerns unclassified information requiring safeguarding or dissemination controls pursuant to law, Federal regulations, and Government-wide policies. It also establishes that the Registry is the Government-wide repository for Federal-level guidance and directs agency personnel and contractors to consult agency implementing policies and program management. The retained excerpt does not identify a particular CUI category or authority.

A Prime or customer representative's unsupported label may create a conservative contractual handling duty under the subcontract, but the benchmark does not treat that label alone as proof of a federal CUI category or authority.

### 32 CFR Part 170

The CMMC source applies requirements throughout covered supply-chain tiers based on whether a subcontractor will process, store, or transmit FCI or CUI and on the applicable level and assessment type for that subcontract.

The benchmark does not infer a CMMC level from a generic reference to future requirements, an email, or a portal posting.

## Coverage requirements

The full benchmark now requires:

- exactly one active citation package for each of the five QA-D and seven QA-C applicability mappings;
- every source declared by a mapping to have a retained excerpt in that package;
- source coverage to be marked complete without changing the mapping's applicability status;
- missing facts and prohibited inferences to remain intact;
- all packages to remain `benchmark-only`.

## Fixture limitation

The supplemental source fixtures are controlled benchmark snapshots containing verbatim selected paragraphs from approved official sources. They intentionally are not represented as complete page snapshots, and regression checks reject the summarized or cross-page wording that this phase replaced.

They are not substitutes for production retrieval of complete official pages and historical versions. Before any citation package can affect a customer report, SubShield must retrieve the full live source, retain its immutable checksum and provenance, complete non-automated review, select the correct current or historical version, and receive explicit approval for customer-facing analyzer integration.