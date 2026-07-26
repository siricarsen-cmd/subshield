import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { getApprovedRegulatoryEvidenceSnapshot } from "./approved-evidence-registry";
import {
  extractApprovedRegulatoryCitation,
  type ExtractedRegulatoryCitation,
} from "./clause-extraction";
import {
  validateRegulatoryCitationPackage,
  type RegulatoryCitationPackage,
} from "./citation-package";
import type { RegulatoryRegistryChange } from "./registry-change-control";
import {
  fingerprintRegulatoryRegistryValue,
  getRegisteredCitationTemplate,
} from "./registry-integrity";
import {
  validateRegulatoryUpdateReviewPacket,
  type RegulatoryUpdateReviewPacket,
} from "./update-review-packet";
import {
  isVerifiedStoredRegulatoryUpdatePair,
  type VerifiedStoredRegulatoryUpdatePair,
} from "./verified-stored-update-pair";
import type { RegulatorySourceSnapshot } from "./types";

export interface VerifiedStoredRegulatoryChangeSetDraft {
  schemaVersion: 1;
  draftId: string;
  sourceId: string;
  baselineSnapshotId: string;
  candidateSnapshotId: string;
  packetId: string;
  packetChecksum: string;
  pairVerificationChecksum: string;
  createdAt: string;
  requestedBy: string;
  changes: RegulatoryRegistryChange[];
  requiredHumanReviewKinds: Array<"mapping" | "historical-policy" | "citation-template">;
  trustSource: "verified-stored-pair";
  reviewStatus: "pending";
  applicationStatus: "not-applied";
  customerFacingStatus: "benchmark-only";
  draftChecksum: string;
}

export interface StoreVerifiedStoredRegulatoryChangeSetDraftResult {
  draft: Readonly<VerifiedStoredRegulatoryChangeSetDraft>;
  draftPath: string;
  relativePath: string;
}

const SOURCE_ID_RE = /^[a-z0-9][a-z0-9-]*$/;
const DRAFT_FILENAME_RE = /^\d{4}-\d{2}-\d{2}-[a-f0-9]{16}\.json$/;
const SHA256_RE = /^sha256:[a-f0-9]{64}$/;

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function deepFreeze<T>(value: T): Readonly<T> {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const nested of Object.values(value as Record<string, unknown>)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value as Readonly<T>;
}

