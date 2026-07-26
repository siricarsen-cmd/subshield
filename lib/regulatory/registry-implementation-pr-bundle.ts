import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import {
  isLiveAuthorizedRegulatoryRegistryImplementationPlan,
  validateRegulatoryRegistryImplementationPlan,
  type RegulatoryRegistryImplementationPlan,
} from "./registry-implementation-plan";
import {
  fingerprintRegulatoryRegistryValue,
  getRegisteredCitationTemplate,
  getRegisteredHistoricalGroundingPolicy,
  getRegisteredRegulatoryMapping,
  type RegulatoryRegistryKind,
} from "./registry-integrity";
import type { RegulatoryHistoricalGroundingPolicy } from "./historical-grounding-policy";
import {
  validateRegulatoryCitationPackage,
  type RegulatoryCitationPackage,
} from "./citation-package";

export interface RegulatoryImplementationFileInput {
  path: string;
  content: string;
}

export interface RegulatoryImplementationFileChange {
  path: string;
  beforeChecksum: string;
  afterChecksum: string;
  changedRegistryIds: string[];
  content: string;
}

export interface RegulatoryImplementationPullRequestBundle {
  schemaVersion: 1;
  bundleId: string;
  planId: string;
  planChecksum: string;
  baseCommitSha: string;
  targetBranch: string;
  commitMessage: string;
  pullRequestTitle: string;
  pullRequestBody: string;
  files: RegulatoryImplementationFileChange[];
  requiredChecks: string[];
  prohibitedActions: string[];
  authorizationStatus: "live-plan-required";
  applicationStatus: "not-applied";
  customerFacingStatus: "benchmark-only";
  mergeStatus: "not-authorized";
  bundleChecksum: string;
}

export interface RegulatoryImplementationPullRequestMetadata {
  bundleId: string;
  commitMessage: string;
  pullRequestTitle: string;
  pullRequestBody: string;
}

const ALLOWED_TARGETS = new Set([
  "lib/regulatory/benchmark-applicability-mappings.ts",
  "lib/regulatory/historical-grounding-policy.ts",
  "lib/regulatory/source-coverage-citation-packages.ts",
]);

const ID_FIELD_BY_KIND = {
  mapping: "mappingId",
} as const;

const IMPLEMENTATION_BUNDLES = new WeakSet<object>();
const COVERAGE_OVERRIDE_REGISTRY = "APPROVED_COVERAGE_PACKAGE_OVERRIDES";

function sha256(value: string): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function jsonClone<T>(value: T): T {
  const serialized = JSON.stringify(value);
  if (serialized === undefined) {
    throw new Error("Implementation bundle value is not JSON serializable");
  }
  return JSON.parse(serialized) as T;
}

function deepFreeze<T>(value: T): Readonly<T> {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const nested of Object.values(value as Record<string, unknown>)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value as Readonly<T>;
}

function canonicalFingerprint(value: unknown): string {
  return fingerprintRegulatoryRegistryValue(jsonClone(value));
}

function bundlePayload(
  bundle:
    | Omit<RegulatoryImplementationPullRequestBundle, "bundleChecksum">
    | RegulatoryImplementationPullRequestBundle
): Omit<RegulatoryImplementationPullRequestBundle, "bundleChecksum"> {
  const { bundleChecksum: _ignored, ...payload } =
    bundle as RegulatoryImplementationPullRequestBundle;
  return jsonClone(payload);
}

function checksumForBundle(
  bundle:
    | Omit<RegulatoryImplementationPullRequestBundle, "bundleChecksum">
    | RegulatoryImplementationPullRequestBundle
): string {
  return canonicalFingerprint(bundlePayload(bundle));
}

