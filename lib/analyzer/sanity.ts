// Verification entry point: preserves the established grounding/contradiction
// checks in sanity-core.ts, then applies shared finding-local acceptance rules
// to every candidate (model-generated or deterministic) before it can surface.

import { verifyFindings as verifyFindingsCore } from "./sanity-core";
import type { VerificationResult as CoreVerificationResult } from "./sanity-core";
import { SHORT_CURE_MAX_DAYS } from "./deterministic";
import { hasAffirmativeCyberSignal, hasAffirmativeSclsSignal } from "./affirmative-signals";
import type { Finding } from "./types";

export * from "./sanity-core";

const NOTICE_WAIVER_REGULATION_RE =
  /short[^.]{0,80}notice|notice[^.]{0,80}waiver|notice[\s-]of[\s-]claim|change\s+notice/i;
const SHORT_NOTICE_DAY_SOURCE =
  String.raw`(?:\d{1,3}|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty)`;
const MANDATORY_SUBCONTRACTOR_NOTICE_RE = new RegExp(
  String.raw`\bSubcontractor\b[^.]{0,280}\b(?:must|shall|is\s+required\s+to)\b[^.]{0,120}\b(?:notify|provide|give|submit)\b[^.]{0,220}\b(?:within|no\s+later\s+than)\s+${SHORT_NOTICE_DAY_SOURCE}\s*(?:calendar|business|working)?\s*days?\b`,
  "i"
);
const SHORT_NOTICE_ENTITLEMENT_TOPIC_RE =
  /\b(?:change|claim|equitable\s+adjustment|additional\s+compensation|compensation|schedule|delay|differing[\s-](?:site\s+)?condition|cost|time|scope|price|direction)\b/i;
const SHORT_NOTICE_CONTINUATION_RE =
  /\b(?:notice|deadline|substantiat(?:e|ed|ion)|pricing|schedule|supporting\s+records?|change|claim|equitable\s+adjustment|compensation|cost|time|delay|scope|price)\b/i;
const PROTECTIVE_SHORT_NOTICE_RE =
  /\b(?:does|shall|will|may|can)\s+not\s+(?:waive|forfeit|bar|relinquish)|\b(?:is|are|shall|will)\s+not\s+(?:be\s+)?(?:waived|forfeited|barred|relinquished)|\b(?:late|later|untimely|delayed)\s+(?:notice|invoice)[^.]{0,140}\b(?:does|shall|will)\s+not\s+(?:waive|forfeit|bar|relinquish)|\bunless\b[^.]{0,220}\bmaterial\s+prejudice\b|\bunless\b[^.]{0,220}\b(?:Prime(?:\s+Contractor)?|Prime)\b[^.]{0,120}\b(?:demonstrates?|shows?|establishes?)\b[^.]{0,100}\bprejudice\b/i;
const AFFIRMATIVE_SHORT_NOTICE_CONSEQUENCE_RE =
  /(?:waiv(?:e|es|ed)|forfeit(?:s|ed)?|bar(?:s|red)?|relinquish(?:es|ed)?|constitutes?\s+(?:a\s+)?(?:complete\s+)?waiver|results?\s+in\s+(?:a\s+)?(?:complete\s+)?waiver|deemed\s+waived)[^.]{0,280}(?:request\s+for\s+equitable\s+adjustment|\bclaim\b|additional\s+compensation|\bcompensation\b|delay\s+relief|schedule\s+(?:relief|extension)|time\s+extension|adjustment\s+rights?)/i;
const REVERSED_SHORT_NOTICE_CONSEQUENCE_RE =
  /(?:request\s+for\s+equitable\s+adjustment|\bclaim\b|additional\s+compensation|\bcompensation\b|delay\s+relief|schedule\s+(?:relief|extension)|time\s+extension|adjustment\s+rights?)[^.]{0,220}(?:waived|forfeited|barred|relinquished)/i;

const CYBER_FINDING_RE =
  /252\.204-7012|NIST\s*SP\s*800-171|\bCUI\b|controlled\s+unclassified\s+information|cybersecurity\s+flowdown/i;
const SCLS_FINDING_RE =
  /service\s+contract\s+labor\s+standards|service\s+contract\s+act|\bSCLS\b|\bSCA\b|52\.222-41/i;
const CURE_FINDING_TITLE_RE = /short\s+default\s+cure|cure\s+period|termination\s+discretion/i;
const LONG_CURE_DAY_RE =
  /(?:(\d+)\s*(?:calendar|business|working)?\s*days?\s+to\s+cure|cure[^.]{0,100}\bwithin\s+(\d+)\s*(?:calendar|business|working)?\s*days?|(?:remains?|remain|is|are)\s+uncured\s+for\s+(\d+)\s*(?:calendar|business|working)?\s*days?)/i;
const IMMEDIATE_TERMINATION_SIGNAL_RE =
  /terminate[^.]{0,80}immediately|terminat(?:e|ion)[^.]{0,80}without\s+(?:a\s+)?cure|without\s+(?:further\s+)?notice|sole\s+discretion|(?:without\s+(?:any|a|an|providing(?:\s+an)?)|no)\s+(?:right|opportunity)\s+to\s+cure/i;
