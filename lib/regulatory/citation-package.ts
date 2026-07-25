import type { RegulatoryApplicabilityMapping } from "./applicability";
import {
  extractApprovedRegulatoryCitation,
  type ExtractedRegulatoryCitation,
  type RegulatoryExcerptRequest,
} from "./clause-extraction";
import type { RegulatorySourceSnapshot } from "./types";

export interface RegulatoryCitationPackageRequest {
  packageId: string;
  mapping: RegulatoryApplicabilityMapping;
  excerpts: RegulatoryExcerptRequest[];
}

export interface RegulatoryCitationPackage {
  packageId: string;
  mappingId: string;
  fixtureId: RegulatoryApplicabilityMapping["fixtureId"];
  topic: string;
  contractualImpositionStatus: RegulatoryApplicabilityMapping["contractualImpositionStatus"];
  regulatoryApplicabilityStatus: RegulatoryApplicabilityMapping["regulatoryApplicabilityStatus"];
  comparisonStatus: RegulatoryApplicabilityMapping["comparisonStatus"];
  contractEvidenceQuotes: string[];
  citations: ExtractedRegulatoryCitation[];
  supportingFacts: string[];
  missingFacts: string[];
  prohibitedInferences: string[];
  recommendedDocumentRequests: string[];
  reviewerConclusion: string;
  uncoveredSourceIds: string[];
  sourceCoverage: "complete" | "partial";
  customerFacingStatus: "benchmark-only";
}

function uniqueNonblank(values: readonly string[], label: string): string[] {
  const normalized = values.map((value) => value.trim());
  if (normalized.some((value) => !value)) {
    throw new Error(`${label} must not contain blank values`);
  }
  return [...new Set(normalized)];
}

export function buildRegulatoryCitationPackage(
  request: RegulatoryCitationPackageRequest,
  approvedSnapshots: Readonly<Record<string, RegulatorySourceSnapshot>>
): RegulatoryCitationPackage {
  if (!request.packageId.trim()) throw new Error("Regulatory citation package ID must not be blank");
  if (!request.packageId.startsWith(`${request.mapping.mappingId}-`)) {
    throw new Error("Regulatory citation package ID must begin with its mapping ID");
  }
  if (request.excerpts.length === 0) {
    throw new Error("Regulatory citation package requires at least one approved-source excerpt");
  }

  const allowedSourceIds = new Set(
    request.mapping.sourceComparisons.map((comparison) => comparison.sourceId)
  );
  const seenExcerptKeys = new Set<string>();
  const citations = request.excerpts.map((excerptRequest) => {
    if (!allowedSourceIds.has(excerptRequest.sourceId)) {
      throw new Error(
        `Regulatory excerpt source is not declared by mapping ${request.mapping.mappingId}: ${excerptRequest.sourceId}`
      );
    }
    const key = `${excerptRequest.sourceId}:${excerptRequest.locator}`;
    if (seenExcerptKeys.has(key)) {
      throw new Error(`Duplicate regulatory excerpt request: ${key}`);
    }
    seenExcerptKeys.add(key);

    const snapshot = approvedSnapshots[excerptRequest.sourceId];
    if (!snapshot) {
      throw new Error(`Approved regulatory snapshot is unavailable: ${excerptRequest.sourceId}`);
    }
    return extractApprovedRegulatoryCitation(snapshot, excerptRequest);
  });

  const coveredSourceIds = new Set(citations.map((citation) => citation.sourceId));
  const uncoveredSourceIds = [...allowedSourceIds].filter(
    (sourceId) => !coveredSourceIds.has(sourceId)
  );

  return {
    packageId: request.packageId.trim(),
    mappingId: request.mapping.mappingId,
    fixtureId: request.mapping.fixtureId,
    topic: request.mapping.topic,
    contractualImpositionStatus: request.mapping.contractualImpositionStatus,
    regulatoryApplicabilityStatus: request.mapping.regulatoryApplicabilityStatus,
    comparisonStatus: request.mapping.comparisonStatus,
    contractEvidenceQuotes: uniqueNonblank(request.mapping.evidenceQuotes, "Contract evidence quotes"),
    citations,
    supportingFacts: uniqueNonblank(request.mapping.supportingFacts, "Supporting facts"),
    missingFacts: uniqueNonblank(request.mapping.missingFacts, "Missing facts"),
    prohibitedInferences: uniqueNonblank(
      request.mapping.prohibitedInferences,
      "Prohibited inferences"
    ),
    recommendedDocumentRequests: uniqueNonblank(
      request.mapping.recommendedDocumentRequests,
      "Recommended document requests"
    ),
    reviewerConclusion: request.mapping.reviewerConclusion.trim(),
    uncoveredSourceIds,
    sourceCoverage: uncoveredSourceIds.length === 0 ? "complete" : "partial",
    customerFacingStatus: "benchmark-only",
  };
}

export function validateRegulatoryCitationPackage(
  citationPackage: RegulatoryCitationPackage
): string[] {
  const errors: string[] = [];
  if (!citationPackage.packageId.startsWith(`${citationPackage.mappingId}-`)) {
    errors.push("package ID is not tied to its applicability mapping");
  }
  if (citationPackage.contractEvidenceQuotes.length === 0) {
    errors.push("package lacks exact contract evidence");
  }
  if (citationPackage.citations.length === 0) {
    errors.push("package lacks approved official-source citations");
  }
  if (citationPackage.citations.some((citation) => !citation.excerpt.trim())) {
    errors.push("package contains a blank official-source excerpt");
  }
  if (
    new Set(citationPackage.citations.map((citation) => citation.excerptChecksum)).size !==
    citationPackage.citations.length
  ) {
    errors.push("package contains duplicate official-source excerpts");
  }
  if (citationPackage.missingFacts.length === 0) {
    errors.push("package does not preserve unresolved applicability facts");
  }
  if (citationPackage.prohibitedInferences.length === 0) {
    errors.push("package does not preserve prohibited inferences");
  }
  if (!citationPackage.reviewerConclusion) {
    errors.push("package lacks a reviewer conclusion");
  }
  if (
    citationPackage.sourceCoverage === "complete" &&
    citationPackage.uncoveredSourceIds.length > 0
  ) {
    errors.push("package claims complete coverage while source comparisons remain uncovered");
  }
  if (
    citationPackage.sourceCoverage === "partial" &&
    citationPackage.uncoveredSourceIds.length === 0
  ) {
    errors.push("package claims partial coverage without identifying an uncovered source");
  }
  if (citationPackage.customerFacingStatus !== "benchmark-only") {
    errors.push("citation package was enabled for customer use before integration approval");
  }
  return errors;
}
