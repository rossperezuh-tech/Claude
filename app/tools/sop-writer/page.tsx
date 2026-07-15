import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/org";
import SopWriterClient from "./SopWriterClient";

export const metadata = { title: "SOP Writer — Venture HQ" };
export const dynamic = "force-dynamic";

export default async function SopWriterPage() {
  const { orgId } = await requireOrg();
  const businesses = await prisma.business.findMany({
    where: { organizationId: orgId },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true },
  });
  return <SopWriterClient businesses={businesses} />;
}
