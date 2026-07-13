import { prisma } from "@/lib/prisma";
import MeetingNotesClient from "./MeetingNotesClient";

export const metadata = { title: "Meeting Notes — Venture HQ" };
export const dynamic = "force-dynamic";

export default async function MeetingNotesPage() {
  const businesses = await prisma.business.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, color: true },
  });
  return <MeetingNotesClient businesses={businesses} />;
}
