// Run with Node 22+:
// node --experimental-loader ./lib/analyzer/__tests__/ts-relative-import.loader.mjs lib/__tests__/security-headers.test.mjs
import assert from "node:assert/strict";
import { unstable_getResponseFromNextConfig } from "next/experimental/testing/server.js";
import nextConfig from "../../next.config.ts";
import {
  BASELINE_SECURITY_HEADERS,
  GLOBAL_SECURITY_HEADER_SOURCE,
} from "../security-headers.ts";

const expectedHeaders = new Map(
  BASELINE_SECURITY_HEADERS.map(({ key, value }) => [key.toLowerCase(), value]),
);

async function assertConfiguredHeaders(url) {
  const response = await unstable_getResponseFromNextConfig({
    url,
    nextConfig,
  });

  for (const [key, expectedValue] of expectedHeaders) {
    assert.equal(
      response.headers.get(key),
      expectedValue,
      `${url} should return ${key}: ${expectedValue}`,
    );
  }

  assert.equal(response.headers.get("cache-control"), null);
  assert.equal(response.headers.get("access-control-allow-origin"), null);
}

assert.equal(GLOBAL_SECURITY_HEADER_SOURCE, "/:path*");
assert.equal(nextConfig.poweredByHeader, false);
assert.deepEqual(
  [...expectedHeaders.entries()],
  [
    ["content-security-policy", "frame-ancestors 'none'"],
    ["permissions-policy", "camera=(), microphone=(), geolocation=(), browsing-topics=()"],
    ["referrer-policy", "strict-origin-when-cross-origin"],
    ["strict-transport-security", "max-age=63072000"],
    ["x-content-type-options", "nosniff"],
    ["x-frame-options", "DENY"],
  ],
);

await assertConfiguredHeaders("https://www.subshield.net/");
await assertConfiguredHeaders("https://www.subshield.net/pricing");
await assertConfiguredHeaders("https://www.subshield.net/api/create-checkout");
await assertConfiguredHeaders("https://www.subshield.net/icon.png");

console.log(
  `PASS: ${expectedHeaders.size} baseline security headers apply globally without custom cache or CORS overrides.`,
);
