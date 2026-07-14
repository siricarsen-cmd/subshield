// Focused credit-fulfillment regression checks. Run directly with Node 24:
// node --experimental-strip-types lib/__tests__/credit-fulfillment.test.mjs
import {
  claimCreditsAndGetBalance,
  fulfillCheckoutCredits,
} from "../credit-fulfillment.ts";
import {
  shouldFulfillCheckout,
  shouldFulfillSubscriptionInvoice,
} from "../stripe-credit-grants.ts";

let failures = 0;

function check(label, condition) {
  if (condition) {
    console.log(`PASS: ${label}`);
  } else {
    console.error(`FAIL: ${label}`);
    failures += 1;
  }
}

class MemoryCreditDatabase {
  pending = new Map();
  balances = new Map();
  eventIds = new Set();
  sourceIds = new Set();

  async rpc(functionName, params) {
    if (functionName === "fulfill_stripe_credits") {
      const sourceKey = `${params.p_source_type}:${params.p_source_id}`;
      if (this.eventIds.has(params.p_event_id) || this.sourceIds.has(sourceKey)) {
        return { data: false, error: null };
      }

      this.eventIds.add(params.p_event_id);
      this.sourceIds.add(sourceKey);
      const email = params.p_email.toLowerCase();
      this.pending.set(email, (this.pending.get(email) ?? 0) + params.p_credits);
      return { data: true, error: null };
    }

    if (functionName === "claim_pending_credits") {
      const email = params.p_email.toLowerCase();
      const pending = this.pending.get(email) ?? 0;
      if (pending > 0) {
        this.balances.set(params.p_user_id, (this.balances.get(params.p_user_id) ?? 0) + pending);
        this.pending.delete(email);
      }
      return { data: this.balances.get(params.p_user_id) ?? 0, error: null };
    }

    return { data: null, error: { message: "Unexpected RPC" } };
  }

  from(table) {
    if (table !== "user_credits") throw new Error("Unexpected table");
    return {
      select: () => ({
        eq: (_column, userId) => ({
          maybeSingle: async () => ({
            data: this.balances.has(userId) ? { credits: this.balances.get(userId) } : null,
            error: null,
          }),
        }),
      }),
    };
  }
}

const database = new MemoryCreditDatabase();
const email = "buyer@example.com";
const userId = "00000000-0000-0000-0000-000000000001";

check(
  "one completed checkout grants the configured credits",
  await fulfillCheckoutCredits(database, {
    eventId: "evt_1",
    sourceType: "checkout_session",
    sourceId: "cs_1",
    email,
    credits: 3,
  }) && database.pending.get(email) === 3
);

check(
  "duplicate delivery of the same Stripe event is a no-op",
  !(await fulfillCheckoutCredits(database, {
    eventId: "evt_1",
    sourceType: "checkout_session",
    sourceId: "cs_1",
    email,
    credits: 3,
  })) && database.pending.get(email) === 3
);

check(
  "duplicate delivery of the same checkout session is a no-op",
  !(await fulfillCheckoutCredits(database, {
    eventId: "evt_retry_with_new_id",
    sourceType: "checkout_session",
    sourceId: "cs_1",
    email,
    credits: 3,
  })) && database.pending.get(email) === 3
);

await fulfillCheckoutCredits(database, {
  eventId: "evt_2",
  sourceType: "checkout_session",
  sourceId: "cs_2",
  email,
  credits: 1,
});
check("two separate purchases accumulate", database.pending.get(email) === 4);

const passwordVisit = await claimCreditsAndGetBalance(database, { userId, email });
check("an authenticated dashboard visit claims pending credits", passwordVisit.credits === 4);

const repeatedVisit = await claimCreditsAndGetBalance(database, { userId, email });
check("a repeated dashboard visit does not claim twice", repeatedVisit.credits === 4);

await fulfillCheckoutCredits(database, {
  eventId: "evt_3",
  sourceType: "checkout_session",
  sourceId: "cs_3",
  email,
  credits: 3,
});
const magicLinkVisit = await claimCreditsAndGetBalance(database, { userId, email });
check(
  "magic-link and password sessions use the same dashboard claim result",
  magicLinkVisit.credits === 7
);

const legacyEmail = "legacy@example.com";
const legacyUserId = "00000000-0000-0000-0000-000000000002";
database.pending.set(legacyEmail, 30);
const legacyVisit = await claimCreditsAndGetBalance(database, {
  userId: legacyUserId,
  email: legacyEmail,
});
check("an existing legacy pending_credits row remains claimable", legacyVisit.credits === 30);

const activePriceId = "price_active_bidder";
check("initial subscription checkout is not fulfilled directly", !shouldFulfillCheckout("subscription"));
check(
  "initial paid subscription invoice is eligible for exactly one 3-credit grant",
  shouldFulfillSubscriptionInvoice({
    status: "paid",
    billingReason: "subscription_create",
    linePriceIds: [activePriceId],
    activeBidderPriceId: activePriceId,
  })
);

await fulfillCheckoutCredits(database, {
  eventId: "evt_invoice_initial",
  sourceType: "invoice",
  sourceId: "in_initial",
  email,
  credits: 3,
});
check("initial invoice does not double-grant checkout credits", database.pending.get(email) === 3);

check(
  "paid renewal invoice maps to the Active Bidder plan",
  shouldFulfillSubscriptionInvoice({
    status: "paid",
    billingReason: "subscription_cycle",
    linePriceIds: [activePriceId],
    activeBidderPriceId: activePriceId,
  })
);
await fulfillCheckoutCredits(database, {
  eventId: "evt_invoice_renewal",
  sourceType: "invoice",
  sourceId: "in_renewal",
  email,
  credits: 3,
});
check("separate paid renewal invoice adds 3 credits", database.pending.get(email) === 6);

check(
  "duplicate delivery of a renewal invoice is a no-op",
  !(await fulfillCheckoutCredits(database, {
    eventId: "evt_invoice_renewal_retry",
    sourceType: "invoice",
    sourceId: "in_renewal",
    email,
    credits: 3,
  })) && database.pending.get(email) === 6
);

check(
  "failed or unpaid invoices grant nothing",
  !shouldFulfillSubscriptionInvoice({
    status: "open",
    billingReason: "subscription_cycle",
    linePriceIds: [activePriceId],
    activeBidderPriceId: activePriceId,
  })
);

if (failures > 0) process.exit(1);
