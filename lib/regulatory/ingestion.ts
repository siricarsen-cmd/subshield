import { createHash } from "node:crypto";

import {
  getRegulatorySource,
  isApprovedOfficialUrl,
} from "./source-catalog";
import type {
  RegulatoryContentFormat,
  RegulatoryRedirectHop,
  RegulatorySnapshotComparison,
  RegulatorySourceCatalogEntry,
  RegulatorySourceSnapshot,
} from "./types";

export const REGULATORY_NORMALIZATION_VERSION = "regulatory-text-v1";
export const DEFAULT_REGULATORY_FETCH_TIMEOUT_MS = 20_000;
export const DEFAULT_REGULATORY_MAX_RESPONSE_BYTES = 15 * 1024 * 1024;
export const DEFAULT_REGULATORY_MAX_REDIRECTS = 4;

export const REGULATORY_INGESTION_STARTER_SOURCE_IDS = [
  "far-current",
  "dfars-current",
  "far-52-222-6",
  "far-52-222-8",
  "far-52-222-41",
  "ecfr-29-part-1",
  "ecfr-29-part-3",
  "ecfr-29-part-4",
  "ecfr-29-part-5",
  "dol-davis-bacon",
  "dol-service-contract-labor-standards",
  "dfars-252-204-7012",
  "dfars-252-204-7019",
  "dfars-252-204-7020",
  "dfars-252-204-7021",
  "dfars-252-204-7025",
  "ecfr-32-part-170",
  "nist-sp-800-171-r3",
  "nist-sp-800-171a-r3",
  "dod-cmmc-program",
  "cui-registry",
] as const;

export interface FetchRegulatorySourceOptions {
  asOfDate?: string;
  fetchImpl?: typeof fetch;
  maxResponseBytes?: number;
  maxRedirects?: number;
  now?: Date;
  timeoutMs?: number;
}

interface TimedFetchResult {
  response: Response;
  finish: () => void;
}

interface ApprovedFetchResult extends TimedFetchResult {
  requestedUrl: string;
  finalUrl: string;
  redirectChain: RegulatoryRedirectHop[];
}

const BLOCK_TAGS =
  /<\/?(?:address|article|aside|blockquote|br|dd|div|dl|dt|fieldset|figcaption|figure|footer|form|h[1-6]|header|hr|li|main|nav|ol|p|pre|section|table|tbody|td|tfoot|th|thead|tr|ul)(?:\s[^>]*)?>/gi;
const XML_BLOCK_TAGS =
  /<\/?(?:DIV\d*|FP|HD|P|PSPACE|SECTION|SUBPART|SUBJECT|EAR|EXTRACT|NOTE|AUTH|SOURCE|SECAUTH|APPENDIX|GPOTABLE|ROW|ENT)(?:\s[^>]*)?>/gi;
const SHA256_RE = /^sha256:[a-f0-9]{64}$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function sha256(value: Uint8Array | string): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function decodeCodePoint(codePoint: number, fallback: string): string {
  return Number.isInteger(codePoint) && codePoint >= 0 && codePoint <= 0x10ffff
    ? String.fromCodePoint(codePoint)
    : fallback;
}

function decodeEntities(value: string): string {
  const namedEntities: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };

  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (entity, token: string) => {
    if (token.startsWith("#x") || token.startsWith("#X")) {
      return decodeCodePoint(Number.parseInt(token.slice(2), 16), entity);
    }
    if (token.startsWith("#")) {
      return decodeCodePoint(Number.parseInt(token.slice(1), 10), entity);
    }
    return namedEntities[token.toLowerCase()] ?? entity;
  });
}

function validateAsOfDate(value: string): void {
  if (value === "current") return;
  if (!ISO_DATE_RE.test(value)) {
    throw new Error(`Invalid eCFR as-of date: ${value}`);
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new Error(`Invalid eCFR as-of date: ${value}`);
  }
}

