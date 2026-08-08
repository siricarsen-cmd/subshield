// Detector family catalog + selection, and the grounded evidence-based detection call.
// The model is never told which phrases to force-match. It is told which families
// are relevant to *this* document and is required to quote exact evidence for
// anything it reports; unverifiable findings are dropped downstream in sanity.ts.

import type { ContractClassification, DetectorFamily, Finding } from "./types";

export const DETECTOR_FAMILIES: DetectorFamily[] = [
  {
    key: "structure",
    label: "Contract Structure & Missing Documents",
    description:
      "No SOW, flowdown list/matrix, wage determination, DD254, CUI/cyber attachment, or quality/safety plan currently included in the package (describe these as absent from the current package, not as having been lost or previously promised, unless the document itself says so); incorporation-by-reference of the prime contract or later-issued/future flow-down requirements that automatically bind Subcontractor without review; prime contract terms or later-issued prime directives controlling or taking precedence over the subcontract; pending/revisable exhibits; conflicting documents; order-of-precedence gaps; redacted rates; unattached prime contract clauses.",
  },
  {
    key: "payment",
    label: "Payment, Workshare, Notice Deadlines, Funding",
    description:
      "Pay-if-paid, pay-when-paid, or any clause making Subcontractor's right to payment contingent on the Prime actually receiving funds from the Government/Owner (including language stating Prime has no obligation to pay amounts not received from the Government); no guaranteed workshare, minimum hours, work packages, task assignments, task orders, revenue, or level of effort (estimate-only or requirements-style language with no minimum commitment); short or strict notice-of-claim / change-order notice deadlines (e.g. a specific number of business or calendar days) that waive Subcontractor's right to compensation or a time extension if missed; broad Prime rights to set off, backcharge, deduct, charge back, reduce payment for, or withhold amounts owed to Subcontractor for costs, damages, or claims; retainage and delayed release; invoice rejection windows; strict billing system requirements; Net 45/60 delay; DCAA/DCMA audit-dependent final payment; incremental funding/limitation of funds; work beyond funded amount at sub's risk; withholding; final lien waiver/release-of-claims traps.",
  },
  {
    key: "flowdowns",
    label: "FAR / DFARS / Agency Flowdowns",
    description:
      "Broad or mandatory-vs-discretionary FAR/DFARS flowdowns, commercial-item flowdown limits, FAR 52.244-6, ethics/lobbying (52.203), cyber/SAM reporting (52.204), cost-or-pricing-data (52.215), small business (52.219), labor (52.222), environmental/safety (52.223), Buy American/TAA (52.225), data rights (52.227), payment (52.232), changes (52.243), Government property (52.245), inspection/quality (52.246), termination (52.249).",
  },
  {
    key: "labor",
    label: "Labor & Wage Compliance",
    description:
      "Davis-Bacon/Construction Wage Rate Requirements (52.222-6), SCA/SCLS (52.222-41), wage adjustment clauses, certified payroll, missing wage determination, labor classification ambiguity, fringe benefits, uncompensated overtime, Defense Base Act insurance.",
  },
  {
    key: "cyber",
    label: "Cybersecurity, CUI, Classified Work",
    description:
      "DFARS 252.204-7012/7008/7019/7020/7021, NIST SP 800-171, CMMC, CUI/CDI, covered contractor information system, DD254, classified work, facility/personnel clearance, badging/PIV, background checks, cyber incident reporting deadlines, flowdown to lower tiers, cyber liability insurance, subcontractor sole liability for cyber incidents.",
  },
  {
    key: "data-rights",
    label: "Data Rights, IP, Software, Technical Data",
    description:
      "Unlimited rights by default, Government purpose rights, limited/restricted rights, failure to list pre-existing IP, failure to mark proprietary data, deferred delivery/ordering, technical data payment withholding, software documentation rights, broad license grants to prime/Government/customer; broad Prime ownership or use rights over Subcontractor deliverables, templates, scripts, mappings, workflow notes, pre-existing tools, or other work product beyond what was actually built for this subcontract.",
  },
  {
    key: "construction",
    label: "Construction / Facility / Trade Subcontract Risk",
    description:
      "Retainage, liquidated damages, no-damages-for-delay, pass-through-only delay recovery, excluded acceleration/standby costs, site access risk, security access delays, differing site condition notice windows, safety stop-work without compensation, warranty response windows, bonds, insurance endorsements, lien waivers, material substitutions, hazardous materials exclusions.",
  },
  {
    key: "supply",
    label: "Supply, Manufacturing, Product Delivery",
    description:
      "Inspection/acceptance, rejection/replacement, warranty, delivery deadlines and late-delivery damages, packaging/marking/shipping, title/risk of loss, FOB terms, counterfeit parts, Buy American/TAA, country of origin, specialty metals, export control, Government property, first article testing, configuration control, obsolete parts, unpriced changes.",
  },
  {
    key: "small-business",
    label: "Small Business & Set-Aside Risk",
    description:
      "Limitations on subcontracting, nonmanufacturer rule, ostensible subcontractor risk, small business subcontracting plan, mentor-protege/JV issues, socioeconomic representations (SDVOSB/WOSB/HUBZone/8(a)), excessive subcontracting, teaming workshare promises not reflected in the subcontract, no post-award guarantee after proposal credit use.",
  },
  {
    key: "liability",
    label: "Liability, Indemnity, Disputes, Termination",
    description:
      "Broad indemnity and duty to defend, including indemnity for alleged violations/noncompliance or third-party claims regardless of Prime's own fault; uncapped liability; consequential damage waiver; a liability cap that limits Prime's exposure to Subcontractor to only the amounts Prime actually received/receives from the Government (report this even if the rest of the document is otherwise favorable); termination for convenience that favors Prime; a stated default-cure period (a specific number of calendar or business days to cure before Prime may terminate for default), especially when paired with broad/immediate termination discretion; an obligation for Subcontractor to continue performing without interruption despite a payment delay, withholding, or dispute between the parties; out-of-state or otherwise burdensome governing law, forum-selection, venue, arbitration, or dispute-resolution procedures; Prime or Government acceptance language allowing rejection, correction, replacement, re-performance, or rework of Subcontractor's work without clear compensation to Subcontractor; attorney fees; one-sided assignment or remedies; release of claims. Treat each of these as a separate, distinct, independently-reportable risk even when several appear in the same document - do not merge them into a single finding.",
  },
  {
    key: "personnel",
    label: "Personnel & Staffing",
    description:
      "Key personnel, prime's right to remove personnel, replacement deadlines, former-employee/non-recruiting restrictions, minimum qualification requirements, unapproved personnel costs not billable, lower-tier subcontracting restrictions.",
  },
  {
    key: "export",
    label: "Export Control, Sanctions, Foreign Sourcing",
    description:
      "ITAR, EAR, export-controlled items, foreign national access, sanctions restrictions, country-of-origin restrictions, prohibited telecom/covered equipment, state-sponsor-of-terrorism clauses.",
  },
  {
    key: "gfp",
    label: "Government Property, GFP/GFE",
    description:
      "Government-furnished property/equipment, reporting requirements, loss/damage responsibility, inventory requirements, return/closeout obligations, title transfer, maintenance responsibility.",
  },
  {
    key: "audit",
    label: "Audit, Records, CAS, Cost/Pricing Data",
    description:
      "DCAA/DCMA audit, record retention, audit access, CAS, cost-or-pricing data, defective pricing/TINA exposure, billing/purchasing/property system requirements, incurred cost submissions, final indirect rate adjustments.",
  },
  {
    key: "insurance",
    label: "Insurance, Bonds, Risk Transfer",
    description:
      "Additional insured, waiver of subrogation, primary/noncontributory wording, professional and cyber liability, workers' comp, Defense Base Act, performance/payment bonds, insurance requirements added after award, unclear coverage limits.",
  },
];

