from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)


deterministic_path = Path("lib/analyzer/deterministic.ts")
deterministic = deterministic_path.read_text()

# Mixed Prime/Subcontractor payment-preservation language must retain the
# explicit Subcontractor protection while Prime-only protections remain excluded.
deterministic = replace_once(
    deterministic,
    r'''const PRIME_PAYMENT_RIGHT_PRESERVATION_RE =
  /\bPrime(?:\s+Contractor)?(?:'s|\u2019s)\s+(?:right|entitlement)\s+to\s+payment\b/i;''',
    r'''const PRIME_PAYMENT_RIGHT_PRESERVATION_RE =
  /\bPrime(?:\s+Contractor)?(?:'s|\u2019s)\s+(?:right|entitlement)\s+to\s+payment\b/i;
const SUBCONTRACTOR_PAYMENT_RIGHT_PRESERVATION_RE =
  /\bSubcontractor(?:'s|\u2019s)\s+(?:right|entitlement)\s+to\s+payment\b/i;''',
    "Subcontractor payment-preservation actor",
)
deterministic = replace_once(
    deterministic,
    r'''(?:right|entitlement)\s+to\s+payment[^.]{0,80}(?:is|shall|will)\s+not\s+(?:waived|forfeited)''',
    r'''(?:right|entitlement)\s+to\s+payment[^.]{0,80}(?:is|are|shall|will)\s+not\s+(?:waived|forfeited)''',
    "plural payment-right preservation",
)
deterministic = replace_once(
    deterministic,
    r'''  if (PRIME_PAYMENT_RIGHT_PRESERVATION_RE.test(sentence)) return false;''',
    r'''  if (
    PRIME_PAYMENT_RIGHT_PRESERVATION_RE.test(sentence) &&
    !SUBCONTRACTOR_PAYMENT_RIGHT_PRESERVATION_RE.test(sentence)
  ) return false;''',
    "Prime-only payment-preservation guard",
)
deterministic = replace_once(
    deterministic,
    r'''    !PRIME_PAYMENT_RIGHT_PRESERVATION_RE.test(sentence) &&
    (isWaiverSentenceScope || SAME_SCOPE_EXPLICIT_PAYMENT_CONTEXT_RE.test(sentence));''',
    r'''    (!PRIME_PAYMENT_RIGHT_PRESERVATION_RE.test(sentence) ||
      SUBCONTRACTOR_PAYMENT_RIGHT_PRESERVATION_RE.test(sentence)) &&
    (isWaiverSentenceScope || SAME_SCOPE_EXPLICIT_PAYMENT_CONTEXT_RE.test(sentence));''',
    "mixed-actor explicit payment preservation",
)

