import type { RegulatoryApplicabilityMapping } from "./applicability";
import {
  buildRegulatoryCitationPackage,
  validateRegulatoryCitationPackage,
  type RegulatoryCitationPackage,
  type RegulatoryCitationPackageRequest,
} from "./citation-package";
import type { RegulatoryExcerptRequest } from "./clause-extraction";
import {
  selectHistoricalRegulatorySources,
  type HistoricalGroundingSelectionRequest,
  type HistoricalGroundingSelectionResult,
} from "./historical-grounding-orchestration";
import {
  compareWithRegisteredRegulatoryValue,
  getRegisteredCitationTemplate,
  getRegisteredRegulatoryMapping,
} from "./registry-integrity";
import type { RegulatorySourceSnapshot } from "./types";

export type HistoricalCitationRegenerationStatus =
  | "ready"
  | "selection-unresolved"
  | "registered-template-missing"
  | "registered-template-invalid"
  | "anchor-drift"
  | "regenerated-package-invalid";

export type SuppliedPackageComparisonStatus =
  | "not-supplied"
  | "matches-regenerated"
  | "differs-from-regenerated";

export interface HistoricalCitationRegenerationRequest
  extends HistoricalGroundingSelectionRequest {
  /**
   * Optional package to compare after regeneration. It never controls source
   * selection or blocks generation of the historically correct package.
   */
  citationPackage?: RegulatoryCitationPackage;
}

export interface HistoricalCitationRegenerationResult {
  status: HistoricalCitationRegenerationStatus;
  mappingId: string;
  registeredTemplatePackageId?: string;
  selection: HistoricalGroundingSelectionResult;
  regeneratedPackage?: RegulatoryCitationPackage;
  selectedSnapshotIds: string[];
  suppliedPackageComparison: SuppliedPackageComparisonStatus;
  suppliedPackageDifferences: string[];
  refusalReasons: string[];
  customerFacingStatus: "benchmark-only";
}

