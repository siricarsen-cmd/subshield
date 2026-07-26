import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

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
  promotionStatus: "requires-opaque-pair-reverification";
  draftChecksum: string;
}

export interface ReverifiedStoredRegulatoryChangeSetDraftReceipt {
  verificationVersion: 1;
  draftChecksum: string;
  packetChecksum: string;
  pairVerificationChecksum: string;
  sourceId: string;
  candidateSnapshotId: string;
  verificationChecksum: string;
}

export interface StoreVerifiedStoredRegulatoryChangeSetDraftResult {
  draft: Readonly<VerifiedStoredRegulatoryChangeSetDraft>;
  draftPath: string;
  relativePath: string;
}

const SOURCE_ID_RE = /^[a-z0-9][a-z0-9-]*$/;
const DRAFT_FILENAME_RE = /^\d{4}-\d{2}-\d{2}-[a-f0-9]{16}\.json$/;
const SHA256_RE = /^sha256:[a-f0-9]{64}$/;
const REVERIFIED_DRAFTS = new WeakSet<object>();

function jsonClone<T>(value: T): T {
  const serialized = JSON.stringify(value);
  if (serialized === undefined) throw new Error("Stored change-set value is not JSON serializable");
  return JSON.parse(serialized) as T;
}

function fingerprintJson(value: unknown): string {
  return fingerprintRegulatoryRegistryValue(jsonClone(value));
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

function nonblankList(values: unknown): values is string[] {
  return (
    Array.isArray(values) &&
    values.length > 0 &&
    values.every((value) => typeof value === "string" && value.trim().length > 0)
  );
}

function sourceSet(value: RegulatoryCitationPackage): string {
  return [...new Set(value.citations.map((citation) => citation.sourceId))]
    .sort((left, right) => left.localeCompare(right))
    .join("|");
}

function draftPayload(
  draft:
    | Omit<VerifiedStoredRegulatoryChangeSetDraft, "draftChecksum">
    | VerifiedStoredRegulatoryChangeSetDraft
): Omit<VerifiedStoredRegulatoryChangeSetDraft, "draftChecksum"> {
  const { draftChecksum: _ignored, ...payload } = draft as VerifiedStoredRegulatoryChangeSetDraft;
  return jsonClone(payload);
}

function checksumForDraft(
  draft:
    | Omit<VerifiedStoredRegulatoryChangeSetDraft, "draftChecksum">
    | VerifiedStoredRegulatoryChangeSetDraft
): string {
  return fingerprintRegulatoryRegistryValue(draftPayload(draft));
}

function registeredCitationByIdentity(
  citationPackage: RegulatoryCitationPackage,
  citation: ExtractedRegulatoryCitation
): ExtractedRegulatoryCitation | undefined {
  return citationPackage.citations.find(
    (candidate) =>
      candidate.sourceId === citation.sourceId && candidate.locator === citation.locator
  );
}

function verifyCandidateCitation(
  citation: ExtractedRegulatoryCitation,
  candidate: RegulatorySourceSnapshot,
  errors: string[]
): void {
  const label = `${citation.sourceId}/${citation.locator}`;
  if (
    citation.sourceId !== candidate.sourceId ||
    citation.snapshotId !== candidate.snapshotId ||
    citation.checksum !== candidate.checksum
  ) {
    errors.push(`${label}: citation does not identify the verified stored candidate`);
    return;
  }
  try {
    const extracted = extractApprovedRegulatoryCitation(candidate, {
      sourceId: citation.sourceId,
      locator: citation.locator,
      startAnchor: citation.extractionStartAnchor,
      endAnchor: citation.extractionEndAnchor,
      requiredAnchors: [...citation.extractionRequiredAnchors],
      maxCharacters: citation.extractionMaxCharacters,
    });
    if (fingerprintJson(extracted) !== fingerprintJson(citation)) {
      errors.push(`${label}: citation does not reproduce from the approved stored candidate`);
    }
  } catch (error) {
    errors.push(
      `${label}: approved candidate citation extraction failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

function verifyCitationTransition(
  afterValue: RegulatoryCitationPackage,
  currentValue: RegulatoryCitationPackage,
  candidate: RegulatorySourceSnapshot,
  errors: string[]
): void {
  errors.push(...validateRegulatoryCitationPackage(afterValue));
  if (sourceSet(afterValue) !== sourceSet(currentValue)) {
    errors.push(
      `${afterValue.mappingId}: source-list changes require coordinated mapping and historical-policy review`
    );
  }

  let candidateCitationCount = 0;
  for (const citation of afterValue.citations) {
    if (
      citation.sourceId === candidate.sourceId &&
      citation.snapshotId === candidate.snapshotId
    ) {
      candidateCitationCount++;
      verifyCandidateCitation(citation, candidate, errors);
      continue;
    }
    const registered = registeredCitationByIdentity(currentValue, citation);
    if (!registered || fingerprintJson(registered) !== fingerprintJson(citation)) {
      errors.push(
        `${citation.sourceId}/${citation.locator}: unchanged citation differs from the registered template`
      );
    }
  }
  if (candidateCitationCount === 0) {
    errors.push(`${afterValue.mappingId}: proposed template lacks the approved stored candidate citation`);
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
  const seen = new Set<string>();

  for (const transition of proposal.transitions) {
    const key = `${transition.kind}:${transition.id}`;
    if (seen.has(key)) {
      errors.push(`Duplicate stored registry transition: ${transition.id}`);
      continue;
    }
    seen.add(key);
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
    if (!SHA256_RE.test(transition.afterFingerprint)) {
      errors.push(`Proposal citation-template after fingerprint is invalid: ${transition.id}`);
    }

    const afterValue = jsonClone(transition.afterValue);
    if (afterValue.mappingId !== transition.id) {
      errors.push(`Citation-template identity mismatch: ${transition.id}`);
    }
    if (
      transition.officialEvidence.sourceId !== pair.candidate.sourceId ||
      transition.officialEvidence.snapshotId !== pair.candidate.snapshotId ||
      transition.officialEvidence.citation !== pair.candidate.citation ||
      transition.officialEvidence.checksum !== pair.candidate.checksum
    ) {
      errors.push(`${transition.id}: transition evidence does not match the verified stored candidate`);
    }
    verifyCitationTransition(
      afterValue,
      current.value as RegulatoryCitationPackage,
      pair.candidate as RegulatorySourceSnapshot,
      errors
    );

    changes.push({
      kind: "citation-template",
      id: transition.id,
      beforeFingerprint: transition.beforeFingerprint,
      afterValue,
      afterFingerprint: fingerprintJson(afterValue),
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
    promotionStatus: "requires-opaque-pair-reverification",
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
  if (
    draft.draftId !==
    `stored-regulatory-change-set:${draft.sourceId}:${draft.candidateSnapshotId}:${draft.createdAt}`
  ) {
    errors.push("Stored change-set draft ID does not match its source, candidate, and timestamp");
  }
  if (!draft.baselineSnapshotId.trim() || !draft.candidateSnapshotId.trim()) {
    errors.push("Stored change-set draft snapshot identities must not be blank");
  }
  if (!draft.candidateSnapshotId.startsWith(`${draft.sourceId}:`)) {
    errors.push("Stored change-set draft candidate snapshot is not tied to its source");
  }
  if (draft.baselineSnapshotId === draft.candidateSnapshotId) {
    errors.push("Stored change-set draft baseline and candidate must be distinct");
  }
  if (
    !draft.packetId.startsWith(`regulatory-update-review:${draft.sourceId}:`) ||
    !SHA256_RE.test(draft.packetChecksum)
  ) {
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

  const seen = new Set<string>();
  for (const change of draft.changes ?? []) {
    const label = `${change.kind}/${change.id}`;
    const key = `${change.kind}:${change.id}`;
    if (seen.has(key)) errors.push(`Duplicate stored change-set draft transition: ${label}`);
    seen.add(key);
    if (change.kind !== "citation-template") {
      errors.push(`${label}: stored draft transitions must be citation-template only`);
      continue;
    }
    const current = getRegisteredCitationTemplate(change.id);
    if (!current) {
      errors.push(`${label}: registered citation template is unavailable`);
      continue;
    }
    if (change.beforeFingerprint !== current.fingerprint) {
      errors.push(`${label}: stale before fingerprint`);
    }
    const afterValue = change.afterValue as RegulatoryCitationPackage;
    if (change.afterFingerprint !== fingerprintJson(afterValue)) {
      errors.push(`${label}: after fingerprint does not reproduce from persisted JSON`);
    }
    if (afterValue.mappingId !== change.id) {
      errors.push(`${label}: after-value identity mismatch`);
    }
    if (sourceSet(current.value as RegulatoryCitationPackage) !== sourceSet(afterValue)) {
      errors.push(`${label}: source-list changes require coordinated registry review`);
    }
    errors.push(...validateRegulatoryCitationPackage(afterValue).map((error) => `${label}: ${error}`));
    if (!change.reason?.trim()) errors.push(`${label}: reason must not be blank`);
    if (!nonblankList(change.benchmarkImpact)) {
      errors.push(`${label}: benchmark impact must contain nonblank entries`);
    }
    if (!nonblankList(change.regressionPlan)) {
      errors.push(`${label}: regression plan must contain nonblank entries`);
    }
    if (!Array.isArray(change.officialEvidence) || change.officialEvidence.length !== 1) {
      errors.push(`${label}: exactly one verified stored evidence record is required`);
      continue;
    }
    const evidence = change.officialEvidence[0];
    if (
      evidence.sourceId !== draft.sourceId ||
      evidence.snapshotId !== draft.candidateSnapshotId ||
      !evidence.citation?.trim() ||
      !SHA256_RE.test(evidence.checksum) ||
      !evidence.evidenceNote?.trim()
    ) {
      errors.push(`${label}: stored evidence does not match draft provenance`);
    }
    if (
      !afterValue.citations.some(
        (citation) =>
          citation.sourceId === draft.sourceId &&
          citation.snapshotId === draft.candidateSnapshotId &&
          citation.checksum === evidence.checksum
      )
    ) {
      errors.push(`${label}: after-value lacks the verified stored candidate citation`);
    }
    for (const citation of afterValue.citations) {
      if (
        citation.sourceId === draft.sourceId &&
        citation.snapshotId === draft.candidateSnapshotId
      ) {
        continue;
      }
      const registered = registeredCitationByIdentity(
        current.value as RegulatoryCitationPackage,
        citation
      );
      if (!registered || fingerprintJson(registered) !== fingerprintJson(citation)) {
        errors.push(
          `${label}: unchanged citation ${citation.sourceId}/${citation.locator} differs from the registered template`
        );
      }
    }
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
    draft.customerFacingStatus !== "benchmark-only" ||
    draft.promotionStatus !== "requires-opaque-pair-reverification"
  ) {
    errors.push("Stored change-set draft escaped its pending non-applied reverification boundary");
  }
  if (!SHA256_RE.test(draft.draftChecksum)) {
    errors.push("Stored change-set draft checksum must be SHA-256");
  } else if (draft.draftChecksum !== checksumForDraft(draft)) {
    errors.push("Stored change-set draft checksum does not reproduce");
  }
  const serialized = JSON.stringify(draft);
  if (
    serialized.includes('"text":') ||
    serialized.includes('"rawBody":') ||
    serialized.includes('"fileContents":')
  ) {
    errors.push("Stored change-set draft contains prohibited full-source payloads");
  }
  return unique(errors);
}

function receiptPayload(
  receipt: Omit<ReverifiedStoredRegulatoryChangeSetDraftReceipt, "verificationChecksum">
): Record<string, unknown> {
  return {
    verificationVersion: receipt.verificationVersion,
    draftChecksum: receipt.draftChecksum,
    packetChecksum: receipt.packetChecksum,
    pairVerificationChecksum: receipt.pairVerificationChecksum,
    sourceId: receipt.sourceId,
    candidateSnapshotId: receipt.candidateSnapshotId,
  };
}

export function isReverifiedStoredRegulatoryChangeSetDraftReceipt(
  value: unknown
): value is ReverifiedStoredRegulatoryChangeSetDraftReceipt {
  if (!value || typeof value !== "object" || !REVERIFIED_DRAFTS.has(value as object)) {
    return false;
  }
  const receipt = value as ReverifiedStoredRegulatoryChangeSetDraftReceipt;
  return (
    receipt.verificationVersion === 1 &&
    fingerprintRegulatoryRegistryValue(receiptPayload(receipt)) ===
      receipt.verificationChecksum
  );
}

export function reverifyStoredRegulatoryChangeSetDraft(
  draft: VerifiedStoredRegulatoryChangeSetDraft,
  packet: RegulatoryUpdateReviewPacket,
  pair: VerifiedStoredRegulatoryUpdatePair
): Readonly<ReverifiedStoredRegulatoryChangeSetDraftReceipt> {
  const errors = validateVerifiedStoredRegulatoryChangeSetDraft(draft);
  if (errors.length > 0) {
    throw new Error(`Stored change-set draft failed reverification: ${errors.join("; ")}`);
  }
  if (!isVerifiedStoredRegulatoryUpdatePair(pair)) {
    throw new Error("Stored change-set draft reverification requires an opaque source pair");
  }
  const packetErrors = validateRegulatoryUpdateReviewPacket(packet);
  if (packetErrors.length > 0) {
    throw new Error(`Stored change-set draft reverification packet is invalid: ${packetErrors.join("; ")}`);
  }
  if (
    draft.packetChecksum !== packet.packetChecksum ||
    draft.pairVerificationChecksum !== pair.verificationChecksum ||
    draft.sourceId !== pair.sourceId ||
    draft.baselineSnapshotId !== pair.baselineSnapshotId ||
    draft.candidateSnapshotId !== pair.candidateSnapshotId
  ) {
    throw new Error("Stored change-set draft provenance does not match the packet and opaque pair");
  }

  const reproduced = buildVerifiedStoredRegulatoryChangeSetDraft(
    packet,
    pair,
    draft.requestedBy,
    draft.createdAt
  );
  if (fingerprintJson(reproduced) !== fingerprintJson(draft)) {
    throw new Error("Stored change-set draft does not reproduce from current verified evidence");
  }

  const withoutChecksum = {
    verificationVersion: 1 as const,
    draftChecksum: draft.draftChecksum,
    packetChecksum: packet.packetChecksum,
    pairVerificationChecksum: pair.verificationChecksum,
    sourceId: draft.sourceId,
    candidateSnapshotId: draft.candidateSnapshotId,
  };
  const receipt: ReverifiedStoredRegulatoryChangeSetDraftReceipt = {
    ...withoutChecksum,
    verificationChecksum: fingerprintRegulatoryRegistryValue(receiptPayload(withoutChecksum)),
  };
  const frozen = deepFreeze(receipt);
  REVERIFIED_DRAFTS.add(frozen as object);
  if (!isReverifiedStoredRegulatoryChangeSetDraftReceipt(frozen)) {
    throw new Error("Stored change-set draft failed opaque receipt verification");
  }
  return frozen;
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
  return { draft: deepFreeze(jsonClone(draft)), draftPath, relativePath };
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