function findObjectRange(source: string, field: string, id: string): [number, number] {
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`\\b${field}\\s*:\\s*[\"']${escaped}[\"']`, "g");
  const matches = [...source.matchAll(pattern)];
  if (matches.length !== 1 || matches[0].index === undefined) {
    throw new Error(
      `Implementation target must contain exactly one ${field} for ${id}; observed ${matches.length}`
    );
  }
  const marker = matches[0].index;
  let start = -1;
  let depth = 0;
  let quote: string | undefined;
  let escapedCharacter = false;
  for (let index = marker; index >= 0; index--) {
    const character = source[index];
    if (quote) {
      if (escapedCharacter) escapedCharacter = false;
      else if (character === "\\") escapedCharacter = true;
      else if (character === quote) quote = undefined;
      continue;
    }
    if (character === '"' || character === "'" || character === "`") {
      quote = character;
      continue;
    }
    if (character === "}") depth++;
    else if (character === "{") {
      if (depth === 0) {
        start = index;
        break;
      }
      depth--;
    }
  }
  if (start < 0) throw new Error(`Implementation target object start was not found for ${id}`);

  depth = 0;
  quote = undefined;
  escapedCharacter = false;
  let lineComment = false;
  let blockComment = false;
  for (let index = start; index < source.length; index++) {
    const character = source[index];
    const next = source[index + 1];
    if (lineComment) {
      if (character === "\n") lineComment = false;
      continue;
    }
    if (blockComment) {
      if (character === "*" && next === "/") {
        blockComment = false;
        index++;
      }
      continue;
    }
    if (quote) {
      if (escapedCharacter) escapedCharacter = false;
      else if (character === "\\") escapedCharacter = true;
      else if (character === quote) quote = undefined;
      continue;
    }
    if (character === "/" && next === "/") {
      lineComment = true;
      index++;
      continue;
    }
    if (character === "/" && next === "*") {
      blockComment = true;
      index++;
      continue;
    }
    if (character === '"' || character === "'" || character === "`") {
      quote = character;
      continue;
    }
    if (character === "{") depth++;
    else if (character === "}") {
      depth--;
      if (depth === 0) return [start, index + 1];
    }
  }
  throw new Error(`Implementation target object end was not found for ${id}`);
}

function indentationAt(source: string, offset: number): string {
  const lineStart = source.lastIndexOf("\n", offset - 1) + 1;
  return source.slice(lineStart, offset).match(/^\s*/)?.[0] ?? "";
}

function renderValue(value: unknown, indentation: string): string {
  const rendered = JSON.stringify(jsonClone(value), null, 2);
  if (!rendered) throw new Error("Implementation proposed value cannot be rendered");
  return rendered
    .split("\n")
    .map((line, index) => (index === 0 ? line : `${indentation}${line}`))
    .join("\n");
}

function packageIdAt(source: string, marker: number, mappingId: string): string {
  const prefix = source.slice(Math.max(0, marker - 500), marker);
  const matches = [...prefix.matchAll(/\bpackageId\s*:\s*["']([^"']+)["']/g)];
  const packageId = matches.at(-1)?.[1];
  if (!packageId || !packageId.startsWith(`${mappingId}-`)) {
    throw new Error(`Implementation citation request packageId was not found for ${mappingId}`);
  }
  return packageId;
}

function validateCitationTargetSource(source: string, mappingId: string): void {
  const registered = getRegisteredCitationTemplate(mappingId);
  if (!registered) {
    throw new Error(`Implementation citation target is not registered: ${mappingId}`);
  }
  const escaped = mappingId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const association = new RegExp(
    `\\bmapping\\s*:\\s*mappingById\\s*\\([^)]*?,\\s*["']${escaped}["']\\s*\\)`,
    "g"
  );
  const associationMatches = [...source.matchAll(association)];
  const escapedPackageId = registered.value.packageId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const packagePattern = new RegExp(
    `\\bpackageId\\s*:\\s*["']${escapedPackageId}["']`,
    "g"
  );
  const packageMatches = [...source.matchAll(packagePattern)];
  const requiresCoverageRequest =
    registered.value.packageId === `${mappingId}-complete-source-coverage`;

  if (associationMatches.length > 1 || packageMatches.length > 1) {
    throw new Error(
      `Implementation citation target must be unique for ${mappingId}; observed ${associationMatches.length} mapping associations and ${packageMatches.length} package identities`
    );
  }
  if (requiresCoverageRequest) {
    if (
      associationMatches.length !== 1 ||
      packageMatches.length !== 1 ||
      associationMatches[0].index === undefined ||
      packageMatches[0].index === undefined
    ) {
      throw new Error(
        `Implementation citation request must contain exactly one canonical association and package for ${mappingId}`
      );
    }
    const packageId = packageIdAt(source, associationMatches[0].index, mappingId);
    if (packageId !== registered.value.packageId) {
      throw new Error(`Implementation citation request package identity is invalid for ${mappingId}`);
    }
    const [start, end] = findObjectRange(source, "packageId", packageId);
    if (
      associationMatches[0].index < start ||
      associationMatches[0].index >= end ||
      packageMatches[0].index < start ||
      packageMatches[0].index >= end
    ) {
      throw new Error(`Implementation citation request association is outside its package for ${mappingId}`);
    }
  } else if (associationMatches.length !== 0 || packageMatches.length !== 0) {
    throw new Error(
      `Implementation baseline citation target has an unexpected coverage-request identity: ${mappingId}`
    );
  }
}

