import type Stripe from "stripe";
import type { StripePlanConfig } from "./stripe-plans";
import { shouldFulfillSubscriptionInvoice } from "./stripe-credit-grants";

interface SubscriptionInvoiceStripeClient {
  invoices: {
    listLineItems(invoiceId: string, params: { limit: number }): AsyncIterable<Stripe.InvoiceLineItem>;
  };
  subscriptions: {
    retrieve(subscriptionId: string): Promise<Stripe.Subscription>;
  };
  customers: {
    retrieve(customerId: string): Promise<Stripe.Customer | Stripe.DeletedCustomer>;
  };
}

export interface SubscriptionInvoiceGrant {
  email: string;
  credits: number;
}

function usableEmail(value: string | null | undefined): string | null {
  const email = value?.trim();
  return email ? email : null;
}

async function getStripeCustomerEmail(
  client: SubscriptionInvoiceStripeClient,
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null,
): Promise<string | null> {
  if (!customer) return null;
  const resolved = typeof customer === "string"
    ? await client.customers.retrieve(customer)
    : customer;
  if (resolved.deleted) return null;
  return usableEmail(resolved.email);
}

export async function resolveSubscriptionInvoiceGrant(
  client: SubscriptionInvoiceStripeClient,
  invoice: Stripe.Invoice,
  plan: StripePlanConfig,
): Promise<SubscriptionInvoiceGrant | null> {
  if (
    invoice.status !== "paid"
    || (invoice.billing_reason !== "subscription_create" && invoice.billing_reason !== "subscription_cycle")
  ) {
    return null;
  }

  const linePriceIds: string[] = [];
  for await (const line of client.invoices.listLineItems(invoice.id, { limit: 100 })) {
    const price = line.pricing?.price_details?.price;
    const priceId = typeof price === "string" ? price : price?.id;
    if (priceId) linePriceIds.push(priceId);
  }

  // Reject irrelevant/open/void invoices before any subscription or customer
  // retrieval, so only a paid configured cycle can reach retryable lookups.
  if (!shouldFulfillSubscriptionInvoice({
    status: invoice.status,
    billingReason: invoice.billing_reason,
    linePriceIds,
    activeBidderPriceId: plan.priceId,
    subscriptionStatus: "active",
  })) {
    return null;
  }

  const subscriptionReference = invoice.parent?.subscription_details?.subscription;
  if (!subscriptionReference) return null;
  const subscription = typeof subscriptionReference === "string"
    ? await client.subscriptions.retrieve(subscriptionReference)
    : subscriptionReference;

  if (subscription.status !== "active") return null;

  const email = usableEmail(invoice.customer_email)
    ?? await getStripeCustomerEmail(client, invoice.customer);
  if (!email) return null;

  return { email, credits: plan.credits };
}
