interface AppBaseUrlEnvironment {
  NEXT_PUBLIC_BASE_URL?: string;
  VERCEL_ENV?: string;
  VERCEL_URL?: string;
}

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

function normalizeAppOrigin(
  rawUrl: string,
  environment: AppBaseUrlEnvironment,
  variableName: string,
): string {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error(`${variableName} must be a valid absolute URL.`);
  }

  if (url.username || url.password) {
    throw new Error(`${variableName} must not contain credentials.`);
  }

  if (url.protocol === "https:") {
    return url.origin;
  }

  const isLocalDevelopmentUrl =
    url.protocol === "http:"
    && environment.VERCEL_ENV !== "production"
    && LOOPBACK_HOSTS.has(url.hostname);

  if (isLocalDevelopmentUrl) {
    return url.origin;
  }

  throw new Error(
    `${variableName} must use HTTPS, except for an explicitly configured local loopback URL.`,
  );
}

export function resolveAppBaseUrl(
  environment: AppBaseUrlEnvironment = process.env,
): string {
  const configuredBaseUrl = environment.NEXT_PUBLIC_BASE_URL?.trim();

  if (environment.VERCEL_ENV === "production") {
    if (!configuredBaseUrl) {
      throw new Error(
        "Missing required environment variable: NEXT_PUBLIC_BASE_URL for production.",
      );
    }

    return normalizeAppOrigin(
      configuredBaseUrl,
      environment,
      "NEXT_PUBLIC_BASE_URL",
    );
  }

  if (configuredBaseUrl) {
    return normalizeAppOrigin(
      configuredBaseUrl,
      environment,
      "NEXT_PUBLIC_BASE_URL",
    );
  }

  if (environment.VERCEL_ENV === "preview") {
    const vercelHost = environment.VERCEL_URL?.trim();
    if (!vercelHost) {
      throw new Error(
        "Missing VERCEL_URL for a Preview deployment without NEXT_PUBLIC_BASE_URL.",
      );
    }

    if (vercelHost.includes("://")) {
      throw new Error("VERCEL_URL must be a hostname without a URL scheme.");
    }

    const previewOrigin = normalizeAppOrigin(
      `https://${vercelHost}`,
      environment,
      "VERCEL_URL",
    );
    const parsedPreviewOrigin = new URL(previewOrigin);

    if (parsedPreviewOrigin.host !== vercelHost) {
      throw new Error("VERCEL_URL must contain only a valid hostname and optional port.");
    }

    return previewOrigin;
  }

  throw new Error(
    "Missing required environment variable: NEXT_PUBLIC_BASE_URL. Configure it explicitly for local development.",
  );
}
