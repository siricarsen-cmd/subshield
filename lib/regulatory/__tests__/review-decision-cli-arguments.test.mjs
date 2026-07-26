import path from "node:path";

import { parseRegulatoryReviewDecisionCliArguments } from "../cli/review-decision-arguments.ts";

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

function checkThrows(label, action, pattern) {
  assertions++;
  try {
    action();
    failures++;
    console.error(`FAIL: ${label} — expected rejection`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (pattern.test(message)) console.log(`PASS: ${label}`);
    else {
      failures++;
      console.error(`FAIL: ${label} — ${message}`);
    }
  }
}

const valid = parseRegulatoryReviewDecisionCliArguments(
  [
    "--source",
    "dfars-252-204-7025",
    "--snapshot-id",
    "dfars-252-204-7025:snapshot:20260701",
    "--decision",
    "approved",
    "--reviewed-by",
    "Jane Smith",
    "--reviewed-at",
    "2026-07-02T12:00:00.000Z",
    "--note",
    "Compared retained text to the official publication.",
    "--note",
    "Verified version and effective-date metadata.",
    "--anchor",
    "Covered contractor information systems",
    "--anchor",
    "Cybersecurity Maturity Model Certification",
    "--verified-version",
    "NOV 2025",
    "--verified-effective-date",
    "2025-11-10",
    "--result-file",
    "artifacts/review.json",
  ],
  { REGULATORY_SNAPSHOT_ROOT: "controlled/snapshots" }
);
check(
  "valid review arguments preserve repeated human evidence and resolve controlled paths",
  valid.sourceId === "dfars-252-204-7025" &&
    valid.snapshotId === "dfars-252-204-7025:snapshot:20260701" &&
    valid.decision === "approved" &&
    valid.reviewNotes.length === 2 &&
    valid.requiredTextAnchors.length === 2 &&
    valid.snapshotRoot === path.resolve("controlled/snapshots") &&
    valid.resultFile === path.resolve("artifacts/review.json")
);

checkThrows(
  "a missing option value cannot consume the next flag",
  () =>
    parseRegulatoryReviewDecisionCliArguments([
      "--source",
      "--snapshot-id",
      "dfars-252-204-7025:snapshot:1",
    ]),
  /missing value.*--source/i
);

checkThrows(
  "unknown review options are refused",
  () => parseRegulatoryReviewDecisionCliArguments(["--auto-approve", "yes"]),
  /unknown regulatory review option/i
);

checkThrows(
  "single-value review options cannot be duplicated",
  () =>
    parseRegulatoryReviewDecisionCliArguments([
      "--source",
      "one",
      "--source",
      "two",
    ]),
  /duplicate regulatory review option.*--source/i
);

checkThrows(
  "review decisions are closed to approved or rejected",
  () =>
    parseRegulatoryReviewDecisionCliArguments([
      "--decision",
      "pending",
    ]),
  /must be approved or rejected/i
);

checkThrows(
  "a review cannot omit substantive notes",
  () =>
    parseRegulatoryReviewDecisionCliArguments([
      "--source",
      "dfars-252-204-7025",
      "--snapshot-id",
      "dfars-252-204-7025:snapshot:1",
      "--decision",
      "rejected",
      "--reviewed-by",
      "Jane Smith",
      "--reviewed-at",
      "2026-07-02T12:00:00.000Z",
      "--anchor",
      "Required anchor",
    ]),
  /requires at least one --note/i
);

checkThrows(
  "a review cannot omit source-specific anchors",
  () =>
    parseRegulatoryReviewDecisionCliArguments([
      "--source",
      "dfars-252-204-7025",
      "--snapshot-id",
      "dfars-252-204-7025:snapshot:1",
      "--decision",
      "rejected",
      "--reviewed-by",
      "Jane Smith",
      "--reviewed-at",
      "2026-07-02T12:00:00.000Z",
      "--note",
      "Substantive review note",
    ]),
  /requires at least one --anchor/i
);

checkThrows(
  "unexpected positional values are refused",
  () => parseRegulatoryReviewDecisionCliArguments(["approve-everything"]),
  /unexpected positional/i
);

if (failures > 0) {
  console.error(`\n${failures} of ${assertions} review-argument assertions failed.`);
  process.exit(1);
}

console.log(`\nAll ${assertions} review-argument assertions passed.`);
