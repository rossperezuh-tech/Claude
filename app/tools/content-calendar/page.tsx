import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/org";
import ContentCalendarClient from "./ContentCalendarClient";

export const metadata = { title: "Content Calendar — Venture HQ" };
export const dynamic = "force-dynamic";

export default async function ContentCalendarPage() {
  const { orgId } = await requireOrg();
  const [businesses, posts] = await Promise.all([
    prisma.business.findMany({
      where: { organizationId: orgId },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, color: true },
    }),
    prisma.contentPost.findMany({
      where: { business: { organizationId: orgId } },
      orderBy: [{ scheduledFor: "asc" }, { createdAt: "desc" }],
      include: { business: { select: { name: true, color: true } } },
    }),
  ]);

  return (
    <ContentCalendarClient
      businesses={businesses}
      posts={posts.map((p) => ({
        id: p.id,
        title: p.title,
        platform: p.platform,
        status: p.status,
        scheduledFor: p.scheduledFor?.toISOString().slice(0, 10) ?? null,
        content: p.content,
        hashtags: p.hashtags,
        businessName: p.business.name,
        businessColor: p.business.color,
      }))}
    />
  );
}
