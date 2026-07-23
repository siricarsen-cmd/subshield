// Deterministic high-priority risk scanner.
//
// The LLM detector in detectors.ts is asked to find risks from scratch, which
// means it can simply forget to mention a well-known GovCon subcontract trap
// even when the exact clause is sitting in the document. This module doesn't
// rely on the model's recall at all: it regex-scans the document text itself
// for a fixed list of high-priority risk patterns and, when a pattern's
// trigger phrase is actually present, slices out the surrounding sentence
// verbatim as the finding's foundText. Every candidate here is therefore
// grounded by construction - if the trigger phrase isn't in the document, no
// finding is produced for it. These candidates are merged with the LLM's
// findings in report.ts and pass through the same verifyFindings/dedupe path,
// so this only raises recall - it can't lower the bar for what counts as
// grounded evidence.

import {
  areAdjacentNumberedClauses,
  extractClauseSegments,
  hasUnilateralFutureCyberEvidence,
  type ClauseSegment,
} from "./clause-segments";
import type { Finding, RiskLevel } from "./types";

// Maximum day count for a standalone "N days to cure" mention (with no
// paired immediate-termination/sole-discretion language) to count as a
// short-cure risk on its own. No prior numeric threshold was codified
// anywhere in this codebase; 10 was chosen as a defensible cutoff sitting
// above the "5 calendar days" example already used elsewhere in this file
// and in sanity.ts's stock-phrase guard as the canonical short-cure
// illustration, and below the 30-day cure period confirmed as a false
// positive in regression testing. Exported so sanity.ts's LLM long-cure
// companion guard uses this exact same value instead of a duplicated magic
// number.
export const SHORT_CURE_MAX_DAYS = 10;

// A termination-for-convenience notice period is independently risky only
// when it is 15 days or less. Longer stated periods require separate adverse
// recovery, exclusion, deduction, or no-notice evidence before the
// deterministic scanner may report them. Exported so sanity.ts applies the
// identical threshold to model findings instead of duplicating the number.
export const SHORT_TERMINATION_NOTICE_MAX_DAYS = 15;

const TERMINATION_NOTICE_DAY_WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fortyfive: 45,
  "forty-five": 45,
  sixty: 60,
  ninety: 90,
};

