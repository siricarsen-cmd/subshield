import type { RegulatoryApplicabilityMapping } from "./applicability";
import type { RegulatoryCitationPackage } from "./citation-package";
import { validateRegulatoryCitationPackage } from "./citation-package";
import {
  resolveContractDateEvidence,
  type ContractDateResolution,
} from "./contract-date-evidence";
import {
  getHistoricalGroundingPolicy,
  validateHistoricalGroundingPolicies,
  type ContractGroundedDateBasis,
  type HistoricalSourceDatePolicy,
  type RegulatoryHistoricalGroundingPolicy,
} from "./historical-grounding-policy";
import {
  selectApprovedRegulatorySnapshotForDate,
  type ApprovedRegulatorySnapshotSelection,
} from "./historical-selection";
import type { RegulatorySourceSnapshot } from "./types";

export type HistoricalSourceGroundingStatus =
  | "selected"
  | "date-unresolved"
  | "history-unresolved";

export interface HistoricalSourceGroundingDecision {
  sourceId: string;
  dateBasis: ContractGroundedDateBasis;
  rationale: string;
  status: HistoricalSourceGroundingStatus;
  dateResolution: ContractDateResolution;
  versionSelection?: ApprovedRegulatorySnapshotSelection;
  selectedSnapshotId?: string;
  selectedVersionIdentifier?: string;
  refusalReasons: string[];
}

export type HistoricalGroundingOrchestrationStatus =
  | "ready"
  | "missing-policy"
  | "invalid-policy"
  | "invalid-citation-package"
  | "date-unresolved"
  | "historical-version-unresolved"
  | "citation-package-mismatch";

export interface HistoricalGroundingOrchestrationRequest {
  mapping: RegulatoryApplicabilityMapping;
  documentText: string;
  sourceHistories: Readonly<
    Record<string, readonly RegulatorySourceSnapshot[] | undefined>
  >;
  citationPackage: RegulatoryCitationPackage;
  policy?: RegulatoryHistoricalGroundingPolicy;
}

export interface HistoricalGroundingOrchestrationResult {
  status: HistoricalGroundingOrchestrationStatus;
  mappingId: string;
  policyId?: string;
  citationPackageId: string;
  citationPackageStatus: "ready" | "refused";
  sourceDecisions: HistoricalSourceGroundingDecision[];
  selectedSnapshotIds: string[];
  refusalReasons: string[];
  customerFacingStatus: "benchmark-only";
}

