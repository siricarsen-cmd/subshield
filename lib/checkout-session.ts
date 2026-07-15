import type Stripe from "stripe";
import { STRIPE_PLANS, type StripePlanConfig } from "./stripe-plans";

export class CheckoutRequestError extends Error {
  readonly status = 400;
}

interface CheckoutClient {
  checkout: {
    sessions: {
      create(params: Stripe.Checkout.SessionCreateParams): Promise<{ url: string | null }>;
    };
  };
}

export async function createAllowedCheckoutSession(
  client: CheckoutClient,
  input: { priceId: unknown; userId?: unknown; baseUrl: string },
  plans: StripePlanConfig[] = STRIPE_PLANS,
): Promise<{ url: string | null }> {
  if (typeof input.priceId !== "string" || input.priceId.trim().length === 0) {
    throw new CheckoutRequestError("A valid SubShield price is required.");
  }

  const plan = plans.find((candidate) => candidate.priceId === input.priceId);
  if (!plan) {
    throw new CheckoutRequestError("That SubShield price is unavailable.");
  }

  const userId = typeof input.userId === "string" && input.userId.length > 0
    ? input.userId
    : undefined;

  return client.checkout.sessions.create({
    mode: plan.mode,
    payment_method_types: ["card"],
    line_items: [{ price: plan.priceId!, quantity: 1 }],
    ...(userId && { client_reference_id: userId }),
    ...(plan.mode === "payment" && { customer_creation: "always" }),
    success_url: `${input.baseUrl}/success`,
    cancel_url: `${input.baseUrl}/pricing`,
  });
}
