export const GLOBAL_SECURITY_HEADER_SOURCE = "/:path*";

export const BASELINE_SECURITY_HEADERS = [
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
    // Vercel currently supplies this exact two-year HSTS policy. Keep it
    // explicit because defining application headers must not weaken it.
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
] as const;
