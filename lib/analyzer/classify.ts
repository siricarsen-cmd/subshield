// Deterministic contract type / sector classification via keyword scoring.
// Runs before detector selection so we only prioritize relevant risk families
// instead of throwing the entire taxonomy at every document.

import type { ContractClassification, ContractType, Sector } from "./types";

interface ScoredPattern {
  pattern: RegExp;
  weight: number;
}

function score(text: string, patterns: ScoredPattern[]): number {
  return patterns.reduce((sum, { pattern, weight }) => (pattern.test(text) ? sum + weight : sum), 0);
}

const CONTRACT_TYPE_SCORES: Record<Exclude<ContractType, "Unknown" | "Hybrid (FFP / T&M)">, ScoredPattern[]> = {
  // [\s-]* (not \s*) so hyphenated forms like "Time-and-Materials" still match.
  FFP: [{ pattern: /firm[\s-]*fixed[\s-]*price|\bFFP\b/i, weight: 3 }],
  "T&M": [{ pattern: /time[\s-]*(?:and|&)[\s-]*materials|\bT&M\b/i, weight: 3 }],
  "Labor-Hour": [{ pattern: /labor[\s-]hour\s+(?:contract|subcontract|type)/i, weight: 3 }],
  CPFF: [{ pattern: /cost[\s-]*plus[\s-]*fixed[\s-]*fee|\bCPFF\b/i, weight: 3 }],
  "Cost-Reimbursement": [{ pattern: /cost[\s-]reimbursement|cost[\s-]reimbursable/i, weight: 3 }],
  IDIQ: [{ pattern: /indefinite[\s-]delivery,?\s*indefinite[\s-]quantity|\bIDIQ\b/i, weight: 3 }],
  // Requires the document to declare itself a Purchase Order (title/self-reference),
  // not just a passing mention (e.g. "no purchase order number has been issued").
  "Purchase Order": [
    { pattern: /\bthis\s+purchase\s+order\b|\bpurchase\s+order\s+agreement\b|^\s*purchase\s+order\b/im, weight: 2 },
  ],
  "Teaming Agreement": [{ pattern: /teaming\s+agreement/i, weight: 3 }],
};

const CYBER_SIGNALS: ScoredPattern[] = [
  { pattern: /252\.204-7012|252\.204-7019|252\.204-7020|252\.204-7021|DFARS\s*252\.204/i, weight: 4 },
  { pattern: /NIST\s*SP\s*800-171|CMMC/i, weight: 4 },
  { pattern: /controlled\s+unclassified\s+information|\bCUI\b|\bCDI\b/i, weight: 4 },
  { pattern: /\bDD\s*254\b|DD\s*Form\s*254/i, weight: 4 },
  { pattern: /ARCYBER|cyber\s+incident\s+report|facility\s+clearance|personnel\s+clearance/i, weight: 3 },
];

const ADMIN_SIGNALS: ScoredPattern[] = [
  { pattern: /administrative\s+support|document\s+coordination|records?\s+management|tracking\s+logs?/i, weight: 2 },
];

const CONSTRUCTION_SIGNALS: ScoredPattern[] = [
  { pattern: /\bHVAC\b|access[\s-]control|low[\s-]voltage|field\s+installation|facility\s+upgrade|construction|repair\s+(?:and|&)?\s*(?:maintenance|services)|records?\s+storage\s+room/i, weight: 3 },
  { pattern: /davis[\s-]bacon|construction\s+wage\s+rate|certified\s+payroll|wage\s+determination/i, weight: 3 },
  { pattern: /retainage|liquidated\s+damages|site\s+access|no\s+damages\s+for\s+delay/i, weight: 2 },
];

const SUPPLY_SIGNALS: ScoredPattern[] = [
  { pattern: /first\s+article\s+testing|counterfeit\s+parts|inspection\s+and\s+acceptance|packaging,?\s*marking/i, weight: 3 },
  { pattern: /\bFOB\b|title\s+and\s+risk\s+of\s+loss|specialty\s+metals|domestic\s+content/i, weight: 3 },
];

const PROFESSIONAL_SIGNALS: ScoredPattern[] = [
  { pattern: /professional\s+services|labor\s+categories|key\s+personnel|staff[\s-]augmentation/i, weight: 2 },
  { pattern: /service\s+contract\s+labor\s+standards|52\.222-41|Service\s+Contract\s+Act/i, weight: 2 },
];

