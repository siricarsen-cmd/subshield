import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { fetchApprovedRegulatorySource } from "../ingestion.ts";
import { reviewRegulatorySnapshot } from "../source-review.ts";
import {
  persistRegulatorySnapshotReview,
  storeRegulatorySnapshot,
} from "../snapshot-store.ts";
import {
  isVerifiedStoredRegulatoryUpdatePair,
  loadVerifiedStoredRegulatoryUpdatePair,
} from "../verified-stored-update-pair.ts";

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

const SOURCE_ID = "far-52-222-6";
const TITLE = "52.222-6 Construction Wage Rate Requirements";

function html(sentence) {
  return `<html><body><main><h1>${TITLE}</h1><p>${sentence}</p></main></body></html>`;
}

async function snapshot(sentence, retrievedAt, etag) {
  const body = html(sentence);
  return fetchApprovedRegulatorySource(SOURCE_ID, {
    now: new Date(retrievedAt),
    fetchImpl: async () =>
      new Response(body, {
        status: 200,
        headers: {
          "content-type": "text/html; charset=utf-8",
          etag,
        },
      }),
  });
}

function approve(sourceSnapshot, reviewedAt, sentence) {
  return reviewRegulatorySnapshot(sourceSnapshot, {
    decision: "approved",
    reviewedBy: "Independent regulatory reviewer",
    reviewedAt,
    reviewNotes: [
      "Reviewed the retained official-source text and version metadata for controlled update comparison.",
    ],
    requiredTextAnchors: [TITLE, sentence],
    verifiedVersionIdentifier: sourceSnapshot.versionIdentifier,
    verifiedEffectiveDate: sourceSnapshot.effectiveDate,
  });
}

const baselineSentence =
  "The Contractor shall pay all laborers and mechanics not less than the applicable wage determination.";
const candidateSentence =
  "The Contractor shall pay all laborers and mechanics not less than the applicable reviewed wage determination.";
const laterSentence =
  "The Contractor shall document and pay all laborers and mechanics under the applicable reviewed wage determination.";

