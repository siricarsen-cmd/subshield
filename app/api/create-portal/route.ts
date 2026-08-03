import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import { resolveAppBaseUrl } from "@/lib/app-base-url";

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

    const stripe = getStripe();

    // 3. Ask Stripe to find the customer profile attached to this verified email
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      throw new Error("No active billing profile found for this email address.");
    }

    const customerId = customers.data[0].id;
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
