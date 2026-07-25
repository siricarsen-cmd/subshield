import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  canUseSnapshotForClientCitation,
  compareRegulatorySnapshots,
  fetchApprovedRegulatorySource,
  hasValidSnapshotChecksum,
  normalizeRegulatoryHtml,
  normalizeRegulatoryJson,
  resolveRegulatoryRetrievalUrl,
} from "../ingestion.ts";
import { getRegulatorySource } from "../source-catalog.ts";
import {
  loadLatestObservedRegulatorySnapshot,
  loadRegulatorySnapshotManifest,
  storeRegulatorySnapshot,
} from "../snapshot-store.ts";

let assertions = 0;
let failures = 0;

function check(label, condition, details = "") {
  assertions++;
  if (condition) {
    console.log(`PASS: ${label}`);
    return;
  }
  failures++;
  console.error(`FAIL: ${label}${details ? ` — ${details}` : ""}`);
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

const source = getRegulatorySource("ecfr-29-part-5");
check("eCFR labor source exists", Boolean(source));
if (source) {
  const retrievalUrl = resolveRegulatoryRetrievalUrl(source, "current");
  check(
    "eCFR pages use the official versioner API for controlled retrieval",
    retrievalUrl === "https://www.ecfr.gov/api/versioner/v1/full/current/title-29.xml?part=5",
    retrievalUrl
  );
}

const htmlA = `<!doctype html><html><head><style>.hidden{display:none}</style></head><body>
<main><h1>52.222-6 Construction Wage Rate Requirements</h1>
<p>The Contractor shall pay all laborers and mechanics not less than the applicable wage determination.</p>
<script>window.tracking = true;</script></main></body></html>`;
const htmlB = `<html><body><main>
<h1>52.222-6 Construction Wage Rate Requirements</h1>
<p> The Contractor shall pay all laborers and mechanics not less than the applicable wage determination. </p>
</main></body></html>`;

check(
  "HTML normalization removes scripts and preserves legal text",
  normalizeRegulatoryHtml(htmlA).includes("The Contractor shall pay all laborers") &&
    !normalizeRegulatoryHtml(htmlA).includes("window.tracking")
);
check(
  "equivalent HTML normalizes consistently",
  normalizeRegulatoryHtml(htmlA) === normalizeRegulatoryHtml(htmlB)
);
check(
  "JSON normalization is stable across key order",
  normalizeRegulatoryJson('{"b":2,"a":{"z":1,"y":2}}') ===
    normalizeRegulatoryJson('{"a":{"y":2,"z":1},"b":2}')
);

const fetchHtmlA = async () =>
  new Response(htmlA, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      etag: '"fixture-a"',
      "last-modified": "Sat, 25 Jul 2026 00:00:00 GMT",
    },
  });
const fetchHtmlB = async () =>
  new Response(htmlB, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  });

const snapshotA = await fetchApprovedRegulatorySource("far-52-222-6", {
  fetchImpl: fetchHtmlA,
  now: new Date("2026-07-25T16:00:00.000Z"),
});
const snapshotB = await fetchApprovedRegulatorySource("far-52-222-6", {
  fetchImpl: fetchHtmlB,
  now: new Date("2026-07-26T16:00:00.000Z"),
});

check("new snapshots are pending review", snapshotA.reviewStatus === "pending");
check("snapshot retains raw retrieval metadata", snapshotA.retrieval.etag === '"fixture-a"');
check("snapshot checksum validates", hasValidSnapshotChecksum(snapshotA));
check("equivalent normalized content has the same checksum", snapshotA.checksum === snapshotB.checksum);
check("different raw HTML retains different raw checksums", snapshotA.rawChecksum !== snapshotB.rawChecksum);
check(
  "equivalent normalized snapshots compare as unchanged",
  compareRegulatorySnapshots(snapshotB, snapshotA).status === "unchanged"
);
check("pending snapshot cannot support a client citation", !canUseSnapshotForClientCitation(snapshotA));

const approvedSnapshot = {
  ...snapshotA,
  reviewStatus: "approved",
  reviewedAt: "2026-07-25T17:00:00.000Z",
  reviewedBy: "SubShield regulatory review",
};
check("approved intact snapshot may support a client citation", canUseSnapshotForClientCitation(approvedSnapshot));
check(
  "tampered approved snapshot is blocked from client citation",
  !canUseSnapshotForClientCitation({ ...approvedSnapshot, text: `${approvedSnapshot.text}\nchanged` })
);

