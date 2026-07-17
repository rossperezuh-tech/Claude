import { prisma } from "@/lib/prisma";
import { requireOrg, assertToolEnabled } from "@/lib/org";
import BrainDumpClient from "./BrainDumpClient";

export const metadata = { title: "Brain Dump — Venture HQ" };
export const dynamic = "force-dynamic";

export default async function BrainDumpPage() {
  const { orgId } = await requireOrg();
  await assertToolEnabled(orgId, "brain-dump");
  const businesses = await prisma.business.findMany({
    where: { organizationId: orgId },
    orderBy: { sortOrder: "asc" },
    select: { slug: true, name: true, color: true },
  });
  return <BrainDumpClient businesses={businesses} />;
}
