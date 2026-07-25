import path from "node:path";

import { parsePrepareUpdateReviewCliArguments } from "../cli/update-review-arguments.ts";

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

function expectThrow(label, args, pattern, environment = {}) {
  let message = "";
  try {
    parsePrepareUpdateReviewCliArguments(args, environment);
  } catch (error) {
    message = error instanceof Error ? error.message : String(error);
  }
  check(label, pattern.test(message), message);
}

const parsed = parsePrepareUpdateReviewCliArguments(
  [
    "--source",
    "dfars-252-204-7025",
    "--requested-by",
    "Regulatory Operator",
    "--snapshot-root",
    "fixtures/snapshots",
    "--packet-root",
    "fixtures/packets",
    "--created-at",
    "2026-08-01T12:00:00.000Z",
    "--candidate-snapshot-id",
    "dfars-252-204-7025:candidate",
  ],
  {}
);
check(
  "all supported options parse without consuming neighboring flags",
  parsed.sourceId === "dfars-252-204-7025" &&
    parsed.requestedBy === "Regulatory Operator" &&
    parsed.snapshotRoot === path.resolve("fixtures/snapshots") &&
    parsed.packetRoot === path.resolve("fixtures/packets") &&
    parsed.createdAt === "2026-08-01T12:00:00.000Z" &&
    parsed.candidateSnapshotId === "dfars-252-204-7025:candidate"
);

const environmentDefaults = parsePrepareUpdateReviewCliArguments(
  [
    "--source",
    "far-52-222-6",
    "--requested-by",
    "Operator",
    "--created-at",
    "2026-08-01T12:00:00.000Z",
  ],
  {
    REGULATORY_SNAPSHOT_ROOT: "env/snapshots",
    REGULATORY_UPDATE_PACKET_ROOT: "env/packets",
  }
);
check(
  "environment roots are used only when explicit options are absent",
  environmentDefaults.snapshotRoot === path.resolve("env/snapshots") &&
    environmentDefaults.packetRoot === path.resolve("env/packets")
);

expectThrow(
  "trailing options without values are rejected",
  ["--source", "far-52-222-6", "--requested-by", "Operator", "--packet-root"],
  /missing value.*--packet-root/i
);
expectThrow(
  "an option name cannot be consumed as another option's value",
  [
    "--source",
    "far-52-222-6",
    "--requested-by",
    "Operator",
    "--snapshot-root",
    "--packet-root",
    "/tmp/reviews",
  ],
  /missing value.*--snapshot-root/i
);
expectThrow(
  "unknown options are rejected",
  ["--source", "far-52-222-6", "--requested-by", "Operator", "--output", "/tmp"],
  /unknown regulatory update review option.*--output/i
);
expectThrow(
  "unexpected positional values are rejected",
  ["--source", "far-52-222-6", "--requested-by", "Operator", "extra"],
  /unexpected positional argument.*extra/i
);
expectThrow(
  "duplicate options are rejected",
  [
    "--source",
    "far-52-222-6",
    "--source",
    "dfars-252-204-7025",
    "--requested-by",
    "Operator",
  ],
  /duplicate regulatory update review option.*--source/i
);
expectThrow(
  "required source values remain mandatory",
  ["--requested-by", "Operator"],
  /missing required --source value/i
);
expectThrow(
  "required requester values remain mandatory",
  ["--source", "far-52-222-6"],
  /missing required --requested-by value/i
);
expectThrow(
  "blank environment snapshot roots are rejected",
  ["--source", "far-52-222-6", "--requested-by", "Operator"],
  /snapshot root must not be blank/i,
  {
    REGULATORY_SNAPSHOT_ROOT: " ",
    REGULATORY_UPDATE_PACKET_ROOT: "env/packets",
  }
);

if (failures > 0) {
  console.error(`\n${failures} of ${assertions} update-review CLI assertions failed.`);
  process.exit(1);
}

console.log(`\nAll ${assertions} update-review CLI assertions passed.`);
