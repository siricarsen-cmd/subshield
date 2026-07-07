import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The official Next.js 16 syntax to protect the library from Turbopack.
  // tesseract.js/pdfjs-dist/@napi-rs/canvas all do dynamic, filesystem-relative
  // requires (worker scripts, native canvas bindings) that Turbopack/webpack
  // bundling breaks - keep them external so Node resolves them normally from
  // node_modules at runtime instead.
  serverExternalPackages: ['pdf-parse', 'tesseract.js', 'pdfjs-dist', '@napi-rs/canvas'],
};

export default nextConfig;