function findBalancedRange(
  source: string,
  start: number,
  openCharacter: string,
  closeCharacter: string,
  label: string
): [number, number] {
  let depth = 0;
  let quote: string | undefined;
  let escapedCharacter = false;
  let lineComment = false;
  let blockComment = false;
  for (let index = start; index < source.length; index++) {
    const character = source[index];
    const next = source[index + 1];
    if (lineComment) {
      if (character === "\n") lineComment = false;
      continue;
    }
    if (blockComment) {
      if (character === "*" && next === "/") {
        blockComment = false;
        index++;
      }
      continue;
    }
    if (quote) {
      if (escapedCharacter) escapedCharacter = false;
      else if (character === "\\") escapedCharacter = true;
      else if (character === quote) quote = undefined;
      continue;
    }
    if (character === "/" && next === "/") {
      lineComment = true;
      index++;
      continue;
    }
    if (character === "/" && next === "*") {
      blockComment = true;
      index++;
      continue;
    }
    if (character === '"' || character === "'" || character === "`") quote = character;
    else if (character === openCharacter) depth++;
    else if (character === closeCharacter && --depth === 0) return [start, index + 1];
  }
  throw new Error(`Implementation ${label} range is malformed`);
}

function findAssignedObjectRange(source: string, identifier: string): [number, number] {
  const matches = [
    ...source.matchAll(new RegExp(`\\bexport\\s+const\\s+${identifier}\\b`, "g")),
  ];
  if (matches.length !== 1 || matches[0].index === undefined) {
    throw new Error(`Implementation target must contain exactly one ${identifier} registry`);
  }
  const assignment = source.indexOf("=", matches[0].index);
  const start = source.indexOf("{", assignment);
  if (assignment < 0 || start < 0) {
    throw new Error(`Implementation ${identifier} registry is malformed`);
  }
  return findBalancedRange(source, start, "{", "}", identifier);
}

function parseJsonObject<T>(source: string, range: [number, number], label: string): T {
  try {
    const value = JSON.parse(source.slice(...range)) as T;
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
    return value;
  } catch {
    throw new Error(`Implementation ${label} must be a JSON-compatible object`);
  }
}

function assertCitationOverride(
  value: unknown,
  mappingId: string,
  proposedFingerprint?: string
): RegulatoryCitationPackage {
  const registered = getRegisteredCitationTemplate(mappingId);
  const citationPackage = jsonClone(value) as RegulatoryCitationPackage;
  let errors: string[];
  try {
    errors = validateRegulatoryCitationPackage(citationPackage);
  } catch {
    errors = ["citation package schema is malformed"];
  }
  if (
    !registered ||
    citationPackage.mappingId !== mappingId ||
    citationPackage.packageId !== registered.value.packageId ||
    citationPackage.customerFacingStatus !== "benchmark-only" ||
    errors.length > 0 ||
    (proposedFingerprint && canonicalFingerprint(citationPackage) !== proposedFingerprint)
  ) {
    throw new Error(
      `Implementation citation override is invalid for ${mappingId}: ${errors.join("; ")}`
    );
  }
  return citationPackage;
}

