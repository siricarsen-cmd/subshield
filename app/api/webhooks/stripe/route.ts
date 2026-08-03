import { getStripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import { getStripePlanByPriceId, requireStripePlanEnv, STRIPE_PLANS } from "@/lib/stripe-plans";
import { fulfillCheckoutCredits } from "@/lib/credit-fulfillment";
import { shouldFulfillCheckout } from "@/lib/stripe-credit-grants";
import {
  resolveSubscriptionInvoiceGrant,
  subscriptionInvoiceResponseStatus,
} from "@/lib/stripe-subscription-invoice";
import { getServerCreditDatabase } from "@/lib/server-credit-database";
import { recordOperationalIncident } from "@/lib/operational-incidents";
import type Stripe from "stripe";

function requireStripeWebhookSecret(): string {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    throw new Error(
      "Missing required environment variable: STRIPE_WEBHOOK_SECRET.",
    );
  }

  return webhookSecret;
}

export async function POST(req: Request) {
  let stripe: ReturnType<typeof getStripe>;
  let webhookSecret: string;

  try {
    requireStripePlanEnv();
    stripe = getStripe();
    webhookSecret = requireStripeWebhookSecret();
  } catch {
    await recordOperationalIncident("stripe_webhook_configuration_failed");
    console.error("[STRIPE WEBHOOK] Configuration unavailable");
    return new NextResponse("Webhook configuration unavailable", { status: 500 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return new NextResponse("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    // Invalid/malformed external requests are ordinary 400 responses. Do not
    // create an operational incident for unauthenticated probes.
    return new NextResponse("Webhook signature verification failed", { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const email = session.customer_details?.email;

      if (!email) {
        await recordOperationalIncident("stripe_checkout_missing_email");
        console.error("[STRIPE WEBHOOK] Checkout email context missing");
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
          fulfilled = await fulfillCheckoutCredits(
            getServerCreditDatabase(),
            {
              eventId: event.id,
              sourceType: "checkout_session",
              sourceId: session.id,
              email,
              credits: creditsToAdd,
            },
          );
        } catch {
          await recordOperationalIncident("stripe_checkout_credit_fulfillment_failed");
          console.error("[STRIPE WEBHOOK] Checkout credit fulfillment failed");
          return new NextResponse("Database error", { status: 500 });
        }

        console.log("[STRIPE WEBHOOK] Checkout credit fulfillment", {
          outcome: fulfilled ? "fulfilled" : "idempotent",
          credits: creditsToAdd,
        });
      }
    }

    if (event.type === "invoice.paid") {
      const invoice = event.data.object as Stripe.Invoice;
      const plan = STRIPE_PLANS.find((candidate) => candidate.mode === "subscription")!;
      let resolution;
      try {
        resolution = await resolveSubscriptionInvoiceGrant(stripe, invoice, plan);
      } catch {
        await recordOperationalIncident("stripe_invoice_lookup_failed");
        console.error("[STRIPE WEBHOOK] Subscription invoice lookup failed");
        return new NextResponse("Stripe verification unavailable", { status: 500 });
      }

      if (resolution.kind === "needs_reconciliation") {
        await recordOperationalIncident("stripe_invoice_reconciliation_required");
        console.error("[STRIPE WEBHOOK] Subscription credit reconciliation required");
        return new NextResponse(
          "Subscription credit identity requires reconciliation",
          { status: subscriptionInvoiceResponseStatus(resolution) },
        );
      }

      if (resolution.kind === "ineligible") {
        console.log("[STRIPE WEBHOOK] Subscription invoice ignored", {
          reason: resolution.reason,
        });
        return new NextResponse(null, { status: 200 });
      }

      try {
        const fulfilled = await fulfillCheckoutCredits(
          getServerCreditDatabase(),
          {
            eventId: event.id,
            sourceType: "invoice",
            sourceId: invoice.id,
            email: resolution.email,
            credits: resolution.credits,
          },
        );
        console.log("[STRIPE WEBHOOK] Subscription credit fulfillment", {
          outcome: fulfilled ? "fulfilled" : "idempotent",
          credits: resolution.credits,
        });
      } catch {
        await recordOperationalIncident("stripe_invoice_credit_fulfillment_failed");
        console.error("[STRIPE WEBHOOK] Subscription credit fulfillment failed");
        return new NextResponse("Database error", { status: 500 });
      }
    }

    return new NextResponse(null, { status: 200 });
  } catch {
    await recordOperationalIncident("stripe_webhook_unexpected_failure");
    console.error("[STRIPE WEBHOOK] Unexpected processing failure");
    return new NextResponse("Webhook processing failed", { status: 500 });
  }
}
