import { classifyContract } from "../classify.ts";
import { selectDetectorFamilies } from "../detectors.ts";
import { runDeterministicDetectors } from "../deterministic.ts";
import { hasAffirmativeCyberSignal } from "../affirmative-signals.ts";
import { verifyFindings } from "../sanity.ts";
import { dedupeFindings, rankFindings } from "../report.ts";
import { normalizeWhitespace, quoteExistsInDocument } from "../text.ts";

const FUTURE_CYBER_SOFT_WRAP = `If the Government later requires CUI handling or a materially different cybersecurity baseline,
the parties will execute a bilateral modification addressing requirements, schedule, and price before that changed work begins.`;

const FUTURE_CYBER_SINGLE_LINE =
  "If the Government later requires CUI handling or a materially different cybersecurity baseline, the parties will execute a bilateral modification addressing requirements, schedule, and price before that changed work begins.";

const AFFIRMATIVE_CYBER_SOFT_WRAP = `Subcontractor shall protect Controlled Unclassified Information
in accordance with DFARS 252.204-7012 and NIST SP 800-171.`;

const PDF_LIKE_IRONCLAD = `PROJECT IRONCLAD HORIZON
Prime Contractor: Meridian Federal Constructors, LLC
Prime Contract Number: FIR-26-C-9031
Subcontract Type: Firm-Fixed-Price Construction and Supply

1. AWARDED CONSTRUCTION AND SUPPLY SCOPE
Subcontractor shall furnish and field-install structural steel supports, equipment frames, concrete pads, embedded anchors, conduit, electrical panels and feeders, testing, and turnover work at the federally controlled facility.

2. EXPRESS CYBER NEGATIVE CONTROL
The awarded base scope does not require access to Controlled Unclassified Information (CUI), classified information, or Government production information systems. DFARS 252.204-7012 and NIST SP 800-171 are not incorporated into this subcontract for the awarded base scope. If the Government later requires CUI handling or a materially different cybersecurity baseline,
the parties will execute a bilateral modification addressing requirements, schedule, and price before that changed work begins.

3. CONSTRUCTION WAGES AND PAYROLL
The awarded field-installation scope is construction or alteration work on a federally controlled site and is subject to the Construction Wage Rate Requirements commonly associated with the Davis-Bacon framework. Covered laborers and mechanics shall receive the wages and fringe benefits stated in Attachment C, and Subcontractor shall submit weekly certified payroll records and correct any Subcontractor-caused underpayments or back wages. Attachment C, the applicable wage determination, is included with this subcontract. The Service Contract Labor Standards / Service Contract Act framework does not apply to the awarded base scope because the work is construction and installation.

4. DOMESTIC MATERIAL SOURCING
Structural iron and steel and identified construction materials shall satisfy the project's U.S.-manufacture and domestic-content requirements. Subcontractor shall retain supplier material-origin certifications. A TAA-designated-country component does not by itself satisfy the project's domestic-source requirement. Noncompliant material installed without approval must be replaced at Subcontractor's cost, including direct removal, replacement, retesting, and attributable schedule impacts.

5. CERTIFIED COST OR PRICING DATA
Certified cost or pricing data were requested and used to establish the negotiated firm-fixed price. Subcontractor certifies that the identified cost or pricing data were current, accurate, and complete as of the agreed date. If defective pricing increased the subcontract price, Prime Contractor may reduce the price by the demonstrated increase plus related interest and reasonable incremental audit costs.

6. LIQUIDATED DAMAGES
Substantial Completion is required by August 31, 2027. For Subcontractor-controlled critical-path delay, liquidated damages are $4,000 per calendar day, capped at 10% of the base subcontract price.

7. GOVERNMENT-CAUSED SUSPENSION
Prime Contractor may issue a written suspension implementing Government direction. For the first 45 calendar days of a Government-caused suspension, Subcontractor receives a corresponding schedule extension but generally no price adjustment. Field supervision, idle equipment, demobilization, remobilization, escalation, and unabsorbed overhead during that initial period are nonreimbursable.

8. AUDIT AND RECORDS
Subcontractor shall retain pricing, payroll, material-origin, invoice, lower-tier, and performance-cost records for six years after final payment. Prime Contractor, the Government, and authorized audit representatives may examine relevant records, including affiliate and lower-tier records supporting submitted charges or certifications. A material overcharge, defective pricing, unsupported cost, or false certification may require reimbursement of reasonable incremental audit costs.

9. ASSIGNMENT AND CHANGE OF CONTROL
Prime Contractor may assign this subcontract to the Government, an affiliate, or a successor prime without Subcontractor consent. Subcontractor may not assign this subcontract, transfer substantially all project assets, or undergo more than a 25% direct or indirect change of control without Prime Contractor's prior written consent. A prohibited transaction is a material breach.

10. TECHNICAL DATA AND PROPRIETARY RIGHTS
Subcontractor grants Prime Contractor and the Government a perpetual, irrevocable, royalty-free, transferable license to use, reproduce, disclose, modify, and authorize others to use technical data and project-specific improvements for operation, repair, reprocurement, and future competitive acquisitions.

11. PAYMENT PROTECTION
Payment to Subcontractor is not conditioned on, contingent upon, or delayed until Government payment to Prime Contractor.

12. CHANGE NOTICE PROTECTION
Subcontractor should notify Prime Contractor within 15 business days after recognizing a potential change. A later notice does not waive adjustment rights unless Prime Contractor demonstrates material prejudice caused by the delay.

13. COMPLETE ATTACHMENTS AND FUTURE FLOWDOWNS
Attachments A through H are included with this subcontract and none is intentionally deferred. Only the clauses identified in Attachment H bind Subcontractor; any later Prime Contract requirement that materially changes Subcontractor obligations requires a written bilateral modification with an equitable adjustment.

14. DEFAULT CURE PROTECTION
Either party may terminate for material breach that remains uncured for 30 calendar days after detailed written notice. If cure reasonably requires more than 30 days, the breaching party may continue cure under a written plan so long as it begins promptly and proceeds diligently.`;