function renderCitationOverrides(
  source: string,
  steps: RegulatoryRegistryImplementationPlan["steps"]
): { start: number; end: number; content: string; id: string } {
  for (const step of steps) validateCitationTargetSource(source, step.id);
  const range = findAssignedObjectRange(source, COVERAGE_OVERRIDE_REGISTRY);
  const overrides = parseJsonObject<Record<string, RegulatoryCitationPackage>>(
    source,
    range,
    COVERAGE_OVERRIDE_REGISTRY
  );
  for (const step of steps) {
    const proposed = assertCitationOverride(step.proposedValue, step.id, step.proposedFingerprint);
    if (overrides[step.id] && canonicalFingerprint(overrides[step.id]) === step.proposedFingerprint) {
      throw new Error(`Implementation citation override is a no-op for ${step.id}`);
    }
    overrides[step.id] = proposed;
  }
  return {
    start: range[0],
    end: range[1],
    content: renderValue(overrides, indentationAt(source, range[0])),
    id: steps.map((step) => step.id).join(","),
  };
}

function findCallRanges(source: string, functionName: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  let quote: string | undefined;
  let escapedCharacter = false;
  let lineComment = false;
  let blockComment = false;
  for (let index = 0; index < source.length; index++) {
    const character = source[index];
    const next = source[index + 1];
    if (lineComment) {
      if (character === "\n") lineComment = false;
      continue;
    }
    if (blockComment) {
      if (character === "*" && next === "/") {
        blockComment = false;
        index++;
      }
      continue;
    }
    if (quote) {
      if (escapedCharacter) escapedCharacter = false;
      else if (character === "\\") escapedCharacter = true;
      else if (character === quote) quote = undefined;
      continue;
    }
    if (character === "/" && next === "/") {
      lineComment = true;
      index++;
      continue;
    }
    if (character === "/" && next === "*") {
      blockComment = true;
      index++;
      continue;
    }
    if (character === '"' || character === "'" || character === "`") {
      quote = character;
      continue;
    }
    if (!source.startsWith(functionName, index)) continue;
    const before = source[index - 1];
    const after = source[index + functionName.length];
    if ((before && /[\w$]/.test(before)) || (after && /[\w$]/.test(after))) continue;
    let open = index + functionName.length;
    while (/\s/.test(source[open] ?? "")) open++;
    if (source[open] !== "(") continue;

    let depth = 0;
    let nestedQuote: string | undefined;
    let nestedEscape = false;
    let nestedLineComment = false;
    let nestedBlockComment = false;
    for (let cursor = open; cursor < source.length; cursor++) {
      const current = source[cursor];
      const following = source[cursor + 1];
      if (nestedLineComment) {
        if (current === "\n") nestedLineComment = false;
        continue;
      }
      if (nestedBlockComment) {
        if (current === "*" && following === "/") {
          nestedBlockComment = false;
          cursor++;
        }
        continue;
      }
      if (nestedQuote) {
        if (nestedEscape) nestedEscape = false;
        else if (current === "\\") nestedEscape = true;
        else if (current === nestedQuote) nestedQuote = undefined;
        continue;
      }
      if (current === "/" && following === "/") {
        nestedLineComment = true;
        cursor++;
      } else if (current === "/" && following === "*") {
        nestedBlockComment = true;
        cursor++;
      } else if (current === '"' || current === "'" || current === "`") {
        nestedQuote = current;
      } else if (current === "(") depth++;
      else if (current === ")" && --depth === 0) {
        ranges.push([index, cursor + 1]);
        index = cursor;
        break;
      }
    }
    if (depth !== 0) throw new Error(`Implementation ${functionName} call is malformed`);
  }
  return ranges;
}

