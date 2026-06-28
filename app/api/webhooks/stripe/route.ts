import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    if (!sig) return new NextResponse("Missing signature", { status: 400 });
    
    const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const email = session.customer_details?.email;
      
      if (!email) {
        console.error("[WEBHOOK FAULT] Payment succeeded but no email found.");
        return new NextResponse("Missing email context", { status: 400 });
      }

      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
      const priceId = lineItems.data[0]?.price?.id;
      
      let creditsToAdd = 0;
      if (priceId === "price_1Tlf0mHCtlCRL0oUEc38O1DB") creditsToAdd = 1;
      else if (priceId === "price_1Tlf1HHCtlCRL0oUGy7eUqd6") creditsToAdd = 3;
      else if (priceId === "price_1Tlf20HCtlCRL0oUGtni2RlJ") creditsToAdd = 30;

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
  } catch (error: any) {
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }
}