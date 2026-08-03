import { createRequire } from "node:module";
import { dirname, relative, sep } from "node:path";
import type { NextConfig } from "next";
import {
  BASELINE_SECURITY_HEADERS,
  GLOBAL_SECURITY_HEADER_SOURCE,
} from "./lib/security-headers";

const nodeRequire = createRequire(import.meta.url);

type PackageJson = {
  dependencies?: Record<string, string>;
};

function collectInstalledDependencyTracePatterns(rootPackage: string): string[] {
  const pending: Array<{ name: string; searchPath: string }> = [
    { name: rootPackage, searchPath: process.cwd() },
  ];
  const visitedPackageJsonPaths = new Set<string>();
  const packageDirectories = new Set<string>();

  while (pending.length > 0) {
    const current = pending.pop();
    if (!current) continue;

    const packageJsonPath = nodeRequire.resolve(`${current.name}/package.json`, {
      paths: [current.searchPath],
    });
    if (visitedPackageJsonPaths.has(packageJsonPath)) continue;

    visitedPackageJsonPaths.add(packageJsonPath);
    const packageDirectory = dirname(packageJsonPath);
    packageDirectories.add(packageDirectory);

    const packageJson = nodeRequire(packageJsonPath) as PackageJson;
    for (const dependencyName of Object.keys(packageJson.dependencies ?? {})) {
      pending.push({ name: dependencyName, searchPath: packageDirectory });
    }
  }

  return [...packageDirectories]
    .map((packageDirectory) => {
      const projectRelativePath = relative(process.cwd(), packageDirectory)
        .split(sep)
        .join("/");
      return `./${projectRelativePath}/**/*`;
    })
    .sort();
}

const tesseractRuntimeTracePatterns =
  collectInstalledDependencyTracePatterns("tesseract.js");

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
  serverExternalPackages: [
    "pdf-parse",
    "tesseract.js",
    "tesseract.js-core",
    "pdfjs-dist",
    "@napi-rs/canvas",
  ],
  // pdf-parse and tesseract.js both resolve runtime files dynamically. Vercel's
  // static output tracing cannot infer filesystem-relative worker entrypoints or
  // bare imports that execute only inside Tesseract's child worker. Trace the
  // complete installed production dependency closure rooted at tesseract.js so
  // packages such as bmp-js and any future transitive runtime dependencies are
  // deployed with the same Node module layout as the locked local installation.
  outputFileTracingIncludes: {
    "/api/analyze-contract": [
      "./node_modules/@napi-rs/canvas/**/*",
      "./node_modules/@napi-rs/canvas-linux-x64-gnu/**/*",
      "./node_modules/pdf-parse/node_modules/pdfjs-dist/legacy/build/*.mjs",
      ...tesseractRuntimeTracePatterns,
    ],
  },
};

export default nextConfig;
