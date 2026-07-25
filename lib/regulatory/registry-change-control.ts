import type { RegulatoryApplicabilityMapping } from "./applicability";
import type { RegulatoryCitationPackage } from "./citation-package";
import { validateRegulatoryCitationPackage } from "./citation-package";
import type { RegulatoryHistoricalGroundingPolicy } from "./historical-grounding-policy";
import {
  fingerprintRegulatoryRegistryValue,
  getRegisteredCitationTemplate,
  getRegisteredHistoricalGroundingPolicy,
  getRegisteredRegulatoryMapping,
  type RegulatoryRegistryEntry,
  type RegulatoryRegistryKind,
} from "./registry-integrity";
import { getRegulatorySource } from "./source-catalog";

export type RegulatoryRegistryValue =
  | RegulatoryApplicabilityMapping
  | RegulatoryHistoricalGroundingPolicy
  | RegulatoryCitationPackage;

export interface OfficialRegistryChangeEvidence {
  sourceId: string;
  snapshotId: string;
  citation: string;
  checksum: string;
  evidenceNote: string;
}

export interface RegulatoryRegistryChange {
  kind: RegulatoryRegistryKind;
  id: string;
  beforeFingerprint: string;
  afterValue: RegulatoryRegistryValue;
  afterFingerprint: string;
  reason: string;
  officialEvidence: OfficialRegistryChangeEvidence[];
  benchmarkImpact: string[];
  regressionPlan: string[];
}

export type RegulatoryRegistryChangeReviewStatus =
  | "pending"
  | "approved"
  | "rejected";

export interface RegulatoryRegistryChangeSet {
  changeSetId: string;
  createdAt: string;
  requestedBy: string;
  changes: RegulatoryRegistryChange[];
  customerFacingStatus: "benchmark-only";
  reviewStatus: RegulatoryRegistryChangeReviewStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string[];
}

export interface RegulatoryRegistryChangeSetValidation {
  valid: boolean;
  errors: string[];
}

export interface RegulatoryRegistryReleaseTransition {
  kind: RegulatoryRegistryKind;
  id: string;
  beforeFingerprint: string;
  afterFingerprint: string;
  officialSourceIds: string[];
  reason: string;
  benchmarkImpact: string[];
  regressionPlan: string[];
}

export interface RegulatoryRegistryReleaseRecord {
  releaseRecordId: string;
  changeSetId: string;
  approvedAt: string;
  approvedBy: string;
  reviewNotes: string[];
  transitions: RegulatoryRegistryReleaseTransition[];
  applicationStatus: "not-applied";
  customerFacingStatus: "benchmark-only";
  createdAt: string;
}

const SHA256_RE = /^sha256:[a-f0-9]{64}$/;
const REGISTRY_KINDS: readonly RegulatoryRegistryKind[] = [
  "mapping",
  "historical-policy",
  "citation-template",
];

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

function isIsoInstant(value: string): boolean {
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString() === value;
}

