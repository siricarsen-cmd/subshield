import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

// Uses your live Vercel environment variables securely in production
const supabase = createClient(
  process.env.SUPABASE_URL || "https://placeholder.supabase.co", 
  process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder_key"
);

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    if (!sig) {
      return new Response("Missing Stripe signature header", { status: 400 });
    }
    
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "whsec_placeholder";
    const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      
      // Look inside the line items to find out exactly what Price ID they bought
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
      const priceId = lineItems.data[0]?.price?.id;
      
      // Fallback to checking metadata if user authentication wasn't handled inline
      const userId = session.metadata?.userId || session.client_reference_id;

      if (!userId) {
        console.error("[WEBHOOK FAULT] Payment succeeded but no userId was found attached to the session.");
        return new Response("Missing User ID context", { status: 400 });
      }

      // Map your verified Stripe Price IDs directly to the correct credit values
      let creditsToAdd = 0;
      if (priceId === "price_1Tlf0mHCtlCRL0oUEc38O1DB") {
        creditsToAdd = 1; // Single Project Scan
      } else if (priceId === "price_1Tlf1HHCtlCRL0oUGy7eUqd6") {
        creditsToAdd = 3; // Monthly Subscription
      } else if (priceId === "price_1Tlf20HCtlCRL0oUGtni2RlJ") {
        creditsToAdd = 30; // Enterprise Plan
      } else {
        console.warn(`[WEBHOOK WARNING] Unrecognized Price ID detected: ${priceId}`);
      }

      if (creditsToAdd > 0) {
        // First, fetch their current credit count to accurately add them together
        const { data: currentRecord } = await supabase
          .from('user_credits')
          .select('credits')
          .eq('user_id', userId)
          .single();

        const existingCredits = currentRecord?.credits || 0;
        const newCreditTotal = existingCredits + creditsToAdd;

        // Save the updated credit total securely to your database
        const { error: dbError } = await supabase
          .from('user_credits')
          .upsert({ user_id: userId, credits: newCreditTotal }, { onConflict: 'user_id' });

        if (dbError) {
          console.error("[DATABASE FAULT] Failed to increment credits for user:", dbError);
          return new Response("Database execution error", { status: 500 });
        }

        console.log(`[SUCCESS] Provisioned ${creditsToAdd} credits to User: ${userId}. New total: ${newCreditTotal}`);
      }
    }

    return new Response(null, { status: 200 });
  } catch (error: any) {
    console.error(`[WEBHOOK CRITICAL ERROR] ${error.message}`);
    return new Response(`Webhook Error: ${error.message}`, { status: 400 });
  }
}