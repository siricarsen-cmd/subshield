import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { fingerprintRegulatoryRegistryValue } from "./registry-integrity";
import type {
  RegulatoryUpdateChangeProposal,
  RegulatoryUpdateIntakeResult,
  RegulatoryRegistryUpdateImpact,
  RegulatorySourceDifference,
} from "./update-intake";

export interface RegulatoryUpdateReviewPacket {
  schemaVersion: 1;
  packetId: string;
  sourceId: string;
  baselineSnapshotId: string;
  candidateSnapshotId: string;
  createdAt: string;
  requestedBy: string;
  intakeStatus: RegulatoryUpdateIntakeResult["status"];
  difference: RegulatorySourceDifference;
  impacts: RegulatoryRegistryUpdateImpact[];
  proposal?: RegulatoryUpdateChangeProposal;
  refusalReasons: string[];
  reviewNotes: string[];
  reviewStatus: "pending";
  applicationStatus: "not-applied";
  customerFacingStatus: "benchmark-only";
  packetChecksum: string;
}

export interface StoreRegulatoryUpdateReviewPacketResult {
  packet: Readonly<RegulatoryUpdateReviewPacket>;
  packetPath: string;
  relativePath: string;
}

const SOURCE_ID_RE = /^[a-z0-9][a-z0-9-]*$/;
const PACKET_FILENAME_RE = /^\d{4}-\d{2}-\d{2}-[a-f0-9]{16}\.json$/;
const SHA256_RE = /^sha256:[a-f0-9]{64}$/;

function deepFreeze<T>(value: T): Readonly<T> {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const nested of Object.values(value as Record<string, unknown>)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value as Readonly<T>;
}

function jsonClone<T>(value: T): T {
  const serialized = JSON.stringify(value);
  if (serialized === undefined) {
    throw new Error("Regulatory update review packet value is not JSON serializable");
  }
  return JSON.parse(serialized) as T;
}

function isIsoInstant(value: string): boolean {
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value;
}

function uniqueNonblank(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function packetPayload(
  packet: Omit<RegulatoryUpdateReviewPacket, "packetChecksum"> | RegulatoryUpdateReviewPacket
): Omit<RegulatoryUpdateReviewPacket, "packetChecksum"> {
  const { packetChecksum: _ignored, ...payload } = packet as RegulatoryUpdateReviewPacket;
  return jsonClone(payload);
}

function checksumForPacket(
  packet: Omit<RegulatoryUpdateReviewPacket, "packetChecksum"> | RegulatoryUpdateReviewPacket
): string {
  return fingerprintRegulatoryRegistryValue(packetPayload(packet));
}

function assertSafeSourceId(sourceId: string): void {
  if (!SOURCE_ID_RE.test(sourceId)) {
    throw new Error(`Unsafe regulatory update packet source ID: ${sourceId}`);
  }
}

function resolveContainedPacketPath(
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
    throw new Error(`Unsafe regulatory update packet path: ${relativePath}`);
  }
  const segments = relativePath.split("/");
  if (
    segments.length !== 2 ||
    !SOURCE_ID_RE.test(segments[0]) ||
    !PACKET_FILENAME_RE.test(segments[1])
  ) {
    throw new Error(`Invalid regulatory update packet path shape: ${relativePath}`);
  }
  if (expectedSourceId && segments[0] !== expectedSourceId) {
    throw new Error(
      `Regulatory update packet path source mismatch: expected ${expectedSourceId}, observed ${segments[0]}`
    );
  }
  const root = path.resolve(outputRoot);
  const absolutePath = path.resolve(root, ...segments);
  if (!absolutePath.startsWith(`${root}${path.sep}`)) {
    throw new Error(`Regulatory update packet path escapes the controlled root: ${relativePath}`);
  }
  return absolutePath;
}

function relativePacketPath(packet: RegulatoryUpdateReviewPacket): string {
  const date = packet.createdAt.slice(0, 10);
  const suffix = packet.packetChecksum.replace(/^sha256:/, "").slice(0, 16);
  return path.posix.join(packet.sourceId, `${date}-${suffix}.json`);
}

