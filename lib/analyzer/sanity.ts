// Verification entry point: preserves the established grounding/contradiction
// checks in sanity-core.ts, then applies the shared short-notice acceptance
// standard to every candidate (model-generated or deterministic) before a
// finding is allowed to surface.

import { verifyFindings as verifyFindingsCore } from "./sanity-core";
import type { VerificationResult as CoreVerificationResult } from "./sanity-core";
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

  // A true notice-waiver clause can put a substantiation deadline between the
  // initial notice duty and the waiver consequence (QA-D does exactly this).
  // Search no farther than two follow-up sentences, and only cross an
  // intervening sentence when that sentence remains part of the same
  // notice/change/claim substantiation context. This keeps the rule local
  // while preserving genuine multi-step notice traps.
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
  return (
    finding.familyKey === "payment" &&
    NOTICE_WAIVER_REGULATION_RE.test(finding.regulation)
  );
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
    verified.push(finding);
  }

  return { verified, dropped };
}
