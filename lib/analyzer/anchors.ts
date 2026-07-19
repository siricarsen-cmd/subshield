// Deterministic, regex-based extraction of document anchors.
// These are grounded by construction: every value here is a literal substring
// (or a light join of literal substrings) pulled directly out of the uploaded
// document text, so nothing here can be a fabricated fact.

import type { DocumentAnchors } from "./types";

function firstMatch(text: string, pattern: RegExp): string | undefined {
  const m = text.match(pattern);
  if (!m) return undefined;
  const value = (m[1] ?? m[0]).trim().replace(/\s+/g, " ");
  return value.length > 0 ? value.slice(0, 160) : undefined;
}

function firstValidMatch(
  text: string,
  pattern: RegExp,
  isValidCandidate: (candidate: string) => boolean
): string | undefined {
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
  const re = new RegExp(pattern.source, flags);
  let m: RegExpExecArray | null;

  while ((m = re.exec(text)) !== null) {
    const value = (m[1] ?? m[0]).trim().replace(/\s+/g, " ");
    if (value.length > 0 && isValidCandidate(value)) return value.slice(0, 160);
    if (m.index === re.lastIndex) re.lastIndex++;
  }

  return undefined;
}

function allMatches(text: string, pattern: RegExp, limit: number): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  const re = new RegExp(pattern, pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g");
  while ((m = re.exec(text)) !== null && out.length < limit) {
    const value = m[0].trim().replace(/\s+/g, " ");
    const key = value.toLowerCase();
    if (value && !seen.has(key)) {
      seen.add(key);
      out.push(value.slice(0, 160));
    }
    if (m.index === re.lastIndex) re.lastIndex++;
  }
  return out;
}

