import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getStripePlanByPriceId, requireStripePlanEnv } from "@/lib/stripe-plans";
import type Stripe from "stripe";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    requireStripePlanEnv();

    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    if (!sig) return new NextResponse("Missing signature", { status: 400 });

    const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const email = session.customer_details?.email;
      
      if (!email) {
        console.error("[WEBHOOK FAULT] Payment succeeded but no email found.");
        return new NextResponse("Missing email context", { status: 400 });
      }

      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
      const priceId = lineItems.data[0]?.price?.id;

      const plan = priceId ? getStripePlanByPriceId(priceId) : undefined;
      const creditsToAdd = plan?.credits ?? 0;

      if (creditsToAdd > 0) {
        // Upsert to a pending_credits table to hold the value until the user registers
        const { error: dbError } = await supabase
          .from('pending_credits')
          .upsert({ email: email.toLowerCase(), credits: creditsToAdd }, { onConflict: 'email' });

        if (dbError) {
          console.error("[DATABASE FAULT]", dbError);
          return new NextResponse("Database error", { status: 500 });
        }
        console.log(`[SUCCESS] Provisioned ${creditsToAdd} pending credits for: ${email}`);
      }
    }

    return new NextResponse(null, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown webhook error.";
    return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
  }
}