// Shared affirmative-context helpers for classification, sector evidence, and
// cross-sector detector routing. Signals are evaluated in local clause
// fragments so a negative occurrence cannot poison a separate affirmative
// occurrence elsewhere in the same contract.

const CYBER_SIGNAL_RE =
  /252\.204-7012|252\.204-7019|252\.204-7020|252\.204-7021|DFARS\s*252\.204|NIST\s*SP\s*800-171|CMMC|controlled\s+unclassified\s+information|\bCUI\b|\bCDI\b|\bDD\s*254\b|cyber\s+incident\s+report|classified\s+information/i;
const CONSTRUCTION_SIGNAL_RE =
  /\bHVAC\b|access[\s-]control|low[\s-]voltage|field[\s-]installation|facility\s+upgrade|construction|structural\s+(?:iron|steel)|concrete\s+pads?|embedded\s+anchors?|electrical\s+(?:panels?|feeders?)|davis[\s-]bacon|construction\s+wage\s+rate|certified\s+payroll|wage\s+determination|retainage|liquidated\s+damages|site\s+access|no\s+damages\s+for\s+delay/i;
const CONSTRUCTION_WAGE_SIGNAL_RE =
  /davis[\s-]bacon|construction\s+wage\s+rate|certified\s+payroll|wage\s+determination|52\.222-6/i;
const SCLS_SIGNAL_RE =
  /service\s+contract\s+labor\s+standards|service\s+contract\s+act|\bSCLS\b|\bSCA\b|52\.222-41/i;
const SUPPLY_SIGNAL_RE =
  /buy\s+american|domestic\s+(?:construction\s+materials?|content|source|sourcing)|U\.S\.[\s-]*(?:manufactur|produc)|country\s+of\s+origin|specialty\s+metals?|material[\s-]origin\s+certif|origin\s+certif|structural\s+(?:iron|steel)/i;
const AUDIT_SIGNAL_RE =
  /certified\s+cost\s+or\s+pricing\s+data|defective\s+pricing|truthful\s+cost\s+or\s+pricing\s+data|\bTINA\b|\bCAS\b|DCAA|DCMA|audit\s+(?:rights?|access|records?|representatives?)|(?:retain|retention)[^.]{0,100}(?:pricing|payroll|material[\s-]origin|invoice|cost|records?)|(?:Prime|Government)[^.]{0,100}(?:audit|examine)[^.]{0,100}records?/i;
const PROFESSIONAL_SIGNAL_RE =
  /professional\s+services|labor\s+categories|key\s+personnel|staff[\s-]augmentation|administrative\s+support|document\s+coordination/i;

const GENERIC_NONAPPLICABILITY_RE =
  /\b(?:does?|do|is|are|shall|will|must)\s+not\s+(?:apply|require|involve|include|incorporate|be\s+incorporated)|\b(?:is|are)\s+not\s+(?:applicable|required|incorporated)|\bnot\s+(?:applicable|required|incorporated)\b/i;
const CYBER_NEGATIVE_RE =
  /\b(?:does?|do|is|are|shall|will|must)\s+not\s+(?:apply|require|involve|include|incorporate|be\s+incorporated)|\b(?:is|are)\s+not\s+(?:applicable|required|incorporated)|\bnot\s+(?:applicable|required|incorporated)\b|\bno\s+(?:access\s+to\s+)?(?:controlled\s+unclassified\s+information|CUI|classified\s+information)|\bno\s+(?:CUI|classified)\s+(?:access|handling|information)\b|(?:controlled\s+unclassified\s+information|\bCUI\b|classified\s+information)[^.]{0,80}\b(?:is|are)\s+not\s+required/i;
const FUTURE_BILATERAL_CYBER_RE =
  /\bif\b[^.]{0,180}\b(?:later|future|subsequently)\b[^.]{0,220}\bbilateral\s+(?:modification|amendment)\b|\b(?:apply|applies|required)\s+only\s+if\b[^.]{0,220}\bbilateral\s+(?:modification|amendment)\b/i;

interface SignalSegment {
  fragment: string;
}

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

