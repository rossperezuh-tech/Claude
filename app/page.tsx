import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";
import { requireOrg } from "@/lib/org";
import QuickCapture from "@/components/QuickCapture";
import TodayTaskRow from "@/components/TodayTaskRow";
import CalendarStrip from "@/components/CalendarStrip";
import NewBusinessForm from "@/components/NewBusinessForm";
import VentureGrid from "@/components/VentureGrid";
import { dueLabel } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { orgId } = await requireOrg();
  const now = new Date();
  const [businesses, todayTasks] = await Promise.all([
    prisma.business.findMany({
      where: { organizationId: orgId },
      orderBy: { sortOrder: "asc" },
      include: {
        tasks: {
          where: { status: { not: "DONE" } },
          orderBy: { dueDate: "asc" },
          select: { id: true, dueDate: true },
        },
      },
    }),
    prisma.task.findMany({
      where: {
        business: { organizationId: orgId },
        status: { not: "DONE" },
        dueDate: { lte: endOfDay(now) },
      },
      orderBy: [{ dueDate: "asc" }],
      include: { business: { select: { name: true, slug: true, color: true } } },
    }),
  ]);

  // First visit: no businesses yet — onboard instead of an empty dashboard.
  if (businesses.length === 0) {
    return (
      <div className="mx-auto max-w-lg space-y-4 pt-12">
        <div className="text-center">
          <h1 className="text-xl font-semibold tracking-tight">Welcome to Venture HQ</h1>
          <p className="mt-2 text-sm text-ink-dim">
            One command center for everything you run — tasks, deadlines, documents, contacts,
            and AI tools, organized per venture. Add your first business to get started.
          </p>
        </div>
        <div className="card p-4">
          <NewBusinessForm autoFocus />
        </div>
      </div>
    );
  }

  const overdueCount = todayTasks.filter(
    (t) => t.dueDate && t.dueDate < startOfDay(now)
  ).length;

  const upcoming = await prisma.task.findMany({
    where: {
      business: { organizationId: orgId },
      status: { not: "DONE" },
      dueDate: { gte: startOfDay(now), lte: new Date(now.getTime() + 14 * 86_400_000) },
    },
    orderBy: { dueDate: "asc" },
    include: { business: { select: { name: true, slug: true, color: true } } },
  });

  return (
    <div className="space-y-5">
      <QuickCapture
        businesses={businesses.map((b) => ({ id: b.id, name: b.name, color: b.color }))}
      />

      {/* Today panel */}
      <section className="card p-4">
        <div className="mb-3 flex items-baseline gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-dim">Today</h2>
          <span className="text-xs text-ink-faint">
            {todayTasks.length} due{overdueCount > 0 && `, ${overdueCount} overdue`}
          </span>
        </div>
        {todayTasks.length === 0 ? (
          <p className="text-sm text-ink-faint">Nothing due today. Clear runway.</p>
        ) : (
          <ul className="divide-y divide-surface-edge/60">
            {todayTasks.map((t) => (
              <TodayTaskRow
                key={t.id}
                task={{
                  id: t.id,
                  title: t.title,
                  dueDate: t.dueDate?.toISOString() ?? null,
                  dueText: dueLabel(t.dueDate),
                  overdue: !!t.dueDate && t.dueDate < startOfDay(now),
                  business: t.business,
                }}
              />
            ))}
          </ul>
        )}
      </section>

      {/* Business grid */}
      <section>
        <div className="mb-3 flex items-baseline gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-dim">Ventures</h2>
          <span className="text-xs text-ink-faint">drag to reorder</span>
        </div>
        <VentureGrid
          businesses={businesses.map((b) => {
            const nextDue = b.tasks.find((t) => t.dueDate)?.dueDate ?? null;
            return {
              id: b.id,
              name: b.name,
              slug: b.slug,
              color: b.color,
              description: b.description,
              logoUrl: b.logoUrl,
              openCount: b.tasks.length,
              nextDueLabel: nextDue ? dueLabel(nextDue) : null,
            };
          })}
        />
      </section>

      {/* 14-day calendar grid */}
      <CalendarStrip
        tasks={upcoming.map((t) => ({
          id: t.id,
          title: t.title,
          dueDate: t.dueDate!.toISOString(),
          business: t.business,
        }))}
      />
    </div>
  );
}
