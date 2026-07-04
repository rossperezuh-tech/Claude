import Stripe from "stripe";

/**
 * Stripe is optional in local dev: without STRIPE_SECRET_KEY the checkout
 * route falls back to a simulated payment so the whole flow can be exercised.
 */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2024-06-20" });
}

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
