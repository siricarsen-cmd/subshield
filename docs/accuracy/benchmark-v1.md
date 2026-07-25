# SubShield Analyzer Accuracy Benchmark v1

Status: Provisional engineering benchmark  
Scope: Federal government subcontractors reviewing prime-issued subcontract and solicitation packages  
Last updated: July 2026

## 1. Product boundary

SubShield is exclusively a federal government subcontract risk-review tool for small businesses and subcontractors working under federal prime contractors.

This benchmark does not authorize SubShield to:

- review a federal prime contract on behalf of the Government or prime contractor;
- provide general commercial-contract review unrelated to a federal subcontract;
- provide state, local, municipal, or private procurement advice as a standalone product;
- state that an agreement is safe to sign;
- make a regulatory-applicability conclusion when the required facts or controlling source are unavailable.

A prime-issued package may contain federal prime-contract clauses, agency supplements, wage determinations, cybersecurity requirements, or federally assisted construction flowdowns. SubShield may analyze those materials only from the perspective of the subcontractor's obligations, risk, missing information, negotiation position, and need for professional review.

## 2. Accuracy dimensions

The analyzer must be evaluated separately on all of the following dimensions:

1. **Extraction completeness** — whether all usable contract text was recovered.
2. **Cross-format parity** — whether equivalent PDF, DOCX, TXT, and pasted-text inputs produce materially equivalent results.
3. **Document grounding** — whether every document-specific statement is supported by an exact verified quote from the uploaded package.
4. **Finding-local grounding** — whether the analysis for a finding is supported by that finding's own quote rather than unrelated language elsewhere.
5. **Recall** — whether material subcontract risks are detected.
6. **Precision** — whether protective language and non-triggering language suppress false positives.
7. **Clause identity** — whether separate clauses remain separate findings and headings, footers, page labels, or adjacent clauses are excluded from the quote.
8. **Regulatory grounding** — whether every regulatory statement is supported by an authoritative, dated source.
9. **Applicability discipline** — whether the system distinguishes present obligations, potentially applicable requirements, missing applicability facts, and non-applicable requirements.
10. **Uncertainty handling** — whether incomplete or unreliable inputs produce a Limited Scan rather than false reassurance.
11. **Repeatability** — whether the same normalized contract and source snapshot produce the same material findings.
12. **Report usefulness** — whether prioritization, safer-language suggestions, missing-document requests, and attorney-preparation materials accurately reflect the quoted evidence.

## 3. Non-negotiable pass conditions

A benchmark run fails if any of the following occurs:

- A quote cannot be verified in the normalized client document.
- A quote includes a PDF header, footer, page number, extraction marker, or unrelated section heading.
- The analysis imports a clause, deadline, amount, regulation, CMMC level, flowdown, missing document, or factual condition not supported by the finding's own evidence and regulatory sources.
- A clean protective clause is reported as an adverse risk without local adverse evidence.
- A Limited Scan, Partial OCR, suspiciously short extraction, or incomplete package reports `No Critical Flags Detected`.
- An unreliable scan receives a Low overall risk posture.
- Equivalent supported formats produce materially inconsistent conclusions without a documented extraction difference.
- A current regulatory conclusion is based only on model memory or a non-authoritative website.
- The system silently assumes that every FAR, DFARS, agency, labor, or cybersecurity clause applies to every subcontract.

## 4. Controlled fixtures

The initial benchmark uses four fictional QA fixtures. They are engineering evidence, not attorney-approved legal opinions.

### QA-B — clean and comparatively balanced subcontract

Purpose: false-positive suppression and protective-context testing.

Expected outcome:

- Reliable extraction.
- Firm-Fixed-Price classification.
- Low risk under the targeted analyzer.
- No primary or secondary adverse finding based solely on the following protective provisions:
  - attached Statement of Work, pricing schedule, and flowdown matrix;
  - express bilateral-modification requirement;
  - no future Prime Contract clause without bilateral amendment;
  - guaranteed base-period work;
  - payment within 30 days and expressly not conditioned on Government payment;
  - documented dispute process and payment of undisputed amounts;
  - correction limited to a verified material nonconformity under the original requirement;
  - no rejection based on later-added requirements;
  - balanced indemnity and stated liability cap;
  - limited, noticed audit access;
  - reasonable cure and termination-for-convenience compensation.

Prohibited false positives include:

