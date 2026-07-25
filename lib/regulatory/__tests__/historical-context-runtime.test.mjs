import { selectRegulatoryVersionForDate } from "../historical-selection.ts";

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

const malformedContexts = [
  ["null context", null, /context must be an object/i],
  [
    "unknown basis",
    {
      asOfDate: "2024-06-15",
      basis: "contract-signed-sometime",
      authority: "contract-evidence",
      evidenceQuotes: ["Effective date: June 15, 2024."],
    },
    /basis is unsupported/i,
  ],
  [
    "unknown authority",
    {
      asOfDate: "2024-06-15",
      basis: "subcontract-executed",
      authority: "model-inference",
      evidenceQuotes: ["Effective date: June 15, 2024."],
    },
    /authority is unsupported/i,
  ],
  [
    "missing evidence array",
    {
      asOfDate: "2024-06-15",
      basis: "subcontract-executed",
      authority: "contract-evidence",
    },
    /evidence quotes must be an array/i,
  ],
  [
    "non-string evidence",
    {
      asOfDate: "2024-06-15",
      basis: "subcontract-executed",
      authority: "contract-evidence",
      evidenceQuotes: [42],
    },
    /contain only strings/i,
  ],
];

for (const [label, context, expectedError] of malformedContexts) {
  let result;
  try {
    result = selectRegulatoryVersionForDate("far-current", [], context);
  } catch (error) {
    check(`${label}: malformed serialized input never throws`, false, String(error));
    continue;
  }
  check(`${label}: malformed serialized input returns invalid-request`, result.status === "invalid-request");
  check(
    `${label}: invalid result explains the rejected field`,
    result.missingFacts.some((fact) => expectedError.test(fact)),
    result.missingFacts.join(" | ")
  );
}

const contradictoryUserContext = selectRegulatoryVersionForDate("far-current", [], {
  asOfDate: "2024-06-15",
  basis: "user-specified",
  authority: "contract-evidence",
  evidenceQuotes: ["This quote must not convert a user date into a contract date."],
});
check(
  "user-specified basis cannot be relabeled as contract evidence",
  contradictoryUserContext.status === "invalid-request" &&
    contradictoryUserContext.missingFacts.some((fact) => /identify the user as its authority/i.test(fact))
);

const contradictoryContractContext = selectRegulatoryVersionForDate("far-current", [], {
  asOfDate: "2024-06-15",
  basis: "subcontract-executed",
  authority: "user-provided",
  evidenceQuotes: [],
});
check(
  "contract basis cannot be accepted as an ungrounded user date",
  contradictoryContractContext.status === "invalid-request" &&
    contradictoryContractContext.missingFacts.some((fact) => /grounded in contract evidence/i.test(fact))
);

if (failures > 0) {
  console.error(`\n${failures} of ${assertions} runtime context assertions failed.`);
  process.exit(1);
}

console.log(`\nAll ${assertions} serialized historical-context assertions passed.`);
