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

// Exclusion-context guard for CONSTRUCTION_SIGNALS/SUPPLY_SIGNALS only (used
// in classifyContract below) - a sector keyword mentioned only inside an
// exclusion/negative-scope clause ("excludes construction...", "does not
// include ... construction") must not count as affirmative sector evidence,
// but a later affirmative occurrence of the same keyword - even in the same
// sentence - must still count. Deliberately NOT a fixed character
// look-behind window: that either bleeds a negation cue across an unrelated
// clause boundary or fails to reach far enough back for a real exclusion
// listed as "excludes X, Y, and Z" (a comma-separated list has no fixed
// length). Instead, for each occurrence this walks back to the nearest
// EXCLUSION_CUE_RE match earlier in the same sentence (no cue before it ->
// affirmative) and then checks whether an independent-clause marker (a comma
// followed by a new subject+modal, e.g. ", Subcontractor shall perform...")
// appears between that cue and the occurrence - if so, the negation's scope
// ended before this occurrence and it counts as affirmative anyway. Only
// wired into CONSTRUCTION_SIGNALS/SUPPLY_SIGNALS; CYBER_SIGNALS and
// PROFESSIONAL_SIGNALS/ADMIN_SIGNALS keep using score() unchanged.
// "not (be)? responsible for" covers "is/are not responsible for" and
// "shall/will/must not be responsible for" - a very common GovCon way to
// state a negative-scope disclaimer list that doesn't use "excludes" or
// "does not include" at all. "(?:may|shall|will) not impose" covers a
// protective payment-restriction list ("may not impose retainage, setoff,
// backcharge, or withholding...") that mentions a sector keyword
// (retainage) only as something the Prime is barred from doing - narrowly
// anchored to "impose" specifically (not a bare "may not"/"not"), so this
// doesn't treat arbitrary "may not" phrasing elsewhere as a sector
// exclusion.
const EXCLUSION_CUE_RE =
  /\b(?:exclud\w*|does\s+not\s+include|do\s+not\s+include|other\s+than|not\s+including|is\s+not\s+a|shall\s+not\s+(?:be\s+(?:deemed|classified|considered)|include)|no\s+construction|not\s+construction|not\s+(?:be\s+)?responsible\s+for|(?:may|shall|will)\s+not\s+impose)\b/gi;

// Two independent clause-reset shapes: a named party taking on an
// obligation ("Subcontractor shall perform...") or a compact scope-noun
// statement ("the scope covers...", "this subcontract requires...") - both
// are common ways real contract prose reintroduces an affirmative statement
// right after a fronted exclusion phrase. Kept as two narrow alternatives
// rather than one broad pattern so a bare comma followed by unrelated prose
// (e.g. a plain list item) still isn't treated as a reset.
const CLAUSE_BREAK_RE =
  /,\s*(?:Subcontractor|Contractor|Prime(?:\s+Contractor)?|Owner)\s+(?:shall|will|must|is\s+required\s+to|may)\b|,\s*(?:the\s+scope|the\s+work|the\s+services|this\s+(?:subcontract|agreement))\s+(?:covers?|includes?|requires?)\b/i;

// Core per-sentence, per-occurrence affirmative-match search shared by
// hasAffirmativeMatch (scoring, boolean) and findAffirmativeEvidenceSnippet
// (sector-evidence display, needs the actual matched sentence) - extracted
// so both consumers use the identical negation logic instead of two
// separately-maintained copies that could drift apart.
function findAffirmativeMatch(text: string, pattern: RegExp): { sentence: string } | null {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const triggerFlags = pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g";

  for (const sentence of sentences) {
    const cueRe = new RegExp(EXCLUSION_CUE_RE.source, EXCLUSION_CUE_RE.flags);
    const cueIndices: number[] = [];
    let cueMatch: RegExpExecArray | null;
    while ((cueMatch = cueRe.exec(sentence)) !== null) {
      cueIndices.push(cueMatch.index);
      if (cueRe.lastIndex === cueMatch.index) cueRe.lastIndex++;
    }

    const triggerRe = new RegExp(pattern.source, triggerFlags);
    let triggerMatch: RegExpExecArray | null;
    while ((triggerMatch = triggerRe.exec(sentence)) !== null) {
      const matchIndex = triggerMatch.index;
      let nearestCueBefore = -1;
      for (const idx of cueIndices) {
        if (idx < matchIndex && idx > nearestCueBefore) nearestCueBefore = idx;
      }
      if (nearestCueBefore === -1) return { sentence };
      const between = sentence.slice(nearestCueBefore, matchIndex);
      if (CLAUSE_BREAK_RE.test(between)) return { sentence };
      if (triggerRe.lastIndex === matchIndex) triggerRe.lastIndex++;
    }
  }
  return null;
}

