// Deterministic fallbacks for explicit construction/supply/compliance risks
// that are important enough not to depend solely on model recall. Every
// returned finding uses a literal contiguous source window and still passes
// the shared verifyFindings() grounding/sanity layer downstream.

import { extractClauseSegments } from "./clause-segments";
import {
  hasAffirmativeAuditSignal,
  hasAffirmativeConstructionWageSignal,
  hasAffirmativeSupplySignal,
} from "./affirmative-signals";
import type { Finding, RiskLevel } from "./types";

interface CoverageRule {
  familyKey: string;
  regulation: string;
  severity: RiskLevel;
  predicate: (text: string) => boolean;
  riskAnalysis: (text: string) => string;
  redlineFix: string;
}

function candidateWindows(documentText: string): string[] {
  const segments = extractClauseSegments(documentText);
  const windows: string[] = [];

  if (segments.length > 0) {
    for (let i = 0; i < segments.length; i++) {
      for (let width = 1; width <= 3 && i + width - 1 < segments.length; width++) {
        const start = segments[i].start;
        const end = segments[i + width - 1].end;
        if (end - start > 1800) break;
        const text = documentText.slice(start, end).trim();
        if (text) windows.push(text);
      }
    }
  }

  if (windows.length === 0) {
    const paragraphs = documentText.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    for (let i = 0; i < paragraphs.length; i++) {
      for (let width = 1; width <= 3 && i + width - 1 < paragraphs.length; width++) {
        const text = paragraphs.slice(i, i + width).join("\n\n");
        if (text.length <= 1800) windows.push(text);
      }
    }
  }

  return windows;
}

function firstWindow(documentText: string, predicate: (text: string) => boolean): string | null {
  return candidateWindows(documentText).find(predicate) ?? null;
}