// "payment" (contingent payment, workshare guarantees, notice-of-claim
// deadlines) and "flowdowns" (broad/future flow-down clauses, prime contract
// control) are universal GovCon subcontract commercial risks present
// regardless of sector - they used to be added per-sector, which meant a
// Construction or Supply subcontract never got the payment family at all,
// and Professional Services never got flowdowns. Baselining them closes that
// coverage gap; the switch below now only adds sector-specific families.
const BASELINE_FAMILIES = ["structure", "liability", "payment", "flowdowns"];

// Sector-independent recall gates: cyber/CUI/DFARS obligations, wage/labor-standards
// triggers, and IP/data-rights ownership language can all appear in a document whose
// *dominant* sector score lands elsewhere (e.g. a Construction subcontract that also
// touches a DoD facility's CUI, or a Professional Services subcontract with a broad
// IP assignment clause). The sector switch below only added these families for a
// handful of dominant sectors, so a real trigger phrase in an off-sector document
// meant the LLM was never even told to look - it couldn't report what it wasn't
// asked to check. These regexes only ADD families (raise recall); they never remove
// one, and every resulting finding still has to pass verifyFindings()'s exact-quote
// check plus the existing sanity.ts contradiction guards before it can surface.
const CYBER_TRIGGER = /252\.204-7012|252\.204-7019|252\.204-7020|252\.204-7021|DFARS\s*252\.204|NIST\s*SP\s*800-171|CMMC|controlled\s+unclassified\s+information|\bCUI\b|\bCDI\b|\bDD\s*254\b|cyber\s+incident\s+report/i;
const LABOR_STANDARDS_TRIGGER = /davis[\s-]bacon|construction\s+wage\s+rate|certified\s+payroll|wage\s+determination|service\s+contract\s+labor\s+standards|service\s+contract\s+act|52\.222-41|52\.222-6/i;
// A bare "intellectual property" or "data" reference is not enough: those
// nouns routinely appear only inside third-party indemnity claim lists and
// say nothing about ownership, assignment, licensing, Government rights, or
// marking. Require either a recognized data-rights term or a nearby
// ownership/license/transfer/marking act. This gate only selects the family;
// findings still need their own exact quote and sanity checks downstream.
const DATA_RIGHTS_TRIGGER =
  /data\s+rights|pre[\s-]existing\s+(?:ip|intellectual\s+property|tools?|materials|methods?|know[\s-]how)|unlimited\s+rights|government\s+purpose\s+rights|limited\s+rights|restricted\s+rights|technical\s+data|work\s+product|deliverables?[^.\n]{0,80}(?:owned|ownership|license[ds]?|licen[cs]e)|(?:assign(?:s|ed|ment)?|transfer(?:s|red)?|vest(?:s|ed)?|own(?:s|ed|ership)?|grant(?:s|ed)?[^.\n]{0,30}(?:a\s+)?license|licen[cs]e[ds]?)[^.\n]{0,100}(?:intellectual\s+property|proprietary\s+(?:information|data|materials)|software|technology|data)|(?:intellectual\s+property|proprietary\s+(?:information|data|materials)|software|technology|data)[^.\n]{0,100}(?:assign(?:s|ed|ment)?|transfer(?:s|red)?|vest(?:s|ed)?|own(?:s|ed|ership)?|grant(?:s|ed)?[^.\n]{0,30}(?:a\s+)?license|licen[cs]e[ds]?)|(?:mark(?:ing|ed)?|legend)[^.\n]{0,100}(?:technical\s+data|proprietary|restricted\s+rights|limited\s+rights)/i;