// PDF text layers commonly preserve visual line wraps as single newlines. For
// cyber applicability, a single wrap inside an unfinished sentence must not
// separate a condition from its bilateral-modification protection. Collapse
// only those soft wraps; blank lines and lines already closed by punctuation
// remain semantic boundaries. This is intentionally cyber-local so global
// extraction, quote grounding, and other detector segmentation do not change.
function cyberSentences(text: string): string[] {
  const normalized = text.replace(/\r\n?/g, "\n");
  const lines = normalized.split("\n");
  let semanticText = "";

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      if (semanticText && !semanticText.endsWith("\n\n")) semanticText += "\n\n";
      continue;
    }

    if (!semanticText) {
      semanticText = line;
      continue;
    }

    const previous = semanticText.trimEnd();
    const previousClosed = /[.!?;:]$/.test(previous);
    semanticText += previousClosed ? `\n\n${line}` : ` ${line}`;
  }

  return semanticText
    .split(/(?<=[.!?])\s+|\n{2,}/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function signalSegments(text: string): SignalSegment[] {
  const result: SignalSegment[] = [];
  for (const sentence of sentences(text)) {
    const fragments = sentence
      .split(/\s*;\s*|,\s+(?=(?:but|however|except|provided\s+that|Subcontractor\b|Prime(?:\s+Contractor)?\b|Contractor\b|the\s+parties\b))/i)
      .map((fragment) => fragment.trim())
      .filter(Boolean);
    for (const fragment of fragments) result.push({ fragment });
  }
  return result;
}

// Cyber conditions are slightly different from ordinary domain keywords: a
// conditional sentence often reads "If the Government later requires CUI...,\n// the parties will execute a bilateral modification." Splitting that sentence
// at the second subject would strip away the bilateral protection and turn the
// first half into a false affirmative. Keep the full subject transition intact,
// while still splitting explicit contrast clauses such as ", but Subcontractor
// shall comply..." so a real affirmative requirement in the same sentence is
// not hidden by an earlier negative statement.
function cyberSegments(text: string): SignalSegment[] {
  const result: SignalSegment[] = [];
  for (const sentence of cyberSentences(text)) {
    const fragments = sentence
      .split(/\s*;\s*|,\s+(?=(?:but|however|except|provided\s+that)\b)/i)
      .map((fragment) => fragment.trim())
      .filter(Boolean);
    for (const fragment of fragments) result.push({ fragment });
  }
  return result;
}

function regexTest(pattern: RegExp, text: string): boolean {
  const flags = pattern.flags.replace(/g/g, "");
  return new RegExp(pattern.source, flags).test(text);
}

function isAffirmativeApplicabilityFragment(fragment: string): boolean {
  return !GENERIC_NONAPPLICABILITY_RE.test(fragment);
}

function isAffirmativeCyberFragment(fragment: string): boolean {
  return !CYBER_NEGATIVE_RE.test(fragment) && !FUTURE_BILATERAL_CYBER_RE.test(fragment);
}

function findAffirmativeDomainFragment(text: string, pattern: RegExp): string | null {
  for (const { fragment } of signalSegments(text)) {
    if (regexTest(pattern, fragment) && isAffirmativeApplicabilityFragment(fragment)) return fragment;
  }
  return null;
}

export function findAffirmativeCyberPattern(text: string, pattern: RegExp): string | null {
  for (const { fragment } of cyberSegments(text)) {
    if (regexTest(pattern, fragment) && isAffirmativeCyberFragment(fragment)) return fragment;
  }
  return null;
}

export function hasAffirmativeCyberSignal(text: string): boolean {
  return findAffirmativeCyberPattern(text, CYBER_SIGNAL_RE) !== null;
}

export function findAffirmativeCyberEvidence(text: string): string | undefined {
  return findAffirmativeCyberPattern(text, CYBER_SIGNAL_RE)?.replace(/\s+/g, " ").slice(0, 200);
}

export function hasAffirmativeConstructionSignal(text: string): boolean {
  return findAffirmativeDomainFragment(text, CONSTRUCTION_SIGNAL_RE) !== null;
}

export function findAffirmativeConstructionEvidence(text: string): string | undefined {
  return findAffirmativeDomainFragment(text, CONSTRUCTION_SIGNAL_RE)?.replace(/\s+/g, " ").slice(0, 200);
}

export function hasAffirmativeConstructionWageSignal(text: string): boolean {
  return findAffirmativeDomainFragment(text, CONSTRUCTION_WAGE_SIGNAL_RE) !== null;
}

export function hasAffirmativeSclsSignal(text: string): boolean {
  return findAffirmativeDomainFragment(text, SCLS_SIGNAL_RE) !== null;
}

export function hasAffirmativeSupplySignal(text: string): boolean {
  return findAffirmativeDomainFragment(text, SUPPLY_SIGNAL_RE) !== null;
}

export function findAffirmativeSupplyEvidence(text: string): string | undefined {
  return findAffirmativeDomainFragment(text, SUPPLY_SIGNAL_RE)?.replace(/\s+/g, " ").slice(0, 200);
}

export function hasAffirmativeAuditSignal(text: string): boolean {
  return findAffirmativeDomainFragment(text, AUDIT_SIGNAL_RE) !== null;
}

export function findAffirmativeProfessionalEvidence(text: string): string | undefined {
  return findAffirmativeDomainFragment(text, PROFESSIONAL_SIGNAL_RE)?.replace(/\s+/g, " ").slice(0, 200);
}
