import { prisma } from "@/lib/prisma";
import { requireOrg, assertToolEnabled } from "@/lib/org";
import TaskCreatorClient from "./TaskCreatorClient";

export const metadata = { title: "Task Creator — Venture HQ" };
export const dynamic = "force-dynamic";

export default async function TaskCreatorPage() {
  const { orgId } = await requireOrg();
  await assertToolEnabled(orgId, "task-creator");
  const businesses = await prisma.business.findMany({
    where: { organizationId: orgId },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, slug: true, color: true },
  });
  return <TaskCreatorClient businesses={businesses} />;
}
