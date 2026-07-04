import type { Metadata } from "next";
import { addDays, addWeeks, startOfWeek } from "date-fns";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import { WeekNav } from "@/components/calendar/WeekNav";
import { AddPostForm } from "@/components/calendar/AddPostForm";
import { ClientAvatar } from "@/components/ui/ClientAvatar";

export const metadata: Metadata = { title: "Content Calendar" };

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: { week?: string };
}) {
  const offset = Number(searchParams.week ?? 0) || 0;
  const weekStart = startOfWeek(addWeeks(new Date(), offset), { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 6);

  const [posts, clients] = await Promise.all([
    prisma.contentPost.findMany({
      where: { scheduledDate: { gte: weekStart, lte: addDays(weekEnd, 1) } },
      include: { client: true },
    }),
    prisma.client.findMany({
      where: { status: { not: "CHURNED" } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, color: true },
    }),
  ]);

  return (
    <div className="page">
      <PageHeader
        title="Content Calendar"
        subtitle="Every client's posting schedule in one view."
        actions={<WeekNav weekStart={weekStart} weekEnd={weekEnd} offset={offset} />}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        {clients.map((c) => (
          <div key={c.id} className="flex items-center gap-1.5">
            <ClientAvatar name={c.name} color={c.color} size={20} />
            <span className="text-[12.5px] text-ink-dim">{c.name}</span>
          </div>
        ))}
      </div>

      <div className="mb-6">
        <AddPostForm
          clients={clients}
          defaultDate={new Date().toISOString().slice(0, 10)}
        />
      </div>

      <CalendarGrid weekStart={weekStart} posts={posts} />
    </div>
  );
}
