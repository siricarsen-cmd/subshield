# Authoritative Regulatory Grounding Architecture

Status: Proposed implementation architecture  
Product scope: Federal government subcontractors reviewing prime-issued subcontract and solicitation packages  
Last updated: July 2026

## 1. Objective

SubShield must not rely on model memory alone for statements about current federal acquisition regulations, labor standards, cybersecurity requirements, wage determinations, or agency-specific obligations.

The target architecture is:

> Uploaded subcontract package → evidence extraction → citation and applicability detection → retrieval from a controlled, versioned official-source library → source-backed comparison → uncertainty-aware client report

The system should continue to use the existing evidence-grounded analyzer as the contract-text layer. The new regulatory layer adds current authoritative support; it does not replace exact quote verification, deterministic risk detection, contradiction guards, or Limited Scan safeguards.

## 2. Product boundary

SubShield serves the subcontractor side of a federal prime-subcontract relationship.

The regulatory layer may analyze:

- prime-issued subcontract agreements;
- solicitation packages issued to a prospective federal subcontractor;
- statements of work, pricing schedules, flowdown matrices, exhibits, attachments, modifications, and prime-contract excerpts supplied in the package;
- federal clauses and agency supplements flowed down or purportedly flowed down to the subcontractor;
- federal labor, cybersecurity, sourcing, records, audit, property, data-rights, ethics, and other obligations relevant to subcontract performance.

The regulatory layer must not silently convert SubShield into:

- a federal prime-contract compliance platform;
- a Government contracting-officer tool;
- a general commercial-contract analyzer;
- a state/local procurement analyzer;
- a substitute for legal advice or a representation that a contract is safe to sign.

Federally assisted construction requirements may be analyzed when they appear in or are incorporated into a prime-issued subcontract package, but the report must describe the subcontractor-facing obligation and source rather than general state/local procurement advice.

## 3. Source hierarchy

### Tier 1 — client document evidence

The uploaded package is the only authority for document-specific facts such as:

- exact clause text;
- included or missing attachments;
- dates, deadlines, amounts, percentages, contract numbers, parties, and locations;
- the clause version or deviation text actually presented to the subcontractor;
- representations, warranties, remedies, indemnities, and negotiation language.

Every document-specific finding must retain an exact verified quote.

### Tier 2 — primary official regulatory and program sources

Use official sources as the primary regulatory corpus.

#### Federal Acquisition Regulation and agency supplements

- Acquisition.gov FAR: https://www.acquisition.gov/browse/index/far
- Acquisition.gov DFARS: https://www.acquisition.gov/index.php/dfars
- Acquisition.gov agency acquisition regulations and supplements where available
- Acquisition.gov archives, Federal Acquisition Circular metadata, DFARS change metadata, and clause pages
- Agency-issued class deviations, deviations, policy memoranda, and implementation notices from official agency domains

Acquisition.gov currently exposes downloadable and browsable FAR/DFARS versions with FAC/change numbers and effective dates. The corpus must capture those identifiers and retain historical snapshots.

#### Code of Federal Regulations and Federal Register

- eCFR Title 48 for continuously updated regulatory text and agency chapters: https://www.ecfr.gov/current/title-48
- eCFR Title 29 for Department of Labor regulations, including relevant government-contract labor standards
- eCFR Title 32 for CMMC program requirements and related defense regulations
- Federal Register final rules, interim rules, corrections, and effective-date notices: https://www.federalregister.gov/

The eCFR identifies itself as continuously updated but not the official legal edition of the CFR. SubShield should use it as an authoritative, current electronic source while retaining Federal Register provenance and Acquisition.gov version metadata where applicable.

#### Department of Labor and wage determinations