function collectForbiddenPayloadKeys(value: unknown, pathPrefix = "packet"): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      collectForbiddenPayloadKeys(item, `${pathPrefix}[${index}]`)
    );
  }
  if (!value || typeof value !== "object") return [];
  const errors: string[] = [];
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const childPath = `${pathPrefix}.${key}`;
    if (key === "text" || key === "rawBody" || key === "fileContents") {
      errors.push(`Update review packet contains prohibited full-source payload key: ${childPath}`);
    }
    errors.push(...collectForbiddenPayloadKeys(child, childPath));
  }
  return errors;
}

export function validateRegulatoryUpdateReviewPacket(
  packet: RegulatoryUpdateReviewPacket
): string[] {
  const errors: string[] = [];
  if (packet.schemaVersion !== 1) errors.push("Update review packet schema version is invalid");
  if (!packet.packetId.trim()) errors.push("Update review packet ID must not be blank");
  if (!SOURCE_ID_RE.test(packet.sourceId)) errors.push("Update review packet source ID is invalid");
  const expectedPacketPrefix = `regulatory-update-review:${packet.sourceId}:`;
  if (!packet.packetId.startsWith(expectedPacketPrefix)) {
    errors.push("Update review packet ID is not tied to its source");
  }
  if (!packet.baselineSnapshotId.trim() || !packet.candidateSnapshotId.trim()) {
    errors.push("Update review packet snapshot identities must not be blank");
  }
  if (packet.baselineSnapshotId === packet.candidateSnapshotId) {
    errors.push("Update review packet baseline and candidate must be distinct");
  }
  if (!packet.candidateSnapshotId.startsWith(`${packet.sourceId}:`)) {
    errors.push("Update review packet candidate snapshot ID is not tied to its source");
  }
  if (!isIsoInstant(packet.createdAt)) errors.push("Update review packet createdAt must be ISO");
  if (!packet.requestedBy.trim()) errors.push("Update review packet requester must not be blank");
  if (
    !["proposal-prepared", "manual-review-required", "observation-only"].includes(
      packet.intakeStatus
    )
  ) {
    errors.push(`Update intake status is not review-packet eligible: ${packet.intakeStatus}`);
  }
  if (
    packet.difference.classification === "unchanged" ||
    packet.difference.classification === "transport-only"
  ) {
    errors.push(
      `Update difference is not review-packet eligible: ${packet.difference.classification}`
    );
  }
  if (packet.intakeStatus === "proposal-prepared" && !packet.proposal) {
    errors.push("Proposal-prepared update review packet lacks a proposal");
  }
  if (packet.proposal) {
    if (packet.proposal.sourceId !== packet.sourceId) {
      errors.push("Update review packet proposal source does not match packet source");
    }
    if (
      packet.proposal.baselineSnapshotId !== packet.baselineSnapshotId ||
      packet.proposal.candidateSnapshotId !== packet.candidateSnapshotId
    ) {
      errors.push("Update review packet proposal snapshot identities do not match packet identities");
    }
    if (
      packet.proposal.applicationStatus !== "not-applied" ||
      packet.proposal.customerFacingStatus !== "benchmark-only"
    ) {
      errors.push("Update review packet proposal escaped the non-applied benchmark boundary");
    }
    if (!isIsoInstant(packet.proposal.createdAt)) {
      errors.push("Update review packet proposal createdAt must be ISO");
    } else if (
      isIsoInstant(packet.createdAt) &&
      new Date(packet.createdAt).getTime() < new Date(packet.proposal.createdAt).getTime()
    ) {
      errors.push("Update review packet cannot predate its intake proposal");
    }
  }
  if (packet.reviewStatus !== "pending") {
    errors.push("New update review packets must remain pending");
  }
  if (packet.applicationStatus !== "not-applied") {
    errors.push("Update review packet must remain not-applied");
  }
  if (packet.customerFacingStatus !== "benchmark-only") {
    errors.push("Update review packet must remain benchmark-only");
  }
  if (!SHA256_RE.test(packet.packetChecksum)) {
    errors.push("Update review packet checksum must be SHA-256");
  } else if (packet.packetChecksum !== checksumForPacket(packet)) {
    errors.push("Update review packet checksum does not reproduce from packet content");
  }
  errors.push(...collectForbiddenPayloadKeys(packet));
  return uniqueNonblank(errors);
}

