// Focused duplicate-customer billing portal checks. Run directly with Node 24:
// node --experimental-loader ./lib/analyzer/__tests__/ts-relative-import.loader.mjs lib/__tests__/billing-portal-customer.test.mjs
import { selectBillingPortalCustomerId } from "../billing-portal-customer.ts";

let failures = 0;

function check(label, condition) {
  if (condition) {
    console.log(`PASS: ${label}`);
  } else {
    console.error(`FAIL: ${label}`);
    failures += 1;
  }
}

function stripeFixture(customers, subscriptionsByCustomer = {}) {
  const calls = { customerEmail: null, subscriptionCustomers: [] };
  return {
    calls,
    client: {
      customers: {
        async list({ email }) {
          calls.customerEmail = email;
          return { data: customers.map((id) => ({ id })) };
        },
      },
      subscriptions: {
        async list({ customer }) {
          calls.subscriptionCustomers.push(customer);
          return {
            data: (subscriptionsByCustomer[customer] ?? []).map((status, index) => ({
              id: `sub_${customer}_${index}`,
              status,
            })),
          };
        },
      },
    },
  };
}

const noCustomers = stripeFixture([]);
check(
  "no matching Stripe customer returns no portal target",
  await selectBillingPortalCustomerId(noCustomers.client, " Buyer@Example.COM ") === null,
);
check(
  "billing email is normalized before Stripe lookup",
  noCustomers.calls.customerEmail === "buyer@example.com",
);

const duplicateCustomers = stripeFixture(
  ["cus_new_one_time", "cus_older_subscription"],
  {
    cus_new_one_time: [],
    cus_older_subscription: ["active"],
  },
);
check(
  "an older active subscription customer wins over a newer one-time customer",
  await selectBillingPortalCustomerId(duplicateCustomers.client, "buyer@example.com")
    === "cus_older_subscription",
);

const remediationCustomer = stripeFixture(
  ["cus_one_time", "cus_past_due"],
  {
    cus_one_time: [],
    cus_past_due: ["past_due"],
  },
);
check(
  "a past-due subscription remains reachable for payment remediation",
  await selectBillingPortalCustomerId(remediationCustomer.client, "buyer@example.com")
    === "cus_past_due",
);

const incompleteThenActive = stripeFixture(
  ["cus_incomplete", "cus_active"],
  {
    cus_incomplete: ["incomplete"],
    cus_active: ["active"],
  },
);
check(
  "an active subscription is preferred over a newer incomplete subscription",
  await selectBillingPortalCustomerId(incompleteThenActive.client, "buyer@example.com")
    === "cus_active",
);

const incompleteFallback = stripeFixture(
  ["cus_one_time", "cus_incomplete"],
  {
    cus_one_time: [],
    cus_incomplete: ["incomplete"],
  },
);
check(
  "an incomplete subscription is preferred over a one-time customer when no active subscription exists",
  await selectBillingPortalCustomerId(incompleteFallback.client, "buyer@example.com")
    === "cus_incomplete",
);

const endedSubscriptions = stripeFixture(
  ["cus_new_one_time", "cus_ended"],
  {
    cus_new_one_time: [],
    cus_ended: ["canceled", "incomplete_expired"],
  },
);
check(
  "ended subscriptions do not displace the newest ordinary billing profile",
  await selectBillingPortalCustomerId(endedSubscriptions.client, "buyer@example.com")
    === "cus_new_one_time",
);

if (failures > 0) process.exit(1);
