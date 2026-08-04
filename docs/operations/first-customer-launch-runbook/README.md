# SubShield First-Customer Launch Runbook

**Owner:** Carsen Siri  
**Purpose:** Safely operate SubShield through its first genuine customer purchase, credit grant, contract review, report delivery, support request, cancellation, refund decision, or deletion request.  
**Effective date:** August 3, 2026 (Pacific Time)  
**Validated production source:** `db578ccf6a6c3de820d2e4b9d4143dd34e07b615`  
**Validated production deployment:** `dpl_GFa3CKEFYL5QmxytRpXydXV2ESEV`  
**Production site:** `https://www.subshield.net`  
**Authoritative tracker:** GitHub issue #67, "Production launch acceptance and remaining readiness work"

> **Operating principle:** Do not read, copy, or expose a customer's contract merely to confirm that the system worked. Verify payment, credits, review status, extraction metadata, report availability, deletion status, and health signals without opening confidential contract content.

---

## How to use this runbook

Each procedure separates four kinds of work:

- **Carsen action:** What Carsen personally clicks, decides, or communicates.
- **Connected-system check:** A read-only check that ChatGPT can perform through Stripe, Supabase, Vercel, or GitHub.
- **Owner decision:** A commercial or customer-service judgment that only Carsen should make.
- **Technical escalation:** A situation that needs code, database, deployment, security, or incident-response review.

### The safest one-line request to send ChatGPT after a customer purchase

> Check the SubShield purchase for **[customer email]**. Verify the Stripe payment, plan, webhook delivery, Stripe credit event, pending or user credits, and operational health. Do not open or read any customer contract content and do not make any changes.

### Non-negotiable boundaries

1. Do not manually add credits until the original Stripe transaction and idempotency records are reconciled.
2. Do not ask for full card details, passwords, authentication tokens, API keys, or webhook secrets.
3. Do not paste customer contract text, contract excerpts, filenames, raw error traces, or payment identifiers into GitHub, public chats, or general support notes.
4. Do not call SubShield legal advice and do not tell a customer that a contract is "safe to sign."
5. Do not treat a valid Limited Scan as the same thing as a system failure.
6. Do not promise a refund before Carsen makes the commercial decision.
7. Do not delete billing, fulfillment, or security ledgers merely because a customer deletes a review.

---

# Current production baseline before the first genuine customer

This is the clean starting point. It will change after the first real purchase.

| Item | Baseline |
|---|---:|
| Stripe customers | 0 |
| Stripe subscriptions | 0 |
| Stripe invoices | 0 |
| Stripe PaymentIntents | 0 |
| Stripe charges | 0 |
| Stripe credit-event records | 0 |
| Pending-credit records | 0 |
| Stripe-related operational incidents | 0 |
| Carsen's SubShield credits | 8 |
| General health | `ok` |
| Operational health | `ok` |

**Current technical conclusion:** The payment, credit, analyzer, deletion, privacy, and monitoring controls already exist. No new code or infrastructure is required merely to serve the first customer.

---

# A. First-purchase immediate checklist

Use this during the first 15 to 30 minutes after the first genuine purchase.

## First 5 minutes - confirm the sale

### Carsen action

1. Open the Stripe Dashboard.
2. Open **Payments** for a Single Review Cycle or Enterprise Credit Pack purchase.
3. Open **Billing > Subscriptions** for an Active Bidder Plan purchase.
4. Confirm only these facts:
   - Customer purchase email
   - Plan purchased
   - Amount
   - Payment status
   - Date and time
5. Do not copy card details or full payment identifiers into your notes.

### Expected payment status

- One-time purchase: payment is **Succeeded**.
- Active Bidder initial purchase: subscription exists and its initial invoice is **Paid**.
- Active Bidder renewal: renewal invoice is **Paid**.

If the payment is pending, failed, incomplete, unpaid, or canceled, do not expect credits yet.

## Minutes 5 to 15 - confirm the webhook and credits

### Connected-system check

Ask ChatGPT to perform the one-line purchase check shown at the beginning of this runbook. The check should confirm:

1. The exact plan and expected credits.
2. The payment or invoice is genuinely paid.
3. The correct Stripe webhook event was sent.
4. The webhook returned a successful 2xx response.
5. Exactly one `stripe_credit_events` record exists for the Checkout Session or Invoice.
6. Credits went to either:
   - `pending_credits`, when the customer has not yet claimed them; or
   - `user_credits`, after the customer signs in with the matching verified email.
7. No critical Stripe operational incident was created.
8. `https://www.subshield.net/api/health/operations` still returns `{"status":"ok"}`.

### Important Active Bidder rule

The Active Bidder checkout-completed event does **not** grant credits. The initial and renewal credits come from the qualifying paid `invoice.paid` event. Do not mistake a successful subscription Checkout Session for the actual credit-grant event.

## Minutes 15 to 30 - confirm the customer can continue

### Carsen action

1. Confirm the customer is using or creating a SubShield account with the same email address used during purchase.
2. Ask the customer to sign in and refresh the Dashboard.
3. Confirm the expected credit balance appears.
4. If the credits were pending, confirm they were claimed after the verified same-email login.
5. Confirm the customer can upload or paste a package.
6. Do not ask the customer to send the contract by email merely so you can verify the system.

## Record a privacy-safe acceptance note

Record only:

