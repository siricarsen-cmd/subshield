// Focused fixture: the exact known-risk payment-contingency clause language
// from the Government Subcontract Package regression case (see
// fix/analyzer-regression-parity). Not a full contract - deterministic.ts's
// patterns only need a document that actually contains this exact wording;
// see deterministic.payment-contingency.test.mjs for the regression check
// that runs against it.
//
// Plain .mjs (not .ts) on purpose: tsconfig.json's "include" globs pick up
// **/*.ts and **/*.mts project-wide, and moduleResolution "bundler" rejects
// explicit ".ts" import specifiers (TS5097) unless allowImportingTsExtensions
// is enabled. Keeping this fixture and its regression script as plain ESM
// JavaScript keeps them out of the tsc project entirely, so the regression
// check can still import lib/analyzer/deterministic.ts directly (Node 24
// strips its types natively at runtime) without touching tsconfig.json.
export const PAYMENT_CONTINGENCY_CLAUSE = `
Section 6. Payment.

Prime Contractor will pay Subcontractor within 10 business days after Prime Contractor receives corresponding payment from the Government for Subcontractor's invoiced work. If the Government delays, disputes, reduces, rejects, or withholds payment to Prime Contractor, Prime Contractor may delay, reduce, or withhold payment to Subcontractor to the same extent. Prime Contractor has no obligation to pay Subcontractor for amounts not paid by the Government to Prime Contractor. Subcontractor must continue performance during any payment delay unless Prime Contractor provides written direction otherwise.
`.trim();

// Pre-existing "not received" phrasing that the original (7/6) pattern
// already covered - kept as a fixture so the broadened "not paid" pattern
// added in this fix can be proven not to have regressed the original case.
export const PAYMENT_CONTINGENCY_CLAUSE_NOT_RECEIVED_VARIANT = `
Prime Contractor shall have no obligation to pay Subcontractor for any amounts not received from the Government.
`.trim();
