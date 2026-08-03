import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { CreditDatabase } from "./credit-fulfillment";

interface ServerSupabaseEnvironment {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}

interface ServerSupabaseConfig {
  url: string;
  serviceRoleKey: string;
}

let cachedClient: SupabaseClient | undefined;
let cachedUrl: string | undefined;
let cachedServiceRoleKey: string | undefined;

export function requireServerCreditDatabaseEnv(
  environment: ServerSupabaseEnvironment = process.env as ServerSupabaseEnvironment,
): ServerSupabaseConfig {
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

export function getServerSupabaseClient(
  environment: ServerSupabaseEnvironment = process.env as ServerSupabaseEnvironment,
): SupabaseClient {
  const { url, serviceRoleKey } = requireServerCreditDatabaseEnv(environment);

  if (environment !== process.env) {
    return createClient(url, serviceRoleKey);
  }

  if (
    !cachedClient
    || cachedUrl !== url
    || cachedServiceRoleKey !== serviceRoleKey
  ) {
    cachedClient = createClient(url, serviceRoleKey);
    cachedUrl = url;
    cachedServiceRoleKey = serviceRoleKey;
  }

  return cachedClient;
}

export function getServerCreditDatabase(
  environment: ServerSupabaseEnvironment = process.env as ServerSupabaseEnvironment,
): CreditDatabase {
  return getServerSupabaseClient(environment) as unknown as CreditDatabase;
}
