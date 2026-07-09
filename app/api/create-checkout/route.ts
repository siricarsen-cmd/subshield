import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getStripePlanByPriceId, requireStripePlanEnv } from "@/lib/stripe-plans";

export async function POST(req: Request) {
  try {
    requireStripePlanEnv();

    const { priceId, userId } = await req.json();

    // Dynamically set mode based on the matched plan; unrecognized price IDs
    // (e.g. a Stripe Price outside our 3 configured plans) still default to
    // "payment", matching prior behavior.
    const plan = getStripePlanByPriceId(priceId);
    const checkoutMode = plan?.mode ?? "payment";

    // Use the environment variable for URLs so switching domains is automatic
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://subshield-mu.vercel.app";

    const session = await stripe.checkout.sessions.create({
      mode: checkoutMode,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      // THIS IS CRITICAL: Only attach the user ID to Stripe if they are actually logged in. 
      // If it's a guest checkout, it safely ignores this line.
      ...(userId && { client_reference_id: userId }),
      
      // Force Stripe to create a customer profile for one-time payments
      ...(checkoutMode === "payment" && { customer_creation: "always" }),
      
      success_url: `${baseUrl}/success`,
      cancel_url: `${baseUrl}/pricing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    console.error("Stripe Checkout Error:", error);
    const message = error instanceof Error ? error.message : "Checkout failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}