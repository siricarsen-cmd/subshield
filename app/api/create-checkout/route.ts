import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { requireStripePlanEnv } from "@/lib/stripe-plans";
import { CheckoutRequestError, createAllowedCheckoutSession } from "@/lib/checkout-session";
import { resolveAppBaseUrl } from "@/lib/app-base-url";

export async function POST(req: Request) {
  try {
    requireStripePlanEnv();

    const { priceId, userId } = await req.json();
    const baseUrl = resolveAppBaseUrl();
    const stripe = getStripe();

    const session = await createAllowedCheckoutSession(stripe, { priceId, userId, baseUrl });

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    console.error("Stripe Checkout Error:", error);
    const message = error instanceof Error ? error.message : "Checkout failed.";
    return NextResponse.json(
      { error: message },
      { status: error instanceof CheckoutRequestError ? error.status : 500 },
    );
  }
}
