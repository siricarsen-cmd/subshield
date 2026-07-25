import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { getApprovedRegulatoryEvidenceSnapshot } from "../approved-evidence-registry.ts";
import { getRegisteredCitationTemplate } from "../registry-integrity.ts";
import {
  buildRegulatoryUpdateReviewPacket,
  loadRegulatoryUpdateReviewPacket,
  storeRegulatoryUpdateReviewPacket,
  validateRegulatoryUpdateReviewPacket,
} from "../update-review-packet.ts";
import { prepareRegulatoryUpdateIntake } from "../update-intake.ts";

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
const templateEntry = getRegisteredCitationTemplate(MAPPING_ID);
if (!templateEntry) throw new Error(`Missing citation template: ${MAPPING_ID}`);
const registeredCitation = templateEntry.value.citations.find(
  (citation) => citation.sourceId === SOURCE_ID
);
if (!registeredCitation) throw new Error(`Missing registered citation: ${SOURCE_ID}`);
const baseline = getApprovedRegulatoryEvidenceSnapshot(
  SOURCE_ID,
  registeredCitation.snapshotId
);
if (!baseline) throw new Error(`Missing approved baseline: ${registeredCitation.snapshotId}`);

function candidate(overrides = {}) {
  const next = structuredClone(baseline);
  next.snapshotId = `${SOURCE_ID}:review-packet-candidate:${overrides.idSuffix ?? "default"}`;
  next.retrievedAt = overrides.retrievedAt ?? "2026-08-02T12:00:00.000Z";
  next.retrieval.retrievedAt = next.retrievedAt;
  next.reviewStatus = "pending";
  delete next.reviewedBy;
  delete next.reviewedAt;
  delete next.reviewNotes;
  next.provenanceNotes = ["Controlled update review-packet candidate."];
  if (overrides.text !== undefined) next.text = overrides.text;
  next.checksum = overrides.checksum ?? sha256(next.text);
  next.rawChecksum = overrides.rawChecksum ?? baseline.rawChecksum;
  if (overrides.citation !== undefined) next.citation = overrides.citation;
  if (overrides.etag !== undefined) next.retrieval.etag = overrides.etag;
  return next;
}

function intake(next, overrides = {}) {
  return prepareRegulatoryUpdateIntake({
    baseline,
    candidate: next,
    requestedBy: "SubShield regulatory update monitor",
    createdAt: overrides.createdAt ?? "2026-08-02T13:00:00.000Z",
  });
}

const metadataCandidate = candidate({
  idSuffix: "metadata",
  citation: `${baseline.citation} — controlled metadata update`,
});
const metadataIntake = intake(metadataCandidate);
if (metadataIntake.status !== "proposal-prepared") {
  throw new Error(
    `Metadata fixture did not prepare a proposal: ${metadataIntake.status} ${metadataIntake.refusalReasons.join(" | ")}`
  );
}
const packet = buildRegulatoryUpdateReviewPacket(
  metadataIntake,
  "SubShield regulatory review coordinator",
  "2026-08-02T14:00:00.000Z"
);

check(
  "eligible metadata intake creates a pending non-applied benchmark packet",
  packet.reviewStatus === "pending" &&
    packet.applicationStatus === "not-applied" &&
    packet.customerFacingStatus === "benchmark-only" &&
    packet.intakeStatus === "proposal-prepared"
);
check(
  "review packet and nested proposal are deeply frozen",
  Object.isFrozen(packet) &&
    Object.isFrozen(packet.impacts) &&
    Object.isFrozen(packet.proposal) &&
    Object.isFrozen(packet.proposal?.transitions)
);
check(
  "review packet checksum validates before persistence",
  validateRegulatoryUpdateReviewPacket(packet).length === 0,
  validateRegulatoryUpdateReviewPacket(packet).join(" | ")
);
const serializedPacket = JSON.stringify(packet);
check(
  "review packet excludes full official-source payloads",
  !serializedPacket.includes('"text":') &&
    !serializedPacket.includes('"rawBody":') &&
    !serializedPacket.includes(baseline.text)
);