# Split a refused IP grant from a later affirmative grant, including subject-
# elided continuations such as "and grants Prime...".
deterministic = replace_once(
    deterministic,
    r'''const COORDINATED_LICENSE_CONTINUATION_RE =
  /^(?:(?:a|an|the)\s+)?[^.]{0,80}\blicense\b/i;''',
    r'''const COORDINATED_LICENSE_CONTINUATION_RE =
  /^(?:(?:(?:a|an|the)\s+)?[^.]{0,80}\blicense\b|grants?\b)/i;''',
    "coordinated license grant continuation",
)
deterministic = replace_once(
    deterministic,
    r'''function coordinatedIpUseSegments(sentence: string): string[] {
  const directLicenseActor = DIRECT_PRIME_LICENSE_ACTOR_RE.exec(sentence)?.[0] ?? null;
  return sentence
    .split(
      /;\s*|,\s*(?:and|but|while|whereas)\s+|\s+(?:and|but)\s+(?=(?:deliverables?|services?|work\s+products?|improvements?|adaptations?)\b[^.]{0,80}\b(?:may|shall|will|is|are|has|have)\b)|\s+and\s+(?=(?:(?:a|an|the)\s+)?[^.;]{0,80}\blicense\b)/i
    )
    .map((segment, index) => {
      const trimmed = segment.trim();
      if (
        !trimmed ||
        index === 0 ||
        !directLicenseActor ||
        !COORDINATED_LICENSE_CONTINUATION_RE.test(trimmed)
      ) {
        return trimmed;
      }
      return `${directLicenseActor} ${trimmed}`;
    })
    .filter(Boolean);
}''',
    r'''function coordinatedIpUseSegments(sentence: string): string[] {
  const directLicenseActor = DIRECT_PRIME_LICENSE_ACTOR_RE.exec(sentence)?.[0] ?? null;
  const subcontractorSubject = /\bSubcontractor\b/i.test(sentence) ? "Subcontractor" : null;
  return sentence
    .split(
      /;\s*|,\s*(?:and|but|while|whereas)\s+|\s+(?:and|but)\s+(?=(?:deliverables?|services?|work\s+products?|improvements?|adaptations?)\b[^.]{0,80}\b(?:may|shall|will|is|are|has|have)\b)|\s+and\s+(?=(?:(?:a|an|the)\s+)?[^.;]{0,80}\blicense\b)|\s+(?:and|but)\s+(?=(?:Subcontractor\s+)?grants?\b)/i
    )
    .map((segment, index) => {
      const trimmed = segment.trim();
      if (!trimmed || index === 0 || !COORDINATED_LICENSE_CONTINUATION_RE.test(trimmed)) {
        return trimmed;
      }
      if (/^grants?\b/i.test(trimmed) && subcontractorSubject) {
        return `${subcontractorSubject} ${trimmed}`;
      }
      if (directLicenseActor) {
        return `${directLicenseActor} ${trimmed}`;
      }
      return trimmed;
    })
    .filter(Boolean);
}''',
    "branch-local coordinated IP grants",
)

# Split repeated party-consent branches so a refusal of one forum cannot hide a
# later affirmative forum selection.
deterministic = replace_once(
    deterministic,
    r'''|\s+(?:and|but)\s+instead\s+(?=(?:irrevocably\s+)?(?:submits?|consents?)\s+to\s+(?:the\s+)?exclusive\s+jurisdiction\b)|\s+(?:and|but)\s+(?=''',
    r'''|\s+(?:and|but)\s+instead\s+(?=(?:irrevocably\s+)?(?:submits?|consents?)\s+to\s+(?:the\s+)?exclusive\s+jurisdiction\b)|\s+(?:and|but)\s+(?=(?:(?:each|either|both|the)\s+part(?:y|ies)\s+)?(?:(?:hereby|irrevocably|expressly)\s+)*(?:submits?|consents?)\s+to\s+(?:the\s+)?exclusive\s+jurisdiction\b)|\s+(?:and|but)\s+(?=''',
    "repeated forum consent branch split",
)

# Split repeated party arbitration agreements so an earlier rejection does not
# suppress a later affirmative agreement.
deterministic = replace_once(
    deterministic,
    r'''|\s+(?:and|but)\s+(?=(?:(?:(?:all|any|the)\s+)?(?:disputes?|claims?|controvers(?:y|ies))\b''',
    r'''|\s+(?:and|but)\s+(?=(?:the\s+)?part(?:y|ies)\b\s+(?:(?:hereby|irrevocably|expressly|mutually)\s+)*(?:(?:agree|agrees|consent|consents)|(?:shall|must|will)\s+(?:agree|consent))\s+to\s+binding\s+arbitration\b)|\s+(?:and|but)\s+(?=(?:(?:(?:all|any|the)\s+)?(?:disputes?|claims?|controvers(?:y|ies))\b''',
    "repeated arbitration agreement branch split",
)