// Prioritizes the risk families that matter for the classified contract type/sector
// instead of blindly applying the entire taxonomy to every document.
export function selectDetectorFamilies(classification: ContractClassification, documentText?: string): DetectorFamily[] {
  const keys = new Set<string>(BASELINE_FAMILIES);

  switch (classification.sector) {
    case "Cybersecurity / IT / Professional Services":
      ["cyber", "labor", "data-rights", "personnel", "small-business"].forEach((k) => keys.add(k));
      break;
    case "Construction / Facility / Trade":
      ["construction", "labor", "insurance"].forEach((k) => keys.add(k));
      break;
    case "Supply / Manufacturing":
      ["supply", "data-rights", "export", "gfp"].forEach((k) => keys.add(k));
      break;
    case "Professional Services / Administrative Support":
      ["labor", "personnel", "small-business"].forEach((k) => keys.add(k));
      break;
  }

  if (
    classification.contractType === "T&M" ||
    classification.contractType === "Labor-Hour" ||
    classification.contractType === "Hybrid (FFP / T&M)"
  ) {
    keys.add("audit");
  }
  if (classification.contractType === "IDIQ") {
    keys.add("small-business");
  }

  if (documentText) {
    if (CYBER_TRIGGER.test(documentText)) keys.add("cyber");
    if (LABOR_STANDARDS_TRIGGER.test(documentText)) keys.add("labor");
    if (DATA_RIGHTS_TRIGGER.test(documentText)) keys.add("data-rights");
  }

  return DETECTOR_FAMILIES.filter((f) => keys.has(f.key));
}

interface RawDetection {
  familyKey: string;
  triggerType: "Contract Risk Trigger" | "Regulatory Trigger";
  regulation: string;
  severity: "High" | "Medium-High" | "Medium" | "Low";
  foundText: string;
  riskAnalysis: string;
  redlineFix: string;
}

