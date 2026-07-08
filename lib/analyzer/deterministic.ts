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

import type { Finding, RiskLevel } from "./types";

interface DeterministicCategory {
  familyKey: string;
  regulation: string;
  severity: RiskLevel;
  patterns: RegExp[];
  riskAnalysis: string;
  redlineFix: string;
}

const CATEGORIES: DeterministicCategory[] = [
  {
    familyKey: "payment",
    regulation: "Pay-if-Paid / Contingent Government-Payment Clause",
    severity: "High",
    patterns: [
      /pay[\s-]if[\s-]paid/i,
      /contingent\s+(?:upon|on)\s+(?:the\s+)?(?:receipt\s+of\s+)?payment\s+(?:by|from|received\s+from)\s+(?:the\s+)?(?:government|customer|owner|prime)/i,
      /no\s+obligation\s+to\s+pay\s+(?:the\s+)?subcontractor\s+unless/i,
      /shall\s+not\s+be\s+obligated\s+to\s+pay[^.]{0,100}unless\s+(?:and\s+until\s+)?(?:[A-Za-z ]+\s+)?(?:has\s+|have\s+)?receive[sd]/i,
      /receipt\s+of\s+(?:such\s+)?payment\s+from\s+the\s+government\s+is\s+a\s+condition\s+precedent/i,
      /condition\s+precedent\s+to[^.]{0,60}(?:payment|obligation\s+to\s+pay)[^.]{0,80}(?:government|owner)/i,
      /(?:shall\s+have\s+)?no\s+obligation\s+to\s+pay[^.]{0,120}(?:amounts?|sums?)[^.]{0,80}not\s+received[^.]{0,60}(?:from\s+)?(?:the\s+)?(?:government|owner|customer|prime)/i,
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
    regulation: "Broad Future Flowdowns / Prime Contract Control",
    severity: "Medium",
    patterns: [
      /flow[\s-]?down[^.]{0,120}(?:later[\s-]issued|future|subsequently\s+issued|hereafter\s+issued|issued\s+after\s+the\s+date)/i,
      /(?:terms|requirements)\s+of\s+the\s+prime\s+contract[^.]{0,80}(?:shall\s+)?(?:control|govern|take\s+precedence|prevail)/i,
      /Subcontractor\s+shall\s+be\s+bound\s+by[^.]{0,100}(?:later[\s-]issued|future|subsequent(?:ly)?\s+issued|modifications?\s+to\s+the\s+prime\s+contract)/i,
      /prime\s+contract\s+is\s+incorporated\s+(?:herein\s+)?by\s+reference[^.]{0,150}(?:whether\s+or\s+not|regardless\s+of\s+whether|even\s+if\s+not\s+attached)/i,
      /any\s+(?:changes?|modifications?|amendments?)\s+to\s+the\s+prime\s+contract[^.]{0,100}(?:automatically|shall)\s+(?:apply|flow\s+down|bind)/i,
    ],
    riskAnalysis:
      "This clause binds the Subcontractor to prime contract terms - including requirements issued or modified after signing - without the Subcontractor having reviewed or agreed to those specific terms, creating open-ended, unbounded compliance risk.",
    redlineFix:
      "Require that all flowdown terms and any later-issued or modified prime contract requirements be provided to the Subcontractor in writing and apply only prospectively after the Subcontractor's written acknowledgment, with a right to price or schedule relief for materially burdensome new requirements.",
  },
  {
    familyKey: "liability",
    regulation: "Broad Indemnification / Duty to Defend",
    severity: "High",
    patterns: [
      /indemnify[^.]{0,60}(?:and\s+)?hold\s+harmless/i,
      /duty\s+to\s+defend/i,
      /defend,?\s+indemnify/i,
      /indemnify[^.]{0,150}(?:any\s+alleged|alleged\s+(?:violation|noncompliance|breach))/i,
      /regardless\s+of\s+(?:whether\s+)?(?:such\s+)?(?:claim|allegation)[^.]{0,80}(?:fault|negligence)\s+of\s+(?:the\s+)?Prime/i,
    ],
    riskAnalysis:
      "This indemnification / duty-to-defend obligation can require the Subcontractor to defend and cover the Prime's costs even for claims based on mere allegations of noncompliance, without regard to whether the Prime itself was at fault, exposing the Subcontractor to open-ended defense costs and liability.",
    redlineFix:
      "Narrow indemnification to claims arising from the Subcontractor's own negligence, willful misconduct, or breach, exclude indemnification for the Prime's own negligence or fault, and cap defense-cost exposure.",
  },
  {
    familyKey: "liability",
    regulation: "Termination for Convenience",
    severity: "Medium",
    patterns: [
      // "terminate" and "for convenience" allow a bounded gap - real prose
      // almost always inserts the object in between ("terminate THIS
      // SUBCONTRACT for its convenience"), and the entity name allows an
      // optional "Contractor" (some documents define the party as "Prime"
      // alone, others as "Prime Contractor").
      /terminat(?:e|ion)[^.]{0,50}for\s+(?:its\s+|the\s+)?convenience[^.]{0,150}(?:\d+\s*(?:calendar|business|working)?\s*days?|no\s+(?:further\s+)?(?:liability|compensation|obligation)|limited\s+to)/i,
      /upon\s+\d+\s*(?:calendar|business|working)?\s*days?(?:'|’)?\s+(?:written\s+)?notice[^.]{0,100}terminat(?:e|ion)[^.]{0,60}convenience/i,
      /Prime(?:\s+Contractor)?\s+may[^.]{0,60}terminate[^.]{0,100}(?:for\s+(?:its\s+|the\s+)?convenience)[^.]{0,60}(?:at\s+any\s+time|without\s+cause)/i,
    ],
    riskAnalysis:
      "This termination-for-convenience clause allows the Prime to end the subcontract on short notice with limited recovery, leaving the Subcontractor unable to recoup committed costs, staffing investments, or anticipated profit on terminated work.",
    redlineFix:
      "Extend the notice period and ensure the termination-for-convenience settlement includes recovery of all reasonable costs incurred, committed subcontractor/vendor obligations, and a reasonable profit component on completed work.",
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
      /(?:\d+\s*(?:calendar|business|working)?\s*days?\s+to\s+cure|cure\s+(?:period|such\s+default|any\s+such\s+failure)[^.]{0,80}(?:within\s+)?\d+\s*(?:calendar|business|working)?\s*days?)/i,
      /fail(?:s|ure)?\s+to\s+cure[^.]{0,100}within\s+\d+\s*(?:calendar|business|working)?\s*days?/i,
      /terminat(?:e|ion)[^.]{0,50}for\s+default[^.]{0,150}(?:immediately|without\s+(?:further\s+)?notice|in\s+its\s+sole\s+discretion|at\s+its\s+sole\s+discretion)/i,
      /Prime(?:\s+Contractor)?\s+may[^.]{0,60}terminate[^.]{0,80}for\s+default[^.]{0,100}(?:immediately|sole\s+discretion|without\s+notice)/i,
      // Immediate-termination discretion without requiring the literal phrase
      // "for default" - real contracts often phrase this as broad
      // determination-based discretion instead ("may terminate immediately if
      // it determines the issue could affect..."). "terminate" and
      // "immediately" allow a bounded gap since an object often sits between
      // them ("terminate this Subcontract for default immediately").
      /terminate[^.]{0,40}immediately[^.]{0,60}(?:if\s+it\s+determines|in\s+its\s+(?:sole\s+)?discretion|without\s+(?:further\s+)?notice)/i,
    ],
    riskAnalysis:
      "A short cure period combined with broad Prime discretion to terminate for default means routine performance issues can escalate into a default termination before the Subcontractor has a realistic opportunity to fix the issue, which can trigger consequences far beyond the value of the underlying issue.",
    redlineFix:
      "Extend the cure period to a commercially reasonable timeframe, require written notice specifying the exact default before any termination, and add a right to dispute the default determination before termination takes effect.",
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
    patterns: [
      // "must"/"will"/"is required to" as well as "shall" - real contracts
      // frequently use "Subcontractor must continue performance during any
      // payment delay/dispute unless Prime directs otherwise", not just the
      // "notwithstanding"/"shall not suspend" phrasing assumed below.
      /Subcontractor\s+(?:shall|must|will|is\s+required\s+to)\s+continue\s+(?:performance|to\s+perform|(?:its\s+)?work)[^.]{0,100}(?:during|notwithstanding|despite|pending)[^.]{0,80}(?:dispute|payment|withhold)/i,
      /continue\s+(?:to\s+)?perform(?:ance)?[^.]{0,120}(?:notwithstanding|despite|regardless\s+of|during\s+any)[^.]{0,120}(?:payment|dispute|withhold)/i,
      /shall\s+not\s+(?:suspend|stop|delay|cease)\s+(?:performance|work)[^.]{0,120}(?:dispute|payment|withholding|non[\s-]payment)/i,
      /no\s+(?:delay\s+in\s+|withholding\s+of\s+)?payment[^.]{0,100}(?:shall\s+)?(?:excuse|relieve|suspend)[^.]{0,100}Subcontractor(?:'s)?\s+(?:obligation\s+to\s+perform|performance)/i,
    ],
    riskAnalysis:
      "This clause requires the Subcontractor to keep performing and funding the work even while payment is delayed, withheld, or disputed, forcing the Subcontractor to carry the Prime's or Government's cash-flow risk with its own working capital.",
    redlineFix:
      "Add a right to suspend performance without penalty if payment is withheld or delayed beyond a defined period, or at minimum a right to interest or added costs for continued performance during an unresolved payment dispute.",
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
      "This document imposes DFARS 252.204-7012/CUI/NIST SP 800-171/CMMC cybersecurity obligations, which require the Subcontractor to safeguard covered defense information, meet specific incident-reporting deadlines, and flow the same requirements down to lower-tier subcontractors - obligations the Subcontractor cannot fully evaluate or price if the actual cyber attachment, control baseline, or CMMC level requirement is not included in the current package.",
    redlineFix:
      "Request the actual DFARS 252.204-7012/CUI/NIST SP 800-171 attachment, incident-reporting timeline, and applicable CMMC level in writing before execution, and confirm the flow-down scope to any lower-tier subcontractors.",
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
      "This clause gives the Prime broad, largely unilateral rights to offset, backcharge, deduct, or withhold amounts from what it owes the Subcontractor, which can be used to reduce or delay payment based on the Prime's own determination of costs or damages without a neutral process to contest the deduction.",
    redlineFix:
      "Narrow the setoff/backcharge right to amounts that are undisputed, documented, and subject to advance written notice and a right to contest before any deduction is taken from payment otherwise due.",
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
      /Subcontractor\s+(?:shall|will|must|is\s+required\s+to)[^.]{0,100}(?:correct|replace|re-?perform|rework)[^.]{0,150}(?:at\s+no\s+(?:additional\s+)?(?:cost|charge|expense)|without\s+(?:additional\s+)?compensation)/i,
      /(?:right\s+to\s+reject|may\s+reject)[^.]{0,150}(?:without\s+(?:additional\s+)?(?:cost|compensation|charge)|at\s+(?:no\s+cost|Subcontractor's\s+(?:own\s+)?expense))/i,
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
      riskAnalysis: category.riskAnalysis,
      redlineFix: category.redlineFix,
      familyKey: category.familyKey,
    });
  }

  return findings;
}