export function normalizeRegulatoryText(value: string): string {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/\u00a0/g, " ")
    .split("\n")
    .map((line) => line.replace(/[\t ]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function normalizeRegulatoryHtml(value: string): string {
  const withoutNonContent = value
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|template|svg)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(BLOCK_TAGS, "\n")
    .replace(/<[^>]+>/g, " ");

  return normalizeRegulatoryText(decodeEntities(withoutNonContent));
}

export function normalizeRegulatoryXml(value: string): string {
  const withoutMarkup = value
    .replace(/<\?xml[\s\S]*?\?>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(XML_BLOCK_TAGS, "\n")
    .replace(/<[^>]+>/g, " ");

  return normalizeRegulatoryText(decodeEntities(withoutMarkup));
}

function stableJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableJsonValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, stableJsonValue(child)])
    );
  }
  return value;
}

export function normalizeRegulatoryJson(value: string): string {
  return JSON.stringify(stableJsonValue(JSON.parse(value)), null, 2);
}

export function resolveRegulatoryRetrievalUrl(
  source: RegulatorySourceCatalogEntry,
  asOfDate = "current"
): string {
  validateAsOfDate(asOfDate);
  const canonical = new URL(source.canonicalUrl);
  if (canonical.hostname.endsWith("ecfr.gov")) {
    const title = canonical.pathname.match(/\/title-(\d+)(?:\/|$)/)?.[1];
    const part = canonical.pathname.match(/\/part-(\d+(?:\.\d+)?)(?:\/|$)/)?.[1];
    if (title) {
      const endpoint = new URL(
        `/api/versioner/v1/full/${asOfDate}/title-${title}.xml`,
        "https://www.ecfr.gov"
      );
      if (part) endpoint.searchParams.set("part", part);
      return endpoint.toString();
    }
  }
  return source.canonicalUrl;
}

function isExpectedRequestedUrl(
  source: RegulatorySourceCatalogEntry,
  requestedUrl: string
): boolean {
  if (requestedUrl === source.canonicalUrl) return true;
  const canonical = new URL(source.canonicalUrl);
  if (!canonical.hostname.endsWith("ecfr.gov")) return false;

  try {
    const requested = new URL(requestedUrl);
    const match = requested.pathname.match(
      /^\/api\/versioner\/v1\/full\/(current|\d{4}-\d{2}-\d{2})\/title-(\d+)\.xml$/
    );
    if (!match) return false;
    const asOfDate = match[1];
    validateAsOfDate(asOfDate);
    return requested.toString() === resolveRegulatoryRetrievalUrl(source, asOfDate);
  } catch {
    return false;
  }
}

function contentFormatFor(contentType: string, finalUrl: string): RegulatoryContentFormat {
  const mime = contentType.split(";", 1)[0].trim().toLowerCase();
  if (mime === "text/html" || mime === "application/xhtml+xml") return "html";
  if (mime === "application/xml" || mime === "text/xml") return "xml";
  if (mime === "application/json" || mime.endsWith("+json")) return "json";
  if (mime === "text/plain" || mime === "text/markdown") return "text";

  const pathname = new URL(finalUrl).pathname.toLowerCase();
  if (!mime && pathname.endsWith(".xml")) return "xml";
  if (!mime && pathname.endsWith(".json")) return "json";
  if (!mime && (pathname.endsWith(".txt") || pathname.endsWith(".md"))) return "text";

  throw new Error(`Unsupported regulatory source content type: ${contentType || "missing"}`);
}

function normalizeBody(rawBody: string, format: RegulatoryContentFormat): string {
  switch (format) {
    case "html":
      return normalizeRegulatoryHtml(rawBody);
    case "xml":
      return normalizeRegulatoryXml(rawBody);
    case "json":
      return normalizeRegulatoryJson(rawBody);
    case "text":
      return normalizeRegulatoryText(rawBody);
  }
}

