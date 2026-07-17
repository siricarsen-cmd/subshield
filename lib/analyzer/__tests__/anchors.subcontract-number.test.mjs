// Focused regression check for subcontract-number anchor extraction.
// No test runner is configured in this repo - run directly with
// `node lib/analyzer/__tests__/anchors.subcontract-number.test.mjs`
// (Node 24 strips TS types natively; anchors.ts has no runtime relative
// imports because its `from "./types"` import is type-only).
import { extractAnchorCandidates } from "../anchors.ts";

let failures = 0;

function check(label, condition) {
  if (condition) {
    console.log(`PASS: ${label}`);
  } else {
    console.error(`FAIL: ${label}`);
    failures++;
  }
}

function checkSubcontractNumber(label, documentText, expected) {
  const actual = extractAnchorCandidates(documentText).subcontractNumber;
  check(label, actual === expected);
  return actual;
}

checkSubcontractNumber(
  "A. em-dash form does not treat Invoice as a subcontract number",
  "Subcontract # — Invoice",
  undefined
);

checkSubcontractNumber(
  "B. invoice table heading does not produce a subcontract number",
  "Subcontract #    Invoice Date    Amount",
  undefined
);

checkSubcontractNumber(
  "C. invalid first candidate is skipped and a later valid identifier is returned",
  "Subcontract #    Invoice Date    Amount\nSubcontract No.: SC-2026-0042",
  "SC-2026-0042"
);

const standardForms = [
  ["Subcontract #: SC-12345", "SC-12345"],
  ["Subcontract Number ABC-2026/17", "ABC-2026/17"],
  ["Subcontract Agreement No. 2026.0042-A", "2026.0042-A"],
];

for (const [documentText, expected] of standardForms) {
  checkSubcontractNumber(`D. extracts standard form ${expected}`, documentText, expected);
}

checkSubcontractNumber(
  "E. rejected header labels are case-insensitive",
  "SUBCONTRACT # INVOICE",
  undefined
);

checkSubcontractNumber(
  "F. plausible alphabetic identifiers remain valid",
  "Subcontract No. ALPHA",
  "ALPHA"
);

const primeContractText = "Prime Contract No. W912XX-26-C-0001";
const primeContractNumber = extractAnchorCandidates(primeContractText).primeContractNumber;
check(
  "G. prime-contract anchor extraction is unaffected",
  primeContractNumber === "W912XX-26-C-0001"
);

for (const [documentText, expected] of standardForms) {
  const actual = extractAnchorCandidates(documentText).subcontractNumber;
  check(
    `H. returned subcontract number ${expected} is a literal input substring`,
    Boolean(actual) && documentText.includes(actual)
  );
}
check(
  "H. returned prime-contract number is a literal input substring",
  Boolean(primeContractNumber) && primeContractText.includes(primeContractNumber)
);

const rejectedAdministrativeLabels = [
  "invoice",
  "invoice date",
  "date",
  "amount",
  "total",
  "page",
  "description",
  "subcontractor",
  "contractor",
  "vendor",
  "customer",
  "project",
  "contract",
];

for (const label of rejectedAdministrativeLabels) {
  checkSubcontractNumber(
    `blocked administrative label: ${label}`,
    `Subcontract # ${label}`,
    undefined
  );
}

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
} else {
  console.log("\nAll subcontract-number anchor regression checks passed.");
}
