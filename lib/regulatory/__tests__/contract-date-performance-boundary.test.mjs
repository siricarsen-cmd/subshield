import { resolveContractDateEvidence } from "../contract-date-evidence.ts";

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

const endOnlyCases = [
  "Period of Performance ends May 1, 2026.",
  "Period of Performance End Date: May 1, 2026.",
  "The period of performance ending May 1, 2026 is not extended.",
];

for (const documentText of endOnlyCases) {
  const result = resolveContractDateEvidence(documentText, "performance-started");
  check(
    `end-only language is not a performance start: ${documentText}`,
    result.status === "not-found",
    `${result.status}: ${result.explanation}`
  );
}

const positiveCases = [
  ["Period of Performance: May 1, 2026 through April 30, 2027.", "2026-05-01"],
  ["Period of Performance begins May 1, 2026.", "2026-05-01"],
  ["Period of Performance starts May 1, 2026.", "2026-05-01"],
  ["Period of Performance from May 1, 2026 to April 30, 2027.", "2026-05-01"],
  ["Performance Start Date: 05/01/2026.", "2026-05-01"],
  ["Notice to Proceed Date: 2026-05-01.", "2026-05-01"],
];

for (const [documentText, expectedDate] of positiveCases) {
  const result = resolveContractDateEvidence(documentText, "performance-started");
  check(
    `explicit start/range language resolves ${expectedDate}: ${documentText}`,
    result.status === "resolved" && result.context?.asOfDate === expectedDate,
    `${result.status}: ${result.explanation}`
  );
}

if (failures > 0) {
  console.error(`\n${failures} of ${assertions} performance-boundary assertions failed.`);
  process.exit(1);
}

console.log(`\nAll ${assertions} performance start/end boundary assertions passed.`);
