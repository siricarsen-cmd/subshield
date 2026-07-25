import type { RegulatoryApplicabilityMapping } from "./applicability";
import {
  buildRegulatoryCitationPackage,
  validateRegulatoryCitationPackage,
  type RegulatoryCitationPackage,
  type RegulatoryCitationPackageRequest,
} from "./citation-package";
import type { RegulatoryExcerptRequest } from "./clause-extraction";
import {
  orchestrateHistoricalRegulatoryGrounding,
  type HistoricalGroundingOrchestrationRequest,
  type HistoricalGroundingOrchestrationResult,
} from "./historical-grounding-orchestration";
import { REGULATORY_FULL_BENCHMARK_CITATION_PACKAGES } from "./source-coverage-citation-packages";
import type { RegulatorySourceSnapshot } from "./types";

export type HistoricalCitationRegenerationStatus =
  | "ready"
  | "orchestration-unresolved"
  | "registered-template-missing"
  | "registered-template-invalid"
  | "anchor-drift"
  | "regenerated-package-invalid"
  | "registered-excerpt-mismatch";

export interface HistoricalCitationRegenerationRequest
  extends HistoricalGroundingOrchestrationRequest {}

export interface HistoricalCitationRegenerationResult {
  status: HistoricalCitationRegenerationStatus;
  mappingId: string;
  registeredTemplatePackageId?: string;
  orchestration: HistoricalGroundingOrchestrationResult;
  regeneratedPackage?: RegulatoryCitationPackage;
  selectedSnapshotIds: string[];
  refusalReasons: string[];
  customerFacingStatus: "benchmark-only";
}

function uniqueNonblank(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function result(
  request: HistoricalCitationRegenerationRequest,
  orchestration: HistoricalGroundingOrchestrationResult,
  status: HistoricalCitationRegenerationStatus,
  refusalReasons: readonly string[],
  registeredTemplatePackageId?: string,
  regeneratedPackage?: RegulatoryCitationPackage
): HistoricalCitationRegenerationResult {
  return {
    status,
    mappingId: request.mapping.mappingId,
    registeredTemplatePackageId,
    orchestration,
    regeneratedPackage,
    selectedSnapshotIds: [...orchestration.selectedSnapshotIds],
    refusalReasons: uniqueNonblank(refusalReasons),
    customerFacingStatus: "benchmark-only",
  };
}

function registeredTemplateForMapping(
  mappingId: string
): RegulatoryCitationPackage | undefined {
  const candidates = REGULATORY_FULL_BENCHMARK_CITATION_PACKAGES.filter(
    (citationPackage) => citationPackage.mappingId === mappingId
  );
  return candidates.length === 1 ? candidates[0] : undefined;
}

function excerptRequestFromRegisteredCitation(
  citation: RegulatoryCitationPackage["citations"][number]
): RegulatoryExcerptRequest {
  if (
    !citation.extractionStartAnchor?.trim() ||
    !citation.extractionEndAnchor?.trim() ||
    !Array.isArray(citation.extractionRequiredAnchors) ||
    citation.extractionRequiredAnchors.length === 0 ||
    citation.extractionRequiredAnchors.some((anchor) => !anchor.trim()) ||
    !Number.isInteger(citation.extractionMaxCharacters) ||
    citation.extractionMaxCharacters < 80
  ) {
    throw new Error(
      `Registered citation does not retain a complete extraction request: ${citation.sourceId}/${citation.locator}`
    );
  }
  return {
    sourceId: citation.sourceId,
    locator: citation.locator,
    startAnchor: citation.extractionStartAnchor,
    endAnchor: citation.extractionEndAnchor,
    requiredAnchors: [...citation.extractionRequiredAnchors],
    maxCharacters: citation.extractionMaxCharacters,
  };
}

export function registeredHistoricalCitationRequestForMapping(
  mapping: RegulatoryApplicabilityMapping
): RegulatoryCitationPackageRequest | undefined {
  const template = registeredTemplateForMapping(mapping.mappingId);
  if (!template) return undefined;
  return {
    packageId: `${mapping.mappingId}-historical-selected-snapshot-regenerated`,
    mapping,
    excerpts: template.citations.map(excerptRequestFromRegisteredCitation),
  };
}

function selectedSnapshotsFromOrchestration(
  orchestration: HistoricalGroundingOrchestrationResult
): Readonly<Record<string, RegulatorySourceSnapshot>> {
  const entries: Array<[string, RegulatorySourceSnapshot]> = [];
  for (const decision of orchestration.sourceDecisions) {
    const snapshot = decision.versionSelection?.selectedSnapshot;
    if (decision.status === "selected" && snapshot) {
      entries.push([decision.sourceId, snapshot]);
    }
  }
  return Object.fromEntries(entries);
}

function registeredTemplateErrors(
  mapping: RegulatoryApplicabilityMapping,
  template: RegulatoryCitationPackage,
  request: RegulatoryCitationPackageRequest
): string[] {
  const errors: string[] = [];
  if (template.customerFacingStatus !== "benchmark-only") {
    errors.push("Registered citation template is not benchmark-only");
  }
  if (template.mappingId !== mapping.mappingId) {
    errors.push(
      `Registered citation template mapping mismatch: expected ${mapping.mappingId}, observed ${template.mappingId}`
    );
  }
  const declaredSources = new Set(
    mapping.sourceComparisons.map((comparison) => comparison.sourceId)
  );
  const requestedSources = new Set(request.excerpts.map((excerpt) => excerpt.sourceId));
  for (const sourceId of declaredSources) {
    if (!requestedSources.has(sourceId)) {
      errors.push(`Registered citation template omits declared source: ${sourceId}`);
    }
  }
  for (const sourceId of requestedSources) {
    if (!declaredSources.has(sourceId)) {
      errors.push(`Registered citation template adds undeclared source: ${sourceId}`);
    }
  }
  const keys = request.excerpts.map(
    (excerpt) => `${excerpt.sourceId}:${excerpt.locator}`
  );
  if (new Set(keys).size !== keys.length) {
    errors.push("Registered citation template contains duplicate source/locator requests");
  }
  return errors;
}

function registeredExcerptMismatchReasons(
  supplied: RegulatoryCitationPackage,
  regenerated: RegulatoryCitationPackage
): string[] {
  const reasons: string[] = [];
  const suppliedByKey = new Map(
    supplied.citations.map((citation) => [
      `${citation.sourceId}:${citation.locator}`,
      citation,
    ])
  );
  const regeneratedKeys = new Set<string>();

  if (supplied.citations.length !== regenerated.citations.length) {
    reasons.push(
      `Supplied citation count differs from the registered regenerated package: expected ${regenerated.citations.length}, observed ${supplied.citations.length}`
    );
  }

  for (const expected of regenerated.citations) {
    const key = `${expected.sourceId}:${expected.locator}`;
    regeneratedKeys.add(key);
    const observed = suppliedByKey.get(key);
    if (!observed) {
      reasons.push(`Supplied package lacks registered excerpt request: ${key}`);
      continue;
    }
    const fields: Array<[string, unknown, unknown]> = [
      ["excerpt", expected.excerpt, observed.excerpt],
      ["excerpt checksum", expected.excerptChecksum, observed.excerptChecksum],
      ["start line", expected.startLine, observed.startLine],
      ["end line", expected.endLine, observed.endLine],
      ["start anchor", expected.extractionStartAnchor, observed.extractionStartAnchor],
      ["end anchor", expected.extractionEndAnchor, observed.extractionEndAnchor],
      [
        "required anchors",
        JSON.stringify(expected.extractionRequiredAnchors),
        JSON.stringify(observed.extractionRequiredAnchors),
      ],
      [
        "maximum characters",
        expected.extractionMaxCharacters,
        observed.extractionMaxCharacters,
      ],
    ];
    for (const [label, expectedValue, observedValue] of fields) {
      if (observedValue !== expectedValue) {
        reasons.push(
          `Supplied ${label} differs from the registered regenerated excerpt for ${key}`
        );
      }
    }
  }

  for (const citation of supplied.citations) {
    const key = `${citation.sourceId}:${citation.locator}`;
    if (!regeneratedKeys.has(key)) {
      reasons.push(`Supplied package contains an unregistered excerpt request: ${key}`);
    }
  }
  return uniqueNonblank(reasons);
}

function isAnchorDriftError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /anchor|excerpt end|excerpt exceeds|suspiciously short/i.test(message);
}

