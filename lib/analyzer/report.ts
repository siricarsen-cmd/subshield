// Orchestrator: wires the full grounded pipeline together and produces the
// AnalyzerResult shape consumed by app/report/[id]/page.tsx.
//
// Upload text -> normalize -> extract anchors -> classify -> select detector
// families -> run grounded detectors -> verify quotes -> contradiction guards
// -> rank findings -> generate PM memo from verified findings only -> return
// (or return a Limited Scan result if extraction confidence is too low).

import { normalizeWhitespace, assessExtractionConfidence, type ExtractionConfidenceHints } from "./text";
import { extractAnchorCandidates } from "./anchors";
import { classifyContract } from "./classify";
import { selectDetectorFamilies, runGroundedDetectors } from "./detectors";
import { runDeterministicDetectors } from "./deterministic";
import { hasUnilateralFutureCyberEvidence } from "./clause-segments";
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

// Payment-contingency identification for rankFindings' within-tier priority
// rule below. Both checks are scoped to familyKey === "payment" so this can
// never promote a liability, cyber, or structure finding:
//   (A) the canonical deterministic.ts regulation title, or an LLM label
//       using equivalent wording ("pay-if-paid", "contingent Government
//       payment", "no obligation to pay ... not paid by Government");
//   (B) verified foundText that itself describes the Government-payment
//       dependency (payment timed to Prime's receipt of Government payment,
//       Prime's no-obligation-to-pay-unpaid-amounts language, or the
//       Government-delay/dispute/withholding pass-through to Subcontractor).
// (B) is required in addition to (A) because dedupeFindings() can keep an
// LLM-sourced finding whose regulation label doesn't match the canonical
// title even though its foundText describes the identical risk (see
// isSameRisk's quote-overlap branch) - without a foundText check, that
// surviving finding would lose payment-contingency priority merely because
// dedup happened to retain the LLM's label instead of deterministic.ts's.
// foundText is safe to inspect here because every finding reaching
// rankFindings has already passed verifyFindings()'s exact-quote check, so
// this can't be fooled by ungrounded text.
const PAYMENT_CONTINGENCY_TITLE_RE =
  /pay[\s-]if[\s-]paid|contingent[^.]{0,60}government[^.]{0,40}payment|no\s+obligation\s+to\s+pay[^.]{0,80}(?:amounts?|sums?)[^.]{0,60}not\s+paid[^.]{0,40}government/i;

const PAYMENT_DEPENDENCY_FOUNDTEXT_PATTERNS: RegExp[] = [
  // Subcontractor payment timed to occur after/once/when Prime receives payment from the Government.
  /pay[^.]{0,100}(?:after|once|when)[^.]{0,60}(?:receiv(?:es|ed|ing)|receipt\s+of)[^.]{0,60}payment[^.]{0,40}(?:from\s+)?(?:the\s+)?government/i,
  // Prime has no obligation to pay amounts the Government does not pay/hasn't received.
  /no\s+obligation\s+to\s+pay[^.]{0,120}(?:amounts?|sums?)[^.]{0,80}(?:not\s+(?:received|paid)|government\s+(?:does\s+not|did\s+not|has\s+not)\s+pa(?:y|id))/i,
  // Government delay/dispute/reduction/rejection/withholding lets Prime delay/reduce/withhold Subcontractor payment.
  /government[^.]{0,40}(?:delays?|disputes?|reduces?|rejects?|withholds?)[^.]{0,150}(?:may\s+)?(?:delay|reduce|withhold)[^.]{0,60}payment/i,
];

function isPaymentContingencyFinding(f: Finding): boolean {
  if (f.familyKey !== "payment") return false;
  if (PAYMENT_CONTINGENCY_TITLE_RE.test(f.regulation)) return true;
  return PAYMENT_DEPENDENCY_FOUNDTEXT_PATTERNS.some((p) => p.test(f.foundText));
}

// Severity is the sole controlling sort key; payment-contingency priority is
// only a tiebreak within a severity tier, so a Medium-High payment finding can
// never outrank a High (or, if ever introduced, Critical) non-payment finding.
// Array.sort is stable, so all other equal-severity/equal-priority findings
// keep their existing relative (merge) order - this must not become a blanket
// "deterministic findings first" rule.
export function rankFindings(findings: Finding[]): { primaryTraps: Finding[]; secondaryConcerns: Finding[] } {
  const sorted = [...findings].sort((a, b) => {
    const severityDiff = SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity];
    if (severityDiff !== 0) return severityDiff;
    const aPriority = isPaymentContingencyFinding(a) ? 0 : 1;
    const bPriority = isPaymentContingencyFinding(b) ? 0 : 1;
    return aPriority - bPriority;
  });
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

const CANONICAL_FUTURE_FLOWDOWN_LABEL = "Broad Future Flowdowns / Prime Contract Control";
const CANONICAL_FUTURE_CYBER_LABEL = "Unilateral Future Cybersecurity Requirements";
const CANONICAL_MISSING_DOCUMENTS_LABEL = "Missing / Deferred Contract Documents";

