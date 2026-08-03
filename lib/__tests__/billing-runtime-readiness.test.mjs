// Focused runtime-boundary checks. Run directly with Node 22+:
// node --experimental-loader ./lib/analyzer/__tests__/ts-relative-import.loader.mjs lib/__tests__/billing-runtime-readiness.test.mjs
import assert from "node:assert/strict";
import { resolveAppBaseUrl } from "../app-base-url.ts";
import { requireStripeSecretKey } from "../stripe.ts";
import { requireServerCreditDatabaseEnv } from "../server-credit-database.ts";

let checks = 0;

function check(label, callback) {
  callback();
  checks += 1;
  console.log(`PASS: ${label}`);
}

check("Stripe module import does not require a secret", () => {
  assert.throws(
    () => requireStripeSecretKey({}),
    /STRIPE_SECRET_KEY/,
  );
});

check("Stripe secret validation trims a configured key", () => {
  assert.equal(
    requireStripeSecretKey({ STRIPE_SECRET_KEY: "  sk_test_runtime  " }),
    "sk_test_runtime",
  );
});

check("production requires an explicit base URL", () => {
  assert.throws(
    () => resolveAppBaseUrl({ VERCEL_ENV: "production" }),
    /NEXT_PUBLIC_BASE_URL for production/,
  );
});

check("production normalizes the configured HTTPS origin", () => {
  assert.equal(
    resolveAppBaseUrl({
      VERCEL_ENV: "production",
      NEXT_PUBLIC_BASE_URL: "https://www.subshield.net/some/path/?ignored=true",
    }),
    "https://www.subshield.net",
  );
});

check("production rejects an HTTP loopback URL", () => {
  assert.throws(
    () => resolveAppBaseUrl({
      VERCEL_ENV: "production",
      NEXT_PUBLIC_BASE_URL: "http://localhost:3000",
    }),
    /must use HTTPS/,
  );
});

check("Preview uses its Vercel hostname when no public base URL is set", () => {
  assert.equal(
    resolveAppBaseUrl({
      VERCEL_ENV: "preview",
      VERCEL_URL: "subshield-feature-example.vercel.app",
    }),
    "https://subshield-feature-example.vercel.app",
  );
});

check("an explicit Preview base URL takes priority", () => {
  assert.equal(
    resolveAppBaseUrl({
      VERCEL_ENV: "preview",
      VERCEL_URL: "ignored-preview.vercel.app",
      NEXT_PUBLIC_BASE_URL: "https://preview.example.test/path/",
    }),
    "https://preview.example.test",
  );
});

check("Preview rejects a VERCEL_URL containing a scheme", () => {
  assert.throws(
    () => resolveAppBaseUrl({
      VERCEL_ENV: "preview",
      VERCEL_URL: "https://subshield-feature-example.vercel.app",
    }),
    /without a URL scheme/,
  );
});

check("Preview rejects a VERCEL_URL containing a path", () => {
  assert.throws(
    () => resolveAppBaseUrl({
      VERCEL_ENV: "preview",
      VERCEL_URL: "subshield-feature-example.vercel.app/path",
    }),
    /only a valid hostname/,
  );
});

check("local development permits an explicitly configured loopback URL", () => {
  assert.equal(
    resolveAppBaseUrl({ NEXT_PUBLIC_BASE_URL: "http://127.0.0.1:3000/path" }),
    "http://127.0.0.1:3000",
  );
});

check("non-loopback HTTP and unsupported protocols are rejected", () => {
  assert.throws(
    () => resolveAppBaseUrl({ NEXT_PUBLIC_BASE_URL: "http://example.com" }),
    /must use HTTPS/,
  );
  assert.throws(
    () => resolveAppBaseUrl({ NEXT_PUBLIC_BASE_URL: "ftp://example.com" }),
    /must use HTTPS/,
  );
});

check("server credit database module import does not require service-role secrets", () => {
  assert.throws(
    () => requireServerCreditDatabaseEnv({}),
    /SUPABASE_URL/,
  );
});

check("server credit database validation requires the service-role key", () => {
  assert.throws(
    () => requireServerCreditDatabaseEnv({
      SUPABASE_URL: "https://example.supabase.co",
    }),
    /SUPABASE_SERVICE_ROLE_KEY/,
  );
});

check("server credit database validation normalizes a complete configuration", () => {
  assert.deepEqual(
    requireServerCreditDatabaseEnv({
      SUPABASE_URL: "https://example.supabase.co/rest/v1",
      SUPABASE_SERVICE_ROLE_KEY: "  service-role-key  ",
    }),
    {
      url: "https://example.supabase.co",
      serviceRoleKey: "service-role-key",
    },
  );
});

console.log(`Completed ${checks} billing runtime readiness checks.`);
