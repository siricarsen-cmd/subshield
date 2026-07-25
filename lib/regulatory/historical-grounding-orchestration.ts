import { createHash } from "node:crypto";

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
  /**
   * Optional caller assertion. The registered policy always governs; a supplied
   * policy must exactly match it and can never override a source date basis.
   */
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

function sha256(value: string): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
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

function suppliedPolicyMismatchReasons(
  registered: RegulatoryHistoricalGroundingPolicy,
  supplied: RegulatoryHistoricalGroundingPolicy
): string[] {
  const reasons: string[] = [];
  if (supplied.policyId !== registered.policyId) {
    reasons.push(
      `Supplied policy ID differs from the registered policy: expected ${registered.policyId}, observed ${supplied.policyId}`
    );
  }
  if (supplied.mappingId !== registered.mappingId) {
    reasons.push(
      `Supplied policy mapping differs from the registered policy: expected ${registered.mappingId}, observed ${supplied.mappingId}`
    );
  }
  if (supplied.customerFacingStatus !== registered.customerFacingStatus) {
    reasons.push("Supplied policy customer-facing status differs from the registered policy");
  }
  if (supplied.sourcePolicies.length !== registered.sourcePolicies.length) {
    reasons.push(
      `Supplied policy source count differs from the registered policy: expected ${registered.sourcePolicies.length}, observed ${supplied.sourcePolicies.length}`
    );
  }

  const count = Math.max(registered.sourcePolicies.length, supplied.sourcePolicies.length);
  for (let index = 0; index < count; index++) {
    const expected = registered.sourcePolicies[index];
    const observed = supplied.sourcePolicies[index];
    if (!expected) {
      reasons.push(`Supplied policy contains an unregistered source at position ${index + 1}`);
      continue;
    }
    if (!observed) {
      reasons.push(`Supplied policy omits registered source ${expected.sourceId}`);
      continue;
    }
    if (observed.sourceId !== expected.sourceId) {
      reasons.push(
        `Supplied policy source order or identity differs at position ${index + 1}: expected ${expected.sourceId}, observed ${observed.sourceId}`
      );
    }
    if (observed.dateBasis !== expected.dateBasis) {
      reasons.push(
        `Supplied policy date basis differs from the registered policy for ${expected.sourceId}: expected ${expected.dateBasis}, observed ${observed.dateBasis}`
      );
    }
    if (observed.rationale !== expected.rationale) {
      reasons.push(
        `Supplied policy rationale differs from the registered policy for ${expected.sourceId}`
      );
    }
  }
  return uniqueNonblank(reasons);
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

function citationProvenanceMismatchReasons(
  sourceId: string,
  selected: RegulatorySourceSnapshot,
  citation: RegulatoryCitationPackage["citations"][number]
): string[] {
  const reasons: string[] = [];
  const expectedFields: Array<[
    string,
    string | undefined,
    string | undefined,
  ]> = [
    ["source ID", selected.sourceId, citation.sourceId],
    ["snapshot ID", selected.snapshotId, citation.snapshotId],
    ["version identifier", selected.versionIdentifier, citation.versionIdentifier],
    ["effective date", selected.effectiveDate, citation.effectiveDate],
    ["snapshot checksum", selected.checksum, citation.checksum],
    ["canonical URL", selected.canonicalUrl, citation.canonicalUrl],
    ["canonical title", selected.canonicalTitle, citation.title],
    ["citation label", selected.citation, citation.citation],
    ["retrieval timestamp", selected.retrievedAt, citation.retrievedAt],
  ];

  for (const [label, expected, observed] of expectedFields) {
    if (observed !== expected) {
      reasons.push(
        `Citation ${label} does not match the selected snapshot for ${sourceId}: expected ${expected ?? "missing"}, observed ${observed ?? "missing"}`
      );
    }
  }
  if (!citation.excerpt.trim() || !selected.text.includes(citation.excerpt)) {
    reasons.push(`Citation excerpt is not an exact substring of the selected snapshot for ${sourceId}`);
  }
  const expectedExcerptChecksum = sha256(citation.excerpt);
  if (citation.excerptChecksum !== expectedExcerptChecksum) {
    reasons.push(
      `Citation excerpt checksum does not match its excerpt for ${sourceId}: expected ${expectedExcerptChecksum}, observed ${citation.excerptChecksum}`
    );
  }
  return reasons;
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

  const citationsBySource = new Map<
    string,
    RegulatoryCitationPackage["citations"]
  >();
  for (const citation of citationPackage.citations) {
    const citations = citationsBySource.get(citation.sourceId) ?? [];
    citations.push(citation);
    citationsBySource.set(citation.sourceId, citations);
  }

  for (const decision of sourceDecisions) {
    if (decision.status !== "selected") continue;
    const selected = decision.versionSelection?.selectedSnapshot;
    if (!selected || !decision.selectedSnapshotId) {
      reasons.push(`Selected source decision lacks its immutable snapshot: ${decision.sourceId}`);
      continue;
    }
    const citations = citationsBySource.get(decision.sourceId) ?? [];
    if (citations.length === 0) {
      reasons.push(`Citation package lacks selected source: ${decision.sourceId}`);
      continue;
    }

    const snapshotIds = new Set(citations.map((citation) => citation.snapshotId));
    if (snapshotIds.size > 1) {
      reasons.push(
        `Citation package mixes multiple historical snapshots for ${decision.sourceId}: ${[
          ...snapshotIds,
        ].join(", ")}`
      );
    }
    for (const citation of citations) {
      reasons.push(
        ...citationProvenanceMismatchReasons(decision.sourceId, selected, citation)
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
      reasons.push(
        `Citation package contains a source without a selected historical version: ${citation.sourceId}`
      );
    }
  }

  return uniqueNonblank(reasons);
}

export function orchestrateHistoricalRegulatoryGrounding(
  request: HistoricalGroundingOrchestrationRequest
): HistoricalGroundingOrchestrationResult {
  const registeredPolicy = getHistoricalGroundingPolicy(request.mapping.mappingId);
  if (!registeredPolicy) {
    return result(
      request,
      "missing-policy",
      [`No historical grounding policy exists for mapping ${request.mapping.mappingId}`]
    );
  }

  const suppliedPolicyErrors = request.policy
    ? suppliedPolicyMismatchReasons(registeredPolicy, request.policy)
    : [];
  const globalPolicyErrors = validateHistoricalGroundingPolicies();
  const mappingPolicyErrors = validatePolicyForMapping(request.mapping, registeredPolicy);
  const policyErrors = uniqueNonblank([
    ...globalPolicyErrors,
    ...mappingPolicyErrors,
    ...suppliedPolicyErrors,
  ]);
  if (policyErrors.length > 0) {
    return result(
      request,
      "invalid-policy",
      policyErrors,
      [],
      registeredPolicy.policyId
    );
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
      registeredPolicy.policyId
    );
  }

  const cachedDates = new Map<ContractGroundedDateBasis, ContractDateResolution>();
  const sourceDecisions = registeredPolicy.sourcePolicies.map((sourcePolicy) =>
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
      registeredPolicy.policyId
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
      registeredPolicy.policyId
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
      registeredPolicy.policyId
    );
  }

  return result(request, "ready", [], sourceDecisions, registeredPolicy.policyId);
}
