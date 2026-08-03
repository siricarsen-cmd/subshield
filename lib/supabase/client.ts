import { createClient as createSupabaseClient } from "@supabase/supabase-js";

interface PublicSupabaseConfig {
  url: string;
  anonKey: string;
}

const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const configuredAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function requirePublicSupabaseConfig(
  urlValue: string | undefined = configuredUrl,
  anonKeyValue: string | undefined = configuredAnonKey,
): PublicSupabaseConfig {
  const rawUrl = urlValue?.trim();
  if (!rawUrl) {
    throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL.");
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must be a valid absolute URL.");
  }

  if (parsedUrl.username || parsedUrl.password) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must not contain credentials.");
  }

  const isSecure = parsedUrl.protocol === "https:";
  const isLocalDevelopment =
    parsedUrl.protocol === "http:" && LOOPBACK_HOSTS.has(parsedUrl.hostname);
  if (!isSecure && !isLocalDevelopment) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL must use HTTPS, except for a local loopback URL.",
    );
  }

  if (
    parsedUrl.pathname !== "/"
    || parsedUrl.search
    || parsedUrl.hash
  ) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must contain only the project origin.");
  }

  const anonKey = anonKeyValue?.trim();
  if (!anonKey) {
    throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  return { url: parsedUrl.origin, anonKey };
}

export function createClient() {
  const { url, anonKey } = requirePublicSupabaseConfig();
  return createSupabaseClient(url, anonKey);
}
