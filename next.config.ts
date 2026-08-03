import type { NextConfig } from "next";
import {
  BASELINE_SECURITY_HEADERS,
  GLOBAL_SECURITY_HEADER_SOURCE,
} from "./lib/security-headers";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: GLOBAL_SECURITY_HEADER_SOURCE,
        headers: BASELINE_SECURITY_HEADERS.map((header) => ({ ...header })),
      },
    ];
  },
  // The official Next.js 16 syntax to protect the libraries from Turbopack.
  // tesseract.js/pdfjs-dist/@napi-rs/canvas all do dynamic, filesystem-relative
  // requires (worker scripts, WASM/core selection, native canvas bindings) that
  // Turbopack/webpack bundling breaks - keep them external so Node resolves them
  // normally from node_modules at runtime instead.
  serverExternalPackages: ['pdf-parse', 'tesseract.js', 'tesseract.js-core', 'pdfjs-dist', '@napi-rs/canvas'],
  // pdf-parse and tesseract.js both resolve runtime files dynamically. Vercel's
  // static output tracing cannot infer every filesystem-relative require:
  // - pdf-parse needs the native canvas package and its Linux binding;
  // - tesseract.js launches src/worker-script/node/index.js, which requires its
  //   parent worker module at runtime, and then selects a tesseract.js-core build.
  // Force-include the complete runtime trees for the analyzer route so the
  // deployed worker sees the same package layout as local Node.
  outputFileTracingIncludes: {
    '/api/analyze-contract': [
      './node_modules/@napi-rs/canvas/**/*',
      './node_modules/@napi-rs/canvas-linux-x64-gnu/**/*',
      './node_modules/pdf-parse/node_modules/pdfjs-dist/legacy/build/*.mjs',
      './node_modules/tesseract.js/**/*',
      './node_modules/tesseract.js-core/**/*',
    ],
  },
};

export default nextConfig;
