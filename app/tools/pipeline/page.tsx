import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/org";
import PipelineClient from "./PipelineClient";

export const metadata = { title: "Client & Order Tracker — Venture HQ" };
export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const { orgId } = await requireOrg();
  const [businesses, items] = await Promise.all([
    prisma.business.findMany({
      where: { organizationId: orgId },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, color: true },
    }),
    prisma.pipelineItem.findMany({
      where: { business: { organizationId: orgId } },
      orderBy: { updatedAt: "desc" },
      include: { business: { select: { name: true, color: true } } },
    }),
  ]);

  return (
    <PipelineClient
      businesses={businesses}
      items={items.map((i) => ({
        id: i.id,
        name: i.name,
        kind: i.kind,
        stage: i.stage,
        valueCts: i.valueCts,
        contact: i.contact,
        notes: i.notes,
        businessName: i.business.name,
        businessColor: i.business.color,
      }))}
    />
  );
}
