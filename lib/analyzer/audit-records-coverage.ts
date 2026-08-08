import type { Finding } from "./types";

const RETENTION_RE =
  /(?:retain|retention)[^.]{0,220}(?:pricing|payroll|material[\s-]origin|invoice|lower[\s-]tier|performance[\s-]cost|records?)[^.]{0,120}(?:three|four|five|six|seven|\d+)\s+years?|(?:three|four|five|six|seven|\d+)\s+years?[^.]{0,180}(?:retain|retention|records?)/i;
const AUDIT_ACCESS_RE =
  /(?:Prime(?:\s+Contractor)?|Government|authorized\s+audit\s+representatives?)[^.]{0,220}(?:audit|examine|review|access)[^.]{0,220}records?|records?[^.]{0,220}(?:audit|examine|review|access)[^.]{0,180}(?:Prime(?:\s+Contractor)?|Government|authorized\s+audit\s+representatives?)/i;
const ADVERSE_AUDIT_CONSEQUENCE_RE =
  /material\s+overcharge|defective\s+pricing|unsupported\s+cost|false\s+certification|incremental\s+audit\s+cost|reimburse[^.]{0,120}audit\s+cost|audit\s+cost[^.]{0,120}reimburse/i;

function sentenceWindows(documentText: string): string[] {
  const sentences = documentText
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);
  const windows: string[] = [];
  for (let i = 0; i < sentences.length; i++) {
    for (let width = 1; width <= 3 && i + width <= sentences.length; width++) {
      const window = sentences.slice(i, i + width).join(" ");
      if (window.length <= 1800) windows.push(window);
    }
  }
  return windows;
}

export function runAuditRecordsCoverageDetector(documentText: string): Finding[] {
  const foundText = sentenceWindows(documentText).find(
    (window) =>
      RETENTION_RE.test(window) &&
      AUDIT_ACCESS_RE.test(window) &&
      ADVERSE_AUDIT_CONSEQUENCE_RE.test(window)
  );
  if (!foundText) return [];

  return [
    {
      triggerType: "Contract Risk Trigger",
      regulation: "Broad Audit / Records / Cost-Pricing Access",
      severity: "Medium",
      foundText,
      riskAnalysis:
        "This clause imposes extended records-retention and Prime/Government audit-access duties, with potential incremental exposure for unsupported cost, overcharge, defective pricing, or false certification.",
      redlineFix:
        "Limit audit access to relevant records for the stated retention period, protect privileged/proprietary material, require reasonable notice and secure handling, and tie incremental audit-cost reimbursement to a documented material overcharge or noncompliance.",
      familyKey: "audit",
    },
  ];
}
