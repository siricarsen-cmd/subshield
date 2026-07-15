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
import { CheckoutRequestError, createAllowedCheckoutSession } from "../checkout-session.ts";
import { resolveSubscriptionInvoiceGrant } from "../stripe-subscription-invoice.ts";

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
    subscriptionStatus: "active",
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
    subscriptionStatus: "active",
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
    subscriptionStatus: "active",
  })
);

const configuredPlans = [
  { envVar: "SINGLE", priceId: "price_single", mode: "payment", credits: 1 },
  { envVar: "ACTIVE", priceId: activePriceId, mode: "subscription", credits: 3 },
  { envVar: "ENTERPRISE", priceId: "price_enterprise", mode: "payment", credits: 30 },
];
const checkoutCalls = [];
const checkoutClient = {
  checkout: {
    sessions: {
      async create(params) {
        checkoutCalls.push(params);
        return { url: "https://checkout.example.test" };
      },
    },
  },
};
for (const plan of configuredPlans) {
  const before = checkoutCalls.length;
  await createAllowedCheckoutSession(
    checkoutClient,
    { priceId: plan.priceId, userId, baseUrl: "https://www.subshield.net" },
    configuredPlans,
  );
  check(
    `configured ${plan.envVar} price is accepted with ${plan.mode} mode`,
    checkoutCalls.length === before + 1 && checkoutCalls.at(-1).mode === plan.mode,
  );
}

for (const [label, rejectedPrice] of [["missing", undefined], ["unknown/stale", "price_stale"]]) {
  const before = checkoutCalls.length;
  let rejected = false;
  try {
    await createAllowedCheckoutSession(
      checkoutClient,
      { priceId: rejectedPrice, baseUrl: "https://www.subshield.net" },
      configuredPlans,
    );
  } catch (error) {
    rejected = error instanceof CheckoutRequestError && error.status === 400;
  }
  check(`${label} checkout price is rejected before Stripe session creation`, rejected && checkoutCalls.length === before);
}

function lineItems(priceIds) {
  return {
    async *[Symbol.asyncIterator]() {
      for (const priceId of priceIds) {
        yield { pricing: { price_details: { price: priceId } } };
      }
    },
  };
}

function invoice(overrides = {}) {
  return {
    id: "in_test",
    status: "paid",
    billing_reason: "subscription_cycle",
    customer_email: "subscriber@example.com",
    customer: "cus_test",
    parent: { subscription_details: { subscription: "sub_test" } },
    ...overrides,
  };
}

function subscriptionStripe({
  prices = ["price_unrelated", activePriceId],
  subscriptionStatus = "active",
  customerEmail = "customer@example.com",
  subscriptionError,
} = {}) {
  return {
    invoices: { listLineItems: () => lineItems(prices) },
    subscriptions: {
      async retrieve() {
        if (subscriptionError) throw subscriptionError;
        return { id: "sub_test", status: subscriptionStatus };
      },
    },
    customers: {
      async retrieve() {
        return { id: "cus_test", deleted: false, email: customerEmail };
      },
    },
  };
}

const activePlan = configuredPlans[1];
const initialGrant = await resolveSubscriptionInvoiceGrant(
  subscriptionStripe(),
  invoice({ billing_reason: "subscription_create" }),
  activePlan,
);
check("active initial subscription invoice grants 3", initialGrant?.credits === 3);

const renewalGrant = await resolveSubscriptionInvoiceGrant(subscriptionStripe(), invoice(), activePlan);
check("active renewal invoice grants 3 and scans all invoice lines", renewalGrant?.credits === 3);

const expandedGrant = await resolveSubscriptionInvoiceGrant(
  subscriptionStripe({ subscriptionError: new Error("expanded subscription must not be retrieved") }),
  invoice({ parent: { subscription_details: { subscription: { id: "sub_expanded", status: "active" } } } }),
  activePlan,
);
check("safely expanded active subscription is used without another lookup", expandedGrant?.credits === 3);

for (const status of ["canceled", "incomplete", "incomplete_expired", "unpaid", "paused", "past_due", "trialing"]) {
  const grant = await resolveSubscriptionInvoiceGrant(
    subscriptionStripe({ subscriptionStatus: status }),
    invoice(),
    activePlan,
  );
  check(`${status} subscription invoice grants nothing`, grant === null);
}

let lookupRetried = false;
try {
  await resolveSubscriptionInvoiceGrant(
    subscriptionStripe({ subscriptionError: new Error("temporary Stripe outage") }),
    invoice(),
    activePlan,
  );
} catch {
  lookupRetried = true;
}
check("transient subscription lookup failure remains retryable", lookupRetried);

const customerFallback = await resolveSubscriptionInvoiceGrant(
  subscriptionStripe({ customerEmail: "fallback@example.com" }),
  invoice({ customer_email: null }),
  activePlan,
);
check("nullable invoice email falls back to Stripe Customer", customerFallback?.email === "fallback@example.com");

const noEmailGrant = await resolveSubscriptionInvoiceGrant(
  subscriptionStripe({ customerEmail: null }),
  invoice({ customer_email: null }),
  activePlan,
);
check("no usable verified Stripe customer email provisions nothing", noEmailGrant === null);

if (failures > 0) process.exit(1);
