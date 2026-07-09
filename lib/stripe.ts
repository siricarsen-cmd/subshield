import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  throw new Error(
    "Missing required environment variable: STRIPE_SECRET_KEY. Set it in .env.local for test mode or in Vercel for production/live mode."
  );
}

export const stripe = new Stripe(secretKey, {
  apiVersion: "2026-05-27.dahlia",
});