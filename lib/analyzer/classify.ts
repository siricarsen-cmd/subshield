// Public classifier wrapper. The byte-identical pre-Ironclad classifier lives
// in classify-core.ts; this boundary corrects only the semantic gap where raw
// cyber keywords inside explicit non-applicability/protective clauses poisoned
// sector selection or sector evidence.

import { classifyContract as classifyContractCore } from "./classify-core";
import {
  findAffirmativeConstructionEvidence,
  findAffirmativeCyberEvidence,
  findAffirmativeProfessionalEvidence,
  findAffirmativeSupplyEvidence,
  hasAffirmativeCyberSignal,
} from "./affirmative-signals";
import type { ContractClassification, Sector } from "./types";

const CYBER_SECTOR: Sector = "Cybersecurity / IT / Professional Services";

export function classifyContract(documentText: string): ContractClassification {
  const base = classifyContractCore(documentText);
  const affirmativeCyber = hasAffirmativeCyberSignal(documentText);

  if (base.sector === CYBER_SECTOR && affirmativeCyber) {
    return {
      ...base,
      sectorEvidence: findAffirmativeCyberEvidence(documentText) ?? base.sectorEvidence,
    };
  }

  if (!affirmativeCyber && (base.sector === CYBER_SECTOR || base.sector === "Unknown")) {
    const constructionEvidence = findAffirmativeConstructionEvidence(documentText);
    if (constructionEvidence) {
      return {
        ...base,
        sector: "Construction / Facility / Trade",
        sectorEvidence: constructionEvidence,
        notes: [
          ...base.notes,
          "Explicit cyber non-applicability/protective language was excluded from affirmative sector scoring; construction/facility evidence controls the sector.",
        ],
      };
    }

    const supplyEvidence = findAffirmativeSupplyEvidence(documentText);
    if (supplyEvidence) {
      return {
        ...base,
        sector: "Supply / Manufacturing",
        sectorEvidence: supplyEvidence,
        notes: [
          ...base.notes,
          "Explicit cyber non-applicability/protective language was excluded from affirmative sector scoring; supply/manufacturing evidence controls the sector.",
        ],
      };
    }

    const professionalEvidence = findAffirmativeProfessionalEvidence(documentText);
    if (professionalEvidence) {
      return {
        ...base,
        sector: "Professional Services / Administrative Support",
        sectorEvidence: professionalEvidence,
        notes: [
          ...base.notes,
          "Explicit cyber non-applicability/protective language was excluded from affirmative sector scoring.",
        ],
      };
    }

    if (base.sector === CYBER_SECTOR) {
      return {
        ...base,
        sector: "Unknown",
        sectorEvidence: undefined,
        notes: [
          ...base.notes,
          "Cyber terms appeared only in non-applicability/protective context and no other strong affirmative sector signal was found.",
        ],
      };
    }
  }

  return base;
}
