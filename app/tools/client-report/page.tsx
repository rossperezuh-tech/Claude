import { prisma } from "@/lib/prisma";
import { requireOrg, assertToolEnabled } from "@/lib/org";
import ClientReportClient from "./ClientReportClient";

export const metadata = { title: "Client Report — Venture HQ" };
export const dynamic = "force-dynamic";

export default async function ClientReportPage() {
  const { orgId } = await requireOrg();
  await assertToolEnabled(orgId, "client-report");
  const businesses = await prisma.business.findMany({
    where: { organizationId: orgId },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true },
  });
  return <ClientReportClient businesses={businesses} />;
}