const TERMINATION_NOTICE_DAYS_RE =
  /\b(?:at\s+least\s+)?(\d{1,3}|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|twenty|thirty|forty(?:[\s-]?five)?|sixty|ninety)\s*(?:calendar|business|working)?\s*-?\s*days?(?:'|\u2019)?\s+(?:(?:prior|advance)\s+)?(?:written\s+)?notice\b/i;

export function extractTerminationNoticeDays(text: string): number | null {
  const match = TERMINATION_NOTICE_DAYS_RE.exec(text);
  if (!match) return null;

  if (/^\d+$/.test(match[1])) return Number(match[1]);
  const normalizedWord = match[1].toLowerCase().replace(/\s+/g, "");
  return TERMINATION_NOTICE_DAY_WORDS[normalizedWord] ?? null;
}

export function hasComprehensiveTerminationRecoveryEvidence(text: string): boolean {
  const hasAcceptedOrCompletedWork = /\b(?:accepted|completed)\s+work\b/i.test(text);
  const hasWorkInProcess = /\b(?:reasonable\s+)?(?:work[\s-]+in[\s-]+process|WIP)\b/i.test(text);
  const hasNoncancelableCommitments = /\bnon[\s-]?cancell?able\s+commitments?\b/i.test(text);
  const hasDemobilization = /\b(?:reasonable\s+)?demobilization(?:\s+costs?)?\b/i.test(text);
  const hasSettlementOrCloseout = /\b(?:reasonable\s+)?(?:settlement|closeout)(?:\s+costs?)?\b/i.test(text);

  return (
    hasAcceptedOrCompletedWork &&
    hasWorkInProcess &&
    hasNoncancelableCommitments &&
    hasDemobilization &&
    hasSettlementOrCloseout
  );
}

const AFFIRMATIVE_IMMEDIATE_TERMINATION_FOR_CONVENIENCE_RE =
  /Prime(?:\s+Contractor)?\s+(?:may(?!\s+not\b)|can|has\s+(?:the\s+)?right\s+to|retains?\s+(?:the\s+)?right\s+to)[^.]{0,80}\bterminate[^.]{0,80}\bfor\s+(?:its\s+|the\s+)?convenience\b[^.]{0,180}(?:(?<!not\s)immediately|(?<!not\s)at\s+any\s+time|(?<!not\s)without\s+(?:(?:further|written)\s+)?notice)/i;
const PROTECTIVE_TERMINATION_FOR_CONVENIENCE_RESTRICTION_RE =
  /Prime(?:\s+Contractor)?\s+(?:may\s+not|shall\s+not|must\s+not)[^.]{0,80}\bterminate[^.]{0,80}\bfor\s+(?:its\s+|the\s+)?convenience\b|Prime(?:\s+Contractor)?\s+is\s+prohibited\s+from[^.]{0,80}\bterminat(?:e|ing)[^.]{0,80}\bfor\s+(?:its\s+|the\s+)?convenience\b|Neither\s+party\s+(?:may|shall)[^.]{0,80}\bterminate[^.]{0,80}\bfor\s+(?:its\s+|the\s+)?convenience\b|\bterminate[^.]{0,80}\bfor\s+(?:its\s+|the\s+)?convenience\b[^.]{0,180}(?:but\s+not\s+immediately|only\s+after\s+(?:at\s+least\s+)?(?:\d{1,3}|[a-z-]+)\s*(?:calendar|business|working)?\s*-?\s*days?)/i;
const NO_TERMINATION_COMPENSATION_RE =
  /\b(?:without\s+(?:further\s+)?(?:liability|compensation|payment)|no\s+(?:further\s+)?(?:liability|compensation|payment)|not\s+entitled\s+to\s+(?:any\s+)?compensation)\b/i;
const ACCEPTED_WORK_ONLY_RECOVERY_RE =
  /(?:recovery|compensation|payment)[^.]{0,120}(?:limited|restricted)\s+(?:only\s+)?to[^.]{0,120}(?:accepted|completed|incorporated)\s+work|(?:shall|will)\s+pay\s+(?:only|solely)[^.]{0,100}(?:accepted|completed|incorporated)\s+work|(?:accepted|completed|incorporated)\s+work\s+only/i;
const EXPRESS_TERMINATION_COST_EXCLUSION_RE =
  /(?:not\s+liable\s+for|no\s+(?:compensation|payment)\s+for|shall\s+not\s+pay|exclude[sd]?|does\s+not\s+include)[^.]{0,220}(?:terminated\s+work|committed\s+costs?|work[\s-]+in[\s-]+process|WIP|non[\s-]?cancell?able\s+commitments?|demobilization|settlement|closeout|unabsorbed\s+overhead|start[\s-]?up|security\s+investments?|unused\s+licenses?|(?:reasonable\s+)?profit\s+on\s+completed\s+work)/i;
const BROAD_TERMINATION_DEDUCTION_RE =
  /(?:less|reduced\s+by|subject\s+to\s+deduction\s+for)[^.]{0,220}(?:retainage|back[\s-]?charges?|set[\s-]?offs?|offsets?|amounts?\s+(?:that\s+)?Prime\s+claims?\s+(?:are\s+)?owed)|Prime(?:\s+Contractor)?\s+may\s+(?:deduct|offset|set[\s-]?off|back[\s-]?charge)[^.]{0,180}(?:termination\s+(?:payment|settlement)|recovery|compensation)|(?:recovery|compensation|payment)[^.]{0,180}(?:Prime(?:'s|\u2019s)?\s+(?:sole|unilateral)\s+(?:discretion|determination)|as\s+Prime\s+(?:solely\s+)?determines?)/i;
const GENERIC_LIMITED_RECOVERY_RE = /\b(?:recovery|compensation)\b[^.]{0,100}\b(?:is|shall\s+be)\s+limited\s+to\b/i;

export function hasTerminationForConvenienceRiskEvidence(text: string): boolean {
  const noticeDays = extractTerminationNoticeDays(text);
  if (noticeDays !== null && noticeDays <= SHORT_TERMINATION_NOTICE_MAX_DAYS) return true;
  if (hasAffirmativeImmediateTerminationForConvenienceEvidence(text)) return true;
  if (NO_TERMINATION_COMPENSATION_RE.test(text)) return true;
  if (ACCEPTED_WORK_ONLY_RECOVERY_RE.test(text)) return true;
  if (EXPRESS_TERMINATION_COST_EXCLUSION_RE.test(text)) return true;
  if (BROAD_TERMINATION_DEDUCTION_RE.test(text)) return true;

  return GENERIC_LIMITED_RECOVERY_RE.test(text) && !hasComprehensiveTerminationRecoveryEvidence(text);
}

export function hasAffirmativeImmediateTerminationForConvenienceEvidence(text: string): boolean {
  return AFFIRMATIVE_IMMEDIATE_TERMINATION_FOR_CONVENIENCE_RE.test(text);
}

export function hasProtectiveTerminationForConvenienceRestrictionEvidence(text: string): boolean {
  return PROTECTIVE_TERMINATION_FOR_CONVENIENCE_RESTRICTION_RE.test(text);
}

function findTerminationForConvenienceCandidate(documentText: string): string | null {
  const locator = /\bterminat(?:e|es|ed|ing|ion)\b[^.]{0,80}\bfor\s+(?:its\s+|the\s+)?convenience\b/i;
  return clauseCandidates(documentText).find((clause) => locator.test(clause.text) && hasTerminationForConvenienceRiskEvidence(clause.text))?.text ?? null;
}

interface DeterministicCategory {
  familyKey: string;
  regulation: string;
  severity: RiskLevel;
  patterns: RegExp[];
  findCandidate?: (documentText: string) => string | null;
  riskAnalysis: string;
  redlineFix: string;
  buildRiskAnalysis?: (foundText: string) => string;
}

function buildCyberBaselineAnalysis(foundText: string): string {
  if (/\bdfars\b/i.test(foundText) && /\bnist\b/i.test(foundText)) {
    return "This clause directly imposes DFARS 252.204-7012 and requires implementation of the security requirements of NIST SP 800-171 on covered contractor information systems, creating direct compliance and implementation exposure for the Subcontractor.";
  }
  if (/\bdfars\b/i.test(foundText)) {
    return "This clause references DFARS 252.204-7012 and creates direct cybersecurity flowdown and compliance exposure for the Subcontractor.";
  }
  if (/\bnist\s+sp\s*800-171/i.test(foundText)) {
    return "This clause references the NIST SP 800-171 security baseline and creates direct cybersecurity implementation exposure for the Subcontractor.";
  }
  if (/\bcmmc\b/i.test(foundText)) {
    return "This clause references CMMC requirements and creates direct compliance exposure for the Subcontractor.";
  }
  if (/\bcui\b|\bcdi\b|controlled\s+unclassified\s+information/i.test(foundText)) {
    return "This clause addresses CUI/CDI handling and creates direct safeguarding and handling exposure for the Subcontractor.";
  }
  if (/cyber\s+incident\s+report/i.test(foundText)) {
    return "This clause requires cyber incident reporting and creates operational and reporting exposure for the Subcontractor.";
  }

  return "This clause imposes cybersecurity or data-protection obligations and creates direct compliance exposure for the Subcontractor.";
}

function clauseCandidates(documentText: string): ClauseSegment[] {
  return extractClauseSegments(documentText);
}

function findClauseCandidate(documentText: string, predicate: (clause: string) => boolean): string | null {
  return clauseCandidates(documentText).find((clause) => predicate(clause.text))?.text ?? null;
}

const NAMED_CONTRACT_DOCUMENT_RE =
  /statements?\s+of\s+work|\bSOWs?\b|flow[\s-]?down\s+(?:lists?|matrix|matrices)|Prime\s+Contract\s+excerpts?|required\s+(?:contract\s+)?attachments?|exhibits?|schedules?|appendices|\bSystem\s+Security\s+Plans?\b|\bSSP\b|CUI\s+marking\s+guide|network\s+boundary\s+diagram|data[\s-]flow\s+map|(?:Prime\s+)?(?:cyber(?:\/security)?|cybersecurity|security)\s+procedures?|cyber\s+attachment|security\s+attachment/i;
const DOCUMENT_ABSENCE_RE =
  /(?:is|are|remain|has|have)\s+not\s+(?:currently\s+|yet\s+)?(?:been\s+)?(?:attached|included|provided|available)|not\s+(?:currently\s+|yet\s+)?(?:attached|included|provided|available)|absent\s+from|unattached|missing/i;
const DOCUMENT_DEFERRAL_RE =
  /(?:will|shall|may)\s+be\s+(?:provided|furnished|attached|included)\s+(?:after\s+(?:execution|award|signing)|later)|(?:will|shall)\s+(?:provide|furnish|attach|include)[^.]{0,100}(?:after\s+(?:execution|award|signing)|later)/i;

function findMissingDocumentsCandidate(documentText: string): string | null {
  return findClauseCandidate(
    documentText,
    (block) => NAMED_CONTRACT_DOCUMENT_RE.test(block) && (DOCUMENT_ABSENCE_RE.test(block) || DOCUMENT_DEFERRAL_RE.test(block))
  );
}

function buildMissingDocumentsAnalysis(foundText: string): string {
  const isAbsent = DOCUMENT_ABSENCE_RE.test(foundText);
  const isDeferred = DOCUMENT_DEFERRAL_RE.test(foundText);
  if (isAbsent && isDeferred) {
    return "This clause states that the identified contract or cybersecurity documents are not attached and will be provided later, requiring the Subcontractor to execute before reviewing the complete stated package.";
  }
  if (isAbsent) {
    return "This clause states that the identified contract or cybersecurity documents are not attached, preventing the Subcontractor from reviewing the complete stated package before execution.";
  }
  return "This clause defers delivery of the identified contract or cybersecurity documents until after execution or award, preventing advance review of the complete stated package.";
}

const NO_PRICE_OR_SCHEDULE_ADJUSTMENT_RE =
  /without\s+(?:a\s+)?(?:price|schedule)(?:\s+or\s+(?:price|schedule))?\s+adjustment|no\s+(?:price|schedule)\s+adjustment/i;
const MUTUAL_CHANGE_PROTECTION_RE =
  /mutually\s+signed\s+(?:amendment|modification)|bilateral\s+(?:amendment|modification)|agreed\s+by\s+both\s+parties|(?:receive|provide|allow|entitle|right\s+to)[^.]{0,60}equitable\s+adjustment/i;

function findFutureCyberRequirementsCandidate(documentText: string): string | null {
  return findClauseCandidate(documentText, hasUnilateralFutureCyberEvidence);
}

function buildFutureCyberRequirementsAnalysis(foundText: string): string {
  const binding = /binding\s+(?:upon|on|after)\s+(?:written\s+)?notice|becomes?\s+binding/i.test(foundText);
  const noAdjustment = NO_PRICE_OR_SCHEDULE_ADJUSTMENT_RE.test(foundText);
  const consequences = [
    binding ? "makes them binding on notice" : null,
    noAdjustment ? "provides no price or schedule adjustment" : null,
  ].filter(Boolean);
  return `This clause allows Prime to add later cybersecurity or security requirements through the unilateral method stated in the quote${consequences.length ? `, ${consequences.join(" and ")}` : ""}, creating open-ended compliance exposure for the Subcontractor.`;
}

function findGeneralFutureFlowdownCandidate(documentText: string): string | null {
  return findClauseCandidate(documentText, (block) => {
    const futureFlowdown =
      /Prime(?:\s+Contractor)?\s+may\s+(?:incorporate|impose|issue|add)\s+(?:additional|revised|new|modified)(?:\s+or\s+(?:additional|revised|new|modified))?\s+flow[\s-]?down\s+requirements?/i.test(block) &&
      /(?:such|those|the)\s+requirements?\s+(?:become|are|shall\s+be)\s+binding\s+(?:upon|on|after)\s+(?:written\s+)?notice/i.test(block);
    const laterFlowdown =
      /flow[\s-]?down[^.]{0,160}(?:later[\s-]issued|future|subsequently\s+issued|hereafter\s+issued|issued\s+after\s+the\s+date)/i.test(block);
    const primeContractControl =
      /(?:terms|requirements)\s+of\s+the\s+prime\s+contract[^.]{0,100}(?:shall\s+)?(?:control|govern|take\s+precedence|prevail)/i.test(block) ||
      /Subcontractor\s+shall\s+be\s+bound\s+by[^.]{0,120}(?:later[\s-]issued|future|subsequent(?:ly)?\s+issued|modifications?\s+to\s+the\s+prime\s+contract)/i.test(block) ||
      /prime\s+contract\s+is\s+incorporated\s+(?:herein\s+)?by\s+reference[^.]{0,180}(?:whether\s+or\s+not|regardless\s+of\s+whether|even\s+if\s+not\s+attached)/i.test(block) ||
      /any\s+(?:changes?|modifications?|amendments?)\s+to\s+the\s+prime\s+contract[^.]{0,120}(?:automatically|shall)\s+(?:apply|flow\s+down|bind)/i.test(block);
    return (futureFlowdown || laterFlowdown || primeContractControl) && !MUTUAL_CHANGE_PROTECTION_RE.test(block);
  });
}

function buildGeneralFutureFlowdownAnalysis(foundText: string): string {
  if (/\bPrime\s+Contract\b/i.test(foundText)) {
    return "This clause makes referenced Prime Contract terms or later Prime Contract changes controlling or binding through the mechanism stated in the quote, creating open-ended compliance exposure for the Subcontractor.";
  }
  return "This clause makes additional or later-issued flowdown requirements binding on notice, creating open-ended compliance exposure for the Subcontractor.";
}

const CYBER_INCIDENT_CONTEXT_RE =
  /cyber(?:security)?\s+incident|security\s+incident|compromis(?:e|ed)|unauthorized\s+disclosure|malware(?:\s+event)?|lost\s+device|anomalous\s+access/i;
const INCIDENT_REPORTING_VERB_RE =
  /\b(?:report(?:ed|ing)?|notify|submit(?:s|ted|ting)?|provide(?:s|d|ing)?\s+(?:written\s+)?notice)\b/i;
const ACCELERATED_INCIDENT_DEADLINE_RE = /\bwithin\s+(?:8|eight|24|twenty[\s-]four)\s+hours?\b/i;

function hasAcceleratedIncidentReportingEvidence(clause: string): boolean {
  const incident = CYBER_INCIDENT_CONTEXT_RE.exec(clause);
  const reporting = INCIDENT_REPORTING_VERB_RE.exec(clause);
  const deadline = ACCELERATED_INCIDENT_DEADLINE_RE.exec(clause);
  if (!incident || !reporting || !deadline) return false;

  return Math.abs(reporting.index - incident.index) <= 220 && Math.abs(reporting.index - deadline.index) <= 180;
}

function findAcceleratedIncidentReportingCandidate(documentText: string): string | null {
  return findClauseCandidate(documentText, hasAcceleratedIncidentReportingEvidence);
}

function buildAcceleratedIncidentReportingAnalysis(foundText: string): string {
  const deadline = ACCELERATED_INCIDENT_DEADLINE_RE.exec(foundText)?.[0];
  return `This clause requires reporting of the stated cyber or security event ${deadline ?? "within the short deadline stated in the quote"}, creating accelerated operational and compliance exposure for the Subcontractor.`;
}

const RESPONSE_ACTIONS = [
  ["containment", /\bcontainment\b/i],
  ["isolation", /\bisolation\b/i],
  ["credential reset", /credential\s+reset/i],
  ["system shutdown", /system\s+shutdown/i],
  ["evidence collection", /evidence\s+collection/i],
  ["employee interviews", /employee\s+interviews?/i],
  ["forensic imaging", /forensic\s+imaging/i],
  ["customer notification", /customer\s+notification/i],
  ["restoration", /restoration(?:\s+actions?)?/i],
] as const;

const STRONG_CYBER_RESPONSE_ACTION_RE =
  /credential\s+reset|forensic\s+imaging|(?:system|network|host)\s+isolation|customer\s+notification|incident\s+restoration|system\s+shutdown|cyber(?:security)?\s+containment/i;
const SUBCONTRACTOR_RESPONSE_COST_RE =
  /Subcontractor[^.]{0,140}\bbear[^.]{0,60}(?:costs?|expenses?)|at\s+(?:the\s+)?Subcontractor(?:'s|\u2019s)\s+(?:own\s+)?(?:cost|expense)/i;

function findPrimeDirectedResponseCostCandidate(documentText: string): string | null {
  return findClauseCandidate(documentText, (block) => {
    const primeDirection = /Prime(?:\s+Contractor)?\s+may\s+direct|at\s+Prime(?:\s+Contractor)?(?:'s)?\s+direction/i.test(block);
    const cyberContext = /cyber(?:security)?|security\s+incident|incident\s+response|compromise|malware/i.test(block);
    const actionCount = RESPONSE_ACTIONS.filter(([, pattern]) => pattern.test(block)).length;
    const specificResponse = STRONG_CYBER_RESPONSE_ACTION_RE.test(block) || actionCount >= 3;
    return primeDirection && cyberContext && specificResponse && SUBCONTRACTOR_RESPONSE_COST_RE.test(block);
  });
}

function buildPrimeDirectedResponseAnalysis(foundText: string): string {
  const actions = RESPONSE_ACTIONS.filter(([, pattern]) => pattern.test(foundText)).map(([label]) => label);
  const actionText = actions.length > 0 ? actions.join(", ") : "the response actions stated in the quote";
  const immediate = /comply\s+immediately/i.test(foundText);
  const costBearing = SUBCONTRACTOR_RESPONSE_COST_RE.test(foundText);
  const consequences = [
    immediate ? "requires immediate compliance" : null,
    costBearing ? "places the associated cost on the Subcontractor" : null,
  ].filter(Boolean);
  return `This clause permits Prime to direct ${actionText} and ${consequences.join(" and ")}, creating operational${costBearing ? " and financial" : ""} exposure for the Subcontractor.`;
}

function findIntrusiveCyberAssessmentCandidate(documentText: string): string | null {
  return findClauseCandidate(documentText, (block) => {
    const assessment = /cybersecurity\s+assessments?|security\s+assessments?|cyber(?:security)?\s+audits?/i.test(block);
    const intrusive = /unannounced|at\s+any\s+time|systems?,\s+facilities?,\s+personnel|lower[\s-]tier\s+suppliers?|administrative\s+access/i.test(block);
    return assessment && intrusive;
  });
}

function findBroadCyberAccessCandidate(documentText: string): string | null {
  return findClauseCandidate(documentText, (block) => {
    const evidenceTerms = [
      /administrative\s+access/i,
      /network\s+diagrams?/i,
      /System\s+Security\s+Plans?/i,
      /plans\s+of\s+action\s+and\s+milestones/i,
      /vulnerability\s+scans?/i,
      /penetration[\s-]test\s+results?/i,
      /security\s+logs?/i,
      /incident\s+records?/i,
    ].filter((pattern) => pattern.test(block)).length;
    const broadAccess = /administrative\s+access|system\s+access|without\s+additional\s+charge/i.test(block);
    return broadAccess && evidenceTerms >= 2;
  });
}

function findRemediationNoEquitableAdjustmentCandidate(documentText: string): string | null {
  const candidates = clauseCandidates(documentText);
  const scheduleAndAdjustment = (text: string) =>
    /does\s+not\s+excuse\s+schedule\s+performance|shall\s+continue\s+schedule\s+performance/i.test(text) &&
    /does\s+not\s+entitle[^.]{0,100}equitable\s+adjustment|no\s+equitable\s+adjustment/i.test(text);

  for (const [index, current] of candidates.entries()) {
    if (!scheduleAndAdjustment(current.text) || !/suspension|remediation\s+directive/i.test(current.text)) continue;
    if (/cyber(?:security)?|security\s+posture/i.test(current.text)) return current.text;

    const previous = candidates[index - 1];
    if (
      previous &&
      areAdjacentNumberedClauses(previous, current) &&
      /cyber(?:security)?|security\s+posture/i.test(previous.text) &&
      /remediation|directive|suspension|deficien/i.test(previous.text)
    ) {
      return documentText.slice(previous.start, current.end).trim().replace(/\s+/g, " ");
    }
  }

  return null;
}

const EXPRESSED_PERCENTAGE_RE =
  /(?:up\s+to\s+)?(?:\d{1,3}(?:\.\d+)?|one\s+hundred|(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen)|(?:twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)(?:[\s-](?:one|two|three|four|five|six|seven|eight|nine))?)\s*(?:percent|%)/i;

function findPercentageInvoiceWithholdingCandidate(documentText: string): string | null {
  return findClauseCandidate(
    documentText,
    (block) =>
      /withhold/i.test(block) &&
      EXPRESSED_PERCENTAGE_RE.test(block) &&
      /invoice|payment/i.test(block) &&
      /cyber|security/i.test(block) &&
      /evidence|documentation|attestation|report/i.test(block)
  );
}

function buildPercentageInvoiceWithholdingAnalysis(foundText: string): string {
  const percentage = EXPRESSED_PERCENTAGE_RE.exec(foundText)?.[0] ?? "the stated percentage";
  const condition = /cyber\s+evidence|security\s+evidence|evidence/i.exec(foundText)?.[0];
  return `This clause permits Prime to withhold ${percentage} of an invoice${condition ? ` until the stated ${condition} is provided` : ""}, creating direct cash-flow exposure.`;
}

function findAllPaymentWithholdingCandidate(documentText: string): string | null {
  return findClauseCandidate(
    documentText,
    (block) =>
      /withhold\s+all\s+payments?/i.test(block) &&
      /incident\s+investigation|assessment\s+dispute|score\s+deficien|suspected[^.]{0,60}flow[\s-]?down\s+(?:failure|requirements?)/i.test(block)
  );
}

function buildAllPaymentWithholdingAnalysis(foundText: string): string {
  const conditions = [
    ["an incident investigation", /incident\s+investigation/i],
    ["an assessment dispute", /assessment\s+dispute/i],
    ["a score deficiency", /score\s+deficien/i],
    ["a suspected flowdown failure", /suspected[^.]{0,60}flow[\s-]?down\s+(?:failure|requirements?)/i],
  ] as const;
  const present = conditions.filter(([, pattern]) => pattern.test(foundText)).map(([label]) => label);
  return `This clause permits Prime to withhold all payment during ${present.join(", ")}, creating direct cash-flow exposure for the Subcontractor.`;
}

function findContinuedPerformanceDespiteWithholdingCandidate(documentText: string): string | null {
  return findClauseCandidate(
    documentText,
    (block) =>
      /withholding/i.test(block) &&
      /does\s+not\s+relieve|shall\s+continue|continued\s+performance/i.test(block) &&
      /continued\s+performance|performance\s+obligations?/i.test(block)
  );
}

const PAYMENT_OR_WITHHOLDING_CONTEXT_RE = /payment|withhold|invoice|amounts?\s+due|non[\s-]payment/i;

function findPaymentDisputeContinuedPerformanceCandidate(documentText: string): string | null {
  return findClauseCandidate(documentText, (block) => {
    const pendingMatter = /pending(?:\s+final\s+resolution\s+of)?\s+(?:any\s+)?(?:payment\s+)?(?:dispute|investigation)|during\s+(?:any\s+)?(?:payment\s+)?(?:dispute|investigation|delay)|despite[^.]{0,80}(?:payment|withhold)/i.test(block);
    const continuedPerformance = /continue\s+(?:performance|to\s+perform|(?:its\s+)?work)/i.test(block);
    return PAYMENT_OR_WITHHOLDING_CONTEXT_RE.test(block) && pendingMatter && continuedPerformance;
  });
}

function findSelfFinancedRemediationDuringDisputeCandidate(documentText: string): string | null {
  return findClauseCandidate(documentText, (block) => {
    const pendingMatter = /pending(?:\s+final\s+resolution\s+of)?\s+(?:any\s+)?(?:dispute|investigation)|during\s+(?:any\s+)?(?:dispute|investigation)/i.test(block);
    const continuedPerformance = /continue\s+(?:performance|to\s+perform|(?:its\s+)?work)/i.test(block);
    const localSelfFundingDuty = /finance[^.]{0,80}(?:required\s+)?remediation/i.test(block);
    return !PAYMENT_OR_WITHHOLDING_CONTEXT_RE.test(block) && pendingMatter && continuedPerformance && localSelfFundingDuty;
  });
}

function buildContinuedPerformanceAnalysis(foundText: string): string {
  const circumstances = [
    /\bdispute\b/i.test(foundText) ? "a dispute" : null,
    /\binvestigation\b/i.test(foundText) ? "an investigation" : null,
    /payment\s+(?:delay|issue)|withhold|non[\s-]payment/i.test(foundText) ? "a payment or withholding issue" : null,
  ].filter(Boolean);
  const duties = [
    /continue\s+(?:performance|to\s+perform|(?:its\s+)?work)/i.test(foundText) ? "continue performance" : null,
    /finance\s+all\s+required\s+remediation/i.test(foundText) ? "finance required remediation" : null,
    /finance\s+continued\s+performance/i.test(foundText) ? "finance continued performance" : null,
    /follow\s+Prime\s+direction/i.test(foundText) ? "follow Prime direction" : null,
  ].filter(Boolean);
  return `This clause requires the Subcontractor to ${duties.join(", ")} while ${circumstances.join(" or ")} remains pending, creating operational${/finance/i.test(foundText) ? " and self-financing" : ""} exposure.`;
}

function buildSelfFinancedRemediationDuringDisputeAnalysis(foundText: string): string {
  const circumstances = [
    /\bdispute\b/i.test(foundText) ? "a dispute" : null,
    /\binvestigation\b/i.test(foundText) ? "an investigation" : null,
  ].filter(Boolean);
  const duties = [
    /continue\s+(?:performance|to\s+perform|(?:its\s+)?work)/i.test(foundText) ? "continue performance" : null,
    /finance[^.]{0,80}(?:required\s+)?remediation/i.test(foundText) ? "finance required remediation" : null,
    /follow\s+Prime\s+direction/i.test(foundText) ? "follow Prime direction" : null,
    /no\s+(?:mission[\s-])?work\s+delay/i.test(foundText) ? "avoid mission-work delay" : null,
  ].filter(Boolean);
  return `This clause requires the Subcontractor to ${duties.join(", ")} while ${circumstances.join(" or ")} remains pending, creating operational and self-financing exposure.`;
}

function findUncappedCyberLiabilityCandidate(documentText: string): string | null {
  const uncappedSignal = /no\s+limitation\s+of\s+liability\s+applies\s+to|(?:liability|obligations?|claims?)[^.]{0,100}(?:uncapped|unlimited)|(?:uncapped|unlimited)[^.]{0,100}(?:liability|obligations?|claims?)/i;
  const coveredCategory = /cybersecurity|cyber\b|confidentiality|data\s+handling|incident\s+reporting|intellectual[\s-]property|\bIP\b|indemnity|indemnification/i;
  return findClauseCandidate(documentText, (block) => uncappedSignal.test(block) && coveredCategory.test(block));
}

function buildUncappedCyberLiabilityAnalysis(foundText: string): string {
  const categories = [
    ["cybersecurity", /cybersecurity|cyber\b/i],
    ["confidentiality", /confidentiality/i],
    ["data handling", /data\s+handling/i],
    ["incident reporting", /incident\s+reporting/i],
    ["intellectual property", /intellectual[\s-]property|\bIP\b/i],
    ["indemnity", /indemnity|indemnification/i],
  ] as const;
  const present = categories.filter(([, pattern]) => pattern.test(foundText)).map(([label]) => label);
  return `This clause makes the identified ${present.join(", ")} obligations uncapped, creating liability exposure without a stated cap for those categories.`;
}

function buildTerminationForConvenienceAnalysis(foundText: string): string {
  const noticePhrase = /(?:on|upon)\s+((?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|forty|fifty|sixty)(?:[\s-](?:one|two|three|four|five|six|seven|eight|nine))?\s+(?:calendar\s+|business\s+|working\s+)?days?)(?:'|\s)*(?:written\s+)?notice/i.exec(foundText)?.[1];
  const shortNotice = noticePhrase
    ? ` on ${noticePhrase} notice`
    : hasAffirmativeImmediateTerminationForConvenienceEvidence(foundText)
      ? " immediately or without notice"
      : "";
  const excludedRecovery = /not\s+liable|no\s+liability|excluded|recovery\s+is\s+limited|accepted\s+work/i.test(foundText);
  return `This clause permits Prime to terminate for convenience${shortNotice}${excludedRecovery ? " while limiting the recovery categories stated in the quote" : ""}, creating termination and cost-recovery exposure for the Subcontractor.`;
}

function buildCureTerminationAnalysis(foundText: string): string {
  const immediate = /terminate[^.]{0,60}immediately/i.test(foundText);
  const noCure = /without[^.]{0,50}(?:right|opportunity)\s+to\s+cure|no\s+(?:right|opportunity)\s+to\s+cure/i.test(foundText);
  const cureDays = /(?<!\d)([1-9]|10)(?!\d)\s*(?:calendar|business|working)?\s*days?\s+to\s+cure/i.exec(foundText)?.[0];
  if (immediate && noCure) {
    return "This clause permits immediate termination without a right to cure, allowing the stated triggering event to end the subcontract before the Subcontractor can remedy it.";
  }
  if (cureDays) {
    return `This clause provides only ${cureDays} before default termination may follow, giving the Subcontractor a narrow opportunity to remedy the stated default.`;
  }
  return "This clause gives Prime immediate or broad termination discretion without a meaningful cure opportunity, creating default-termination exposure for the Subcontractor.";
}

function buildGeneralWithholdingAnalysis(foundText: string): string {
  const action = /set[\s-]?off/i.test(foundText)
    ? "set off"
    : /back[\s-]?charge/i.test(foundText)
      ? "backcharge"
      : /deduct/i.test(foundText)
        ? "deduct"
        : /reduce/i.test(foundText)
          ? "reduce"
          : "withhold";
  return `This clause permits Prime to ${action} amounts under the conditions stated in the quote, creating direct payment exposure for the Subcontractor.`;
}

const CATEGORIES: DeterministicCategory[] = [
  {
    familyKey: "payment",
    regulation: "Pay-if-Paid / Contingent Government-Payment Clause",
    severity: "High",
    patterns: [
      /pay[\s-]if[\s-]paid/i,
      // "Prime will pay Subcontractor within N days AFTER Prime receives
      // payment from the Government" - the payment obligation's own timing is
      // expressly tied to the Government paying Prime first. This is the most
      // common real-world phrasing of pay-if-paid/pay-when-paid and is at
      // least as clear a trigger as the "contingent upon"/"condition
      // precedent" legalese the patterns below already catch, so it's placed
      // second (right after the literal "pay-if-paid" phrase) rather than
      // buried after the more legalistic patterns.
      /(?:will|shall)\s+pay\s+Subcontractor[^.]{0,80}(?:after|once|when)\s+Prime(?:\s+Contractor)?\s+(?:receives|has\s+received)[^.]{0,100}payment\s+from\s+the\s+Government/i,
      /contingent\s+(?:upon|on)\s+(?:the\s+)?(?:receipt\s+of\s+)?payment\s+(?:by|from|received\s+from)\s+(?:the\s+)?(?:government|customer|owner|prime)/i,
      /no\s+obligation\s+to\s+pay\s+(?:the\s+)?subcontractor\s+unless/i,
      /shall\s+not\s+be\s+obligated\s+to\s+pay[^.]{0,100}unless\s+(?:and\s+until\s+)?(?:[A-Za-z ]+\s+)?(?:has\s+|have\s+)?receive[sd]/i,
      /receipt\s+of\s+(?:such\s+)?payment\s+from\s+the\s+government\s+is\s+a\s+condition\s+precedent/i,
      /condition\s+precedent\s+to[^.]{0,60}(?:payment|obligation\s+to\s+pay)[^.]{0,80}(?:government|owner)/i,
      // Broadened from a "not received" -only match: real phrasing as often
      // says "amounts not PAID BY the Government" as "not received FROM the
      // Government" - both describe the identical risk (Prime disclaiming any
      // obligation to pay amounts the Government didn't pay it), so both verb
      // and preposition are now accepted.
      /(?:shall\s+have\s+)?no\s+obligation\s+to\s+pay[^.]{0,120}(?:amounts?|sums?)[^.]{0,80}not\s+(?:received|paid)[^.]{0,60}(?:from\s+|by\s+)?(?:the\s+)?(?:government|owner|customer|prime)/i,
      // Mirror/pass-through clause: the Government's nonpayment/delay/dispute
      // toward Prime is expressly passed through to Subcontractor "to the
      // same extent." Both verb lists are comma-separated in real prose
      // ("delays, disputes, reduces, rejects, or withholds" / "delay, reduce,
      // or withhold"), so bounded [^.] gaps sit between the verb and its
      // object rather than requiring direct adjacency.
      /(?:Government|Owner)\s+(?:delays|disputes|reduces|rejects|withholds)[^.]{0,120}payment\s+to\s+Prime(?:\s+Contractor)?[\s\S]{0,150}Prime(?:\s+Contractor)?\s+may[^.]{0,60}(?:delay|reduce|withhold)[^.]{0,60}payment\s+to\s+Subcontractor/i,
    ],
    riskAnalysis:
      "This clause makes the Subcontractor's right to payment contingent on the Prime actually receiving funds from the Government, shifting the Government's payment risk - including delay, dispute, or non-payment - onto the Subcontractor even though the Subcontractor has no contractual relationship with or visibility into the Government's payment process.",
    redlineFix:
      "Replace any pay-if-paid language with a pay-when-paid structure tied to a fixed outside date (e.g., Net 30/45 from invoice) that applies regardless of when or whether the Prime is paid by the Government.",
  },
  {
    familyKey: "payment",
    regulation: "No Guaranteed Workshare, Hours, or Revenue",
    severity: "Medium-High",
    patterns: [
      // Broad negation-then-target pattern: catches "does not guarantee any
      // specific number of labor hours...", "does not create a minimum
      // workshare...", "do not represent guaranteed hours/revenue/workshare..."
      // - real GovCon phrasing rarely puts the negation word directly next to
      // the target noun the way a narrower pattern would assume.
      /(?:no\s+(?:guarantee|guaranty)|does?\s+not\s+guarantee|does?\s+not\s+create|does?\s+not\s+represent)[^.]{0,150}(?:hours|work\s+packages|task\s+assignments|task\s+orders|revenue|workshare|work\s+share|level\s+of\s+effort|quantity|quantities|volume|minimum\s+payment)/i,
      /no\s+minimum\s+(?:quantity|quantities|purchase|order|hours|work|revenue)\s+(?:is|are)\s+guaranteed/i,
      /Prime\s+(?:Contractor\s+)?makes\s+no\s+(?:representation|guarantee|warranty)[^.]{0,150}(?:work|hours|orders|volume|revenue|task\s+order)/i,
      /(?:estimated?|planning\s+estimates?)[^.]{0,80}(?:do|does)\s+not\s+(?:represent|create)[^.]{0,100}(?:guaranteed|minimum)/i,
      /(?:volume|timing|mix)\s+of\s+work\s+will\s+depend\s+on\s+(?:government|customer|owner)\s+needs/i,
    ],
    riskAnalysis:
      "Because the subcontract does not guarantee any minimum hours, task orders, workshare, or revenue, the Subcontractor bears the full risk of the Prime allocating little or no actual work, even though the Subcontractor may have priced or staffed the effort assuming a meaningful volume.",
    redlineFix:
      "Negotiate a minimum guaranteed workshare, task order commitment, or minimum billable hours/revenue floor, or at least a right to renegotiate pricing/staffing if actual volume falls materially below the estimate.",
  },
  {
    familyKey: "payment",
    regulation: "Short Notice-of-Claim / Change Notice Waiver",
    severity: "Medium-High",
    patterns: [
      // Strongest form first: the operative verb can precede "within N
      // days", and the waiver can sit two nearby sentences later after a
      // second substantiation deadline. Small spelled-out day counts are
      // included because the controlled Fixture A clause uses "three" and
      // "five", while extracted contracts commonly preserve either words
      // or digits. Requiring a broad claim/REA/time/compensation consequence
      // keeps an ordinary funding-exhaustion heads-up outside this pattern.
      /(?:Subcontractor\s+)?(?:must|shall|will|is\s+required\s+to)\s+(?:provide|give|submit)\s+(?:written\s+)?notice[^.]{0,140}within\s+(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s*(?:calendar|business|working)?\s*days?[\s\S]{0,700}(?:fail(?:ure|ing)?\s+to|if\s+Subcontractor\s+fails?\s+to|miss(?:ed|ing)\s+(?:either\s+)?deadline)[^.]{0,240}(?:constitutes?|results?\s+in)\s+(?:a\s+)?(?:complete\s+)?waiver[^.]{0,220}(?:request\s+for\s+equitable\s+adjustment|claim|delay\s+relief|schedule\s+extension|additional\s+compensation)/i,
      // Cross-sentence pattern first, so it wins the earliest-match tiebreak
      // and the extracted quote captures BOTH the notice deadline (e.g. "3
      // business days") and its waiver consequence, even when the document
      // states them as two separate sentences - [\s\S] deliberately crosses
      // the sentence boundary here (unlike the [^.] patterns below), bounded
      // to 250 chars so it can't wander into an unrelated clause.
      /notify[^.]{0,100}within\s+\d+\s*(?:calendar|business|working)?\s*days?[\s\S]{0,250}(?:waive[sd]?|forfeit|bar(?:red)?|relinquish|constitutes?\s+a\s+waiver)/i,
      /fail(?:ure|s)?\s+(?:by\s+(?:the\s+)?Subcontractor\s+)?to\s+(?:provide|give|submit)[^.]{0,60}notice[^.]{0,150}(?:waive[sd]?|forfeit|bar(?:red)?|relinquish|constitutes?\s+a\s+waiver)/i,
      /waive[sd]?[^.]{0,100}(?:right\s+to|entitlement\s+to)[^.]{0,80}(?:claim|compensation|equitable\s+adjustment|time\s+extension|additional\s+time|schedule\s+relief)/i,
      /within\s+\d+\s*(?:calendar|business|working)?\s*days?[^.]{0,100}(?:notice\s+of\s+(?:claim|change|delay)|written\s+notice)[^.]{0,150}(?:waive|forfeit|bar(?:red)?|deemed\s+waived)/i,
    ],
    riskAnalysis:
      "This clause conditions the Subcontractor's right to compensation or a schedule extension on giving notice within a narrow window, meaning a missed or late notice - even for a legitimate change or delay caused by the Prime or Government - can permanently forfeit the Subcontractor's claim.",
    redlineFix:
      "Extend the notice period to a commercially reasonable window, add a materiality/prejudice qualifier so late notice does not forfeit the claim unless it actually prejudiced the Prime, and add a reasonable-excuse exception.",
  },
  {
    familyKey: "structure",
    regulation: "Missing / Deferred Contract Documents",
    severity: "Medium",
    patterns: [],
    findCandidate: findMissingDocumentsCandidate,
    riskAnalysis:
      "The clause states that identified contract documents are absent or deferred, preventing complete review before execution.",
    redlineFix:
      "Require the missing Statement of Work, flowdown matrix, Prime Contract excerpts, or other identified attachments to be provided and reviewed before execution, and state that no later document binds the Subcontractor without a signed bilateral amendment.",
    buildRiskAnalysis: buildMissingDocumentsAnalysis,
  },
  {
    familyKey: "structure",
    regulation: "Broad Future Flowdowns / Prime Contract Control",
    severity: "Medium",
    patterns: [],
    findCandidate: findGeneralFutureFlowdownCandidate,
    riskAnalysis:
      "This clause makes later flowdown or Prime Contract requirements binding through the mechanism stated in the quote, creating open-ended compliance exposure.",
    redlineFix:
      "Require that all flowdown terms and any later-issued or modified prime contract requirements be provided to the Subcontractor in writing and apply only prospectively after the Subcontractor's written acknowledgment, with a right to price or schedule relief for materially burdensome new requirements.",
    buildRiskAnalysis: buildGeneralFutureFlowdownAnalysis,
  },
  {
    familyKey: "cyber",
    regulation: "Unilateral Future Cybersecurity Requirements",
    severity: "Medium-High",
    patterns: [],
    findCandidate: findFutureCyberRequirementsCandidate,
    riskAnalysis:
      "This clause permits later cybersecurity requirements to become binding through a unilateral mechanism, creating open-ended compliance exposure.",
    redlineFix:
      "Require a mutually signed bilateral amendment and an agreed price or schedule adjustment before any new cybersecurity, CMMC, cloud-security, or customer-security requirement becomes binding.",
    buildRiskAnalysis: buildFutureCyberRequirementsAnalysis,
  },
  {
    familyKey: "liability",
    regulation: "Broad Indemnification / Duty to Defend",
    severity: "High",
    patterns: [
      /indemnify[^.]{0,60}(?:and\s+)?hold\s+harmless/i,
      // Bare "duty to defend" is negation-blind on its own - "Neither party
      // HAS a duty to defend", "Neither party SHALL HAVE any duty to
      // defend", "No party HAS a duty to defend", and "[X] HAS NO / HAVE NO
      // duty to defend" are all real, common protective phrasings that
      // state the OPPOSITE of what this pattern is meant to catch. The
      // lookbehinds below block only those specific negation shapes
      // immediately preceding "duty to defend" - an affirmative clause like
      // "Subcontractor has a duty to defend Prime Contractor" or an
      // aggressive one like "Subcontractor's duty to defend is not limited
      // by insurance" (where "not" is nowhere near "duty to defend") still
      // matches normally. If this pattern fails to match at a protective
      // occurrence, re.exec() naturally continues scanning forward for a
      // later, unblocked "duty to defend" elsewhere in the document - it
      // does not consume the category's one-finding slot on the false
      // positive.
      /(?<!neither\s+party\s+has\s+(?:a\s+|any\s+)?)(?<!neither\s+party\s+shall\s+have\s+(?:a\s+|any\s+)?)(?<!no\s+party\s+has\s+(?:a\s+|any\s+)?)(?<!has\s+no\s+)(?<!have\s+no\s+)duty\s+to\s+defend/i,
      /defend,?\s+indemnify/i,
      /indemnify[^.]{0,150}(?:any\s+alleged|alleged\s+(?:violation|noncompliance|breach))/i,
      /regardless\s+of\s+(?:whether\s+)?(?:such\s+)?(?:claim|allegation)[^.]{0,80}(?:fault|negligence)\s+of\s+(?:the\s+)?Prime/i,
    ],
    riskAnalysis:
      "This clause requires the Subcontractor to indemnify, defend, or hold harmless the beneficiaries against the claims and losses described in the quote, creating broad defense and liability exposure.",
    redlineFix:
      "Narrow indemnification to claims arising from the Subcontractor's own negligence, willful misconduct, or breach, exclude indemnification for the Prime's own negligence or fault, and cap defense-cost exposure.",
  },
  {
    familyKey: "liability",
    regulation: "Termination for Convenience",
    severity: "Medium",
    patterns: [],
    findCandidate: findTerminationForConvenienceCandidate,
    riskAnalysis:
      "This termination-for-convenience clause allows the Prime to end the subcontract on short notice with limited recovery, leaving the Subcontractor unable to recoup committed costs, staffing investments, or anticipated profit on terminated work.",
    redlineFix:
      "Extend the notice period and ensure the termination-for-convenience settlement includes recovery of all reasonable costs incurred, committed subcontractor/vendor obligations, and a reasonable profit component on completed work.",
    buildRiskAnalysis: buildTerminationForConvenienceAnalysis,
  },
  {
    familyKey: "liability",
    regulation: "Short Default Cure Period / Termination Discretion",
    severity: "Medium-High",
    patterns: [
      // Cross-sentence pattern first (see notice-waiver category above for
      // why): catches "will provide Subcontractor 5 calendar days to cure the
      // default" (day-count BEFORE "cure", the common real-world order)
      // followed by a separate sentence granting Prime immediate-termination
      // discretion, and pulls both into one quote.
      /\d+\s*(?:calendar|business|working)?\s*days?\s+to\s+cure[\s\S]{0,250}terminate[^.]{0,40}immediately/i,
      // Either word order: "N days to cure" or "cure ... within N days".
      // Bounded to 1-SHORT_CURE_MAX_DAYS (10) days: a standalone cure-period
      // mention with no paired immediate-termination language is only a
      // "short cure" risk on its own when the stated period is actually
      // short. A 30-day (or 11+ day) standalone cure period - even one that
      // adds a diligent-cure extension - is a commercially reasonable term
      // and must not trigger here; the immediate-termination/no-notice/
      // sole-discretion patterns below remain unbounded since Prime
      // retaining that discretion is a real risk regardless of the stated
      // cure period's length. Keep the literal 1-10 range in sync with
      // SHORT_CURE_MAX_DAYS above. (?<!\d)...(?!\d) on each side of the
      // 1-10 fragment are required digit boundaries - without them, "11"
      // partial-matches (e.g. the fragment can match just the trailing "1"
      // of "11" as if it were its own single-digit "1 day" count), which
      // wrongly triggered on an 11-day cure period.
      /(?:(?<!\d)(?:[1-9]|10)(?!\d)\s*(?:calendar|business|working)?\s*days?\s+to\s+cure|cure\s+(?:period|such\s+default|any\s+such\s+failure)[^.]{0,80}(?:within\s+)?(?<!\d)(?:[1-9]|10)(?!\d)\s*(?:calendar|business|working)?\s*days?)/i,
      /fail(?:s|ure)?\s+to\s+cure[^.]{0,100}within\s+(?<!\d)(?:[1-9]|10)(?!\d)\s*(?:calendar|business|working)?\s*days?/i,
      // "terminate for default...without notice" alone doesn't distinguish
      // a real risk (Prime MAY terminate without notice) from a protective
      // prohibition (Neither party MAY terminate...without notice - i.e.
      // termination without notice is NOT allowed). The lookbehinds below
      // block only when "terminat(e/ion)" is immediately preceded by one of
      // those negation shapes; an unrelated "Prime Contractor may
      // terminate..." match elsewhere in the document is untouched, and
      // re.exec() naturally continues scanning past a blocked protective
      // occurrence to find a later real one instead of consuming the
      // category's one-finding slot.
      /(?<!neither\s+party\s+may\s+)(?<!no\s+party\s+may\s+)(?<!may\s+not\s+)(?<!shall\s+not\s+)terminat(?:e|ion)[^.]{0,50}for\s+default(?![^.]{0,150}(?:may|shall)\s+not\s+terminate[^.]{0,60}immediately)[^.]{0,150}(?:immediately|without\s+(?:further\s+)?notice|in\s+its\s+sole\s+discretion|at\s+its\s+sole\s+discretion)/i,
      /Prime(?:\s+Contractor)?\s+may[^.]{0,60}terminate[^.]{0,80}for\s+default(?![^.]{0,150}(?:may|shall)\s+not\s+terminate[^.]{0,60}immediately)[^.]{0,100}(?:immediately|sole\s+discretion|without\s+notice)/i,
      // Immediate-termination discretion without requiring the literal phrase
      // "for default" - real contracts often phrase this as broad
      // determination-based discretion instead ("may terminate immediately if
      // it determines the issue could affect..."). "terminate" and
      // "immediately" allow a bounded gap since an object often sits between
      // them ("terminate this Subcontract for default immediately").
      // Requiring an affirmative "Prime may" subject also preserves the
      // protective "Prime may not terminate immediately..." guard. The
      // determination subject can be "it", "Prime", or "the Prime", and a
      // no-right/no-opportunity-to-cure phrase can intervene after
      // "immediately".
      /Prime(?:\s+Contractor)?\s+may\s+terminate[^.]{0,50}immediately[^.]{0,180}(?:if\s+(?:it|(?:the\s+)?Prime(?:\s+Contractor)?)\s+determines|in\s+its\s+(?:sole\s+)?discretion|without\s+(?:further\s+)?notice|without\s+(?:(?:any|a|an)\s+)?(?:right|opportunity)\s+to\s+cure)/i,
    ],
    riskAnalysis:
      "A short cure period combined with broad Prime discretion to terminate for default means routine performance issues can escalate into a default termination before the Subcontractor has a realistic opportunity to fix the issue, which can trigger consequences far beyond the value of the underlying issue.",
    redlineFix:
      "Extend the cure period to a commercially reasonable timeframe, require written notice specifying the exact default before any termination, and add a right to dispute the default determination before termination takes effect.",
    buildRiskAnalysis: buildCureTerminationAnalysis,
  },
  {
    familyKey: "liability",
    regulation: "Prime-Only Liability Cap Tied to Government Payments Received",
    severity: "High",
    patterns: [
      // Broad infix gaps throughout: real phrasing is "limited to amounts
      // actually received BY PRIME CONTRACTOR FROM the Government" - the
      // extra "Prime Contractor" words between "by"/"from" and "Government"
      // broke the original tightly-adjacent version of this pattern.
      /liability[^.]{0,120}(?:limited\s+to|shall\s+not\s+exceed|not\s+to\s+exceed)[^.]{0,150}receive[ds]?[^.]{0,60}(?:the\s+)?[Gg]overnment/i,
      /Prime(?:\s+Contractor)?(?:'s)?\s+(?:total\s+)?liability\s+to\s+(?:the\s+)?Subcontractor[^.]{0,150}(?:government|amounts?\s+(?:actually\s+)?receive[ds]?)/i,
      /in\s+no\s+event\s+shall\s+(?:the\s+)?Prime(?:\s+Contractor)?(?:'s)?\s+liability[^.]{0,150}(?:exceed|be\s+greater\s+than)[^.]{0,150}receive[ds]?[^.]{0,60}(?:the\s+)?[Gg]overnment/i,
    ],
    riskAnalysis:
      "Capping the Prime's liability to only amounts it has actually received from the Government means the Subcontractor may have no meaningful recovery at all if the Government withholds, delays, or disputes payment to the Prime - even where the Prime is otherwise at fault.",
    redlineFix:
      "Negotiate a liability cap based on the subcontract value (or a multiple of fees paid to date) rather than amounts the Prime actually receives from the Government, so recovery isn't contingent on a payment stream outside the Subcontractor's control.",
  },
  {
    familyKey: "liability",
    regulation: "Continue-Performance Obligation During Payment Dispute",
    severity: "Medium-High",
    patterns: [],
    findCandidate: findPaymentDisputeContinuedPerformanceCandidate,
    riskAnalysis:
      "This clause requires the Subcontractor to keep performing and funding the work even while payment is delayed, withheld, or disputed, forcing the Subcontractor to carry the Prime's or Government's cash-flow risk with its own working capital.",
    redlineFix:
      "Add a right to suspend performance without penalty if payment is withheld or delayed beyond a defined period, or at minimum a right to interest or added costs for continued performance during an unresolved payment dispute.",
    buildRiskAnalysis: buildContinuedPerformanceAnalysis,
  },
  {
    familyKey: "liability",
    regulation: "Continued Performance / Self-Financed Remediation During Dispute",
    severity: "Medium-High",
    patterns: [],
    findCandidate: findSelfFinancedRemediationDuringDisputeCandidate,
    riskAnalysis:
      "This clause requires continued performance and self-financed remediation while a dispute or investigation remains pending, creating operational and financing exposure.",
    redlineFix:
      "Permit suspension of disputed remediation work without default, require documented Prime direction, and provide schedule and cost relief for continued performance while the matter is unresolved.",
    buildRiskAnalysis: buildSelfFinancedRemediationDuringDisputeAnalysis,
  },
  {
    familyKey: "cyber",
    regulation: "DFARS 252.204-7012 / CUI / NIST SP 800-171 Cybersecurity Flowdown",
    severity: "High",
    patterns: [
      /DFARS\s*252\.204-7012|252\.204-7012/i,
      /NIST\s*SP\s*800-171/i,
      /\bCMMC\b/i,
      /controlled\s+unclassified\s+information|\bCUI\b|\bCDI\b/i,
      /cyber\s+incident\s+report(?:ing)?/i,
    ],
    riskAnalysis:
      "This clause directly imposes DFARS 252.204-7012 and requires implementation of the security requirements of NIST SP 800-171 on covered contractor information systems, creating direct compliance and implementation exposure for the Subcontractor.",
    redlineFix:
      "Request the actual DFARS 252.204-7012 / CUI / NIST SP 800-171 baseline and confirm any required implementation details before execution.",
    buildRiskAnalysis: buildCyberBaselineAnalysis,
  },
  {
    familyKey: "liability",
    regulation: "Uncapped Cyber Liability",
    severity: "High",
    patterns: [],
    findCandidate: findUncappedCyberLiabilityCandidate,
    riskAnalysis:
      "This clause states that no limitation of liability applies to the identified cyber or data-protection obligations, leaving the Subcontractor exposed to uncapped liability for those categories.",
    redlineFix:
      "Add a reasonable liability cap or carve-out for the identified cyber/confidentiality/data-handling obligations, or at minimum limit the uncapped exposure to the specific categories actually priced and accepted under the subcontract.",
    buildRiskAnalysis: buildUncappedCyberLiabilityAnalysis,
  },
  {
    familyKey: "cyber",
    regulation: "Accelerated Cyber Incident Reporting",
    severity: "High",
    patterns: [],
    findCandidate: findAcceleratedIncidentReportingCandidate,
    riskAnalysis:
      "This clause requires the Subcontractor to report a suspected cyber or security incident within a short stated deadline, creating operational and compliance exposure if the incident is not reported promptly.",
    redlineFix:
      "Replace the short incident-reporting deadline with a commercially reasonable notice period and require the incident trigger and reporting obligations to be defined clearly.",
    buildRiskAnalysis: buildAcceleratedIncidentReportingAnalysis,
  },
  {
    familyKey: "cyber",
    regulation: "Prime-Directed Cyber Response Costs",
    severity: "High",
    patterns: [],
    findCandidate: findPrimeDirectedResponseCostCandidate,
    riskAnalysis:
      "This clause allows Prime to direct response actions and requires the Subcontractor to comply immediately and bear the associated cost, creating direct operational and financial exposure.",
    redlineFix:
      "Require Prime direction to be reasonable and documented, and allocate response costs through a defined process rather than automatic Subcontractor cost-bearing.",
    buildRiskAnalysis: buildPrimeDirectedResponseAnalysis,
  },
  {
    familyKey: "audit",
    regulation: "Intrusive Cybersecurity Assessments",
    severity: "Medium-High",
    patterns: [],
    findCandidate: findIntrusiveCyberAssessmentCandidate,
    riskAnalysis:
      "This clause permits the intrusive cybersecurity assessments and access scope stated in the quote, creating operational and confidentiality exposure.",
    redlineFix:
      "Require reasonable advance notice, business-hours access, defined assessment scope, confidentiality protections, and limits on access to systems, facilities, personnel, and lower-tier suppliers.",
  },
  {
    familyKey: "audit",
    regulation: "Broad Cybersecurity System Access / Evidence Production",
    severity: "Medium-High",
    patterns: [],
    findCandidate: findBroadCyberAccessCandidate,
    riskAnalysis:
      "This clause requires the administrative or system access and broad cybersecurity evidence production stated in the quote, creating security, confidentiality, and operational exposure.",
    redlineFix:
      "Limit access and evidence production to defined, relevant records through a secure process, with reasonable notice, least-privilege controls, confidentiality protections, and compensation for material out-of-scope support.",
  },
  {
    familyKey: "cyber",
    regulation: "Uncompensated Cyber Remediation / No Equitable Adjustment",
    severity: "Medium-High",
    patterns: [],
    findCandidate: findRemediationNoEquitableAdjustmentCandidate,
    riskAnalysis:
      "This clause requires schedule performance to continue during a suspension or remediation directive and denies an equitable adjustment, creating uncompensated schedule and remediation exposure.",
    redlineFix:
      "Provide schedule relief and an equitable adjustment for Prime-directed suspension or remediation unless the directive results solely from the Subcontractor's proven material breach.",
  },
  {
    familyKey: "payment",
    regulation: "Percentage Invoice Withholding",
    severity: "Medium-High",
    patterns: [],
    findCandidate: findPercentageInvoiceWithholdingCandidate,
    riskAnalysis:
      "This clause permits Prime to withhold the stated percentage of an invoice until the stated cyber evidence is provided, creating direct cash-flow exposure.",
    redlineFix:
      "Limit withholding to a documented, proportionate amount tied to a material deficiency, with notice, a cure period, and prompt release of undisputed invoice amounts.",
    buildRiskAnalysis: buildPercentageInvoiceWithholdingAnalysis,
  },
  {
    familyKey: "payment",
    regulation: "All-Payment Withholding",
    severity: "High",
    patterns: [],
    findCandidate: findAllPaymentWithholdingCandidate,
    riskAnalysis:
      "This clause permits Prime to withhold all payment during the conditions stated in the quote, creating direct cash-flow exposure.",
    redlineFix:
      "Limit withholding to documented disputed amounts, require notice and a cure or dispute process, and require timely payment of all undisputed amounts.",
    buildRiskAnalysis: buildAllPaymentWithholdingAnalysis,
  },
  {
    familyKey: "liability",
    regulation: "Continued Performance Despite Payment Withholding",
    severity: "Medium-High",
    patterns: [],
    findCandidate: findContinuedPerformanceDespiteWithholdingCandidate,
    riskAnalysis:
      "This clause states that withholding does not relieve the Subcontractor from continued performance, creating operational and cash-flow exposure while payment remains withheld.",
    redlineFix:
      "Add a right to suspend affected performance if withheld amounts remain unresolved beyond a defined period, without default or schedule penalty.",
  },
  {
    familyKey: "payment",
    regulation: "Broad Setoff / Backcharge / Withholding Rights",
    severity: "Medium-High",
    patterns: [
      /Prime(?:\s+Contractor)?\s+may\s+(?:offset|deduct|set[\s-]?off|withhold|charge\s+back|back[\s-]?charge)[^.]{0,150}(?:any\s+(?:costs?|amounts?|sums?|damages?)|from\s+(?:any\s+)?(?:payments?|amounts?\s+(?:due|owed)))/i,
      /right\s+to\s+(?:offset|set[\s-]?off|deduct|withhold|backcharge|back[\s-]?charge)[^.]{0,150}(?:any\s+(?:amounts?|costs?|sums?)|from\s+(?:any\s+)?payments?)/i,
      /(?:set[\s-]?off|backcharge|back[\s-]?charge)[^.]{0,150}(?:any\s+(?:amounts?|costs?)|amounts?\s+(?:owed|due)|reduce\s+payment)/i,
      /Prime(?:\s+Contractor)?\s+(?:shall|may)\s+(?:reduce|withhold)\s+(?:any\s+)?payment[^.]{0,150}(?:cost|damages?|expense|claim)/i,
    ],
    riskAnalysis:
      "This clause permits Prime to set off, backcharge, deduct, reduce, or withhold amounts under the conditions stated in the quote, creating direct payment exposure.",
    redlineFix:
      "Narrow the setoff/backcharge right to amounts that are undisputed, documented, and subject to advance written notice and a right to contest before any deduction is taken from payment otherwise due.",
    buildRiskAnalysis: buildGeneralWithholdingAnalysis,
  },
  {
    familyKey: "liability",
    regulation: "Out-of-State Venue, Governing Law, or Arbitration Burden",
    severity: "Medium",
    patterns: [
      // "governed by the laws of the Commonwealth/State of X" is at least as
      // common in real subcontracts as the "governing law" heading phrase -
      // the original pattern only recognized the latter.
      /(?:governing\s+law|governed\s+by\s+the\s+laws\s+of)[^.]{0,100}(?:State\s+of|Commonwealth\s+of)\s+[A-Z][a-zA-Z]+/i,
      /(?:exclusive\s+)?(?:venue|jurisdiction)\s+(?:shall\s+be\s+|is\s+|lies\s+|must\s+be\s+)?(?:in|located\s+in)[^.]{0,100}(?:courts?\s+of|State\s+of|County\s+of|Commonwealth\s+of)/i,
      /binding\s+arbitration/i,
      /(?:disputes?|claims?)\s+(?:arising[^.]{0,60})?(?:shall\s+be\s+|will\s+be\s+)?(?:resolved|settled|decided)\s+(?:exclusively\s+)?(?:through|by|via)\s+(?:binding\s+)?arbitration/i,
      // Catches "arbitration, mediation, or court proceeding must be brought
      // in [County/State/Commonwealth]" phrasing that doesn't use the word
      // "venue" or "jurisdiction" at all.
      /(?:arbitration|mediation|court\s+proceeding)[^.]{0,150}(?:must\s+be\s+brought\s+in|shall\s+be\s+brought\s+in|brought\s+in|filed\s+in)[^.]{0,80}(?:County|State|Commonwealth)\b/i,
      // Prime's unilateral right to pick a different forum than the one
      // otherwise stated is itself a burden-shifting venue risk.
      /Prime(?:\s+Contractor)?\s+elects?\s+(?:another|a\s+different|an\s+alternate)\s+forum/i,
    ],
    riskAnalysis:
      "This governing-law/venue/arbitration clause can require the Subcontractor to litigate or arbitrate disputes in a forum far from its own place of business, increasing the cost and difficulty of pursuing or defending a claim regardless of the claim's merits.",
    redlineFix:
      "Negotiate for governing law and venue in the Subcontractor's home state, or at minimum a neutral/mutually convenient forum, and confirm any arbitration provision preserves reasonable discovery and cost-sharing terms.",
  },
  {
    familyKey: "liability",
    regulation: "Acceptance, Rejection, or Rework Without Clear Compensation",
    severity: "Medium-High",
    patterns: [
      // Cross-sentence pattern first (see notice-waiver/cure-period categories
      // above for why): real contracts frequently state the correction/
      // replacement/re-performance trigger (e.g. "Prime determines work does
      // not meet requirements") in one sentence and the no-additional-cost
      // consequence in the next adjacent sentence, rather than both in a
      // single sentence the way the bounded [^.] patterns below assume.
      /(?:correct(?:ion)?|replace(?:ment)?|re-?perform(?:ance)?|rework)[^.]{0,150}(?:determin(?:es|ed)|does\s+not\s+meet|fails?\s+to\s+meet)[\s\S]{0,250}(?:at\s+no\s+(?:additional\s+)?(?:cost|charge|expense)|without\s+(?:additional\s+)?compensation)/i,
      /(?:reject(?:ion|ed)?)[^.]{0,100}(?:correct|replace|re-?perform|rework)[^.]{0,150}(?:no\s+(?:additional\s+)?(?:cost|charge|compensation)|at\s+(?:no|its\s+own|Subcontractor's\s+own)\s+(?:cost|expense))/i,
      // "shall" widened to "will/must/is required to" - real contracts phrase
      // this obligation multiple ways, and the no-additional-cost language
      // routinely lands in the same sentence as the correction/rework verb.
      // Requiring "rejected work" prevents an ordinary verified/actual
      // material-defect warranty from matching while preserving Fixture A's
      // broad rejected-work allocation. Other genuine triggers (unilateral
      // determination, changed requirements, and collateral construction
      // costs) have their own evidence-specific patterns below.
      /Subcontractor\s+(?:shall|will|must|is\s+required\s+to)[^.]{0,100}(?:correct|replace|re-?perform|rework)[^.]{0,100}(?:rejected\s+work|work\s+rejected)[^.]{0,150}(?:at\s+no\s+(?:additional\s+)?(?:cost|charge|expense)|without\s+(?:additional\s+)?compensation)/i,
      /(?:right\s+to\s+reject|may\s+reject)[^.]{0,150}(?:without\s+(?:additional\s+)?(?:cost|compensation|charge)|at\s+(?:no\s+(?:additional\s+)?(?:cost|charge|expense)|Subcontractor's\s+(?:own\s+)?expense))/i,
      // An expressly unilateral Prime determination paired with an
      // uncompensated correction remedy is independently risky even without
      // the word "rejected."
      /Prime(?:\s+Contractor)?\s+(?:unilaterally\s+)?determines?[^.]{0,120}(?:defect|nonconformity)[^.]{0,180}(?:correct|replace|re-?perform|rework)[^.]{0,140}(?:at\s+no\s+(?:additional\s+)?(?:cost|charge|expense)|without\s+(?:additional\s+)?compensation)/i,
      // A changed/later-added requirement is outside an ordinary defect
      // warranty. Requiring uncompensated rework to meet it remains a real
      // risk even when the clause does not use the word "reject."
      /(?:require|direct)[^.]{0,100}(?:correct|replace|re-?perform|rework)[^.]{0,160}(?:later[\s-]added|new(?:ly)?[\s-]added|changed\s+(?:scope|requirements?)|Prime(?:\s+Contractor)?\s+(?:or\s+Government\s+)?change|Government\s+change)[^.]{0,140}(?:without\s+(?:a\s+)?(?:price|schedule)\s+adjustment|without\s+(?:additional\s+)?compensation|at\s+no\s+(?:additional\s+)?(?:cost|charge|expense))/i,
      // Construction clauses sometimes allocate the collateral cost of
      // removal/replacement (access, demolition, testing, restoration, and
      // schedule recovery) without using generic "no additional charge"
      // wording. Requiring one of those collateral-cost signals plus an
      // express Subcontractor-cost allocation keeps this branch narrow.
      /(?:remove|replace|correct|re-?perform|rework)[^.]{0,260}(?:access|demolition|testing|restoration|schedule[\s-]recovery)[^.]{0,220}(?:at\s+(?:the\s+)?Subcontractor(?:'s)?\s+(?:own\s+)?(?:cost|expense)|(?:costs?|expenses?)[^.]{0,80}(?:borne|paid|absorbed)\s+by\s+(?:the\s+)?Subcontractor)/i,
    ],
    riskAnalysis:
      "This acceptance/rejection clause lets the Prime or Government reject work and require correction, replacement, or re-performance without clear compensation to the Subcontractor, shifting the cost of rework - including materials, labor, and schedule impact - entirely onto the Subcontractor regardless of cause.",
    redlineFix:
      "Add a materiality/defect standard for rejection, a defined compensation or change-order path for rework caused by Prime/Government-directed changes or acceptance criteria ambiguity, and a cap on uncompensated rework scope.",
  },
  {
    familyKey: "labor",
    regulation: "Missing or Unresolved Wage Determination / Labor Standards Requirement",
    severity: "Medium",
    patterns: [
      /wage\s+determination[^.]{0,100}(?:may\s+apply|will\s+apply|to\s+be\s+(?:determined|issued|provided|incorporated)|not\s+yet\s+(?:issued|available|determined)|is\s+not\s+(?:currently\s+)?(?:attached|included|available))/i,
      /(?:applicable\s+)?wage\s+determination(?:s)?\s+(?:has|have)\s+not\s+(?:yet\s+)?been\s+(?:issued|incorporated|attached)/i,
      // "wage determination ... may be provided/issued after award" is a
      // distinct deferral phrasing from "not yet issued/attached" above -
      // the requirement isn't stated as missing, just deferred to a later,
      // unspecified point after signature.
      /wage\s+determination[^.]{0,150}may\s+be\s+(?:provided|issued|furnished|incorporated)\s+after\s+(?:award|execution|Government\s+direction)/i,
      // Conditional/uncertain applicability stated BEFORE the trigger term
      // ("labor that may be subject to federal labor standards, wage
      // determinations...") rather than after it, which the patterns above
      // don't catch since they all anchor on "wage determination" as the
      // sentence subject.
      /(?:may|could)\s+be\s+subject\s+to[^.]{0,150}(?:wage\s+determinations?|federal\s+labor\s+standards|service\s+contract\s+(?:labor\s+standards|act))/i,
      /Service\s+Contract\s+(?:Labor\s+Standards|Act)[^.]{0,100}(?:may\s+apply|to\s+be\s+determined|not\s+yet\s+(?:issued|determined|attached))/i,
    ],
    riskAnalysis:
      "The document references a wage determination or Service Contract Labor Standards/Act requirement that may apply but is not yet resolved or attached, leaving the Subcontractor unable to confirm applicable labor classifications, wage rates, or fringe benefit obligations before pricing or staffing the work.",
    redlineFix:
      "Require that the applicable wage determination or labor standards clause be attached and finalized before execution, or add a price/schedule adjustment right if a wage determination is issued or changes after award.",
  },
  {
    familyKey: "data-rights",
    regulation: "Broad Prime Ownership of Subcontractor Deliverables / Work Product",
    severity: "Medium-High",
    patterns: [
      // Wide noun-list gap: real ownership-vesting clauses typically list many
      // deliverable types (reports, scripts, templates, workflow notes, etc.)
      // between the triggering noun and the "owned by Prime" outcome.
      /(?:deliverables?|reports?|work\s+product|technical\s+data|software|documentation)[^.]{0,280}(?:will\s+be|shall\s+be|is|are|become[s]?)\s+owned\s+by\s+(?:the\s+)?Prime(?:\s+Contractor)?/i,
      /ownership[^.]{0,150}(?:shall|will)\s+(?:vest|belong)\s+in\s+(?:the\s+)?Prime(?:\s+Contractor)?/i,
      /Prime(?:\s+Contractor)?\s+(?:shall|will)\s+own\s+(?:all\s+)?(?:deliverables?|work\s+product|reports?)/i,
    ],
    riskAnalysis:
      "This clause vests broad ownership of the Subcontractor's deliverables and work product - potentially including tools, templates, and internal work materials created to perform the work - in the Prime, which can restrict the Subcontractor's ability to reuse, license, or build on its own work product on future engagements.",
    redlineFix:
      "Narrow ownership to only the specific deliverables actually required by the subcontract's statement of work, and add a carve-out confirming the Subcontractor retains ownership of its pre-existing tools, templates, and methodologies plus a license to reuse general know-how developed during performance.",
  },
  {
    familyKey: "data-rights",
    regulation: "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements",
    severity: "Medium-High",
    patterns: [
      // "Subcontractor retains ownership of pre-existing X only if [advance
      // written identification/approval]" - a real reservation-of-rights
      // clause that is conditioned away unless the Subcontractor takes a
      // specific procedural step before use.
      /pre[\s-]existing\s+(?:ip|intellectual\s+property|tools?|materials|methods|know[\s-]how)[^.]{0,200}only\s+if[^.]{0,150}(?:identif|disclos|approve[sd]?|written\s+approval)/i,
      // Broad free-use grant over Subcontractor-created improvements/
      // adaptations, independent of whether the pre-existing-IP conditional
      // clause above is also present in the document.
      /(?:may\s+be\s+used\s+by|Prime(?:\s+Contractor)?\s+may\s+use)[^.]{0,150}without\s+(?:additional\s+)?(?:payment|compensation|charge|fee)/i,
    ],
    riskAnalysis:
      "This clause conditions the Subcontractor's retention of its own pre-existing tools, methods, and background materials on an advance written identification-and-approval process, and separately allows the Prime to use Subcontractor-created improvements or adaptations without additional payment - together these can shift ownership or free use of the Subcontractor's proprietary work product to the Prime by default.",
    redlineFix:
      "Remove the advance-approval condition on retaining ownership of pre-existing IP (a general reservation-of-rights list attached to the subcontract is sufficient), and add a payment or licensing-fee right for Prime's use of any Subcontractor improvements or adaptations beyond the specific deliverables priced under this subcontract.",
  },
];

const CONTEXT_WINDOW = 350;
const MAX_QUOTE_LENGTH = 700;
const MIN_QUOTE_LENGTH = 15;

// Expands a raw regex match out to its surrounding sentence so the finding
// reads as a real clause instead of a bare keyword fragment. This is a plain
// slice of documentText (only whitespace is collapsed), so the result stays
// an exact, verifiable quote.
function extractQuoteAroundMatch(documentText: string, matchIndex: number, matchLength: number): string {
  const matchEnd = matchIndex + matchLength;

  const searchStart = Math.max(0, matchIndex - CONTEXT_WINDOW);
  const before = documentText.slice(searchStart, matchIndex);
  const sentenceStartRe = /[.!?]\s+(?=[A-Z0-9"'(])/g;
  let begin = searchStart;
  let m: RegExpExecArray | null;
  while ((m = sentenceStartRe.exec(before)) !== null) {
    begin = searchStart + m.index + m[0].length;
  }
  const paraBreak = before.lastIndexOf("\n\n");
  if (paraBreak !== -1 && searchStart + paraBreak + 2 > begin) {
    begin = searchStart + paraBreak + 2;
  }

  const searchEnd = Math.min(documentText.length, matchEnd + CONTEXT_WINDOW);
  const after = documentText.slice(matchEnd, searchEnd);
  const sentenceEndMatch = /[.!?](?=\s|\n|$)/.exec(after);
  let finish = searchEnd;
  if (sentenceEndMatch) {
    finish = matchEnd + sentenceEndMatch.index + 1;
  }

  let quote = documentText.slice(begin, finish).trim().replace(/\s+/g, " ");

  if (quote.length > MAX_QUOTE_LENGTH) {
    const tightStart = Math.max(matchIndex - 150, begin);
    const tightEnd = Math.min(matchEnd + 150, finish);
    quote = documentText.slice(tightStart, tightEnd).trim().replace(/\s+/g, " ");
  }

  return quote;
}

// Scans documentText for each high-priority category's trigger patterns and
// returns at most one candidate Finding per category - this is a recall net
// for well-known GovCon traps, not a replacement for the LLM's broader
// review. Every returned foundText is a verbatim slice of documentText, so it
// will independently pass verifyFindings() downstream.
export function runDeterministicDetectors(documentText: string): Finding[] {
  const findings: Finding[] = [];

  for (const category of CATEGORIES) {
    if (category.findCandidate) {
      const foundText = category.findCandidate(documentText);
      if (!foundText || foundText.length < MIN_QUOTE_LENGTH) continue;

      findings.push({
        triggerType: "Contract Risk Trigger",
        regulation: category.regulation,
        severity: category.severity,
        foundText,
        riskAnalysis: category.buildRiskAnalysis?.(foundText) ?? category.riskAnalysis,
        redlineFix: category.redlineFix,
        familyKey: category.familyKey,
      });
      continue;
    }

    let best: { index: number; length: number } | null = null;

    // Each category's patterns array is ordered strongest/most-specific
    // first. We take the first pattern (in that priority order) that matches
    // ANYWHERE in the document, rather than whichever pattern happens to
    // match earliest in the text - a weak, vague trigger phrase (e.g. "the
    // volume of work will depend on Government needs") often appears earlier
    // in a document than the unambiguous one ("does not guarantee any hours,
    // work packages, task assignments, or revenue"), and picking by raw
    // textual position would surface the weaker quote as the finding.
    for (const pattern of category.patterns) {
      const flags = pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g";
      const re = new RegExp(pattern.source, flags);
      const match = re.exec(documentText);
      if (match) {
        best = { index: match.index, length: match[0].length };
        break;
      }
    }

    if (!best) continue;

    const foundText = extractQuoteAroundMatch(documentText, best.index, best.length);
    if (!foundText || foundText.length < MIN_QUOTE_LENGTH) continue;

    findings.push({
      triggerType: "Contract Risk Trigger",
      regulation: category.regulation,
      severity: category.severity,
      foundText,
      riskAnalysis: category.buildRiskAnalysis?.(foundText) ?? category.riskAnalysis,
      redlineFix: category.redlineFix,
      familyKey: category.familyKey,
    });
  }

  return findings;
}
