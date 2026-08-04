# I. Review deletion and customer privacy

## Customer deletion steps

1. Sign in to the SubShield Dashboard.
2. Locate the completed review.
3. Click the delete/trash control.
4. Read the warning.
5. Type `DELETE` exactly.
6. Confirm deletion.

## Expected result

- The system verifies the customer owns the review.
- Deletion is blocked while analysis is actively processing.
- The stored contract file is removed from the private `contracts` storage area.
- The customer-facing audit/report record is deleted.
- If storage cleanup fails, the review is retained or left in a controlled deletion-pending state for safe retry.
- Billing, credit reservation, fulfillment, accounting, transaction, security, and diagnostic records may remain where required.

## What Carsen should access

Normally access only:

- Account email
- Review number
- Review status
- Deletion status
- Whether a storage object exists
- Whether an operational incident was recorded

Do not access or copy:

- Contract text
- Contract excerpts
- Customer filenames
- AI report content
- Storage paths in ordinary support notes
- Authentication data

## Customer privacy explanation

SubShield lets the customer remove the customer-facing review and stored contract file. Limited records may remain for billing, credit fulfillment, accounting, security, fraud prevention, transaction integrity, and diagnostics. Those retained records should not contain the customer's contract text.

## Never paste into support tickets, GitHub issues, or public chats

- Full contract or solicitation package
- Contract excerpts
- Customer contract filename
- Stored document path
- Full customer payment identifier
- Full card information
- Password
- Authentication token
- API key or webhook secret
- Raw stack trace containing sensitive values

---

# J. Support-response templates

Replace bracketed placeholders. Keep the customer's contract out of ordinary email.

## 1. Payment received; credits are being checked

**Subject:** SubShield payment and credit check

Hello [Customer Name],

Thank you for contacting SubShield. I can see that you reported a completed purchase, and I am checking the payment, credit fulfillment, and account-email match now.

Please do not send card details, passwords, or your contract by email. I will update you as soon as the credit check is complete.

Regards,  
Carsen  
SubShield

## 2. Credits restored after a processing failure

**Subject:** Your SubShield credit was restored

Hello [Customer Name],

The review did not complete successfully, and the reserved review credit has been restored to your SubShield account.

Please sign in and refresh the Dashboard to confirm the balance. You may retry after [the service is confirmed healthy / using the recommended document format]. Please do not email the contract to us.

Regards,  
Carsen  
SubShield

## 3. Customer needs to use the same purchase email

**Subject:** Use your purchase email to claim SubShield credits

Hello [Customer Name],

Your purchase is associated with **[purchase email]**. Please create or access your SubShield account using that same email address, verify the email, and then sign in. The Dashboard will claim any waiting credits for that verified address.

For security, credits cannot be claimed automatically by a different account email. Please do not send passwords or login codes.

Regards,  
Carsen  
SubShield

## 4. OCR or scanned-document problem

**Subject:** SubShield scanned-document issue

Hello [Customer Name],

SubShield had difficulty reading the scanned PDF. I am checking whether the review completed as a Limited Scan or ended as a processing failure, because those outcomes have different credit results.

Please do not email the contract. If the review completed as a Limited Scan, the credit remains consumed; if processing failed without a completed report, the reserved credit should be restored. I will confirm the result before advising you to retry. The best alternatives may be a text-based PDF, DOCX, TXT file, pasted contract text, or a clearer rescan.

Regards,  
Carsen  
SubShield

## 5. Limited Scan explanation

**Subject:** Explanation of your SubShield Limited Scan

Hello [Customer Name],

Your review completed as a **Limited Scan** because SubShield could not obtain enough reliable, readable text for a full grounded analysis. A Limited Scan does not mean the contract is clean or safe to sign.

For a fuller review, use a complete text-based PDF, DOCX, TXT file, or clean pasted text, including referenced exhibits when available. A new document submission is a new review.

Regards,  
Carsen  
SubShield

## 6. Subscription cancellation instructions

**Subject:** How to cancel the Active Bidder Plan

Hello [Customer Name],

Sign in to SubShield with the same verified email used for the purchase, open the Dashboard, and click **Manage Billing**. Stripe's secure Billing Portal will let you schedule cancellation at the end of the current billing period.

Already-granted SubShield credits remain available. Cancellation stops future renewals after the paid period ends. It does not automatically refund a prior charge.

Regards,  
Carsen  
SubShield

## 7. Refund request acknowledgment

**Subject:** SubShield refund request received

Hello [Customer Name],

I received your refund request and am reviewing the payment, plan, credit use, and review status. This message confirms receipt of the request; it is not yet a refund approval.