const outputRoot = await mkdtemp(path.join(tmpdir(), "subshield-regulatory-update-packet-"));
try {
  const stored = await storeRegulatoryUpdateReviewPacket(outputRoot, packet);
  check(
    "review packet uses a controlled source-scoped immutable path",
    stored.relativePath.startsWith(`${SOURCE_ID}/2026-08-02-`) &&
      stored.relativePath.endsWith(".json") &&
      stored.packetPath.startsWith(path.resolve(outputRoot))
  );
  const storedJson = await readFile(stored.packetPath, "utf8");
  check(
    "persisted review packet contains no full-source text field",
    !storedJson.includes('"text":') && !storedJson.includes(baseline.text)
  );

  const loaded = await loadRegulatoryUpdateReviewPacket(
    outputRoot,
    stored.relativePath,
    SOURCE_ID
  );
  check(
    "stored packet round-trips with stable checksum and frozen state",
    loaded.packetChecksum === packet.packetChecksum &&
      loaded.packetId === packet.packetId &&
      Object.isFrozen(loaded) &&
      validateRegulatoryUpdateReviewPacket(loaded).length === 0
  );

  await checkRejects(
    "immutable packet storage rejects a duplicate write",
    () => storeRegulatoryUpdateReviewPacket(outputRoot, packet),
    /EEXIST|file exists/i
  );
  await checkRejects(
    "packet loading rejects path traversal",
    () => loadRegulatoryUpdateReviewPacket(outputRoot, "../outside.json", SOURCE_ID),
    /unsafe regulatory update packet path|invalid regulatory update packet path shape/i
  );
  await checkRejects(
    "packet loading rejects a source-scoped path under the wrong source",
    () =>
      loadRegulatoryUpdateReviewPacket(
        outputRoot,
        stored.relativePath,
        "dfars-252-204-7012"
      ),
    /path source mismatch/i
  );

  const tampered = JSON.parse(storedJson);
  tampered.requestedBy = "Tampered requester";
  await writeFile(stored.packetPath, `${JSON.stringify(tampered, null, 2)}\n`, "utf8");
  await checkRejects(
    "stored packet loading rejects checksum-breaking tampering",
    () => loadRegulatoryUpdateReviewPacket(outputRoot, stored.relativePath, SOURCE_ID),
    /checksum does not reproduce/i
  );
} finally {
  await rm(outputRoot, { recursive: true, force: true });
}

const proposalMismatch = structuredClone(packet);
proposalMismatch.proposal.sourceId = "dfars-252-204-7012";
check(
  "packet validation rejects proposal/source identity mismatch",
  validateRegulatoryUpdateReviewPacket(proposalMismatch).some((error) =>
    /proposal source does not match/i.test(error)
  )
);

const forbiddenPayload = structuredClone(packet);
forbiddenPayload.proposal.fullSource = { text: baseline.text };
check(
  "packet validation rejects nested full-source payload fields",
  validateRegulatoryUpdateReviewPacket(forbiddenPayload).some((error) =>
    /prohibited full-source payload key/i.test(error)
  )
);

const unchangedIntake = intake(candidate({ idSuffix: "unchanged" }));
await checkRejects(
  "unchanged intake cannot create a review packet",
  async () =>
    buildRegulatoryUpdateReviewPacket(
      unchangedIntake,
      "Reviewer",
      "2026-08-02T14:00:00.000Z"
    ),
  /not eligible for a review packet/i
);

const transportIntake = intake(
  candidate({
    idSuffix: "transport",
    rawChecksum: sha256("changed markup only"),
    etag: '"transport-only"',
  })
);
await checkRejects(
  "transport-only intake cannot create a review packet",
  async () =>
    buildRegulatoryUpdateReviewPacket(
      transportIntake,
      "Reviewer",
      "2026-08-02T14:00:00.000Z"
    ),
  /not eligible for a review packet/i
);

const refusedIntake = intake(
  candidate({ idSuffix: "bad-checksum", checksum: `sha256:${"0".repeat(64)}` })
);
await checkRejects(
  "refused intake cannot create a review packet",
  async () =>
    buildRegulatoryUpdateReviewPacket(
      refusedIntake,
      "Reviewer",
      "2026-08-02T14:00:00.000Z"
    ),
  /not eligible for a review packet/i
);

const driftText = baseline.text.replace(
  registeredCitation.extractionStartAnchor,
  "Revised heading that removes the registered source anchor"
);
const driftIntake = intake(
  candidate({
    idSuffix: "anchor-drift",
    text: driftText,
    rawChecksum: sha256(driftText),
  })
);
const driftPacket = buildRegulatoryUpdateReviewPacket(
  driftIntake,
  "SubShield regulatory review coordinator",
  "2026-08-02T14:00:00.000Z"
);
check(
  "manual anchor-drift intake creates a pending review packet without transitions",
  driftPacket.intakeStatus === "manual-review-required" &&
    driftPacket.proposal?.readiness === "manual-redesign-required" &&
    driftPacket.proposal.transitions.length === 0 &&
    driftPacket.refusalReasons.some((reason) => /anchor was not found/i.test(reason))
);

const predatingPacket = structuredClone(packet);
predatingPacket.createdAt = "2026-08-02T12:30:00.000Z";
check(
  "packet validation rejects packets that predate their intake proposal",
  validateRegulatoryUpdateReviewPacket(predatingPacket).some((error) =>
    /cannot predate its intake proposal/i.test(error)
  )
);

if (failures > 0) {
  console.error(`\n${failures} of ${assertions} regulatory update-review-packet assertions failed.`);
  process.exit(1);
}

console.log(`\nAll ${assertions} regulatory update-review-packet assertions passed.`);
