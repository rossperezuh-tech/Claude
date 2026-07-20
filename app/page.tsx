import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";
import { requireOrg } from "@/lib/org";
import QuickCapture from "@/components/QuickCapture";
import TodayTaskRow from "@/components/TodayTaskRow";
import CalendarStrip from "@/components/CalendarStrip";
import NewBusinessForm from "@/components/NewBusinessForm";
import { BUSINESS_STATUS_STYLES } from "@/lib/constants";
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

      {/* 14-day calendar strip */}
      <CalendarStrip
        tasks={upcoming.map((t) => ({
          id: t.id,
          title: t.title,
          dueDate: t.dueDate!.toISOString(),
          business: t.business,
        }))}
      />

      {/* Business grid */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-dim">
          Ventures
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {businesses.map((b) => {
            const nextDue = b.tasks.find((t) => t.dueDate)?.dueDate ?? null;
            const badge = BUSINESS_STATUS_STYLES[b.status] ?? BUSINESS_STATUS_STYLES.active;
            return (
              <Link
                key={b.id}
                href={`/business/${b.slug}`}
                className="card group p-4 transition-colors hover:bg-surface-overlay"
                style={{ borderLeft: `3px solid ${b.color}` }}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium leading-tight group-hover:text-white">{b.name}</h3>
                  <span className={`chip shrink-0 ${badge.className}`}>{badge.label}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-ink-faint">{b.description}</p>
                <div className="mt-3 flex items-center gap-3 text-xs text-ink-dim">
                  <span>
                    <span className="font-semibold text-ink">{b.tasks.length}</span> open
                  </span>
                  {nextDue && (
                    <span>
                      next due{" "}
                      <span className="font-medium" style={{ color: b.color }}>
                        {dueLabel(nextDue)}
                      </span>
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
          <div className="card border-dashed p-4">
            <NewBusinessForm compact />
          </div>
        </div>
      </section>
    </div>
  );
}
