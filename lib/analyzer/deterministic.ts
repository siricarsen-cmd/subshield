// Public deterministic scanner wrapper. The pre-Ironclad scanner is preserved
// byte-for-byte in deterministic-core.ts; explicit construction/supply/compliance
// fallbacks are appended here so existing detector behavior remains unchanged.

import { runDeterministicDetectors as runDeterministicDetectorsCore } from "./deterministic-core";
import { runComplianceCoverageDetectors } from "./compliance-coverage";
import type { Finding } from "./types";

export * from "./deterministic-core";

export function runDeterministicDetectors(documentText: string): Finding[] {
  return [
    ...runDeterministicDetectorsCore(documentText),
    ...runComplianceCoverageDetectors(documentText),
  ];
}
