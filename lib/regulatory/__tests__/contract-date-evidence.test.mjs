import {
  extractContractDateEvidence,
  resolveContractDateEvidence,
} from "../contract-date-evidence.ts";
import { selectRegulatoryVersionForDate } from "../historical-selection.ts";
import {
  QA_B_REPRESENTATIONS,
  QA_D_REPRESENTATIONS,
} from "../../analyzer/__fixtures__/core-accuracy-benchmark-fixtures.mjs";
import { normalizeWhitespace, quoteExistsInDocument } from "../../analyzer/text.ts";

let assertions = 0;
let failures = 0;

function check(label, condition, details = "") {
  assertions++;
  if (condition) console.log(`PASS: ${label}`);
  else {
    failures++;
    console.error(`FAIL: ${label}${details ? ` — ${details}` : ""}`);
  }
}

function resolved(documentText, basis, expectedDate) {
  const result = resolveContractDateEvidence(documentText, basis);
  check(
    `${basis}: resolves ${expectedDate}`,
    result.status === "resolved" && result.context?.asOfDate === expectedDate,
    `${result.status}: ${result.explanation}`
  );
  if (result.context) {
    check(
      `${basis}: emitted evidence passes historical selector validation`,
      selectRegulatoryVersionForDate("far-current", [], result.context).status ===
        "no-eligible-approved-snapshots"
    );
    check(
      `${basis}: emitted quote exists in normalized source`,
      result.context.evidenceQuotes.every((quote) =>
        quoteExistsInDocument(quote, normalizeWhitespace(documentText))
      )
    );
  }
  return result;
}

const MULTI_BASIS_DOCUMENT = `FICTIONAL FEDERAL SUBCONTRACT DATE PACKAGE
Solicitation Issued: 2026-01-05
Proposal Due Date: 02/20/2026
Subcontract Effective Date: March 1, 2026
Modification No. 0001 Effective Date:
April 15, 2026
Period of Performance: May 1, 2026 through April 30, 2027
FAR 52.222-6 Construction Wage Rate Requirements (Aug 2018)
Subcontract Number: W912XX-26-C-0044
Notice of claim must be submitted within two calendar days.
CMMC clause effective date of future rule: June 1, 2026.
END FIXTURE`;

resolved(MULTI_BASIS_DOCUMENT, "solicitation-issued", "2026-01-05");
resolved(MULTI_BASIS_DOCUMENT, "proposal-due", "2026-02-20");
resolved(MULTI_BASIS_DOCUMENT, "subcontract-executed", "2026-03-01");
resolved(MULTI_BASIS_DOCUMENT, "modification-effective", "2026-04-15");
const performance = resolved(
  MULTI_BASIS_DOCUMENT,
  "performance-started",
  "2026-05-01"
);
check(
  "period-of-performance resolution selects the start and not the end date",
  performance.context?.asOfDate === "2026-05-01" &&
    performance.candidates.every((candidate) => candidate.normalizedDate !== "2027-04-30")
);

const multiExtraction = extractContractDateEvidence(MULTI_BASIS_DOCUMENT);
check(
  "all five governing date bases are extracted",
  new Set(multiExtraction.candidates.map((candidate) => candidate.basis)).size === 5
);
check(
  "clause revision, contract number, notice deadline, and clause-specific effective date are not extracted as governing dates",
  multiExtraction.candidates.every(
    (candidate) =>
      !/Aug 2018|W912XX-26-C-0044|two calendar days|CMMC clause effective date/i.test(
        candidate.foundText
      )
  )
);

const SOLICITATION_DUE_TRAP = `Solicitation Proposal Due Date: July 10, 2026.`;
check(
  "proposal due language is not misclassified as solicitation issuance",
  resolveContractDateEvidence(SOLICITATION_DUE_TRAP, "solicitation-issued").status ===
    "not-found" &&
    resolveContractDateEvidence(SOLICITATION_DUE_TRAP, "proposal-due").context
      ?.asOfDate === "2026-07-10"
);

