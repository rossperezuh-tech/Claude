import Stripe from "stripe";

/** Returns a Stripe client, or null when no key is configured (demo mode). */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}