async function fetchOne(
  fetchImpl: typeof fetch,
  url: string,
  timeoutMs: number
): Promise<TimedFetchResult> {
  if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) {
    throw new Error(`Invalid regulatory fetch timeout: ${timeoutMs}`);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
  };

  try {
    const response = await fetchImpl(url, {
      headers: {
        Accept: "text/html, application/xhtml+xml, application/xml, text/xml, application/json, text/plain;q=0.9",
        "User-Agent": "SubShield-Regulatory-Ingestion/1.0 (official-source snapshot service)",
      },
      redirect: "manual",
      signal: controller.signal,
    });
    return { response, finish };
  } catch (error) {
    finish();
    throw error;
  }
}

async function fetchApprovedUrl(
  requestedUrl: string,
  options: Required<Pick<FetchRegulatorySourceOptions, "fetchImpl" | "maxRedirects" | "timeoutMs">>
): Promise<ApprovedFetchResult> {
  if (!isApprovedOfficialUrl(requestedUrl)) {
    throw new Error(`Regulatory retrieval URL is not an approved official HTTPS source: ${requestedUrl}`);
  }

  let currentUrl = requestedUrl;
  const redirectChain: RegulatoryRedirectHop[] = [];

  for (let redirectCount = 0; redirectCount <= options.maxRedirects; redirectCount++) {
    const timed = await fetchOne(options.fetchImpl, currentUrl, options.timeoutMs);
    const response = timed.response;
    if (response.status >= 300 && response.status < 400) {
      timed.finish();
      if (redirectCount === options.maxRedirects) {
        throw new Error(`Regulatory source exceeded ${options.maxRedirects} approved redirects`);
      }
      const location = response.headers.get("location");
      if (!location) throw new Error(`Regulatory source returned ${response.status} without a Location header`);
      const nextUrl = new URL(location, currentUrl).toString();
      if (!isApprovedOfficialUrl(nextUrl)) {
        throw new Error(`Regulatory source redirected outside approved government domains: ${nextUrl}`);
      }
      redirectChain.push({ fromUrl: currentUrl, toUrl: nextUrl, status: response.status });
      currentUrl = nextUrl;
      continue;
    }

    if (!response.ok) {
      timed.finish();
      throw new Error(`Regulatory source returned HTTP ${response.status}: ${currentUrl}`);
    }

    return {
      response,
      finish: timed.finish,
      requestedUrl,
      finalUrl: currentUrl,
      redirectChain,
    };
  }

  throw new Error("Regulatory source redirect handling terminated unexpectedly");
}