function uniqueNonblank(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function result(
  request: HistoricalCitationRegenerationRequest,
  selection: HistoricalGroundingSelectionResult,
  status: HistoricalCitationRegenerationStatus,
  refusalReasons: readonly string[],
  registeredTemplatePackageId?: string,
  regeneratedPackage?: RegulatoryCitationPackage,
  suppliedPackageDifferences: readonly string[] = []
): HistoricalCitationRegenerationResult {
  const differences = uniqueNonblank(suppliedPackageDifferences);
  return {
    status,
    mappingId: request.mapping.mappingId,
    registeredTemplatePackageId,
    selection,
    regeneratedPackage,
    selectedSnapshotIds: [...selection.selectedSnapshotIds],
    suppliedPackageComparison: request.citationPackage
      ? differences.length === 0
        ? "matches-regenerated"
        : "differs-from-regenerated"
      : "not-supplied",
    suppliedPackageDifferences: differences,
    refusalReasons: uniqueNonblank(refusalReasons),
    customerFacingStatus: "benchmark-only",
  };
}

function registeredTemplateForMapping(
  mappingId: string
): RegulatoryCitationPackage | undefined {
  return getRegisteredCitationTemplate(mappingId)?.value as
    | RegulatoryCitationPackage
    | undefined;
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
  if (
    compareWithRegisteredRegulatoryValue("mapping", mapping.mappingId, mapping).length > 0
  ) {
    return undefined;
  }
  const mappingEntry = getRegisteredRegulatoryMapping(mapping.mappingId);
  const template = registeredTemplateForMapping(mapping.mappingId);
  if (!mappingEntry || !template) return undefined;
  return {
    packageId: `${mapping.mappingId}-historical-selected-snapshot-regenerated`,
    mapping: mappingEntry.value as RegulatoryApplicabilityMapping,
    excerpts: template.citations.map(excerptRequestFromRegisteredCitation),
  };
}

function selectedSnapshotsFromSelection(
  selection: HistoricalGroundingSelectionResult
): Readonly<Record<string, RegulatorySourceSnapshot>> {
  const entries: Array<[string, RegulatorySourceSnapshot]> = [];
  for (const decision of selection.sourceDecisions) {
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

function suppliedPackageDifferences(
  supplied: RegulatoryCitationPackage,
  regenerated: RegulatoryCitationPackage
): string[] {
  const reasons: string[] = validateRegulatoryCitationPackage(supplied).map(
    (error) => `Supplied package validation: ${error}`
  );
  const packageFields: Array<[string, unknown, unknown]> = [
    ["mapping ID", regenerated.mappingId, supplied.mappingId],
    ["fixture ID", regenerated.fixtureId, supplied.fixtureId],
    ["topic", regenerated.topic, supplied.topic],
    [
      "contractual imposition status",
      regenerated.contractualImpositionStatus,
      supplied.contractualImpositionStatus,
    ],
    [
      "regulatory applicability status",
      regenerated.regulatoryApplicabilityStatus,
      supplied.regulatoryApplicabilityStatus,
    ],
    ["comparison status", regenerated.comparisonStatus, supplied.comparisonStatus],
    [
      "contract evidence quotes",
      JSON.stringify(regenerated.contractEvidenceQuotes),
      JSON.stringify(supplied.contractEvidenceQuotes),
    ],
    [
      "supporting facts",
      JSON.stringify(regenerated.supportingFacts),
      JSON.stringify(supplied.supportingFacts),
    ],
    ["missing facts", JSON.stringify(regenerated.missingFacts), JSON.stringify(supplied.missingFacts)],
    [
      "prohibited inferences",
      JSON.stringify(regenerated.prohibitedInferences),
      JSON.stringify(supplied.prohibitedInferences),
    ],
    [
      "recommended document requests",
      JSON.stringify(regenerated.recommendedDocumentRequests),
      JSON.stringify(supplied.recommendedDocumentRequests),
    ],
    ["reviewer conclusion", regenerated.reviewerConclusion, supplied.reviewerConclusion],
    ["source coverage", regenerated.sourceCoverage, supplied.sourceCoverage],
    [
      "uncovered sources",
      JSON.stringify(regenerated.uncoveredSourceIds),
      JSON.stringify(supplied.uncoveredSourceIds),
    ],
    ["customer-facing status", regenerated.customerFacingStatus, supplied.customerFacingStatus],
  ];
  for (const [label, expected, observed] of packageFields) {
    if (observed !== expected) {
      reasons.push(`Supplied package ${label} differs from the regenerated package`);
    }
  }

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
      ["snapshot ID", expected.snapshotId, observed.snapshotId],
      ["citation label", expected.citation, observed.citation],
      ["title", expected.title, observed.title],
      ["canonical URL", expected.canonicalUrl, observed.canonicalUrl],
      ["version identifier", expected.versionIdentifier, observed.versionIdentifier],
      ["effective date", expected.effectiveDate, observed.effectiveDate],
      ["retrieval timestamp", expected.retrievedAt, observed.retrievedAt],
      ["snapshot checksum", expected.checksum, observed.checksum],
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
  const selection = selectHistoricalRegulatorySources(request);
  if (selection.status !== "ready") {
    return result(
      request,
      selection,
      "selection-unresolved",
      selection.refusalReasons
    );
  }

  const mappingEntry = getRegisteredRegulatoryMapping(request.mapping.mappingId);
  const template = registeredTemplateForMapping(request.mapping.mappingId);
  if (!mappingEntry || !template) {
    return result(
      request,
      selection,
      "registered-template-missing",
      [`Exactly one registered citation template and mapping are required for ${request.mapping.mappingId}`]
    );
  }

  let registeredRequest: RegulatoryCitationPackageRequest;
  try {
    registeredRequest = {
      packageId: `${request.mapping.mappingId}-historical-selected-snapshot-regenerated`,
      mapping: mappingEntry.value as RegulatoryApplicabilityMapping,
      excerpts: template.citations.map(excerptRequestFromRegisteredCitation),
    };
  } catch (error) {
    return result(
      request,
      selection,
      "registered-template-invalid",
      [error instanceof Error ? error.message : String(error)],
      template.packageId
    );
  }

  const templateErrors = [
    ...compareWithRegisteredRegulatoryValue(
      "citation-template",
      request.mapping.mappingId,
      template
    ),
    ...registeredTemplateErrors(
      mappingEntry.value as RegulatoryApplicabilityMapping,
      template,
      registeredRequest
    ),
  ];
  if (templateErrors.length > 0) {
    return result(
      request,
      selection,
      "registered-template-invalid",
      templateErrors,
      template.packageId
    );
  }

  const selectedSnapshots = selectedSnapshotsFromSelection(selection);
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
      selection,
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
      selection,
      "regenerated-package-invalid",
      regeneratedErrors,
      template.packageId,
      regeneratedPackage
    );
  }

  const comparisonDifferences = request.citationPackage
    ? suppliedPackageDifferences(request.citationPackage, regeneratedPackage)
    : [];

  return result(
    request,
    selection,
    "ready",
    [],
    template.packageId,
    regeneratedPackage,
    comparisonDifferences
  );
}
