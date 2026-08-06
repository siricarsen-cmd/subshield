from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)


deterministic_path = Path("lib/analyzer/deterministic.ts")
deterministic = deterministic_path.read_text()

# Treat cannot/can not as explicit local negation of invoice-payment forfeiture.
deterministic = replace_once(
    deterministic,
    r'''(?:(?:does|shall|will|may)\s+not|never)\s+(?:waive|forfeit)''',
    r'''(?:(?:does|shall|will|may|can)\s+not|cannot|never)\s+(?:waive|forfeit)''',
    "cannot-waive invoice negation",
)

# Track each waiver branch independently, including multiple waivers in one sentence.
start = deterministic.index("function invoiceWaiverSentenceIndexes")
end = deterministic.index("\nfunction findInvoicePaymentWaiverCandidate", start)
new_invoice_scope_block = r'''type InvoiceWaiverScope = {
  sentenceIndex: number;
  waiverScope: string;
};

function branchCarriesInvoicePaymentWaiver(
  branch: string,
  sentence: string,
  previousSentence: string
): boolean {
  if (INVOICE_PAYMENT_WAIVER_RE.test(branch)) return true;
  if (
    !INVOICE_PAYMENT_FORFEITURE_SENTENCE_RE.test(branch) &&
    !INVOICE_PAYMENT_FORFEITURE_CONTEXT_RE.test(branch)
  ) {
    return false;
  }

  if (
    hasInvoiceSubmissionDeadlineEvidence(branch) &&
    nearestInvoiceDeadlineTargetsSubcontractor(branch)
  ) {
    return true;
  }

  const branchIndex = sentence.lastIndexOf(branch);
  const precedingSameSentence = branchIndex > 0 ? sentence.slice(0, branchIndex) : "";
  if (
    hasInvoiceSubmissionDeadlineEvidence(precedingSameSentence) &&
    nearestInvoiceDeadlineTargetsSubcontractor(precedingSameSentence)
  ) {
    return true;
  }

  return (
    hasInvoiceSubmissionDeadlineEvidence(previousSentence) &&
    nearestInvoiceDeadlineTargetsSubcontractor(previousSentence)
  );
}

function invoiceWaiverScopes(sentences: string[]): InvoiceWaiverScope[] {
  return sentences.flatMap((sentence, sentenceIndex) =>
    affirmativeInvoiceWaiverBranches(sentence)
      .filter((branch) =>
        branchCarriesInvoicePaymentWaiver(
          branch,
          sentence,
          sentences[sentenceIndex - 1] ?? ""
        )
      )
      .map((waiverScope) => ({ sentenceIndex, waiverScope }))
  );
}

function waivedInvoiceIdsForScope(
  sentences: string[],
  scope: InvoiceWaiverScope,
  operativeWaiverScope: string
): string[] {
  const directIds = extractInvoiceIds(operativeWaiverScope);
  if (directIds.length > 0) return directIds;

  const refersBackToPriorInvoice =
    (INVOICE_PAYMENT_FORFEITURE_SENTENCE_RE.test(operativeWaiverScope) &&
      /\b(?:the|this|such)\s+invoice\b/i.test(operativeWaiverScope)) ||
    INVOICE_PAYMENT_FORFEITURE_CONTEXT_RE.test(operativeWaiverScope);
  if (!refersBackToPriorInvoice) return [];

  const sentence = sentences[scope.sentenceIndex];
  const scopeIndex = sentence.lastIndexOf(scope.waiverScope);
  const precedingSameSentence = scopeIndex > 0 ? sentence.slice(0, scopeIndex) : "";
  if (hasInvoiceSubmissionDeadlineEvidence(precedingSameSentence)) {
    const sameSentenceIds = extractInvoiceIds(precedingSameSentence);
    if (sameSentenceIds.length > 0) return [sameSentenceIds.at(-1)!];
  }

  const previousSentence = sentences[scope.sentenceIndex - 1] ?? "";
  if (INVOICE_SUBMISSION_DEADLINE_RE.test(previousSentence)) {
    const previousIds = extractInvoiceIds(previousSentence);
    if (previousIds.length > 0) return [previousIds.at(-1)!];
  }
  return [];
}

function invoiceWaiverScopeIsPreserved(
  sentences: string[],
  scope: InvoiceWaiverScope
): boolean {
  const connector = PAYMENT_PRESERVATION_CONNECTOR_RE.exec(scope.waiverScope);
  const operativeWaiverScope = connector
    ? scope.waiverScope.slice(0, connector.index)
    : scope.waiverScope;
  const waivedInvoiceIds = waivedInvoiceIdsForScope(
    sentences,
    scope,
    operativeWaiverScope
  );

  if (connector) {
    const preservationScope = scope.waiverScope.slice(connector.index);
    if (sentencePreservesPayment(preservationScope, waivedInvoiceIds, true)) return true;
  }

  const sentence = sentences[scope.sentenceIndex];
  const scopeIndex = sentence.lastIndexOf(scope.waiverScope);
  const laterSameSentence =
    scopeIndex >= 0
      ? sentence.slice(scopeIndex + scope.waiverScope.length)
      : "";
  if (
    laterSameSentence &&
    sentencePreservesPayment(laterSameSentence, waivedInvoiceIds, true)
  ) {
    return true;
  }

  const nextSentence = sentences[scope.sentenceIndex + 1] ?? "";
  return sentencePreservesPayment(nextSentence, waivedInvoiceIds);
}

function hasUnpreservedInvoicePaymentWaiver(block: string): boolean {
  const invoiceSentenceSafeBlock = block.replace(
    /\binvoice\s+no\.\s*(?=[A-Z0-9-]*\d)/gi,
    "Invoice No "
  );
  const sentences = invoiceSentenceSafeBlock.split(/(?<=[.!?])\s+/);
  return invoiceWaiverScopes(sentences).some(
    (scope) => !invoiceWaiverScopeIsPreserved(sentences, scope)
  );
}
'''
deterministic = deterministic[:start] + new_invoice_scope_block + deterministic[end:]