export function regenerateHistoricalCitationPackage(
  request: HistoricalCitationRegenerationRequest
): HistoricalCitationRegenerationResult {
  const orchestration = orchestrateHistoricalRegulatoryGrounding(request);
  if (orchestration.status !== "ready") {
    return result(
      request,
      orchestration,
      "orchestration-unresolved",
      orchestration.refusalReasons
    );
  }

  const template = registeredTemplateForMapping(request.mapping.mappingId);
  if (!template) {
    return result(
      request,
      orchestration,
      "registered-template-missing",
      [`Exactly one registered citation template is required for ${request.mapping.mappingId}`]
    );
  }

  let registeredRequest: RegulatoryCitationPackageRequest;
  try {
    registeredRequest = {
      packageId: `${request.mapping.mappingId}-historical-selected-snapshot-regenerated`,
      mapping: request.mapping,
      excerpts: template.citations.map(excerptRequestFromRegisteredCitation),
    };
  } catch (error) {
    return result(
      request,
      orchestration,
      "registered-template-invalid",
      [error instanceof Error ? error.message : String(error)],
      template.packageId
    );
  }

  const templateErrors = registeredTemplateErrors(
    request.mapping,
    template,
    registeredRequest
  );
  if (templateErrors.length > 0) {
    return result(
      request,
      orchestration,
      "registered-template-invalid",
      templateErrors,
      template.packageId
    );
  }

  const selectedSnapshots = selectedSnapshotsFromOrchestration(orchestration);
  let regeneratedPackage: RegulatoryCitationPackage;
  try {
    regeneratedPackage = buildRegulatoryCitationPackage(
      registeredRequest,
      selectedSnapshots
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return result(
      request,
      orchestration,
      isAnchorDriftError(error) ? "anchor-drift" : "registered-template-invalid",
      [message],
      template.packageId
    );
  }

  const regeneratedErrors = validateRegulatoryCitationPackage(regeneratedPackage);
  if (
    regeneratedPackage.sourceCoverage !== "complete" ||
    regeneratedPackage.uncoveredSourceIds.length > 0
  ) {
    regeneratedErrors.push(
      `Regenerated package does not cover every declared source: ${regeneratedPackage.uncoveredSourceIds.join(", ") || "coverage status mismatch"}`
    );
  }
  if (regeneratedErrors.length > 0) {
    return result(
      request,
      orchestration,
      "regenerated-package-invalid",
      regeneratedErrors,
      template.packageId,
      regeneratedPackage
    );
  }

  const mismatchReasons = registeredExcerptMismatchReasons(
    request.citationPackage,
    regeneratedPackage
  );
  if (mismatchReasons.length > 0) {
    return result(
      request,
      orchestration,
      "registered-excerpt-mismatch",
      mismatchReasons,
      template.packageId,
      regeneratedPackage
    );
  }

  return result(
    request,
    orchestration,
    "ready",
    [],
    template.packageId,
    regeneratedPackage
  );
}
