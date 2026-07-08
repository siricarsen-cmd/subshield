// Orchestrator: wires the full grounded pipeline together and produces the
// AnalyzerResult shape consumed by app/report/[id]/page.tsx.
//
// Upload text -> normalize -> extract anchors -> classify -> select detector
// families -> run grounded detectors -> verify quotes -> contradiction guards
// -> rank findings -> generate PM memo from verified findings only -> return
// (or return a Limited Scan result if extraction confidence is too low).

import { normalizeWhitespace, assessExtractionConfidence } from "./text";
import { extractAnchorCandidates } from "./anchors";
import { classifyContract } from "./classify";
import { selectDetectorFamilies, runGroundedDetectors } from "./detectors";
import { runDeterministicDetectors } from "./deterministic";
import { verifyFindings, guardIndustryLabel } from "./sanity";
import type { AnalyzerResult, Finding, RiskLevel } from "./types";

const SEVERITY_RANK: Record<RiskLevel, number> = { High: 3, "Medium-High": 2, Medium: 1, Low: 0 };
const MAX_PRIMARY_TRAPS = 6;

function computeRiskLevel(findings: Finding[]): RiskLevel {
  const highCount = findings.filter((f) => f.severity === "High").length;
  const medHighCount = findings.filter((f) => f.severity === "Medium-High").length;
  const medCount = findings.filter((f) => f.severity === "Medium").length;

  if (highCount >= 2) return "High";
  if (highCount === 1 && medHighCount + medCount >= 2) return "High";
  if (highCount === 1 || medHighCount >= 2) return "Medium-High";
  if (medHighCount === 1 || medCount >= 1) return "Medium";
  return "Low";
}

function rankFindings(findings: Finding[]): { primaryTraps: Finding[]; secondaryConcerns: Finding[] } {
  const sorted = [...findings].sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);
  return {
    primaryTraps: sorted.slice(0, MAX_PRIMARY_TRAPS),
    secondaryConcerns: sorted.slice(MAX_PRIMARY_TRAPS),
  };
}