const SUBCONTRACT_NUMBER = /subcontract\s*(?:agreement\s*)?(?:no\.?|number|#)\s*[:\-]?\s*([A-Za-z0-9][A-Za-z0-9\-\/\.]{3,30})/i;
const REJECTED_SUBCONTRACT_NUMBER_LABELS = new Set([
  "invoice",
  "invoice date",
  "date",
  "amount",
  "total",
  "page",
  "description",
  "subcontractor",
  "contractor",
  "vendor",
  "customer",
  "project",
  "contract",
]);

function isValidSubcontractNumberCandidate(candidate: string): boolean {
  const normalized = candidate.toLowerCase().replace(/[.\-/]+/g, " ").replace(/\s+/g, " ").trim();
  return !REJECTED_SUBCONTRACT_NUMBER_LABELS.has(normalized);
}

const PRIME_CONTRACT_NUMBER = /prime\s*contract\s*(?:no\.?|number|#)\s*[:\-]?\s*([A-Za-z0-9][A-Za-z0-9\-\/\.]{3,30})/i;
const GOVT_CONTRACT_NUMBER = /\b(?:government|govt\.?|GS-|contract)\s*(?:no\.?|number|#)\s*[:\-]?\s*([A-Za-z0-9][A-Za-z0-9\-\/\.]{5,30})/i;
const DELIVERY_ORDER = /(?:delivery|task)\s*order\s*(?:no\.?|number|#)\s*[:\-]?\s*([A-Za-z0-9][A-Za-z0-9\-\/\.]{2,30})/i;
// Capture only the literal money substring. Ceiling/aggregate-value labels
// are valid price evidence, while a funding label is not a funding amount
// unless a dollar value appears in the same clause.
const PRICE =
  /(?:total\s+(?:price|estimated\s+value|contract\s+value)|estimated\s+value|ceiling\s+amount|maximum\s+aggregate\s+value|not[\s-]to[\s-]exceed(?:\s+amount)?|total\s+not[\s-]to[\s-]exceed)[^.\n$]{0,120}(\$[\d,]+(?:\.\d{2})?)/i;
const FUNDING_LIMIT =
  /(?:incrementally\s+funded|funding\s+limit(?:ation)?|limitation\s+of\s+funds)[^.\n$]{0,80}(\$[\d,]+(?:\.\d{2})?)/i;
const RETAINAGE = /retain(?:age|ed)[^.\n]{0,120}(?:\d{1,2}\s?%|\bpercent\b)[^.\n]{0,80}/i;
const PARTIES = /this\s+subcontract(?:\s+agreement)?\s+is\s+(?:made\s+)?(?:entered\s+into\s+)?between\s+([^.\n]{5,220})/i;

// The document's own explicit label (e.g. "Subcontract Type: Time-and-Materials")
// is the strongest, most deterministic evidence of contract type - stronger than
// keyword-matching the whole document, which can false-positive on a passing
// mention (e.g. "purchase order number" in an unrelated clause). Checked first;
// the keyword patterns below are only a fallback when no explicit label exists.
const EXPLICIT_TYPE_LABEL =
  /(?:subcontract\s+type|type\s+of\s+(?:subcontract|agreement)|contract\s+type)\s*[:\-]\s*([^\n]{2,60})/i;

// [\s-]* (not \s*) so hyphenated forms like "Time-and-Materials" still match.
const CONTRACT_TYPE_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: "Firm-Fixed-Price (FFP)", pattern: /firm[\s-]*fixed[\s-]*price|\bFFP\b/i },
  { label: "Time & Materials (T&M)", pattern: /time[\s-]*(?:and|&)[\s-]*materials|\bT&M\b/i },
  { label: "Labor-Hour", pattern: /labor[\s-]hour\s+contract|labor[\s-]hour\s+subcontract/i },
  { label: "Cost-Plus-Fixed-Fee (CPFF)", pattern: /cost[\s-]*plus[\s-]*fixed[\s-]*fee|\bCPFF\b/i },
  { label: "Cost-Reimbursement", pattern: /cost[\s-]reimbursement|cost[\s-]reimbursable/i },
  { label: "IDIQ", pattern: /indefinite[\s-]delivery,?\s*indefinite[\s-]quantity|\bIDIQ\b/i },
  // Requires the document to declare itself a Purchase Order (title/self-reference),
  // not just a passing mention (e.g. "no purchase order number has been issued").
  { label: "Purchase Order", pattern: /\bthis\s+purchase\s+order\b|\bpurchase\s+order\s+agreement\b|^\s*purchase\s+order\b/im },
  { label: "Teaming Agreement", pattern: /teaming\s+agreement/i },
];

const DEADLINE_PATTERN = /\b(?:within|no\s+later\s+than|not\s+to\s+exceed)\s+\d{1,3}\s*(?:calendar|business|working)?\s*days?\b[^.\n]{0,90}/gi;
const CLAUSE_PATTERN = /\b(?:FAR|DFARS)\s?\d{2}\.\d{3}(?:-\d{1,3})?\b/gi;
const EXHIBIT_PATTERN = /\b(?:Exhibit|Attachment|Appendix)\s+[A-Z0-9]{1,3}\b[^.\n]{0,60}/gi;

export function extractAnchorCandidates(documentText: string, fileName?: string): DocumentAnchors {
  const text = documentText;

  // Prefer the document's own explicit label verbatim; only fall back to
  // whole-document keyword matching (which can false-positive on a passing
  // mention) when the document doesn't state its own type directly.
  const explicitTypeLabel = firstMatch(text, EXPLICIT_TYPE_LABEL);
  const contractTypeMatch = CONTRACT_TYPE_PATTERNS.find((p) => p.pattern.test(text));

  const anchors: DocumentAnchors = {
    fileName,
    parties: firstMatch(text, PARTIES),
    subcontractNumber: firstValidMatch(text, SUBCONTRACT_NUMBER, isValidSubcontractNumberCandidate),
    subcontractType: explicitTypeLabel || contractTypeMatch?.label,
    primeContractNumber: firstMatch(text, PRIME_CONTRACT_NUMBER) || firstMatch(text, GOVT_CONTRACT_NUMBER),
    deliveryOrderNumber: firstMatch(text, DELIVERY_ORDER),
    priceOrEstimatedValue: firstMatch(text, PRICE),
    fundingLimit: firstMatch(text, FUNDING_LIMIT),
    retainage: firstMatch(text, RETAINAGE),
    keyDeadlines: allMatches(text, DEADLINE_PATTERN, 8),
    keyClauses: allMatches(text, CLAUSE_PATTERN, 12),
    incorporatedExhibits: allMatches(text, EXHIBIT_PATTERN, 8),
  };

  return anchors;
}
