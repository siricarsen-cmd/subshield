import { mkdtemp, readFile, rm, unlink } from "node:fs/promises";
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
  loadStoredRegulatorySnapshot,
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
  check(
    "eCFR historical retrieval accepts an exact ISO date",
    resolveRegulatoryRetrievalUrl(source, "2026-07-25") ===
      "https://www.ecfr.gov/api/versioner/v1/full/2026-07-25/title-29.xml?part=5"
  );
  await checkRejects(
    "eCFR historical retrieval rejects malformed dates",
    async () => resolveRegulatoryRetrievalUrl(source, "../../untrusted"),
    /invalid eCFR as-of date/i
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
const snapshotBRepeat = await fetchApprovedRegulatorySource("far-52-222-6", {
  fetchImpl: fetchHtmlB,
  now: new Date("2026-07-26T18:00:00.000Z"),
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
check(
  "approved snapshot with altered canonical provenance is blocked",
  !canUseSnapshotForClientCitation({
    ...approvedSnapshot,
    canonicalUrl: "https://www.acquisition.gov/far/52.222-8",
  })
);
check(
  "approved snapshot with a different approved source retrieval route is blocked",
  !canUseSnapshotForClientCitation({
    ...approvedSnapshot,
    retrieval: {
      ...approvedSnapshot.retrieval,
      requestedUrl: "https://www.acquisition.gov/far/52.222-8",
      finalUrl: "https://www.acquisition.gov/far/52.222-8",
    },
  })
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

await checkRejects(
  "streamed oversized responses are stopped without a Content-Length header",
  () =>
    fetchApprovedRegulatorySource("far-52-222-6", {
      fetchImpl: async () =>
        new Response(htmlA.repeat(20), {
          status: 200,
          headers: { "content-type": "text/html" },
        }),
      maxResponseBytes: 100,
    }),
  /more than the 100-byte limit/i
);

await checkRejects(
  "the fetch timeout remains active while a response body is stalled",
  () =>
    fetchApprovedRegulatorySource("far-52-222-6", {
      fetchImpl: async (_url, init) => {
        const signal = init?.signal;
        const body = new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode("<html><body><main>partial official source text"));
            signal?.addEventListener(
              "abort",
              () => controller.error(new DOMException("The operation was aborted", "AbortError")),
              { once: true }
            );
          },
        });
        return new Response(body, {
          status: 200,
          headers: { "content-type": "text/html" },
        });
      },
      timeoutMs: 25,
    }),
  /abort/i
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
  await checkRejects(
    "snapshot loading rejects manifest paths that escape the controlled root",
    () =>
      loadStoredRegulatorySnapshot(
        outputRoot,
        {
          snapshotId: snapshotA.snapshotId,
          path: "../outside.json",
          checksum: snapshotA.checksum,
          rawChecksum: snapshotA.rawChecksum,
          retrievedAt: snapshotA.retrievedAt,
          reviewStatus: snapshotA.reviewStatus,
        },
        snapshotA.sourceId
      ),
    /unsafe regulatory snapshot path|invalid regulatory snapshot path shape/i
  );

  await checkRejects(
    "snapshot storage rejects altered normalized content",
    () => storeRegulatorySnapshot(outputRoot, { ...snapshotA, text: `${snapshotA.text}\ntampered` }),
    /normalized-text checksum is invalid/i
  );

  await checkRejects(
    "snapshot storage rejects canonical URLs that differ from the approved catalog",
    () =>
      storeRegulatorySnapshot(outputRoot, {
        ...snapshotA,
        canonicalUrl: "https://www.acquisition.gov/far/52.222-8",
      }),
    /canonical URL does not match the approved source catalog/i
  );

  const firstStore = await storeRegulatorySnapshot(outputRoot, snapshotA);
  check("first snapshot is stored", firstStore.status === "stored");
  check("first snapshot is classified correctly", firstStore.comparison.status === "first-snapshot");
  const immutableSnapshotText = await readFile(firstStore.snapshotPath, "utf8");

  await unlink(firstStore.manifestPath);
  const recoveredStore = await storeRegulatorySnapshot(outputRoot, snapshotA);
  check("an orphaned identical immutable snapshot can recover its manifest", recoveredStore.status === "stored");
  check(
    "manifest recovery does not rewrite the immutable snapshot file",
    (await readFile(recoveredStore.snapshotPath, "utf8")) === immutableSnapshotText
  );

  const observedStore = await storeRegulatorySnapshot(outputRoot, snapshotB);
  check(
    "raw or transport changes are retained without duplicating normalized legal text",
    observedStore.status === "observed"
  );
  check(
    "the lightweight observation retains the new raw checksum and retrieval receipt",
    observedStore.manifest.observations.length === 1 &&
      observedStore.manifest.observations[0].rawChecksum === snapshotB.rawChecksum &&
      observedStore.manifest.observations[0].retrieval.retrievedAt === snapshotB.retrievedAt
  );

  const unchangedStore = await storeRegulatorySnapshot(outputRoot, snapshotBRepeat);
  check(
    "identical normalized and raw provenance creates no repository churn",
    unchangedStore.status === "unchanged"
  );

  const changedStore = await storeRegulatorySnapshot(outputRoot, changedSnapshot);
  check("changed content creates a new immutable snapshot", changedStore.status === "stored");
  check("changed content is classified correctly", changedStore.comparison.status === "content-changed");

  const manifest = await loadRegulatorySnapshotManifest(outputRoot, "far-52-222-6");
  check("manifest retains both historical content versions", manifest.snapshots.length === 2);
  check("manifest retains raw-only retrieval observations", manifest.observations.length === 1);
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
