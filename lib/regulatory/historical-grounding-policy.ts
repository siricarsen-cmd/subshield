import type { RegulatoryApplicabilityMapping } from "./applicability";
import type { RegulatoryAnalysisDateBasis } from "./historical-selection";
import {
  QA_C_REGULATORY_APPLICABILITY_MAPPINGS,
  QA_D_REGULATORY_APPLICABILITY_MAPPINGS,
  REGULATORY_BENCHMARK_APPLICABILITY_MAPPINGS,
} from "./benchmark-applicability-mappings";

export type ContractGroundedDateBasis = Exclude<
  RegulatoryAnalysisDateBasis,
  "user-specified"
>;

export interface HistoricalSourceDatePolicy {
  sourceId: string;
  dateBasis: ContractGroundedDateBasis;
  rationale: string;
}

export interface RegulatoryHistoricalGroundingPolicy {
  policyId: string;
  mappingId: string;
  sourcePolicies: HistoricalSourceDatePolicy[];
  customerFacingStatus: "benchmark-only";
}

function createPolicy(
  mappingId: string,
  sourcePolicies: HistoricalSourceDatePolicy[]
): RegulatoryHistoricalGroundingPolicy {
  return {
    policyId: `${mappingId}-historical-date-policy-v1`,
    mappingId,
    sourcePolicies,
    customerFacingStatus: "benchmark-only",
  };
}

function executionSource(sourceId: string, rationale: string): HistoricalSourceDatePolicy {
  return { sourceId, dateBasis: "subcontract-executed", rationale };
}

export const REGULATORY_HISTORICAL_GROUNDING_POLICIES: readonly RegulatoryHistoricalGroundingPolicy[] = [
  createPolicy("qa-d-missing-wage-determination", [
    executionSource(
      "far-52-222-6",
      "Compare the incorporated construction wage clause to the official version governing subcontract execution."
    ),
    executionSource(
      "sam-wage-determinations",
      "The wage-determination document requested before execution must be evaluated as of the subcontract execution date."
    ),
    executionSource(
      "ecfr-29-part-5",
      "Use the labor-standards framework effective when the subcontract imposed the construction obligations."
    ),
  ]),
  createPolicy("qa-d-certified-payroll-deadline", [
    executionSource(
      "far-52-222-8",
      "Use the payroll clause version governing the executed subcontract obligation."
    ),
    executionSource(
      "ecfr-29-part-3",
      "Use the certified-payroll regulation effective when the subcontract was executed."
    ),
  ]),
  createPolicy("qa-d-scls-conditional", [
    executionSource(
      "far-52-222-41",
      "Evaluate the conditional SCLS clause against the official clause version at execution."
    ),
    executionSource(
      "ecfr-29-part-4",
      "Evaluate principal-purpose and service-employee coverage under the regulation effective at execution."
    ),
  ]),
  createPolicy("qa-d-unilateral-labor-change-no-adjustment", [
    executionSource(
      "far-52-222-6",
      "Compare the Prime-drafted change mechanism to the construction conformance baseline at execution."
    ),
    executionSource(
      "far-52-222-41",
      "Compare any SCLS-related change authority to the clause version governing execution."
    ),
  ]),
  createPolicy("qa-d-lower-tier-labor-flowdown", [
    executionSource(
      "far-52-222-8",
      "Use the construction payroll flowdown baseline effective when the upper-tier subcontract was executed."
    ),
    executionSource(
      "far-52-222-41",
      "Use the SCLS subcontract coverage baseline effective at execution."
    ),
  ]),
  createPolicy("qa-c-dfars-7012-nist-baseline", [
    executionSource(
      "dfars-252-204-7012",
      "Use the DFARS cyber clause version governing the executed subcontract."
    ),
    executionSource(
      "nist-sp-800-171-r3",
      "Use the NIST version contractually applicable at execution; do not substitute the newest revision."
    ),
    executionSource(
      "cui-registry",
      "Use the CUI program guidance retained for the execution-date comparison while preserving agency-specific missing facts."
    ),
  ]),
  createPolicy("qa-c-dfars-7002-citation-mismatch", [
    executionSource(
      "dfars-current",
      "Verify what the cited DFARS identifier meant on the subcontract execution date."
    ),
    executionSource(
      "dfars-252-204-7020",
      "Compare the separately cited assessment clause to the execution-date DFARS version."
    ),
  ]),
  createPolicy("qa-c-absolute-110-score-warranty", [
    executionSource(
      "dfars-252-204-7019",
      "Use the assessment notice version governing the executed subcontract comparison."
    ),
    executionSource(
      "dfars-252-204-7020",
      "Use the assessment clause version effective at execution."
    ),
  ]),
  createPolicy("qa-c-future-cmmc-by-notice", [
    executionSource(
      "dfars-252-204-7021",
      "Use the CMMC contract clause version effective when the subcontract was executed."
    ),
    {
      sourceId: "dfars-252-204-7025",
      dateBasis: "solicitation-issued",
      rationale:
        "The CMMC notice is a solicitation provision, so its historical comparison uses the verified solicitation issue date rather than execution or performance start.",
    },
    executionSource(
      "ecfr-32-part-170",
      "Use the CMMC program rule effective when the subcontract imposed the open-ended future requirement."
    ),
  ]),
  createPolicy("qa-c-incident-reporting-and-preservation", [
    executionSource(
      "dfars-252-204-7012",
      "Use the incident-reporting and preservation clause version effective at subcontract execution."
    ),
  ]),
  createPolicy("qa-c-unmarked-cui-designation", [
    executionSource(
      "cui-registry",
      "Use the CUI program guidance retained for the execution-date comparison without converting generic guidance into category proof."
    ),
    executionSource(
      "nist-sp-800-171-r3",
      "Use the NIST scope version contractually relevant at execution."
    ),
  ]),
  createPolicy("qa-c-lower-tier-7012-flowdown", [
    executionSource(
      "dfars-252-204-7012",
      "Use the DFARS flowdown clause version effective at execution."
    ),
    executionSource(
      "dfars-252-204-7021",
      "Use the CMMC flowdown clause version effective at execution."
    ),
  ]),
] as const;