- Date and time
- Plan
- Amount
- Payment status
- Expected credits
- Credits recorded
- Webhook successful: yes/no
- Credits direct or pending
- Account claim successful: yes/no
- Operational health: okay/problem
- Follow-up needed: yes/no

Do not record contract content, excerpts, filenames, full payment IDs, card details, passwords, tokens, keys, or raw error traces.

---

# B. Plan-specific expected results

| Scenario | Payment and amount | Credit event | Expected credit/database result | Subscription and Billing Portal |
|---|---|---|---|---|
| **Single Review Cycle** | One-time card payment, **$149.99** | `checkout.session.completed` | Exactly **1 credit**. One `stripe_credit_events` row with source type `checkout_session`. Credit is held in `pending_credits` until claimed, then appears in `user_credits`. | No subscription. Stripe Customer should exist. Billing Portal can open for the matching billing profile, but there is no subscription to cancel. |
| **Active Bidder - initial purchase** | Monthly subscription, **$249.00** | Qualifying paid `invoice.paid` | Exactly **3 credits** from the paid initial invoice. Subscription Checkout itself does not grant credits. One credit-event row with source type `invoice`. | Active subscription should exist. Billing Portal should show the subscription and allow cancellation at period end. |
| **Active Bidder - monthly renewal** | Paid renewal invoice, **$249.00** | Qualifying paid `invoice.paid` | Exactly **3 additional credits** once for that invoice. A retry must not grant again. | Existing subscription remains active unless scheduled to cancel. Portal remains available. |
| **Enterprise Credit Pack** | One-time card payment, **$1,999.00** | `checkout.session.completed` | Exactly **30 credits**. One credit-event row with source type `checkout_session`. Credit is held in `pending_credits` until claimed, then appears in `user_credits`. | No subscription. Stripe Customer should exist. Portal can open for the billing profile, but there is no subscription to cancel. |

## Expected idempotency result

A Stripe retry may deliver the same event again. SubShield should return an idempotent result and leave the customer's credit total unchanged after the original grant. Duplicate protection exists at both levels:

- Unique Stripe event ID
- Unique combination of source type and source ID

Never remove those records simply to make a retry "work."

---

# C. Existing-account versus new-account workflow

## Customer already has a SubShield account

1. The customer purchases with an email address.
2. Stripe sends the eligible event.
3. SubShield records the purchase in `stripe_credit_events` and places the credits in `pending_credits` for that normalized email.
4. When the verified customer signs in, the Dashboard calls the secure claim process.
5. Pending credits move into the customer's `user_credits` balance.
6. The pending record is removed.

### What Carsen should verify

- The account email and purchase email match, ignoring capitalization.
- The email is verified.
- The pending balance moved once.
- The final `user_credits` balance is correct.

## Customer purchased before creating an account

1. The payment still records normally.
2. Credits wait in `pending_credits` under the purchase email.
3. The customer creates an account using the same email address.
4. The customer verifies that email.
5. The customer signs in.
6. The Dashboard claims the pending credits and shows the new balance.

### If the email addresses do not match

Credits will not claim into a different account email. Do not move credits based only on an informal message.

**Carsen action:** Ask the customer to sign in or create the account using the same verified email used at checkout.

**Technical escalation:** If the customer cannot access the original email or an email correction is genuinely required, verify the paid transaction and account ownership first. Any administrative transfer must be documented and performed only after the original Stripe source and idempotency record are reconciled.

---

# D. Customer review workflow

## Normal customer journey

1. Purchase
2. Login or create account
3. Credits appear
4. Upload a PDF, DOCX, or TXT file, or paste contract text
5. One credit is reserved
6. Analysis runs
7. Report is created
8. Customer reviews or downloads the report
9. Customer may delete the review and stored contract file

## What to verify without reading contract content

### 1. Purchase

Verify plan, amount, status, purchase email, and expected credits in Stripe.

### 2. Login or account creation

Verify only that the account exists, the email is verified, and the email matches the purchase email. Do not request a password or login token.

### 3. Credits appear

Verify:

- `stripe_credit_events` contains exactly one eligible source record.
- `pending_credits` is correct before claim.
- `user_credits` is correct after claim.

### 4. Upload or paste

Verify only:

- The intake record exists.
- The customer owns it.
- The file type or paste method is supported.
- The review status is appropriate.

Do not open the stored file merely to confirm upload success.

### 5. Credit reservation

Expected behavior:

- One credit is deducted when processing begins.
- A duplicate request does not deduct another credit.
- An active processing reservation blocks deletion.
- A stale reservation has controlled restoration and retry behavior.

### 6. Analysis

Use sanitized metadata only, such as:

- Extraction method
- Page count
- File byte size
- Extracted character count
- OCR attempted: yes/no
- OCR outcome
- Processing duration
- HTTP status
- Limited Scan: yes/no

Do not collect document previews, document text, customer filenames, or raw exceptions in operating notes.

### 7. Report creation

Verify:

- Review status is **Review Ready**.
- A report result exists.
- The customer can access only their own report.
- A zero-credit customer can still open a report already purchased and generated.

### 8. Review or download

Ask the customer to confirm the report opens and the Attorney Prep Briefing download/print function works. You do not need to read the report.

### 9. Deletion

The customer can delete a completed review from the Dashboard using the guarded delete workflow. The stored contract file is removed. Billing and credit ledgers may remain as required for accounting, fulfillment, security, and transaction integrity.

---

**Continue:** [Payment, analyzer, cancellation, and refund procedures](payment-analyzer-and-billing.md).