# Split replacement governing-law language where the second branch elides the
# Agreement/Subcontract subject.
deterministic = replace_once(
    deterministic,
    r'''|\s+(?:and|but)\s+(?=(?:(?:this\s+)?(?:Agreement|Subcontract|Contract)\b''',
    r'''|\s+(?:and|but)\s+instead\s+(?=(?:shall|will|must)\s+be\s+governed\s+by\s+the\s+laws?\s+of\b)|\s+(?:and|but)\s+(?=(?:(?:this\s+)?(?:Agreement|Subcontract|Contract)\b''',
    "replacement governing-law branch split",
)

# Export subtype-specific helpers for the sanity layer.
deterministic = replace_once(
    deterministic,
    r'''function hasMandatoryArbitrationEvidence(text: string): boolean {''',
    r'''export function hasMandatoryArbitrationEvidence(text: string): boolean {''',
    "export arbitration evidence helper",
)
deterministic = replace_once(
    deterministic,
    r'''function hasSelectedGoverningLawEvidence(text: string): boolean {''',
    r'''export function hasSelectedGoverningLawEvidence(text: string): boolean {''',
    "export governing-law evidence helper",
)

deterministic_path.write_text(deterministic)


sanity_path = Path("lib/analyzer/sanity.ts")
sanity = sanity_path.read_text()
sanity = replace_once(
    sanity,
    r'''  hasProtectiveTerminationForConvenienceRestrictionEvidence,
  hasTerminationForConvenienceRiskEvidence,
  hasVenueGoverningLawOrArbitrationEvidence,
  hasUnpaidPrimeImprovementsUseEvidence,''',
    r'''  hasProtectiveTerminationForConvenienceRestrictionEvidence,
  hasTerminationForConvenienceRiskEvidence,
  hasMandatoryArbitrationEvidence,
  hasMandatoryForumEvidence,
  hasSelectedGoverningLawEvidence,
  hasVenueGoverningLawOrArbitrationEvidence,
  hasUnpaidPrimeImprovementsUseEvidence,''',
    "import subtype-specific forum helpers",
)
old_forum_guard = r'''  const forumSelectionCategory =
    /out-of-state\s+venue|governing\s+law|arbitration\s+burden/i.test(reg);
  const filedInForumClaim =
    /filed\s+in\s+(?:(?:a|the)\s+)?(?:courts?|forum)\b|filed\s+in\s+(?:(?:the\s+)?(?:State|Commonwealth)\s+of\s+)?[A-Z][A-Za-z.'-]*(?:\s+[A-Z][A-Za-z.'-]*){0,4}\s+(?:County|State|Commonwealth|District|City)\b/i.test(claim);
  const explicitForumSelectionClaim =
    /forum\s+(?:far|stated|required)|must\s+be\s+brought|(?:must|shall|required\s+to)\s+(?:litigate|arbitrate)/i.test(claim) ||
    filedInForumClaim;
  const forumBurdenClaim = forumSelectionCategory || explicitForumSelectionClaim;
  const forumBurdenEvidence = hasVenueGoverningLawOrArbitrationEvidence(quote);
  if (forumBurdenClaim && !forumBurdenEvidence) {
    return "Finding's analysis claims a litigation, arbitration, or forum requirement that is not stated in the finding's own verified quote.";
  }'''
