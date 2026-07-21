import { prisma } from "@/lib/prisma";
import { requireOrg, assertToolEnabled } from "@/lib/org";
import OutreachWriterClient from "./OutreachWriterClient";

export const metadata = { title: "Outreach Writer — Venture HQ" };
export const dynamic = "force-dynamic";

export default async function OutreachWriterPage() {
  const { orgId } = await requireOrg();
  await assertToolEnabled(orgId, "outreach-writer");
  const businesses = await prisma.business.findMany({
    where: { organizationId: orgId },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true },
  });
  return <OutreachWriterClient businesses={businesses} />;
}
