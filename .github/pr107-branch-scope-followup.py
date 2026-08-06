from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)


deterministic_path = Path("lib/analyzer/deterministic.ts")
deterministic = deterministic_path.read_text()

old_indexes = r'''function stripNegatedInvoicePaymentWaiverBranches(sentence: string): string {
  let remaining = sentence;
  while (NEGATED_INVOICE_PAYMENT_WAIVER_RE.test(remaining)) {
    remaining = remaining.replace(NEGATED_INVOICE_PAYMENT_WAIVER_RE, " ");
  }
  return remaining;
}

function invoiceWaiverSentenceIndexes(sentences: string[]): number[] {
  return sentences.flatMap((sentence, index) => {
    const affirmativeScope = stripNegatedInvoicePaymentWaiverBranches(sentence);
    if (INVOICE_PAYMENT_WAIVER_RE.test(affirmativeScope)) return [index];
    if (
      INVOICE_PAYMENT_FORFEITURE_CONTEXT_RE.test(affirmativeScope) &&
      INVOICE_SUBMISSION_DEADLINE_RE.test(sentence)
    ) {
      return [index];
    }
    const carriesPriorInvoiceDeadline =
      INVOICE_PAYMENT_FORFEITURE_SENTENCE_RE.test(affirmativeScope) ||
      INVOICE_PAYMENT_FORFEITURE_CONTEXT_RE.test(affirmativeScope);
    if (
      carriesPriorInvoiceDeadline &&
      index > 0 &&
      INVOICE_SUBMISSION_DEADLINE_RE.test(sentences[index - 1])
    ) {
      return [index];
    }
    return [];
  });
}'''
new_indexes = r'''function affirmativeInvoiceWaiverBranches(sentence: string): string[] {
  return sentence
    .split(/\s*(?:;|,\s*but\b|\bbut\b)\s*/i)
    .map((branch) => branch.trim())
    .filter(Boolean)
    .filter((branch) => !NEGATED_INVOICE_PAYMENT_WAIVER_RE.test(branch));
}

function invoiceWaiverSentenceIndexes(sentences: string[]): number[] {
  return sentences.flatMap((sentence, index) => {
    const affirmativeBranches = affirmativeInvoiceWaiverBranches(sentence);
    if (affirmativeBranches.some((branch) => INVOICE_PAYMENT_WAIVER_RE.test(branch))) {
      return [index];
    }

    const carriesInvoiceWaiver = affirmativeBranches.some(
      (branch) =>
        INVOICE_PAYMENT_FORFEITURE_SENTENCE_RE.test(branch) ||
        INVOICE_PAYMENT_FORFEITURE_CONTEXT_RE.test(branch)
    );
    if (!carriesInvoiceWaiver) return [];

    const sentenceCarriesInvoiceSubmissionDeadline =
      INVOICE_SUBMISSION_DEADLINE_RE.test(sentence) ||
      /failure\s+to\s+submit[^.]{0,180}\binvoice\b[^.]{0,160}(?:within|no\s+later\s+than)\s+\d{1,3}\s*(?:calendar|business|working)?\s*days?/i.test(
        sentence
      );
    if (sentenceCarriesInvoiceSubmissionDeadline) return [index];
    if (
      index > 0 &&
      INVOICE_SUBMISSION_DEADLINE_RE.test(sentences[index - 1])
    ) {
      return [index];
    }
    return [];
  });
}'''
deterministic = replace_once(
    deterministic,
    old_indexes,
    new_indexes,
    "branch-local invoice waiver evaluation",
)

old_postfix = r'''const DIRECT_PRIME_POSTFIX_UNPAID_IMPROVEMENT_LICENSE_RE =
  /\bSubcontractor\b[^.]{0,100}\bgrants?\b(?:(?:(?!\b(?:deliverables?|services?|work\s+products?)\b)[^.]){0,180})\b(?:the\s+)?Prime(?:\s+Contractor)?\b(?:(?:(?!\b(?:deliverables?|services?|work\s+products?)\b)[^.]){0,160})\blicense\b(?:(?:(?!\b(?:deliverables?|services?|work\s+products?)\b)[^.]){0,140})\b(?:improvements?|adaptations?)\b(?:(?:(?!\b(?:deliverables?|services?|work\s+products?)\b)[^.]){0,100})\b(?:on\s+(?:a\s+)?royalty[\s-]?free\s+basis|royalty[\s-]?free|free\s+of\s+charge|without\s+(?:additional\s+)?(?:payment|compensation|charge|fee)|at\s+no\s+(?:additional\s+)?(?:cost|charge|fee|expense))\b/i;'''
new_postfix = r'''const DIRECT_PRIME_POSTFIX_UNPAID_IMPROVEMENT_LICENSE_RE =
  /\bSubcontractor\b[^.]{0,100}\bgrants?\b(?:(?:(?!\b(?:deliverables?|services?|work\s+products?)\b)[^.]){0,180})\b(?:the\s+)?Prime(?:\s+Contractor)?\b(?:(?:(?!\b(?:deliverables?|services?|work\s+products?)\b)[^.]){0,160})\blicense\b(?:(?:(?!\b(?:deliverables?|services?|work\s+products?)\b)[^.]){0,140})\b(?:improvements?|adaptations?)\b(?:(?:(?!\b(?:deliverables?|services?|work\s+products?|licenses?)\b)[^.]){0,100})\b(?:on\s+(?:a\s+)?royalty[\s-]?free\s+basis|royalty[\s-]?free|free\s+of\s+charge|without\s+(?:additional\s+)?(?:payment|compensation|charge|fee)|at\s+no\s+(?:additional\s+)?(?:cost|charge|fee|expense))\b/i;'''
deterministic = replace_once(
    deterministic,
    old_postfix,
    new_postfix,
    "keep postfix unpaid qualifier inside its own license grant",
)

old_segments = r'''function coordinatedIpUseSegments(sentence: string): string[] {
  return sentence
    .split(
      /;\s*|,\s*(?:and|but|while|whereas)\s+|\s+and\s+(?=(?:deliverables?|services?|work\s+products?|improvements?|adaptations?)\b[^.]{0,80}\b(?:may|shall|will|is|are|has|have)\b)/i
    )
    .map((segment) => segment.trim())
    .filter(Boolean);
}'''
new_segments = r'''const DIRECT_PRIME_LICENSE_ACTOR_RE =
  /\bSubcontractor\b[^.]{0,100}\bgrants?\b[^.]{0,180}\b(?:the\s+)?Prime(?:\s+Contractor)?\b/i;
const COORDINATED_LICENSE_CONTINUATION_RE =
  /^(?:(?:a|an|the)\s+)?[^.]{0,80}\blicense\b/i;

function coordinatedIpUseSegments(sentence: string): string[] {
  const directLicenseActor = DIRECT_PRIME_LICENSE_ACTOR_RE.exec(sentence)?.[0] ?? null;
  return sentence
    .split(
      /;\s*|,\s*(?:and|but|while|whereas)\s+|\s+and\s+(?=(?:deliverables?|services?|work\s+products?|improvements?|adaptations?)\b[^.]{0,80}\b(?:may|shall|will|is|are|has|have)\b)|\s+and\s+(?=(?:(?:a|an|the)\s+)?[^.;]{0,80}\blicense\b)/i
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
}'''
deterministic = replace_once(
    deterministic,
    old_segments,
    new_segments,
    "split coordinated license grants while preserving the Prime actor",
)

deterministic_path.write_text(deterministic)
