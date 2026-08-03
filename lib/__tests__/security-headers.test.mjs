// Run with Node 22+:
// node --experimental-loader ./lib/analyzer/__tests__/ts-relative-import.loader.mjs lib/__tests__/security-headers.test.mjs
import assert from "node:assert/strict";
import nextConfig from "../../next.config.ts";
import {
  BASELINE_SECURITY_HEADERS,
  GLOBAL_SECURITY_HEADER_SOURCE,
} from "../security-headers.ts";

const expectedHeaders = [
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
];

assert.equal(GLOBAL_SECURITY_HEADER_SOURCE, "/:path*");
assert.equal(nextConfig.poweredByHeader, false);
assert.deepEqual(
  BASELINE_SECURITY_HEADERS.map((header) => ({ ...header })),
  expectedHeaders,
);

assert.equal(typeof nextConfig.headers, "function");
const configuredRoutes = await nextConfig.headers();
assert.deepEqual(configuredRoutes, [
  {
    source: "/:path*",
    headers: expectedHeaders,
  },
]);

const configuredKeys = new Set(expectedHeaders.map(({ key }) => key.toLowerCase()));
assert.equal(configuredKeys.has("cache-control"), false);
assert.equal(configuredKeys.has("access-control-allow-origin"), false);
assert.equal(configuredKeys.has("x-powered-by"), false);

console.log(
  `PASS: ${expectedHeaders.length} exact baseline security headers are configured globally without custom cache or CORS overrides.`,
);
