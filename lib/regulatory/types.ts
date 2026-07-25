// Shared types for SubShield's controlled, versioned official-source layer.
// These types do not perform retrieval or make regulatory conclusions by
// themselves. They define the provenance and uncertainty data that later
// ingestion, retrieval, applicability, and report layers must preserve.

export type RegulatorySourceTier = "primary" | "official-guidance";

export type RegulatorySourceFamily =
  | "FAR"
  | "DFARS"
  | "eCFR"
  | "Federal Register"
  | "DOL"
  | "SAM Wage Determinations"
  | "NIST"
  | "CMMC"
  | "CUI Registry"
  | "Agency Supplement"
  | "Deviation";

export type RegulatorySourceType =
  | "regulation"
  | "clause"
  | "prescription"
  | "statute"
  | "wage-determination-index"
  | "standard"
  | "program-rule"
  | "registry"
  | "guidance"
  | "deviation";

export type RegulatoryUpdateCadence =
  | "event-driven"
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly";

export type RegulatoryHistoricalStatus =
  | "current"
  | "superseded"
  | "archived"
  | "interim"
  | "corrected"
  | "proposed";

export interface VerifiedSourceVersion {
  versionIdentifier: string;
  verifiedAt: string;
  provenanceUrl: string;
  publicationDate?: string;
  effectiveDate?: string;
  supersedes?: string;
}

export interface RegulatorySourceCatalogEntry {
  sourceId: string;
  sourceFamily: RegulatorySourceFamily;
  sourceTier: RegulatorySourceTier;
  jurisdiction: "federal";
  issuingAuthority: string;
  canonicalTitle: string;
  canonicalUrl: string;
  sourceType: RegulatorySourceType;
  updateCadence: RegulatoryUpdateCadence;
  versionStrategy: string;
  requiresHistoricalSnapshots: boolean;
  supportsClientCitation: boolean;
  applicabilityNotes: string;
  currentVerifiedVersion?: VerifiedSourceVersion;
}

export type RegulatoryContentFormat = "html" | "xml" | "json" | "text";

export interface RegulatoryRedirectHop {
  fromUrl: string;
  toUrl: string;
  status: number;
}

export interface RegulatoryRetrievalReceipt {
  requestedUrl: string;
  finalUrl: string;
  status: number;
  contentType: string;
  rawByteLength: number;
  retrievedAt: string;
  redirectChain: RegulatoryRedirectHop[];
  etag?: string;
  lastModified?: string;
}

export interface RegulatorySourceSnapshot {
  snapshotId: string;
  sourceId: string;
  citation: string;
  canonicalTitle: string;
  canonicalUrl: string;
  versionIdentifier?: string;
  publicationDate?: string;
  effectiveDate?: string;
  expirationOrSupersededDate?: string;
  retrievedAt: string;
  checksum: string;
  rawChecksum: string;
  normalizationVersion: string;
  contentFormat: RegulatoryContentFormat;
  retrieval: RegulatoryRetrievalReceipt;
  historicalStatus: RegulatoryHistoricalStatus;
  text: string;
  applicabilityMetadata: Record<string, unknown>;
  crossReferences: string[];
  provenanceNotes: string[];
  reviewStatus: "pending" | "approved" | "rejected";
  reviewedBy?: string;
  reviewedAt?: string;
}

export type RegulatorySnapshotChangeStatus =
  | "first-snapshot"
  | "unchanged"
  | "content-changed";

export interface RegulatorySnapshotComparison {
  status: RegulatorySnapshotChangeStatus;
  previousSnapshotId?: string;
  previousChecksum?: string;
  nextSnapshotId: string;
  nextChecksum: string;
  previousLineCount?: number;
  nextLineCount: number;
  firstDifferentLine?: number;
}

export interface RegulatorySnapshotManifestEntry {
  snapshotId: string;
  path: string;
  checksum: string;
  rawChecksum: string;
  retrievedAt: string;
  reviewStatus: RegulatorySourceSnapshot["reviewStatus"];
  versionIdentifier?: string;
}

export interface RegulatoryRetrievalObservation {
  observationId: string;
  normalizedSnapshotId: string;
  checksum: string;
  rawChecksum: string;
  normalizationVersion: string;
  retrieval: RegulatoryRetrievalReceipt;
}

export interface RegulatorySnapshotManifest {
  schemaVersion: 1;
  sourceId: string;
  latestObservedSnapshotId?: string;
  latestApprovedSnapshotId?: string;
  snapshots: RegulatorySnapshotManifestEntry[];
  observations: RegulatoryRetrievalObservation[];
}

export interface RegulatoryCitation {
  sourceId: string;
  snapshotId: string;
  citation: string;
  title: string;
  canonicalUrl: string;
  versionIdentifier?: string;
  effectiveDate?: string;
  retrievedAt: string;
  excerpt: string;
  checksum: string;
}

export type RegulatoryApplicabilityStatus =
  | "Confirmed"
  | "Potentially applicable"
  | "Not established"
  | "Not applicable based on stated facts";

export type RegulatoryComparisonStatus =
  | "source-backed obligation present"
  | "required supporting document missing"
  | "cited clause incomplete, altered, obsolete, or inconsistent"
  | "prime-drafted obligation broader than federal baseline"
  | "protective or narrower subcontract language"
  | "flowdown potentially required but not supplied"
  | "applicability uncertain"
  | "commercial risk independent of regulatory compliance";

export interface RegulatoryGrounding {
  applicabilityStatus: RegulatoryApplicabilityStatus;
  comparisonStatus: RegulatoryComparisonStatus;
  citations: RegulatoryCitation[];
  supportingFacts: string[];
  missingFacts: string[];
  sourceSnapshotIds: string[];
  verifiedAt: string;
}