const CLAUSE_EFFECTIVE_TRAP = `Effective Date of CMMC Requirement: August 1, 2026.`;
check(
  "clause-specific effective-date wording is not treated as subcontract execution",
  resolveContractDateEvidence(CLAUSE_EFFECTIVE_TRAP, "subcontract-executed").status ===
    "not-found"
);

const WRAPPED_MODIFICATION = `Modification 0002 Effective Date:
September 30, 2026`;
resolved(WRAPPED_MODIFICATION, "modification-effective", "2026-09-30");

const FLATTENED_REPEATED_MODIFICATIONS =
  `Modification 0001 Effective Date: October 1, 2026. ` +
  `Administrative text. Modification 0002 Effective Date: November 1, 2026.`;
const ambiguous = resolveContractDateEvidence(
  FLATTENED_REPEATED_MODIFICATIONS,
  "modification-effective"
);
check(
  "multiple distinct modification dates in flattened text remain ambiguous",
  ambiguous.status === "ambiguous" &&
    new Set(ambiguous.candidates.map((candidate) => candidate.normalizedDate)).size === 2
);

const REPEATED_SAME_DATE = `Modification 0001 Effective Date: December 1, 2026.
Amendment A Effective Date: December 1, 2026.`;
const repeatedSame = resolveContractDateEvidence(
  REPEATED_SAME_DATE,
  "modification-effective"
);
check(
  "repeated references to the same modification date resolve rather than create false ambiguity",
  repeatedSame.status === "resolved" &&
    repeatedSame.context?.asOfDate === "2026-12-01" &&
    repeatedSame.candidates.length >= 2
);

const INVALID_DATE = `Subcontract Effective Date: February 30, 2026.`;
const invalidExtraction = extractContractDateEvidence(INVALID_DATE);
check(
  "impossible calendar dates are retained only as rejected date text",
  invalidExtraction.candidates.length === 0 &&
    invalidExtraction.rejectedDateTexts.includes("February 30, 2026") &&
    resolveContractDateEvidence(INVALID_DATE, "subcontract-executed").status ===
      "not-found"
);

const DISTANT_UNRELATED_DATE =
  `Modification 0003 is discussed without an effective-date label. ` +
  `This paragraph contains unrelated obligations and supporting facts that continue for more than one hundred characters before a later audit record dated January 5, 2027.`;
check(
  "a distant unrelated date cannot be attached to a modification anchor",
  resolveContractDateEvidence(DISTANT_UNRELATED_DATE, "modification-effective").status ===
    "not-found"
);

for (const [representationName, documentText] of QA_B_REPRESENTATIONS) {
  const result = resolveContractDateEvidence(documentText, "performance-started");
  check(
    `QA-B ${representationName}: period start resolves consistently`,
    result.status === "resolved" && result.context?.asOfDate === "2026-09-01"
  );
  check(
    `QA-B ${representationName}: period start is not inferred as subcontract execution`,
    resolveContractDateEvidence(documentText, "subcontract-executed").status ===
      "not-found"
  );
}

for (const [representationName, documentText] of QA_D_REPRESENTATIONS) {
  const result = resolveContractDateEvidence(documentText, "performance-started");
  check(
    `QA-D ${representationName}: period start resolves consistently`,
    result.status === "resolved" && result.context?.asOfDate === "2026-11-01"
  );
  check(
    `QA-D ${representationName}: period start is not inferred as subcontract execution`,
    resolveContractDateEvidence(documentText, "subcontract-executed").status ===
      "not-found"
  );
}

const NO_LABEL_DOCUMENT = `The parties discussed June 15, 2026 during negotiations.
Records are retained for three years.`;
check(
  "an unrelated calendar date without a governing-date label is not selected",
  extractContractDateEvidence(NO_LABEL_DOCUMENT).candidates.length === 0
);
check(
  "empty contract text returns invalid-document",
  resolveContractDateEvidence("", "subcontract-executed").status ===
    "invalid-document"
);

if (failures > 0) {
  console.error(`\n${failures} of ${assertions} contract-date evidence assertions failed.`);
  process.exit(1);
}

console.log(`\nAll ${assertions} contract-date evidence assertions passed.`);
