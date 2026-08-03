// Safe production-health contract checks. Run directly with Node 24:
// node --experimental-loader ./lib/analyzer/__tests__/ts-relative-import.loader.mjs lib/__tests__/production-health.test.mjs
import { getProductionHealthStatus } from "../production-health.ts";

let failures = 0;

function check(label, condition) {
  if (condition) {
    console.log(`PASS: ${label}`);
  } else {
    console.error(`FAIL: ${label}`);
    failures += 1;
  }
}

const healthyEnvironment = {
  VERCEL_ENV: "production",
  NEXT_PUBLIC_BASE_URL: "https://www.subshield.net",
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "ci-public-anon-key",
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "ci-service-role-key",
  STRIPE_SECRET_KEY: "sk_live_ci_placeholder",
  STRIPE_WEBHOOK_SECRET: "whsec_ci_placeholder",
  NEXT_PUBLIC_STRIPE_PRICE_SINGLE_REVIEW_CYCLE: "price_ci_single",
  NEXT_PUBLIC_STRIPE_PRICE_ACTIVE_BIDDER_PLAN: "price_ci_active",
  NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_PLAN: "price_ci_enterprise",
  OPENAI_API_KEY: "sk-ci-placeholder",
  RESEND_API_KEY: "re_ci_placeholder",
  CONTACT_FROM_EMAIL: "from@example.com",
  CONTACT_TO_EMAIL: "to@example.com",
};

check(
  "complete production runtime configuration reports ok",
  getProductionHealthStatus(healthyEnvironment) === "ok",
);

check(
  "a missing server secret fails closed",
  getProductionHealthStatus({
    ...healthyEnvironment,
    STRIPE_WEBHOOK_SECRET: undefined,
  }) === "unavailable",
);

check(
  "a whitespace-only runtime value fails closed",
  getProductionHealthStatus({
    ...healthyEnvironment,
    OPENAI_API_KEY: "   ",
  }) === "unavailable",
);

check(
  "a non-production deployment never reports healthy",
  getProductionHealthStatus({
    ...healthyEnvironment,
    VERCEL_ENV: "preview",
  }) === "unavailable",
);

check(
  "an unexpected production origin fails closed",
  getProductionHealthStatus({
    ...healthyEnvironment,
    NEXT_PUBLIC_BASE_URL: "https://subshield.example.com",
  }) === "unavailable",
);

const unavailableStatus = getProductionHealthStatus({
  ...healthyEnvironment,
  RESEND_API_KEY: undefined,
});
check(
  "unhealthy responses expose only a generic status",
  unavailableStatus === "unavailable"
    && !JSON.stringify({ status: unavailableStatus }).includes("RESEND"),
);

if (failures > 0) process.exit(1);