// A model can quote the exact future-flowdown trap but label it with the
// broader structure-family title. Canonicalize only when the finding's own
// verified evidence unmistakably states that additional/revised/new/modified
// flowdown requirements become binding on notice. This runs at the dedupe
// boundary used by runAnalyzer, before model/deterministic collision
// resolution, so the earlier model finding can keep its higher severity and
// fuller analysis while receiving the correct risk identity. No other field
// changes, and generic missing/deferred-document evidence cannot match.
const BINDING_FUTURE_FLOWDOWN_EVIDENCE_RE =
  /(?:additional|revised|new|modified)(?:\s+or\s+(?:additional|revised|new|modified))?\s+flow[\s-]?down\s+requirements?[\s\S]{0,420}(?:such|those|the)\s+requirements?\s+(?:become|are|shall\s+be)\s+binding\s+(?:upon|on|after)\s+(?:written\s+)?notice/i;

// Missing-document normalization is independently evidence-gated: a named
// material document must be paired in the finding's own verified quote with
// an explicit current-absence statement or a post-execution/award/signing
// delivery deferral. A named exhibit merely omitted from an order-of-
// precedence list is not missing, so that specific structure phrasing is
// excluded. Generic incorporation, conflict, precedence, and silence cannot
// match these patterns.
const MISSING_OR_DEFERRED_DOCUMENT_EVIDENCE_PATTERNS: RegExp[] = [
  /(?:statements?\s+of\s+work|\bSOWs?\b|flow[\s-]?down\s+(?:lists?|matrix|matrices)|Prime\s+Contract\s+excerpts?|(?:identified|required|specified|applicable)\s+(?:attachments?|exhibits?|schedules?|appendices)|(?:Attachment|Exhibit|Schedule|Appendix)\s+[A-Z0-9][A-Z0-9._-]{0,20}\b|\bSystem\s+Security\s+Plans?\b|\bSSP\b|CUI\s+marking\s+guide|network\s+(?:boundary\s+)?diagram|data[\s-]flow\s+map|(?:Prime\s+)?(?:cyber(?:\/security)?|cybersecurity|security)\s+procedures?)[^.]{0,300}(?:(?:(?:is|are|remain|has|have)\s+)?not\s+(?:currently\s+|yet\s+)?(?:been\s+)?(?:attached|included(?!\s+in\s+(?:the\s+)?order[\s-]of[\s-]precedence)|provided|available)|(?:will|shall|may)\s+be\s+(?:provided|furnished|attached|included)\s+(?:after\s+(?:execution|award|signing)|later))/i,
  /(?:(?:(?:is|are|remain|has|have)\s+)?not\s+(?:currently\s+|yet\s+)?(?:been\s+)?(?:attached|included(?!\s+in\s+(?:the\s+)?order[\s-]of[\s-]precedence)|provided|available))[^.;:\n]{0,180}(?:statements?\s+of\s+work|\bSOWs?\b|flow[\s-]?down\s+(?:lists?|matrix|matrices)|Prime\s+Contract\s+excerpts?|(?:identified|required|specified|applicable)\s+(?:attachments?|exhibits?|schedules?|appendices)|(?:Attachment|Exhibit|Schedule|Appendix)\s+[A-Z0-9][A-Z0-9._-]{0,20}\b|\bSystem\s+Security\s+Plans?\b|\bSSP\b|CUI\s+marking\s+guide|network\s+(?:boundary\s+)?diagram|data[\s-]flow\s+map|(?:Prime\s+)?(?:cyber(?:\/security)?|cybersecurity|security)\s+procedures?)/i,
];

function canonicalizeKnownRiskLabel(finding: Finding): Finding {
  if (
    (finding.familyKey === "cyber" || finding.familyKey === "structure") &&
    hasUnilateralFutureCyberEvidence(finding.foundText) &&
    finding.regulation !== CANONICAL_FUTURE_CYBER_LABEL
  ) {
    return { ...finding, familyKey: "cyber", regulation: CANONICAL_FUTURE_CYBER_LABEL };
  }
  if (
    finding.familyKey === "structure" &&
    BINDING_FUTURE_FLOWDOWN_EVIDENCE_RE.test(finding.foundText) &&
    finding.regulation !== CANONICAL_FUTURE_FLOWDOWN_LABEL
  ) {
    return { ...finding, regulation: CANONICAL_FUTURE_FLOWDOWN_LABEL };
  }
  if (
    finding.familyKey === "structure" &&
    MISSING_OR_DEFERRED_DOCUMENT_EVIDENCE_PATTERNS.some((pattern) => pattern.test(finding.foundText)) &&
    finding.regulation !== CANONICAL_MISSING_DOCUMENTS_LABEL
  ) {
    return { ...finding, regulation: CANONICAL_MISSING_DOCUMENTS_LABEL };
  }
  return finding;
}

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
export function dedupeFindings(findings: Finding[]): Finding[] {
  const kept: Finding[] = [];
  for (const rawFinding of findings) {
    const finding = canonicalizeKnownRiskLabel(rawFinding);
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
export function buildPmMemo(primaryTraps: Finding[], secondaryConcerns: Finding[], isPartialOcrScan: boolean): string {
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
  // Signals about the upload (PDF page count / DOCX-TXT file size) so this
  // function's confidence gate - the sole place limitedScan is decided - can
  // catch a "clean-looking" extraction that only captured a fraction of a
  // much larger source document. See assessExtractionConfidence in text.ts.
  confidenceHints?: ExtractionConfidenceHints;
}

export async function runAnalyzer(
  rawDocumentText: string,
  fileName?: string,
  extractionContext?: ExtractionContext
): Promise<AnalyzerResult> {
  const documentText = normalizeWhitespace(rawDocumentText);

  const confidence = assessExtractionConfidence(documentText, extractionContext?.confidenceHints);
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
