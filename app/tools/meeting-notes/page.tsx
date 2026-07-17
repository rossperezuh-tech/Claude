import { prisma } from "@/lib/prisma";
import { requireOrg, assertToolEnabled } from "@/lib/org";
import MeetingNotesClient from "./MeetingNotesClient";

export const metadata = { title: "Meeting Notes — Venture HQ" };
export const dynamic = "force-dynamic";

export default async function MeetingNotesPage() {
  const { orgId } = await requireOrg();
  await assertToolEnabled(orgId, "meeting-notes");
  const businesses = await prisma.business.findMany({
    where: { organizationId: orgId },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, color: true },
  });
  return <MeetingNotesClient businesses={businesses} />;
}
