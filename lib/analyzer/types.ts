// Shared types for the grounded GovCon subcontract analyzer pipeline.
// Output of runAnalyzer() must stay compatible with app/report/[id]/page.tsx.

export type RiskLevel = "High" | "Medium-High" | "Medium" | "Low";

export type TriggerType = "Contract Risk Trigger" | "Regulatory Trigger";

export type ContractType =
  | "FFP"
  | "T&M"
  | "Labor-Hour"
  | "CPFF"
  | "Cost-Reimbursement"
  | "IDIQ"
  | "Purchase Order"
  | "Teaming Agreement"
  | "Unknown";

export type Sector =
  | "Cybersecurity / IT / Professional Services"
  | "Construction / Facility / Trade"
  | "Supply / Manufacturing"
  | "Professional Services / Administrative Support"
  | "Services (General)"
  | "Unknown";

export interface DocumentAnchors {
  fileName?: string;
  parties?: string;
  subcontractNumber?: string;
  subcontractType?: string;
  primeContractNumber?: string;
  deliveryOrderNumber?: string;
  priceOrEstimatedValue?: string;
  fundingLimit?: string;
  sectorEvidence?: string;
  paymentSummary?: string;
  retainage?: string;
  keyDeadlines?: string[];
  keyClauses?: string[];
  incorporatedExhibits?: string[];
}

export interface Finding {
  triggerType: TriggerType;
  regulation: string;
  severity: RiskLevel;
  foundText: string;
  riskAnalysis: string;
  redlineFix: string;
  familyKey?: string;
}

export interface AnalyzerResult {
  riskLevel: RiskLevel;
  industryDetected: string;
  documentAnchors: DocumentAnchors;
  primaryTraps: Finding[];
  secondaryConcerns: Finding[];
  emailDraft: string;
  limitedScan?: boolean;
  limitedScanReason?: string;
  // Set when a scanned/image-only PDF had more pages than the OCR page cap
  // could process. Unlike limitedScan, findings ARE still shown here (they're
  // grounded in the pages that were OCR'd) - this flag exists so the UI can
  // clearly disclose that pages beyond ocrPagesProcessed were never reviewed,
  // instead of implying a complete document scan.
  partialOcrScan?: boolean;
  partialOcrReason?: string;
  ocrPagesProcessed?: number;
  ocrTotalPages?: number;
}

export interface ContractClassification {
  contractType: ContractType;
  sector: Sector;
  sectorEvidence?: string;
  notes: string[];
}

export interface DetectorFamily {
  key: string;
  label: string;
  description: string;
}

export interface ExtractionConfidence {
  confident: boolean;
  reason?: string;
}