- treating `Exhibit C Flowdown Matrix` as missing merely because the phrase appears;
- treating correction of a verified material nonconformity as unlimited rework regardless of cause;
- treating ordinary Net-30 payment as contingent payment;
- treating a 30-day convenience-termination clause with work-in-process, noncancelable-commitment, demobilization, and settlement recovery as short-notice or no-recovery termination;
- treating bilateral change protections as unilateral future flowdowns.

Historical evidence:

- A Low / no-critical-flags result exists and is directionally consistent with the fixture's purpose.
- Older Medium results on the same fixture are retained as regression evidence because they demonstrate false positives and cross-run inconsistency.

### QA-C — cyber, CUI, DFARS, and data-handling subcontract

Purpose: high-risk cyber/CUI recall, finding-local grounding, clause separation, and PDF-cleanup testing.

The current deterministic regression suite requires these 16 material finding identities:

1. DFARS 252.204-7012 / CUI / NIST SP 800-171 Cybersecurity Flowdown
2. Missing / Deferred Contract Documents
3. Unilateral Future Cybersecurity Requirements
4. Accelerated Cyber Incident Reporting
5. Prime-Directed Cyber Response Costs
6. Intrusive Cybersecurity Assessments
7. Broad Cybersecurity System Access / Evidence Production
8. Uncompensated Cyber Remediation / No Equitable Adjustment
9. Percentage Invoice Withholding
10. All-Payment Withholding
11. Continued Performance Despite Payment Withholding
12. Continued Performance / Self-Financed Remediation During Dispute
13. Broad Indemnification / Duty to Defend
14. Uncapped Cyber Liability
15. Short Default Cure Period / Termination Discretion
16. Termination for Convenience

Additional provisional review targets that must be evaluated during benchmark expansion include:

- an absolute NIST assessment-score warranty and material-breach trigger;
- overbroad or disputed CUI designation language;
- unilateral restrictions on systems, locations, cloud services, media, devices, or personnel;
- return, destruction, forensic verification, and device-imaging obligations;
- 72-hour DoD reporting and 90-day preservation language, distinguished from any more burdensome prime-specific deadline;
- lower-tier approval, flowdown, and supply-chain liability;
- vulnerability-remediation deadlines and replacement-performance costs;
- source-code repository, build-log, dependency, monitoring-agent, and signing-key access;
- supplier, product, employee, or technology removal without compensation;
- survival of cyber, audit, indemnity, data-return, and flowdown duties.

These additional targets are provisional until their intended report treatment is tied to authoritative sources and, where appropriate, professional legal review. A provision may be a mandatory compliance obligation, a commercial-risk concern, a missing-information issue, or a combination; the system must not treat every obligation as inherently improper.

Historical progression retained for regression analysis:

- July 20: 4 findings, major false negatives, and unsupported imported facts.
- July 22: 15 findings, improved recall, but quote contamination and over-generic missing-document language.
- Later July 22: 16 findings after adding Prime-Directed Cyber Response Costs.
- July 23: 16 findings with stronger finding-local grounding and cleaner missing-document recommendations.
- A PDF footer survivor remained visible in one historical report and was subsequently addressed in repository changes.

### QA-D — construction and labor-compliance subcontract

Purpose: Davis-Bacon / Construction Wage Rate Requirements, Service Contract Labor Standards, certified payroll, construction risk, and lower-tier flowdown testing.

Provisional required review targets:

1. Wage determination incorporated but not attached and deferred until after mobilization.
2. Davis-Bacon / Construction Wage Rate Requirements trigger and applicable wage-determination dependency.
3. Conditional Service Contract Labor Standards applicability requiring confirmation rather than assumption.
4. Labor classification, conformance, fringe-benefit, and underpayment obligations.
5. Prime-directed revised classification, wage, fringe, or labor standard without assured price adjustment.
6. Weekly certified payroll and three-business-day submission deadline.
7. Payroll-record, worker-interview, fringe-payment, and lower-tier-record access.
8. Ten-percent retainage and broad final-payment conditions.
9. Withholding or backcharge before final responsibility is established.
10. Unilateral drawings, sequencing, changes, site-condition, access, and delay exposure.
11. Short claim or change-notice requirements and waiver consequences, when present.
12. Increased insurance, endorsement, or bonding requirements without price relief.
13. Broad indemnity, including Prime concurrent-negligence language where supported.
14. Davis-Bacon, SCLS, payroll, safety, insurance, audit, notice, and records flowdowns to lower tiers.
15. Five-day termination for convenience with recovery limited to accepted work and broad deductions.
16. Three-day cure and immediate termination without an opportunity to cure.
17. Continued performance during disputes, changes, claims, or nonpayment.
18. One-year action limitation and unilateral venue language.
19. Extensive closeout conditions and survival obligations.

