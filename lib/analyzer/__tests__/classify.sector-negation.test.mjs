// Regression check for the CONSTRUCTION_SIGNALS/SUPPLY_SIGNALS
// exclusion-context guard added to classify.ts on
// fix/analyzer-false-positive-guards. Proves a sector keyword mentioned only
// inside an exclusion/negative-scope clause is not counted as affirmative
// sector evidence, while a later affirmative occurrence - even within the
// same sentence - and real construction scope elsewhere in the document
// still are. Also proves cyber and professional-services classification are
// unaffected (they don't use the exclusion-aware scorer).
//
// No test runner is configured in this repo - run directly with
// `node lib/analyzer/__tests__/classify.sector-negation.test.mjs`
// (Node 24 strips TS types natively; classify.ts has no relative imports of
// its own beyond the type-only `from "./types"`, so no loader is needed).
import { classifyContract } from "../classify.ts";
import {
  CONSTRUCTION_EXCLUSION_ONLY_DOC,
  CONSTRUCTION_EXCLUSION_DO_NOT_INCLUDE_DOC,
  CONSTRUCTION_AFFIRMATIVE_DOC,
  CONSTRUCTION_EXCLUSION_THEN_AFFIRMATIVE_SEPARATE_SENTENCES_DOC,
  CONSTRUCTION_EXCLUSION_THEN_AFFIRMATIVE_SAME_SENTENCE_DOC,
  CONSTRUCTION_REQUIRED_EXCLUDING_ABATEMENT_DOC,
  CONSTRUCTION_EXCLUSION_RESET_SCOPE_COVERS_DOC,
  CONSTRUCTION_EXCLUSION_LIST_HVAC_DOC,
  CONSTRUCTION_NOT_RESPONSIBLE_FOR_LIST_DOC,
  CONSTRUCTION_EXCLUDES_AND_NOT_RESPONSIBLE_FOR_DOC,
  CONSTRUCTION_EXCLUDED_THEN_AFFIRMATIVE_EVIDENCE_DOC,
  COMPLETE_CLEAN_PREVIEW_CONTRACT,
  CONSTRUCTION_MAY_NOT_IMPOSE_RETAINAGE_CLAUSE,
  CONSTRUCTION_AFFIRMATIVE_RETAINAGE_CLAUSE,
} from "../__fixtures__/false-positive-guard-clauses.mjs";

let failures = 0;

function check(label, condition) {
  if (condition) {
    console.log(`PASS: ${label}`);
  } else {
    console.error(`FAIL: ${label}`);
    failures++;
  }
}

const CONSTRUCTION_SECTOR = "Construction / Facility / Trade";

check(
  "exclusion-only construction language does not classify as Construction",
  classifyContract(CONSTRUCTION_EXCLUSION_ONLY_DOC).sector !== CONSTRUCTION_SECTOR
);
check(
  "'do not include ... construction' exclusion does not classify as Construction",
  classifyContract(CONSTRUCTION_EXCLUSION_DO_NOT_INCLUDE_DOC).sector !== CONSTRUCTION_SECTOR
);
check(
  "affirmative construction scope classifies as Construction",
  classifyContract(CONSTRUCTION_AFFIRMATIVE_DOC).sector === CONSTRUCTION_SECTOR
);
check(
  "exclusion sentence followed by a separate affirmative construction sentence still classifies as Construction",
  classifyContract(CONSTRUCTION_EXCLUSION_THEN_AFFIRMATIVE_SEPARATE_SENTENCES_DOC).sector === CONSTRUCTION_SECTOR
);
check(
  "excluded first occurrence + affirmative later occurrence in the same sentence still classifies as Construction",
  classifyContract(CONSTRUCTION_EXCLUSION_THEN_AFFIRMATIVE_SAME_SENTENCE_DOC).sector === CONSTRUCTION_SECTOR
);
check(
  "'Construction services are required, excluding hazardous-material abatement' still classifies as Construction",
  classifyContract(CONSTRUCTION_REQUIRED_EXCLUDING_ABATEMENT_DOC).sector === CONSTRUCTION_SECTOR
);
check(
  "'Excluding general construction, the scope covers HVAC installation' still classifies as Construction",
  classifyContract(CONSTRUCTION_EXCLUSION_RESET_SCOPE_COVERS_DOC).sector === CONSTRUCTION_SECTOR
);
check(
  "plain exclusion list ('excludes construction, HVAC installation, and electrical work') does not classify as Construction",
  classifyContract(CONSTRUCTION_EXCLUSION_LIST_HVAC_DOC).sector !== CONSTRUCTION_SECTOR
);
check(
  "'not responsible for field installation/facility repair/equipment fabrication/certified payroll' list does not classify as Construction",
  classifyContract(CONSTRUCTION_NOT_RESPONSIBLE_FOR_LIST_DOC).sector !== CONSTRUCTION_SECTOR
);
check(
  "excludes-construction sentence plus a separate 'not responsible for' list does not classify as Construction",
  classifyContract(CONSTRUCTION_EXCLUDES_AND_NOT_RESPONSIBLE_FOR_DOC).sector !== CONSTRUCTION_SECTOR
);
check(
  "complete clean Preview regression text does not classify as Construction",
  classifyContract(COMPLETE_CLEAN_PREVIEW_CONTRACT).sector !== CONSTRUCTION_SECTOR
);
check(
  "'Prime Contractor may not impose retainage, setoff, backcharge, or withholding...' does not classify as Construction",
  classifyContract(CONSTRUCTION_MAY_NOT_IMPOSE_RETAINAGE_CLAUSE).sector !== CONSTRUCTION_SECTOR
);
check(
  "real 'Prime Contractor will retain a 10 percent retainage...' classifies as Construction",
  classifyContract(CONSTRUCTION_AFFIRMATIVE_RETAINAGE_CLAUSE).sector === CONSTRUCTION_SECTOR
);

// Sector-evidence consistency: a negated "excludes general construction"
// sentence followed by real affirmative HVAC/construction scope must still
// classify as Construction, and the displayed evidence must come from the
// affirmative sentence, not the negated one.
{
  const result = classifyContract(CONSTRUCTION_EXCLUDED_THEN_AFFIRMATIVE_EVIDENCE_DOC);
  check(
    "excluded-then-affirmative document still classifies as Construction",
    result.sector === CONSTRUCTION_SECTOR
  );
  check(
    "sector evidence is drawn from the affirmative HVAC sentence, not the negated 'excludes' sentence",
    Boolean(result.sectorEvidence) &&
      !result.sectorEvidence.toLowerCase().includes("exclude") &&
      result.sectorEvidence.toLowerCase().includes("hvac")
  );
}

// Control cases: cyber and professional-services classification are
// untouched by this change (CYBER_SIGNALS/PROFESSIONAL_SIGNALS still use the
// original document-wide score(), not the exclusion-aware scorer).
const CYBER_CONTROL_DOC =
  "This subcontract is subject to DFARS 252.204-7012 and NIST SP 800-171 requirements for Covered Defense Information.";
check(
  "cyber classification control case still classifies as Cybersecurity / IT / Professional Services",
  classifyContract(CYBER_CONTROL_DOC).sector === "Cybersecurity / IT / Professional Services"
);

const PROFESSIONAL_CONTROL_DOC =
  "Subcontractor shall provide professional services and staff-augmentation labor categories, including administrative support and document coordination.";
check(
  "professional-services classification control case still classifies as Professional Services / Administrative Support",
  classifyContract(PROFESSIONAL_CONTROL_DOC).sector === "Professional Services / Administrative Support"
);

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
} else {
  console.log("\nAll sector-negation regression checks passed.");
}
