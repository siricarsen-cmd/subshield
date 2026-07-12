import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The official Next.js 16 syntax to protect the library from Turbopack.
  // tesseract.js/pdfjs-dist/@napi-rs/canvas all do dynamic, filesystem-relative
  // requires (worker scripts, native canvas bindings) that Turbopack/webpack
  // bundling breaks - keep them external so Node resolves them normally from
  // node_modules at runtime instead.
  serverExternalPackages: ['pdf-parse', 'tesseract.js', 'pdfjs-dist', '@napi-rs/canvas'],
  // pdf-parse's internal pdfjs-dist build requires("@napi-rs/canvas") dynamically
  // at runtime (for DOMMatrix/ImageData polyfills and PDF rendering/OCR support),
  // a pattern Vercel's static output file tracing (@vercel/nft) misses. Without
  // this, the package is present in node_modules but gets excluded from the
  // deployed function bundle, breaking PDF text extraction and OCR in production
  // even though it works locally. Force-include it for the one route that needs it.
  outputFileTracingIncludes: {
    '/api/analyze-contract': [
      './node_modules/@napi-rs/canvas/**/*',
      './node_modules/@napi-rs/canvas-linux-x64-gnu/**/*',
    ],
  },
};

export default nextConfig;