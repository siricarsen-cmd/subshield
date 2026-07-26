import { parseStoredChangeSetReviewCliArguments } from "../cli/change-set-review-arguments.ts";

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

function expectThrow(label, args, pattern) {
  let message = "";
  try {
    parseStoredChangeSetReviewCliArguments(args, {});
  } catch (error) {
    message = error instanceof Error ? error.message : String(error);
  }
  check(label, pattern.test(message), message);
}

const validApprovalArgs = [
  "--source",
  "dfars-252-204-7025",
  "--packet-path",
  "dfars-252-204-7025/2026-07-03-abcd1234.json",
  "--draft-path",
  "dfars-252-204-7025/2026-07-04-abcd1234.json",
  "--decision",
  "approved",
  "--reviewed-by",
  "Alex Rivera, independent registry reviewer",
  "--reviewer-principal",
  "Alex Rivera",
  "--reviewed-at",
  "2026-07-05T12:00:00.000Z",
  "--note",
  "Reviewed the exact citation-template transition and official-source provenance.",
  "--note",
  "Reviewed mapping and historical-policy impacts and confirmed no automatic application.",
  "--review-kind",
  "mapping",
  "--review-kind",
  "historical-policy",
  "--review-kind",
  "citation-template",
  "--release-created-at",
  "2026-07-05T12:05:00.000Z",
  "--validation-commit",
  "a".repeat(40),
  "--regulatory-run-id",
  "41001",
  "--analyzer-run-id",
  "41002",
  "--validation-completed-at",
  "2026-07-05T11:00:00.000Z",
];

const parsedApproval = parseStoredChangeSetReviewCliArguments(validApprovalArgs, {});
check(
  "valid approval arguments produce a stable principal, strict roots, review kinds, and benchmark attestation",
  parsedApproval.decision === "approved" &&
    parsedApproval.reviewerPrincipal === "Alex Rivera" &&
    parsedApproval.reviewedKinds.join("|") ===
      "mapping|historical-policy|citation-template" &&
    parsedApproval.benchmarkValidation?.regulatoryWorkflowRunId === 41001 &&
    parsedApproval.benchmarkValidation?.analyzerWorkflowRunId === 41002 &&
    parsedApproval.releaseCreatedAt === "2026-07-05T12:05:00.000Z" &&
    parsedApproval.snapshotRoot.endsWith("data/regulatory-snapshots") &&
    parsedApproval.reviewRoot.endsWith("data/regulatory-change-set-reviews")
);

const parsedRejection = parseStoredChangeSetReviewCliArguments(
  [
    "--source",
    "dfars-252-204-7025",
    "--packet-path",
    "dfars-252-204-7025/packet.json",
    "--draft-path",
    "dfars-252-204-7025/draft.json",
    "--decision",
    "rejected",
    "--reviewed-by",
    "Jamie Patel, independent registry reviewer",
    "--reviewer-principal",
    "Jamie Patel",
    "--reviewed-at",
    "2026-07-05T13:00:00.000Z",
    "--note",
    "Rejected pending additional negative benchmark coverage.",
    "--review-kind",
    "citation-template",
  ],
  {}
);
check(
  "valid rejection arguments retain the stable principal and no approval-only evidence",
  parsedRejection.decision === "rejected" &&
    parsedRejection.reviewerPrincipal === "Jamie Patel" &&
    parsedRejection.reviewedKinds.join("|") === "citation-template" &&
    !parsedRejection.benchmarkValidation &&
    !parsedRejection.releaseCreatedAt
);

expectThrow(
  "unknown options are rejected",
  [...validApprovalArgs, "--mystery", "value"],
  /unknown stored change-set review option/i
);
expectThrow(
  "options with missing values are rejected",
  [...validApprovalArgs, "--result-file"],
  /missing value for stored change-set review option/i
);
expectThrow(
  "an option cannot consume the following flag as its value",
  ["--source", "--packet-path", "packet.json"],
  /missing value for stored change-set review option: --source/i
);
expectThrow(
  "single-value options cannot be duplicated",
  [...validApprovalArgs, "--source", "dfars-252-204-7025"],
  /duplicate stored change-set review option: --source/i
);
expectThrow(
  "a stable reviewer principal is required",
  validApprovalArgs.filter(
    (_value, index, values) =>
      values[index - 1] !== "--reviewer-principal" &&
      values[index] !== "--reviewer-principal"
  ),
  /missing required --reviewer-principal value/i
);
expectThrow(
  "review kinds cannot be duplicated",
  [...validApprovalArgs, "--review-kind", "mapping"],
  /review kinds must not be duplicated/i
);
expectThrow(
  "unknown review kinds are rejected",
  [...validApprovalArgs, "--review-kind", "commercial-contract"],
  /unknown stored change-set review kind/i
);
expectThrow(
  "approval requires a release timestamp",
  validApprovalArgs.filter(
    (_value, index, values) =>
      values[index - 1] !== "--release-created-at" &&
      values[index] !== "--release-created-at"
  ),
  /missing required --release-created-at value/i
);
expectThrow(
  "approval requires a validation commit",
  validApprovalArgs.filter(
    (_value, index, values) =>
      values[index - 1] !== "--validation-commit" &&
      values[index] !== "--validation-commit"
  ),
  /missing required --validation-commit value/i
);
expectThrow(
  "workflow run IDs must be positive integers",
  validApprovalArgs.map((value, index, values) =>
    values[index - 1] === "--regulatory-run-id" ? "not-a-number" : value
  ),
  /--regulatory-run-id must be a positive integer/i
);
expectThrow(
  "rejections cannot claim release or benchmark approval evidence",
  [
    "--source",
    "dfars-252-204-7025",
    "--packet-path",
    "packet.json",
    "--draft-path",
    "draft.json",
    "--decision",
    "rejected",
    "--reviewed-by",
    "Jamie Patel",
    "--reviewer-principal",
    "Jamie Patel",
    "--reviewed-at",
    "2026-07-05T13:00:00.000Z",
    "--note",
    "Rejected pending additional benchmark coverage.",
    "--review-kind",
    "citation-template",
    "--release-created-at",
    "2026-07-05T13:01:00.000Z",
  ],
  /must not include release or benchmark approval options/i
);
expectThrow(
  "at least one substantive note is required",
  validApprovalArgs.filter(
    (_value, index, values) => values[index - 1] !== "--note" && values[index] !== "--note"
  ),
  /requires at least one --note value/i
);
expectThrow(
  "at least one reviewed kind is required",
  validApprovalArgs.filter(
    (_value, index, values) =>
      values[index - 1] !== "--review-kind" && values[index] !== "--review-kind"
  ),
  /requires at least one --review-kind value/i
);

if (failures > 0) {
  console.error(`\n${failures} of ${assertions} change-set review CLI assertions failed.`);
  process.exit(1);
}

console.log(`\nAll ${assertions} change-set review CLI assertions passed.`);
