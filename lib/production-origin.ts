export const SUBSHIELD_PRODUCTION_ORIGIN = "https://www.subshield.net";
export const SUBPRECHECK_PRODUCTION_ORIGIN = "https://www.subprecheck.com";

export const APPROVED_PRODUCTION_ORIGINS = [
  SUBSHIELD_PRODUCTION_ORIGIN,
  SUBPRECHECK_PRODUCTION_ORIGIN,
] as const;

export type ApprovedProductionOrigin =
  (typeof APPROVED_PRODUCTION_ORIGINS)[number];

interface ProductionOriginEnvironment {
  VERCEL_ENV?: string;
  NEXT_PUBLIC_BASE_URL?: string;
}

export function isApprovedProductionOrigin(
  origin: string,
): origin is ApprovedProductionOrigin {
  return (APPROVED_PRODUCTION_ORIGINS as readonly string[]).includes(origin);
}

function parseConfiguredOrigin(rawUrl: string): string | null {
  let url: URL;

  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  if (url.protocol !== "https:" || url.username || url.password) {
    return null;
  }

  return url.origin;
}

export function resolveCanonicalProductionOrigin(
  environment: ProductionOriginEnvironment = process.env as ProductionOriginEnvironment,
): ApprovedProductionOrigin {
  const configuredBaseUrl = environment.NEXT_PUBLIC_BASE_URL?.trim();

  if (configuredBaseUrl) {
    const configuredOrigin = parseConfiguredOrigin(configuredBaseUrl);

    if (
      configuredOrigin
      && isApprovedProductionOrigin(configuredOrigin)
    ) {
      return configuredOrigin;
    }

    if (environment.VERCEL_ENV === "production") {
      throw new Error(
        "NEXT_PUBLIC_BASE_URL must be a valid approved HTTPS production origin without credentials.",
      );
    }
  }

  if (environment.VERCEL_ENV === "production") {
    throw new Error(
      "Missing required environment variable: NEXT_PUBLIC_BASE_URL for production.",
    );
  }

  // Preserve today's SubShield canonical on local/CI/Preview contexts that do not
  // explicitly provide NEXT_PUBLIC_BASE_URL. The production cutover occurs only
  // when Vercel is deliberately switched to the approved SubPreCheck origin.
  return SUBSHIELD_PRODUCTION_ORIGIN;
}
