import { prisma } from "@/lib/prisma";
import { requireOrg, assertToolEnabled } from "@/lib/org";
import MarketResearchClient from "./MarketResearchClient";

export const metadata = { title: "Market Research — Venture HQ" };
export const dynamic = "force-dynamic";

export default async function MarketResearchPage() {
  const { orgId } = await requireOrg();
  await assertToolEnabled(orgId, "market-research");
  const businesses = await prisma.business.findMany({
    where: { organizationId: orgId },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true },
  });
  return <MarketResearchClient businesses={businesses} />;
}