const DETECTION_SCHEMA = {
  name: "grounded_contract_findings",
  strict: true,
  schema: {
    type: "object",
    properties: {
      findings: {
        type: "array",
        items: {
          type: "object",
          properties: {
            familyKey: { type: "string" },
            triggerType: { type: "string", enum: ["Contract Risk Trigger", "Regulatory Trigger"] },
            regulation: { type: "string" },
            severity: { type: "string", enum: ["High", "Medium-High", "Medium", "Low"] },
            foundText: { type: "string" },
            riskAnalysis: { type: "string" },
            redlineFix: { type: "string" },
          },
          required: ["familyKey", "triggerType", "regulation", "severity", "foundText", "riskAnalysis", "redlineFix"],
          additionalProperties: false,
        },
      },
    },
    required: ["findings"],
    additionalProperties: false,
  },
};

function buildSystemPrompt(families: DetectorFamily[]): string {
  const familyList = families.map((f) => `- [${f.key}] ${f.label}: ${f.description}`).join("\n");

  return `You are a GovCon subcontract analyst representing the Subcontractor. You review the CURRENT document text supplied by the user and report only risks that are actually present in it.

RELEVANT RISK FAMILIES FOR THIS DOCUMENT (only report findings that belong to one of these):
${familyList}

ABSOLUTE RULES:
1. Every "foundText" must be an EXACT, VERBATIM quote copied from the document text below. Do not paraphrase, summarize, truncate mid-sentence, or combine text from different parts of the document into one quote. Copy full sentences or clauses exactly as they appear, including punctuation.
2. Every factual condition stated in riskAnalysis must appear in that finding's own foundText. riskAnalysis analyzes foundText only; neither riskAnalysis nor redlineFix is evidence that the contract contains a fact.
3. Document-wide context may help locate evidence, but facts from elsewhere in the document must not be imported into a shorter foundText quote.
4. When two adjacent sentences are both needed to support a finding, foundText must contain the complete contiguous passage. Nonadjacent clauses require separate findings and must never be combined into one quote or analysis.
5. Do NOT invent, assume, or force any finding. If a risk family has no real textual evidence in this document, do not report it. Zero findings is valid and expected for a clean document.
6. Do NOT cite an Article, Section, or Clause number unless that exact reference (e.g. "Article 5", "Section 3.2") literally appears in the document text. If you don't know the section number, refer to it descriptively (e.g. "the termination clause") instead of guessing a number.
7. Do NOT use stock phrases like "5 calendar days" or "3 business days" unless that exact phrase appears in foundText. Use the actual number/timeframe stated in foundText.
8. Report each DISTINCT underlying risk only once. If the same risk is restated, cross-referenced, or repeated in multiple places in the document (for example, a contingent/pay-if-paid payment condition mentioned in two different clauses), pick the single clearest, most complete exact quote and report it as ONE finding - do not create several findings for the same risk. Prioritize breadth over depth: surfacing many distinct real risks is more valuable than reporting one risk multiple times with different quotes.
9. riskAnalysis must be plain-English and explain only the operational/financial consequence supported by foundText.
10. redlineFix must propose specific safer language or a concrete negotiation ask, grounded in what the clause currently says.
11. severity reflects the real exposure of that specific finding, not the document as a whole.
12. There is no limit on how many distinct findings you may report. If a single family description lists several sub-patterns (e.g. indemnification, termination, cure period, liability cap, continue-performance) and the document contains textual evidence for more than one of them, report each as its own separate finding - do not stop after one or two findings per family, and do not merge genuinely different clauses into a single finding just because they belong to the same family.
13. When flagging something as missing/absent from the current package (e.g. a flowdown list/matrix, wage determination, SOW, DD254), phrase it as a factual absence from the current document/package (for example: "No current flowdown list/matrix is included in this package" or "Later-issued flow-down requirements are referenced but not currently attached") rather than asserting that such a document previously existed, was promised, or was lost - unless foundText itself makes that claim.

Return only findings you can support with an exact quote from the text provided.`;
}

export async function runGroundedDetectors(
  documentText: string,
  families: DetectorFamily[]
): Promise<Finding[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");

  const systemPrompt = buildSystemPrompt(families);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-4o",
      response_format: { type: "json_schema", json_schema: DETECTION_SCHEMA },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: documentText },
      ],
      temperature: 0.0,
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "Detector model request failed.");

  const parsed = JSON.parse(data.choices[0].message.content) as { findings: RawDetection[] };
  const raw = parsed.findings || [];

  return raw.map((f) => ({
    triggerType: f.triggerType,
    regulation: f.regulation,
    severity: f.severity,
    foundText: f.foundText,
    riskAnalysis: f.riskAnalysis,
    redlineFix: f.redlineFix,
    familyKey: f.familyKey,
  }));
}
