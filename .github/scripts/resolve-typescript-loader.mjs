// Minimal ESM resolver used only by repository benchmark scripts.
// The production Next.js build already resolves extensionless TypeScript imports,
// while plain Node.js ESM does not. Keep this narrow: only relative/absolute local
// specifiers with no extension may receive a TypeScript or module suffix.

const LOCAL_SPECIFIER_RE = /^(?:\.{1,2}\/|\/)/;
const EXPLICIT_EXTENSION_RE = /\.[a-z0-9]+$/i;
const CANDIDATE_SUFFIXES = [".ts", ".tsx", ".mjs", "/index.ts", "/index.mjs"];

export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (originalError) {
    if (
      originalError?.code !== "ERR_MODULE_NOT_FOUND" ||
      !LOCAL_SPECIFIER_RE.test(specifier) ||
      EXPLICIT_EXTENSION_RE.test(specifier)
    ) {
      throw originalError;
    }

    for (const suffix of CANDIDATE_SUFFIXES) {
      try {
        return await nextResolve(`${specifier}${suffix}`, context);
      } catch (candidateError) {
        if (candidateError?.code !== "ERR_MODULE_NOT_FOUND") {
          throw candidateError;
        }
      }
    }

    throw originalError;
  }
}
