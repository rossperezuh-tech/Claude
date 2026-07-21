import { prisma } from "@/lib/prisma";
import { requireOrg, assertToolEnabled } from "@/lib/org";
import CashFlowClient from "./CashFlowClient";

export const metadata = { title: "Cash Flow Forecaster — Venture HQ" };
export const dynamic = "force-dynamic";

export default async function CashFlowPage() {
  const { orgId } = await requireOrg();
  await assertToolEnabled(orgId, "cash-flow");
  const businesses = await prisma.business.findMany({
    where: { organizationId: orgId },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true },
  });
  return <CashFlowClient businesses={businesses} />;
}