Required labor-law discipline:

- Do not merely detect the words `Davis-Bacon` or `SCLS`.
- Determine whether the package supplies the facts needed to evaluate coverage and applicability.
- Identify the controlling wage determination, construction type, geographic area, revision, and incorporation status when available.
- Treat a missing wage determination as a missing-document and pricing/compliance concern.
- Distinguish federal construction labor standards from service-contract labor standards and flag mixed or ambiguous work for confirmation.
- Cite official Department of Labor, FAR, and wage-determination sources for regulatory explanations.

### QA-E1 — degraded scanned incomplete package

Purpose: extraction-confidence and Limited Scan safety.

Required outcome:

- The image-only degraded PDF must not receive Low risk or `No Critical Flags Detected`.
- The report must identify unreliable or incomplete extraction.
- The report must request a complete, readable package or clearer scan.
- Any visible fragments may be reported only as `Potentially Critical / Needs Confirmation — Limited Scan` or equivalent uncertainty language.
- The report must not issue an overall signing posture.
- The report must list missing or unreadable material and explain that additional risks may be present.

Visible fragment targets include:

- payment following Prime receipt of Government funds;
- no guaranteed minimum order;
- a possible three-day written-notice requirement;
- short-notice termination;
- additional Prime Contract clauses that may apply.

The fragment wording is intentionally incomplete. The system must not convert these fragments into definitive conclusions beyond what the visible words support.

## 5. Cross-format parity rules

For QA-B, QA-C, and QA-D, the PDF, DOCX, TXT, and pasted-text versions are intended to contain the same substantive contract language. Differences caused only by page headers, footers, line wrapping, Unicode substitutions, or paragraph boundaries must not change the material result.

Parity is satisfied when:

- the same material finding identities appear;
- exact quotes may differ only as necessary to match the normalized source representation;
- severity and prioritization are materially consistent;
- missing-document and regulatory conclusions are consistent;
- the report does not add or remove a finding because of a harmless formatting artifact.

QA-E1 is intentionally different: the PDF is degraded and image-only while the text representations contain readable fragments. The expected parity is therefore safety parity, not identical extraction — every format must avoid false reassurance, and the degraded PDF must produce the strongest extraction warning.

## 6. Regulatory-source acceptance criteria

A regulatory statement in a client report must include or be traceable to:

- source authority and title;
- exact citation or publication identifier;
- source URL;
- version, change number, revision, or effective date;
- retrieval or snapshot date;
- the specific proposition supported by the source;
- an applicability status: `confirmed`, `potentially applicable`, `not established`, or `not applicable based on stated facts`;
- any missing facts that prevent a firm conclusion.

The client contract must never be uploaded to a public government website as part of source retrieval. Regulatory retrieval must be independent of the client's confidential document text except for targeted citation identifiers and non-sensitive applicability metadata.

## 7. Metrics

Each benchmark run should record:

- extraction method and extracted character count;
- page count and OCR status;
- extraction-confidence result;
- expected findings detected;
- expected findings missed;
- unexpected findings;
- prohibited false positives;
- quote verification pass rate;
- finding-local grounding pass rate;
- source-citation verification pass rate;
- cross-format parity result;
- repeat-run consistency result;
- execution time and model/source versions.

Initial release gates should be defined only after the benchmark produces stable baseline measurements. The goal is measurable improvement, not an unsupported claim of 100% legal accuracy.

## 8. Benchmark governance

- Changes to expected findings require a written rationale.
- A detector fix must include both triggering and non-triggering examples.
- Removing an expected finding requires evidence that the prior expectation was wrong, duplicative, outside product scope, or unsupported.
- New regulatory-source snapshots must be versioned and checksummed.
- Historical reports must be retained as regression evidence rather than silently replaced.
- Attorney-reviewed or subject-matter-expert-reviewed expectations should be marked separately from provisional engineering expectations.
- Real client contracts must be de-identified and handled under an approved privacy process before entering any benchmark corpus.
