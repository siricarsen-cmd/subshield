# E. Payment succeeded but credits are missing

Follow this sequence in order. Do not skip to a manual credit grant.

## Step 1 - verify that the payment truly succeeded

### One-time purchase

Confirm the PaymentIntent or payment shows **Succeeded** and the Checkout Session is completed.

### Subscription purchase or renewal

Confirm the relevant invoice shows **Paid**. An Active Bidder Checkout Session alone is not enough to grant credits.

If the payment or invoice never reached a successful paid state - for example, it is incomplete, unpaid, failed, pending, or was canceled before payment - stop; credits are not expected. If the payment succeeded and was later refunded, continue through the remaining reconciliation steps because credits may already have been granted, then follow Section H to reconcile the refund and credit outcome.

## Step 2 - identify the expected grant

- Single Review Cycle: 1 credit from `checkout.session.completed`
- Active Bidder initial invoice: 3 credits from `invoice.paid`
- Active Bidder renewal invoice: 3 credits from `invoice.paid`
- Enterprise Credit Pack: 30 credits from `checkout.session.completed`

## Step 3 - inspect Stripe webhook delivery

In Stripe:

1. Open **Developers > Webhooks**.
2. Open the live endpoint for `https://www.subshield.net/api/webhooks/stripe`.
3. Find the matching event by time and event type.
4. Check the latest response.

### If the response is 2xx

Continue to Steps 4 through 8. Do not resend automatically.

### If the response is 400

Look for a missing or invalid identity condition. The current implementation can reject a qualifying event when required customer email context is missing. Correct the identity problem and use a controlled resend only after technical review.

### If the response is 500

The event should remain retryable. Check operational incidents and fix the cause before resending. Do not manually add credits while Stripe may still retry.

## Step 4 - confirm the customer email

Compare:

- Stripe Checkout or invoice customer email
- SubShield account email
- Verified status of the SubShield email

The match is case-insensitive, but it must be the same email address.

## Step 5 - check `stripe_credit_events`

Expected result: one record for the eligible Checkout Session or Invoice.

- If a record exists, the underlying purchase was already processed. Do not create another grant.
- If no record exists and the webhook failed, investigate the failure and retry path.
- If no record exists despite a 2xx one-time event, escalate technically.
- For Active Bidder, confirm you are checking `invoice.paid`, not only `checkout.session.completed`.

## Step 6 - check pending credits

If the customer has not logged in with the matching verified email, the credits should normally be in `pending_credits`.

- If pending credits exist, ask the customer to use the same verified purchase email and sign in.
- Do not convert the balance manually unless the normal claim path is proven to be failing.

## Step 7 - check user credits

If the customer has already signed in with the matching verified email, verify the `user_credits` balance.

If the database balance is correct but the Dashboard looks stale:

1. Ask the customer to refresh.
2. Ask them to sign out and sign back in.
3. Ask them to click the Dashboard credit refresh/retry control if shown.

## Step 8 - check operational incidents

Check for current Stripe incident codes, especially:

- Webhook configuration failure
- Checkout missing email
- Checkout credit fulfillment failure
- Invoice lookup failure
- Invoice reconciliation required
- Invoice credit fulfillment failure
- Unexpected webhook failure

## Step 9 - check duplicate or retry state

A later Stripe delivery may show "idempotent" because the original purchase was already recorded. That is correct and must not add credits again.

## Step 10 - manual adjustment gate

Do not manually add or move credits until all of the following are known:

- Exact paid source type
- Exact plan and expected credits
- Whether a `stripe_credit_events` row exists
- Whether credits are pending or already in a user balance
- Whether Stripe is still retrying
- Whether a prior manual adjustment was already made

Any manual adjustment must be:

1. Authorized by Carsen.
2. Performed through a technical escalation, not ad hoc Dashboard editing.
3. Documented in a private, privacy-safe operational note.
4. Designed so a future webhook retry cannot double-credit the customer.

---

# F. Analyzer or OCR failure

## Decision guide

