// Verification layer: confirms every finding is grounded in the current document
// and applies contradiction guards before a finding is allowed to surface.

import { quoteExistsInDocument, scrubUngroundedArticleReferences } from "./text";
import type { Finding } from "./types";

export interface VerificationResult {
  verified: Finding[];
  dropped: Array<{ finding: Finding; reason: string }>;
}

// Contradiction guards: rules that suppress a category of finding when the
// document contains language that directly contradicts the trap being flagged.
function violatesContradictionGuard(finding: Finding, documentText: string): string | null {
  const reg = finding.regulation.toLowerCase();
  const analysis = `${finding.riskAnalysis} ${finding.foundText}`.toLowerCase();
  // PDF-extracted text line-wraps mid-sentence, so guard regexes match against a
  // whitespace-flattened copy — otherwise a "not conditioned on Government payment"
  // sentence that happens to wrap across a line break would silently fail to match.
  const flatDocText = documentText.replace(/\s+/g, " ");
  const doc = flatDocText.toLowerCase();

  const isContingentPaymentFinding =
    reg.includes("pay-if-paid") || reg.includes("contingent payment") || reg.includes("pay if paid");
  if (isContingentPaymentFinding) {
    const paymentNotConditioned =
      /payment[^.]{0,60}(?:shall\s+not\s+be|is\s+not|not)\s+condition(?:ed)?[^.]{0,60}(?:government|owner)/i.test(
        flatDocText
      );
    if (paymentNotConditioned) {
      return 'Document explicitly states payment is not conditioned on Government/Owner payment; contingent-payment finding suppressed.';
    }
  }

  const isVagueWorkshareFinding =
    reg.includes("vague workshare") || reg.includes("no guaranteed") || reg.includes("workshare");
  if (isVagueWorkshareFinding) {
    const isFFPWithDefinedPrice =
      /firm[\s-]fixed[\s-]price|\bFFP\b/i.test(flatDocText) && /\$[\d,]+(?:\.\d{2})?/.test(flatDocText);
    const hasSeparateNoGuaranteeLanguage = /(?:no\s+guarantee|does\s+not\s+guarantee)[^.]{0,80}(?:quantity|quantities|workshare|work\s+share)/i.test(
      flatDocText
    );
    if (isFFPWithDefinedPrice && !hasSeparateNoGuaranteeLanguage) {
      return "Document is firm-fixed-price with a defined total price and no separate no-guarantee quantity/workshare language; vague-workshare finding suppressed.";
    }
  }

  const isDavisBaconFinding = reg.includes("davis-bacon") || reg.includes("construction wage rate");
  if (isDavisBaconFinding) {
    const hasTrigger = /davis[\s-]bacon|construction\s+wage\s+rate|certified\s+payroll|wage\s+determination|52\.222-6/i.test(
      flatDocText
    );
    if (!hasTrigger) {
      return "No Davis-Bacon / Construction Wage Rate Requirements / certified-payroll / wage-determination language or FAR 52.222-6 present in the document.";
    }
  }

  const isSCLSFinding = reg.includes("scls") || reg.includes("service contract act") || reg.includes("52.222-41");
  if (isSCLSFinding) {
    const hasTrigger = /service\s+contract\s+labor\s+standards|service\s+contract\s+act|52\.222-41/i.test(flatDocText);
    if (!hasTrigger) {
      return "No Service Contract Labor Standards / Service Contract Act / FAR 52.222-41 language present in the document.";
    }
  }

  const isDfars7012Finding = reg.includes("252.204-7012") || (reg.includes("dfars") && reg.includes("cyber"));
  if (isDfars7012Finding) {
    const hasTrigger = /252\.204-7012|cui|cdi|nist\s*sp\s*800-171|cmmc|cyber\s+incident\s+report/i.test(flatDocText);
    if (!hasTrigger) {
      return "No DFARS 252.204-7012 / CUI / CDI / NIST SP 800-171 / cyber-incident-reporting language present in the document.";
    }
  }

  // Exact-phrase guards: a finding's own text should not cite a fixed timeframe
  // that never actually occurs in the document.
  const fixedPhrases = ["3 business days", "5 calendar days"];
  for (const phrase of fixedPhrases) {
    if (analysis.includes(phrase) && !doc.includes(phrase)) {
      return `Finding text references the fixed phrase "${phrase}", which does not appear in the current document.`;
    }
  }

  return null;
}

export function verifyFindings(findings: Finding[], documentText: string): VerificationResult {
  const verified: Finding[] = [];
  const dropped: Array<{ finding: Finding; reason: string }> = [];

  for (const finding of findings) {
    if (!finding.regulation || !finding.regulation.trim()) {
      dropped.push({ finding, reason: "Finding is missing a regulation/risk label and cannot be displayed." });
      continue;
    }

    if (!quoteExistsInDocument(finding.foundText, documentText)) {
      dropped.push({ finding, reason: "foundText could not be verified as an exact quote from the current document." });
      continue;
    }

    const guardReason = violatesContradictionGuard(finding, documentText);
    if (guardReason) {
      dropped.push({ finding, reason: guardReason });
      continue;
    }

    verified.push({
      ...finding,
      regulation: scrubUngroundedArticleReferences(finding.regulation, documentText),
      riskAnalysis: scrubUngroundedArticleReferences(finding.riskAnalysis, documentText),
      redlineFix: scrubUngroundedArticleReferences(finding.redlineFix, documentText),
    });
  }

  return { verified, dropped };
}

// Guard for classify.ts output: cyber/CUI/DD254/construction/trade work must
// never surface as "Professional Services / Administrative Support".
export function guardIndustryLabel(label: string, documentText: string): string {
  const blockedSignals = /252\.204-7012|CUI|CDI|DD\s*254|ARCYBER|\bHVAC\b|access[\s-]control|low[\s-]voltage|field\s+installation|facility\s+upgrade|construction|repair\s+(?:and|&)?\s*(?:maintenance|services)|records?\s+storage\s+room/i;
  if (label.toLowerCase().includes("administrative support") && blockedSignals.test(documentText)) {
    return "Services (General)";
  }
  return label;
}
