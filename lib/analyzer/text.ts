// Text normalization and quote-grounding helpers.
// Every finding's foundText must survive verifyQuoteInDocument() or it gets suppressed.

import type { ExtractionConfidence } from "./types";

export function normalizeWhitespace(input: string): string {
  return input
    .replace(/\r\n/g, "\n")
    .replace(/ /g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Collapses whitespace and normalizes smart quotes/dashes so PDF-extraction artifacts
// (line-wrap spaces, curly quotes) don't cause a real quote to fail verification.
export function normalizeForMatch(input: string): string {
  return normalizeWhitespace(input)
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

const MIN_QUOTE_LENGTH = 8;

export function quoteExistsInDocument(quote: string, documentText: string): boolean {
  if (!quote || !quote.trim()) return false;
  const normQuote = normalizeForMatch(quote);
  if (normQuote.length < MIN_QUOTE_LENGTH) return false;
  const normDoc = normalizeForMatch(documentText);
  return normDoc.includes(normQuote);
}

// Returns every distinct "Article N" / "Section N.N" style reference in a string.
const ARTICLE_REF_PATTERN = /\b(article|section|clause|paragraph)\s+\d+(?:\.\d+)*\b/gi;

export function extractArticleReferences(text: string): string[] {
  const matches = text.match(ARTICLE_REF_PATTERN) || [];
  return Array.from(new Set(matches.map((m) => m.toLowerCase())));
}

// Strips any "Article N" style reference from generatedText that doesn't literally
// appear in documentText, replacing it with a neutral phrase so we never fabricate
// a citation the current document doesn't contain.
export function scrubUngroundedArticleReferences(generatedText: string, documentText: string): string {
  const normDoc = normalizeForMatch(documentText);
  return generatedText.replace(ARTICLE_REF_PATTERN, (match) => {
    const norm = normalizeForMatch(match);
    return normDoc.includes(norm) ? match : "this clause";
  });
}

// Optional signals about the *source* the text was extracted from, used only to
// catch a "confident-looking" extraction that is actually a small fraction of a
// much larger document (e.g. only a cover page came through). Kept as two
// separate, format-specific signals rather than one shared ratio: PDF page
// count and DOCX/TXT file size behave too differently to share a threshold.
export interface ExtractionConfidenceHints {
  // PDF only: total pages the extractor/OCR actually saw for this attempt.
  pageCount?: number;
  // DOCX/TXT only: raw uploaded file size in bytes.
  sourceByteLength?: number;
}

// Reference incident: a 9-page DOCX subcontract extracted to only 1374
// characters (~153 chars/page) and was silently accepted as a complete, clean
// scan. Only applied once pageCount >= 3 so a normal 1-2 page document is
// never penalized by a per-page average that doesn't make sense for it.
// Threshold set well above the ~153 chars/page observed in that incident (150
// words is roughly a short paragraph - nowhere near a real contract page) so
// that exact pattern, and anything worse, is always caught with margin.
const MIN_PAGE_COUNT_FOR_AVG_CHECK = 3;
const MIN_AVG_CHARS_PER_PAGE = 250;

// DOCX/TXT have no page count at all (mammoth never reports one), so the same
// incident has to be caught a different way: comparing extracted text length
// against the raw uploaded file size. DOCX carries a large fixed OOXML
// overhead (styles.xml, fontTable.xml, theme, docProps, etc.) that dominates
// small files' byte size, so this is only applied once the file is clearly
// big enough that fixed overhead can't explain a thin result - a genuinely
// short 1-2 page contract saved as .docx rarely exceeds ~25KB. Assuming the
// reference incident's 9-page DOCX was at least that large (a safe assumption
// for any real multi-page Word document with normal formatting), a 5%
// text-to-file-size ratio catches 1374 characters at any file size at or
// above ~27.5KB, comfortably covering realistic file sizes for a 9-page
// document while leaving short legitimate contracts alone.
const MIN_BYTES_FOR_RATIO_CHECK = 25_000;
const SUSPICIOUS_BYTE_TO_TEXT_RATIO = 0.05;

export function assessExtractionConfidence(
  documentText: string,
  hints: ExtractionConfidenceHints = {}
): ExtractionConfidence {
  const trimmed = documentText.trim();

  if (trimmed.length < 400) {
    return {
      confident: false,
      reason: "Extracted document text is too short to reliably represent a full subcontract (possible failed extraction or a partial upload).",
    };
  }

  const letters = (trimmed.match(/[a-zA-Z]/g) || []).length;
  const letterRatio = letters / trimmed.length;
  if (letterRatio < 0.4) {
    return {
      confident: false,
      reason: "Extracted text appears garbled or non-textual, consistent with a failed scan/OCR pass rather than a clean text layer.",
    };
  }

  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
  if (wordCount < 120) {
    return {
      confident: false,
      reason: "Extracted document text contains too few words to represent a complete subcontract document.",
    };
  }

  // Catches a "clean-looking" extraction (passes every check above) that is
  // still only a small slice of a much larger source document - e.g. a PDF
  // text layer that only yielded a cover page, or a DOCX where most of the
  // content lives somewhere mammoth's raw-text extraction doesn't reach.
  // Without this, that kind of partial extraction is silently treated as a
  // complete, clean scan instead of Limited Scan.
  if (typeof hints.pageCount === "number" && hints.pageCount >= MIN_PAGE_COUNT_FOR_AVG_CHECK) {
    const avgCharsPerPage = trimmed.length / hints.pageCount;
    if (avgCharsPerPage < MIN_AVG_CHARS_PER_PAGE) {
      return {
        confident: false,
        reason: `Extracted text averages only about ${Math.round(avgCharsPerPage)} characters per page across ${hints.pageCount} detected pages, far too little for a real contract page - consistent with an extraction that only captured a small portion of the document (e.g. a cover page or a single section).`,
      };
    }
  }

  if (typeof hints.sourceByteLength === "number" && hints.sourceByteLength >= MIN_BYTES_FOR_RATIO_CHECK) {
    const ratio = trimmed.length / hints.sourceByteLength;
    if (ratio < SUSPICIOUS_BYTE_TO_TEXT_RATIO) {
      return {
        confident: false,
        reason: `Extracted text (${trimmed.length.toLocaleString()} characters) is disproportionately small relative to the size of the uploaded file, consistent with an extraction that missed most of the document's actual content.`,
      };
    }
  }

  return { confident: true };
}