| Situation | System result | Credit result | Carsen response |
|---|---|---|---|
| Ordinary processing exception | Analysis does not complete; customer receives a generic failure message | Reserved credit should be restored automatically | Confirm restoration and ask customer to retry only after health is normal |
| Processing failure and restoration unconfirmed | Analysis does not complete | Credit restoration cannot be confirmed | Immediate technical escalation; tell customer not to retry yet |
| Handled OCR timeout or OCR runtime failure | OCR attempt fails or times out, but the review completes as a Limited Scan | Credit remains consumed because a report was completed | Explain the Limited Scan, check the OCR warning, and suggest a better source format; any goodwill replacement credit is Carsen's decision |
| Scanned PDF yields insufficient readable text but completes | Valid Limited Scan | Credit remains consumed because a completed report was produced | Explain limitations; suggest text PDF, DOCX, TXT, or pasted text for a new review |
| Garbled or insufficient input | Valid Limited Scan | Credit remains consumed if the report completed | Explain that readable evidence was insufficient; do not describe it as a system outage |
| Completed report with customer disagreement | Completed report | No automatic restoration | Acknowledge concern and escalate accuracy review without promising a legal outcome |

## F1. Ordinary analyzer failure

### Carsen action

1. Ask for the approximate date/time and the account email.
2. Ask whether the customer saw a message saying the credit was restored.
3. Do not ask for the contract text or file by email.
4. Tell the customer not to submit repeated retries if restoration was unconfirmed.

### Connected-system check

Verify:

- Review status
- Reservation status: reserved, completed, or refunded
- Credit balance before and after, when available
- Operational incident code
- Current health endpoint
- Current deployment warning/error logs

### Expected result

A processing exception should change the reservation to **refunded**, restore one credit, and set the review status to **Processing Failed**.

### Technical escalation

Escalate immediately if the reservation is still active, the review is stuck in Processing, or the credit restoration is unconfirmed.

## F2. OCR timeout or OCR runtime failure

### Carsen action

1. Confirm the document was a scanned/image-only PDF.
2. Ask the customer not to email the document.
3. Check the final review status before describing the credit outcome:
   - **Limited Scan / completed report:** the caught OCR timeout or failure degraded safely into a completed Limited Scan, so the credit remains consumed. Explain the limitation and do not promise restoration.
   - **Processing Failed / no completed report:** the analyzer aborted, so the reserved credit should be restored. Confirm the restoration before asking the customer to retry.
4. After confirming the status and current health, suggest one of these options:
   - Retry the scanned PDF once.
   - Export a text-based PDF.
   - Save as DOCX.
   - Upload TXT.
   - Paste the relevant contract text.
5. If the review completed as a Limited Scan, any goodwill replacement credit is a separate Carsen decision and is not automatic.

### Technical escalation

Escalate if the report status and reservation result conflict, multiple customers experience OCR timeouts, the same customer encounters the issue twice on a reasonable scan, or operational health is degraded by OCR incidents.

## F3. Scanned-PDF extraction failure

A scanned file may be readable to a person but unsuitable for OCR because of skew, low resolution, handwriting, faint text, stamps, overlapping images, or password protection.

If processing aborts, confirm credit restoration. If processing completes as Limited Scan, do not label it a system failure.

## F4. Garbled or insufficient document

A valid Limited Scan means SubShield could not obtain enough reliable text to make confident findings. It is intentionally fail-closed and must not show a confident clean result.

Recommended customer options:

- Upload the complete package, including referenced exhibits.
- Use a text-based PDF, DOCX, or TXT.
- Paste clean text.
- Remove password protection before upload.
- Rescan at better quality.

## F5. Limited Scan result

Explain:

- The review completed.
- The readable source material was too limited for a full grounded analysis.
- SubShield did not declare the contract clean or safe.
- A better source document requires a new review and another credit unless Carsen makes a separate goodwill decision.

**Owner decision:** Whether to provide a goodwill replacement credit is a commercial decision. It is not automatic and should be documented.

## F6. Customer believes findings are missing or incorrect

### Carsen action

1. Acknowledge the concern without debating the contract.
2. Ask for:
   - Account email
   - Review date/time
   - Report or review number
   - General description of the suspected issue
3. Tell the customer not to paste confidential contract text into ordinary email, GitHub, or public chat.
4. Do not promise that SubShield is legally correct or that the contract is safe.

### Connected-system check

First inspect only metadata:

- Input method
- Extraction method
- Extracted character count
- Page count
- Limited Scan or partial OCR indicator
- Finding count
- Processing status
- Grounding/quote-verification signals

### Technical escalation

Escalate when:

- A finding appears unsupported by the source.
- A clearly present clause may have been missed.
- The report contradicts the extraction status.
- Different formats of the same text produce materially different results.
- The report exposes another customer's information.

Only access customer content when it is genuinely necessary, the customer has authorized the review, and access is restricted to the minimum needed.

