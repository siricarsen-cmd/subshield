// Single source of truth for the 3 purchasable Stripe Prices: which env var
// holds the Price ID, what Checkout mode it uses, and how many credits the
// webhook grants for it. Price IDs are not secrets, so the pricing page (a
// client component) reads the same NEXT_PUBLIC_ vars via the exports below.
export interface StripePlanConfig {
  envVar: string;
  priceId: string | undefined;
  mode: "payment" | "subscription";
  credits: number;
}

const SINGLE_REVIEW_CYCLE_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_SINGLE_REVIEW_CYCLE;
const ACTIVE_BIDDER_PLAN_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_ACTIVE_BIDDER_PLAN;
const ENTERPRISE_PLAN_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_PLAN;

export const STRIPE_PLANS: StripePlanConfig[] = [
  {
    envVar: "NEXT_PUBLIC_STRIPE_PRICE_SINGLE_REVIEW_CYCLE",
    priceId: SINGLE_REVIEW_CYCLE_PRICE_ID,
    mode: "payment",
    credits: 1,
  },
  {
    envVar: "NEXT_PUBLIC_STRIPE_PRICE_ACTIVE_BIDDER_PLAN",
    priceId: ACTIVE_BIDDER_PLAN_PRICE_ID,
    mode: "subscription",
    credits: 3,
  },
  {
    envVar: "NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_PLAN",
    priceId: ENTERPRISE_PLAN_PRICE_ID,
    mode: "payment",
    credits: 30,
  },
];

// Raw exports for the pricing page's checkout buttons.
export const STRIPE_PRICE_SINGLE_REVIEW_CYCLE = SINGLE_REVIEW_CYCLE_PRICE_ID;
export const STRIPE_PRICE_ACTIVE_BIDDER_PLAN = ACTIVE_BIDDER_PLAN_PRICE_ID;
export const STRIPE_PRICE_ENTERPRISE_PLAN = ENTERPRISE_PLAN_PRICE_ID;

export function getStripePlanByPriceId(priceId: string): StripePlanConfig | undefined {
  return STRIPE_PLANS.find((plan) => plan.priceId === priceId);
}

// Call at the top of any server route that creates a checkout/portal session
// or provisions credits, so a missing price env var fails loudly instead of
// silently defaulting a checkout to the wrong mode or a webhook to 0 credits.
export function requireStripePlanEnv(): void {
  const missing = STRIPE_PLANS.filter((plan) => !plan.priceId);
  if (missing.length > 0) {
    throw new Error(
      `Missing required Stripe price environment variable(s): ${missing
        .map((plan) => plan.envVar)
        .join(", ")}. Set them in .env.local for test mode or in Vercel for production/live mode.`
    );
  }
}
