import { createHash } from "node:crypto";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { getApprovedRegulatoryEvidenceSnapshot } from "../approved-evidence-registry.ts";
import {
  reserveRegulatoryReviewResultFile,
} from "../cli/review-result-file.ts";
import { getRegisteredCitationTemplate } from "../registry-integrity.ts";
import { recordRegulatorySnapshotReviewDecision } from "../review-decision-command.ts";
import {
  loadRegulatorySnapshotManifest,
  storeRegulatorySnapshot,
} from "../snapshot-store.ts";

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

async function checkRejects(label, action, pattern) {
  assertions++;
  try {
    await action();
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

function sha256(value) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

const SOURCE_ID = "dfars-252-204-7025";
const MAPPING_ID = "qa-c-future-cmmc-by-notice";
const template = getRegisteredCitationTemplate(MAPPING_ID);
if (!template) throw new Error(`Missing citation template: ${MAPPING_ID}`);
const citation = template.value.citations.find((candidate) => candidate.sourceId === SOURCE_ID);
if (!citation) throw new Error(`Missing citation for ${SOURCE_ID}`);
const retained = getApprovedRegulatoryEvidenceSnapshot(SOURCE_ID, citation.snapshotId);
if (!retained) throw new Error(`Missing approved evidence fixture: ${citation.snapshotId}`);

const reviewRoot = await mkdtemp(path.join(tmpdir(), "subshield-review-audit-provenance-"));
try {
  const snapshot = structuredClone(retained);
  snapshot.snapshotId = `${SOURCE_ID}:review-audit-provenance`;
  snapshot.retrievedAt = "2026-07-01T12:00:00.000Z";
  snapshot.retrieval.retrievedAt = snapshot.retrievedAt;
  snapshot.checksum = sha256(snapshot.text);
  snapshot.rawChecksum = sha256(`raw:${snapshot.snapshotId}:${snapshot.text}`);
  snapshot.reviewStatus = "pending";
  delete snapshot.reviewedBy;
  delete snapshot.reviewedAt;
  delete snapshot.reviewNotes;
  snapshot.provenanceNotes = ["Controlled review audit-provenance fixture."];
  await storeRegulatorySnapshot(reviewRoot, snapshot);

  const anchors = [citation.extractionStartAnchor, citation.extractionEndAnchor];
  const result = await recordRegulatorySnapshotReviewDecision({
    snapshotRoot: reviewRoot,
    sourceId: SOURCE_ID,
    snapshotId: snapshot.snapshotId,
    decision: "approved",
    reviewedBy: "Alex Rivera, independent regulatory reviewer",
    reviewedAt: "2026-07-02T12:00:00.000Z",
    reviewNotes: ["Verified source identity and retained text against the official publication."],
    requiredTextAnchors: anchors,
    verifiedVersionIdentifier: snapshot.versionIdentifier,
    verifiedEffectiveDate: snapshot.effectiveDate,
  });
  const manifest = await loadRegulatorySnapshotManifest(reviewRoot, SOURCE_ID);
  const entry = manifest.snapshots.find((candidate) => candidate.snapshotId === snapshot.snapshotId);
  check(
    "exact verified anchors persist in the final manifest review provenance",
    entry?.reviewNotes?.includes(`Verified source anchor 1: ${anchors[0]}`) &&
      entry.reviewNotes.includes(`Verified source anchor 2: ${anchors[1]}`)
  );
  check(
    "the data-minimized result retains stable source-specific anchor fingerprints",
    result.verifiedAnchorFingerprints.length === anchors.length &&
      new Set(result.verifiedAnchorFingerprints).size === anchors.length &&
      result.verifiedAnchorFingerprints.every((value) => /^sha256:[a-f0-9]{64}$/.test(value)) &&
      !JSON.stringify(result).includes('"text":')
  );
} finally {
  await rm(reviewRoot, { recursive: true, force: true });
}

const resultRoot = await mkdtemp(path.join(tmpdir(), "subshield-review-result-reservation-"));
try {
  const existingPath = path.join(resultRoot, "existing.json");
  await writeFile(existingPath, "existing", "utf8");
  await checkRejects(
    "an existing result file is refused before a review decision can be attempted",
    () => reserveRegulatoryReviewResultFile(existingPath),
    /EEXIST|file exists/i
  );

  const abandonedPath = path.join(resultRoot, "abandoned.json");
  const abandoned = await reserveRegulatoryReviewResultFile(abandonedPath);
  await abandoned.abandon();
  let abandonedExists = true;
  try {
    await access(abandonedPath);
  } catch {
    abandonedExists = false;
  }
  check("an unused reservation is removed after a failed review", !abandonedExists);

  const finalizedPath = path.join(resultRoot, "finalized.json");
  const finalized = await reserveRegulatoryReviewResultFile(finalizedPath);
  const serialized = `${JSON.stringify({ status: "approved", persisted: true }, null, 2)}\n`;
  await finalized.finalize(serialized);
  check(
    "a reserved result file finalizes without trailing reservation bytes",
    (await readFile(finalizedPath, "utf8")) === serialized
  );
} finally {
  await rm(resultRoot, { recursive: true, force: true });
}

if (failures > 0) {
  console.error(`\n${failures} of ${assertions} audit-provenance assertions failed.`);
  process.exit(1);
}

console.log(`\nAll ${assertions} audit-provenance assertions passed.`);
