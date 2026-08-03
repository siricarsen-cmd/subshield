import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import { resolveAppBaseUrl } from "@/lib/app-base-url";
import { selectBillingPortalCustomerId } from "@/lib/billing-portal-customer";

export async function POST(req: Request) {
  try {
    // 1. Grab the secure token the frontend sends us
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Auth Token");
    const token = authHeader.replace("Bearer ", "");

    // 2. Verify the token with Supabase to ensure they are a real logged-in user
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) throw new Error("Unauthorized request");
    if (!user.email || !user.email_confirmed_at) {
      throw new Error("No verified billing email was found for this account.");
    }

    const stripe = getStripe();

    // 3. Select the matching Stripe Customer that owns a manageable
    // subscription. Checkout may create multiple customers for one email, so
    // choosing only the newest match can hide an older active subscription.
    const customerId = await selectBillingPortalCustomerId(stripe, user.email);
    if (!customerId) {
      throw new Error("No active billing profile found for this email address.");
    }

    const baseUrl = resolveAppBaseUrl();

    // 4. Generate the secure Stripe Customer Portal link
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseUrl}/dashboard`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    console.error("Portal Error:", error);
    const message = error instanceof Error ? error.message : "Portal request failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
