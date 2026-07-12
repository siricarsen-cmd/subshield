// Test-only Node module resolution hook.
//
// Node 24's native TypeScript stripping erases type syntax but does not add
// TypeScript-style extensionless module resolution: a relative import like
// `from "./text"` inside a .ts file fails ERR_MODULE_NOT_FOUND under plain
// `node`, even though tsc/Next.js's "bundler" moduleResolution resolves it
// fine at build time. This is pre-existing (reproduces on this branch's
// parent commit, unmodified) and affects any .ts file with real relative
// imports - e.g. lib/analyzer/report.ts and lib/analyzer/sanity.ts, both of
// which the new report.ranking.test.mjs needs to import directly, the same
// way deterministic.payment-contingency.test.mjs already imports
// deterministic.ts (that file works unmodified today only because its one
// relative import, `from "./types"`, is type-only and gets erased before
// Node ever tries to resolve it).
//
// Adding explicit ".ts" extensions to the production import specifiers is
// not an option: tsconfig.json's moduleResolution "bundler" rejects explicit
// ".ts" specifiers (TS5097) unless allowImportingTsExtensions is enabled,
// which is out of scope for this change. This hook instead retries a failed
// relative-specifier resolution with ".ts" appended, at the module-loader
// level, so no production source file needs to change.
//
// Registered via: node --experimental-loader ./lib/analyzer/__tests__/ts-relative-import.loader.mjs <test file>
export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    if (err?.code === "ERR_MODULE_NOT_FOUND" && specifier.startsWith(".") && !specifier.endsWith(".ts")) {
      return nextResolve(`${specifier}.ts`, context);
    }
    throw err;
  }
}
