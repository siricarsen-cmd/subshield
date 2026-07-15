import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getStripePlanByPriceId, requireStripePlanEnv, STRIPE_PLANS } from "@/lib/stripe-plans";
import { fulfillCheckoutCredits, type CreditDatabase } from "@/lib/credit-fulfillment";
import { shouldFulfillCheckout } from "@/lib/stripe-credit-grants";
import {
  resolveSubscriptionInvoiceGrant,
  subscriptionInvoiceResponseStatus,
} from "@/lib/stripe-subscription-invoice";
import type Stripe from "stripe";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const creditDatabase = supabase as unknown as CreditDatabase;

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

      // Subscription credits are fulfilled exclusively from invoice.paid so
      // the initial invoice and every renewal share one durable path.
      if (creditsToAdd > 0 && shouldFulfillCheckout(plan?.mode)) {
        let fulfilled: boolean;
        try {
          fulfilled = await fulfillCheckoutCredits(creditDatabase, {
            eventId: event.id,
            sourceType: "checkout_session",
            sourceId: session.id,
            email,
            credits: creditsToAdd,
          });
        } catch (error: unknown) {
          console.error("[DATABASE FAULT] Stripe credit fulfillment failed:", error);
          return new NextResponse("Database error", { status: 500 });
        }

        if (fulfilled) {
          console.log(`[SUCCESS] Provisioned ${creditsToAdd} pending credits for checkout ${session.id}.`);
        } else {
          console.log(`[IDEMPOTENT] Checkout ${session.id} was already fulfilled.`);
        }
      }
    }

    if (event.type === "invoice.paid") {
      const invoice = event.data.object as Stripe.Invoice;
      const plan = STRIPE_PLANS.find((candidate) => candidate.mode === "subscription")!;
      let resolution;
      try {
        resolution = await resolveSubscriptionInvoiceGrant(stripe, invoice, plan);
      } catch (error: unknown) {
        console.error(`[STRIPE LOOKUP FAULT] Could not verify subscription invoice ${invoice.id}:`, error);
        return new NextResponse("Stripe verification unavailable", { status: 500 });
      }

      if (resolution.kind === "needs_reconciliation") {
        console.error("[SUBSCRIPTION_CREDIT_RECONCILIATION]", {
          eventId: event.id,
          invoiceId: invoice.id,
          subscriptionId: resolution.subscriptionId,
          customerId: resolution.customerId,
          reason: resolution.reason,
        });
        return new NextResponse(
          "Subscription credit identity requires reconciliation",
          { status: subscriptionInvoiceResponseStatus(resolution) },
        );
      }

      if (resolution.kind === "ineligible") {
        console.log(`[IGNORED] Subscription invoice ${invoice.id}: ${resolution.reason}.`);
        return new NextResponse(null, { status: 200 });
      }

      try {
        const fulfilled = await fulfillCheckoutCredits(creditDatabase, {
          eventId: event.id,
          sourceType: "invoice",
          sourceId: invoice.id,
          email: resolution.email,
          credits: resolution.credits,
        });
        console.log(
          fulfilled
            ? `[SUCCESS] Provisioned ${resolution.credits} subscription credits for invoice ${invoice.id}.`
            : `[IDEMPOTENT] Invoice ${invoice.id} was already fulfilled.`
        );
      } catch (error: unknown) {
        console.error("[DATABASE FAULT] Stripe invoice fulfillment failed:", error);
        return new NextResponse("Database error", { status: 500 });
      }
    }

    return new NextResponse(null, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown webhook error.";
    return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
  }
}