function uniqueNonblank(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function registryEntry(
  kind: RegulatoryRegistryKind,
  id: string
): RegulatoryRegistryEntry<RegulatoryRegistryValue> | undefined {
  const entry =
    kind === "mapping"
      ? getRegisteredRegulatoryMapping(id)
      : kind === "historical-policy"
        ? getRegisteredHistoricalGroundingPolicy(id)
        : getRegisteredCitationTemplate(id);
  return entry as RegulatoryRegistryEntry<RegulatoryRegistryValue> | undefined;
}

function identityForValue(
  kind: RegulatoryRegistryKind,
  value: RegulatoryRegistryValue
): string | undefined {
  if (kind === "mapping") {
    return (value as Partial<RegulatoryApplicabilityMapping>).mappingId;
  }
  if (kind === "historical-policy") {
    return (value as Partial<RegulatoryHistoricalGroundingPolicy>).mappingId;
  }
  return (value as Partial<RegulatoryCitationPackage>).mappingId;
}

function sourceIdsForValue(
  kind: RegulatoryRegistryKind,
  value: RegulatoryRegistryValue
): string[] {
  if (kind === "mapping") {
    const comparisons = (value as Partial<RegulatoryApplicabilityMapping>)
      .sourceComparisons;
    return Array.isArray(comparisons)
      ? comparisons
          .map((comparison) => comparison?.sourceId?.trim())
          .filter((sourceId): sourceId is string => Boolean(sourceId))
      : [];
  }
  if (kind === "historical-policy") {
    const policies = (value as Partial<RegulatoryHistoricalGroundingPolicy>)
      .sourcePolicies;
    return Array.isArray(policies)
      ? policies
          .map((policy) => policy?.sourceId?.trim())
          .filter((sourceId): sourceId is string => Boolean(sourceId))
      : [];
  }
  const citations = (value as Partial<RegulatoryCitationPackage>).citations;
  return Array.isArray(citations)
    ? citations
        .map((citation) => citation?.sourceId?.trim())
        .filter((sourceId): sourceId is string => Boolean(sourceId))
    : [];
}

function sourceSetKey(sourceIds: readonly string[]): string {
  return [...new Set(sourceIds)].sort((left, right) => left.localeCompare(right)).join("|");
}

function validateNonblankList(
  label: string,
  values: unknown,
  errors: string[]
): void {
  if (!Array.isArray(values) || values.length === 0) {
    errors.push(`${label} requires at least one entry`);
    return;
  }
  if (values.some((value) => typeof value !== "string" || !value.trim())) {
    errors.push(`${label} entries must be nonblank strings`);
  }
}

function validateMappingStructure(
  mapping: RegulatoryApplicabilityMapping,
  errors: string[]
): void {
  if (!mapping.mappingId?.trim()) errors.push("mapping ID must not be blank");
  if (!mapping.topic?.trim()) errors.push("mapping topic must not be blank");
  validateNonblankList("mapping evidence quotes", mapping.evidenceQuotes, errors);
  if (!Array.isArray(mapping.sourceComparisons) || mapping.sourceComparisons.length === 0) {
    errors.push("mapping requires at least one source comparison");
  } else {
    for (const comparison of mapping.sourceComparisons) {
      if (!comparison.sourceId?.trim()) errors.push("mapping source ID must not be blank");
      else if (!getRegulatorySource(comparison.sourceId)) {
        errors.push(`mapping uses unknown approved source ID: ${comparison.sourceId}`);
      }
      if (!comparison.locator?.trim()) errors.push("mapping source locator must not be blank");
      if (!comparison.reviewNote?.trim()) {
        errors.push("mapping source review note must not be blank");
      }
    }
  }
  validateNonblankList("mapping prohibited inferences", mapping.prohibitedInferences, errors);
  if (!mapping.reviewerConclusion?.trim()) {
    errors.push("mapping reviewer conclusion must not be blank");
  }
}

function validatePolicyStructure(
  policy: RegulatoryHistoricalGroundingPolicy,
  errors: string[]
): void {
  if (!policy.mappingId?.trim()) errors.push("historical policy mapping ID must not be blank");
  if (policy.customerFacingStatus !== "benchmark-only") {
    errors.push("historical policy must remain benchmark-only");
  }
  if (!Array.isArray(policy.sourcePolicies) || policy.sourcePolicies.length === 0) {
    errors.push("historical policy requires at least one source policy");
    return;
  }
  const seen = new Set<string>();
  for (const sourcePolicy of policy.sourcePolicies) {
    if (!sourcePolicy.sourceId?.trim()) {
      errors.push("historical source policy source ID must not be blank");
      continue;
    }
    if (seen.has(sourcePolicy.sourceId)) {
      errors.push(`historical policy duplicates source ID: ${sourcePolicy.sourceId}`);
    }
    seen.add(sourcePolicy.sourceId);
    if (!getRegulatorySource(sourcePolicy.sourceId)) {
      errors.push(`historical policy uses unknown approved source ID: ${sourcePolicy.sourceId}`);
    }
    if (!sourcePolicy.rationale?.trim()) {
      errors.push(`historical source policy lacks rationale: ${sourcePolicy.sourceId}`);
    }
  }
}

function validateTemplateStructure(
  template: RegulatoryCitationPackage,
  errors: string[]
): void {
  errors.push(...validateRegulatoryCitationPackage(template));
  if (template.customerFacingStatus !== "benchmark-only") {
    errors.push("citation template must remain benchmark-only");
  }
  if (template.sourceCoverage !== "complete" || template.uncoveredSourceIds.length > 0) {
    errors.push("citation template must retain complete source coverage");
  }
}

function validateAfterValue(change: RegulatoryRegistryChange, errors: string[]): void {
  if (change.kind === "mapping") {
    validateMappingStructure(change.afterValue as RegulatoryApplicabilityMapping, errors);
  } else if (change.kind === "historical-policy") {
    validatePolicyStructure(
      change.afterValue as RegulatoryHistoricalGroundingPolicy,
      errors
    );
  } else {
    validateTemplateStructure(change.afterValue as RegulatoryCitationPackage, errors);
  }
}

function validateEvidence(
  evidence: OfficialRegistryChangeEvidence[],
  changeLabel: string,
  errors: string[]
): void {
  if (!Array.isArray(evidence) || evidence.length === 0) {
    errors.push(`${changeLabel}: official source evidence is required`);
    return;
  }
  for (const item of evidence) {
    if (!item.sourceId?.trim()) {
      errors.push(`${changeLabel}: evidence source ID must not be blank`);
    } else if (!getRegulatorySource(item.sourceId)) {
      errors.push(`${changeLabel}: evidence uses unknown approved source ID: ${item.sourceId}`);
    }
    if (!item.snapshotId?.trim()) {
      errors.push(`${changeLabel}: evidence snapshot ID must not be blank`);
    }
    if (!item.citation?.trim()) {
      errors.push(`${changeLabel}: evidence citation must not be blank`);
    }
    if (!SHA256_RE.test(item.checksum)) {
      errors.push(`${changeLabel}: evidence checksum must be a SHA-256 value`);
    }
    if (!item.evidenceNote?.trim()) {
      errors.push(`${changeLabel}: evidence note must not be blank`);
    }
  }
}

function validateReviewEnvelope(
  changeSet: RegulatoryRegistryChangeSet,
  errors: string[]
): void {
  if (changeSet.reviewStatus === "pending") {
    if (
      changeSet.reviewedBy !== undefined ||
      changeSet.reviewedAt !== undefined ||
      changeSet.reviewNotes !== undefined
    ) {
      errors.push("pending change sets must not contain final review provenance");
    }
    return;
  }
  if (!changeSet.reviewedBy?.trim()) {
    errors.push(`${changeSet.reviewStatus} change sets require a reviewer`);
  }
  if (!changeSet.reviewedAt || !isIsoInstant(changeSet.reviewedAt)) {
    errors.push(`${changeSet.reviewStatus} change sets require an ISO review timestamp`);
  }
  validateNonblankList(
    `${changeSet.reviewStatus} change-set review notes`,
    changeSet.reviewNotes,
    errors
  );
}

function validateCoordinatedSourceChanges(
  changeSet: RegulatoryRegistryChangeSet,
  errors: string[]
): void {
  const byMapping = new Map<string, RegulatoryRegistryChange[]>();
  for (const change of changeSet.changes) {
    const changes = byMapping.get(change.id) ?? [];
    changes.push(change);
    byMapping.set(change.id, changes);
  }

  for (const [mappingId, changes] of byMapping) {
    const changedSourceKinds = new Set<RegulatoryRegistryKind>();
    for (const change of changes) {
      const current = registryEntry(change.kind, mappingId);
      if (!current) continue;
      const beforeKey = sourceSetKey(sourceIdsForValue(change.kind, current.value));
      const afterKey = sourceSetKey(sourceIdsForValue(change.kind, change.afterValue));
      if (beforeKey !== afterKey) changedSourceKinds.add(change.kind);
    }
    if (changedSourceKinds.size === 0) continue;

    const kindsPresent = new Set(changes.map((change) => change.kind));
    const missingKinds = REGISTRY_KINDS.filter((kind) => !kindsPresent.has(kind));
    if (missingKinds.length > 0) {
      errors.push(
        `${mappingId}: source-list changes require coordinated mapping, historical-policy, and citation-template changes; missing ${missingKinds.join(", ")}`
      );
      continue;
    }

    const afterSourceSets = REGISTRY_KINDS.map((kind) => {
      const change = changes.find((candidate) => candidate.kind === kind);
      return change
        ? sourceSetKey(sourceIdsForValue(kind, change.afterValue))
        : "";
    });
    if (new Set(afterSourceSets).size !== 1) {
      errors.push(
        `${mappingId}: coordinated after-source sets must match across mapping, historical policy, and citation template`
      );
    }
  }
}

export function validateRegulatoryRegistryChangeSet(
  changeSet: RegulatoryRegistryChangeSet
): RegulatoryRegistryChangeSetValidation {
  const errors: string[] = [];
  if (!changeSet.changeSetId?.trim()) errors.push("change-set ID must not be blank");
  if (!changeSet.createdAt || !isIsoInstant(changeSet.createdAt)) {
    errors.push("change-set createdAt must be an ISO timestamp");
  }
  if (!changeSet.requestedBy?.trim()) errors.push("change-set requester must not be blank");
  if (changeSet.customerFacingStatus !== "benchmark-only") {
    errors.push("registry change sets must remain benchmark-only");
  }
  if (!Array.isArray(changeSet.changes) || changeSet.changes.length === 0) {
    errors.push("change set requires at least one registry transition");
  }
  validateReviewEnvelope(changeSet, errors);

  const seen = new Set<string>();
  for (const change of changeSet.changes ?? []) {
    const label = `${change.kind}/${change.id}`;
    const key = `${change.kind}:${change.id}`;
    if (seen.has(key)) errors.push(`duplicate registry transition: ${label}`);
    seen.add(key);

    const current = registryEntry(change.kind, change.id);
    if (!current) {
      errors.push(`${label}: registry entry does not exist`);
      continue;
    }
    if (change.beforeFingerprint !== current.fingerprint) {
      errors.push(
        `${label}: stale before fingerprint; expected ${current.fingerprint}, observed ${change.beforeFingerprint}`
      );
    }
    const reproducedAfter = fingerprintRegulatoryRegistryValue(change.afterValue);
    if (change.afterFingerprint !== reproducedAfter) {
      errors.push(
        `${label}: after fingerprint does not reproduce; expected ${reproducedAfter}, observed ${change.afterFingerprint}`
      );
    }
    if (change.afterFingerprint === change.beforeFingerprint) {
      errors.push(`${label}: no-op registry transitions are not allowed`);
    }
    const afterId = identityForValue(change.kind, change.afterValue);
    if (afterId !== change.id) {
      errors.push(
        `${label}: after-value identity mismatch; expected ${change.id}, observed ${afterId ?? "missing"}`
      );
    }
    if (!change.reason?.trim()) errors.push(`${label}: change reason must not be blank`);
    validateEvidence(change.officialEvidence, label, errors);
    validateNonblankList(`${label}: benchmark impact`, change.benchmarkImpact, errors);
    validateNonblankList(`${label}: regression plan`, change.regressionPlan, errors);
    validateAfterValue(change, errors);
  }

  validateCoordinatedSourceChanges(changeSet, errors);
  return { valid: errors.length === 0, errors: [...new Set(errors)] };
}

export function approveRegulatoryRegistryChangeSet(
  pending: RegulatoryRegistryChangeSet,
  reviewedBy: string,
  reviewedAt: string,
  reviewNotes: string[]
): Readonly<RegulatoryRegistryChangeSet> {
  if (pending.reviewStatus !== "pending") {
    throw new Error("Only pending regulatory registry change sets can be approved");
  }
  const pendingValidation = validateRegulatoryRegistryChangeSet(pending);
  if (!pendingValidation.valid) {
    throw new Error(
      `Pending regulatory registry change set is invalid: ${pendingValidation.errors.join("; ")}`
    );
  }
  const approved: RegulatoryRegistryChangeSet = {
    ...deepClone(pending),
    reviewStatus: "approved",
    reviewedBy: reviewedBy.trim(),
    reviewedAt,
    reviewNotes: [...reviewNotes],
  };
  const approvedValidation = validateRegulatoryRegistryChangeSet(approved);
  if (!approvedValidation.valid) {
    throw new Error(
      `Approved regulatory registry change set is invalid: ${approvedValidation.errors.join("; ")}`
    );
  }
  return deepFreeze(approved);
}

export function rejectRegulatoryRegistryChangeSet(
  pending: RegulatoryRegistryChangeSet,
  reviewedBy: string,
  reviewedAt: string,
  reviewNotes: string[]
): Readonly<RegulatoryRegistryChangeSet> {
  if (pending.reviewStatus !== "pending") {
    throw new Error("Only pending regulatory registry change sets can be rejected");
  }
  const rejected: RegulatoryRegistryChangeSet = {
    ...deepClone(pending),
    reviewStatus: "rejected",
    reviewedBy: reviewedBy.trim(),
    reviewedAt,
    reviewNotes: [...reviewNotes],
  };
  const validation = validateRegulatoryRegistryChangeSet(rejected);
  if (!validation.valid) {
    throw new Error(
      `Rejected regulatory registry change set is invalid: ${validation.errors.join("; ")}`
    );
  }
  return deepFreeze(rejected);
}

export function createRegulatoryRegistryReleaseRecord(
  approved: RegulatoryRegistryChangeSet,
  createdAt: string
): Readonly<RegulatoryRegistryReleaseRecord> {
  const validation = validateRegulatoryRegistryChangeSet(approved);
  if (!validation.valid) {
    throw new Error(
      `Approved registry change set is invalid: ${validation.errors.join("; ")}`
    );
  }
  if (approved.reviewStatus !== "approved") {
    throw new Error("A release record requires an approved regulatory registry change set");
  }
  if (!isIsoInstant(createdAt)) {
    throw new Error("Registry release-record createdAt must be an ISO timestamp");
  }
  const record: RegulatoryRegistryReleaseRecord = {
    releaseRecordId: `${approved.changeSetId}:release:${createdAt}`,
    changeSetId: approved.changeSetId,
    approvedAt: approved.reviewedAt!,
    approvedBy: approved.reviewedBy!,
    reviewNotes: [...approved.reviewNotes!],
    transitions: approved.changes.map((change) => ({
      kind: change.kind,
      id: change.id,
      beforeFingerprint: change.beforeFingerprint,
      afterFingerprint: change.afterFingerprint,
      officialSourceIds: uniqueNonblank(
        change.officialEvidence.map((evidence) => evidence.sourceId)
      ).sort((left, right) => left.localeCompare(right)),
      reason: change.reason,
      benchmarkImpact: [...change.benchmarkImpact],
      regressionPlan: [...change.regressionPlan],
    })),
    applicationStatus: "not-applied",
    customerFacingStatus: "benchmark-only",
    createdAt,
  };
  return deepFreeze(record);
}
