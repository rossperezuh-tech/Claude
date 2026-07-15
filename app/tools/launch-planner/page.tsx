import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/org";
import LaunchPlannerClient from "./LaunchPlannerClient";

export const metadata = { title: "Launch Planner — Venture HQ" };
export const dynamic = "force-dynamic";

export default async function LaunchPlannerPage() {
  const { orgId } = await requireOrg();
  const businesses = await prisma.business.findMany({
    where: { organizationId: orgId },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, slug: true, color: true },
  });
  return <LaunchPlannerClient businesses={businesses} />;
}