- DOL Wage and Hour Division government-contract resources: https://www.dol.gov/agencies/whd/government-contracts
- Davis-Bacon and Related Acts materials and 29 CFR Parts 1, 3, and 5
- Service Contract Labor Standards / McNamara-O'Hara Service Contract Act resources
- Contract Work Hours and Safety Standards Act materials
- Copeland Anti-Kickback Act materials
- SAM.gov Wage Determinations: https://sam.gov/content/wage-determinations

The DOL states that SAM.gov is the source for Davis-Bacon general wage determinations. A wage-determination record must preserve the determination number, revision/modification, publication date, geographic area, construction type or service category, classifications, rates, fringe benefits, and active/inactive status.

#### Cybersecurity and CUI

- NIST Computer Security Resource Center publications: https://csrc.nist.gov/publications
- NIST SP 800-171 and related assessment publications
- Acquisition.gov DFARS 252.204-7012, 252.204-7019, 252.204-7020, 252.204-7021, 252.204-7025, and related prescriptions
- Official DoD CMMC resources: https://business.defense.gov/Programs/Cyber-Security-Resources/CMMC-20/
- 32 CFR Part 170
- Official CUI Registry: https://www.archives.gov/cui

The source library must retain the revision and effective date because NIST, DFARS, and CMMC requirements can change independently and can have phased implementation.

### Tier 3 — official explanatory guidance

Official fact sheets, FAQs, handbooks, memoranda, and compliance guides may explain a primary source, but they must not silently replace controlling regulatory text.

Examples:

- DOL Davis-Bacon fact sheets and conformance guidance;
- agency implementation guidance;
- NIST implementation resources;
- official DoD CMMC guidance.

Reports should label explanatory guidance as guidance and identify the underlying controlling authority where available.

### Excluded or secondary sources

Do not use blogs, law-firm marketing pages, vendor summaries, forum posts, search-result snippets, or general AI-generated summaries as the authority for a client-facing regulatory conclusion.

Those sources may be used in internal product research only when clearly separated from authoritative grounding.

## 4. Controlled ingestion, not open web browsing per contract

The production analyzer should not perform an unrestricted internet search for each uploaded contract.

Instead:

1. A scheduled ingestion process fetches approved official sources.
2. Source text is normalized without changing legal meaning.
3. Each source unit receives stable metadata and a checksum.
4. New versions are stored alongside prior versions.
5. Changes are reviewed before they affect client-facing conclusions.
6. The analyzer retrieves only from the approved, versioned corpus.
7. A live-source verification may be used when a source is stale, newly changed, or unavailable in the corpus, but the result must be captured and reviewed.

This provides reproducibility, auditability, predictable latency, and protection from unreliable search results.

## 5. Source record schema

Each regulatory source unit should include at least:

```text
source_id
source_family                 # FAR, DFARS, DOL, wage determination, NIST, CMMC, agency supplement, deviation
jurisdiction                  # federal
issuing_authority
citation
canonical_title
canonical_url
source_type                   # regulation, clause, prescription, statute, wage determination, guidance, deviation
version_identifier            # FAC, DFARS change, CFR edition/date, revision, modification number
publication_date
effective_date
expiration_or_superseded_date
retrieved_at
checksum
historical_status             # current, superseded, archived, proposed, interim, corrected
text
applicability_metadata
cross_references
provenance_notes
review_status
reviewed_by
reviewed_at
```

Wage-determination records need additional structured fields for state, county or locality, construction type, service category, determination number, modification number, classifications, base rates, fringe rates, and active status.

## 6. Analysis workflow

### Step 1 — extraction and confidence

- Extract PDF, DOCX, TXT, or pasted text.
- Use OCR only as a fallback for scanned PDFs.
- Record extraction method, page count, text length, OCR status, and confidence.
- Stop overall posture and use Limited Scan rules when extraction is unreliable.

### Step 2 — document segmentation and anchors

Identify:

