// Data-rights family recall and indemnity-only false-positive regressions.
import { selectDetectorFamilies } from "../detectors.ts";
import { runDeterministicDetectors } from "../deterministic.ts";
import {
  GENERIC_IP_INDEMNITY_CLAUSE,
  GENUINE_DATA_RIGHTS_CLAUSES,
} from "../__fixtures__/fixture-a-rc-clauses.mjs";

let failures = 0;
function check(label, condition) {
  if (condition) console.log(`PASS: ${label}`);
  else {
    console.error(`FAIL: ${label}`);
    failures++;
  }
}

const neutralClassification = {
  contractType: "Unknown",
  sector: "Services (General)",
  notes: [],
};
const selectedKeys = (text) => selectDetectorFamilies(neutralClassification, text).map((family) => family.key);

check("H1. generic indemnity claim list does not activate data-rights family", !selectedKeys(GENERIC_IP_INDEMNITY_CLAUSE).includes("data-rights"));
check(
  "H2. generic IP/data indemnity still produces broad-indemnity finding",
  runDeterministicDetectors(GENERIC_IP_INDEMNITY_CLAUSE).some((finding) => finding.regulation === "Broad Indemnification / Duty to Defend")
);

for (const [index, clause] of GENUINE_DATA_RIGHTS_CLAUSES.entries()) {
  check(`I${index + 1}. genuine data-rights clause ${index + 1} activates analysis`, selectedKeys(clause).includes("data-rights"));
}

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log("\nAll data-rights trigger regression checks passed.");

