import { getApprovedRegulatoryEvidenceSnapshot } from "./approved-evidence-registry";
import {
  validateRegulatoryCitationPackage,
  type RegulatoryCitationPackage,
} from "./citation-package";
import {
  extractRegulatoryCitationPreview,
  type ExtractedRegulatoryCitation,
} from "./clause-extraction";
import { getRegulatorySnapshotValidationErrors } from "./ingestion";
import {
  fingerprintRegulatoryRegistryValue,
  getRegisteredCitationTemplate,
  getRegisteredHistoricalGroundingPolicy,
  listRegisteredRegulatoryMappings,
  validateRegulatoryRegistryIntegrity,
} from "./registry-integrity";
import type { RegulatorySourceSnapshot } from "./types";
import {
  isVerifiedStoredRegulatoryUpdatePair,
  type VerifiedStoredRegulatoryUpdatePair,
} from "./verified-stored-update-pair";

export type RegulatoryUpdateDifferenceClassification =
  | "unchanged"
  | "transport-only"
  | "metadata-only"
  | "content-changed";

export type RegulatoryUpdateIntakeStatus =
  | "refused"
  | "no-change"
  | "observation-only"
  | "proposal-prepared"
  | "manual-review-required";

export type RegulatoryUpdateTrustSource =
  | "benchmark-approved-evidence"
  | "verified-stored-pair";

export interface RegulatoryLineDifference {
  previousStartLine: number;
  previousEndLine: number;
  nextStartLine: number;
  nextEndLine: number;
  previousChangedLineCount: number;
  nextChangedLineCount: number;
  commonPrefixLineCount: number;
  commonSuffixLineCount: number;
  previousExcerpt: string[];
  nextExcerpt: string[];
}

export interface RegulatorySourceDifference {
  classification: RegulatoryUpdateDifferenceClassification;
  normalizedTextChanged: boolean;
  rawPayloadChanged: boolean;
  regulatoryMetadataChanges: string[];
  transportMetadataChanges: string[];
  previousChecksum: string;
  nextChecksum: string;
  previousRawChecksum: string;
  nextRawChecksum: string;
  lineDifference?: RegulatoryLineDifference;
}

export interface RegulatoryCitationPreviewImpact {
  locator: string;
  status: "stable" | "anchor-drift";
  changedFields: string[];
  previousExcerptChecksum: string;
  nextExcerptChecksum?: string;
  nextCitation?: ExtractedRegulatoryCitation;
  error?: string;
}

export interface RegulatoryRegistryUpdateImpact {
  mappingId: string;
  mappingFingerprint: string;
  historicalPolicyFingerprint: string;
  citationTemplateFingerprint: string;
  citationImpacts: RegulatoryCitationPreviewImpact[];
  anchorDrift: boolean;
}

export interface RegulatoryCitationTemplateTransitionDraft {
  kind: "citation-template";
  id: string;
  beforeFingerprint: string;
  afterFingerprint: string;
  afterValue: RegulatoryCitationPackage;
  changedLocators: string[];
  officialEvidence: {
    sourceId: string;
    snapshotId: string;
    citation: string;
    checksum: string;
  };
  reason: string;
  benchmarkImpact: string[];
  regressionPlan: string[];
}

export interface RegulatoryUpdateChangeProposal {
  proposalId: string;
  createdAt: string;
  requestedBy: string;
  sourceId: string;
  baselineSnapshotId: string;
  candidateSnapshotId: string;
  sourceReviewStatus: RegulatorySourceSnapshot["reviewStatus"];
  trustSource: RegulatoryUpdateTrustSource;
  candidateRetainedAsApprovedEvidence: boolean;
  readiness:
    | "awaiting-snapshot-approval"
    | "awaiting-approved-evidence-registration"
    | "ready-for-controlled-change-set-draft"
    | "manual-redesign-required";
  transitions: RegulatoryCitationTemplateTransitionDraft[];
  registryKindsRequiringHumanReview: Array<"mapping" | "historical-policy">;
  reviewQuestions: string[];
  applicationStatus: "not-applied";
  customerFacingStatus: "benchmark-only";
}

