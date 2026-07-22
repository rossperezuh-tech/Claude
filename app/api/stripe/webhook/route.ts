import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe, planForPriceId } from "@/lib/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function periodEnd(sub: Stripe.Subscription): Date | null {
  // The billing period moved onto items in recent API versions; read either.
  const top = (sub as unknown as { current_period_end?: number }).current_period_end;
  const item = (sub.items?.data?.[0] as unknown as { current_period_end?: number } | undefined)
    ?.current_period_end;
  const unix = top ?? item;
  return unix ? new Date(unix * 1000) : null;
}

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "webhook not configured" }, { status: 500 });

  const stripe = getStripe();
  const sig = req.headers.get("stripe-signature");
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig ?? "", secret);
  } catch {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  async function syncSubscription(sub: Stripe.Subscription) {
    const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
    const org = await prisma.organization.findFirst({
      where: { stripeCustomerId: customerId },
      select: { id: true },
    });
    if (!org) return;
    const plan = planForPriceId(sub.items.data[0]?.price?.id);
    await prisma.organization.update({
      where: { id: org.id },
      data: {
        stripeSubscriptionId: sub.id,
        subscriptionStatus: sub.status,
        plan: plan?.id ?? "",
        currentPeriodEnd: periodEnd(sub),
        // On an active/trialing plan, apply its tool bundle ([] = all tools).
        ...(plan && (sub.status === "active" || sub.status === "trialing")
          ? { enabledTools: plan.tools }
          : {}),
      },
    });
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.trial_will_end":
      await syncSubscription(event.data.object as Stripe.Subscription);
      break;
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      const org = await prisma.organization.findFirst({
        where: { stripeCustomerId: customerId },
        select: { id: true },
      });
      if (org) {
        await prisma.organization.update({
          where: { id: org.id },
          data: { subscriptionStatus: "canceled", plan: "" },
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
