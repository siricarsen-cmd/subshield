import { createClient } from "@supabase/supabase-js";
import type { CreditDatabase } from "./credit-fulfillment";

type StripeWebhookDatabaseEnvironment = Pick<
  NodeJS.ProcessEnv,
  "SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY"
>;

interface StripeWebhookDatabaseConfig {
  url: string;
  serviceRoleKey: string;
}

let cachedDatabase: CreditDatabase | undefined;
let cachedUrl: string | undefined;
let cachedServiceRoleKey: string | undefined;

export function requireStripeWebhookDatabaseEnv(
  environment: StripeWebhookDatabaseEnvironment = process.env,
): StripeWebhookDatabaseConfig {
  const url = environment.SUPABASE_URL?.trim();
  if (!url) {
    throw new Error("Missing required environment variable: SUPABASE_URL.");
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error("SUPABASE_URL must be a valid absolute URL.");
  }

  if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
    throw new Error("SUPABASE_URL must use HTTP or HTTPS.");
  }

  const serviceRoleKey = environment.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceRoleKey) {
    throw new Error(
      "Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return { url: parsedUrl.origin, serviceRoleKey };
}

export function getStripeWebhookCreditDatabase(
  environment: StripeWebhookDatabaseEnvironment = process.env,
): CreditDatabase {
  const { url, serviceRoleKey } = requireStripeWebhookDatabaseEnv(environment);

  if (environment !== process.env) {
    return createClient(url, serviceRoleKey) as unknown as CreditDatabase;
  }

  if (
    !cachedDatabase
    || cachedUrl !== url
    || cachedServiceRoleKey !== serviceRoleKey
  ) {
    cachedDatabase = createClient(url, serviceRoleKey) as unknown as CreditDatabase;
    cachedUrl = url;
    cachedServiceRoleKey = serviceRoleKey;
  }

  return cachedDatabase;
}
