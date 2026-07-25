import { createHash } from "node:crypto";

import type { RegulatoryApplicabilityMapping } from "./applicability";
import { REGULATORY_BENCHMARK_APPLICABILITY_MAPPINGS } from "./benchmark-applicability-mappings";
import type { RegulatoryCitationPackage } from "./citation-package";
import {
  REGULATORY_HISTORICAL_GROUNDING_POLICIES,
  type RegulatoryHistoricalGroundingPolicy,
} from "./historical-grounding-policy";
import { REGULATORY_FULL_BENCHMARK_CITATION_PACKAGES } from "./source-coverage-citation-packages";

export type RegulatoryRegistryKind = "mapping" | "historical-policy" | "citation-template";

export interface RegulatoryRegistryEntry<T> {
  kind: RegulatoryRegistryKind;
  id: string;
  fingerprint: string;
  value: Readonly<T>;
}

const INITIALIZATION_ERRORS: string[] = [];

function stableSerialize(value: unknown): string {
  if (value === undefined) return '{"$type":"undefined"}';
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    if (Number.isNaN(value)) return '{"$type":"nan"}';
    if (value === Infinity) return '{"$type":"positive-infinity"}';
    if (value === -Infinity) return '{"$type":"negative-infinity"}';
    if (Object.is(value, -0)) return "-0";
    return String(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(",")}]`;
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).sort((left, right) => left.localeCompare(right));
    return `{${keys
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key])}`)
      .join(",")}}`;
  }
  throw new Error(`Unsupported regulatory registry value type: ${typeof value}`);
}

function deepClone<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => deepClone(item)) as T;
  }
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

export function fingerprintRegulatoryRegistryValue(value: unknown): string {
  return `sha256:${createHash("sha256").update(stableSerialize(value)).digest("hex")}`;
}

function buildRegistry<T>(
  kind: RegulatoryRegistryKind,
  values: readonly T[],
  identify: (value: T) => string
): ReadonlyMap<string, RegulatoryRegistryEntry<T>> {
  const entries = new Map<string, RegulatoryRegistryEntry<T>>();
  for (const sourceValue of values) {
    const id = identify(sourceValue).trim();
    if (!id) {
      INITIALIZATION_ERRORS.push(`${kind} registry contains a blank ID`);
      continue;
    }
    if (entries.has(id)) {
      INITIALIZATION_ERRORS.push(`${kind} registry contains duplicate ID: ${id}`);
      continue;
    }
    const cloned = deepClone(sourceValue);
    const entry: RegulatoryRegistryEntry<T> = {
      kind,
      id,
      fingerprint: fingerprintRegulatoryRegistryValue(cloned),
      value: deepFreeze(cloned),
    };
    entries.set(id, deepFreeze(entry) as RegulatoryRegistryEntry<T>);
  }
  return entries;
}

const MAPPING_REGISTRY = buildRegistry<RegulatoryApplicabilityMapping>(
  "mapping",
  REGULATORY_BENCHMARK_APPLICABILITY_MAPPINGS,
  (mapping) => mapping.mappingId
);

const POLICY_REGISTRY = buildRegistry<RegulatoryHistoricalGroundingPolicy>(
  "historical-policy",
  REGULATORY_HISTORICAL_GROUNDING_POLICIES,
  (policy) => policy.mappingId
);

const CITATION_TEMPLATE_REGISTRY = buildRegistry<RegulatoryCitationPackage>(
  "citation-template",
  REGULATORY_FULL_BENCHMARK_CITATION_PACKAGES,
  (citationPackage) => citationPackage.mappingId
);

function getEntry<T>(
  registry: ReadonlyMap<string, RegulatoryRegistryEntry<T>>,
  id: string
): RegulatoryRegistryEntry<T> | undefined {
  return registry.get(id);
}

function listEntries<T>(
  registry: ReadonlyMap<string, RegulatoryRegistryEntry<T>>
): readonly RegulatoryRegistryEntry<T>[] {
  return [...registry.values()];
}

export function getRegisteredRegulatoryMapping(
  mappingId: string
): RegulatoryRegistryEntry<RegulatoryApplicabilityMapping> | undefined {
  return getEntry(MAPPING_REGISTRY, mappingId);
}

export function listRegisteredRegulatoryMappings(): readonly RegulatoryRegistryEntry<RegulatoryApplicabilityMapping>[] {
  return listEntries(MAPPING_REGISTRY);
}

