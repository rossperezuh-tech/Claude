import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/org";
import { getStripe, planById, priceIdFor, billingConfigured } from "@/lib/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!billingConfigured()) {
    return NextResponse.json({ error: "Billing isn't set up yet." }, { status: 500 });
  }
  const { orgId } = await requireOrg();

  let body: { plan?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const plan = planById(body.plan);
  if (!plan) return NextResponse.json({ error: "Unknown plan." }, { status: 400 });
  const priceId = priceIdFor(plan);
  if (!priceId) {
    return NextResponse.json({ error: `${plan.name} isn't configured yet.` }, { status: 500 });
  }

  const stripe = getStripe();
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { stripeCustomerId: true },
  });

  let customerId = org?.stripeCustomerId ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({ metadata: { orgId } });
    customerId = customer.id;
    await prisma.organization.update({ where: { id: orgId }, data: { stripeCustomerId: customerId } });
  }

  const origin = req.headers.get("origin") ?? new URL(req.url).origin;
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    // No Stripe trial — the 30-day free trial already happened in-app, so
    // subscribing starts billing now.
    subscription_data: { metadata: { orgId, plan: plan.id } },
    allow_promotion_codes: true,
    success_url: `${origin}/billing?success=1`,
    cancel_url: `${origin}/billing?canceled=1`,
    metadata: { orgId, plan: plan.id },
  });

  return NextResponse.json({ url: session.url });
}
