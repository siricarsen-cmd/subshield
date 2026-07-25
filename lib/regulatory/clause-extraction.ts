import { createHash } from "node:crypto";

import { canUseSnapshotForClientCitation } from "./ingestion";
import type { RegulatoryCitation, RegulatorySourceSnapshot } from "./types";

export interface RegulatoryExcerptRequest {
  sourceId: string;
  locator: string;
  startAnchor: string;
  endAnchor: string;
  requiredAnchors: string[];
  maxCharacters?: number;
}

export interface ExtractedRegulatoryCitation extends RegulatoryCitation {
  locator: string;
  excerptChecksum: string;
  startLine: number;
  endLine: number;
}

interface AnchorMatch {
  start: number;
  end: number;
}

const DEFAULT_MAX_EXCERPT_CHARACTERS = 3_500;
const ANCHOR_SEPARATOR = `[\\s“”"'‘’]+`;

function sha256(value: string): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function whitespaceFlexiblePattern(anchor: string): RegExp {
  const tokens = anchor.trim().split(/\s+/).map(escapeRegExp);
  if (tokens.length === 0 || tokens.some((token) => token.length === 0)) {
    throw new Error("Regulatory source anchor must not be blank");
  }
  return new RegExp(tokens.join(ANCHOR_SEPARATOR), "giu");
}

function uniqueAnchorMatch(text: string, anchor: string, label: string): AnchorMatch {
  const matches = [...text.matchAll(whitespaceFlexiblePattern(anchor))];
  if (matches.length === 0) {
    throw new Error(`Regulatory ${label} anchor was not found: ${anchor}`);
  }
  if (matches.length > 1) {
    throw new Error(`Regulatory ${label} anchor is ambiguous (${matches.length} matches): ${anchor}`);
  }
  const match = matches[0];
  const start = match.index;
  if (start === undefined) throw new Error(`Regulatory ${label} anchor has no source offset`);
  return { start, end: start + match[0].length };
}

function lineNumberAt(text: string, offset: number): number {
  return text.slice(0, offset).split("\n").length;
}

function includesAnchor(text: string, anchor: string): boolean {
  return whitespaceFlexiblePattern(anchor).test(text);
}

export function extractApprovedRegulatoryCitation(
  snapshot: RegulatorySourceSnapshot,
  request: RegulatoryExcerptRequest
): ExtractedRegulatoryCitation {
  if (snapshot.sourceId !== request.sourceId) {
    throw new Error(
      `Regulatory excerpt source mismatch: expected ${request.sourceId}, observed ${snapshot.sourceId}`
    );
  }
  if (!canUseSnapshotForClientCitation(snapshot)) {
    throw new Error(`Regulatory snapshot is not approved for citation: ${snapshot.snapshotId}`);
  }
  if (!request.locator.trim()) throw new Error("Regulatory excerpt locator must not be blank");
  if (request.requiredAnchors.length === 0) {
    throw new Error("Regulatory excerpt requires at least one source-specific anchor");
  }

  const start = uniqueAnchorMatch(snapshot.text, request.startAnchor, "start");
  const end = uniqueAnchorMatch(snapshot.text, request.endAnchor, "end");
  if (end.end <= start.start) {
    throw new Error("Regulatory excerpt end anchor must occur after its start anchor");
  }

  const excerpt = snapshot.text.slice(start.start, end.end).trim();
  const maxCharacters = request.maxCharacters ?? DEFAULT_MAX_EXCERPT_CHARACTERS;
  if (!Number.isInteger(maxCharacters) || maxCharacters < 80) {
    throw new Error(`Invalid regulatory excerpt character limit: ${maxCharacters}`);
  }
  if (excerpt.length > maxCharacters) {
    throw new Error(
      `Regulatory excerpt exceeds ${maxCharacters} characters (${excerpt.length}): ${request.locator}`
    );
  }
  if (excerpt.length < 20) {
    throw new Error(`Regulatory excerpt is suspiciously short: ${request.locator}`);
  }

  for (const anchor of request.requiredAnchors) {
    if (!anchor.trim() || !includesAnchor(excerpt, anchor)) {
      throw new Error(`Required regulatory excerpt anchor is missing: ${anchor}`);
    }
  }

  return {
    sourceId: snapshot.sourceId,
    snapshotId: snapshot.snapshotId,
    citation: snapshot.citation,
    title: snapshot.canonicalTitle,
    canonicalUrl: snapshot.canonicalUrl,
    versionIdentifier: snapshot.versionIdentifier,
    effectiveDate: snapshot.effectiveDate,
    retrievedAt: snapshot.retrievedAt,
    excerpt,
    checksum: snapshot.checksum,
    locator: request.locator.trim(),
    excerptChecksum: sha256(excerpt),
    startLine: lineNumberAt(snapshot.text, start.start),
    endLine: lineNumberAt(snapshot.text, end.end),
  };
}