export function classifyContract(documentText: string): ContractClassification {
  const text = documentText;
  const notes: string[] = [];

  let bestType: ContractType = "Unknown";
  let bestTypeScore = 0;
  (Object.keys(CONTRACT_TYPE_SCORES) as Array<Exclude<ContractType, "Unknown" | "Hybrid (FFP / T&M)">>).forEach((type) => {
    const s = score(text, CONTRACT_TYPE_SCORES[type]);
    if (s > bestTypeScore) {
      bestTypeScore = s;
      bestType = type;
    }
  });
  if (bestTypeScore === 0) notes.push("No explicit contract-type phrase found; type classification defaulted to Unknown.");

  // Hybrid override: a document can carry both FFP/deliverable-pricing language
  // AND time-and-materials/labor-hour payment language at once (e.g. FFP
  // deliverables billed on a T&M/labor-hour basis). The loop above would pick
  // whichever type scores highest, and ties always favor FFP because it's
  // declared first in CONTRACT_TYPE_SCORES - that silently discards real T&M
  // signal instead of surfacing the hybrid risk. Checked after the loop so it
  // overrides a single-type win whenever both signal groups are genuinely
  // present, not just on a score tie.
  const ffpScore = score(text, CONTRACT_TYPE_SCORES.FFP);
  const tmOrLaborHourScore = Math.max(score(text, CONTRACT_TYPE_SCORES["T&M"]), score(text, CONTRACT_TYPE_SCORES["Labor-Hour"]));
  if (ffpScore > 0 && tmOrLaborHourScore > 0) {
    bestType = "Hybrid (FFP / T&M)";
    bestTypeScore = ffpScore + tmOrLaborHourScore;
    notes.push(
      "Document contains both FFP/deliverable-pricing language and time-and-materials/labor-hour payment language; classified as Hybrid so T&M-heavy risk is not overridden by FFP language."
    );
  }

  const cyberScore = score(text, CYBER_SIGNALS);
  const constructionScore = score(text, CONSTRUCTION_SIGNALS);
  const supplyScore = score(text, SUPPLY_SIGNALS);
  const professionalScore = score(text, PROFESSIONAL_SIGNALS);
  const adminScore = score(text, ADMIN_SIGNALS);

  // Guard: cyber/CUI/DD254/construction/trade signals must never be classified as
  // Administrative Support, even if admin-sounding keywords are also present.
  const blocksAdminLabel = cyberScore > 0 || constructionScore > 0;

  let sector: Sector = "Services (General)";
  let sectorEvidence: string | undefined;

  const scores: Array<{ sector: Sector; value: number }> = [
    { sector: "Cybersecurity / IT / Professional Services", value: cyberScore },
    { sector: "Construction / Facility / Trade", value: constructionScore },
    { sector: "Supply / Manufacturing", value: supplyScore },
    { sector: "Professional Services / Administrative Support", value: blocksAdminLabel ? 0 : adminScore + professionalScore * 0.5 },
  ];

  const top = scores.reduce((a, b) => (b.value > a.value ? b : a), { sector: "Services (General)" as Sector, value: 0 });
  if (top.value > 0) {
    sector = top.sector;
  } else if (professionalScore > 0 && !blocksAdminLabel) {
    sector = "Professional Services / Administrative Support";
  } else {
    sector = "Unknown";
    notes.push("No strong sector signal found; sector classification defaulted to Unknown.");
  }

  const evidencePatternsBySector: Record<string, RegExp> = {
    "Cybersecurity / IT / Professional Services": /[^.\n]{0,80}(?:252\.204-7012|NIST\s*SP\s*800-171|CMMC|CUI|CDI|DD\s*254)[^.\n]{0,80}/i,
    "Construction / Facility / Trade": /[^.\n]{0,80}(?:HVAC|construction|davis[\s-]bacon|certified\s+payroll|retainage)[^.\n]{0,80}/i,
    "Supply / Manufacturing": /[^.\n]{0,80}(?:first\s+article\s+testing|counterfeit\s+parts|inspection\s+and\s+acceptance)[^.\n]{0,80}/i,
    "Professional Services / Administrative Support": /[^.\n]{0,80}(?:administrative\s+support|document\s+coordination|professional\s+services)[^.\n]{0,80}/i,
  };
  const evidencePattern = evidencePatternsBySector[sector];
  if (evidencePattern) {
    const m = text.match(evidencePattern);
    if (m) sectorEvidence = m[0].trim().replace(/\s+/g, " ").slice(0, 200);
  }

  return {
    contractType: bestType,
    sector,
    sectorEvidence,
    notes,
  };
}
