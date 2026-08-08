// Public detector-routing wrapper. The pre-Ironclad catalog/model detector is
// preserved byte-for-byte in detectors-core.ts. This boundary keeps sector
// prioritization while making cross-sector activation affirmative-context aware.

import {
  DETECTOR_FAMILIES,
  runGroundedDetectors as runGroundedDetectorsCore,
  selectDetectorFamilies as selectDetectorFamiliesCore,
} from "./detectors-core";
import {
  hasAffirmativeAuditSignal,
  hasAffirmativeConstructionWageSignal,
  hasAffirmativeCyberSignal,
  hasAffirmativeSclsSignal,
  hasAffirmativeSupplySignal,
} from "./affirmative-signals";
import type { ContractClassification, DetectorFamily, Finding } from "./types";

export { DETECTOR_FAMILIES };

export function selectDetectorFamilies(
  classification: ContractClassification,
  documentText?: string
): DetectorFamily[] {
  const core = selectDetectorFamiliesCore(classification, documentText);
  if (!documentText) return core;

  const keys = new Set(core.map((family) => family.key));
  const affirmativeCyber = hasAffirmativeCyberSignal(documentText);
  const affirmativeLabor =
    hasAffirmativeConstructionWageSignal(documentText) || hasAffirmativeSclsSignal(documentText);

  if (affirmativeCyber) keys.add("cyber");
  else keys.delete("cyber");

  const sectorProvidesLabor =
    classification.sector === "Cybersecurity / IT / Professional Services" ||
    classification.sector === "Construction / Facility / Trade" ||
    classification.sector === "Professional Services / Administrative Support";
  if (affirmativeLabor) keys.add("labor");
  else if (!sectorProvidesLabor) keys.delete("labor");

  if (hasAffirmativeSupplySignal(documentText)) keys.add("supply");
  if (hasAffirmativeAuditSignal(documentText)) keys.add("audit");

  return DETECTOR_FAMILIES.filter((family) => keys.has(family.key));
}

export async function runGroundedDetectors(
  documentText: string,
  families: DetectorFamily[]
): Promise<Finding[]> {
  return runGroundedDetectorsCore(documentText, families);
}
