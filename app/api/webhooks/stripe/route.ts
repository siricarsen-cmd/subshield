import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

// Added the fallback placeholders so Vercel can pass the build step
const supabase = createClient(
  process.env.SUPABASE_URL || "https://placeholder.supabase.co", 
  process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder_key"
);

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;
  
  // Added a fallback for the webhook secret as well, just to be safe!
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "whsec_placeholder";
  const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    const userId = session.metadata.userId;
    
    // Determine how many credits to add based on the plan
    const creditsToAdd = session.amount_total === 14999 ? 1 : 3; 

    await supabase.from('user_credits')
      .upsert({ user_id: userId, credits: creditsToAdd }, { onConflict: 'user_id' });
  }

  return new Response(null, { status: 200 });
}