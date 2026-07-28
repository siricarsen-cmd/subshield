from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"Expected exactly one match in {path}, observed {count}: {old[:120]!r}")
    target.write_text(text.replace(old, new, 1), encoding="utf-8")


source = "lib/regulatory/registry-implementation-invocation.ts"
replace_once(
    source,
    'import { fingerprintRegulatoryRegistryValue } from "./registry-integrity";\n',
    'import { fingerprintRegulatoryRegistryValue } from "./registry-integrity";\n'
    'import {\n'
    '  validateRegulatoryImplementationExecutionReceipt,\n'
    '  type RegulatoryImplementationExecutionReceipt,\n'
    '} from "./registry-implementation-executor";\n',
)
replace_once(
    source,
    'const PRODUCTION_RESULT_STATUSES = new Set([\n'
    '  "preflight-refused",\n'
    '  "execution-failed",\n'
    '  "check-failed",\n'
    '  "push-failed",\n'
    '  "pull-request-failed",\n'
    '  "receipt-failed",\n'
    '  "success",\n'
    '  "production-boundary-failed",\n'
    ']);\n',
    'const REQUIRED_CHECKS = Object.freeze([\n'
    '  "npm run test:regulatory",\n'
    '  "npm run test:accuracy",\n'
    '  "npx tsc --noEmit",\n'
    '  "npm run build",\n'
    '] as const);\n'
    'const EXECUTION_FAILURE_STAGES = new Set([\n'
    '  "branch",\n'
    '  "write",\n'
    '  "worktree-verification",\n'
    '  "commit",\n'
    '  "commit-verification",\n'
    ']);\n'
    'const PRODUCTION_BOUNDARY_STAGES = new Set([\n'
    '  "execution",\n'
    '  "cleanup",\n'
    '  "execution-and-cleanup",\n'
    ']);\n',
)
insert_after = '''function exactAbsolutePath(value: string, label: string): string {
  if (!value || value !== value.trim() || /[\\x00-\\x1f\\x7f]/.test(value) || !isAbsolute(value)) {
    throw new Error(`Invocation ${label} must be an exact absolute path`);
  }
  return value;
}
'''
helpers = r'''

type UnknownRecord = Record<string, unknown>;
type CheckValidationMode = "partial" | "complete-success";

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function hasExactKeys(record: UnknownRecord, expected: readonly string[]): boolean {
  const actual = Object.keys(record).sort();
  const canonical = [...expected].sort();
  return actual.length === canonical.length && actual.every((key, index) => key === canonical[index]);
}

function hasNonblankErrors(value: unknown): value is readonly string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((entry) => typeof entry === "string" && entry.trim().length > 0)
  );
}

function validateControlledBoundary(record: UnknownRecord, label: string): string[] {
  return record.applicationStatus === "not-applied" &&
    record.customerFacingStatus === "benchmark-only" &&
    record.mergeStatus === "not-authorized"
    ? []
    : [`${label} escaped its controlled boundary`];
}

function validateCheckEvidence(value: unknown, mode: CheckValidationMode): string[] {
  const errors: string[] = [];
  if (!Array.isArray(value)) return ["Invocation production check evidence is not an array"];
  if (
    value.length > REQUIRED_CHECKS.length ||
    (mode === "complete-success" && value.length !== REQUIRED_CHECKS.length)
  ) {
    errors.push("Invocation production check evidence has an invalid length");
  }
  let commitSha: string | undefined;
  for (const [index, candidate] of value.entries()) {
    if (!isRecord(candidate) || !hasExactKeys(candidate, ["command", "commitSha", "conclusion"])) {
      errors.push("Invocation production check evidence has an invalid shape");
      continue;
    }
    if (candidate.command !== REQUIRED_CHECKS[index]) {
      errors.push("Invocation production check evidence does not preserve the required sequence");
    }
    if (typeof candidate.commitSha !== "string" || !COMMIT_SHA_RE.test(candidate.commitSha)) {
      errors.push("Invocation production check evidence commit is invalid");
    } else if (commitSha && candidate.commitSha !== commitSha) {
      errors.push("Invocation production check evidence is not bound to one commit");
    } else {
      commitSha = candidate.commitSha;
    }
    if (candidate.conclusion !== "success" && candidate.conclusion !== "failure") {
      errors.push("Invocation production check evidence conclusion is invalid");
    }
    if (mode === "complete-success" && candidate.conclusion !== "success") {
      errors.push("Invocation completed check evidence must contain only successes");
    }
    if (
      mode === "partial" &&
      index < value.length - 1 &&
      candidate.conclusion !== "success"
    ) {
      errors.push("Invocation partial check evidence may fail only at its final observed check");
    }
  }
  return [...new Set(errors)];
}

function validateExecutionResult(
  value: unknown,
  authorization?: RegulatoryImplementationInvocationAuthorization
): string[] {
  if (!isRecord(value) || typeof value.status !== "string") {
    return ["Invocation production execution result is invalid"];
  }
  const errors = validateControlledBoundary(value, "Invocation production execution result");
  switch (value.status) {
    case "preflight-refused":
      if (
        !hasExactKeys(value, [
          "status",
          "errors",
          "applicationStatus",
          "customerFacingStatus",
          "mergeStatus",
        ]) ||
        !hasNonblankErrors(value.errors)
      ) {
        errors.push("Invocation preflight refusal is incomplete");
      }
      break;
    case "execution-failed":
      if (
        !hasExactKeys(value, [
          "status",
          "stage",
          "errors",
          "applicationStatus",
          "customerFacingStatus",
          "mergeStatus",
        ]) ||
        typeof value.stage !== "string" ||
        !EXECUTION_FAILURE_STAGES.has(value.stage) ||
        !hasNonblankErrors(value.errors)
      ) {
        errors.push("Invocation execution failure is incomplete");
      }
      break;
    case "check-failed":
      if (
        !hasExactKeys(value, [
          "status",
          "checks",
          "errors",
          "applicationStatus",
          "customerFacingStatus",
          "mergeStatus",
        ]) ||
        !hasNonblankErrors(value.errors)
      ) {
        errors.push("Invocation check failure is incomplete");
      }
      errors.push(...validateCheckEvidence(value.checks, "partial"));
      break;
    case "push-failed":
    case "pull-request-failed":
    case "receipt-failed":
      if (
        !hasExactKeys(value, [
          "status",
          "checks",
          "errors",
          "applicationStatus",
          "customerFacingStatus",
          "mergeStatus",
        ]) ||
        !hasNonblankErrors(value.errors)
      ) {
        errors.push(`Invocation ${value.status} result is incomplete`);
      }
      errors.push(...validateCheckEvidence(value.checks, "complete-success"));
      break;
    case "success": {
      if (
        !hasExactKeys(value, [
          "status",
          "receipt",
          "applicationStatus",
          "customerFacingStatus",
          "mergeStatus",
        ]) ||
        !isRecord(value.receipt)
      ) {
        errors.push("Invocation success result lacks a complete receipt");
        break;
      }
      const receipt = value.receipt as unknown as RegulatoryImplementationExecutionReceipt;
      const receiptErrors = validateRegulatoryImplementationExecutionReceipt(receipt);
      if (receiptErrors.length > 0) {
        errors.push("Invocation success receipt does not reproduce");
      }
      errors.push(...validateCheckEvidence(receipt.checks, "complete-success"));
      if (
        authorization &&
        (receipt.repositoryFullName !== authorization.repositoryFullName ||
          receipt.planId !== authorization.planId ||
          receipt.planChecksum !== authorization.planChecksum ||
          receipt.bundleId !== authorization.bundleId ||
          receipt.bundleChecksum !== authorization.bundleChecksum ||
          receipt.baseCommitSha !== authorization.baseCommitSha ||
          receipt.targetBranch !== authorization.targetBranch ||
          receipt.executedBy !== authorization.expectedExecutorPrincipal)
      ) {
        errors.push("Invocation success receipt does not match its authorization");
      }
      break;
    }
    default:
      errors.push("Invocation production execution result status is invalid");
  }
  return [...new Set(errors)];
}

export function validateRegulatoryImplementationProductionResult(
  value: unknown,
  authorization?: RegulatoryImplementationInvocationAuthorization
): string[] {
  if (!isRecord(value) || typeof value.status !== "string") {
    return ["Invocation production result is invalid"];
  }
  if (value.status !== "production-boundary-failed") {
    return validateExecutionResult(value, authorization);
  }
  const allowedKeys = [
    "status",
    "stage",
    "errors",
    "applicationStatus",
    "customerFacingStatus",
    "mergeStatus",
    ...(Object.prototype.hasOwnProperty.call(value, "priorResult") ? ["priorResult"] : []),
  ];
  const errors = validateControlledBoundary(value, "Invocation production boundary failure");
  if (
    !hasExactKeys(value, allowedKeys) ||
    typeof value.stage !== "string" ||
    !PRODUCTION_BOUNDARY_STAGES.has(value.stage) ||
    !hasNonblankErrors(value.errors)
  ) {
    errors.push("Invocation production boundary failure is incomplete");
  }
  if (value.stage === "cleanup" && !Object.prototype.hasOwnProperty.call(value, "priorResult")) {
    errors.push("Invocation cleanup failure must preserve its prior structured result");
  }
  if (value.stage === "execution" && Object.prototype.hasOwnProperty.call(value, "priorResult")) {
    errors.push("Invocation execution boundary failure must not claim a prior result");
  }
  if (Object.prototype.hasOwnProperty.call(value, "priorResult")) {
    errors.push(...validateExecutionResult(value.priorResult, authorization));
  }
  return [...new Set(errors)];
}
'''
replace_once(source, insert_after, insert_after + helpers)
old_result_validation = '''  if (!audit.result || typeof audit.result !== "object" || !("status" in audit.result)) {
    errors.push("Invocation audit result is invalid");
  } else if (
    !PRODUCTION_RESULT_STATUSES.has(audit.result.status) ||
    audit.result.applicationStatus !== "not-applied" ||
    audit.result.customerFacingStatus !== "benchmark-only" ||
    audit.result.mergeStatus !== "not-authorized"
  ) {
    errors.push("Invocation audit production result escaped its controlled boundary");
  }
'''
new_result_validation = '''  const productionResultErrors = validateRegulatoryImplementationProductionResult(
    audit.result,
    audit.authorization
  );
  if (productionResultErrors.length > 0) {
    errors.push(...productionResultErrors);
  }
'''
replace_once(source, old_result_validation, new_result_validation)
replace_once(
    source,
    '  auditFilename,\n  refusal,\n',
    '  auditFilename,\n  validateCheckEvidence,\n  validateExecutionResult,\n  refusal,\n',
)

