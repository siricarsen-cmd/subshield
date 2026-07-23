// Extraction-tolerant clause segmentation shared by deterministic detection
// and report-label canonicalization. Numbered clauses can follow blank lines,
// one newline, wrapped lines, form feeds, or sentence-ending punctuation in a
// flattened paste. Returned text is always a contiguous source slice with only
// whitespace collapsed, matching text.ts quote-verification normalization.

export interface ClauseSegment {
  number?: string;
  text: string;
  start: number;
  end: number;
}

interface ClauseMarker {
  number: string;
  start: number;
}

const NUMBERED_CLAUSE_MARKER_RE =
  /(?:\u00a7{1,2}\s*)?(\d{1,2})\.(\d{1,2})(?:\.(\d{1,2}))?[ \t\r\n]+(?=[A-Z"'(])/g;
const NON_CLAUSE_PREFIX_RE = /\b(?:FAR|DFARS|NIST|version|revision|rev|release|build|page)\s*$/i;
const NON_CLAUSE_LEAD_RE =
  /^(?:percent|percentage|million|billion|dollars?|USD|EUR|GBP|GHz|MHz|release|version|build|January|February|March|April|May|June|July|August|September|October|November|December)\b/i;
// High-confidence top-level heading immediately before a subsection marker.
// The leading group permits either a source line boundary or a flattened
// sentence-ending position. The heading is accepted only when its integer
// matches the following subsection's major number (checked below), so an
// arbitrary "N." token can never become a boundary on its own.
const TOP_LEVEL_HEADING_SUFFIX_RE =
  /(^|[\r\n\f]|[.!?]["')\]]?[ \t]+)([ \t]*)(\d{1,2})\.[ \t]+([A-Z][A-Z0-9 '&/(),_-]{4,})[ \t\r\n]*$/;
// Production PDF adornment shape: delimiter-heavy "N of M" pagination plus
// an explicit "Page N" suffix. This intentionally does not match a generic
// contractual sentence that merely contains the word "page."
const PLAIN_TEXT_PAGE_FOOTER_SUFFIX_RE =
  /(^|[\r\n\f]|[.!?]["')\]]?[ \t]+)([ \t]*)(--+\s*\d+\s+of\s+\d+\s*--+[^\r\n]{0,180}\|\s*Page\s+\d+)[ \t\r\n]*$/i;
const OUTER_ADORNMENT_HEADING_RE =
  /^(?:(\d{1,2})\.\s+)?([A-Z][A-Z0-9 '&/(),_-]{4,})$/;
const NUMBERED_SUBSECTION_START_RE =
  /^(?:\u00a7{1,2}\s*)?(\d{1,2})\.(\d{1,2})(?:\.(\d{1,2}))?\s+(?=[A-Z"'(])/;
const OPERATIVE_UPPERCASE_PROSE_RE =
  /\b(?:SHALL|MUST|MAY|WILL|AGREES?|REQUIRES?|PROVIDES?|PROVIDED|IS|ARE)\b/;
const OUTER_ADORNMENT_PAGE_FOOTER_RE =
  /^--+\s*\d+\s+of\s+\d+\s*--+[^\r\n]{0,180}\|\s*Page\s+\d+$/i;

function collapseSourceSlice(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

function isRecognizedLeadingHeading(prefix: string, followingClauseMajor: number): boolean {
  const match = OUTER_ADORNMENT_HEADING_RE.exec(prefix);
  if (!match) return false;

  const topLevelMajor = match[1] ? Number(match[1]) : null;
  if (topLevelMajor !== null && topLevelMajor !== followingClauseMajor) return false;

  const headingTitle = match[2];
  const uppercaseLetters = (headingTitle.match(/[A-Z]/g) || []).length;
  const words = headingTitle.trim().split(/\s+/);
  return (
    uppercaseLetters >= 3 &&
    words.length >= 2 &&
    words.length <= 14 &&
    !OPERATIVE_UPPERCASE_PROSE_RE.test(headingTitle)
  );
}

// Returns true only when cleanQuote is an already-existing contiguous portion
// of adornedQuote and every removed outer character is one of two narrowly
// recognized extraction artifacts: a materially-uppercase section title
// immediately before the clean quote's numbered subsection marker, and/or the
// delimiter-heavy production PDF footer shape. It never creates or rewrites
// evidence; callers may only select the independently verified cleanQuote.
export function hasStrictOuterAdornmentRelationship(cleanQuote: string, adornedQuote: string): boolean {
  const clean = collapseSourceSlice(cleanQuote);
  const adorned = collapseSourceSlice(adornedQuote);
  if (!clean || clean.length >= adorned.length) return false;

  const cleanClauseMatch = NUMBERED_SUBSECTION_START_RE.exec(clean);
  if (!cleanClauseMatch) return false;

  const cleanIndex = adorned.toLowerCase().indexOf(clean.toLowerCase());
  if (cleanIndex < 0) return false;

  const prefix = adorned.slice(0, cleanIndex).trim();
  const suffix = adorned.slice(cleanIndex + clean.length).trim();
  if (!prefix && !suffix) return false;

  const prefixIsAdornment =
    !prefix || isRecognizedLeadingHeading(prefix, Number(cleanClauseMatch[1]));
  const suffixIsAdornment =
    !suffix || OUTER_ADORNMENT_PAGE_FOOTER_RE.test(suffix);

  return prefixIsAdornment && suffixIsAdornment;
}

function findTopLevelHeadingBoundaryBeforePosition(
  source: string,
  markerStart: number,
  followingClauseMajor: number
): number | null {
  const prefixStart = Math.max(0, markerStart - 500);
  const prefix = source.slice(prefixStart, markerStart);
  const match = TOP_LEVEL_HEADING_SUFFIX_RE.exec(prefix);
  if (!match || Number(match[3]) !== followingClauseMajor) return null;

  const headingTitle = match[4];
  const uppercaseLetters = (headingTitle.match(/[A-Z]/g) || []).length;
  if (uppercaseLetters < 3) return null;

  return prefixStart + match.index + match[1].length + match[2].length;
}

function findPlainTextPageFooterBoundaryBeforePosition(source: string, markerStart: number): number | null {
  const prefixStart = Math.max(0, markerStart - 500);
  const prefix = source.slice(prefixStart, markerStart);
  const match = PLAIN_TEXT_PAGE_FOOTER_SUFFIX_RE.exec(prefix);
  if (!match) return null;

  const footerStart = match.index + match[1].length + match[2].length;
  if (footerStart <= 0 || !/[.!?]["')\]]?[ \t\r\n]*$/.test(prefix.slice(0, footerStart))) {
    return null;
  }

  return prefixStart + footerStart;
}

function hasClauseBoundaryPrefix(source: string, markerStart: number, followingClauseMajor: number): boolean {
  if (markerStart === 0) return true;

  const prefix = source.slice(Math.max(0, markerStart - 160), markerStart);
  if (NON_CLAUSE_PREFIX_RE.test(prefix)) return false;
  if (/(?:^|[\r\n\f])[ \t]*$/.test(prefix)) return true;
  if (/[.!?]["')\]]?[ \t]+$/.test(prefix)) return true;
  if (/[.!?]["')\]]?[ \t]+[A-Z][A-Z0-9 /&_-]{4,}[ \t]+$/.test(prefix)) return true;

  // Some extracted headings and the first controlled cyber heading place the
  // clause marker on the same line: "REQUIRED CYBER FRAMEWORKS 2.1 ...".
  if (/(?:^|[\r\n\f])[ \t]*[A-Z][A-Z0-9 /&_-]{4,}[ \t]+$/.test(prefix)) return true;

  // Flattened extraction can place either a numbered top-level heading or a
  // recognized page footer directly before the next subsection marker.
  return (
    findTopLevelHeadingBoundaryBeforePosition(source, markerStart, followingClauseMajor) !== null ||
    findPlainTextPageFooterBoundaryBeforePosition(source, markerStart) !== null
  );
}

function findClauseMarkers(source: string): ClauseMarker[] {
  const markers: ClauseMarker[] = [];
  const re = new RegExp(NUMBERED_CLAUSE_MARKER_RE.source, NUMBERED_CLAUSE_MARKER_RE.flags);
  let match: RegExpExecArray | null;

  while ((match = re.exec(source)) !== null) {
    const major = Number(match[1]);
    const minor = Number(match[2]);
    const markerStart = match.index;
    const followingText = source.slice(re.lastIndex, re.lastIndex + 40);

    // FAR/DFARS citations have larger components and normally continue with a
    // hyphen. Dates commonly continue with another dot or begin with a year.
    if (major > 99 || minor > 99) continue;
    if (/^[.-]\d/.test(source.slice(re.lastIndex))) continue;
    if (NON_CLAUSE_LEAD_RE.test(followingText)) continue;
    if (!hasClauseBoundaryPrefix(source, markerStart, major)) continue;

    markers.push({
      number: [match[1], match[2], match[3]].filter(Boolean).join("."),
      start: markerStart,
    });
  }

  return markers;
}

function unnumberedSegments(source: string, start: number, end: number): ClauseSegment[] {
  const range = source.slice(start, end);
  const segments: ClauseSegment[] = [];
  const separator = /(?:\r?\n[ \t]*\r?\n|\f)+/g;
  let chunkStart = 0;
  let separatorMatch: RegExpExecArray | null;

  while ((separatorMatch = separator.exec(range)) !== null) {
    const raw = range.slice(chunkStart, separatorMatch.index);
    const text = collapseSourceSlice(raw);
    if (text) {
      const leading = raw.search(/\S/);
      segments.push({ text, start: start + chunkStart + Math.max(0, leading), end: start + separatorMatch.index });
    }
    chunkStart = separatorMatch.index + separatorMatch[0].length;
  }

  const raw = range.slice(chunkStart);
  const text = collapseSourceSlice(raw);
  if (text) {
    const leading = raw.search(/\S/);
    segments.push({ text, start: start + chunkStart + Math.max(0, leading), end });
  }

  return segments;
}

function trimTrailingPageAdornment(source: string, start: number, end: number): number {
  const raw = source.slice(start, end);
  const formFeedIndex = raw.indexOf("\f");
  if (formFeedIndex > 0 && /[.!?][ \t\r\n]*$/.test(raw.slice(0, formFeedIndex))) {
    return start + formFeedIndex;
  }

  const footerStart = findPlainTextPageFooterBoundaryBeforePosition(source, end);
  if (footerStart !== null && footerStart > start) return footerStart;

  return end;
}

export function extractClauseSegments(source: string): ClauseSegment[] {
  const markers = findClauseMarkers(source);
  if (markers.length === 0) return unnumberedSegments(source, 0, source.length);

  const headingBoundaries = markers.map((marker) =>
    findTopLevelHeadingBoundaryBeforePosition(source, marker.start, Number(marker.number.split(".")[0]))
  );
  const segments: ClauseSegment[] = [];
  const firstPrefixEnd = headingBoundaries[0] ?? markers[0].start;
  if (firstPrefixEnd > 0) {
    segments.push(...unnumberedSegments(source, 0, firstPrefixEnd));
  }

  for (const [index, marker] of markers.entries()) {
    const boundaryEnd = headingBoundaries[index + 1] ?? markers[index + 1]?.start ?? source.length;
    const end = trimTrailingPageAdornment(source, marker.start, boundaryEnd);
    const text = collapseSourceSlice(source.slice(marker.start, end));
    if (text) segments.push({ number: marker.number, text, start: marker.start, end });
  }

  return segments;
}

export function areAdjacentNumberedClauses(first: ClauseSegment, second: ClauseSegment): boolean {
  if (!first.number || !second.number) return false;
  const firstParts = first.number.split(".").map(Number);
  const secondParts = second.number.split(".").map(Number);
  if (firstParts.length !== 2 || secondParts.length !== 2) return false;
  return firstParts[0] === secondParts[0] && secondParts[1] === firstParts[1] + 1;
}

const FUTURE_CYBER_SUBJECT_RE =
  /cybersecurity|cyber\s+requirements?|security\s+(?:requirements?|frameworks?|controls?|procedures?)|\bCMMC\b|cloud[\s-]security|CUI\s+(?:requirements?|controls?|procedures?)/i;
const FUTURE_CHANGE_RE = /\b(?:add|added|additional|revised|new|modified|later|future)\b/i;
const UNILATERAL_CHANNEL_RE =
  /Prime(?:\s+Contractor)?\s+may\s+(?:add|issue|impose|incorporate|revise)|by\s+(?:email|portal(?:\s+posting)?|notice)|binding\s+(?:upon|on|after)\s+(?:written\s+)?notice/i;
const BINDING_OR_NO_ADJUSTMENT_RE =
  /binding\s+(?:upon|on|after)\s+(?:written\s+)?notice|becomes?\s+(?:effective|binding)|shall\s+bind|without\s+(?:a\s+)?(?:price|schedule)(?:\s+or\s+(?:price|schedule))?\s+adjustment|no\s+(?:price|schedule)\s+adjustment/i;
const BILATERAL_PROTECTION_RE =
  /mutually\s+signed\s+(?:amendment|modification)|bilateral\s+(?:amendment|modification)|agreed\s+by\s+both\s+parties|(?:receive|provide|allow|entitle|right\s+to)[^.]{0,60}equitable\s+adjustment/i;

function clauseHasUnilateralFutureCyberEvidence(clauseText: string): boolean {
  return (
    FUTURE_CYBER_SUBJECT_RE.test(clauseText) &&
    FUTURE_CHANGE_RE.test(clauseText) &&
    UNILATERAL_CHANNEL_RE.test(clauseText) &&
    BINDING_OR_NO_ADJUSTMENT_RE.test(clauseText) &&
    !BILATERAL_PROTECTION_RE.test(clauseText)
  );
}

export function hasUnilateralFutureCyberEvidence(text: string): boolean {
  return extractClauseSegments(text).some((segment) => clauseHasUnilateralFutureCyberEvidence(segment.text));
}
