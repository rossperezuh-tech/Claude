import { prisma } from "@/lib/prisma";
import { requireOrg, assertToolEnabled } from "@/lib/org";
import GoalsClient from "./GoalsClient";

export const metadata = { title: "Goals & KPI Tracker — Venture HQ" };
export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const { orgId } = await requireOrg();
  await assertToolEnabled(orgId, "goals");
  const [businesses, goals] = await Promise.all([
    prisma.business.findMany({
      where: { organizationId: orgId },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, color: true },
    }),
    prisma.goal.findMany({
      where: { business: { organizationId: orgId }, status: { not: "ARCHIVED" } },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: { business: { select: { name: true, color: true } } },
    }),
  ]);

  const rows = goals.map((g) => ({
    id: g.id,
    title: g.title,
    targetNum: g.targetNum,
    currentNum: g.currentNum,
    unit: g.unit,
    dueDate: g.dueDate ? g.dueDate.toISOString() : null,
    status: g.status,
    business: g.business,
  }));

  return <GoalsClient businesses={businesses} goals={rows} />;
}
