import type { RegulatorySourceSnapshot } from "./types";
import { APPROVED_SOURCE_EXCERPT_FIXTURES } from "./__fixtures__/approved-source-excerpt-fixtures.mjs";
import { APPROVED_SUPPLEMENTAL_SOURCE_EXCERPT_FIXTURES } from "./__fixtures__/approved-supplemental-source-excerpt-fixtures.mjs";

const INITIALIZATION_ERRORS: string[] = [];

function deepClone<T>(value: T): T {
  if (Array.isArray(value)) return value.map((item) => deepClone(item)) as T;
  if (value && typeof value === "object") {
    const clone: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      clone[key] = deepClone(item);
    }
    return clone as T;
  }
  return value;
}

function deepFreeze<T>(value: T): Readonly<T> {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const nested of Object.values(value as Record<string, unknown>)) {
      deepFreeze(nested);
    }
    Object.freeze(value);
  }
  return value as Readonly<T>;
}

const SOURCE_FIXTURES: Record<string, RegulatorySourceSnapshot> = {
  ...(APPROVED_SOURCE_EXCERPT_FIXTURES as Record<string, RegulatorySourceSnapshot>),
  ...(APPROVED_SUPPLEMENTAL_SOURCE_EXCERPT_FIXTURES as Record<
    string,
    RegulatorySourceSnapshot
  >),
};

const BY_SOURCE_AND_SNAPSHOT = new Map<string, Readonly<RegulatorySourceSnapshot>>();
const BY_SNAPSHOT_ID = new Map<string, Readonly<RegulatorySourceSnapshot>>();

for (const [fixtureSourceId, sourceSnapshot] of Object.entries(SOURCE_FIXTURES)) {
  if (fixtureSourceId !== sourceSnapshot.sourceId) {
    INITIALIZATION_ERRORS.push(
      `Approved evidence fixture source mismatch: key ${fixtureSourceId}, snapshot ${sourceSnapshot.sourceId}`
    );
  }
  if (sourceSnapshot.reviewStatus !== "approved") {
    INITIALIZATION_ERRORS.push(
      `Approved evidence fixture is not approved: ${sourceSnapshot.snapshotId}`
    );
  }
  const key = `${sourceSnapshot.sourceId}:${sourceSnapshot.snapshotId}`;
  if (BY_SOURCE_AND_SNAPSHOT.has(key)) {
    INITIALIZATION_ERRORS.push(`Duplicate approved evidence source/snapshot: ${key}`);
    continue;
  }
  if (BY_SNAPSHOT_ID.has(sourceSnapshot.snapshotId)) {
    INITIALIZATION_ERRORS.push(
      `Duplicate approved evidence snapshot ID: ${sourceSnapshot.snapshotId}`
    );
    continue;
  }
  const captured = deepFreeze(deepClone(sourceSnapshot));
  BY_SOURCE_AND_SNAPSHOT.set(key, captured);
  BY_SNAPSHOT_ID.set(sourceSnapshot.snapshotId, captured);
}

export function getApprovedRegulatoryEvidenceSnapshot(
  sourceId: string,
  snapshotId: string
): Readonly<RegulatorySourceSnapshot> | undefined {
  return BY_SOURCE_AND_SNAPSHOT.get(`${sourceId}:${snapshotId}`);
}

export function listApprovedRegulatoryEvidenceSnapshots(): readonly Readonly<RegulatorySourceSnapshot>[] {
  return [...BY_SNAPSHOT_ID.values()];
}

export function validateApprovedRegulatoryEvidenceRegistry(): string[] {
  const errors = [...INITIALIZATION_ERRORS];
  for (const snapshot of BY_SNAPSHOT_ID.values()) {
    if (snapshot.sourceId.trim().length === 0) {
      errors.push(`Approved evidence snapshot has blank source ID: ${snapshot.snapshotId}`);
    }
    if (snapshot.snapshotId.trim().length === 0) {
      errors.push("Approved evidence snapshot has blank snapshot ID");
    }
    if (!snapshot.citation.trim()) {
      errors.push(`Approved evidence snapshot has blank citation: ${snapshot.snapshotId}`);
    }
    if (!snapshot.text.trim()) {
      errors.push(`Approved evidence snapshot has blank text: ${snapshot.snapshotId}`);
    }
    if (!Object.isFrozen(snapshot)) {
      errors.push(`Approved evidence snapshot is not frozen: ${snapshot.snapshotId}`);
    }
  }
  return [...new Set(errors)];
}
