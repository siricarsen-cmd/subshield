// Focused public Supabase environment validation. Run with Node 24:
// node --experimental-loader ./lib/analyzer/__tests__/ts-relative-import.loader.mjs lib/__tests__/public-supabase-config.test.mjs
import { requirePublicSupabaseConfig } from "../supabase/client.ts";

let failures = 0;

function check(label, condition) {
  if (condition) {
    console.log(`PASS: ${label}`);
  } else {
    console.error(`FAIL: ${label}`);
    failures += 1;
  }
}

function rejects(label, url, key, expectedMessage) {
  let message = "";
  try {
    requirePublicSupabaseConfig(url, key);
  } catch (error) {
    message = error instanceof Error ? error.message : String(error);
  }
  check(label, message.includes(expectedMessage));
}

const production = requirePublicSupabaseConfig(
  "https://project-ref.supabase.co",
  "sb_publishable_test",
);
check(
  "valid HTTPS project origin and publishable key are accepted",
  production.url === "https://project-ref.supabase.co"
    && production.anonKey === "sb_publishable_test",
);

const local = requirePublicSupabaseConfig(
  "http://localhost:54321",
  "local-anon-key",
);
check("local loopback HTTP remains available for development", local.url === "http://localhost:54321");

rejects("missing project URL fails closed", undefined, "key", "NEXT_PUBLIC_SUPABASE_URL");
rejects("malformed project URL fails closed", "not-a-url", "key", "valid absolute URL");
rejects("non-local HTTP project URL is rejected", "http://example.com", "key", "must use HTTPS");
rejects("credential-bearing project URL is rejected", "https://user:pass@example.com", "key", "must not contain credentials");
rejects("project URL paths are rejected", "https://example.com/rest/v1", "key", "only the project origin");
rejects("missing publishable key fails closed", "https://example.com", "", "NEXT_PUBLIC_SUPABASE_ANON_KEY");

if (failures > 0) process.exit(1);