Please do not send card details or your contract. I will respond after the transaction and account records have been reviewed.

Regards,  
Carsen  
SubShield

## 8. Review deletion instructions

**Subject:** How to delete a SubShield review

Hello [Customer Name],

Sign in to the SubShield Dashboard, locate the review, select the delete/trash control, type `DELETE`, and confirm.

For a completed review, this removes the customer-facing review record and stored contract file. Limited billing, transaction, credit, security, and diagnostic records may remain where required, but they should not contain the contract text.

Regards,  
Carsen  
SubShield

## 9. Technical issue escalated

**Subject:** Your SubShield issue has been escalated

Hello [Customer Name],

I have escalated the issue for technical review. The review is focused on the account, processing status, and system records. Please do not send your contract, card details, password, or login codes by email.

I will update you when the technical check is complete or if a specific, secure next step is required.

Regards,  
Carsen  
SubShield

## 10. Issue resolved

**Subject:** SubShield issue resolved

Hello [Customer Name],

The issue has been resolved. **[Briefly state the result: credits are now visible / the credit was restored / billing access is working / deletion completed].**

Please sign in and refresh the Dashboard to confirm. Contact us again if the result does not appear as expected.

Regards,  
Carsen  
SubShield

---

# K. Escalation matrix

## K1. Normal support question

**Examples:** How to upload, how to use the same purchase email, where to find Manage Billing, how to delete a review.

- **Carsen action:** Use the appropriate template and provide the exact customer steps.
- **Evidence to gather:** Account email, general question, approximate date/time.
- **Do not gather:** Contract, card details, password, tokens.
- **Site availability:** Leave the site fully available.
- **Technical response:** Not normally required.

## K2. Same-day investigation

**Examples:** Credit delay, Limited Scan confusion, an isolated OCR warning needing status confirmation, stale Dashboard balance, or a finding dispute without a privacy risk.

- **Carsen action:** Acknowledge, gather privacy-safe metadata, and request connected-system checks.
- **Evidence to gather:** Account email, plan, event time, review number, general symptom, screenshots with sensitive details removed.
- **Do not gather:** Contract text, customer filename, raw stack trace, card information.
- **Site availability:** Leave the site available.
- **Technical response:** Required if the normal refresh, claim, or retry path does not resolve the issue.

## K3. Immediate billing problem

**Examples:** Charge with no credits, duplicate charge, paid Active Bidder invoice with no three-credit grant, post-refund credits not reconciled, Billing Portal failure, or duplicate refund.

- **Carsen action:** Acknowledge immediately, stop any manual credit action, and run the strict payment/credit reconciliation.
- **Evidence to gather:** Purchase email, plan, amount, payment status, event type, webhook response code, credit-event existence, pending/user balance.
- **Do not gather:** Full payment ID in public notes, card details, contract content.
- **Site availability:** Usually leave the site available, but stop promoting new purchases if the same problem affects multiple customers.
- **Technical response:** Immediate. Consider temporarily pausing the affected purchase path only if the problem is repeated or systemic.

## K4. Privacy or security concern

**Examples:** Customer can access another customer's report, deletion says complete but the file remains, customer data appears in logs, unauthorized account or billing access, suspected credential exposure.

- **Carsen action:** Stop ordinary troubleshooting, preserve privacy-safe evidence, do not discuss details publicly, and escalate immediately.
- **Evidence to gather:** Time, affected account, route/page, sanitized screenshot, exact observed behavior, whether exposure is ongoing.
- **Do not gather:** Copy of exposed contract, secrets, tokens, full customer data, unnecessary screenshots of confidential content.
- **Site availability:** Keep unaffected public pages available. Disable or restrict the affected function only through a controlled technical incident response when necessary.
- **Technical response:** Immediate security/privacy incident review.

## K5. Production outage

**Examples:** Site unavailable, general health endpoint unavailable, widespread login failure, widespread Checkout failure, analyzer fails for multiple customers, operational health is degraded with active critical incidents.

- **Carsen action:** Stop asking customers to retry, post only a factual support response, and escalate immediately.
- **Evidence to gather:** Start time, affected functions, health results, status codes, current deployment, sanitized error clusters.
- **Do not gather:** Customer contract content or raw secrets.
- **Site availability:** Leave any functioning public information pages available. Do not redeploy or change production casually during an active incident.
- **Technical response:** Immediate incident response and controlled recovery.

---

**Continue:** [Acceptance record, launch checks, stopping point, and maintenance](acceptance-monitoring-and-maintenance.md).