async function readBoundedBody(response: Response, maxResponseBytes: number): Promise<Uint8Array> {
  if (!Number.isInteger(maxResponseBytes) || maxResponseBytes <= 0) {
    throw new Error(`Invalid regulatory response-size limit: ${maxResponseBytes}`);
  }

  const contentLength = response.headers.get("content-length");
  const declaredLength = contentLength === null ? Number.NaN : Number(contentLength);
  if (Number.isFinite(declaredLength) && declaredLength > maxResponseBytes) {
    throw new Error(
      `Regulatory source declared ${declaredLength} bytes, above the ${maxResponseBytes}-byte limit`
    );
  }

  if (!response.body) return new Uint8Array();

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxResponseBytes) {
        await reader.cancel("Regulatory source exceeded the response-size limit");
        throw new Error(
          `Regulatory source returned more than the ${maxResponseBytes}-byte limit`
        );
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

export async function fetchApprovedRegulatorySource(
  sourceId: string,
  options: FetchRegulatorySourceOptions = {}
): Promise<RegulatorySourceSnapshot> {
  const source = getRegulatorySource(sourceId);
  if (!source) throw new Error(`Unknown regulatory source ID: ${sourceId}`);

  const requestedUrl = resolveRegulatoryRetrievalUrl(source, options.asOfDate ?? "current");
  const fetchResult = await fetchApprovedUrl(requestedUrl, {
    fetchImpl: options.fetchImpl ?? fetch,
    maxRedirects: options.maxRedirects ?? DEFAULT_REGULATORY_MAX_REDIRECTS,
    timeoutMs: options.timeoutMs ?? DEFAULT_REGULATORY_FETCH_TIMEOUT_MS,
  });

  let bytes: Uint8Array;
  try {
    bytes = await readBoundedBody(
      fetchResult.response,
      options.maxResponseBytes ?? DEFAULT_REGULATORY_MAX_RESPONSE_BYTES
    );
  } finally {
    fetchResult.finish();
  }

  const rawBody = new TextDecoder("utf-8").decode(bytes);
  const contentType = fetchResult.response.headers.get("content-type") ?? "";
  const contentFormat = contentFormatFor(contentType, fetchResult.finalUrl);
  const text = normalizeBody(rawBody, contentFormat);
  if (text.length < 40) {
    throw new Error(`Regulatory source normalized to suspiciously little text (${text.length} characters)`);
  }

  const retrievedAt = (options.now ?? new Date()).toISOString();
  const checksum = sha256(text);
  const rawChecksum = sha256(bytes);
  const snapshotId = `${source.sourceId}:${retrievedAt.replace(/[^0-9]/g, "").slice(0, 14)}:${checksum.slice(-12)}`;
  const verifiedVersion = source.currentVerifiedVersion;

  return {
    snapshotId,
    sourceId: source.sourceId,
    citation: verifiedVersion?.versionIdentifier ?? source.canonicalTitle,
    canonicalTitle: source.canonicalTitle,
    canonicalUrl: source.canonicalUrl,
    versionIdentifier: verifiedVersion?.versionIdentifier,
    publicationDate: verifiedVersion?.publicationDate,
    effectiveDate: verifiedVersion?.effectiveDate,
    retrievedAt,
    checksum,
    rawChecksum,
    normalizationVersion: REGULATORY_NORMALIZATION_VERSION,
    contentFormat,
    retrieval: {
      requestedUrl: fetchResult.requestedUrl,
      finalUrl: fetchResult.finalUrl,
      status: fetchResult.response.status,
      contentType,
      rawByteLength: bytes.byteLength,
      retrievedAt,
      redirectChain: fetchResult.redirectChain,
      etag: fetchResult.response.headers.get("etag") ?? undefined,
      lastModified: fetchResult.response.headers.get("last-modified") ?? undefined,
    },
    historicalStatus: "current",
    text,
    applicabilityMetadata: {},
    crossReferences: [],
    provenanceNotes: [
      "Fetched from the approved official-source catalog.",
      "Normalized snapshot is pending substantive review and cannot support a client-facing conclusion yet.",
    ],
    reviewStatus: "pending",
  };
}

export function compareRegulatorySnapshots(
  next: RegulatorySourceSnapshot,
  previous?: RegulatorySourceSnapshot
): RegulatorySnapshotComparison {
  const nextLines = next.text.split("\n");
  if (!previous) {
    return {
      status: "first-snapshot",
      nextSnapshotId: next.snapshotId,
      nextChecksum: next.checksum,
      nextLineCount: nextLines.length,
    };
  }

  const previousLines = previous.text.split("\n");
  if (previous.checksum === next.checksum) {
    return {
      status: "unchanged",
      previousSnapshotId: previous.snapshotId,
      previousChecksum: previous.checksum,
      nextSnapshotId: next.snapshotId,
      nextChecksum: next.checksum,
      previousLineCount: previousLines.length,
      nextLineCount: nextLines.length,
    };
  }

  const sharedLength = Math.min(previousLines.length, nextLines.length);
  let firstDifferentLine = sharedLength + 1;
  for (let index = 0; index < sharedLength; index++) {
    if (previousLines[index] !== nextLines[index]) {
      firstDifferentLine = index + 1;
      break;
    }
  }

  return {
    status: "content-changed",
    previousSnapshotId: previous.snapshotId,
    previousChecksum: previous.checksum,
    nextSnapshotId: next.snapshotId,
    nextChecksum: next.checksum,
    previousLineCount: previousLines.length,
    nextLineCount: nextLines.length,
    firstDifferentLine,
  };
}

export function hasValidSnapshotChecksum(snapshot: RegulatorySourceSnapshot): boolean {
  return snapshot.checksum === sha256(snapshot.text);
}

function hasValidRedirectProvenance(snapshot: RegulatorySourceSnapshot): boolean {
  const chain = snapshot.retrieval.redirectChain;
  if (chain.length === 0) return snapshot.retrieval.finalUrl === snapshot.retrieval.requestedUrl;
  if (chain[0].fromUrl !== snapshot.retrieval.requestedUrl) return false;
  if (chain.at(-1)?.toUrl !== snapshot.retrieval.finalUrl) return false;

  return chain.every((hop, index) => {
    const nextHop = chain[index + 1];
    return (
      isApprovedOfficialUrl(hop.fromUrl) &&
      isApprovedOfficialUrl(hop.toUrl) &&
      hop.status >= 300 &&
      hop.status < 400 &&
      (!nextHop || nextHop.fromUrl === hop.toUrl)
    );
  });
}

export function getRegulatorySnapshotValidationErrors(
  snapshot: RegulatorySourceSnapshot
): string[] {
  const errors: string[] = [];
  const source = getRegulatorySource(snapshot.sourceId);
  if (!source) errors.push(`unknown source ID: ${snapshot.sourceId}`);
  if (source && snapshot.canonicalUrl !== source.canonicalUrl) {
    errors.push("canonical URL does not match the approved source catalog");
  }
  if (source && !isExpectedRequestedUrl(source, snapshot.retrieval.requestedUrl)) {
    errors.push("requested URL does not match the approved catalog retrieval route");
  }
  if (!isApprovedOfficialUrl(snapshot.canonicalUrl)) errors.push("canonical URL is not approved");
  if (!isApprovedOfficialUrl(snapshot.retrieval.requestedUrl)) errors.push("requested URL is not approved");
  if (!isApprovedOfficialUrl(snapshot.retrieval.finalUrl)) errors.push("final URL is not approved");
  if (!hasValidRedirectProvenance(snapshot)) errors.push("redirect provenance is invalid");
  if (snapshot.retrieval.status < 200 || snapshot.retrieval.status >= 300) {
    errors.push(`retrieval status is not successful: ${snapshot.retrieval.status}`);
  }
  if (snapshot.retrievedAt !== snapshot.retrieval.retrievedAt) {
    errors.push("snapshot and retrieval timestamps do not match");
  }
  if (!SHA256_RE.test(snapshot.checksum) || !hasValidSnapshotChecksum(snapshot)) {
    errors.push("normalized-text checksum is invalid");
  }
  if (!SHA256_RE.test(snapshot.rawChecksum)) errors.push("raw checksum is invalid");
  if (!snapshot.normalizationVersion.trim()) errors.push("normalization version is missing");
  if (snapshot.text.length < 40) errors.push("normalized source text is suspiciously short");
  if (!Number.isInteger(snapshot.retrieval.rawByteLength) || snapshot.retrieval.rawByteLength < 0) {
    errors.push("raw byte length is invalid");
  }
  if (snapshot.reviewStatus === "approved" && (!snapshot.reviewedBy || !snapshot.reviewedAt)) {
    errors.push("approved snapshot lacks reviewer provenance");
  }
  return errors;
}

export function canUseSnapshotForClientCitation(snapshot: RegulatorySourceSnapshot): boolean {
  const source = getRegulatorySource(snapshot.sourceId);
  return Boolean(
    source?.supportsClientCitation &&
      snapshot.reviewStatus === "approved" &&
      getRegulatorySnapshotValidationErrors(snapshot).length === 0
  );
}