function normalizeForDedupe(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

// Regulation labels that all describe the same underlying "indemnity" risk
// even when the LLM and the deterministic detector (or two LLM findings)
// phrase the label slightly differently ("Broad Indemnification / Duty to
// Defend" vs. "Indemnification and Hold Harmless Clause") or quote different
// sentences from the same clause that aren't literal substrings of each
// other. Scoped to this single keyword family on purpose - it must not catch
// termination, cure period, liability cap, continue-performance, payment
// contingency, or dispute-related regulation labels, which stay independently
// reportable per-clause.
const INDEMNITY_LABEL_RE = /indemnif|duty\s+to\s+defend|hold\s+harmless/i;

// Two findings describe the same underlying risk (not just the same family)
// when their quoted evidence is near-identical or one is a substring of the
// other, or when the model gave them the same regulation/risk label. This
// only collapses restatements of one clause - genuinely different clauses in
// the same family (e.g. indemnification vs. termination, both "liability")
// are untouched and can both surface.
function isSameRisk(a: Finding, b: Finding): boolean {
  if (a.familyKey && b.familyKey && a.familyKey !== b.familyKey) return false;

  const qa = normalizeForDedupe(a.foundText);
  const qb = normalizeForDedupe(b.foundText);
  if (qa && qb && (qa === qb || qa.includes(qb) || qb.includes(qa))) return true;

  const ra = normalizeForDedupe(a.regulation);
  const rb = normalizeForDedupe(b.regulation);
  if (ra && rb && ra === rb) return true;

  if (
    a.familyKey === "liability" &&
    b.familyKey === "liability" &&
    INDEMNITY_LABEL_RE.test(a.regulation) &&
    INDEMNITY_LABEL_RE.test(b.regulation)
  ) {
    return true;
  }

  return false;
}

// Collapses restatements of the same risk into a single finding (keeping the
// higher-severity / more complete one) so one repeated risk - e.g. a
// pay-if-paid clause quoted three different ways - can't crowd out distinct
// risks like indemnification or termination out of the top findings.
function dedupeFindings(findings: Finding[]): Finding[] {
  const kept: Finding[] = [];
  for (const finding of findings) {
    const dupIndex = kept.findIndex((existing) => isSameRisk(existing, finding));
    if (dupIndex === -1) {
      kept.push(finding);
      continue;
    }
    const existing = kept[dupIndex];
    const findingRank = SEVERITY_RANK[finding.severity];
    const existingRank = SEVERITY_RANK[existing.severity];
    if (findingRank > existingRank || (findingRank === existingRank && finding.foundText.length > existing.foundText.length)) {
      kept[dupIndex] = finding;
    }
  }
  return kept;
}

// Deterministic template so the memo can never drift from the verified findings
// it is built from (no separate LLM call that could hallucinate new content).
// isPartialOcrScan swaps the intro to avoid "we completed our review" framing
// when clauses past the OCR page cap were never actually reviewed.
function buildPmMemo(primaryTraps: Finding[], secondaryConcerns: Finding[], isPartialOcrScan: boolean): string {
  const all = [...primaryTraps, ...secondaryConcerns];
  if (all.length === 0) {
    return "";
  }

  const intro = isPartialOcrScan
    ? "Team,\n\nThis subcontract came in as a scanned/image-based PDF, so this review only covers the pages we were able to OCR-process (see the Partial OCR Scan notice for exact coverage) - it is not a complete document review. Based on what we could read, here's what stood out so far.\n"
    : "Team,\n\nWe completed our review of the subcontract and have a handful of items we'd like to align on before execution. None of these are meant to slow things down — we just want to make sure the terms reflect how we'll actually be performing the work.\n";

  const bullets = all
    .map((f, i) => `${i + 1}. ${f.regulation}: ${f.redlineFix}`)
    .join("\n\n");

  const outro =
    "\n\nHappy to jump on a call to walk through any of these. We'd like to get this finalized quickly once we're aligned.\n\nThanks,\n[Your Name]";

  return `${intro}\n${bullets}${outro}`;
}

function buildIndustryLabel(sector: string, contractType: string): string {
  if (sector === "Unknown" || sector === "Services (General)") {
    return contractType !== "Unknown" ? `Services (General) — ${contractType}` : "Services (General)";
  }
  return contractType !== "Unknown" ? `${sector} (${contractType})` : sector;
}

export interface ExtractionContext {
  // Overrides the *wording* of a Limited Scan reason (e.g. from the OCR
  // fallback in extract.ts). The confident/not-confident decision itself is
  // still made exclusively by assessExtractionConfidence() below and cannot
  // be bypassed by this override.
  limitedScanReason?: string;
  // Scanned/image-only PDF where OCR produced confident, groundable text from
  // SOME pages but the document has more pages than the OCR cap processed.
  // Findings are still generated and shown (they're grounded in the pages
  // that were reviewed) but the result is flagged so the UI/memo disclose
  // that this is not a complete document scan.
  partialOcrScan?: boolean;
  partialOcrReason?: string;
  ocrPagesProcessed?: number;
  ocrTotalPages?: number;
}

export async function runAnalyzer(
  rawDocumentText: string,
  fileName?: string,
  extractionContext?: ExtractionContext
): Promise<AnalyzerResult> {
  const documentText = normalizeWhitespace(rawDocumentText);

  const confidence = assessExtractionConfidence(documentText);
  if (!confidence.confident) {
    return {
      riskLevel: "Low",
      industryDetected: "Unknown",
      documentAnchors: { fileName },
      primaryTraps: [],
      secondaryConcerns: [],
      emailDraft: "",
      limitedScan: true,
      limitedScanReason: extractionContext?.limitedScanReason || confidence.reason,
    };
  }

  const documentAnchors = extractAnchorCandidates(documentText, fileName);
  const classification = classifyContract(documentText);
  const families = selectDetectorFamilies(classification, documentText);

  const rawFindings = await runGroundedDetectors(documentText, families);
  // Deterministic candidates are a recall net for well-known GovCon traps -
  // regex-detected directly from the document, independent of what the LLM
  // reported. They go through the same verification/dedupe path below, so an
  // LLM finding that already covers the same clause collapses with it instead
  // of duplicating it.
  const deterministicFindings = runDeterministicDetectors(documentText);
  const { verified } = verifyFindings([...rawFindings, ...deterministicFindings], documentText);
  const deduped = dedupeFindings(verified);

  const { primaryTraps, secondaryConcerns } = rankFindings(deduped);
  const riskLevel = computeRiskLevel(deduped);
  const isPartialOcrScan = Boolean(extractionContext?.partialOcrScan);
  const emailDraft = buildPmMemo(primaryTraps, secondaryConcerns, isPartialOcrScan);

  const industryDetected = guardIndustryLabel(
    buildIndustryLabel(classification.sector, classification.contractType),
    documentText
  );

  documentAnchors.sectorEvidence = documentAnchors.sectorEvidence || classification.sectorEvidence;

  return {
    riskLevel,
    industryDetected,
    documentAnchors,
    primaryTraps,
    secondaryConcerns,
    emailDraft,
    ...(isPartialOcrScan
      ? {
          partialOcrScan: true,
          partialOcrReason: extractionContext?.partialOcrReason,
          ocrPagesProcessed: extractionContext?.ocrPagesProcessed,
          ocrTotalPages: extractionContext?.ocrTotalPages,
        }
      : {}),
  };
}