function uniqueNonblank(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function result(
  request: HistoricalGroundingOrchestrationRequest,
  status: HistoricalGroundingOrchestrationStatus,
  refusalReasons: readonly string[],
  sourceDecisions: HistoricalSourceGroundingDecision[] = [],
  policyId?: string
): HistoricalGroundingOrchestrationResult {
  return {
    status,
    mappingId: request.mapping.mappingId,
    policyId,
    citationPackageId: request.citationPackage.packageId,
    citationPackageStatus: status === "ready" ? "ready" : "refused",
    sourceDecisions,
    selectedSnapshotIds: sourceDecisions
      .map((decision) => decision.selectedSnapshotId)
      .filter((snapshotId): snapshotId is string => Boolean(snapshotId)),
    refusalReasons: uniqueNonblank(refusalReasons),
    customerFacingStatus: "benchmark-only",
  };
}

function validatePolicyForMapping(
  mapping: RegulatoryApplicabilityMapping,
  policy: RegulatoryHistoricalGroundingPolicy
): string[] {
  const errors: string[] = [];
  if (policy.mappingId !== mapping.mappingId) {
    errors.push(
      `Historical policy mapping mismatch: expected ${mapping.mappingId}, observed ${policy.mappingId}`
    );
  }
  if (policy.customerFacingStatus !== "benchmark-only") {
    errors.push("Historical grounding policy is not benchmark-only");
  }

  const declared = mapping.sourceComparisons.map((comparison) => comparison.sourceId);
  const governed = policy.sourcePolicies.map((sourcePolicy) => sourcePolicy.sourceId);
  if (new Set(governed).size !== governed.length) {
    errors.push("Historical grounding policy contains duplicate source IDs");
  }
  for (const sourceId of declared) {
    if (!governed.includes(sourceId)) {
      errors.push(`Historical grounding policy omits declared source: ${sourceId}`);
    }
  }
  for (const sourceId of governed) {
    if (!declared.includes(sourceId)) {
      errors.push(`Historical grounding policy adds undeclared source: ${sourceId}`);
    }
  }
  for (const sourcePolicy of policy.sourcePolicies) {
    if (!sourcePolicy.rationale.trim()) {
      errors.push(`Historical grounding source policy lacks rationale: ${sourcePolicy.sourceId}`);
    }
  }
  return errors;
}

function resolveDateForPolicy(
  documentText: string,
  sourcePolicy: HistoricalSourceDatePolicy,
  cachedDates: Map<ContractGroundedDateBasis, ContractDateResolution>
): ContractDateResolution {
  const cached = cachedDates.get(sourcePolicy.dateBasis);
  if (cached) return cached;
  const resolution = resolveContractDateEvidence(documentText, sourcePolicy.dateBasis);
  cachedDates.set(sourcePolicy.dateBasis, resolution);
  return resolution;
}

function decideSource(
  documentText: string,
  sourcePolicy: HistoricalSourceDatePolicy,
  snapshots: readonly RegulatorySourceSnapshot[],
  cachedDates: Map<ContractGroundedDateBasis, ContractDateResolution>
): HistoricalSourceGroundingDecision {
  const dateResolution = resolveDateForPolicy(documentText, sourcePolicy, cachedDates);
  if (dateResolution.status !== "resolved" || !dateResolution.context) {
    return {
      sourceId: sourcePolicy.sourceId,
      dateBasis: sourcePolicy.dateBasis,
      rationale: sourcePolicy.rationale,
      status: "date-unresolved",
      dateResolution,
      refusalReasons: uniqueNonblank([
        dateResolution.explanation,
        ...dateResolution.missingFacts,
      ]),
    };
  }

  const versionSelection = selectApprovedRegulatorySnapshotForDate(
    sourcePolicy.sourceId,
    snapshots,
    dateResolution.context
  );
  if (versionSelection.status !== "selected" || !versionSelection.selectedSnapshot) {
    return {
      sourceId: sourcePolicy.sourceId,
      dateBasis: sourcePolicy.dateBasis,
      rationale: sourcePolicy.rationale,
      status: "history-unresolved",
      dateResolution,
      versionSelection,
      refusalReasons: uniqueNonblank([
        versionSelection.explanation,
        ...versionSelection.missingFacts,
      ]),
    };
  }

  return {
    sourceId: sourcePolicy.sourceId,
    dateBasis: sourcePolicy.dateBasis,
    rationale: sourcePolicy.rationale,
    status: "selected",
    dateResolution,
    versionSelection,
    selectedSnapshotId: versionSelection.selectedSnapshot.snapshotId,
    selectedVersionIdentifier: versionSelection.selectedSnapshot.versionIdentifier,
    refusalReasons: [],
  };
}

function citationPackageMismatchReasons(
  mapping: RegulatoryApplicabilityMapping,
  citationPackage: RegulatoryCitationPackage,
  sourceDecisions: readonly HistoricalSourceGroundingDecision[]
): string[] {
  const reasons: string[] = [];
  if (citationPackage.mappingId !== mapping.mappingId) {
    reasons.push(
      `Citation package mapping mismatch: expected ${mapping.mappingId}, observed ${citationPackage.mappingId}`
    );
  }
  if (citationPackage.customerFacingStatus !== "benchmark-only") {
    reasons.push("Citation package is not benchmark-only");
  }

  const citationSnapshotIdsBySource = new Map<string, Set<string>>();
  for (const citation of citationPackage.citations) {
    const snapshotIds = citationSnapshotIdsBySource.get(citation.sourceId) ?? new Set<string>();
    snapshotIds.add(citation.snapshotId);
    citationSnapshotIdsBySource.set(citation.sourceId, snapshotIds);
  }

  for (const decision of sourceDecisions) {
    if (decision.status !== "selected" || !decision.selectedSnapshotId) continue;
    const citedSnapshotIds = citationSnapshotIdsBySource.get(decision.sourceId);
    if (!citedSnapshotIds || citedSnapshotIds.size === 0) {
      reasons.push(`Citation package lacks selected source: ${decision.sourceId}`);
      continue;
    }
    if (!citedSnapshotIds.has(decision.selectedSnapshotId)) {
      reasons.push(
        `Citation package uses the wrong historical snapshot for ${decision.sourceId}: expected ${decision.selectedSnapshotId}, observed ${[
          ...citedSnapshotIds,
        ].join(", ")}`
      );
    }
    if (citedSnapshotIds.size > 1) {
      reasons.push(
        `Citation package mixes multiple historical snapshots for ${decision.sourceId}: ${[
          ...citedSnapshotIds,
        ].join(", ")}`
      );
    }
  }

  const selectedSourceIds = new Set(
    sourceDecisions
      .filter((decision) => decision.status === "selected")
      .map((decision) => decision.sourceId)
  );
  for (const citation of citationPackage.citations) {
    if (!selectedSourceIds.has(citation.sourceId)) {
      reasons.push(`Citation package contains a source without a selected historical version: ${citation.sourceId}`);
    }
  }

  return uniqueNonblank(reasons);
}

export function orchestrateHistoricalRegulatoryGrounding(
  request: HistoricalGroundingOrchestrationRequest
): HistoricalGroundingOrchestrationResult {
  const policy = request.policy ?? getHistoricalGroundingPolicy(request.mapping.mappingId);
  if (!policy) {
    return result(
      request,
      "missing-policy",
      [`No historical grounding policy exists for mapping ${request.mapping.mappingId}`]
    );
  }

  const globalPolicyErrors = validateHistoricalGroundingPolicies();
  const mappingPolicyErrors = validatePolicyForMapping(request.mapping, policy);
  const policyErrors = uniqueNonblank([...globalPolicyErrors, ...mappingPolicyErrors]);
  if (policyErrors.length > 0) {
    return result(request, "invalid-policy", policyErrors, [], policy.policyId);
  }

  const citationPackageErrors = validateRegulatoryCitationPackage(request.citationPackage);
  if (request.citationPackage.sourceCoverage !== "complete") {
    citationPackageErrors.push(
      `Historical grounding requires complete citation coverage; observed ${request.citationPackage.sourceCoverage}`
    );
  }
  if (request.citationPackage.uncoveredSourceIds.length > 0) {
    citationPackageErrors.push(
      `Historical grounding citation package leaves sources uncovered: ${request.citationPackage.uncoveredSourceIds.join(", ")}`
    );
  }
  if (citationPackageErrors.length > 0) {
    return result(
      request,
      "invalid-citation-package",
      citationPackageErrors,
      [],
      policy.policyId
    );
  }

  const cachedDates = new Map<ContractGroundedDateBasis, ContractDateResolution>();
  const sourceDecisions = policy.sourcePolicies.map((sourcePolicy) =>
    decideSource(
      request.documentText,
      sourcePolicy,
      request.sourceHistories[sourcePolicy.sourceId] ?? [],
      cachedDates
    )
  );

  const dateFailures = sourceDecisions.filter(
    (decision) => decision.status === "date-unresolved"
  );
  if (dateFailures.length > 0) {
    return result(
      request,
      "date-unresolved",
      dateFailures.flatMap((decision) =>
        decision.refusalReasons.map((reason) => `${decision.sourceId}: ${reason}`)
      ),
      sourceDecisions,
      policy.policyId
    );
  }

  const historyFailures = sourceDecisions.filter(
    (decision) => decision.status === "history-unresolved"
  );
  if (historyFailures.length > 0) {
    return result(
      request,
      "historical-version-unresolved",
      historyFailures.flatMap((decision) =>
        decision.refusalReasons.map((reason) => `${decision.sourceId}: ${reason}`)
      ),
      sourceDecisions,
      policy.policyId
    );
  }

  const mismatchReasons = citationPackageMismatchReasons(
    request.mapping,
    request.citationPackage,
    sourceDecisions
  );
  if (mismatchReasons.length > 0) {
    return result(
      request,
      "citation-package-mismatch",
      mismatchReasons,
      sourceDecisions,
      policy.policyId
    );
  }

  return result(request, "ready", [], sourceDecisions, policy.policyId);
}