const OTHER_LIABILITY_SIGNAL_RE =
  /indemnif|hold\s+harmless|duty\s+to\s+defend|uncapped\s+liability|liability\s+cap|binding\s+arbitration|governing\s+law|continue[^.]{0,40}performance[^.]{0,80}(?:payment|withhold|dispute)/i;

function splitFindingSentences(foundText: string): string[] {
  return foundText
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);
}

function hasAffirmativeShortNoticeConsequence(text: string): boolean {
  return (
    AFFIRMATIVE_SHORT_NOTICE_CONSEQUENCE_RE.test(text) ||
    REVERSED_SHORT_NOTICE_CONSEQUENCE_RE.test(text)
  );
}

export function hasShortNoticeWaiverRiskEvidence(foundText: string): boolean {
  const sentences = splitFindingSentences(foundText);
  const dutyIndex = sentences.findIndex(
    (sentence) =>
      MANDATORY_SUBCONTRACTOR_NOTICE_RE.test(sentence) &&
      SHORT_NOTICE_ENTITLEMENT_TOPIC_RE.test(sentence)
  );
  if (dutyIndex < 0) return false;

  for (let followUpCount = 0; followUpCount <= 2; followUpCount++) {
    const endIndex = dutyIndex + followUpCount;
    if (endIndex >= sentences.length) break;

    const intervening = sentences.slice(dutyIndex + 1, endIndex);
    if (
      intervening.length > 0 &&
      !intervening.every((sentence) => SHORT_NOTICE_CONTINUATION_RE.test(sentence))
    ) {
      continue;
    }

    const localWindow = sentences.slice(dutyIndex, endIndex + 1).join(" ");
    if (PROTECTIVE_SHORT_NOTICE_RE.test(localWindow)) return false;
    if (hasAffirmativeShortNoticeConsequence(localWindow)) return true;
  }

  return false;
}

function isShortNoticeWaiverFinding(finding: Finding): boolean {
  return finding.familyKey === "payment" && NOTICE_WAIVER_REGULATION_RE.test(finding.regulation);
}

function isCureFinding(finding: Finding): boolean {
  if (finding.familyKey !== "liability") return false;
  if (CURE_FINDING_TITLE_RE.test(finding.regulation)) return true;
  return (
    /termination/i.test(finding.regulation) &&
    /\b(?:cure|uncured)\b/i.test(finding.foundText) &&
    !OTHER_LIABILITY_SIGNAL_RE.test(finding.foundText)
  );
}

function additionalGuardReason(finding: Finding): string | null {
  if (
    finding.familyKey === "cyber" &&
    CYBER_FINDING_RE.test(finding.regulation) &&
    !hasAffirmativeCyberSignal(finding.foundText)
  ) {
    return "Finding's own verified quote contains no affirmative DFARS/CUI/NIST cybersecurity requirement; explicit non-applicability or bilateral future-change language cannot support an affirmative cyber finding.";
  }

  if (
    finding.familyKey === "labor" &&
    SCLS_FINDING_RE.test(finding.regulation) &&
    !hasAffirmativeSclsSignal(finding.foundText)
  ) {
    return "Finding's own verified quote contains no affirmative Service Contract Labor Standards / Service Contract Act requirement; explicit non-applicability language cannot support an SCLS finding.";
  }

  if (isCureFinding(finding)) {
    const dayMatch = LONG_CURE_DAY_RE.exec(finding.foundText);
    const rawDays = dayMatch?.[1] ?? dayMatch?.[2] ?? dayMatch?.[3];
    if (rawDays) {
      const days = Number(rawDays);
      if (days > SHORT_CURE_MAX_DAYS && !IMMEDIATE_TERMINATION_SIGNAL_RE.test(finding.foundText)) {
        return `Finding's own verified quote provides a ${days}-day cure period with no immediate/no-cure/no-notice/sole-discretion termination right in that same quote; not a short/default-cure risk.`;
      }
    }
  }

  return null;
}

export function verifyFindings(
  findings: Finding[],
  documentText: string
): CoreVerificationResult {
  const core = verifyFindingsCore(findings, documentText);
  const verified: Finding[] = [];
  const dropped = [...core.dropped];

  for (const finding of core.verified) {
    if (isShortNoticeWaiverFinding(finding) && !hasShortNoticeWaiverRiskEvidence(finding.foundText)) {
      dropped.push({
        finding,
        reason:
          "Finding's own verified quote does not establish a mandatory Subcontractor change/claim notice deadline with an affirmative claim/adjustment forfeiture consequence, or it contains express anti-waiver/material-prejudice protection; not a short notice-of-claim trap.",
      });
      continue;
    }

    const guardReason = additionalGuardReason(finding);
    if (guardReason) {
      dropped.push({ finding, reason: guardReason });
      continue;
    }

    verified.push(finding);
  }

  return { verified, dropped };
}