await checkRejects(
  "redirects outside approved government domains are blocked",
  () =>
    fetchApprovedRegulatorySource("far-52-222-6", {
      fetchImpl: async () =>
        new Response(null, {
          status: 302,
          headers: { location: "https://example.com/unapproved" },
        }),
    }),
  /redirected outside approved government domains/i
);

let approvedRedirectCalls = 0;
const redirectedSnapshot = await fetchApprovedRegulatorySource("far-52-222-6", {
  fetchImpl: async () => {
    approvedRedirectCalls++;
    if (approvedRedirectCalls === 1) {
      return new Response(null, {
        status: 302,
        headers: { location: "https://www.acquisition.gov/far/52.222-6?source=canonical" },
      });
    }
    return new Response(htmlA, {
      status: 200,
      headers: { "content-type": "text/html" },
    });
  },
  now: new Date("2026-07-27T16:00:00.000Z"),
});
check(
  "approved government redirects are retained in provenance",
  redirectedSnapshot.retrieval.redirectChain.length === 1 &&
    redirectedSnapshot.retrieval.finalUrl.startsWith("https://www.acquisition.gov/")
);

await checkRejects(
  "declared oversized source responses are blocked before ingestion",
  () =>
    fetchApprovedRegulatorySource("far-52-222-6", {
      fetchImpl: async () =>
        new Response(htmlA, {
          status: 200,
          headers: {
            "content-type": "text/html",
            "content-length": "5000",
          },
        }),
      maxResponseBytes: 100,
    }),
  /above the 100-byte limit/i
);

const changedHtml = `<html><body><main><h1>52.222-6 Construction Wage Rate Requirements</h1>
<p>The Contractor shall pay laborers and mechanics the updated applicable wage and fringe rates.</p>
<p>This fixture represents a substantive official-source change.</p></main></body></html>`;
const changedSnapshot = await fetchApprovedRegulatorySource("far-52-222-6", {
  fetchImpl: async () =>
    new Response(changedHtml, {
      status: 200,
      headers: { "content-type": "text/html" },
    }),
  now: new Date("2026-07-28T16:00:00.000Z"),
});
const changedComparison = compareRegulatorySnapshots(changedSnapshot, snapshotA);
check("substantive text changes are detected", changedComparison.status === "content-changed");
check("change summary records a first differing line", Number.isInteger(changedComparison.firstDifferentLine));

const outputRoot = await mkdtemp(path.join(tmpdir(), "subshield-regulatory-ingestion-"));
try {
  const firstStore = await storeRegulatorySnapshot(outputRoot, snapshotA);
  check("first snapshot is stored", firstStore.status === "stored");
  check("first snapshot is classified correctly", firstStore.comparison.status === "first-snapshot");

  const unchangedStore = await storeRegulatorySnapshot(outputRoot, snapshotB);
  check("unchanged normalized content does not create repository churn", unchangedStore.status === "unchanged");

  const changedStore = await storeRegulatorySnapshot(outputRoot, changedSnapshot);
  check("changed content creates a new immutable snapshot", changedStore.status === "stored");
  check("changed content is classified correctly", changedStore.comparison.status === "content-changed");

  const manifest = await loadRegulatorySnapshotManifest(outputRoot, "far-52-222-6");
  check("manifest retains both historical content versions", manifest.snapshots.length === 2);
  check("pending ingestion does not create an approved snapshot", !manifest.latestApprovedSnapshotId);
  check(
    "manifest latest observed pointer advances to changed content",
    manifest.latestObservedSnapshotId === changedSnapshot.snapshotId
  );

  const latest = await loadLatestObservedRegulatorySnapshot(outputRoot, "far-52-222-6");
  check("latest stored snapshot can be loaded", latest?.checksum === changedSnapshot.checksum);

  const manifestText = await readFile(changedStore.manifestPath, "utf8");
  check("manifest is persisted as reviewable JSON", /latestObservedSnapshotId/.test(manifestText));
} finally {
  await rm(outputRoot, { recursive: true, force: true });
}

if (failures > 0) {
  console.error(`\n${failures} of ${assertions} regulatory ingestion assertions failed.`);
  process.exit(1);
}

console.log(`\nAll ${assertions} regulatory ingestion assertions passed.`);
