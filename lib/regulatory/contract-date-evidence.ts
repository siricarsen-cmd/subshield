import {
  normalizeWhitespace,
  quoteExistsInDocument,
} from "../analyzer/text";
import type {
  RegulatoryAnalysisDateBasis,
  RegulatoryAnalysisDateContext,
} from "./historical-selection";

export interface ContractDateEvidenceCandidate {
  basis: Exclude<RegulatoryAnalysisDateBasis, "user-specified">;
  normalizedDate: string;
  dateText: string;
  foundText: string;
  anchorText: string;
  sourceIndex: number;
  confidence: "high";
}

export interface ContractDateEvidenceExtraction {
  candidates: ContractDateEvidenceCandidate[];
  rejectedDateTexts: string[];
}

export type ContractDateResolutionStatus =
  | "resolved"
  | "not-found"
  | "ambiguous"
  | "invalid-document";

export interface ContractDateResolution {
  status: ContractDateResolutionStatus;
  basis: Exclude<RegulatoryAnalysisDateBasis, "user-specified">;
  candidates: ContractDateEvidenceCandidate[];
  context?: RegulatoryAnalysisDateContext;
  explanation: string;
  missingFacts: string[];
}

interface DateMatch {
  dateText: string;
  normalizedDate?: string;
  start: number;
  end: number;
}

interface DateRule {
  basis: ContractDateEvidenceCandidate["basis"];
  anchor: RegExp;
}

const ISO_DATE_RE = /\b\d{4}-\d{2}-\d{2}\b/g;
const SLASH_DATE_RE = /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g;
const MONTH_DATE_RE =
  /\b(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\.?\s+\d{1,2},\s+\d{4}\b/gi;
const MONTHS: Readonly<Record<string, number>> = {
  january: 1,
  jan: 1,
  february: 2,
  feb: 2,
  march: 3,
  mar: 3,
  april: 4,
  apr: 4,
  may: 5,
  june: 6,
  jun: 6,
  july: 7,
  jul: 7,
  august: 8,
  aug: 8,
  september: 9,
  sep: 9,
  sept: 9,
  october: 10,
  oct: 10,
  november: 11,
  nov: 11,
  december: 12,
  dec: 12,
};

const MAX_DATE_DISTANCE_AFTER_ANCHOR = 96;

const DATE_RULES: readonly DateRule[] = [
  {
    basis: "modification-effective",
    anchor:
      /\b(?:modification|amendment|change\s+order)\b.{0,48}\b(?:effective(?:\s+date)?|date\s+effective|dated)\b/i,
  },
  {
    basis: "solicitation-issued",
    anchor:
      /(?:\bsolicitation\b.{0,48}\b(?:issued|issue\s+date|date\s+issued|released|release\s+date)\b|^solicitation\s+date\s*:)/i,
  },
  {
    basis: "proposal-due",
    anchor:
      /\b(?:proposal|offer|bid)\b.{0,48}\b(?:due(?:\s+date)?|closing(?:\s+date)?|submission\s+deadline|date\s+due)\b/i,
  },
  {
    basis: "subcontract-executed",
    anchor:
      /^(?:(?:document|subcontract|agreement|contract)\s+)?(?:effective\s+date|execution\s+date|date\s+of\s+execution)\s*:/i,
  },
  {
    basis: "subcontract-executed",
    anchor:
      /\b(?:this\s+)?(?:subcontract|agreement|contract)\b.{0,40}\b(?:made\s+and\s+entered\s+into|entered\s+into|executed|effective)(?:\s+as\s+of)?\b/i,
  },
  {
    basis: "performance-started",
    anchor:
      /\bperiod\s+of\s+performance\b\s*(?::|(?:begins?|starts?|commences?|from)\b)/i,
  },
  {
    basis: "performance-started",
    anchor:
      /\b(?:performance\s+start\s+date|start\s+of\s+performance|commencement\s+date|notice\s+to\s+proceed\s+date)\b/i,
  },
];

function parseDateOnly(value: string): string | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  return formatDate(Number(match[1]), Number(match[2]), Number(match[3]));
}

function formatDate(year: number, month: number, day: number): string | undefined {
  const timestamp = Date.UTC(year, month - 1, day);
  const date = new Date(timestamp);
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  ) {
    return undefined;
  }
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function normalizeDateText(value: string): string | undefined {
  const iso = parseDateOnly(value);
  if (iso) return iso;

  const slash = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);
  if (slash) {
    return formatDate(Number(slash[3]), Number(slash[1]), Number(slash[2]));
  }

  const named =
    /^(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\.?\s+(\d{1,2}),\s+(\d{4})$/i.exec(
      value
    );
  if (!named) return undefined;
  const month = MONTHS[named[1].replace(/\.$/, "").toLowerCase()];
  return formatDate(Number(named[3]), month, Number(named[2]));
}

function dateMatches(text: string): DateMatch[] {
  const matches: DateMatch[] = [];
  for (const pattern of [ISO_DATE_RE, SLASH_DATE_RE, MONTH_DATE_RE]) {
    pattern.lastIndex = 0;
    for (const match of text.matchAll(pattern)) {
      const start = match.index;
      if (start === undefined) continue;
      matches.push({
        dateText: match[0],
        normalizedDate: normalizeDateText(match[0]),
        start,
        end: start + match[0].length,
      });
    }
  }
  return matches.sort((left, right) => left.start - right.start || left.end - right.end);
}

