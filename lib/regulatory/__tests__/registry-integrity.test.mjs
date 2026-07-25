import { QA_C_REGULATORY_APPLICABILITY_MAPPINGS } from "../benchmark-applicability-mappings.ts";
import { REGULATORY_HISTORICAL_GROUNDING_POLICIES } from "../historical-grounding-policy.ts";
import { selectHistoricalRegulatorySources } from "../historical-grounding-orchestration.ts";
import { registeredHistoricalCitationRequestForMapping } from "../historical-citation-regeneration.ts";
import {
  compareWithRegisteredRegulatoryValue,
  fingerprintRegulatoryRegistryValue,
  getRegisteredCitationTemplate,
  getRegisteredHistoricalGroundingPolicy,
  getRegisteredRegulatoryMapping,
  validateRegulatoryRegistryIntegrity,
} from "../registry-integrity.ts";
import { REGULATORY_FULL_BENCHMARK_CITATION_PACKAGES } from "../source-coverage-citation-packages.ts";

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

const mapping = QA_C_REGULATORY_APPLICABILITY_MAPPINGS.find(
  (candidate) => candidate.mappingId === "qa-c-future-cmmc-by-notice"
);
if (!mapping) throw new Error("Missing QA-C future-CMMC mapping");
const mappingEntry = getRegisteredRegulatoryMapping(mapping.mappingId);
const policyEntry = getRegisteredHistoricalGroundingPolicy(mapping.mappingId);
const templateEntry = getRegisteredCitationTemplate(mapping.mappingId);
if (!mappingEntry || !policyEntry || !templateEntry) {
  throw new Error("Missing canonical registry entries for future-CMMC mapping");
}

check(
  "all mapping, policy, and citation-template registries initialize without integrity errors",
  validateRegulatoryRegistryIntegrity().length === 0,
  validateRegulatoryRegistryIntegrity().join(" | ")
);
check(
  "canonical registry entries and nested source policies/citations are runtime frozen",
  Object.isFrozen(mappingEntry) &&
    Object.isFrozen(mappingEntry.value) &&
    Object.isFrozen(mappingEntry.value.sourceComparisons) &&
    Object.isFrozen(policyEntry) &&
    Object.isFrozen(policyEntry.value) &&
    Object.isFrozen(policyEntry.value.sourcePolicies) &&
    Object.isFrozen(templateEntry) &&
    Object.isFrozen(templateEntry.value) &&
    Object.isFrozen(templateEntry.value.citations) &&
    Object.isFrozen(templateEntry.value.citations[0])
);
check(
  "stored registry fingerprints reproduce from their immutable values",
  mappingEntry.fingerprint === fingerprintRegulatoryRegistryValue(mappingEntry.value) &&
    policyEntry.fingerprint === fingerprintRegulatoryRegistryValue(policyEntry.value) &&
    templateEntry.fingerprint === fingerprintRegulatoryRegistryValue(templateEntry.value)
);
check(
  "fingerprinting is deterministic across object key insertion order",
  fingerprintRegulatoryRegistryValue({ b: 2, a: { d: 4, c: 3 } }) ===
    fingerprintRegulatoryRegistryValue({ a: { c: 3, d: 4 }, b: 2 })
);

const exactMappingClone = structuredClone(mappingEntry.value);
check(
  "an exact clone of the registered mapping passes fingerprint comparison",
  compareWithRegisteredRegulatoryValue(
    "mapping",
    mapping.mappingId,
    exactMappingClone
  ).length === 0
);

const alteredMapping = structuredClone(mappingEntry.value);
alteredMapping.reviewerConclusion =
  "Altered conclusion attempting to reuse a registered mapping ID.";