function hasAffirmativeMatch(text: string, pattern: RegExp): boolean {
  return findAffirmativeMatch(text, pattern) !== null;
}

function scoreWithExclusionGuard(text: string, patterns: ScoredPattern[]): number {
  return patterns.reduce((sum, { pattern, weight }) => (hasAffirmativeMatch(text, pattern) ? sum + weight : sum), 0);
}

// Sector-evidence display must ground itself in the SAME affirmative
// occurrence the score is based on, not just the first raw keyword match in
// the document - otherwise a negated/excluded sentence (which correctly
// contributes 0 to score) could still be shown to the reviewer as if it
// were the evidence. Tries each pattern in the sector's own scoring list, in
// the same order used for scoring, and returns the first affirmative
// match's full sentence.
function findAffirmativeEvidenceSnippet(text: string, patterns: ScoredPattern[]): string | undefined {
  for (const { pattern } of patterns) {
    const match = findAffirmativeMatch(text, pattern);
    if (match) {
      return match.sentence.trim().replace(/\s+/g, " ").slice(0, 200);
    }
  }
  return undefined;
}

// Extracts sector evidence around the actual trigger without using a raw
// fixed-width context prefix, which can begin halfway through a word.
// When the full sentence is too long, the window begins at the nearest word
// boundary before the trigger and remains a literal source substring.
function findGroundedEvidenceSnippet(text: string, pattern: RegExp): string | undefined {
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
  const match = new RegExp(pattern.source, flags).exec(text);
  if (!match) return undefined;

  const before = text.slice(0, match.index);
  const boundaryRe = /[.!?]\s+|\n+/g;
  let sentenceStart = 0;
  let boundary: RegExpExecArray | null;
  while ((boundary = boundaryRe.exec(before)) !== null) {
    sentenceStart = boundary.index + boundary[0].length;
  }

  const afterMatch = text.slice(match.index + match[0].length);
  const sentenceEndMatch = /[.!?](?=\s|\n|$)|\n/.exec(afterMatch);
  const sentenceEnd = sentenceEndMatch
    ? match.index + match[0].length + sentenceEndMatch.index + (sentenceEndMatch[0] === "\n" ? 0 : 1)
    : text.length;

  let start = sentenceStart;
  if (sentenceEnd - start > 200 && match.index - start > 80) {
    const desiredStart = match.index - 80;
    const precedingWhitespace = Math.max(text.lastIndexOf(" ", desiredStart), text.lastIndexOf("\n", desiredStart));
    start = precedingWhitespace >= sentenceStart ? precedingWhitespace + 1 : sentenceStart;
  }

  let end = Math.min(sentenceEnd, start + 200);
  if (end < sentenceEnd) {
    const lastWhitespace = Math.max(text.lastIndexOf(" ", end), text.lastIndexOf("\n", end));
    if (lastWhitespace > match.index + match[0].length) end = lastWhitespace;
  }

  const snippet = text.slice(start, end).trim();
  return snippet || undefined;
}

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
  const constructionScore = scoreWithExclusionGuard(text, CONSTRUCTION_SIGNALS);
  const supplyScore = scoreWithExclusionGuard(text, SUPPLY_SIGNALS);
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

  // Construction and Supply/Manufacturing evidence must come from the same
  // exclusion-aware match used for scoring above (scoreWithExclusionGuard),
  // not a raw document-wide keyword search - otherwise a negated/excluded
  // sentence that correctly contributes 0 to score could still be displayed
  // as if it were affirmative evidence. Cyber and Professional Services keep
  // the original raw-keyword lookup unchanged: their scoring never used the
  // exclusion guard, so there's nothing for their evidence to stay
  // consistent with.
  if (sector === "Construction / Facility / Trade") {
    sectorEvidence = findAffirmativeEvidenceSnippet(text, CONSTRUCTION_SIGNALS);
  } else if (sector === "Supply / Manufacturing") {
    sectorEvidence = findAffirmativeEvidenceSnippet(text, SUPPLY_SIGNALS);
  } else {
    const evidencePatternsBySector: Record<string, RegExp> = {
      "Cybersecurity / IT / Professional Services": /252\.204-7012|NIST\s*SP\s*800-171|CMMC|CUI|CDI|DD\s*254/i,
      "Professional Services / Administrative Support": /administrative\s+support|document\s+coordination|professional\s+services/i,
    };
    const evidencePattern = evidencePatternsBySector[sector];
    if (evidencePattern) {
      sectorEvidence = findGroundedEvidenceSnippet(text, evidencePattern);
    }
  }

  return {
    contractType: bestType,
    sector,
    sectorEvidence,
    notes,
  };
}