function findHistoricalPolicyRange(source: string, mappingId: string): [number, number] {
  const matches = findCallRanges(source, "createPolicy").filter(([start, end]) => {
    const call = source.slice(start, end);
    const firstArgument = call.match(/^createPolicy\s*\(\s*(["'])([^"']+)\1\s*,/);
    return firstArgument?.[2] === mappingId;
  });
  if (matches.length !== 1) {
    throw new Error(
      `Implementation target must contain exactly one createPolicy call for ${mappingId}; observed ${matches.length}`
    );
  }
  return matches[0];
}

function renderHistoricalPolicy(value: unknown, indentation: string): string {
  const policy = jsonClone(value) as Partial<RegulatoryHistoricalGroundingPolicy>;
  if (
    typeof policy.mappingId !== "string" ||
    policy.policyId !== `${policy.mappingId}-historical-date-policy-v1` ||
    policy.customerFacingStatus !== "benchmark-only" ||
    !Array.isArray(policy.sourcePolicies)
  ) {
    throw new Error("Implementation historical-policy proposed value is malformed");
  }
  const policies = renderValue(policy.sourcePolicies, `${indentation}  `);
  return `createPolicy(${JSON.stringify(policy.mappingId)}, ${policies})`;
}

function currentRegistryFingerprint(kind: RegulatoryRegistryKind, id: string): string | undefined {
  return kind === "mapping"
    ? getRegisteredRegulatoryMapping(id)?.fingerprint
    : kind === "historical-policy"
      ? getRegisteredHistoricalGroundingPolicy(id)?.fingerprint
      : getRegisteredCitationTemplate(id)?.fingerprint;
}

function readReviewedBaseFile(baseCommitSha: string, targetFile: string): string {
  if (!/^[a-f0-9]{40}$/i.test(baseCommitSha)) {
    throw new Error("Implementation plan base commit is invalid");
  }
  try {
    return execFileSync("git", ["show", `${baseCommitSha}:${targetFile}`], {
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch {
    throw new Error(`Reviewed base file is unavailable from Git: ${baseCommitSha}:${targetFile}`);
  }
}

/** Pure deterministic renderer shared by bundle construction and focused canonical-shape tests. */
export function applyRegulatoryImplementationStepsToFile(
  source: string,
  steps: RegulatoryRegistryImplementationPlan["steps"]
): string {
  const citationSteps = steps.filter((step) => step.kind === "citation-template");
  const replacements = steps
    .filter((step) => step.kind !== "citation-template")
    .map((step) => {
      const [start, end] =
        step.kind === "historical-policy"
          ? findHistoricalPolicyRange(source, step.id)
          : findObjectRange(source, ID_FIELD_BY_KIND.mapping, step.id);
      return {
        start,
        end,
        content:
          step.kind === "historical-policy"
            ? renderHistoricalPolicy(step.proposedValue, indentationAt(source, start))
            : renderValue(step.proposedValue, indentationAt(source, start)),
        id: step.id,
      };
    });
  if (citationSteps.length > 0) replacements.push(renderCitationOverrides(source, citationSteps));
  const sorted = [...replacements].sort((left, right) => right.start - left.start);
  for (let index = 1; index < sorted.length; index++) {
    if (sorted[index - 1].start < sorted[index].end) {
      throw new Error("Implementation target ranges overlap");
    }
  }
  let result = source;
  for (const replacement of sorted) {
    result = `${result.slice(0, replacement.start)}${replacement.content}${result.slice(
      replacement.end
    )}`;
  }
  return result;
}

function extractHistoricalPolicy(
  source: string,
  mappingId: string
): RegulatoryHistoricalGroundingPolicy {
  const [start, end] = findHistoricalPolicyRange(source, mappingId);
  const call = source.slice(start, end);
  const comma = call.indexOf(",");
  const arrayStart = call.indexOf("[", comma);
  if (comma < 0 || arrayStart < 0) {
    throw new Error(`Emitted createPolicy call is malformed: ${mappingId}`);
  }
  const range = findBalancedRange(call, arrayStart, "[", "]", `createPolicy/${mappingId}`);
  let sourcePolicies: RegulatoryHistoricalGroundingPolicy["sourcePolicies"];
  try {
    sourcePolicies = JSON.parse(call.slice(...range));
  } catch {
    throw new Error(`Emitted createPolicy source policies are malformed: ${mappingId}`);
  }
  return {
    policyId: `${mappingId}-historical-date-policy-v1`,
    mappingId,
    sourcePolicies,
    customerFacingStatus: "benchmark-only",
  };
}

function extractEmittedRegistryValue(
  source: string,
  step: RegulatoryRegistryImplementationPlan["steps"][number]
): unknown {
  if (step.kind === "citation-template") {
    const overrides = parseJsonObject<Record<string, RegulatoryCitationPackage>>(
      source,
      findAssignedObjectRange(source, COVERAGE_OVERRIDE_REGISTRY),
      COVERAGE_OVERRIDE_REGISTRY
    );
    const value = overrides[step.id];
    if (!value) throw new Error(`Emitted citation override is missing: ${step.id}`);
    return assertCitationOverride(value, step.id);
  }
  if (step.kind === "historical-policy") return extractHistoricalPolicy(source, step.id);
  return parseJsonObject(
    source,
    findObjectRange(source, ID_FIELD_BY_KIND.mapping, step.id),
    `mapping/${step.id}`
  );
}

function buildPullRequestBody(plan: RegulatoryRegistryImplementationPlan): string {
  const steps = plan.steps
    .map(
      (step) =>
        `- **${step.kind}/${step.id}** in \`${step.targetFile}\`\n  - Current: \`${step.currentFingerprint}\`\n  - Proposed: \`${step.proposedFingerprint}\``
    )
    .join("\n");
  const checks = plan.requiredChecks.map((check) => `- [ ] \`${check}\``).join("\n");
  return `## Controlled regulatory registry implementation\n\nThis pull request implements one independently reviewed regulatory change-set plan. It does not authorize merge or deployment.\n\n## Authorized changes\n\n${steps}\n\n## Required validation\n\n${checks}\n\n## Boundaries\n\n- Customer-facing status remains **benchmark-only** until deliberate merge authorization.\n- Do not alter analyzer, authentication, payment, database, email, or deployment code.\n- Do not merge if any fingerprint, official evidence, benchmark, or required check has drifted.\n\nPlan: \`${plan.planId}\`\nPlan checksum: \`${plan.planChecksum}\`\nHuman review record: \`${plan.reviewRecordChecksum}\``;
}

export function buildRegulatoryImplementationPullRequestMetadata(
  plan: RegulatoryRegistryImplementationPlan
): RegulatoryImplementationPullRequestMetadata {
  const planErrors = validateRegulatoryRegistryImplementationPlan(plan);
  if (planErrors.length > 0) {
    throw new Error(`Implementation PR bundle plan is invalid: ${planErrors.join("; ")}`);
  }
  return {
    bundleId: `regulatory-implementation-pr:${plan.sourceId}:${plan.planChecksum}`,
    commitMessage: `feat(regulatory): implement approved ${plan.sourceId} registry update`,
    pullRequestTitle: `Implement approved ${plan.sourceId} regulatory registry update`,
    pullRequestBody: buildPullRequestBody(plan),
  };
}

function groupImplementationStepsByPath(
  plan: RegulatoryRegistryImplementationPlan
): Map<string, RegulatoryRegistryImplementationPlan["steps"]> {
  const stepsByPath = new Map<string, RegulatoryRegistryImplementationPlan["steps"]>();
  const transitionIdentities = new Set<string>();
  for (const step of plan.steps) {
    if (!ALLOWED_TARGETS.has(step.targetFile)) {
      throw new Error(`Implementation plan targets a prohibited file: ${step.targetFile}`);
    }
    const transitionIdentity = `${step.kind}:${step.id}`;
    if (transitionIdentities.has(transitionIdentity)) {
      throw new Error(`Duplicate implementation registry transition: ${transitionIdentity}`);
    }
    transitionIdentities.add(transitionIdentity);
    const grouped = stepsByPath.get(step.targetFile) ?? [];
    if (grouped.some((candidate) => candidate.id === step.id)) {
      throw new Error(`Duplicate implementation registry ID for ${step.targetFile}: ${step.id}`);
    }
    stepsByPath.set(step.targetFile, [...grouped, step]);
  }
  return stepsByPath;
}

function regenerateImplementationFileChanges(
  plan: RegulatoryRegistryImplementationPlan
): RegulatoryImplementationFileChange[] {
  const stepsByPath = groupImplementationStepsByPath(plan);
  return [...stepsByPath.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([targetFile, steps]) => {
      const source = readReviewedBaseFile(plan.baseCommitSha, targetFile);
      const content = applyRegulatoryImplementationStepsToFile(source, steps);
      if (content === source) {
        throw new Error(`Implementation produced no file change: ${targetFile}`);
      }
      for (const step of steps) {
        const emitted = extractEmittedRegistryValue(content, step);
        if (canonicalFingerprint(emitted) !== step.proposedFingerprint) {
          throw new Error(
            `Implementation emitted registry fingerprint does not match plan: ${step.kind}/${step.id}`
          );
        }
      }
      return {
        path: targetFile,
        beforeChecksum: sha256(source),
        afterChecksum: sha256(content),
        changedRegistryIds: steps.map((step) => step.id).sort(),
        content,
      };
    });
}

export function buildRegulatoryImplementationPullRequestBundle(
  plan: RegulatoryRegistryImplementationPlan,
  files: readonly RegulatoryImplementationFileInput[]
): Readonly<RegulatoryImplementationPullRequestBundle> {
  if (!isLiveAuthorizedRegulatoryRegistryImplementationPlan(plan)) {
    throw new Error("Implementation PR bundle requires the original live-authorized plan");
  }
  const planErrors = validateRegulatoryRegistryImplementationPlan(plan);
  if (planErrors.length > 0) {
    throw new Error(`Implementation PR bundle plan is invalid: ${planErrors.join("; ")}`);
  }
  const filesByPath = new Map<string, string>();
  for (const file of files) {
    if (filesByPath.has(file.path)) {
      throw new Error(`Duplicate implementation file input: ${file.path}`);
    }
    filesByPath.set(file.path, file.content);
  }
  const stepsByPath = groupImplementationStepsByPath(plan);
  if (filesByPath.size !== stepsByPath.size) {
    throw new Error("Implementation file inputs must exactly match the authorized target-file set");
  }

  for (const [targetFile, steps] of [...stepsByPath.entries()].sort(([a], [b]) =>
    a.localeCompare(b)
  )) {
    const source = filesByPath.get(targetFile);
    if (source === undefined) {
      throw new Error(`Missing authorized implementation file: ${targetFile}`);
    }
    const reviewedBase = readReviewedBaseFile(plan.baseCommitSha, targetFile);
    if (source !== reviewedBase) {
      throw new Error(`Implementation file does not match reviewed Git base: ${targetFile}`);
    }
    const canonicalSource = readFileSync(targetFile, "utf8");
    if (reviewedBase !== canonicalSource) {
      throw new Error(`Reviewed Git base does not match the current canonical registry file: ${targetFile}`);
    }
    for (const step of steps) {
      const observedFingerprint = currentRegistryFingerprint(step.kind, step.id);
      if (observedFingerprint !== step.currentFingerprint) {
        throw new Error(
          `Reviewed Git base target does not match approved current fingerprint: ${step.kind}/${step.id}`
        );
      }
    }
  }

  const metadata = buildRegulatoryImplementationPullRequestMetadata(plan);
  const payload: Omit<RegulatoryImplementationPullRequestBundle, "bundleChecksum"> = {
    schemaVersion: 1,
    ...metadata,
    planId: plan.planId,
    planChecksum: plan.planChecksum,
    baseCommitSha: plan.baseCommitSha,
    targetBranch: plan.targetBranch,
    files: regenerateImplementationFileChanges(plan),
    requiredChecks: [...plan.requiredChecks],
    prohibitedActions: [...plan.prohibitedActions],
    authorizationStatus: "live-plan-required",
    applicationStatus: "not-applied",
    customerFacingStatus: "benchmark-only",
    mergeStatus: "not-authorized",
  };
  const bundle: RegulatoryImplementationPullRequestBundle = {
    ...payload,
    bundleChecksum: checksumForBundle(payload),
  };
  const errors = validateRegulatoryImplementationPullRequestBundle(bundle, plan);
  if (errors.length > 0) {
    throw new Error(`Built implementation PR bundle failed validation: ${errors.join("; ")}`);
  }
  const frozen = deepFreeze(bundle);
  IMPLEMENTATION_BUNDLES.add(frozen as object);
  return frozen;
}

export function validateRegulatoryImplementationPullRequestBundle(
  bundle: RegulatoryImplementationPullRequestBundle,
  plan?: RegulatoryRegistryImplementationPlan
): string[] {
  const errors: string[] = [];
  if (bundle.schemaVersion !== 1) {
    errors.push("Implementation PR bundle schema version is invalid");
  }
  if (!bundle.bundleId.startsWith("regulatory-implementation-pr:")) {
    errors.push("Implementation PR bundle ID is invalid");
  }
  if (bundle.files.length === 0) errors.push("Implementation PR bundle contains no file changes");
  const paths = new Set<string>();
  for (const file of bundle.files) {
    if (!ALLOWED_TARGETS.has(file.path) || paths.has(file.path)) {
      errors.push(`Implementation PR bundle file path is invalid or duplicated: ${file.path}`);
    }
    paths.add(file.path);
    if (
      !/^sha256:[a-f0-9]{64}$/.test(file.beforeChecksum) ||
      !/^sha256:[a-f0-9]{64}$/.test(file.afterChecksum)
    ) {
      errors.push(`Implementation PR bundle file checksum is invalid: ${file.path}`);
    }
    if (file.beforeChecksum === file.afterChecksum || file.afterChecksum !== sha256(file.content)) {
      errors.push(`Implementation PR bundle file content does not match its checksum: ${file.path}`);
    }
    if (
      file.changedRegistryIds.length === 0 ||
      new Set(file.changedRegistryIds).size !== file.changedRegistryIds.length
    ) {
      errors.push(`Implementation PR bundle registry IDs are invalid: ${file.path}`);
    }
  }
  if (
    bundle.authorizationStatus !== "live-plan-required" ||
    bundle.applicationStatus !== "not-applied" ||
    bundle.customerFacingStatus !== "benchmark-only" ||
    bundle.mergeStatus !== "not-authorized"
  ) {
    errors.push("Implementation PR bundle escaped its non-applied or non-mergeable boundary");
  }
  if (bundle.bundleChecksum !== checksumForBundle(bundle)) {
    errors.push("Implementation PR bundle checksum does not reproduce");
  }
  if (plan) {
    try {
      const metadata = buildRegulatoryImplementationPullRequestMetadata(plan);
      if (
        bundle.bundleId !== metadata.bundleId ||
        bundle.commitMessage !== metadata.commitMessage ||
        bundle.pullRequestTitle !== metadata.pullRequestTitle ||
        bundle.pullRequestBody !== metadata.pullRequestBody
      ) {
        errors.push("Implementation PR bundle metadata does not reproduce from its authorized plan");
      }
      if (
        bundle.planId !== plan.planId ||
        bundle.planChecksum !== plan.planChecksum ||
        bundle.baseCommitSha !== plan.baseCommitSha ||
        bundle.targetBranch !== plan.targetBranch ||
        canonicalFingerprint(bundle.requiredChecks) !== canonicalFingerprint(plan.requiredChecks) ||
        canonicalFingerprint(bundle.prohibitedActions) !== canonicalFingerprint(plan.prohibitedActions)
      ) {
        errors.push("Implementation PR bundle does not match its authorized plan");
      }
      const expectedFiles = regenerateImplementationFileChanges(plan);
      if (canonicalFingerprint(bundle.files) !== canonicalFingerprint(expectedFiles)) {
        errors.push(
          "Implementation PR bundle files do not exactly reproduce the authorized plan from its reviewed Git base"
        );
      }
      const filesByPath = new Map(bundle.files.map((file) => [file.path, file]));
      for (const step of plan.steps) {
        const file = filesByPath.get(step.targetFile);
        if (!file || !file.changedRegistryIds.includes(step.id)) {
          errors.push(
            `Implementation PR bundle omits its planned registry value: ${step.kind}/${step.id}`
          );
          continue;
        }
        const emitted = extractEmittedRegistryValue(file.content, step);
        if (canonicalFingerprint(emitted) !== step.proposedFingerprint) {
          errors.push(
            `Implementation PR bundle emitted registry fingerprint does not match plan: ${step.kind}/${step.id}`
          );
        }
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }
  const serialized = JSON.stringify(bundle);
  if (serialized.includes('"customerContract"') || serialized.includes('"rawBody"')) {
    errors.push("Implementation PR bundle contains prohibited customer or raw-source payloads");
  }
  return [...new Set(errors)];
}

export function isLiveRegulatoryImplementationPullRequestBundle(
  value: unknown
): value is RegulatoryImplementationPullRequestBundle {
  return Boolean(
    value &&
      typeof value === "object" &&
      IMPLEMENTATION_BUNDLES.has(value as object) &&
      validateRegulatoryImplementationPullRequestBundle(
        value as RegulatoryImplementationPullRequestBundle
      ).length === 0
  );
}
