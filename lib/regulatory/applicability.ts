import { getRegulatorySource } from "./source-catalog";
import type {
  RegulatoryApplicabilityStatus,
  RegulatoryComparisonStatus,
} from "./types";

export type ContractualImpositionStatus =
  | "expressly imposed"
  | "conditionally imposed"
  | "not stated"
  | "citation inconsistent";

export interface RegulatorySourceComparison {
  sourceId: string;
  locator: string;
  expectedRelationship:
    | "supports stated obligation"
    | "defines applicability"
    | "defines required document"
    | "provides controlling deadline"
    | "shows cited identifier is unrelated"
    | "provides comparison baseline";
  reviewNote: string;
}

export interface RegulatoryApplicabilityMapping {
  mappingId: string;
  fixtureId: "QA-C" | "QA-D";
  topic: string;
  evidenceQuotes: string[];
  contractualImpositionStatus: ContractualImpositionStatus;
  regulatoryApplicabilityStatus: RegulatoryApplicabilityStatus;
  comparisonStatus: RegulatoryComparisonStatus;
  sourceComparisons: RegulatorySourceComparison[];
  supportingFacts: string[];
  missingFacts: string[];
  prohibitedInferences: string[];
  recommendedDocumentRequests: string[];
  reviewerConclusion: string;
}

export interface ApplicabilityMappingValidationResult {
  valid: boolean;
  errors: string[];
}

function normalized(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function validateRegulatoryApplicabilityMapping(
  mapping: RegulatoryApplicabilityMapping,
  documentText: string
): ApplicabilityMappingValidationResult {
  const errors: string[] = [];
  const normalizedDocument = normalized(documentText);

  if (!mapping.mappingId.startsWith(`${mapping.fixtureId.toLowerCase()}-`)) {
    errors.push("mapping ID must begin with the lowercase fixture ID");
  }
  if (mapping.evidenceQuotes.length === 0) {
    errors.push("at least one exact contract evidence quote is required");
  }
  for (const quote of mapping.evidenceQuotes) {
    if (!quote.trim()) errors.push("contract evidence quotes must not be blank");
    else if (!normalizedDocument.includes(normalized(quote))) {
      errors.push(`evidence quote is not present in the fixture: ${quote.slice(0, 80)}`);
    }
  }
  if (mapping.sourceComparisons.length === 0) {
    errors.push("at least one approved official-source comparison is required");
  }
  for (const comparison of mapping.sourceComparisons) {
    if (!getRegulatorySource(comparison.sourceId)) {
      errors.push(`unknown approved source ID: ${comparison.sourceId}`);
    }
    if (!comparison.locator.trim()) errors.push("source locator must not be blank");
    if (!comparison.reviewNote.trim()) errors.push("source review note must not be blank");
  }
  if (mapping.regulatoryApplicabilityStatus === "Confirmed" && mapping.missingFacts.length > 0) {
    errors.push("Confirmed applicability cannot retain unresolved material facts");
  }
  if (
    mapping.contractualImpositionStatus === "citation inconsistent" &&
    mapping.comparisonStatus !== "cited clause incomplete, altered, obsolete, or inconsistent"
  ) {
    errors.push("citation-inconsistent mappings must use the inconsistent-clause comparison status");
  }
  if (mapping.prohibitedInferences.length === 0) {
    errors.push("every mapping must identify at least one prohibited inference");
  }
  if (!mapping.reviewerConclusion.trim()) errors.push("reviewer conclusion must not be blank");

  return { valid: errors.length === 0, errors };
}

export function validateRegulatoryApplicabilityMappings(
  mappings: readonly RegulatoryApplicabilityMapping[],
  fixtureDocuments: Readonly<Record<"QA-C" | "QA-D", string>>
): ApplicabilityMappingValidationResult {
  const errors: string[] = [];
  const seenIds = new Set<string>();

  for (const mapping of mappings) {
    if (seenIds.has(mapping.mappingId)) errors.push(`duplicate mapping ID: ${mapping.mappingId}`);
    seenIds.add(mapping.mappingId);
    const result = validateRegulatoryApplicabilityMapping(
      mapping,
      fixtureDocuments[mapping.fixtureId]
    );
    errors.push(...result.errors.map((error) => `${mapping.mappingId}: ${error}`));
  }

  return { valid: errors.length === 0, errors };
}
