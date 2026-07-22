import Stripe from "stripe";

export const TRIAL_DAYS = 30;

// Which tools each plan unlocks. Empty tools list = all tools (Full Suite).
// These slugs map to lib/tools.ts. Usage & Billing / Deal Tracker stay owner-only.
const STARTER_TOOLS = ["the-brain", "brain-dump", "weekly-digest", "money-log", "meeting-notes"];
const GROWTH_TOOLS = [
  ...STARTER_TOOLS,
  "content-studio", "content-calendar", "launch-planner",
  "pipeline", "proposals", "client-report", "follow-up", "outreach-writer", "testimonials",
  "sop-writer", "onboarding-kit", "invoice-tracker", "cash-flow", "goals",
  "document-reader", "contract-manager",
];

export interface Plan {
  id: string; // starter | growth | full
  name: string;
  priceDollars: number;
  priceEnv: string; // env var holding the Stripe Price ID
  blurb: string;
  tools: string[]; // enabledTools bundle; [] means all tools
}

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    priceDollars: 99,
    priceEnv: "STRIPE_PRICE_STARTER",
    blurb: "The AI HQ core — assistant, capture, and money basics.",
    tools: STARTER_TOOLS,
  },
  {
    id: "growth",
    name: "Growth",
    priceDollars: 249,
    priceEnv: "STRIPE_PRICE_GROWTH",
    blurb: "Everything to market, sell, and get paid.",
    tools: GROWTH_TOOLS,
  },
  {
    id: "full",
    name: "Full Suite",
    priceDollars: 499,
    priceEnv: "STRIPE_PRICE_FULL",
    blurb: "The whole platform, every tool.",
    tools: [],
  },
];

export function planById(id: string | null | undefined): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

export function priceIdFor(plan: Plan): string | undefined {
  return process.env[plan.priceEnv];
}

export function planForPriceId(priceId: string | null | undefined): Plan | undefined {
  if (!priceId) return undefined;
  return PLANS.find((p) => process.env[p.priceEnv] === priceId);
}

/** A subscription that grants access: on trial or fully active. */
export function isActive(status: string | null | undefined): boolean {
  return status === "trialing" || status === "active";
}

let cached: Stripe | null = null;
export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  if (!cached) cached = new Stripe(process.env.STRIPE_SECRET_KEY);
  return cached;
}

export function billingConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}