new_forum_guard = r'''  const forumSelectionCategory =
    /out-of-state\s+venue|governing\s+law|arbitration\s+burden/i.test(reg);
  const filedInForumClaim =
    /filed\s+in\s+(?:(?:a|the)\s+)?(?:courts?|forum)\b|filed\s+in\s+(?:(?:the\s+)?(?:State|Commonwealth)\s+of\s+)?[A-Z][A-Za-z.'-]*(?:\s+[A-Z][A-Za-z.'-]*){0,4}\s+(?:County|State|Commonwealth|District|City)\b/i.test(claim);
  const arbitrationRequirementClaim =
    /(?:requires?|must|shall|required\s+to)[^.]{0,120}\b(?:binding\s+)?arbitration\b|\bresolved\s+(?:exclusively\s+)?through\s+(?:binding\s+)?arbitration\b/i.test(claim);
  const governingLawSelectionClaim =
    /\bselects?\s+(?:the\s+)?governing\s+law\b|\bgoverned\s+by\s+the\s+laws?\s+of\b|\bgoverning\s+law\s+(?:is|shall|will)\b/i.test(claim);
  const explicitForumSelectionClaim =
    /forum\s+(?:far|stated|required)|(?:requires?|must|shall|required\s+to|permits?)[^.]{0,120}\b(?:litigat|courts?|venue|jurisdiction|forum)\b|must\s+be\s+brought/i.test(claim) ||
    filedInForumClaim;

  if (arbitrationRequirementClaim && !hasMandatoryArbitrationEvidence(quote)) {
    return "Finding's analysis claims required arbitration that is not stated in the finding's own verified quote.";
  }
  if (explicitForumSelectionClaim && !hasMandatoryForumEvidence(quote)) {
    return "Finding's analysis claims a litigation or forum requirement that is not stated in the finding's own verified quote.";
  }
  if (governingLawSelectionClaim && !hasSelectedGoverningLawEvidence(quote)) {
    return "Finding's analysis claims a selected governing law that is not stated in the finding's own verified quote.";
  }

  const hasRecognizedForumSubtypeClaim =
    arbitrationRequirementClaim || explicitForumSelectionClaim || governingLawSelectionClaim;
  if (
    forumSelectionCategory &&
    !hasRecognizedForumSubtypeClaim &&
    !hasVenueGoverningLawOrArbitrationEvidence(quote)
  ) {
    return "Finding's analysis claims a litigation, arbitration, governing-law, or forum burden that is not stated in the finding's own verified quote.";
  }'''
sanity = replace_once(sanity, old_forum_guard, new_forum_guard, "subtype-specific forum verification")
sanity_path.write_text(sanity)


test_path = Path("lib/analyzer/__tests__/orion-parity-regression.test.mjs")
tests = test_path.read_text()
marker = "\nif (failures > 0) {\n"
if tests.count(marker) != 1:
    raise SystemExit(f"test marker: expected one match, found {tests.count(marker)}")