const RULES: CoverageRule[] = [
  {
    familyKey: "labor",
    regulation: "Construction Wage / Certified Payroll Compliance",
    severity: "Medium-High",
    predicate: (text) =>
      hasAffirmativeConstructionWageSignal(text) &&
      /certified\s+payroll|wages?[^.]{0,120}fringe|fringe\s+benefits?|underpayments?|back\s+wages?/i.test(text),
    riskAnalysis: () =>
      "This clause affirmatively subjects covered construction labor to stated wage/fringe and certified-payroll obligations, creating direct labor-cost, payroll-record, and underpayment-correction exposure for the Subcontractor.",
    redlineFix:
      "Confirm the applicable wage determination and classifications are included and priced, define responsibility for classification changes, and preserve a price/schedule adjustment if Government-directed wage requirements materially change after award.",
  },
  {
    familyKey: "supply",
    regulation: "Domestic Sourcing / Construction Material Compliance",
    severity: "Medium-High",
    predicate: (text) =>
      hasAffirmativeSupplySignal(text) &&
      /(?:structural\s+(?:iron|steel)|construction\s+materials?|domestic|U\.S\.[\s-]*(?:manufactur|produc)|origin\s+certif|specialty\s+metals?|buy\s+american)/i.test(text) &&
      /\b(?:shall|must|required|satisfy|certif|retain|replace|compliant|noncompliant)\b/i.test(text),
    riskAnalysis: (text) =>
      /replace|remov|retest/i.test(text)
        ? "This clause imposes domestic-source/material-origin requirements and places replacement, removal, retesting, or attributable schedule exposure on the Subcontractor for noncompliant material."
        : "This clause imposes domestic-source/material-origin requirements and related certification or record-retention obligations on the Subcontractor.",
    redlineFix:
      "Confirm the exact domestic-content/manufacturing standard for each covered material, require supplier certifications before installation, and provide a change/equitable-adjustment path for Government-directed sourcing changes outside the Subcontractor's control.",
  },
  {
    familyKey: "audit",
    regulation: "Certified Cost or Pricing Data / Defective Pricing Exposure",
    severity: "High",
    predicate: (text) =>
      /certified\s+cost\s+or\s+pricing\s+data/i.test(text) &&
      /current[^.]{0,40}accurate[^.]{0,40}complete|defective\s+pricing|price\s+reduction|interest|audit\s+cost/i.test(text),
    riskAnalysis: () =>
      "This clause requires certified cost or pricing data and permits a price reduction or related recovery if defective data increased the negotiated price, creating direct defective-pricing and audit exposure even though the subcontract is FFP.",
    redlineFix:
      "Confirm the certification cutoff date and data set, preserve records supporting all disclosed facts and judgments, and limit any price reduction, interest, or audit-cost recovery to demonstrated defective data that actually increased the negotiated price.",
  },
  {
    familyKey: "construction",
    regulation: "Liquidated Damages / Schedule Exposure",
    severity: "Medium-High",
    predicate: (text) =>
      /liquidated\s+damages|\$\s*[\d,]+(?:\.\d{2})?\s+per\s+calendar\s+day/i.test(text) &&
      /delay|substantial\s+completion|completion\s+date|late/i.test(text),
    riskAnalysis: () =>
      "This clause imposes per-day liquidated-damages exposure for Subcontractor-controlled delay, creating direct schedule and margin risk even when the aggregate amount is capped.",
    redlineFix:
      "Tie liquidated damages only to critical-path delay demonstrably caused by the Subcontractor, exclude concurrent/Prime/Government delay, require schedule-impact documentation, and preserve the stated aggregate cap.",
  },
  {
    familyKey: "construction",
    regulation: "Government-Caused Suspension / Uncompensated Delay Costs",
    severity: "Medium-High",
    predicate: (text) =>
      /suspend|suspension|stop[\s-]work/i.test(text) &&
      /(?:45|forty[\s-]five)\s+calendar\s+days?/i.test(text) &&
      /no\s+price\s+adjustment|non[\s-]?reimbursable|not\s+reimbursable/i.test(text),
    riskAnalysis: () =>
      "This clause shifts the stated initial Government-caused suspension period's field, idle-equipment, demobilization/remobilization, escalation, or overhead costs to the Subcontractor while providing schedule relief but no price adjustment.",
    redlineFix:
      "Provide an equitable price adjustment for documented Prime/Government-caused suspension costs from day one, including field supervision, idle equipment, demobilization/remobilization, escalation, and unabsorbed overhead, subject to reasonable mitigation duties.",
  },
  {
    familyKey: "audit",
    regulation: "Broad Audit / Records / Cost-Pricing Access",
    severity: "Medium",
    predicate: (text) =>
      hasAffirmativeAuditSignal(text) &&
      /records?|retention|retain/i.test(text) &&
      /Prime|Government|audit|examine|authorized\s+audit\s+representatives?/i.test(text) &&
      /material\s+overcharge|defective\s+pricing|unsupported\s+cost|false\s+certification|incremental\s+audit\s+cost|reimburse[^.]{0,120}audit\s+cost|audit\s+cost[^.]{0,120}reimburse/i.test(text),
    riskAnalysis: () =>
      "This clause imposes extended records-retention and Prime/Government audit-access duties, with potential incremental exposure for unsupported cost, overcharge, defective pricing, or false certification.",
    redlineFix:
      "Limit audit access to relevant records for the stated retention period, protect privileged/proprietary material, require reasonable notice and secure handling, and tie incremental audit-cost reimbursement to a documented material overcharge or noncompliance.",
  },
  {
    familyKey: "liability",
    regulation: "One-Sided Assignment / Change-of-Control Restriction",
    severity: "Medium",
    predicate: (text) =>
      /Prime(?:\s+Contractor)?[^.]{0,120}\bassign[^.]{0,160}\bwithout[^.]{0,100}Subcontractor[^.]{0,80}consent/i.test(text) &&
      /Subcontractor[^.]{0,160}(?:may\s+not|shall\s+not|cannot|must\s+not)[^.]{0,160}(?:assign|transfer|change\s+of\s+control)/i.test(text),
    riskAnalysis: () =>
      "This clause gives the Prime broader assignment flexibility while restricting the Subcontractor's assignment, substantial asset transfer, or change of control, creating asymmetric transaction and default exposure.",
    redlineFix:
      "Make assignment/change-of-control consent reciprocal or not unreasonably withheld, add permitted affiliate/reorganization transactions, and require a material adverse-effect standard before a transaction becomes a breach.",
  },
  {
    familyKey: "data-rights",
    regulation: "Perpetual Transferable License to Technical Data / Improvements",
    severity: "Medium-High",
    predicate: (text) =>
      /perpetual[^.]{0,100}irrevocable[^.]{0,100}royalty[\s-]free[^.]{0,100}transferable\s+license/i.test(text) &&
      /technical\s+data|project[\s-]specific\s+improvements?|improvements?/i.test(text),
    riskAnalysis: () =>
      "This clause grants a perpetual, irrevocable, royalty-free, transferable license in technical data or project-specific improvements, creating broad downstream use, disclosure, modification, reprocurement, and competitive-use exposure.",
    redlineFix:
      "Limit the license to deliverables created and paid for under this subcontract, exclude identified pre-existing tools/know-how, restrict competitive reprocurement use where negotiable, and preserve proprietary markings and third-party restrictions.",
  },
];

export function runComplianceCoverageDetectors(documentText: string): Finding[] {
  const findings: Finding[] = [];
  for (const rule of RULES) {
    const foundText = firstWindow(documentText, rule.predicate);
    if (!foundText) continue;
    findings.push({
      triggerType: "Contract Risk Trigger",
      regulation: rule.regulation,
      severity: rule.severity,
      foundText,
      riskAnalysis: rule.riskAnalysis(foundText),
      redlineFix: rule.redlineFix,
      familyKey: rule.familyKey,
    });
  }
  return findings;
}
