// Guards against reintroducing sensitive operational logging patterns.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sources = {
  analyzerRoute: readFileSync(
    new URL("../../app/api/analyze-contract/route.ts", import.meta.url),
    "utf8",
  ),
  deletionRoute: readFileSync(
    new URL("../../app/api/delete-review/route.ts", import.meta.url),
    "utf8",
  ),
  webhookRoute: readFileSync(
    new URL("../../app/api/webhooks/stripe/route.ts", import.meta.url),
    "utf8",
  ),
  extraction: readFileSync(
    new URL("../analyzer/extract.ts", import.meta.url),
    "utf8",
  ),
  creditLifecycle: readFileSync(
    new URL("../review-credit-lifecycle.ts", import.meta.url),
    "utf8",
  ),
};

const forbiddenPatterns = [
  ["document preview logging", "preview: trimmed.slice"],
  ["filename-bearing extraction failures", "failed for ${fileName"],
  ["raw analyzer exception logging", "Analyzer Error:",],
  ["raw deletion exception logging", "Delete Review Error:",],
  ["raw webhook exception responses", "Webhook Error: ${message}"],
  ["payment-identifier reconciliation logging", "[SUBSCRIPTION_CREDIT_RECONCILIATION]"],
  ["raw processing exception persistence", "p_error: error instanceof Error"],
];

const combinedSource = Object.values(sources).join("\n");
for (const [label, pattern] of forbiddenPatterns) {
  assert.equal(
    combinedSource.includes(pattern),
    false,
    `Forbidden ${label} pattern was reintroduced: ${pattern}`,
  );
  console.log(`PASS: ${label} remains absent`);
}

assert.equal(
  sources.creditLifecycle.includes('p_error: "Review processing failed"'),
  true,
  "Credit restoration should persist only the generic processing failure marker.",
);
console.log("PASS: credit restoration stores only a generic failure marker");

assert.equal(
  sources.extraction.includes('recordOperationalIncident(\n      ocrTimedOut ? "analyzer_ocr_timeout" : "analyzer_ocr_failed"'),
  true,
  "OCR degradation should record only fixed operational incident codes.",
);
console.log("PASS: OCR degradation records fixed operational incident codes");