export interface RegulatoryUpdateIntakeRequest {
  baseline: RegulatorySourceSnapshot;
  candidate: RegulatorySourceSnapshot;
  requestedBy: string;
  createdAt: string;
}

export interface RegulatoryUpdateIntakeResult {
  status: RegulatoryUpdateIntakeStatus;
  sourceId: string;
  difference: RegulatorySourceDifference;
  impacts: RegulatoryRegistryUpdateImpact[];
  proposal?: RegulatoryUpdateChangeProposal;
  refusalReasons: string[];
  reviewNotes: string[];
  customerFacingStatus: "benchmark-only";
}

interface TemplateTransitionBuildResult {
  transitions: RegulatoryCitationTemplateTransitionDraft[];
  errors: string[];
}

interface RegulatoryUpdateTrustContext {
  trustSource: RegulatoryUpdateTrustSource;
  baselineTrusted: boolean;
  candidateRetainedAsApprovedEvidence: boolean;
}

const METADATA_FIELDS: Array<keyof RegulatorySourceSnapshot> = [
  "citation",
  "canonicalTitle",
  "canonicalUrl",
  "versionIdentifier",
  "publicationDate",
  "effectiveDate",
  "expirationOrSupersededDate",
  "historicalStatus",
  "contentFormat",
  "normalizationVersion",
];

const CURRENT_UPDATE_STATUSES = new Set<RegulatorySourceSnapshot["historicalStatus"]>([
  "current",
  "interim",
  "corrected",
]);

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

