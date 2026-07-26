import { createHash } from "node:crypto";

import {
  isLiveAuthorizedRegulatoryRegistryImplementationPlan,
  validateRegulatoryRegistryImplementationPlan,
  type RegulatoryRegistryImplementationPlan,
} from "./registry-implementation-plan";
import { fingerprintRegulatoryRegistryValue } from "./registry-integrity";

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

const ALLOWED_TARGETS = new Set([
  "lib/regulatory/benchmark-applicability-mappings.ts",
  "lib/regulatory/historical-grounding-policy.ts",
  "lib/regulatory/source-coverage-citation-packages.ts",
]);

const ID_FIELD_BY_KIND = {
  mapping: "mappingId",
  "historical-policy": "mappingId",
  "citation-template": "mappingId",
} as const;

const IMPLEMENTATION_BUNDLES = new WeakSet<object>();

function sha256(value: string): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function jsonClone<T>(value: T): T {
  const serialized = JSON.stringify(value);
  if (serialized === undefined) throw new Error("Implementation bundle value is not JSON serializable");
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

function applyStepsToFile(
  source: string,
  steps: RegulatoryRegistryImplementationPlan["steps"]
): string {
  const replacements = steps.map((step) => {
    const field = ID_FIELD_BY_KIND[step.kind];
    const [start, end] = findObjectRange(source, field, step.id);
    return {
      start,
      end,
      content: renderValue(step.proposedValue, indentationAt(source, start)),
      id: step.id,
    };
  });
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
    if (filesByPath.has(file.path)) throw new Error(`Duplicate implementation file input: ${file.path}`);
    filesByPath.set(file.path, file.content);
  }
  const stepsByPath = new Map<string, RegulatoryRegistryImplementationPlan["steps"]>();
  for (const step of plan.steps) {
    if (!ALLOWED_TARGETS.has(step.targetFile)) {
      throw new Error(`Implementation plan targets a prohibited file: ${step.targetFile}`);
    }
    const grouped = stepsByPath.get(step.targetFile) ?? [];
    stepsByPath.set(step.targetFile, [...grouped, step]);
  }
  if (filesByPath.size !== stepsByPath.size) {
    throw new Error("Implementation file inputs must exactly match the authorized target-file set");
  }

  const changes: RegulatoryImplementationFileChange[] = [];
  for (const [targetFile, steps] of [...stepsByPath.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const source = filesByPath.get(targetFile);
    if (source === undefined) throw new Error(`Missing authorized implementation file: ${targetFile}`);
    const content = applyStepsToFile(source, steps);
    if (content === source) throw new Error(`Implementation produced no file change: ${targetFile}`);
    changes.push({
      path: targetFile,
      beforeChecksum: sha256(source),
      afterChecksum: sha256(content),
      changedRegistryIds: steps.map((step) => step.id).sort(),
      content,
    });
  }

  const payload: Omit<RegulatoryImplementationPullRequestBundle, "bundleChecksum"> = {
    schemaVersion: 1,
    bundleId: `regulatory-implementation-pr:${plan.sourceId}:${plan.planChecksum}`,
    planId: plan.planId,
    planChecksum: plan.planChecksum,
    baseCommitSha: plan.baseCommitSha,
    targetBranch: plan.targetBranch,
    commitMessage: `feat(regulatory): implement approved ${plan.sourceId} registry update`,
    pullRequestTitle: `Implement approved ${plan.sourceId} regulatory registry update`,
    pullRequestBody: buildPullRequestBody(plan),
    files: changes,
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
  if (errors.length > 0) throw new Error(`Built implementation PR bundle failed validation: ${errors.join("; ")}`);
  const frozen = deepFreeze(bundle);
  IMPLEMENTATION_BUNDLES.add(frozen as object);
  return frozen;
}

export function validateRegulatoryImplementationPullRequestBundle(
  bundle: RegulatoryImplementationPullRequestBundle,
  plan?: RegulatoryRegistryImplementationPlan
): string[] {
  const errors: string[] = [];
  if (bundle.schemaVersion !== 1) errors.push("Implementation PR bundle schema version is invalid");
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
    if (!/^sha256:[a-f0-9]{64}$/.test(file.beforeChecksum) || !/^sha256:[a-f0-9]{64}$/.test(file.afterChecksum)) {
      errors.push(`Implementation PR bundle file checksum is invalid: ${file.path}`);
    }
    if (file.beforeChecksum === file.afterChecksum || file.afterChecksum !== sha256(file.content)) {
      errors.push(`Implementation PR bundle file content does not match its checksum: ${file.path}`);
    }
    if (file.changedRegistryIds.length === 0 || new Set(file.changedRegistryIds).size !== file.changedRegistryIds.length) {
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
