import { prisma } from "@/lib/prisma";
import { requireOrg, assertToolEnabled } from "@/lib/org";
import ContentStudioClient from "./ContentStudioClient";

export const metadata = { title: "Content Studio — Venture HQ" };
export const dynamic = "force-dynamic";

export default async function ContentStudioPage() {
  const { orgId } = await requireOrg();
  await assertToolEnabled(orgId, "content-studio");
  const businesses = await prisma.business.findMany({
    where: { organizationId: orgId },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, color: true, brandVoice: true },
  });
  return <ContentStudioClient businesses={businesses} />;
}