export function validateHistoricalGroundingPolicies(): string[] {
  const errors: string[] = [];
  const mappings = new Map<string, RegulatoryApplicabilityMapping>(
    REGULATORY_BENCHMARK_APPLICABILITY_MAPPINGS.map((mapping) => [
      mapping.mappingId,
      mapping,
    ])
  );
  const seenPolicyIds = new Set<string>();
  const seenMappingIds = new Set<string>();

  for (const policy of REGULATORY_HISTORICAL_GROUNDING_POLICIES) {
    if (seenPolicyIds.has(policy.policyId)) errors.push(`duplicate policy ID: ${policy.policyId}`);
    seenPolicyIds.add(policy.policyId);
    if (seenMappingIds.has(policy.mappingId)) {
      errors.push(`duplicate historical policy for mapping: ${policy.mappingId}`);
    }
    seenMappingIds.add(policy.mappingId);

    const mapping = mappings.get(policy.mappingId);
    if (!mapping) {
      errors.push(`historical policy references unknown mapping: ${policy.mappingId}`);
      continue;
    }
    const declared = new Set<string>(
      mapping.sourceComparisons.map((comparison) => comparison.sourceId)
    );
    const policySources = policy.sourcePolicies.map((source) => source.sourceId);
    if (new Set(policySources).size !== policySources.length) {
      errors.push(`historical policy contains duplicate source IDs: ${policy.mappingId}`);
    }
    for (const sourceId of declared) {
      if (!policySources.includes(sourceId)) {
        errors.push(`historical policy omits declared source ${sourceId}: ${policy.mappingId}`);
      }
    }
    for (const source of policy.sourcePolicies) {
      if (!declared.has(source.sourceId)) {
        errors.push(`historical policy adds undeclared source ${source.sourceId}: ${policy.mappingId}`);
      }
      if (!source.rationale.trim()) {
        errors.push(`historical source policy lacks rationale: ${policy.mappingId}/${source.sourceId}`);
      }
    }
    if (policy.customerFacingStatus !== "benchmark-only") {
      errors.push(`historical policy is customer enabled: ${policy.mappingId}`);
    }
  }

  for (const mapping of [
    ...QA_D_REGULATORY_APPLICABILITY_MAPPINGS,
    ...QA_C_REGULATORY_APPLICABILITY_MAPPINGS,
  ]) {
    if (!seenMappingIds.has(mapping.mappingId)) {
      errors.push(`missing historical policy for mapping: ${mapping.mappingId}`);
    }
  }

  return errors;
}

export function getHistoricalGroundingPolicy(
  mappingId: string
): RegulatoryHistoricalGroundingPolicy | undefined {
  return REGULATORY_HISTORICAL_GROUNDING_POLICIES.find(
    (policy) => policy.mappingId === mappingId
  );
}