export function getRegisteredHistoricalGroundingPolicy(
  mappingId: string
): RegulatoryRegistryEntry<RegulatoryHistoricalGroundingPolicy> | undefined {
  return getEntry(POLICY_REGISTRY, mappingId);
}

export function listRegisteredHistoricalGroundingPolicies(): readonly RegulatoryRegistryEntry<RegulatoryHistoricalGroundingPolicy>[] {
  return listEntries(POLICY_REGISTRY);
}

export function getRegisteredCitationTemplate(
  mappingId: string
): RegulatoryRegistryEntry<RegulatoryCitationPackage> | undefined {
  return getEntry(CITATION_TEMPLATE_REGISTRY, mappingId);
}

export function listRegisteredCitationTemplates(): readonly RegulatoryRegistryEntry<RegulatoryCitationPackage>[] {
  return listEntries(CITATION_TEMPLATE_REGISTRY);
}

export function compareWithRegisteredRegulatoryValue(
  kind: RegulatoryRegistryKind,
  id: string,
  supplied: unknown
): string[] {
  const entry =
    kind === "mapping"
      ? getRegisteredRegulatoryMapping(id)
      : kind === "historical-policy"
        ? getRegisteredHistoricalGroundingPolicy(id)
        : getRegisteredCitationTemplate(id);
  if (!entry) return [`No registered ${kind} exists for ${id}`];
  const observedFingerprint = fingerprintRegulatoryRegistryValue(supplied);
  return observedFingerprint === entry.fingerprint
    ? []
    : [
        `Supplied ${kind} differs from the immutable registry for ${id}: expected ${entry.fingerprint}, observed ${observedFingerprint}`,
      ];
}

export function validateRegulatoryRegistryIntegrity(): string[] {
  const errors = [...INITIALIZATION_ERRORS];
  const expectedMappingIds = new Set(
    REGULATORY_BENCHMARK_APPLICABILITY_MAPPINGS.map((mapping) => mapping.mappingId)
  );
  if (MAPPING_REGISTRY.size !== expectedMappingIds.size) {
    errors.push(
      `Mapping registry size mismatch: expected ${expectedMappingIds.size}, observed ${MAPPING_REGISTRY.size}`
    );
  }
  if (POLICY_REGISTRY.size !== expectedMappingIds.size) {
    errors.push(
      `Historical policy registry size mismatch: expected ${expectedMappingIds.size}, observed ${POLICY_REGISTRY.size}`
    );
  }
  if (CITATION_TEMPLATE_REGISTRY.size !== expectedMappingIds.size) {
    errors.push(
      `Citation template registry size mismatch: expected ${expectedMappingIds.size}, observed ${CITATION_TEMPLATE_REGISTRY.size}`
    );
  }

  for (const mappingId of expectedMappingIds) {
    const mapping = MAPPING_REGISTRY.get(mappingId);
    const policy = POLICY_REGISTRY.get(mappingId);
    const template = CITATION_TEMPLATE_REGISTRY.get(mappingId);
    if (!mapping) errors.push(`Mapping registry omits ${mappingId}`);
    if (!policy) errors.push(`Historical policy registry omits ${mappingId}`);
    if (!template) errors.push(`Citation template registry omits ${mappingId}`);
    if (mapping && mapping.value.mappingId !== mappingId) {
      errors.push(`Mapping registry identity mismatch: ${mappingId}`);
    }
    if (policy && policy.value.mappingId !== mappingId) {
      errors.push(`Historical policy registry identity mismatch: ${mappingId}`);
    }
    if (template && template.value.mappingId !== mappingId) {
      errors.push(`Citation template registry identity mismatch: ${mappingId}`);
    }
    if (mapping && mapping.fingerprint !== fingerprintRegulatoryRegistryValue(mapping.value)) {
      errors.push(`Mapping registry fingerprint mismatch: ${mappingId}`);
    }
    if (policy && policy.fingerprint !== fingerprintRegulatoryRegistryValue(policy.value)) {
      errors.push(`Historical policy registry fingerprint mismatch: ${mappingId}`);
    }
    if (template && template.fingerprint !== fingerprintRegulatoryRegistryValue(template.value)) {
      errors.push(`Citation template registry fingerprint mismatch: ${mappingId}`);
    }
  }
  return [...new Set(errors)];
}
