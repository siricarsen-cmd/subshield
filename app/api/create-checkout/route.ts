import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { requireStripePlanEnv } from "@/lib/stripe-plans";
import { CheckoutRequestError, createAllowedCheckoutSession } from "@/lib/checkout-session";

export async function POST(req: Request) {
  try {
    requireStripePlanEnv();

    const { priceId, userId } = await req.json();

    // Use the environment variable for URLs so switching domains is automatic
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://subshield-mu.vercel.app";

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