- document and clause boundaries;
- prime and subcontract numbers;
- contract type;
- agency/customer indicators;
- place of performance;
- price and thresholds;
- period of performance and dates;
- NAICS/PSC when supplied;
- construction, services, supplies, R&D, cyber/CUI, data, property, export, and other performance indicators;
- referenced but missing documents;
- FAR, DFARS, CFR, NIST, CMMC, wage-determination, and agency citations.

### Step 3 — candidate regulatory issues

Create candidates from two paths:

- explicit citations and incorporated clauses;
- fact patterns that may trigger a regulatory issue even when a citation is absent, such as covered construction, service employees, CUI, foreign sourcing, certified payroll, or cost/pricing data.

A candidate is not yet a conclusion.

### Step 4 — source retrieval

Retrieve the smallest relevant source units from the approved corpus:

- clause text and prescription;
- applicability and flowdown language;
- definitions;
- current and contract-date versions when relevant;
- governing wage determination;
- deviations or phased rules affecting the clause.

### Step 5 — applicability determination

Assign one of four statuses:

- **Confirmed** — the package and sources establish applicability.
- **Potentially applicable** — facts indicate possible applicability but confirmation is required.
- **Not established** — the package lacks necessary facts or documents.
- **Not applicable based on stated facts** — the package contains sufficient contrary facts.

The applicability engine should state which facts support the status and which facts are missing.

Examples of facts that can matter include:

- agency and prime-contract type;
- subcontract value and threshold;
- commercial-product/service or COTS status;
- construction versus service work;
- place of performance and construction type;
- employee classifications;
- whether FCI, CUI, or covered defense information will be handled;
- system boundaries and lower-tier access;
- whether a clause is mandatory, optional, prohibited, or flowed down by its own terms;
- contract award date and applicable regulatory version;
- class deviations and agency instructions.

### Step 6 — compare package to source

Classify the result without overstating it:

- source-backed obligation present;
- required supporting document missing;
- cited clause text incomplete, altered, obsolete, or inconsistent with the identified version;
- broader prime-drafted obligation than the underlying federal requirement;
- narrower or protective subcontract language;
- flowdown potentially required but not supplied;
- applicability uncertain;
- commercial risk independent of regulatory compliance.

SubShield must distinguish between:

- **mandatory federal obligation**;
- **prime-added commercial term**;
- **potentially required flowdown**;
- **missing or unverifiable requirement**;
- **negotiable risk allocation**.

A mandatory regulation may still create cost, schedule, or operational exposure, but the report should not imply that the subcontractor can simply negotiate away a requirement that is legally mandatory.

### Step 7 — verify and rank

Before release:

- verify every contract quote;
- verify every regulatory citation against the stored source snapshot;
- enforce finding-local grounding;
- apply contradiction and protective-language guards;
- remove duplicates while preserving materially different clauses;
- rank commercial and compliance risks separately when helpful;
- preserve all uncertainty labels.

### Step 8 — report

Each regulatory finding should display:

1. Contract risk or compliance trigger.
2. Exact contract text.
3. Why it matters to the federal subcontractor.
4. Regulatory applicability status.
5. Official source citation, title, version/effective date, and link.
6. Missing facts or documents.
7. Recommended question, clarification, document request, or negotiation point.
8. Whether attorney, labor-compliance, cybersecurity, accounting, or other specialist review is recommended.

## 7. Davis-Bacon and labor-compliance handling

Construction and labor analysis must use a dedicated applicability path.

### Required source families

- FAR Part 22 and applicable clauses, including construction labor standards clauses;
- 29 CFR Parts 1, 3, and 5;
- DOL Wage and Hour Division guidance;
- the applicable SAM.gov wage determination;
- Service Contract Labor Standards sources when service employees may be involved;
- CWHSSA and Copeland Act sources where triggered.

### Required checks