test = "lib/regulatory/__tests__/registry-implementation-invocation.test.mjs"
replace_once(
    test,
    '''const validateRegulatoryImplementationPullRequestBundle = () => [];
const fingerprintRegulatoryRegistryValue = (value) =>
''',
    '''const validateRegulatoryImplementationPullRequestBundle = () => [];
const validateRegulatoryImplementationExecutionReceipt = (receipt) =>
  receipt && receipt.__isolatedValidReceipt === true ? [] : ["isolated-invalid-receipt"];
const fingerprintRegulatoryRegistryValue = (value) =>
''',
)
replace_once(
    test,
    '''  .replace(
    /import\\s+\\{\\s*fingerprintRegulatoryRegistryValue\\s*\\}\\s+from "\\.\\/registry-integrity";/,
    ""
  );
''',
    '''  .replace(
    /import\\s+\\{\\s*fingerprintRegulatoryRegistryValue\\s*\\}\\s+from "\\.\\/registry-integrity";/,
    ""
  )
  .replace(
    /import\\s+\\{\\s*validateRegulatoryImplementationExecutionReceipt,[\\s\\S]*?\\}\\s+from "\\.\\/registry-implementation-executor";/,
    ""
  );
''',
)
replace_once(
    test,
    '''  validateRegulatoryImplementationInvocationAuditRecord,
  regulatoryImplementationInvocationTestSurface: surface,
''',
    '''  validateRegulatoryImplementationInvocationAuditRecord,
  validateRegulatoryImplementationProductionResult,
  regulatoryImplementationInvocationTestSurface: surface,
''',
)
insert_test_after = '''for (const [mutation, pattern, message] of [
  [
    { auditId: "regulatory-implementation-audit:forged" },
    /audit ID/i,
    "checksum-consistent audit ID forgery is refused",
  ],
  [
    { expectedExecutorPrincipal: "github-user:other-operator" },
    /authorization snapshot/i,
    "checksum-consistent audit principal forgery is refused",
  ],
  [
    {
      result: {
        ...auditPayload.result,
        customerFacingStatus: "customer-facing",
      },
    },
    /controlled boundary/i,
    "checksum-consistent production-boundary forgery is refused",
  ],
]) {
  const forgedPayload = { ...auditPayload, ...mutation };
  const forgedAudit = {
    ...forgedPayload,
    auditChecksum: surface.checksumForAudit(forgedPayload),
  };
  pass(
    validateRegulatoryImplementationInvocationAuditRecord(forgedAudit).some((error) =>
      pattern.test(error)
    ),
    message
  );
}
'''
result_tests = r'''

for (const [candidate, pattern, message] of [
  [
    {
      status: "success",
      applicationStatus: "not-applied",
      customerFacingStatus: "benchmark-only",
      mergeStatus: "not-authorized",
    },
    /complete receipt/i,
    "success without a receipt is refused",
  ],
  [
    {
      status: "execution-failed",
      errors: ["failure"],
      applicationStatus: "not-applied",
      customerFacingStatus: "benchmark-only",
      mergeStatus: "not-authorized",
    },
    /execution failure/i,
    "execution failure without a valid stage is refused",
  ],
  [
    {
      status: "check-failed",
      checks: [{ command: "wrong", commitSha: "d".repeat(40), conclusion: "success" }],
      errors: ["failure"],
      applicationStatus: "not-applied",
      customerFacingStatus: "benchmark-only",
      mergeStatus: "not-authorized",
    },
    /required sequence/i,
    "check failure with a forged command sequence is refused",
  ],
  [
    {
      status: "push-failed",
      checks: [],
      errors: ["failure"],
      applicationStatus: "not-applied",
      customerFacingStatus: "benchmark-only",
      mergeStatus: "not-authorized",
    },
    /invalid length/i,
    "push failure without complete successful checks is refused",
  ],
  [
    {
      status: "production-boundary-failed",
      stage: "cleanup",
      errors: ["cleanup failed"],
      applicationStatus: "not-applied",
      customerFacingStatus: "benchmark-only",
      mergeStatus: "not-authorized",
    },
    /prior structured result/i,
    "cleanup boundary failure without its prior result is refused",
  ],
]) {
  pass(
    validateRegulatoryImplementationProductionResult(candidate, storedAuthorization).some((error) =>
      pattern.test(error)
    ),
    message
  );
}
'''
replace_once(test, insert_test_after, insert_test_after + result_tests)
replace_once(
    test,
    '  [source.includes("production adapter failed unexpectedly"), "unexpected adapter failures remain structured"],\n',
    '  [source.includes("production adapter failed unexpectedly"), "unexpected adapter failures remain structured"],\n'
    '  [source.includes("validateRegulatoryImplementationExecutionReceipt"), "success audits validate their nested execution receipt"],\n'
    '  [source.includes("validateRegulatoryImplementationProductionResult"), "audit validation discriminates every production result variant"],\n',
)

doc = "docs/accuracy/regulatory-implementation-invocation-orchestration.md"
replace_once(
    doc,
    '''The complete underlying production result is preserved. This includes a prior structured executor result when the production adapter reports cleanup failure after a branch or PR may already exist. An unexpected adapter throw is converted into a sanitized `production-boundary-failed` execution result so authorization consumption and audit handling remain explicit.
''',
    '''The complete underlying production result is preserved. This includes a prior structured executor result when the production adapter reports cleanup failure after a branch or PR may already exist. An unexpected adapter throw is converted into a sanitized `production-boundary-failed` execution result so authorization consumption and audit handling remain explicit.

When audit evidence is read back, every discriminated production-result variant is validated for its exact fields, nonblank failure details, stage, required check sequence, and controlled boundaries. Success additionally requires a checksum-valid execution receipt whose repository, plan, bundle, base, branch, checks, and trusted executor principal match the authorization snapshot. A bare status object cannot validate as a complete result.
''',
)

print("PR #60 discriminated production-result validation patch completed")