# Bind the reported deadline to the actual unpreserved waiver branch.
start = deterministic.index("function invoicePaymentWaiverDeadline")
end = deterministic.index("\nfunction buildInvoicePaymentWaiverAnalysis", start)
new_deadline_function = r'''function invoicePaymentWaiverDeadline(foundText: string): string | undefined {
  const invoiceSentenceSafeText = foundText.replace(
    /\binvoice\s+no\.\s*(?=[A-Z0-9-]*\d)/gi,
    "Invoice No "
  );
  const sentences = invoiceSentenceSafeText.split(/(?<=[.!?])\s+/);
  const unpreservedScope = invoiceWaiverScopes(sentences).find(
    (scope) => !invoiceWaiverScopeIsPreserved(sentences, scope)
  );
  if (!unpreservedScope) return undefined;

  const invoiceSubmissionDeadline = (sentence: string): string | undefined => {
    const deadlines = [
      ...sentence.matchAll(
        /(?:within|no\s+later\s+than)\s+(\d{1,3}\s*(?:calendar|business|working)?\s*days?)/gi
      ),
    ].filter((deadline) => {
      const prefix = sentence.slice(0, deadline.index ?? 0);
      const boundaries = [
        ...prefix.matchAll(/(?:;|,\s*(?:and|but|while|whereas)\s+|\s+(?:and|but|while|whereas)\s+)/gi),
      ];
      const lastBoundary = boundaries.at(-1);
      const localPrefix = lastBoundary
        ? prefix.slice((lastBoundary.index ?? 0) + lastBoundary[0].length)
        : prefix;
      return (
        /\binvoices?\b/i.test(localPrefix) &&
        /\b(?:submit(?:ted|ting)?|submission)\b/i.test(localPrefix)
      );
    });
    return deadlines.at(-1)?.[1];
  };

  const sentence = sentences[unpreservedScope.sentenceIndex];
  const scopeIndex = sentence.lastIndexOf(unpreservedScope.waiverScope);
  const precedingSameSentence = scopeIndex > 0 ? sentence.slice(0, scopeIndex) : "";
  return (
    invoiceSubmissionDeadline(unpreservedScope.waiverScope) ??
    invoiceSubmissionDeadline(precedingSameSentence) ??
    invoiceSubmissionDeadline(sentences[unpreservedScope.sentenceIndex - 1] ?? "")
  );
}
'''
deterministic = deterministic[:start] + new_deadline_function + deterministic[end:]

# Require royalty-free wording to be affirmative rather than separately negated.
deterministic = replace_once(
    deterministic,
    r'''(?<!non-)(?<!non\s)royalty[\s-]?free''',
    r'''(?<!non-)(?<!non\s)(?<!not\s)(?<!never\s)royalty[\s-]?free''',
    "affirmative royalty-free qualifier",
)

