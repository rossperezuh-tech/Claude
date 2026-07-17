import { prisma } from "@/lib/prisma";
import { requireOrg, assertToolEnabled } from "@/lib/org";
import ProposalsClient from "./ProposalsClient";

export const metadata = { title: "Proposals & Invoices — Venture HQ" };
export const dynamic = "force-dynamic";

export default async function ProposalsPage() {
  const { orgId } = await requireOrg();
  await assertToolEnabled(orgId, "proposals");
  const [businesses, pipelineItems] = await Promise.all([
    prisma.business.findMany({
      where: { organizationId: orgId },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, color: true },
    }),
    prisma.pipelineItem.findMany({
      where: { business: { organizationId: orgId }, stage: { not: "DONE" } },
      orderBy: { updatedAt: "desc" },
      take: 30,
      select: { id: true, name: true, kind: true, valueCts: true, contact: true, notes: true, businessId: true },
    }),
  ]);
  return <ProposalsClient businesses={businesses} pipelineItems={pipelineItems} />;
}