function evidenceWindows(documentText: string): string[] {
  const lines = documentText
    .split(/\r?\n|\f/)
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean);
  const windows: string[] = [];
  for (let index = 0; index < lines.length; index++) {
    windows.push(lines[index]);
    if (index + 1 < lines.length) {
      windows.push(normalizeWhitespace(`${lines[index]} ${lines[index + 1]}`));
    }
  }
  if (lines.length <= 1) windows.push(normalizeWhitespace(documentText));
  return [...new Set(windows.filter(Boolean))];
}

function candidateKey(candidate: ContractDateEvidenceCandidate): string {
  return [
    candidate.basis,
    candidate.normalizedDate,
    candidate.sourceIndex,
    normalizeWhitespace(candidate.anchorText),
  ].join("|");
}

export function extractContractDateEvidence(
  documentText: string
): ContractDateEvidenceExtraction {
  const normalizedDocument = normalizeWhitespace(documentText);
  if (!normalizedDocument) return { candidates: [], rejectedDateTexts: [] };

  const candidates: ContractDateEvidenceCandidate[] = [];
  const rejectedDateTexts = new Set<string>();
  const seen = new Set<string>();

  for (const window of evidenceWindows(documentText)) {
    const dates = dateMatches(window);
    for (const date of dates) {
      if (!date.normalizedDate) rejectedDateTexts.add(date.dateText);
    }

    for (const rule of DATE_RULES) {
      const flags = rule.anchor.flags.includes("g")
        ? rule.anchor.flags
        : `${rule.anchor.flags}g`;
      const anchorPattern = new RegExp(rule.anchor.source, flags);
      for (const anchorMatch of window.matchAll(anchorPattern)) {
        if (anchorMatch.index === undefined) continue;
        const anchorEnd = anchorMatch.index + anchorMatch[0].length;
        const date = dates.find(
          (candidate) =>
            candidate.normalizedDate &&
            candidate.start >= anchorEnd &&
            candidate.start - anchorEnd <= MAX_DATE_DISTANCE_AFTER_ANCHOR
        );
        if (!date?.normalizedDate) continue;
        if (!quoteExistsInDocument(window, normalizedDocument)) continue;

        const candidate: ContractDateEvidenceCandidate = {
          basis: rule.basis,
          normalizedDate: date.normalizedDate,
          dateText: date.dateText,
          foundText: window,
          anchorText: anchorMatch[0],
          sourceIndex: normalizedDocument.indexOf(window),
          confidence: "high",
        };
        const key = candidateKey(candidate);
        if (seen.has(key)) continue;
        seen.add(key);
        candidates.push(candidate);
      }
    }
  }

  candidates.sort(
    (left, right) =>
      left.sourceIndex - right.sourceIndex ||
      left.basis.localeCompare(right.basis) ||
      left.normalizedDate.localeCompare(right.normalizedDate) ||
      left.foundText.length - right.foundText.length
  );

  return { candidates, rejectedDateTexts: [...rejectedDateTexts].sort() };
}

export function resolveContractDateEvidence(
  documentText: string,
  basis: Exclude<RegulatoryAnalysisDateBasis, "user-specified">
): ContractDateResolution {
  const normalizedDocument = normalizeWhitespace(documentText);
  if (!normalizedDocument) {
    return {
      status: "invalid-document",
      basis,
      candidates: [],
      explanation: "The contract text is empty, so no governing analysis date can be grounded.",
      missingFacts: ["Readable contract text containing the relevant date label"],
    };
  }

  const candidates = extractContractDateEvidence(documentText).candidates.filter(
    (candidate) => candidate.basis === basis
  );
  if (candidates.length === 0) {
    return {
      status: "not-found",
      basis,
      candidates,
      explanation: `No exact ${basis} date was found in the contract text.`,
      missingFacts: [`An explicit ${basis} date in the uploaded package`],
    };
  }

  const dates = [...new Set(candidates.map((candidate) => candidate.normalizedDate))];
  if (dates.length > 1) {
    return {
      status: "ambiguous",
      basis,
      candidates,
      explanation: `More than one ${basis} date is stated in the uploaded package.`,
      missingFacts: [
        `Identify which ${basis} date controls: ${dates.join(", ")}`,
        "The document or modification to which each date applies",
      ],
    };
  }

  const selected = [...candidates].sort(
    (left, right) =>
      left.foundText.length - right.foundText.length ||
      left.sourceIndex - right.sourceIndex
  )[0];
  if (!quoteExistsInDocument(selected.foundText, normalizedDocument)) {
    return {
      status: "invalid-document",
      basis,
      candidates,
      explanation: "The selected date evidence is not present in the normalized contract text.",
      missingFacts: ["Exact document-grounded date evidence"],
    };
  }

  return {
    status: "resolved",
    basis,
    candidates,
    context: {
      asOfDate: selected.normalizedDate,
      basis,
      authority: "contract-evidence",
      evidenceQuotes: [selected.foundText],
      evidenceDocumentText: documentText,
    },
    explanation: `One exact ${basis} date is grounded in the uploaded package.`,
    missingFacts: [],
  };
}
