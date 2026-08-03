import type Stripe from "stripe";

interface BillingPortalStripeClient {
  customers: {
    list(params: { email: string; limit: number }): Promise<{ data: Stripe.Customer[] }>;
  };
  subscriptions: {
    list(params: {
      customer: string;
      status: "all";
      limit: number;
    }): Promise<{ data: Stripe.Subscription[] }>;
  };
}

const PRIMARY_PORTAL_STATUSES = new Set<Stripe.Subscription.Status>([
  "active",
  "trialing",
  "past_due",
  "unpaid",
  "paused",
]);

export async function selectBillingPortalCustomerId(
  stripe: BillingPortalStripeClient,
  email: string,
): Promise<string | null> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return null;

  // Checkout is intentionally available before login and may create more than
  // one Stripe Customer for the same email over time. Search all matches so a
  // later one-time purchase cannot hide the customer that owns a subscription.
  const customers = await stripe.customers.list({
    email: normalizedEmail,
    limit: 100,
  });
  if (customers.data.length === 0) return null;

  let incompleteSubscriptionCustomerId: string | null = null;

  for (const customer of customers.data) {
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: "all",
      limit: 100,
    });

    if (
      subscriptions.data.some((subscription) =>
        PRIMARY_PORTAL_STATUSES.has(subscription.status)
      )
    ) {
      return customer.id;
    }

    if (
      !incompleteSubscriptionCustomerId
      && subscriptions.data.some((subscription) => subscription.status === "incomplete")
    ) {
      incompleteSubscriptionCustomerId = customer.id;
    }
  }

  // An incomplete subscription can still need payment-method remediation.
  // Otherwise preserve portal access to the newest matching one-time customer.
  return incompleteSubscriptionCustomerId ?? customers.data[0].id;
}