function isIsoInstant(value: string): boolean {
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value;
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function draftPayload(
  draft:
    | Omit<VerifiedStoredRegulatoryChangeSetDraft, "draftChecksum">
    | VerifiedStoredRegulatoryChangeSetDraft
): Omit<VerifiedStoredRegulatoryChangeSetDraft, "draftChecksum"> {
  const { draftChecksum: _ignored, ...payload } = draft as VerifiedStoredRegulatoryChangeSetDraft;
  return deepClone(payload);
}

function checksumForDraft(
  draft:
    | Omit<VerifiedStoredRegulatoryChangeSetDraft, "draftChecksum">
    | VerifiedStoredRegulatoryChangeSetDraft
): string {
  return fingerprintRegulatoryRegistryValue(draftPayload(draft));
}

function sourceSet(citationPackage: RegulatoryCitationPackage): string {
  return [...new Set(citationPackage.citations.map((citation) => citation.sourceId))]
    .sort((left, right) => left.localeCompare(right))
    .join("|");
}

function sameExtractedCitation(
  expected: ExtractedRegulatoryCitation,
  observed: ExtractedRegulatoryCitation
): boolean {
  return fingerprintRegulatoryRegistryValue(expected) === fingerprintRegulatoryRegistryValue(observed);
}

function resolveApprovedSnapshot(
  citation: ExtractedRegulatoryCitation,
  pair: VerifiedStoredRegulatoryUpdatePair
): RegulatorySourceSnapshot | undefined {
  if (
    citation.sourceId === pair.candidate.sourceId &&
    citation.snapshotId === pair.candidate.snapshotId
  ) {
    return pair.candidate as RegulatorySourceSnapshot;
  }
  return getApprovedRegulatoryEvidenceSnapshot(citation.sourceId, citation.snapshotId);
}

function validateDynamicCitationPackage(
  citationPackage: RegulatoryCitationPackage,
  pair: VerifiedStoredRegulatoryUpdatePair,
  errors: string[]
): void {
  errors.push(...validateRegulatoryCitationPackage(citationPackage));
  for (const citation of citationPackage.citations) {
    const label = `${citation.sourceId}/${citation.locator}`;
    const snapshot = resolveApprovedSnapshot(citation, pair);
    if (!snapshot) {
      errors.push(`${label}: citation does not resolve to approved static or verified stored evidence`);
      continue;
    }
    try {
      const extracted = extractApprovedRegulatoryCitation(snapshot, {
        sourceId: citation.sourceId,
        locator: citation.locator,
        startAnchor: citation.extractionStartAnchor,
        endAnchor: citation.extractionEndAnchor,
        requiredAnchors: [...citation.extractionRequiredAnchors],
        maxCharacters: citation.extractionMaxCharacters,
      });
      if (!sameExtractedCitation(extracted, citation)) {
        errors.push(
          `${label}: citation does not match deterministic extraction from approved evidence`
        );
      }
    } catch (error) {
      errors.push(
        `${label}: approved-evidence citation extraction failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}

function buildDraftChanges(
  packet: RegulatoryUpdateReviewPacket,
  pair: VerifiedStoredRegulatoryUpdatePair
): RegulatoryRegistryChange[] {
  const proposal = packet.proposal;
  if (!proposal) throw new Error("Stored change-set draft requires an update proposal");
  const errors: string[] = [];
  const changes: RegulatoryRegistryChange[] = [];

  for (const transition of proposal.transitions) {
    if (transition.kind !== "citation-template") {
      errors.push(`Unsupported stored registry transition kind: ${transition.kind}`);
      continue;
    }
    const current = getRegisteredCitationTemplate(transition.id);
    if (!current) {
      errors.push(`Registered citation template is unavailable: ${transition.id}`);
      continue;
    }
    if (transition.beforeFingerprint !== current.fingerprint) {
      errors.push(`Stale citation-template before fingerprint: ${transition.id}`);
    }
    if (
      transition.afterFingerprint !==
      fingerprintRegulatoryRegistryValue(transition.afterValue)
    ) {
      errors.push(`Citation-template after fingerprint does not reproduce: ${transition.id}`);
    }
    if (transition.afterValue.mappingId !== transition.id) {
      errors.push(`Citation-template identity mismatch: ${transition.id}`);
    }
    if (sourceSet(current.value) !== sourceSet(transition.afterValue)) {
      errors.push(
        `${transition.id}: source-list changes require coordinated mapping and historical-policy review`
      );
    }
    if (
      transition.officialEvidence.sourceId !== pair.candidate.sourceId ||
      transition.officialEvidence.snapshotId !== pair.candidate.snapshotId ||
      transition.officialEvidence.citation !== pair.candidate.citation ||
      transition.officialEvidence.checksum !== pair.candidate.checksum
    ) {
      errors.push(`${transition.id}: transition evidence does not match the verified stored candidate`);
    }
    validateDynamicCitationPackage(transition.afterValue, pair, errors);

    changes.push({
      kind: "citation-template",
      id: transition.id,
      beforeFingerprint: transition.beforeFingerprint,
      afterValue: deepClone(transition.afterValue),
      afterFingerprint: transition.afterFingerprint,
      reason: transition.reason,
      officialEvidence: [
        {
          sourceId: pair.candidate.sourceId,
          snapshotId: pair.candidate.snapshotId,
          citation: pair.candidate.citation,
          checksum: pair.candidate.checksum,
          evidenceNote:
            "Human-approved official-source snapshot verified through the opaque controlled storage pair.",
        },
      ],
      benchmarkImpact: [...transition.benchmarkImpact],
      regressionPlan: [...transition.regressionPlan],
    });
  }

  if (errors.length > 0) {
    throw new Error(`Stored regulatory change-set draft is invalid: ${unique(errors).join("; ")}`);
  }
  if (changes.length === 0) {
    throw new Error("Stored regulatory change-set draft requires at least one citation transition");
  }
  return changes;
}

export function buildVerifiedStoredRegulatoryChangeSetDraft(
  packet: RegulatoryUpdateReviewPacket,
  pair: VerifiedStoredRegulatoryUpdatePair,
  requestedBy: string,
  createdAt: string
): Readonly<VerifiedStoredRegulatoryChangeSetDraft> {
  const packetErrors = validateRegulatoryUpdateReviewPacket(packet);
  if (packetErrors.length > 0) {
    throw new Error(`Stored change-set draft packet is invalid: ${packetErrors.join("; ")}`);
  }
  if (!isVerifiedStoredRegulatoryUpdatePair(pair)) {
    throw new Error("Stored change-set draft requires an opaque verified source pair");
  }
  if (!requestedBy.trim()) throw new Error("Stored change-set draft requester must not be blank");
  if (!isIsoInstant(createdAt)) throw new Error("Stored change-set draft createdAt must be ISO");
  if (
    packet.sourceId !== pair.sourceId ||
    packet.baselineSnapshotId !== pair.baselineSnapshotId ||
    packet.candidateSnapshotId !== pair.candidateSnapshotId
  ) {
    throw new Error("Stored change-set draft packet does not match the verified source pair");
  }
  if (
    pair.candidate.reviewStatus !== "approved" ||
    pair.candidateRetainedAsApprovedEvidence !== true
  ) {
    throw new Error("Stored change-set draft candidate must be human-approved retained evidence");
  }
  const proposal = packet.proposal;
  if (
    !proposal ||
    proposal.readiness !== "ready-for-controlled-change-set-draft" ||
    proposal.trustSource !== "verified-stored-pair" ||
    proposal.applicationStatus !== "not-applied" ||
    proposal.customerFacingStatus !== "benchmark-only"
  ) {
    throw new Error("Stored change-set draft requires a ready non-applied verified-pair proposal");
  }
  const createdTime = new Date(createdAt).getTime();
  if (
    createdTime < new Date(packet.createdAt).getTime() ||
    createdTime < new Date(proposal.createdAt).getTime()
  ) {
    throw new Error("Stored change-set draft cannot predate its review packet or proposal");
  }

  const changes = buildDraftChanges(packet, pair);
  const payload: Omit<VerifiedStoredRegulatoryChangeSetDraft, "draftChecksum"> = {
    schemaVersion: 1,
    draftId: `stored-regulatory-change-set:${pair.sourceId}:${pair.candidateSnapshotId}:${createdAt}`,
    sourceId: pair.sourceId,
    baselineSnapshotId: pair.baselineSnapshotId,
    candidateSnapshotId: pair.candidateSnapshotId,
    packetId: packet.packetId,
    packetChecksum: packet.packetChecksum,
    pairVerificationChecksum: pair.verificationChecksum,
    createdAt,
    requestedBy: requestedBy.trim(),
    changes,
    requiredHumanReviewKinds: ["mapping", "historical-policy", "citation-template"],
    trustSource: "verified-stored-pair",
    reviewStatus: "pending",
    applicationStatus: "not-applied",
    customerFacingStatus: "benchmark-only",
  };
  const draft: VerifiedStoredRegulatoryChangeSetDraft = {
    ...payload,
    draftChecksum: checksumForDraft(payload),
  };
  const errors = validateVerifiedStoredRegulatoryChangeSetDraft(draft);
  if (errors.length > 0) {
    throw new Error(`Built stored regulatory change-set draft failed validation: ${errors.join("; ")}`);
  }
  return deepFreeze(draft);
}

export function validateVerifiedStoredRegulatoryChangeSetDraft(
  draft: VerifiedStoredRegulatoryChangeSetDraft
): string[] {
  const errors: string[] = [];
  if (draft.schemaVersion !== 1) errors.push("Stored change-set draft schema version is invalid");
  if (!SOURCE_ID_RE.test(draft.sourceId)) errors.push("Stored change-set draft source ID is invalid");
  if (!draft.draftId.startsWith(`stored-regulatory-change-set:${draft.sourceId}:`)) {
    errors.push("Stored change-set draft ID is not tied to its source");
  }
  if (!draft.baselineSnapshotId.trim() || !draft.candidateSnapshotId.trim()) {
    errors.push("Stored change-set draft snapshot identities must not be blank");
  }
  if (draft.baselineSnapshotId === draft.candidateSnapshotId) {
    errors.push("Stored change-set draft baseline and candidate must be distinct");
  }
  if (!draft.packetId.trim() || !SHA256_RE.test(draft.packetChecksum)) {
    errors.push("Stored change-set draft packet provenance is invalid");
  }
  if (!SHA256_RE.test(draft.pairVerificationChecksum)) {
    errors.push("Stored change-set draft pair verification checksum is invalid");
  }
  if (!isIsoInstant(draft.createdAt)) errors.push("Stored change-set draft createdAt must be ISO");
  if (!draft.requestedBy.trim()) errors.push("Stored change-set draft requester must not be blank");
  if (!Array.isArray(draft.changes) || draft.changes.length === 0) {
    errors.push("Stored change-set draft requires at least one change");
  }
  if (draft.changes.some((change) => change.kind !== "citation-template")) {
    errors.push("Stored change-set draft may contain citation-template transitions only");
  }
  if (
    draft.requiredHumanReviewKinds.join("|") !==
    "mapping|historical-policy|citation-template"
  ) {
    errors.push("Stored change-set draft must preserve all required human-review kinds");
  }
  if (
    draft.trustSource !== "verified-stored-pair" ||
    draft.reviewStatus !== "pending" ||
    draft.applicationStatus !== "not-applied" ||
    draft.customerFacingStatus !== "benchmark-only"
  ) {
    errors.push("Stored change-set draft escaped its pending non-applied boundary");
  }
  if (!SHA256_RE.test(draft.draftChecksum)) {
    errors.push("Stored change-set draft checksum must be SHA-256");
  } else if (draft.draftChecksum !== checksumForDraft(draft)) {
    errors.push("Stored change-set draft checksum does not reproduce");
  }
  const serialized = JSON.stringify(draft);
  if (serialized.includes('"text":') || serialized.includes('"rawBody":')) {
    errors.push("Stored change-set draft contains prohibited full-source payloads");
  }
  return unique(errors);
}

function resolveContainedDraftPath(
  outputRoot: string,
  relativePath: string,
  expectedSourceId?: string
): string {
  if (
    !relativePath ||
    path.isAbsolute(relativePath) ||
    relativePath.includes("\\") ||
    path.posix.normalize(relativePath) !== relativePath
  ) {
    throw new Error(`Unsafe stored change-set draft path: ${relativePath}`);
  }
  const segments = relativePath.split("/");
  if (
    segments.length !== 2 ||
    !SOURCE_ID_RE.test(segments[0]) ||
    !DRAFT_FILENAME_RE.test(segments[1])
  ) {
    throw new Error(`Invalid stored change-set draft path shape: ${relativePath}`);
  }
  if (expectedSourceId && segments[0] !== expectedSourceId) {
    throw new Error(
      `Stored change-set draft path source mismatch: expected ${expectedSourceId}, observed ${segments[0]}`
    );
  }
  const root = path.resolve(outputRoot);
  const absolute = path.resolve(root, ...segments);
  if (!absolute.startsWith(`${root}${path.sep}`)) {
    throw new Error(`Stored change-set draft path escapes the controlled root: ${relativePath}`);
  }
  return absolute;
}

function relativeDraftPath(draft: VerifiedStoredRegulatoryChangeSetDraft): string {
  const suffix = draft.draftChecksum.replace(/^sha256:/, "").slice(0, 16);
  return path.posix.join(draft.sourceId, `${draft.createdAt.slice(0, 10)}-${suffix}.json`);
}

export async function storeVerifiedStoredRegulatoryChangeSetDraft(
  outputRoot: string,
  draft: VerifiedStoredRegulatoryChangeSetDraft
): Promise<StoreVerifiedStoredRegulatoryChangeSetDraftResult> {
  const errors = validateVerifiedStoredRegulatoryChangeSetDraft(draft);
  if (errors.length > 0) {
    throw new Error(`Stored change-set draft cannot be persisted: ${errors.join("; ")}`);
  }
  const relativePath = relativeDraftPath(draft);
  const draftPath = resolveContainedDraftPath(outputRoot, relativePath, draft.sourceId);
  await mkdir(path.dirname(draftPath), { recursive: true });
  await writeFile(draftPath, `${JSON.stringify(draft, null, 2)}\n`, {
    encoding: "utf8",
    flag: "wx",
  });
  return { draft: deepFreeze(deepClone(draft)), draftPath, relativePath };
}

export async function loadVerifiedStoredRegulatoryChangeSetDraft(
  outputRoot: string,
  relativePath: string,
  expectedSourceId?: string
): Promise<Readonly<VerifiedStoredRegulatoryChangeSetDraft>> {
  const draftPath = resolveContainedDraftPath(outputRoot, relativePath, expectedSourceId);
  const draft = JSON.parse(
    await readFile(draftPath, "utf8")
  ) as VerifiedStoredRegulatoryChangeSetDraft;
  const errors = validateVerifiedStoredRegulatoryChangeSetDraft(draft);
  if (errors.length > 0) {
    throw new Error(`Stored change-set draft failed validation: ${errors.join("; ")}`);
  }
  if (relativeDraftPath(draft) !== relativePath) {
    throw new Error("Stored change-set draft path does not match its checksum-derived identity");
  }
  return deepFreeze(draft);
}
