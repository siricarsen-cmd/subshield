import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  try {
    const { priceId, userId } = await req.json();

    // Dynamically set mode based on your specific Price ID
    const checkoutMode = priceId === "price_1Tlf1HHCtlCRL0oUGy7eUqd6" 
      ? "subscription" 
      : "payment";

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
      success_url: `${baseUrl}/success`,
      cancel_url: `${baseUrl}/pricing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe Checkout Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}