import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/org";
import { isPlatformAdmin } from "@/lib/admin";
import { PLANS, isActive, billingConfigured } from "@/lib/billing";
import BillingClient from "./BillingClient";

export const metadata = { title: "Billing — Venture HQ" };
export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const { orgId } = await requireOrg();
  const [org, admin] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        subscriptionStatus: true,
        plan: true,
        currentPeriodEnd: true,
        stripeCustomerId: true,
      },
    }),
    isPlatformAdmin(),
  ]);

  return (
    <BillingClient
      configured={billingConfigured()}
      isOwner={admin}
      status={org?.subscriptionStatus ?? "none"}
      active={isActive(org?.subscriptionStatus)}
      currentPlan={org?.plan ?? ""}
      hasCustomer={!!org?.stripeCustomerId}
      periodEnd={org?.currentPeriodEnd ? org.currentPeriodEnd.toISOString() : null}
      plans={PLANS.map((p) => ({ id: p.id, name: p.name, priceDollars: p.priceDollars, blurb: p.blurb }))}
    />
  );
}