- Is the work construction, alteration, or repair of a public building or public work?
- Is the federal or federally assisted coverage basis stated?
- Is the contract value above the relevant threshold?
- What is the project location?
- What construction type applies: building, residential, heavy, highway, or multiple types?
- Is the correct wage determination attached and incorporated?
- What determination and modification number applies?
- Are classifications and fringe rates supplied?
- Is conformance needed for missing classifications?
- Are weekly payroll, certified payroll, record, interview, posting, and lower-tier duties stated?
- Is SCLS separately or conditionally implicated by service work?
- Does the prime reserve unilateral authority to change wage or classification obligations without price/schedule relief?

The analyzer must not invent a wage determination from a fictional, malformed, or incomplete identifier. It should report that the cited determination could not be verified and request the controlling document.

## 8. Cybersecurity and CMMC handling

Cyber analysis must distinguish:

- FAR 52.204-21 basic safeguarding;
- DFARS 252.204-7012 safeguarding and incident reporting;
- DFARS 252.204-7019 and 252.204-7020 assessment requirements;
- DFARS 252.204-7021 and 252.204-7025 CMMC requirements and phased applicability;
- NIST SP 800-171 revision applicable through the contractual vehicle;
- FCI, CUI, and covered defense information;
- Prime-added controls, deadlines, access, warranties, indemnities, and remedies that exceed the federal baseline.

The system must never infer a CMMC level unless it is stated or established through source-backed applicability facts. It must identify when cyber attachments, system boundaries, CUI categories, security plans, data-flow maps, or required levels are missing.

## 9. Updates and change control

A scheduled monitor should detect changes to:

- FAC and FAR text;
- DFARS changes and clauses;
- agency supplements and deviations;
- eCFR Titles 29, 32, and 48;
- Federal Register rules and corrections;
- DOL labor guidance and wage determinations;
- NIST publications;
- CMMC rules and implementation guidance.

A detected change should not automatically rewrite client-facing rules. It should create a review item containing:

- old and new source versions;
- changed text;
- effective date;
- potentially affected analyzer rules and benchmark fixtures;
- proposed applicability or report changes;
- required regression tests;
- reviewer decision.

## 10. Privacy and security

- Do not transmit complete customer contracts to public regulatory websites.
- Retrieve official source material independently from customer files.
- Send only the minimum information necessary to internal retrieval components.
- Do not log confidential contract text beyond approved application logging.
- Do not expose source-library administrative credentials to the client or model.
- Preserve ownership checks and deletion behavior for customer documents and reports.
- Record the source snapshot identifiers used for each report so the analysis is reproducible after sources change.

## 11. Rollout plan

### Phase 1 — benchmark and source registry

- Formalize QA-B, QA-C, QA-D, and QA-E1 expectations.
- Create the source-record schema and approved-domain registry.
- Record current FAR, DFARS, DOL, NIST, CMMC, and wage-determination sources.
- Add benchmark metrics and repeatability records.

### Phase 2 — explicit-citation retrieval

- Detect citations already present in the package.
- Retrieve and cite current and relevant historical official text.
- Add source-backed explanations without changing applicability conclusions beyond supplied facts.

### Phase 3 — applicability engine

- Add structured fact extraction and applicability statuses.
- Implement Davis-Bacon/SCLS, cyber/CUI/CMMC, and selected high-value flowdown rules.
- Add missing-fact and missing-document requests.

### Phase 4 — regulatory update monitoring

- Ingest new official versions.
- Diff source changes.
- Require review before activating changed conclusions.

### Phase 5 — expanded benchmark and expert validation

- Add de-identified real-world packages.
- Obtain attorney and subject-matter-expert review for benchmark expectations.
- Track precision, recall, citation accuracy, parity, uncertainty handling, and repeatability over time.

## 12. Initial implementation rule

No production analyzer behavior should be changed merely because this architecture document exists.

The first implementation PR should add a read-only source registry and explicit-citation retrieval behind a feature flag, with no production report change until:

- source integrity and versioning are verified;
- privacy review is complete;
- QA-B/C/D/E1 regressions pass;
- failure and stale-source behavior are defined;
- client-facing citations are reviewed.
