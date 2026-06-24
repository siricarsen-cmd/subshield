import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { priceId, userId } = await req.json();

  // Validate that the priceId is one of your three products
  const allowedPrices = [
    "price_1Tlf0mHCtlCRL0oUEc38O1DB", // Single Scan
    "price_1Tlf1HHCtlCRL0oUGy7eUqd6", // Monthly
    "price_1Tlf20HCtlCRL0oUGtni2RlJ"  // Enterprise
  ];

  if (!allowedPrices.includes(priceId)) {
    return NextResponse.json({ error: "Invalid Price ID" }, { status: 400 });
  }

  // Determine mode based on whether it is a subscription
  // Single Scan is one-time; others are subscriptions
  const mode = priceId === "price_1Tlf0mHCtlCRL0oUEc38O1DB" ? 'payment' : 'subscription';

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: mode,
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/report/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/report/cancel`,
      metadata: { userId },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}