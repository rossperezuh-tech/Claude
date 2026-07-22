import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/org";
import { isPlatformAdmin } from "@/lib/admin";
import { isActive, billingConfigured } from "@/lib/billing";

export const dynamic = "force-dynamic";

// Paywall: once billing is configured, non-owner accounts need an active
// subscription (or trial) to use the tools. The owner is always exempt, and
// nothing is gated until Stripe is set up.
export default async function ToolsLayout({ children }: { children: React.ReactNode }) {
  if (!billingConfigured()) return <>{children}</>;
  if (await isPlatformAdmin()) return <>{children}</>;

  const { orgId } = await requireOrg();
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { subscriptionStatus: true },
  });
  if (!isActive(org?.subscriptionStatus)) redirect("/billing");

  return <>{children}</>;
}
