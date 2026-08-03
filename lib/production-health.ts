import { resolveAppBaseUrl } from "./app-base-url";

export type ProductionHealthStatus = "ok" | "unavailable";

interface ProductionHealthEnvironment {
  VERCEL_ENV?: string;
  VERCEL_URL?: string;
  NEXT_PUBLIC_BASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  NEXT_PUBLIC_STRIPE_PRICE_SINGLE_REVIEW_CYCLE?: string;
  NEXT_PUBLIC_STRIPE_PRICE_ACTIVE_BIDDER_PLAN?: string;
  NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_PLAN?: string;
  OPENAI_API_KEY?: string;
  RESEND_API_KEY?: string;
  CONTACT_FROM_EMAIL?: string;
  CONTACT_TO_EMAIL?: string;
}

const PRODUCTION_ORIGIN = "https://www.subshield.net";

const REQUIRED_RUNTIME_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "NEXT_PUBLIC_STRIPE_PRICE_SINGLE_REVIEW_CYCLE",
  "NEXT_PUBLIC_STRIPE_PRICE_ACTIVE_BIDDER_PLAN",
  "NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_PLAN",
  "OPENAI_API_KEY",
  "RESEND_API_KEY",
  "CONTACT_FROM_EMAIL",
  "CONTACT_TO_EMAIL",
] as const satisfies readonly (keyof ProductionHealthEnvironment)[];

function hasConfiguredValue(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

export function getProductionHealthStatus(
  environment: ProductionHealthEnvironment = process.env as ProductionHealthEnvironment,
): ProductionHealthStatus {
  if (environment.VERCEL_ENV !== "production") {
    return "unavailable";
  }

  try {
    if (resolveAppBaseUrl(environment) !== PRODUCTION_ORIGIN) {
      return "unavailable";
    }
  } catch {
    return "unavailable";
  }

  if (
    REQUIRED_RUNTIME_KEYS.some(
      (key) => !hasConfiguredValue(environment[key]),
    )
  ) {
    return "unavailable";
  }

  return "ok";
}