# Reject deferred/unselected forum language before accepting later generic court nouns.
forum_marker = r'''const EXCLUSIVE_FORUM_RE =
  /(?:the\s+)?exclusive\s+forum(?:\s+for[^.]{0,100})?\s+(?:shall|must|will)\s+be[^.]{0,140}(?:courts?|County|State|Commonwealth)/i;'''
forum_replacement = forum_marker + r'''
const DEFERRED_OR_UNSELECTED_FORUM_RE =
  /\b(?:exclusive\s+forum|venue|jurisdiction)\b[^.]{0,140}\b(?:has|have|is|was)\s+not\s+(?:been\s+)?selected\b|\b(?:exclusive\s+forum|venue|jurisdiction)\b[^.]{0,140}\b(?:shall|will|is\s+to)\s+be\s+(?:agreed|selected|determined|specified|identified|provided|negotiated|finalized|established|set\s+forth)\s+(?:later|by\s+(?:(?:mutual\s+)?agreement(?:\s+of\s+(?:the\s+)?parties)?|(?:the\s+)?parties)|in\s+(?:the\s+)?final\s+(?:agreement|subcontract|contract))?/i;'''
deterministic = replace_once(
    deterministic,
    forum_marker,
    forum_replacement,
    "deferred forum guard",
)
deterministic = replace_once(
    deterministic,
    r'''function clauseHasMandatoryForumEvidence(clause: string): boolean {
  if (clauseHasOptionalForumChoice(clause)) return false;''',
    r'''function clauseHasMandatoryForumEvidence(clause: string): boolean {
  if (clauseHasOptionalForumChoice(clause)) return false;
  if (DEFERRED_OR_UNSELECTED_FORUM_RE.test(clause)) return false;''',
    "apply deferred forum guard",
)

# Require an actual present or mandatory agreement to arbitrate; optional may-agree wording stays clean.
old_arbitration = r'''const BINDING_ARBITRATION_REQUIREMENT_RE =
  /\b(?:parties?|Subcontractor|Prime(?:\s+Contractor)?)\b[^.]{0,140}\b(?:agree|consent)\s+to\s+binding\s+arbitration\b|\bbinding\s+arbitration\b[^.]{0,120}(?:(?:is|shall|must|will)\s+(?:be\s+)?(?:required|mandatory)\b|(?:is|shall|must|will)\s+(?:be\s+)?(?:the\s+)?exclusive\s+(?:remedy|means|method|forum|procedure)\b)/i;'''
new_arbitration = r'''const BINDING_ARBITRATION_REQUIREMENT_RE =
  /\b(?:the\s+)?(?:parties?|Subcontractor|Prime(?:\s+Contractor)?)\b\s+(?:(?:hereby|irrevocably|expressly|mutually)\s+)*(?:(?:agree|agrees|consent|consents)|(?:shall|must|will)\s+(?:agree|consent))\s+to\s+binding\s+arbitration\b|\bbinding\s+arbitration\b[^.]{0,120}(?:(?:is|shall|must|will)\s+(?:be\s+)?(?:required|mandatory)\b|(?:is|shall|must|will)\s+(?:be\s+)?(?:the\s+)?exclusive\s+(?:remedy|means|method|forum|procedure)\b)/i;'''
deterministic = replace_once(
    deterministic,
    old_arbitration,
    new_arbitration,
    "mandatory agreement to arbitrate",
)

deterministic_path.write_text(deterministic)


test_path = Path("lib/analyzer/__tests__/orion-parity-regression.test.mjs")
tests = test_path.read_text()
marker = "\nif (failures > 0) {\n"
if tests.count(marker) != 1:
    raise SystemExit(f"test marker: expected one match, found {tests.count(marker)}")

