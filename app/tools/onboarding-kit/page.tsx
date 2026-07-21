import { prisma } from "@/lib/prisma";
import { requireOrg, assertToolEnabled } from "@/lib/org";
import OnboardingKitClient from "./OnboardingKitClient";

export const metadata = { title: "Onboarding Kit — Venture HQ" };
export const dynamic = "force-dynamic";

export default async function OnboardingKitPage() {
  const { orgId } = await requireOrg();
  await assertToolEnabled(orgId, "onboarding-kit");
  const businesses = await prisma.business.findMany({
    where: { organizationId: orgId },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true },
  });
  return <OnboardingKitClient businesses={businesses} />;
}