const root = await mkdtemp(path.join(tmpdir(), "subshield-verified-stored-pair-"));
try {
  const baseline = await snapshot(
    baselineSentence,
    "2026-07-01T12:00:00.000Z",
    '"baseline"'
  );
  await storeRegulatorySnapshot(root, baseline);
  await checkRejects(
    "a pending-only store has no verified approved baseline",
    () => loadVerifiedStoredRegulatoryUpdatePair(root, SOURCE_ID),
    /no earlier approved stored regulatory baseline/i
  );

  const approvedBaseline = approve(
    baseline,
    "2026-07-01T13:00:00.000Z",
    baselineSentence
  );
  await persistRegulatorySnapshotReview(root, approvedBaseline);
  await checkRejects(
    "an approved snapshot is not its own update candidate",
    () => loadVerifiedStoredRegulatoryUpdatePair(root, SOURCE_ID),
    /no earlier approved stored regulatory baseline/i
  );

  const candidate = await snapshot(
    candidateSentence,
    "2026-08-01T12:00:00.000Z",
    '"candidate"'
  );
  await storeRegulatorySnapshot(root, candidate);
  const pendingPair = await loadVerifiedStoredRegulatoryUpdatePair(root, SOURCE_ID);
  check(
    "latest pending candidate is paired with the most recent earlier approved baseline",
    pendingPair.baselineSnapshotId === baseline.snapshotId &&
      pendingPair.candidateSnapshotId === candidate.snapshotId &&
      pendingPair.baseline.reviewStatus === "approved" &&
      pendingPair.candidate.reviewStatus === "pending" &&
      pendingPair.candidateRetainedAsApprovedEvidence === false
  );
  check(
    "verified stored pair is opaque, deeply frozen, and internally reproducible",
    isVerifiedStoredRegulatoryUpdatePair(pendingPair) &&
      Object.isFrozen(pendingPair) &&
      Object.isFrozen(pendingPair.baseline) &&
      Object.isFrozen(pendingPair.candidate) &&
      !isVerifiedStoredRegulatoryUpdatePair(structuredClone(pendingPair))
  );
  await checkRejects(
    "an explicitly selected stale snapshot cannot replace the latest observed candidate",
    () => loadVerifiedStoredRegulatoryUpdatePair(root, SOURCE_ID, baseline.snapshotId),
    /not the latest observed snapshot/i
  );

  const approvedCandidate = approve(
    candidate,
    "2026-08-01T13:00:00.000Z",
    candidateSentence
  );
  await persistRegulatorySnapshotReview(root, approvedCandidate);
  const approvedPair = await loadVerifiedStoredRegulatoryUpdatePair(root, SOURCE_ID);
  check(
    "candidate approval retains the prior approved snapshot as the comparison baseline",
    approvedPair.baselineSnapshotId === baseline.snapshotId &&
      approvedPair.candidateSnapshotId === candidate.snapshotId &&
      approvedPair.candidate.reviewStatus === "approved" &&
      approvedPair.candidateRetainedAsApprovedEvidence === true
  );

  const laterCandidate = await snapshot(
    laterSentence,
    "2026-09-01T12:00:00.000Z",
    '"later-candidate"'
  );
  const laterStore = await storeRegulatorySnapshot(root, laterCandidate);
  const rollingPair = await loadVerifiedStoredRegulatoryUpdatePair(root, SOURCE_ID);
  check(
    "a later pending candidate rolls forward to the most recent earlier approved baseline",
    rollingPair.baselineSnapshotId === candidate.snapshotId &&
      rollingPair.candidateSnapshotId === laterCandidate.snapshotId &&
      rollingPair.candidate.reviewStatus === "pending"
  );

  const manifest = JSON.parse(await readFile(laterStore.manifestPath, "utf8"));
  const pendingEntry = manifest.snapshots.find(
    (entry) => entry.snapshotId === laterCandidate.snapshotId
  );
  pendingEntry.reviewedBy = "Premature reviewer";
  pendingEntry.reviewedAt = "2026-09-01T13:00:00.000Z";
  pendingEntry.reviewNotes = ["Pending entry must not claim final review."];
  await writeFile(laterStore.manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  await checkRejects(
    "pending stored candidates cannot smuggle completed reviewer provenance",
    () => loadVerifiedStoredRegulatoryUpdatePair(root, SOURCE_ID),
    /pending stored regulatory candidate contains completed review provenance/i
  );
} finally {
  await rm(root, { recursive: true, force: true });
}

const staleRoot = await mkdtemp(path.join(tmpdir(), "subshield-stale-stored-pair-"));
try {
  const baseline = await snapshot(
    baselineSentence,
    "2026-07-10T12:00:00.000Z",
    '"stale-baseline"'
  );
  await storeRegulatorySnapshot(staleRoot, baseline);
  await persistRegulatorySnapshotReview(
    staleRoot,
    approve(baseline, "2026-07-10T13:00:00.000Z", baselineSentence)
  );
  const staleCandidate = await snapshot(
    candidateSentence,
    "2026-07-09T12:00:00.000Z",
    '"stale-candidate"'
  );
  await storeRegulatorySnapshot(staleRoot, staleCandidate);
  await checkRejects(
    "a candidate retrieved before every approved snapshot has no valid earlier baseline",
    () => loadVerifiedStoredRegulatoryUpdatePair(staleRoot, SOURCE_ID),
    /no earlier approved stored regulatory baseline/i
  );
} finally {
  await rm(staleRoot, { recursive: true, force: true });
}

const rejectedRoot = await mkdtemp(path.join(tmpdir(), "subshield-rejected-stored-pair-"));
try {
  const baseline = await snapshot(
    baselineSentence,
    "2026-07-01T12:00:00.000Z",
    '"rejected-baseline"'
  );
  await storeRegulatorySnapshot(rejectedRoot, baseline);
  await persistRegulatorySnapshotReview(
    rejectedRoot,
    approve(baseline, "2026-07-01T13:00:00.000Z", baselineSentence)
  );
  const rejectedCandidate = await snapshot(
    candidateSentence,
    "2026-08-01T12:00:00.000Z",
    '"rejected-candidate"'
  );
  await storeRegulatorySnapshot(rejectedRoot, rejectedCandidate);
  const reviewedRejected = reviewRegulatorySnapshot(rejectedCandidate, {
    decision: "rejected",
    reviewedBy: "Independent regulatory reviewer",
    reviewedAt: "2026-08-01T13:00:00.000Z",
    reviewNotes: ["Rejected because the retained source metadata requires correction."],
    requiredTextAnchors: [TITLE],
    verifiedVersionIdentifier: rejectedCandidate.versionIdentifier,
    verifiedEffectiveDate: rejectedCandidate.effectiveDate,
  });
  await persistRegulatorySnapshotReview(rejectedRoot, reviewedRejected);
  await checkRejects(
    "rejected retained snapshots cannot become update candidates",
    () => loadVerifiedStoredRegulatoryUpdatePair(rejectedRoot, SOURCE_ID),
    /rejected stored regulatory snapshot cannot be an update candidate/i
  );
} finally {
  await rm(rejectedRoot, { recursive: true, force: true });
}

if (failures > 0) {
  console.error(`\n${failures} of ${assertions} verified stored-pair assertions failed.`);
  process.exit(1);
}

console.log(`\nAll ${assertions} verified stored-pair assertions passed.`);
