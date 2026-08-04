# Temporary correction task

Apply the two unresolved P1 review corrections from PR #105 to the first-customer runbook, then delete this temporary file before the correction PR is ready to merge.

## Required corrections

1. **Handled OCR timeout/runtime failure**
   - Current `lib/analyzer/extract.ts` catches OCR timeout/runtime errors and returns extraction metadata that normally becomes a completed Limited Scan.
   - A completed Limited Scan consumes the credit.
   - Only an analyzer/processing failure that aborts without a completed report should restore the reserved credit.
   - Correct the decision guide, F2 procedure, OCR support template, same-day escalation examples, and warning-code explanation.
   - Preserve Carsen's authority to decide any goodwill replacement credit.

2. **Post-payment refund reconciliation**
   - A payment that never reached a successful paid state should not grant credits.
   - A payment that succeeded and was refunded later may already have granted pending or user credits.
   - The missing-credit procedure must continue reconciliation for a post-fulfillment refund and then follow Section H for the credit-adjustment decision.
   - Add post-refund credits not reconciled to the immediate billing examples.

## Exact intended wording and scope

Keep the change documentation-only and narrowly limited to:

- `payment-analyzer-and-billing.md`
- `privacy-support-and-escalation.md`
- `acceptance-monitoring-and-maintenance.md`

Do not change application code, tests, Stripe, Supabase, Vercel, pricing, or production configuration.

Before declaring the PR ready:

- remove this `CORRECTION_TASK.md` file;
- verify there is no remaining statement that an OCR warning alone proves credit restoration;
- verify a successful payment refunded later continues through credit reconciliation;
- request a fresh Codex review and wait for it to complete.