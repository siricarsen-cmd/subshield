import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { tier, credits } = await request.json();

    if (!tier) {
      return NextResponse.json({ error: "No billing tier parameter selected." }, { status: 400 });
    }

    // Determine pricing and internal metadata based on your verified packages
    let unitAmount = tier === "Annual Growth Pack" ? 59900 : 14999; // Stripe prices in cents
    let productName = tier === "Annual Growth Pack" ? "The Annual Growth Pack (5 Credits)" : "Single Project Scan (1 Credit)";

    console.log(`[STRIPE HANDSHAKE INIT] Processing gateway session for ${productName}`);

    // =========================================================================
    // PRODUCTION CONFIGURATION NOTE:
    // When you launch live, this block initiates the real Stripe SDK:
    // const session = await stripe.checkout.sessions.create({ ... })
    // =========================================================================

    // Generate a secure simulation URL that handles success callbacks smoothly
    // We append the credits to the success URL so our dashboard can dynamically read it
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const simulatedStripeCheckoutUrl = `${baseUrl}/dashboard?payment_success=true&credits=${credits}&tier=${encodeURIComponent(tier)}`;

    return NextResponse.json({ 
      success: true, 
      url: simulatedStripeCheckoutUrl 
    }, { status: 200 });

  } catch (error: any) {
    console.error("[STRIPE GATEWAY FAULT]", error);
    return NextResponse.json({ error: "Internal payment processing exception." }, { status: 500 });
  }
}