additions = r'''

function forumSubtypeFinding(foundText, riskAnalysis) {
  return {
    triggerType: "Contract Risk Trigger",
    regulation: "Out-of-State Venue, Governing Law, or Arbitration Burden",
    severity: "Medium",
    foundText,
    riskAnalysis,
    redlineFix: "Confirm the actual dispute provision.",
  };
}

const governingLawQuoteOnly = "This Agreement shall be governed by the laws of the Commonwealth of Virginia.";
const inventedFairfaxVenueFinding = forumSubtypeFinding(
  governingLawQuoteOnly,
  "This clause requires all disputes to be litigated in Fairfax County."
);
check(
  "governing-law evidence does not verify an invented litigation forum",
  verifyFindings([inventedFairfaxVenueFinding], governingLawQuoteOnly).verified.length === 0
);
const groundedGoverningLawFinding = forumSubtypeFinding(
  governingLawQuoteOnly,
  "This clause selects the governing law stated in the quote."
);
check(
  "selected governing-law analysis verifies against governing-law evidence",
  verifyFindings([groundedGoverningLawFinding], governingLawQuoteOnly).verified.length === 1
);

const ArlingtonForumQuoteOnly = "Any action shall be brought in the state courts in Arlington County, Virginia.";
const inventedArbitrationFinding = forumSubtypeFinding(
  ArlingtonForumQuoteOnly,
  "This clause requires all disputes to be resolved through binding arbitration."
);
check(
  "venue evidence does not verify an invented arbitration requirement",
  verifyFindings([inventedArbitrationFinding], ArlingtonForumQuoteOnly).verified.length === 0
);
const groundedArlingtonFinding = forumSubtypeFinding(
  ArlingtonForumQuoteOnly,
  "This clause requires disputes to be litigated in the forum stated in the quote."
);
check(
  "forum analysis verifies against actual mandatory-forum evidence",
  verifyFindings([groundedArlingtonFinding], ArlingtonForumQuoteOnly).verified.length === 1
);

const mixedActorPaymentPreservation = productionPath(`
2.8 Invoice Requirements
Failure to submit a complete invoice within 30 calendar days waives the right to payment. Prime Contractor's right to payment and Subcontractor's right to payment are not waived.
`);
check(
  "mixed Prime and Subcontractor payment preservation protects the Subcontractor waiver",
  !mixedActorPaymentPreservation.findings.some(
    (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
  )
);
const primeOnlyPaymentPreservation = productionPath(`
2.8 Invoice Requirements
Failure to submit a complete invoice within 30 calendar days waives the right to payment. Prime Contractor's right to payment is not waived.
`);
check(
  "Prime-only payment preservation does not protect the Subcontractor waiver",
  primeOnlyPaymentPreservation.findings.some(
    (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
  )
);

const refusedThenGrantedIp = productionPath(`
2.17 Improvements
Subcontractor refuses to grant Prime Contractor a royalty-free license to Adaptations and grants Prime Contractor a royalty-free license to Improvements.
`);
check(
  "refused Adaptations grant does not hide a later affirmative Improvements grant",
  refusedThenGrantedIp.findings.some(
    (finding) => finding.regulation === "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements"
  )
);
const refusedIpOnly = productionPath(`
2.17 Improvements
Subcontractor refuses to grant Prime Contractor a royalty-free license to Improvements.
`);
check(
  "standalone refused Improvements grant remains clean",
  !refusedIpOnly.findings.some(
    (finding) => finding.regulation === "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements"
  )
);

const refusedThenConsentedForum = productionPath(`
2.23 Dispute Resolution
Each party refuses to consent to exclusive jurisdiction in Fairfax County and each party hereby irrevocably consents to the exclusive jurisdiction of the courts in Arlington County, Virginia.
`);
check(
  "refused Fairfax forum does not hide repeated-party Arlington consent",
  refusedThenConsentedForum.findings.some(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  )
);
const refusedForumOnly = productionPath(`
2.23 Dispute Resolution
Each party refuses to consent to exclusive jurisdiction in Fairfax County.
`);
check(
  "standalone forum refusal remains clean after repeated-party splitting",
  !refusedForumOnly.findings.some(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  )
);

const rejectedThenAgreedArbitration = productionPath(`
2.23 Dispute Resolution
The parties do not agree to binding arbitration for invoice disputes and the parties hereby agree to binding arbitration for intellectual-property disputes.
`);
check(
  "rejected invoice arbitration does not hide repeated-party affirmative IP arbitration",
  rejectedThenAgreedArbitration.findings.some(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  )
);
const rejectedArbitrationOnly = productionPath(`
2.23 Dispute Resolution
The parties do not agree to binding arbitration for invoice disputes.
`);
check(
  "standalone arbitration rejection remains clean after repeated-party splitting",
  !rejectedArbitrationOnly.findings.some(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  )
);

const replacementGoverningLaw = productionPath(`
2.23 Governing Law
This Agreement shall not be governed by the laws of Virginia and instead shall be governed by the laws of Maryland.
`);
const replacementLawFinding = replacementGoverningLaw.findings.find(
  (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
);
check(
  "negated Virginia law does not hide replacement Maryland governing law",
  Boolean(replacementLawFinding && /Maryland/i.test(replacementLawFinding.foundText))
);
const negatedGoverningLawOnly = productionPath(`
2.23 Governing Law
This Agreement shall not be governed by the laws of Virginia.
`);
check(
  "standalone negated governing law remains clean after replacement-law splitting",
  !negatedGoverningLawOnly.findings.some(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  )
);
'''

tests = tests.replace(marker, additions + marker, 1)
test_path.write_text(tests)