export function buildRegulatoryUpdateReviewPacket(
  intake: RegulatoryUpdateIntakeResult,
  requestedBy: string,
  createdAt: string
): Readonly<RegulatoryUpdateReviewPacket> {
  if (!requestedBy.trim()) throw new Error("Update review packet requester must not be blank");
  if (!isIsoInstant(createdAt)) throw new Error("Update review packet createdAt must be ISO");
  if (
    !["proposal-prepared", "manual-review-required", "observation-only"].includes(
      intake.status
    ) ||
    intake.difference.classification === "unchanged" ||
    intake.difference.classification === "transport-only"
  ) {
    throw new Error(
      `Regulatory update intake is not eligible for a review packet: ${intake.status}/${intake.difference.classification}`
    );
  }

  const baselineSnapshotId = intake.proposal?.baselineSnapshotId;
  const candidateSnapshotId = intake.proposal?.candidateSnapshotId;
  if (!baselineSnapshotId || !candidateSnapshotId) {
    throw new Error("Review-packet-eligible intake lacks baseline/candidate snapshot identities");
  }

  const payload = jsonClone<Omit<RegulatoryUpdateReviewPacket, "packetChecksum">>({
    schemaVersion: 1,
    packetId: `regulatory-update-review:${intake.sourceId}:${candidateSnapshotId}`,
    sourceId: intake.sourceId,
    baselineSnapshotId,
    candidateSnapshotId,
    createdAt,
    requestedBy: requestedBy.trim(),
    intakeStatus: intake.status,
    difference: intake.difference,
    impacts: intake.impacts,
    proposal: intake.proposal,
    refusalReasons: intake.refusalReasons,
    reviewNotes: intake.reviewNotes,
    reviewStatus: "pending",
    applicationStatus: "not-applied",
    customerFacingStatus: "benchmark-only",
  });
  const packet = jsonClone<RegulatoryUpdateReviewPacket>({
    ...payload,
    packetChecksum: checksumForPacket(payload),
  });
  const errors = validateRegulatoryUpdateReviewPacket(packet);
  if (errors.length > 0) {
    throw new Error(`Invalid regulatory update review packet: ${errors.join("; ")}`);
  }
  return deepFreeze(packet);
}

export async function storeRegulatoryUpdateReviewPacket(
  outputRoot: string,
  packet: RegulatoryUpdateReviewPacket
): Promise<StoreRegulatoryUpdateReviewPacketResult> {
  const errors = validateRegulatoryUpdateReviewPacket(packet);
  if (errors.length > 0) {
    throw new Error(`Regulatory update review packet cannot be stored: ${errors.join("; ")}`);
  }
  assertSafeSourceId(packet.sourceId);
  const relativePath = relativePacketPath(packet);
  const packetPath = resolveContainedPacketPath(outputRoot, relativePath, packet.sourceId);
  await mkdir(path.dirname(packetPath), { recursive: true });
  await writeFile(packetPath, `${JSON.stringify(packet, null, 2)}\n`, {
    encoding: "utf8",
    flag: "wx",
  });
  return {
    packet: deepFreeze(jsonClone(packet)),
    packetPath,
    relativePath,
  };
}

export async function loadRegulatoryUpdateReviewPacket(
  outputRoot: string,
  relativePath: string,
  expectedSourceId?: string
): Promise<Readonly<RegulatoryUpdateReviewPacket>> {
  const packetPath = resolveContainedPacketPath(outputRoot, relativePath, expectedSourceId);
  const packet = JSON.parse(await readFile(packetPath, "utf8")) as RegulatoryUpdateReviewPacket;
  const errors = validateRegulatoryUpdateReviewPacket(packet);
  if (errors.length > 0) {
    throw new Error(`Stored regulatory update review packet is invalid: ${errors.join("; ")}`);
  }
  const canonicalRelativePath = relativePacketPath(packet);
  if (relativePath !== canonicalRelativePath) {
    throw new Error(
      `Stored regulatory update packet path does not match its checksum-derived canonical path: expected ${canonicalRelativePath}, observed ${relativePath}`
    );
  }
  if (expectedSourceId && packet.sourceId !== expectedSourceId) {
    throw new Error(
      `Stored regulatory update review packet source mismatch: expected ${expectedSourceId}, observed ${packet.sourceId}`
    );
  }
  return deepFreeze(packet);
}
