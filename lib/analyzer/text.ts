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

export function assessExtractionConfidence(documentText: string): ExtractionConfidence {
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

  return { confident: true };
}
