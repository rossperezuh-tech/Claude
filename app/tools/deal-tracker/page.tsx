import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/org";
import DealTrackerClient from "./DealTrackerClient";

export const metadata = { title: "Deal Tracker — Venture HQ" };
export const dynamic = "force-dynamic";

export default async function DealTrackerPage() {
  const { orgId } = await requireOrg();
  const [businesses, deals] = await Promise.all([
    prisma.business.findMany({
      where: { organizationId: orgId },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, color: true },
    }),
    prisma.deal.findMany({
      where: { business: { organizationId: orgId } },
      orderBy: [{ targetClose: "asc" }, { updatedAt: "desc" }],
      include: { business: { select: { name: true, color: true } } },
    }),
  ]);

  return (
    <DealTrackerClient
      businesses={businesses}
      deals={deals.map((d) => ({
        id: d.id,
        name: d.name,
        stage: d.stage,
        address: d.address,
        askingCts: d.askingCts,
        offerCts: d.offerCts,
        contact: d.contact,
        targetClose: d.targetClose?.toISOString().slice(0, 10) ?? null,
        notes: d.notes,
        businessName: d.business.name,
        businessColor: d.business.color,
      }))}
    />
  );
}
