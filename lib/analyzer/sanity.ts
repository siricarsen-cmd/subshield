// Verification layer: confirms every finding is grounded in the current document
// and applies contradiction guards before a finding is allowed to surface.

import { quoteExistsInDocument, scrubUngroundedArticleReferences } from "./text";
import { SHORT_CURE_MAX_DAYS } from "./deterministic";
import type { Finding } from "./types";

export interface VerificationResult {
  verified: Finding[];
  dropped: Array<{ finding: Finding; reason: string }>;
}

// Contradiction guards: rules that suppress a category of finding when the
// document contains language that directly contradicts the trap being flagged.
function violatesContradictionGuard(finding: Finding, documentText: string): string | null {
  const reg = finding.regulation.toLowerCase();
  const analysis = `${finding.riskAnalysis} ${finding.foundText}`.toLowerCase();
  // PDF-extracted text line-wraps mid-sentence, so guard regexes match against a
  // whitespace-flattened copy — otherwise a "not conditioned on Government payment"
  // sentence that happens to wrap across a line break would silently fail to match.
  const flatDocText = documentText.replace(/\s+/g, " ");
  const doc = flatDocText.toLowerCase();

  const isContingentPaymentFinding =
    reg.includes("pay-if-paid") || reg.includes("contingent payment") || reg.includes("pay if paid");
  if (isContingentPaymentFinding) {
    const paymentNotConditioned =
      /payment[^.]{0,60}(?:shall\s+not\s+be|is\s+not|not)\s+condition(?:ed)?[^.]{0,60}(?:government|owner)/i.test(
        flatDocText
      );
    if (paymentNotConditioned) {
      return 'Document explicitly states payment is not conditioned on Government/Owner payment; contingent-payment finding suppressed.';
    }
  }

  const isVagueWorkshareFinding =
    reg.includes("vague workshare") || reg.includes("no guaranteed") || reg.includes("workshare");
  if (isVagueWorkshareFinding) {
    const isFFPWithDefinedPrice =
      /firm[\s-]fixed[\s-]price|\bFFP\b/i.test(flatDocText) && /\$[\d,]+(?:\.\d{2})?/.test(flatDocText);
    // Noun list mirrors the deterministic "No Guaranteed Workshare, Hours, or
    // Revenue" trigger pattern in deterministic.ts - it used to only check for
    // quantity/workshare nouns, which meant a real "no guaranteed hours/task
    // assignments/revenue/level of effort" finding on an FFP-priced document
    // was wrongly suppressed here as unsupported, even though the exact same
    // sentence is what triggered the finding in the first place.
    const hasSeparateNoGuaranteeLanguage =
      /(?:no\s+(?:guarantee|guaranty)|does?\s+not\s+guarantee|does?\s+not\s+create|does?\s+not\s+represent)[^.]{0,150}(?:hours|work\s+packages|task\s+assignments|task\s+orders|revenue|workshare|work\s+share|level\s+of\s+effort|quantity|quantities|volume|minimum\s+payment)/i.test(
        flatDocText
      );
    if (isFFPWithDefinedPrice && !hasSeparateNoGuaranteeLanguage) {
      return "Document is firm-fixed-price with a defined total price and no separate no-guarantee hours/workshare/revenue language; vague-workshare finding suppressed.";
    }
  }

  const isDavisBaconFinding = reg.includes("davis-bacon") || reg.includes("construction wage rate");
  if (isDavisBaconFinding) {
    const hasTrigger = /davis[\s-]bacon|construction\s+wage\s+rate|certified\s+payroll|wage\s+determination|52\.222-6/i.test(
      flatDocText
    );
    if (!hasTrigger) {
      return "No Davis-Bacon / Construction Wage Rate Requirements / certified-payroll / wage-determination language or FAR 52.222-6 present in the document.";
    }
  }

  const isSCLSFinding = reg.includes("scls") || reg.includes("service contract act") || reg.includes("52.222-41");
  if (isSCLSFinding) {
    const hasTrigger = /service\s+contract\s+labor\s+standards|service\s+contract\s+act|52\.222-41/i.test(flatDocText);
    if (!hasTrigger) {
      return "No Service Contract Labor Standards / Service Contract Act / FAR 52.222-41 language present in the document.";
    }
  }

  const isDfars7012Finding = reg.includes("252.204-7012") || (reg.includes("dfars") && reg.includes("cyber"));
  if (isDfars7012Finding) {
    const hasTrigger = /252\.204-7012|cui|cdi|nist\s*sp\s*800-171|cmmc|cyber\s+incident\s+report/i.test(flatDocText);
    if (!hasTrigger) {
      return "No DFARS 252.204-7012 / CUI / CDI / NIST SP 800-171 / cyber-incident-reporting language present in the document.";
    }
  }

  // Exact-phrase guards: a finding's own text should not cite a fixed timeframe
  // that never actually occurs in the document.
  const fixedPhrases = ["3 business days", "5 calendar days"];
  for (const phrase of fixedPhrases) {
    if (analysis.includes(phrase) && !doc.includes(phrase)) {
      return `Finding text references the fixed phrase "${phrase}", which does not appear in the current document.`;
    }
  }

  // Finding-local false-positive guards below: each decides suppression
  // using ONLY this finding's own verified foundText (never documentText,
  // and never riskAnalysis, which can contain speculative LLM framing that
  // isn't itself grounded evidence). familyKey/regulation are used only to
  // decide whether a guard applies to this finding's category, never as
  // evidence of risk. Because verifyFindings() below loops per-finding, a
  // suppressed finding never affects a separate finding elsewhere in the
  // same document that independently carries real risk evidence in its own
  // foundText.

  // (A) Ordinary invoice timing: a bare "pay invoice within 20/30 days of
  // receipt" clause is a normal commercial term, not a risk, unless the same
  // quote also carries actual contingency/withholding/setoff/etc. evidence.
  // Deliberately bounded to 20/30 (not a wider Net-N range) so a genuine
  // Net-45/60 delay - explicitly called out as in-scope payment risk - is
  // never suppressed by this guard. (?<!\d)/(?!\d) around (?:20|30) are a
  // defensive digit boundary, consistent with the cure-period fix in
  // deterministic.ts - not currently reachable (the fixed "within\s+" anchor
  // already pins the number's start position so it can't land mid-digit-run
  // of a larger number), but kept so a future loosening of that anchor can't
  // silently reintroduce the same bug class.
  const ORDINARY_INVOICE_TIMING_RE =
    /pay\s+(?:each\s+)?(?:correct|valid|properly\s+submitted)?\s*invoice[^.]{0,60}within\s+(?<!\d)(?:20|30)(?!\d)\s*(?:calendar|business|working)?\s*days?\s+(?:after|of)\s+receipt/i;
  // Government-receipt phrasing varies the noun (payment/funds/monies/
  // amounts) and word order ("receipt of X from" vs. "X received from" vs.
  // "receiving X from") - all three are real, natural ways to phrase the
  // same Government-payment contingency risk, so all three orderings and
  // all four nouns are covered rather than only the single literal
  // "receipt of payment from" phrase.
  const PAYMENT_RISK_SIGNAL_RE =
    /pay[\s-]if[\s-]paid|pay[\s-]when[\s-]paid|contingent\s+(?:upon|on)|condition(?:ed)?\s+(?:upon|on)[^.]{0,60}(?:government|owner)|receipt\s+of\s+(?:payment|funds|monies|amounts)\s+from|(?:corresponding\s+)?(?:payment|funds|monies|amounts)\s+(?:actually\s+)?receive[ds]?\s+from\s+(?:the\s+)?government|receiv(?:ed|es|ing)[^.]{0,60}(?:payment|funds|monies|amounts)\s+from\s+(?:the\s+)?government|government\s+(?:delays?|disputes?|reduces?|rejects?|withholds?)|no\s+obligation\s+to\s+pay|not\s+(?:received|paid)[^.]{0,60}(?:government|owner)|withhold|retainage|set[\s-]?off|back[\s-]?charge|audit[^.]{0,60}approv|reject(?:s|ed|ion)?\s+(?:the\s+)?invoice|unreasonably\s+delay|indefinite(?:ly)?\s+delay|excessive(?:ly)?\s+delay/i;
  if (
    finding.familyKey === "payment" &&
    ORDINARY_INVOICE_TIMING_RE.test(finding.foundText) &&
    !PAYMENT_RISK_SIGNAL_RE.test(finding.foundText)
  ) {
    return "Finding's own verified quote describes only an ordinary invoice-payment timing window (20 or 30 days after receipt) with no contingency, withholding, retainage, setoff, or audit-approval evidence in that same quote; suppressed as ordinary Net terms.";
  }

  // An ordinary 30-day heads-up that funded value is expected to run out is
  // funding administration, not the short notice-of-claim/change trap. Only
  // suppress when this finding's own quote lacks a broad waiver/forfeiture of
  // claims, REAs, delay relief, schedule extensions, or compensation.
  const NOTICE_WAIVER_REGULATION_RE = /short[^.]{0,80}notice|notice[^.]{0,80}waiver|notice[\s-]of[\s-]claim|change\s+notice/i;
  const ORDINARY_FUNDING_NOTICE_RE =
    /(?:at\s+least\s+)?(?:30|thirty)\s*(?:calendar\s+)?days?[^.]{0,70}(?:advance\s+)?notice[^.]{0,130}funded\s+(?:value|amount)[^.]{0,80}exhaust/i;
  const BROAD_CLAIMS_WAIVER_RE =
    /(?:waiv(?:e|es|ed|er)|forfeit(?:s|ed|ure)?|bar(?:s|red)?|relinquish(?:es|ed)?)[^.]{0,180}(?:request\s+for\s+equitable\s+adjustment|\bclaim\b|delay\s+relief|schedule\s+extension|additional\s+compensation)/i;
  if (
    finding.familyKey === "payment" &&
    NOTICE_WAIVER_REGULATION_RE.test(finding.regulation) &&
    ORDINARY_FUNDING_NOTICE_RE.test(finding.foundText) &&
    !BROAD_CLAIMS_WAIVER_RE.test(finding.foundText)
  ) {
    return "Finding's own verified quote is only an ordinary 30-day funding-exhaustion notification and contains no broad waiver or forfeiture of claims, equitable adjustments, delay relief, schedule extensions, or compensation; not a short notice-of-claim trap.";
  }

  // (B) Bare prime-contract identifier: a quote that is nothing more than
  // "Prime Contract No. X" is an identifying reference (already captured
  // separately as documentAnchors.primeContractNumber in anchors.ts), not
  // evidence of incorporation-by-reference, control, or a missing document.
  const BARE_PRIME_CONTRACT_ID_RE =
    /^\s*(?:the\s+)?prime\s+contract\s+(?:no\.?|number|#)\s*[:.]?\s*[A-Za-z0-9][\w-]*\.?\s*$/i;
  if (finding.familyKey === "structure" && BARE_PRIME_CONTRACT_ID_RE.test(finding.foundText.trim())) {
    return "Finding's own verified quote is only a bare prime-contract identifier with no incorporation, control, precedence, or flowdown language; not itself a structure risk.";
  }

  // (C) Protective entire-agreement / integration clause: language requiring
  // signed bilateral written amendments protects against undocumented
  // side-agreements - it is not evidence that something is missing, unless
  // the same quote itself also says so. Real contracts state the two
  // concepts in either order ("entire agreement ... amended only by a
  // signed writing" vs. "amendments must be signed by both parties ...
  // constitutes the entire agreement"), so both orderings are checked as
  // two narrow, separately named alternatives rather than one pattern that
  // only recognizes a single order.
  const ENTIRE_AGREEMENT_PROTECTIVE_FORWARD_RE =
    /entire\s+agreement[^.]{0,250}amend(?:ment|ed|ments)?[^.]{0,150}(?:written|signed)[^.]{0,120}(?:by\s+)?(?:both|each)\s+part(?:y|ies)/i;
  const ENTIRE_AGREEMENT_PROTECTIVE_REVERSED_RE =
    /amend(?:ment|ed|ments)?[^.]{0,150}(?:written|signed)[^.]{0,120}(?:by\s+)?(?:both|each)\s+part(?:y|ies)[^.]{0,250}entire\s+agreement/i;
  // "Statement of Work" spelled out (not just the "SOW" abbreviation), and
  // "will/shall be provided/issued/attached" or "provided/issued/attached
  // later" (deferred-delivery phrasing distinct from the already-covered
  // "not yet issued/attached" and "to be provided/issued" forms), are real
  // ways a document defers or omits a required document without using any
  // of the previously-covered phrases.
  const MISSING_DOC_SIGNAL_RE =
    /not\s+(?:currently\s+)?(?:included|attached|provided|available)|absent\s+from|no\s+(?:current\s+)?(?:sow|statement\s+of\s+work|flow-?down|wage\s+determination|dd\s*254|cyber\s+attachment|quality\s+plan|safety\s+plan)|unattached|redacted|pending\s+exhibit|to\s+be\s+(?:determined|provided|issued|incorporated)|not\s+yet\s+(?:issued|attached|available)|unidentified|unknown\s+flow-?down|(?:will|shall)\s+be\s+(?:provided|issued|attached)|(?:provided|issued|attached)\s+later/i;
  if (
    finding.familyKey === "structure" &&
    (ENTIRE_AGREEMENT_PROTECTIVE_FORWARD_RE.test(finding.foundText) ||
      ENTIRE_AGREEMENT_PROTECTIVE_REVERSED_RE.test(finding.foundText)) &&
    !MISSING_DOC_SIGNAL_RE.test(finding.foundText)
  ) {
    return "Finding's own verified quote is a protective entire-agreement/integration clause requiring signed bilateral amendments and does not itself state that anything is missing, unattached, or pending; not a missing-document risk.";
  }

  // A document/exhibit title, an affirmative attachment statement, a matrix
  // description, or a bilateral-modification protection is not evidence that
  // a required document or flowdown is missing. Keep this guard finding-local:
  // a benign quote is dropped without allowing it to suppress a separate
  // finding whose own quote states a real absence, deferral, incompleteness,
  // omission, or unilateral Prime Contract control term.
  const STRUCTURE_RISK_SIGNAL_RE =
    /\bmissing\b|\b(?:omit|omits|omitted|omitting)\b|not\s+(?:currently\s+|yet\s+)?(?:been\s+)?(?:included|attached|provided|available|supplied)|absent\s+from|unattached|unavailable|incomplete|pending|to\s+be\s+(?:determined|provided|issued|incorporated|supplied)|(?:will|shall|may)\s+be\s+(?:provided|issued|attached|supplied)\s+(?:after\s+(?:execution|award|signing)|later)|(?:controls?|governs?)\s+(?:in\s+the\s+event\s+of\s+conflict|all\b|this\b|the\b|Prime\b|Government\b|Subcontract\b|Agreement\b|obligations?\b|requirements?\b|terms?\b)|takes?\s+precedence|prevails?\b|(?:may|shall|can|could|is|are)\s+(?:be\s+)?(?:modified|amended)\s+unilaterally|(?:modified|amended)\s+unilaterally|unilateral(?:ly)?[^.]{0,60}(?:modify|amend|modification|amendment)|binding[^.]{0,100}without[^.]{0,100}(?:bilateral|mutual|signed\s+(?:agreement|amendment|modification)|consent\s+of\s+both)|(?:additional|revised|new|modified)[^.]{0,100}flow[\s-]?down[^.]{0,180}(?:binding\s+(?:upon|on)\s+notice|automatically\s+bind)|incorporat(?:ed|ion)[^.]{0,180}(?:regardless\s+of\s+whether|whether\s+or\s+not|even\s+if\s+not)[^.]{0,100}(?:provided|supplied|attached|included)/i;
  // A bare reference is deliberately a title grammar, not "Exhibit X"
  // followed by arbitrary words. Title words must start with a capital or a
  // digit (apart from a small connector list), so operative prose such as
  // "is missing", "has been omitted", "controls", or "may be modified"
  // cannot be consumed as part of the title. Common all-caps headings remain
  // supported without making the trailing title phrase case-insensitive.
  const BARE_DOCUMENT_REFERENCE_RE =
    /^\s*(?:(?:(?:[Ee]xhibit|EXHIBIT|[Aa]ttachment|ATTACHMENT|[Aa]ppendix|APPENDIX|[Ss]chedule|SCHEDULE)\s+[A-Z0-9][A-Z0-9._-]{0,20}\b(?:\s+(?:[A-Z0-9][A-Za-z0-9&'(),/._-]*|of|and|for|to|the|in|on))*|(?:Statement\s+of\s+Work|STATEMENT\s+OF\s+WORK|SOW|Prime\s+Contract(?:\s+(?:Excerpts?|Documents?))?|PRIME\s+CONTRACT(?:\s+(?:EXCERPTS?|DOCUMENTS?))?)))\.?\s*$/;
  const POSITIVE_ATTACHMENT_STATEMENT_RE =
    /^\s*(?:Included\s+Attachments?\s*:\s*(?:(?:Exhibit|Attachment|Appendix|Schedule)\s+[A-Z0-9][^;.\n]*)(?:\s*;\s*(?:Exhibit|Attachment|Appendix|Schedule)\s+[A-Z0-9][^;.\n]*)*|All\s+referenced\s+(?:attachments?|exhibits?|documents?)\s+(?:are|were)\s+(?:included|attached|provided)(?:\s+at\s+(?:execution|award|signing))?|(?:Exhibit|Attachment|Appendix|Schedule)\s+[A-Z0-9][A-Z0-9._-]{0,20}\s+(?:identifies?|lists?|contains?)\s+each\s+(?:applicable|required|identified)\s+clause(?:,\s*the\s+reason\s+for\s+applicability,\s*and\s+any\s+tailoring)?)\.?\s*$/i;
  const PROTECTIVE_BILATERAL_FLOWDOWN_RE =
    /^\s*No\s+future\s+Prime\s+Contract\s+clause\s+becomes?\s+binding\s+unless[^.]{0,180}(?:bilateral\s+modification|signed\s+(?:written\s+)?(?:amendment|modification))\.?\s*$/i;
  if (
    finding.familyKey === "structure" &&
    !STRUCTURE_RISK_SIGNAL_RE.test(finding.foundText) &&
    (BARE_DOCUMENT_REFERENCE_RE.test(finding.foundText.trim()) ||
      POSITIVE_ATTACHMENT_STATEMENT_RE.test(finding.foundText.trim()) ||
      PROTECTIVE_BILATERAL_FLOWDOWN_RE.test(finding.foundText.trim()))
  ) {
    return "Finding's own verified quote is only a document/exhibit reference, a positive attachment or matrix statement, or a protective bilateral-modification term and contains no explicit missing, deferred, incomplete, omitted, or unilateral-control signal; not a structure risk.";
  }

  // Ordinary correction of a verified/actual material defect to the agreed
  // requirement is a defect warranty, not an open-ended uncompensated-rework
  // trap. Evidence and exceptions are both confined to this finding's own
  // exact quote so a protective clause cannot cancel a different broad
  // rework clause elsewhere in the document.
  const REWORK_REGULATION_RE = /acceptance|rejection|rework|re-?perform|defect\s+correction/i;
  const ORDINARY_DEFECT_CORRECTION_RE =
    /\b(?:verified|actual|confirmed)\s+material\s+(?:defect|nonconformity)\b|(?:correct|repair|replace|re-?perform|rework)[^.]{0,160}(?:defect|nonconformity)[^.]{0,180}(?:attributable\s+to|caused\s+by|responsibility\s+of)\s+(?:the\s+)?Subcontractor|(?:correct|repair|replace|re-?perform|rework)[^.]{0,180}(?:limited\s+to|only\s+to)[^.]{0,180}(?:original|agreed|requirement\s+that\s+existed)|(?:correct|repair|replace|re-?perform|rework)[\s\S]{0,320}(?:correction|rework)\s+is\s+limited\s+to[^.]{0,180}(?:original|agreed|requirement\s+that\s+existed)|may\s+not\s+reject[^.]{0,180}(?:later[\s-]added\s+requirement|preference\s+not\s+stated|changes?\s+the\s+agreed\s+scope)/i;
  const BROAD_REWORK_RISK_SIGNAL_RE =
    /sole\s+discretion|regardless\s+of\s+cause|(?:rejected\s+work|work\s+rejected|may\s+reject\s+any\s+work)[^.]{0,180}(?:at\s+no\s+(?:additional\s+)?(?:cost|charge|expense)|without\s+(?:additional\s+)?compensation)|(?:later[\s-]added|new(?:ly)?[\s-]added|changed)\s+(?:scope|requirements?)[^.]{0,180}(?:without\s+(?:a\s+)?(?:price|schedule)\s+adjustment|without\s+(?:additional\s+)?compensation)|(?:Prime|Government)[^.]{0,80}(?:change|direction)[^.]{0,180}(?:rework|correct|replace|re-?perform)[^.]{0,140}(?:without\s+(?:additional\s+)?compensation|at\s+no\s+(?:additional\s+)?(?:cost|charge|expense))|(?:rework|correct|replace|re-?perform)[^.]{0,140}caused\s+by\s+(?:the\s+)?(?:Prime|Government)[^.]{0,140}(?:without\s+(?:additional\s+)?compensation|at\s+no\s+(?:additional\s+)?(?:cost|charge|expense))|Prime(?:\s+Contractor)?\s+(?:unilaterally\s+)?determines?[^.]{0,100}(?:defect|nonconformity)[^.]{0,180}(?:without\s+(?:additional\s+)?compensation|at\s+no\s+(?:additional\s+)?(?:cost|charge|expense))|(?:access|demolition|testing|restoration|schedule[\s-]recovery)[^.]{0,220}(?:at\s+(?:the\s+)?Subcontractor(?:'s)?\s+(?:own\s+)?(?:cost|expense)|(?:costs?|expenses?)[^.]{0,80}(?:borne|paid|absorbed)\s+by\s+(?:the\s+)?Subcontractor)/i;
  if (
    finding.familyKey === "liability" &&
    REWORK_REGULATION_RE.test(finding.regulation) &&
    ORDINARY_DEFECT_CORRECTION_RE.test(finding.foundText) &&
    !BROAD_REWORK_RISK_SIGNAL_RE.test(finding.foundText)
  ) {
    return "Finding's own verified quote limits correction to an ordinary verified/actual material defect, the agreed requirement, Subcontractor-responsible defects, or protects against changed-scope rejection, with no separate broad rework-cost signal in that quote; not an uncompensated-rework risk.";
  }

  // (D) LLM long-cure companion guard: mirrors the deterministic-source fix
  // in deterministic.ts (SHORT_CURE_MAX_DAYS) for the case where the LLM,
  // rather than the deterministic scanner, independently raises the same
  // false positive from its own reading of a long standalone cure period.
  const CURE_REGULATION_RE = /short\s+default\s+cure|cure\s+period/i;
  const CURE_DAY_EXTRACT_RE = /(\d+)\s*(?:calendar|business|working)?\s*days?\s+to\s+cure/i;
  // "No genuine opportunity to cure" is commonly phrased as "without
  // any/a/an (providing an) right/opportunity to cure" or "no
  // right/opportunity to cure", distinct from the already-covered
  // "terminate...without cure" and "without further notice" phrasings.
  const IMMEDIATE_TERMINATION_SIGNAL_RE =
    /terminate[^.]{0,60}immediately|terminat(?:e|ion)[^.]{0,60}without\s+(?:a\s+)?cure|without\s+(?:further\s+)?notice|sole\s+discretion|(?:without\s+(?:any|a|an|providing(?:\s+an)?)|no)\s+(?:right|opportunity)\s+to\s+cure/i;
  if (CURE_REGULATION_RE.test(finding.regulation)) {
    const dayMatch = CURE_DAY_EXTRACT_RE.exec(finding.foundText);
    if (dayMatch) {
      const days = Number(dayMatch[1]);
      if (days > SHORT_CURE_MAX_DAYS && !IMMEDIATE_TERMINATION_SIGNAL_RE.test(finding.foundText)) {
        return `Finding's own verified quote states a ${days}-day cure period with no immediate-termination, termination-without-cure, no-further-notice, or sole-discretion language in that same quote; not a short-cure risk.`;
      }
    }
  }

  // (E) Protective "no duty to defend" language: a quote that itself states
  // neither/no party has (or has no) duty to defend cannot simultaneously be
  // evidence of a real indemnification/duty-to-defend risk. Companion to the
  // deterministic.ts lookbehind fix above - covers the case where the LLM,
  // not the deterministic scanner, raises the same false positive from its
  // own reading of the clause. Does not suppress when the same quote also
  // contains a separate, explicit affirmative obligation actually requiring
  // Subcontractor to indemnify/defend/hold harmless Prime Contractor - that
  // combination (e.g. "...except that Subcontractor shall indemnify,
  // defend, and hold harmless Prime Contractor...") is a real risk even
  // though the same quote also states a general "no duty to defend" rule.
  const INDEMNITY_REGULATION_RE = /indemnif|duty\s+to\s+defend|hold\s+harmless/i;
  const INDEMNITY_PROTECTIVE_RE =
    /neither\s+party\s+(?:has|shall\s+have)\s+(?:a\s+|any\s+)?duty\s+to\s+defend|no\s+party\s+has\s+(?:a\s+|any\s+)?duty\s+to\s+defend|has\s+no\s+duty\s+to\s+defend|have\s+no\s+duty\s+to\s+defend/i;
  const AFFIRMATIVE_INDEMNITY_EXCEPTION_RE =
    /Subcontractor\s+(?:shall|will)\s+(?:indemnify|defend|hold\s+harmless)[^.]{0,150}Prime(?:\s+Contractor)?/i;
  if (
    finding.familyKey === "liability" &&
    INDEMNITY_REGULATION_RE.test(finding.regulation) &&
    INDEMNITY_PROTECTIVE_RE.test(finding.foundText) &&
    !AFFIRMATIVE_INDEMNITY_EXCEPTION_RE.test(finding.foundText)
  ) {
    return "Finding's own verified quote states that neither/no party has (or has no) duty to defend, with no separate affirmative indemnify/defend/hold-harmless obligation in the same quote; not an indemnification risk.";
  }

  // Generic IP/data nouns inside an indemnity claim list do not support a
  // data-rights ownership or license conclusion. Preserve any quote that also
  // contains a substantive assignment, ownership, license, Government-rights,
  // pre-existing-IP, technical-data, or marking term.
  const INDEMNITY_CLAIM_CONTEXT_RE =
    /indemnif|defend|hold\s+harmless|claims?\s+(?:arising|involving|relating\s+to|based\s+on)/i;
  const SUBSTANTIVE_DATA_RIGHTS_SIGNAL_RE =
    /data\s+rights|pre[\s-]existing\s+(?:ip|intellectual\s+property|tools?|materials|methods?|know[\s-]how)|unlimited\s+rights|government\s+purpose\s+rights|limited\s+rights|restricted\s+rights|technical\s+data|work\s+product|deliverables?[^.]{0,80}(?:owned|ownership|license[ds]?|licen[cs]e)|(?:assign(?:s|ed|ment)?|transfer(?:s|red)?|vest(?:s|ed)?|own(?:s|ed|ership)?|grant(?:s|ed)?[^.]{0,30}(?:a\s+)?license|licen[cs]e[ds]?)[^.]{0,100}(?:intellectual\s+property|proprietary\s+(?:information|data|materials)|software|technology|data)|(?:mark(?:ing|ed)?|legend)[^.]{0,100}(?:technical\s+data|proprietary|restricted\s+rights|limited\s+rights)/i;
  if (
    finding.familyKey === "data-rights" &&
    INDEMNITY_CLAIM_CONTEXT_RE.test(finding.foundText) &&
    !SUBSTANTIVE_DATA_RIGHTS_SIGNAL_RE.test(finding.foundText)
  ) {
    return "Finding's own verified quote mentions intellectual property/data only as subjects of indemnified claims and contains no assignment, ownership transfer, license, Government-rights, pre-existing-IP, technical-data, or marking term; not a data-rights ownership finding.";
  }

  // (F) Protective termination/cure prohibition: "neither/no party may
  // terminate...without notice/cure" or "[a party] may/shall not
  // terminate...without notice/cure" is a prohibition REQUIRING notice and a
  // cure opportunity before termination, not a risk granting Prime the
  // right to skip them. Companion to the deterministic.ts lookbehind fix
  // above. Does not suppress when the same quote also contains a separate,
  // explicit exception actually granting Prime an immediate/no-notice/
  // sole-discretion termination right - that combination is a real risk
  // even though the same quote also states a general prohibition.
  const CURE_TERMINATION_PROHIBITION_RE =
    /(?:neither\s+party|no\s+party)\s+(?:may|shall)\s+terminate[^.]{0,150}without[^.]{0,100}(?:notice|cure)|(?:may|shall)\s+not\s+terminate[^.]{0,150}without[^.]{0,100}(?:notice|cure)/i;
  const PRIME_IMMEDIATE_TERMINATION_EXCEPTION_RE =
    /Prime(?:\s+Contractor)?\s+may\s+terminate[^.]{0,100}(?:immediately|without\s+(?:further\s+)?notice|sole\s+discretion|without\s+(?:(?:any|a|an)\s+)?(?:right|opportunity)\s+to\s+cure)/i;
  if (
    CURE_REGULATION_RE.test(finding.regulation) &&
    CURE_TERMINATION_PROHIBITION_RE.test(finding.foundText) &&
    !PRIME_IMMEDIATE_TERMINATION_EXCEPTION_RE.test(finding.foundText)
  ) {
    return "Finding's own verified quote is a prohibition requiring notice and/or a cure opportunity before termination, with no separate exception granting Prime an immediate/no-notice/sole-discretion right in the same quote; not a short-cure/termination-discretion risk.";
  }

  return null;
}

export function verifyFindings(findings: Finding[], documentText: string): VerificationResult {
  const verified: Finding[] = [];
  const dropped: Array<{ finding: Finding; reason: string }> = [];

  for (const finding of findings) {
    if (!finding.regulation || !finding.regulation.trim()) {
      dropped.push({ finding, reason: "Finding is missing a regulation/risk label and cannot be displayed." });
      continue;
    }

    if (!quoteExistsInDocument(finding.foundText, documentText)) {
      dropped.push({ finding, reason: "foundText could not be verified as an exact quote from the current document." });
      continue;
    }

    const guardReason = violatesContradictionGuard(finding, documentText);
    if (guardReason) {
      dropped.push({ finding, reason: guardReason });
      continue;
    }

    verified.push({
      ...finding,
      regulation: scrubUngroundedArticleReferences(finding.regulation, documentText),
      riskAnalysis: scrubUngroundedArticleReferences(finding.riskAnalysis, documentText),
      redlineFix: scrubUngroundedArticleReferences(finding.redlineFix, documentText),
    });
  }

  return { verified, dropped };
}

// Guard for classify.ts output: cyber/CUI/DD254/construction/trade work must
// never surface as "Professional Services / Administrative Support".
export function guardIndustryLabel(label: string, documentText: string): string {
  const blockedSignals = /252\.204-7012|CUI|CDI|DD\s*254|ARCYBER|\bHVAC\b|access[\s-]control|low[\s-]voltage|field\s+installation|facility\s+upgrade|construction|repair\s+(?:and|&)?\s*(?:maintenance|services)|records?\s+storage\s+room/i;
  if (label.toLowerCase().includes("administrative support") && blockedSignals.test(documentText)) {
    return "Services (General)";
  }
  return label;
}