const alteredMappingErrors = compareWithRegisteredRegulatoryValue(
  "mapping",
  mapping.mappingId,
  alteredMapping
);
check(
  "a valid mapping ID cannot conceal altered conclusions",
  alteredMappingErrors.length === 1 &&
    /differs from the immutable registry/i.test(alteredMappingErrors[0])
);
const alteredMappingSelection = selectHistoricalRegulatorySources({
  mapping: alteredMapping,
  documentText: "Subcontract Effective Date: February 10, 2025.",
  sourceHistories: {},
});
check(
  "historical selection refuses an altered mapping before date or source evaluation",
  alteredMappingSelection.status === "invalid-mapping" &&
    alteredMappingSelection.sourceDecisions.length === 0
);
check(
  "an altered mapping cannot be used to obtain registered extraction requests",
  registeredHistoricalCitationRequestForMapping(alteredMapping) === undefined
);

const alteredPolicy = structuredClone(policyEntry.value);
const solicitationPolicy = alteredPolicy.sourcePolicies.find(
  (sourcePolicy) => sourcePolicy.sourceId === "dfars-252-204-7025"
);
if (!solicitationPolicy) throw new Error("Missing registered 7025 date policy");
solicitationPolicy.dateBasis = "subcontract-executed";
const alteredPolicySelection = selectHistoricalRegulatorySources({
  mapping: structuredClone(mappingEntry.value),
  policy: alteredPolicy,
  documentText:
    "Solicitation Issue Date: January 15, 2025.\nSubcontract Effective Date: February 10, 2025.",
  sourceHistories: {},
});
check(
  "a valid policy ID cannot conceal an altered governing date basis",
  alteredPolicySelection.status === "invalid-policy" &&
    alteredPolicySelection.refusalReasons.some((reason) =>
      /differs from the immutable registry/i.test(reason)
    )
);

const alteredTemplate = structuredClone(templateEntry.value);
alteredTemplate.citations[0].extractionStartAnchor =
  "Altered anchor attempting to reuse the registered template mapping ID";
const alteredTemplateErrors = compareWithRegisteredRegulatoryValue(
  "citation-template",
  mapping.mappingId,
  alteredTemplate
);
check(
  "a valid template mapping ID cannot conceal altered extraction anchors",
  alteredTemplateErrors.length === 1 &&
    /differs from the immutable registry/i.test(alteredTemplateErrors[0])
);

const exportedTemplate = REGULATORY_FULL_BENCHMARK_CITATION_PACKAGES.find(
  (citationPackage) => citationPackage.mappingId === mapping.mappingId
);
const exportedPolicy = REGULATORY_HISTORICAL_GROUNDING_POLICIES.find(
  (policy) => policy.mappingId === mapping.mappingId
);
if (!exportedTemplate || !exportedPolicy) {
  throw new Error("Missing exported mutable benchmark values");
}
const originalAnchor = exportedTemplate.citations[0].extractionStartAnchor;
const originalDateBasis = exportedPolicy.sourcePolicies[0].dateBasis;
exportedTemplate.citations[0].extractionStartAnchor = "runtime mutation";
exportedPolicy.sourcePolicies[0].dateBasis = "performance-started";
check(
  "runtime mutation of exported benchmark objects cannot mutate the captured canonical registry",
  getRegisteredCitationTemplate(mapping.mappingId)?.value.citations[0]
    .extractionStartAnchor === originalAnchor &&
    getRegisteredHistoricalGroundingPolicy(mapping.mappingId)?.value.sourcePolicies[0]
      .dateBasis === originalDateBasis &&
    validateRegulatoryRegistryIntegrity().length === 0
);
exportedTemplate.citations[0].extractionStartAnchor = originalAnchor;
exportedPolicy.sourcePolicies[0].dateBasis = originalDateBasis;

check(
  "unknown IDs cannot borrow another registry entry",
  compareWithRegisteredRegulatoryValue(
    "mapping",
    "qa-unknown-regulatory-mapping",
    mappingEntry.value
  ).some((reason) => /No registered mapping exists/i.test(reason))
);

if (failures > 0) {
  console.error(`\n${failures} of ${assertions} registry-integrity assertions failed.`);
  process.exit(1);
}

console.log(`\nAll ${assertions} registry-integrity assertions passed.`);
