# L. First-customer acceptance record

Complete this once for the first genuine customer. Store it privately with launch records.

## Transaction

- [ ] Date and time: ______________________________
- [ ] Plan: ______________________________________
- [ ] Amount: ____________________________________
- [ ] Payment status: _____________________________
- [ ] Expected credits: ___________________________
- [ ] Credits granted: ____________________________
- [ ] Webhook successful: Yes / No
- [ ] Credit-event record created once: Yes / No
- [ ] Credits direct or pending: __________________

## Account and claim

- [ ] Purchase email matched verified account email: Yes / No
- [ ] Pending-credit claim successful: Yes / No / Not needed
- [ ] Dashboard showed correct balance: Yes / No

## Review journey

- [ ] Upload or paste successful: Yes / No
- [ ] One credit reserved: Yes / No
- [ ] Analysis completed: Yes / No
- [ ] Report generated: Yes / No
- [ ] Customer could access report: Yes / No
- [ ] Download/print successful: Yes / No
- [ ] Duplicate request avoided duplicate charge: Yes / No / Not tested

## Operations and follow-up

- [ ] General health: Okay / Problem
- [ ] Operational health: Okay / Problem
- [ ] Critical incident created: Yes / No
- [ ] Customer support needed: Yes / No
- [ ] Follow-up needed: Yes / No
- [ ] Follow-up completed: Yes / No
- [ ] Acceptance result: Complete / Incomplete

## Privacy check

Confirm the acceptance record does **not** contain:

- [ ] Full customer contract
- [ ] Contract excerpt
- [ ] Customer contract filename
- [ ] Full card details
- [ ] Full payment identifier
- [ ] Password
- [ ] Authentication token
- [ ] API key or webhook secret
- [ ] Raw error trace

---

# M. Daily and weekly launch checks

The goal is reliable awareness, not constant dashboard watching.

## After each of the first five genuine transactions

Run the first-purchase checklist:

1. Payment status
2. Plan and expected credits
3. Correct webhook
4. Exactly one credit event
5. Pending or user credit result
6. Operational health
7. Privacy-safe acceptance note

Estimated owner time: 10 to 15 minutes when everything is normal.

## Daily during the soft launch

Perform once each business day, not continuously:

1. Check general health.
2. Check operational health.
3. Check Stripe for failed webhook deliveries or unpaid/problem invoices.
4. Check for new critical operational incident codes.
5. Review the support inbox for payment, credit, analysis, privacy, cancellation, or refund issues.
6. Confirm the current production deployment remains READY if a problem was reported.

Do not read customer contracts as part of the daily check.

## Weekly after the process stabilizes

1. Reconcile the number of genuine paid sources with `stripe_credit_events`.
2. Confirm no source was credited twice.
3. Review unresolved pending credits.
4. Review unresolved critical incidents.
5. Review refunds, cancellations, and manual credit adjustments.
6. Confirm no repeated OCR or analyzer failure pattern.
7. Confirm production health and deployment status.
8. Add a short privacy-safe note to issue #67 only for a meaningful operational milestone or unresolved launch risk.

## When to reduce heightened checks

After at least three successful genuine customer transactions and two consecutive weeks without an unresolved billing, credit, privacy, or production incident, reduce transaction-by-transaction owner review to exception-based monitoring plus the weekly reconciliation.

---

# N. Clear stopping point

The **first-customer operating acceptance** is complete when all of the following are true:

- [ ] A genuine payment succeeded.
- [ ] The correct plan and amount were recorded.
- [ ] The correct credits were granted exactly once.
- [ ] Credits went to the correct email and account.
- [ ] The customer accessed the credits.
- [ ] The customer submitted a review.
- [ ] One credit was reserved and consumed correctly.
- [ ] The analyzer produced a completed report, or a system failure correctly restored the credit.
- [ ] The customer could access and download the report.
- [ ] No duplicate credit or unexpected billing event occurred.
- [ ] Operational health remained normal, or a temporary issue was documented and resolved.
- [ ] Any customer support issue was resolved.
- [ ] The acceptance record contains no sensitive customer content or payment data.

If any item is incomplete, do not declare first-customer acceptance complete. Continue only the specific unresolved troubleshooting or escalation procedure.

---

# Quick-reference incident codes

## Warning-level examples

- `analyzer_processing_failed_credit_restored`
- `analyzer_ocr_timeout`
- `analyzer_ocr_failed`
- `delete_storage_cleanup_failed`

A warning can make operational health show degraded during the recent incident window even after the immediate cause is resolved. Confirm whether the incident is still recurring before declaring an outage. The `analyzer_ocr_timeout` and `analyzer_ocr_failed` warning codes indicate OCR degradation; they do not by themselves prove that a credit was restored. Check whether the review completed as a Limited Scan or ended as Processing Failed before describing the credit result.

## Critical examples

- `analyzer_credit_reservation_failed`
- `analyzer_processing_failed_credit_unconfirmed`
- `analyzer_unexpected_failure`
- `stripe_webhook_configuration_failed`
- `stripe_webhook_unexpected_failure`
- `stripe_checkout_missing_email`
- `stripe_checkout_credit_fulfillment_failed`
- `stripe_invoice_lookup_failed`
- `stripe_invoice_reconciliation_required`
- `stripe_invoice_credit_fulfillment_failed`
- `delete_lock_failed`
- `delete_state_restore_failed`
- `delete_finalize_failed`
- `delete_unexpected_failure`

A recent critical incident requires prompt technical review even if the public site is still reachable.

---

# Owner decision register

These decisions must not be made silently by software or a technical reviewer:

1. Approve, decline, or partially approve a refund.
2. Offer a goodwill replacement credit after a valid Limited Scan or customer dissatisfaction.
3. Remove or preserve unused credits after a refund.
4. Decide how to handle credits already used before a refund.
5. Pause promotion or sales because of a repeated billing issue.
6. Authorize minimum-necessary access to customer content for an accuracy investigation.
7. Change pricing, plan structure, tax collection, or refund policy.

---

# Technical escalation request template

Use this in a private project chat or restricted engineering issue. Do not include contract content.

> Investigate a SubShield production issue using connected systems.  
> **Category:** [billing / credits / analyzer / OCR / deletion / privacy / outage]  
> **Customer account email:** [email]  
> **Approximate time:** [Pacific time]  
> **Plan or review number:** [plan or review number]  
> **Observed behavior:** [brief factual description]  
> **Customer-visible message:** [generic message, with secrets removed]  
> **Required checks:** Stripe status and webhook, credit event, pending/user credits, reservation status, operational incidents, current Vercel deployment and sanitized logs.  
> **Privacy boundary:** Do not open or copy customer contract content unless a later, explicit authorization establishes that it is necessary.

---

# Runbook maintenance

Update this runbook when any of the following changes:

- Plan name, price, or credit quantity
- Stripe event used for fulfillment
- Billing Portal cancellation behavior
- Refund automation or policy
- Credit-claim workflow
- Analyzer failure or restoration behavior
- Supported document formats
- Deletion or retention behavior
- Operational incident codes or health window
- Production domain, Supabase project, or Stripe account

Routine content marketing, blog planning, YouTube planning, and regulatory expansion are outside this runbook.

---

[Return to the runbook overview](README.md).