additions = r'''

const optionalAgreementToArbitrate = productionPath(`
2.23 Dispute Resolution
The parties may agree to binding arbitration.
`);
check(
  "optional future agreement to binding arbitration remains clean",
  !optionalAgreementToArbitrate.findings.some(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  )
);

const presentAgreementToArbitrate = productionPath(`
2.23 Dispute Resolution
The parties hereby agree to binding arbitration.
`);
check(
  "present agreement to binding arbitration still triggers",
  presentAgreementToArbitrate.findings.some(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  )
);

const mixedOptionalAndMandatoryArbitration = productionPath(`
2.23 Dispute Resolution
The parties may agree to binding arbitration for invoice disputes, but all intellectual-property claims shall be resolved through binding arbitration.
`);
check(
  "optional invoice arbitration does not hide later mandatory IP arbitration",
  mixedOptionalAndMandatoryArbitration.findings.some(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  )
);

const sameSentenceMixedInvoiceWaivers = productionPath(`
2.8 Invoice Requirements
Failure to submit Invoice 104 within 30 calendar days waives the right to payment, except that Invoice 104 remains payable after cure; failure to submit Invoice 105 within 45 calendar days waives the right to payment.
`);
const sameSentenceMixedInvoiceWaiverFinding = sameSentenceMixedInvoiceWaivers.findings.find(
  (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
);
check(
  "preserved Invoice 104 does not hide unpreserved Invoice 105 in the same sentence",
  Boolean(sameSentenceMixedInvoiceWaiverFinding)
);
check(
  "same-sentence mixed waiver analysis uses the unpreserved Invoice 105 deadline",
  Boolean(sameSentenceMixedInvoiceWaiverFinding?.analysis.includes("45 calendar days"))
);

const sameSentenceBothInvoicesPreserved = productionPath(`
2.8 Invoice Requirements
Failure to submit Invoice 104 within 30 calendar days waives the right to payment, except that Invoice 104 remains payable after cure; failure to submit Invoice 105 within 45 calendar days waives the right to payment, except that Invoice 105 remains payable after cure.
`);
check(
  "two independently preserved same-sentence invoice waivers remain clean",
  !sameSentenceBothInvoicesPreserved.findings.some(
    (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
  )
);

const cannotWaiveInvoicePayment = productionPath(`
2.8 Invoice Requirements
Failure to submit a complete invoice within 30 calendar days cannot waive the right to payment.
`);
check(
  "cannot-waive invoice protection remains clean",
  !cannotWaiveInvoicePayment.findings.some(
    (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
  )
);

const affirmativeWaiverAfterCannotGuard = productionPath(`
2.8 Invoice Requirements
Failure to submit a complete invoice within 30 calendar days waives the right to payment.
`);
check(
  "affirmative invoice waiver still triggers after cannot-waive guard",
  affirmativeWaiverAfterCannotGuard.findings.some(
    (finding) => finding.regulation === "Invoice Submission Deadline / Payment Waiver"
  )
);

const separatelyNegatedRoyaltyFreeLicense = productionPath(`
2.17 Improvements
Prime Contractor may use Improvements only under a license that is not royalty-free and requires additional compensation.
`);
check(
  "separately negated royalty-free Improvements license remains clean",
  !separatelyNegatedRoyaltyFreeLicense.findings.some(
    (finding) => finding.regulation === "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements"
  )
);

const affirmativeRoyaltyFreeAfterSeparateNegationGuard = productionPath(`
2.17 Improvements
Prime Contractor may use Improvements under a royalty-free license.
`);
check(
  "affirmative royalty-free Improvements use still triggers after separate-negation guard",
  affirmativeRoyaltyFreeAfterSeparateNegationGuard.findings.some(
    (finding) => finding.regulation === "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements"
  )
);

const mixedNegatedAndAffirmativeRoyaltyFreeUse = productionPath(`
2.17 Improvements
Prime Contractor may use Adaptations only under a license that is not royalty-free and requires additional compensation, but Prime Contractor may use Improvements under a royalty-free license.
`);
check(
  "negated Adaptations qualifier does not hide later affirmative royalty-free Improvements use",
  mixedNegatedAndAffirmativeRoyaltyFreeUse.findings.some(
    (finding) => finding.regulation === "Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements"
  )
);

const deferredExclusiveForum = productionPath(`
2.23 Dispute Resolution
The exclusive forum shall be selected later from state or federal courts.
`);
check(
  "deferred exclusive-forum selection remains clean",
  !deferredExclusiveForum.findings.some(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  )
);

const selectedExclusiveForumAfterDeferralGuard = productionPath(`
2.23 Dispute Resolution
The exclusive forum for all disputes shall be the state courts in Arlington County, Virginia.
`);
check(
  "actually selected exclusive forum still triggers after deferral guard",
  selectedExclusiveForumAfterDeferralGuard.findings.some(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  )
);

const deferredForumDoesNotHideSelectedForum = productionPath(`
2.23 Dispute Resolution
The exclusive forum for invoice disputes shall be selected later. Any action concerning intellectual property shall be brought in Arlington County, Virginia.
`);
check(
  "deferred invoice forum does not hide later selected IP forum",
  deferredForumDoesNotHideSelectedForum.findings.some(
    (finding) => finding.regulation === "Out-of-State Venue, Governing Law, or Arbitration Burden"
  )
);
'''

tests = tests.replace(marker, additions + marker, 1)
test_path.write_text(tests)