---

# G. Billing Portal and cancellation

## Customer instructions

1. Sign in to SubShield using the verified purchase email.
2. Open the Dashboard.
3. Click **Manage Billing**.
4. Stripe's secure Billing Portal opens.
5. For Active Bidder, choose the cancellation option.
6. Confirm cancellation at the end of the current billing period.

## What Carsen should verify

- The customer is signed in with the same billing email.
- Stripe has a matching Customer record.
- Active Bidder has a manageable subscription.
- Cancellation is scheduled at period end.
- No proration is expected under the current portal configuration.
- The customer can return to the SubShield Dashboard.

## Effect of cancellation

- Already-granted credits remain available.
- The subscription remains active through the paid period.
- No future renewal credits should be granted after the subscription ends because no future qualifying paid renewal invoice should occur.
- Cancellation is separate from a refund. Canceling does not automatically refund a prior charge.

## Multiple Stripe Customer records

SubShield searches matching Stripe Customers and prefers the Customer that owns a manageable subscription. A later one-time purchase should not hide an older active subscription.

If the Portal opens to the wrong profile or fails despite an active subscription, escalate technically. Do not merge or delete Stripe Customers casually.

## "No active billing profile found" message

Check in this order:

1. Customer is signed in with the purchase email.
2. Email is verified.
3. Stripe has a Customer with that email.
4. An Active Bidder subscription exists when cancellation is requested.
5. The subscription belongs to one of the matching Customer records.

If Stripe shows a valid subscription but the portal still fails, technical escalation is required.

---

# H. Refund procedure

SubShield does not currently have an automatic, blanket refund decision in this runbook. Carsen must decide each request based on the facts and the company's commercial policy.

## H1. Acknowledge without promising

Send the refund acknowledgment template in Section J. Do not say the refund is approved until Carsen decides.

## H2. Verify the transaction

Check:

- Plan
- Amount
- Date
- Payment status
- Purchase email
- Whether it was one-time or subscription
- Whether it has already been refunded, disputed, or duplicated

Do not request full card details.

## H3. Check product use

Before deciding, verify:

- Credits originally granted
- Credits currently remaining
- Whether a review credit was reserved
- Whether a report was generated
- Whether a generated report was accessed or downloaded, when available without opening content
- Whether the request arises from a confirmed system failure, valid Limited Scan, customer disagreement, duplicate purchase, or other reason

## H4. Carsen makes the commercial decision

Carsen decides:

- Approve or decline
- Full or partial refund
- Whether to cancel an Active Bidder subscription separately
- Whether unused credits should be removed
- How to handle any credits already used
- Whether to offer a goodwill credit instead of or in addition to a refund

Do not create a negative credit balance or claw back used reports without an explicit decision and technical review.

## H5. Process an approved refund in Stripe

### One-time purchase

Open the successful payment in Stripe and use the Refund action for the approved amount.

### Subscription charge

Open the paid invoice or associated payment and refund the approved amount. Then separately confirm whether the subscription should continue or be scheduled to cancel.

### Important separation

A Stripe refund does not automatically cancel a subscription. A subscription cancellation does not automatically refund a charge.

## H6. Reconcile SubShield credits after the refund

The current SubShield webhook listens for purchase and paid-invoice events, not refund events. A Stripe refund does **not** automatically remove SubShield credits.

Therefore:

1. Confirm the refund succeeded in Stripe.
2. Recheck whether credits were used.
3. Carsen decides the intended credit outcome.
4. Use a technical escalation for any balance adjustment.
5. Document the balance before and after.
6. Confirm no previous adjustment was made.
7. Do not alter or delete the original `stripe_credit_events` row; it is the historical fulfillment record and duplicate-credit protection.

## H7. Prevent double refund or double adjustment

Before taking action, confirm:

- Stripe refund status
- Total amount already refunded
- Whether a charge dispute exists
- Whether the subscription was separately canceled
- Whether a credit adjustment was already made
- Whether a goodwill credit was already granted

## H8. Privacy-safe refund record

Record:

- Date
- Plan
- Original amount
- Approved refund amount
- General reason category
- Credits originally granted
- Credits used
- Credits adjusted
- Subscription canceled: yes/no/not applicable
- Decision made by Carsen
- Follow-up completed: yes/no

Do not record card data, full payment IDs, contract content, passwords, tokens, or raw error traces.

---

**Continue:** [Privacy, support templates, and escalation matrix](privacy-support-and-escalation.md).
