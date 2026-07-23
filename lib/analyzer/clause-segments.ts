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

function collapseSourceSlice(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

function hasClauseBoundaryPrefix(source: string, markerStart: number): boolean {
  if (markerStart === 0) return true;

  const prefix = source.slice(Math.max(0, markerStart - 160), markerStart);
  if (NON_CLAUSE_PREFIX_RE.test(prefix)) return false;
  if (/(?:^|[\r\n\f])[ \t]*$/.test(prefix)) return true;
  if (/[.!?]["')\]]?[ \t]+$/.test(prefix)) return true;
  if (/[.!?]["')\]]?[ \t]+[A-Z][A-Z0-9 /&_-]{4,}[ \t]+$/.test(prefix)) return true;

  // Some extracted headings and the first controlled cyber heading place the
  // clause marker on the same line: "REQUIRED CYBER FRAMEWORKS 2.1 ...".
  return /(?:^|[\r\n\f])[ \t]*[A-Z][A-Z0-9 /&_-]{4,}[ \t]+$/.test(prefix);
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
    if (!hasClauseBoundaryPrefix(source, markerStart)) continue;

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
  return end;
}

export function extractClauseSegments(source: string): ClauseSegment[] {
  const markers = findClauseMarkers(source);
  if (markers.length === 0) return unnumberedSegments(source, 0, source.length);

  const segments: ClauseSegment[] = [];
  if (markers[0].start > 0) {
    segments.push(...unnumberedSegments(source, 0, markers[0].start));
  }

  for (const [index, marker] of markers.entries()) {
    const boundaryEnd = markers[index + 1]?.start ?? source.length;
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