function isIsoInstant(value: string): boolean {
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value;
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function sameValue(left: unknown, right: unknown): boolean {
  return fingerprintRegulatoryRegistryValue(left) === fingerprintRegulatoryRegistryValue(right);
}

function matchesRetainedApprovedEvidence(snapshot: RegulatorySourceSnapshot): boolean {
  const retained = getApprovedRegulatoryEvidenceSnapshot(
    snapshot.sourceId,
    snapshot.snapshotId
  );
  return Boolean(
    retained &&
      fingerprintRegulatoryRegistryValue(retained) ===
        fingerprintRegulatoryRegistryValue(snapshot)
  );
}

function benchmarkTrustContext(
  request: RegulatoryUpdateIntakeRequest
): RegulatoryUpdateTrustContext {
  return {
    trustSource: "benchmark-approved-evidence",
    baselineTrusted: matchesRetainedApprovedEvidence(request.baseline),
    candidateRetainedAsApprovedEvidence: matchesRetainedApprovedEvidence(
      request.candidate
    ),
  };
}

function changedFieldNames(
  previous: Record<string, unknown>,
  next: Record<string, unknown>,
  fields: readonly string[]
): string[] {
  return fields.filter((field) => !sameValue(previous[field], next[field]));
}

function boundedExcerpt(
  lines: readonly string[],
  changedStartLine: number,
  changedEndLine: number,
  contextLines = 2,
  maximumLines = 12
): string[] {
  if (lines.length === 0) return [];
  const start = Math.max(1, changedStartLine - contextLines);
  const end = Math.min(lines.length, changedEndLine + contextLines);
  const selected = lines.slice(start - 1, end);
  if (selected.length <= maximumLines) return selected;
  const headCount = Math.ceil((maximumLines - 1) / 2);
  const tailCount = maximumLines - headCount - 1;
  return [
    ...selected.slice(0, headCount),
    `… ${selected.length - headCount - tailCount} lines omitted …`,
    ...selected.slice(-tailCount),
  ];
}

function lineDifference(
  previousText: string,
  nextText: string
): RegulatoryLineDifference | undefined {
  if (previousText === nextText) return undefined;
  const previousLines = previousText.split("\n");
  const nextLines = nextText.split("\n");
  const sharedLength = Math.min(previousLines.length, nextLines.length);

  let prefix = 0;
  while (prefix < sharedLength && previousLines[prefix] === nextLines[prefix]) prefix++;

  let suffix = 0;
  while (
    suffix < previousLines.length - prefix &&
    suffix < nextLines.length - prefix &&
    previousLines[previousLines.length - 1 - suffix] ===
      nextLines[nextLines.length - 1 - suffix]
  ) {
    suffix++;
  }

  const previousStartLine = prefix + 1;
  const nextStartLine = prefix + 1;
  const previousEndLine = Math.max(previousStartLine - 1, previousLines.length - suffix);
  const nextEndLine = Math.max(nextStartLine - 1, nextLines.length - suffix);
  const previousChangedLineCount = Math.max(0, previousEndLine - previousStartLine + 1);
  const nextChangedLineCount = Math.max(0, nextEndLine - nextStartLine + 1);

  return {
    previousStartLine,
    previousEndLine,
    nextStartLine,
    nextEndLine,
    previousChangedLineCount,
    nextChangedLineCount,
    commonPrefixLineCount: prefix,
    commonSuffixLineCount: suffix,
    previousExcerpt: boundedExcerpt(
      previousLines,
      previousStartLine,
      Math.max(previousStartLine, previousEndLine)
    ),
    nextExcerpt: boundedExcerpt(
      nextLines,
      nextStartLine,
      Math.max(nextStartLine, nextEndLine)
    ),
  };
}

export function compareRegulatoryUpdateCandidate(
  baseline: RegulatorySourceSnapshot,
  candidate: RegulatorySourceSnapshot
): RegulatorySourceDifference {
  const regulatoryMetadataChanges = METADATA_FIELDS.filter(
    (field) => !sameValue(baseline[field], candidate[field])
  );
  const transportMetadataChanges = changedFieldNames(
    baseline.retrieval as unknown as Record<string, unknown>,
    candidate.retrieval as unknown as Record<string, unknown>,
    [
      "requestedUrl",
      "finalUrl",
      "status",
      "contentType",
      "rawByteLength",
      "redirectChain",
      "etag",
      "lastModified",
    ]
  );
  const normalizedTextChanged = baseline.checksum !== candidate.checksum;
  const rawPayloadChanged = baseline.rawChecksum !== candidate.rawChecksum;

  const classification: RegulatoryUpdateDifferenceClassification = normalizedTextChanged
    ? "content-changed"
    : regulatoryMetadataChanges.length > 0
      ? "metadata-only"
      : rawPayloadChanged || transportMetadataChanges.length > 0
        ? "transport-only"
        : "unchanged";

  return {
    classification,
    normalizedTextChanged,
    rawPayloadChanged,
    regulatoryMetadataChanges,
    transportMetadataChanges,
    previousChecksum: baseline.checksum,
    nextChecksum: candidate.checksum,
    previousRawChecksum: baseline.rawChecksum,
    nextRawChecksum: candidate.rawChecksum,
    lineDifference: normalizedTextChanged
      ? lineDifference(baseline.text, candidate.text)
      : undefined,
  };
}

function citationChangedFields(
  previous: ExtractedRegulatoryCitation,
  next: ExtractedRegulatoryCitation
): string[] {
  const fields: Array<keyof ExtractedRegulatoryCitation> = [
    "snapshotId",
    "citation",
    "title",
    "canonicalUrl",
    "versionIdentifier",
    "effectiveDate",
    "retrievedAt",
    "excerpt",
    "checksum",
    "locator",
    "excerptChecksum",
    "startLine",
    "endLine",
    "extractionStartAnchor",
    "extractionEndAnchor",
    "extractionRequiredAnchors",
    "extractionMaxCharacters",
  ];
  return fields.filter((field) => !sameValue(previous[field], next[field]));
}

function buildRegistryImpacts(
  candidate: RegulatorySourceSnapshot
): RegulatoryRegistryUpdateImpact[] {
  const impacts: RegulatoryRegistryUpdateImpact[] = [];

  for (const mappingEntry of listRegisteredRegulatoryMappings()) {
    if (
      !mappingEntry.value.sourceComparisons.some(
        (comparison) => comparison.sourceId === candidate.sourceId
      )
    ) {
      continue;
    }

    const policyEntry = getRegisteredHistoricalGroundingPolicy(mappingEntry.id);
    const templateEntry = getRegisteredCitationTemplate(mappingEntry.id);
    if (!policyEntry || !templateEntry) {
      impacts.push({
        mappingId: mappingEntry.id,
        mappingFingerprint: mappingEntry.fingerprint,
        historicalPolicyFingerprint: policyEntry?.fingerprint ?? "missing",
        citationTemplateFingerprint: templateEntry?.fingerprint ?? "missing",
        citationImpacts: [],
        anchorDrift: true,
      });
      continue;
    }

    const citations = templateEntry.value.citations.filter(
      (citation) => citation.sourceId === candidate.sourceId
    );
    const citationImpacts: RegulatoryCitationPreviewImpact[] = citations.map(
      (citation) => {
        try {
          const nextCitation = extractRegulatoryCitationPreview(candidate, {
            sourceId: citation.sourceId,
            locator: citation.locator,
            startAnchor: citation.extractionStartAnchor,
            endAnchor: citation.extractionEndAnchor,
            requiredAnchors: [...citation.extractionRequiredAnchors],
            maxCharacters: citation.extractionMaxCharacters,
          });
          return {
            locator: citation.locator,
            status: "stable" as const,
            changedFields: citationChangedFields(citation, nextCitation),
            previousExcerptChecksum: citation.excerptChecksum,
            nextExcerptChecksum: nextCitation.excerptChecksum,
            nextCitation,
          };
        } catch (error) {
          return {
            locator: citation.locator,
            status: "anchor-drift" as const,
            changedFields: [],
            previousExcerptChecksum: citation.excerptChecksum,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      }
    );

    impacts.push({
      mappingId: mappingEntry.id,
      mappingFingerprint: mappingEntry.fingerprint,
      historicalPolicyFingerprint: policyEntry.fingerprint,
      citationTemplateFingerprint: templateEntry.fingerprint,
      citationImpacts,
      anchorDrift:
        citations.length === 0 ||
        citationImpacts.some((impact) => impact.status === "anchor-drift"),
    });
  }

  return impacts;
}

function buildTemplateTransitions(
  candidate: RegulatorySourceSnapshot,
  impacts: readonly RegulatoryRegistryUpdateImpact[]
): TemplateTransitionBuildResult {
  const transitions: RegulatoryCitationTemplateTransitionDraft[] = [];
  const errors: string[] = [];

  for (const impact of impacts) {
    if (impact.anchorDrift) continue;
    const templateEntry = getRegisteredCitationTemplate(impact.mappingId);
    if (!templateEntry) {
      errors.push(`${impact.mappingId}: registered citation template is unavailable`);
      continue;
    }
    const previewsByLocator = new Map(
      impact.citationImpacts
        .filter(
          (citationImpact): citationImpact is RegulatoryCitationPreviewImpact & {
            nextCitation: ExtractedRegulatoryCitation;
          } =>
            citationImpact.status === "stable" &&
            Boolean(citationImpact.nextCitation)
        )
        .map((citationImpact) => [citationImpact.locator, citationImpact.nextCitation])
    );

    const afterValue = deepClone(templateEntry.value) as RegulatoryCitationPackage;
    afterValue.citations = afterValue.citations.map((citation) =>
      citation.sourceId === candidate.sourceId
        ? previewsByLocator.get(citation.locator) ?? citation
        : citation
    );
    const changedLocators = impact.citationImpacts
      .filter((citationImpact) => citationImpact.changedFields.length > 0)
      .map((citationImpact) => citationImpact.locator);
    const afterFingerprint = fingerprintRegulatoryRegistryValue(afterValue);
    if (afterFingerprint === templateEntry.fingerprint) continue;

    const packageErrors = validateRegulatoryCitationPackage(afterValue);
    if (packageErrors.length > 0) {
      errors.push(
        ...packageErrors.map(
          (error) =>
            `${impact.mappingId}: proposed citation template is invalid: ${error}`
        )
      );
      continue;
    }

    transitions.push({
      kind: "citation-template",
      id: impact.mappingId,
      beforeFingerprint: templateEntry.fingerprint,
      afterFingerprint,
      afterValue,
      changedLocators,
      officialEvidence: {
        sourceId: candidate.sourceId,
        snapshotId: candidate.snapshotId,
        citation: candidate.citation,
        checksum: candidate.checksum,
      },
      reason:
        "Refresh the controlled citation template from a reviewed official-source update candidate without applying it automatically.",
      benchmarkImpact: [
        `Re-run applicability, historical selection, and exact citation regeneration for ${impact.mappingId}.`,
        `Review whether the source change alters the mapping conclusion or governing-date policy for ${impact.mappingId}.`,
      ],
      regressionPlan: [
        `Preserve exact contract evidence and prohibited-inference guards for ${impact.mappingId}.`,
        `Add positive and negative anchor regressions for every changed locator: ${changedLocators.join(", ") || "metadata-only refresh"}.`,
      ],
    });
  }

  return { transitions, errors: unique(errors) };
}

function validateRequest(
  request: RegulatoryUpdateIntakeRequest,
  trust: RegulatoryUpdateTrustContext
): string[] {
  const errors: string[] = [...validateRegulatoryRegistryIntegrity()];
  if (!request.requestedBy.trim()) {
    errors.push("Update-intake requester must not be blank");
  }
  if (!isIsoInstant(request.createdAt)) {
    errors.push("Update-intake createdAt must be an ISO timestamp");
  }
  if (request.baseline.sourceId !== request.candidate.sourceId) {
    errors.push(
      `Update candidate source mismatch: baseline ${request.baseline.sourceId}, candidate ${request.candidate.sourceId}`
    );
  }
  if (request.baseline.snapshotId === request.candidate.snapshotId) {
    errors.push("Update candidate must have a distinct snapshot ID");
  }
  if (!request.candidate.snapshotId.startsWith(`${request.candidate.sourceId}:`)) {
    errors.push("Update candidate snapshot ID must begin with its source ID");
  }
  if (request.baseline.reviewStatus !== "approved") {
    errors.push("Update baseline must be an approved retained snapshot");
  } else if (!trust.baselineTrusted) {
    errors.push(
      trust.trustSource === "verified-stored-pair"
        ? "Update baseline is not verified by the controlled snapshot store"
        : "Update baseline does not match the immutable retained approved-evidence registry"
    );
  }
  if (
    request.candidate.reviewStatus !== "pending" &&
    request.candidate.reviewStatus !== "approved"
  ) {
    errors.push(
      `Unsupported regulatory update candidate review status: ${String(request.candidate.reviewStatus)}`
    );
  }
  if (!CURRENT_UPDATE_STATUSES.has(request.candidate.historicalStatus)) {
    errors.push(
      `Historical status ${request.candidate.historicalStatus} cannot update the current controlled registry`
    );
  }
  if (
    request.candidate.reviewStatus === "pending" &&
    (request.candidate.reviewedBy !== undefined ||
      request.candidate.reviewedAt !== undefined ||
      request.candidate.reviewNotes !== undefined)
  ) {
    errors.push("Pending update candidates must not contain final reviewer provenance");
  }
  const baselineErrors = getRegulatorySnapshotValidationErrors(request.baseline);
  const candidateErrors = getRegulatorySnapshotValidationErrors(request.candidate);
  errors.push(...baselineErrors.map((error) => `Baseline snapshot: ${error}`));
  errors.push(...candidateErrors.map((error) => `Candidate snapshot: ${error}`));

  const baselineTime = new Date(request.baseline.retrievedAt).getTime();
  const candidateTime = new Date(request.candidate.retrievedAt).getTime();
  const createdTime = new Date(request.createdAt).getTime();
  if (
    !Number.isFinite(baselineTime) ||
    !Number.isFinite(candidateTime) ||
    candidateTime <= baselineTime
  ) {
    errors.push("Update candidate must be retrieved after the approved baseline");
  }
  if (
    Number.isFinite(candidateTime) &&
    Number.isFinite(createdTime) &&
    createdTime < candidateTime
  ) {
    errors.push("Update intake cannot be created before the candidate was retrieved");
  }
  if (request.candidate.reviewStatus === "approved") {
    if (!request.candidate.reviewedAt) {
      errors.push("Approved candidate requires a review timestamp");
    } else {
      const reviewedTime = new Date(request.candidate.reviewedAt).getTime();
      if (
        !Number.isFinite(reviewedTime) ||
        reviewedTime < candidateTime ||
        reviewedTime > createdTime
      ) {
        errors.push(
          "Approved candidate review timestamp must follow retrieval and not exceed intake creation"
        );
      }
    }
  }
  if (
    trust.candidateRetainedAsApprovedEvidence &&
    request.candidate.reviewStatus !== "approved"
  ) {
    errors.push("A pending update candidate cannot be retained as approved evidence");
  }
  return unique(errors);
}

function emptyDifference(
  baseline: RegulatorySourceSnapshot,
  candidate: RegulatorySourceSnapshot
): RegulatorySourceDifference {
  return {
    classification: "unchanged",
    normalizedTextChanged: false,
    rawPayloadChanged: baseline.rawChecksum !== candidate.rawChecksum,
    regulatoryMetadataChanges: [],
    transportMetadataChanges: [],
    previousChecksum: baseline.checksum,
    nextChecksum: candidate.checksum,
    previousRawChecksum: baseline.rawChecksum,
    nextRawChecksum: candidate.rawChecksum,
  };
}

function prepareRegulatoryUpdateIntakeCore(
  request: RegulatoryUpdateIntakeRequest,
  trust: RegulatoryUpdateTrustContext
): RegulatoryUpdateIntakeResult {
  const refusalReasons = validateRequest(request, trust);
  if (refusalReasons.length > 0) {
    return {
      status: "refused",
      sourceId: request.candidate.sourceId,
      difference: emptyDifference(request.baseline, request.candidate),
      impacts: [],
      refusalReasons,
      reviewNotes: [
        "No registry proposal was prepared because the official-source intake failed validation.",
      ],
      customerFacingStatus: "benchmark-only",
    };
  }

  const difference = compareRegulatoryUpdateCandidate(
    request.baseline,
    request.candidate
  );
  const impacts = buildRegistryImpacts(request.candidate);

  if (difference.classification === "unchanged") {
    return {
      status: "no-change",
      sourceId: request.candidate.sourceId,
      difference,
      impacts,
      refusalReasons: [],
      reviewNotes: [
        "The candidate matches the approved baseline in normalized text, raw payload, regulatory metadata, and retained transport metadata.",
        "No registry transition is warranted.",
      ],
      customerFacingStatus: "benchmark-only",
    };
  }

  if (difference.classification === "transport-only") {
    return {
      status: "observation-only",
      sourceId: request.candidate.sourceId,
      difference,
      impacts,
      refusalReasons: [],
      reviewNotes: [
        "The normalized official text and regulatory metadata are unchanged.",
        "Retain the retrieval observation, but do not create a regulatory registry transition.",
      ],
      customerFacingStatus: "benchmark-only",
    };
  }

  const anchorDrift = impacts.some((impact) => impact.anchorDrift);
  const transitionBuild = anchorDrift
    ? { transitions: [], errors: [] }
    : buildTemplateTransitions(request.candidate, impacts);
  const manualReviewRequired = anchorDrift || transitionBuild.errors.length > 0;
  const candidateRetainedAsApprovedEvidence =
    trust.candidateRetainedAsApprovedEvidence;
  const readiness = manualReviewRequired
    ? "manual-redesign-required"
    : request.candidate.reviewStatus !== "approved"
      ? "awaiting-snapshot-approval"
      : !candidateRetainedAsApprovedEvidence
        ? "awaiting-approved-evidence-registration"
        : "ready-for-controlled-change-set-draft";
  const proposal: RegulatoryUpdateChangeProposal = {
    proposalId: `regulatory-update:${request.candidate.sourceId}:${request.candidate.snapshotId}`,
    createdAt: request.createdAt,
    requestedBy: request.requestedBy.trim(),
    sourceId: request.candidate.sourceId,
    baselineSnapshotId: request.baseline.snapshotId,
    candidateSnapshotId: request.candidate.snapshotId,
    sourceReviewStatus: request.candidate.reviewStatus,
    trustSource: trust.trustSource,
    candidateRetainedAsApprovedEvidence,
    readiness,
    transitions: transitionBuild.transitions,
    registryKindsRequiringHumanReview: ["mapping", "historical-policy"],
    reviewQuestions: [
      "Does the official-source change alter the existing applicability conclusion or only its citation passage?",
      "Does the effective date or version history require a governing-date policy change?",
      "Are additional positive, negative, historical, or cross-format benchmark fixtures required?",
      "Has an independent reviewer approved and retained the source snapshot and every proposed registry transition?",
    ],
    applicationStatus: "not-applied",
    customerFacingStatus: "benchmark-only",
  };

  if (manualReviewRequired) {
    return {
      status: "manual-review-required",
      sourceId: request.candidate.sourceId,
      difference,
      impacts,
      proposal,
      refusalReasons: unique([
        ...transitionBuild.errors,
        ...impacts.flatMap((impact) =>
          impact.citationImpacts
            .filter((citationImpact) => citationImpact.status === "anchor-drift")
            .map(
              (citationImpact) =>
                `${impact.mappingId}/${citationImpact.locator}: ${citationImpact.error ?? "registered citation anchor drift"}`
            )
        ),
      ]),
      reviewNotes: [
        "At least one registered citation could not be deterministically regenerated or produced an invalid proposed template.",
        "No usable citation-template transition was released; a reviewer must redesign and reapprove the affected extraction or package.",
      ],
      customerFacingStatus: "benchmark-only",
    };
  }

  if (impacts.length === 0 || transitionBuild.transitions.length === 0) {
    return {
      status: "observation-only",
      sourceId: request.candidate.sourceId,
      difference,
      impacts,
      proposal,
      refusalReasons: [],
      reviewNotes: [
        "The official source changed, but no registered citation template requires an automatic draft transition.",
        "Retain and review the candidate snapshot before deciding whether new applicability coverage is needed.",
      ],
      customerFacingStatus: "benchmark-only",
    };
  }

  return {
    status: "proposal-prepared",
    sourceId: request.candidate.sourceId,
    difference,
    impacts,
    proposal,
    refusalReasons: [],
    reviewNotes: [
      "A benchmark-only citation-template transition draft was prepared from deterministic extraction.",
      "The proposal is not applied and cannot become customer-facing without approved-evidence retention, controlled change-set validation, complete benchmarks, and independent review.",
    ],
    customerFacingStatus: "benchmark-only",
  };
}

export function prepareRegulatoryUpdateIntake(
  request: RegulatoryUpdateIntakeRequest
): RegulatoryUpdateIntakeResult {
  return prepareRegulatoryUpdateIntakeCore(request, benchmarkTrustContext(request));
}

export function prepareVerifiedStoredRegulatoryUpdateIntake(
  pair: VerifiedStoredRegulatoryUpdatePair,
  requestedBy: string,
  createdAt: string
): RegulatoryUpdateIntakeResult {
  if (!isVerifiedStoredRegulatoryUpdatePair(pair)) {
    throw new Error(
      "Verified stored regulatory update intake requires an opaque pair loaded from the controlled snapshot store"
    );
  }
  return prepareRegulatoryUpdateIntakeCore(
    {
      baseline: pair.baseline as RegulatorySourceSnapshot,
      candidate: pair.candidate as RegulatorySourceSnapshot,
      requestedBy,
      createdAt,
    },
    {
      trustSource: "verified-stored-pair",
      baselineTrusted: true,
      candidateRetainedAsApprovedEvidence:
        pair.candidateRetainedAsApprovedEvidence,
    }
  );
}
