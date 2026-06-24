import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The official Next.js 16 syntax to protect the library from Turbopack
  serverExternalPackages: ['pdf-parse'],
};

export default nextConfig;