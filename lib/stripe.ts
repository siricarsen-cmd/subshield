import Stripe from "stripe";

type StripeEnvironment = Pick<NodeJS.ProcessEnv, "STRIPE_SECRET_KEY">;

let cachedStripe: Stripe | undefined;
let cachedSecretKey: string | undefined;

export function requireStripeSecretKey(
  environment: StripeEnvironment = process.env,
): string {
  const secretKey = environment.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) {
    throw new Error(
      "Missing required environment variable: STRIPE_SECRET_KEY. Set it in .env.local for test mode or in Vercel for production/live mode.",
    );
  }

  return secretKey;
}

export function getStripe(
  environment: StripeEnvironment = process.env,
): Stripe {
  const secretKey = requireStripeSecretKey(environment);

  if (environment !== process.env) {
    return new Stripe(secretKey, {
      apiVersion: "2026-05-27.dahlia",
    });
  }

  if (!cachedStripe || cachedSecretKey !== secretKey) {
    cachedStripe = new Stripe(secretKey, {
      apiVersion: "2026-05-27.dahlia",
    });
    cachedSecretKey = secretKey;
  }

  return cachedStripe;
}