let failures = 0;
function check(label, condition, details = "") {
  if (condition) console.log(`PASS: ${label}`);
  else {
    console.error(`FAIL: ${label}${details ? ` — ${details}` : ""}`);
    failures++;
  }
}

check(
  "PDF soft-wrap negative: future CUI + bilateral modification is not affirmative cyber",
  !hasAffirmativeCyberSignal(FUTURE_CYBER_SOFT_WRAP)
);
check(
  "single-line negative: future CUI + bilateral modification is not affirmative cyber",
  !hasAffirmativeCyberSignal(FUTURE_CYBER_SINGLE_LINE)
);
check(
  "PDF soft-wrap positive: real multiline DFARS/NIST safeguarding remains affirmative cyber",
  hasAffirmativeCyberSignal(AFFIRMATIVE_CYBER_SOFT_WRAP)
);

const documentText = normalizeWhitespace(PDF_LIKE_IRONCLAD);
const classification = classifyContract(documentText);
const familyKeys = new Set(selectDetectorFamilies(classification, documentText).map((family) => family.key));
const generated = runDeterministicDetectors(documentText);
const verification = verifyFindings(generated, documentText);
const deduped = dedupeFindings(verification.verified, documentText);
const ranked = rankFindings(deduped);
const finalFindings = [...ranked.primaryTraps, ...ranked.secondaryConcerns];
const labels = new Set(finalFindings.map((finding) => finding.regulation));

check(
  "PDF-like Ironclad: sector is Construction / Facility / Trade",
  classification.sector === "Construction / Facility / Trade",
  classification.sector
);
check(
  "PDF-like Ironclad: sector evidence is affirmative construction evidence",
  Boolean(classification.sectorEvidence && /field-install|construction|structural|concrete|facility|certified payroll/i.test(classification.sectorEvidence)),
  classification.sectorEvidence ?? "no sector evidence"
);
check(
  "PDF-like Ironclad: future CUI soft wrap does not control sector evidence",
  !/CUI|DFARS|NIST|cybersecurity baseline/i.test(classification.sectorEvidence ?? ""),
  classification.sectorEvidence ?? "no sector evidence"
);
check(
  "PDF-like Ironclad: negative-only cyber language does not select cyber family",
  !familyKeys.has("cyber"),
  [...familyKeys].join(", ")
);

for (const label of [
  "Construction Wage / Certified Payroll Compliance",
  "Domestic Sourcing / Construction Material Compliance",
  "Certified Cost or Pricing Data / Defective Pricing Exposure",
  "Liquidated Damages / Schedule Exposure",
  "Government-Caused Suspension / Uncompensated Delay Costs",
  "Broad Audit / Records / Cost-Pricing Access",
  "One-Sided Assignment / Change-of-Control Restriction",
  "Perpetual Transferable License to Technical Data / Improvements",
]) {
  check(`PDF-like Ironclad positive preserved: ${label}`, labels.has(label), [...labels].join(" | "));
}

check(
  "PDF-like Ironclad: every deterministic quote remains grounded",
  finalFindings.every((finding) => quoteExistsInDocument(finding.foundText, documentText))
);
check(
  "PDF-like Ironclad negative preserved: no affirmative cyber finding",
  !finalFindings.some((finding) => finding.familyKey === "cyber")
);
check(
  "PDF-like Ironclad negative preserved: no SCLS/SCA finding",
  !finalFindings.some((finding) => /SCLS|Service Contract Act|52\.222-41/i.test(finding.regulation))
);
check(
  "PDF-like Ironclad negative preserved: no pay-if-paid",
  !finalFindings.some((finding) => /pay[\s-]if[\s-]paid|contingent government/i.test(finding.regulation))
);
check(
  "PDF-like Ironclad negative preserved: no short change-notice waiver",
  !finalFindings.some((finding) => /Short Notice-of-Claim|Change Notice Waiver/i.test(finding.regulation))
);
check(
  "PDF-like Ironclad negative preserved: no missing/deferred documents",
  !finalFindings.some((finding) => /Missing \/ Deferred|Missing or Deferred|Missing Documents/i.test(finding.regulation))
);
check(
  "PDF-like Ironclad negative preserved: no unilateral future flowdown",
  !finalFindings.some((finding) => /Future Flowdowns|Prime Contract Control|Unilateral Future/i.test(finding.regulation))
);
check(
  "PDF-like Ironclad negative preserved: no short/default-cure finding",
  !finalFindings.some((finding) => /Short Default Cure|Cure Period|Termination Discretion/i.test(finding.regulation))
);

if (failures) {
  console.error(`\n${failures} PDF soft-wrap cyber-sector regression check(s) failed.`);
  process.exit(1);
}

console.log("\nAll PDF soft-wrap cyber-sector regression checks passed.");
