import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, format } from "date-fns";
import QuickCapture from "@/components/QuickCapture";
import TodayTaskRow from "@/components/TodayTaskRow";
import CalendarStrip from "@/components/CalendarStrip";
import { BUSINESS_STATUS_STYLES } from "@/lib/constants";
import { dueLabel } from "@/lib/dates";

export const dynamic = "force-dynamic";

function StatTile({
  label,
  value,
  href,
  alert,
}: {
  label: string;
  value: number;
  href?: string;
  alert?: boolean;
}) {
  const body = (
    <>
      <div className="text-xs text-ink-dim">{label}</div>
      <div
        className={`mt-1 text-2xl font-semibold leading-none ${
          alert && value > 0 ? "text-red-400" : "text-ink"
        }`}
      >
        {value}
      </div>
    </>
  );
  const base = "card px-3.5 py-3";
  return href ? (
    <Link href={href} className={`${base} transition-colors hover:bg-surface-overlay`}>
      {body}
    </Link>
  ) : (
    <div className={base}>{body}</div>
  );
}

export default async function HomePage() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const in7days = new Date(now.getTime() + 7 * 86_400_000);

  const [businesses, todayTasks, upcoming] = await Promise.all([
    prisma.business.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        tasks: {
          where: { status: { not: "DONE" } },
          orderBy: { dueDate: "asc" },
          select: { id: true, status: true, priority: true, dueDate: true },
        },
        _count: { select: { documents: true, contacts: true } },
      },
    }),
    prisma.task.findMany({
      where: { status: { not: "DONE" }, dueDate: { lte: endOfDay(now) } },
      orderBy: [{ priority: "asc" }, { dueDate: "asc" }],
      include: { business: { select: { name: true, slug: true, color: true } } },
    }),
    prisma.task.findMany({
      where: {
        status: { not: "DONE" },
        dueDate: { gte: todayStart, lte: new Date(now.getTime() + 14 * 86_400_000) },
      },
      orderBy: { dueDate: "asc" },
      include: { business: { select: { name: true, slug: true, color: true } } },
    }),
  ]);

  // Fleet-wide rollup
  const allOpen = businesses.flatMap((b) => b.tasks);
  const openCount = allOpen.length;
  const overdueCount = allOpen.filter((t) => t.dueDate && t.dueDate < todayStart).length;
  const dueTodayCount = allOpen.filter(
    (t) => t.dueDate && t.dueDate >= todayStart && t.dueDate <= endOfDay(now)
  ).length;
  const dueWeekCount = allOpen.filter(
    (t) => t.dueDate && t.dueDate >= todayStart && t.dueDate <= in7days
  ).length;
  const p1Count = allOpen.filter((t) => t.priority === "P1").length;

  // Per-business rollup for attention panel + venture cards
  const rollups = businesses.map((b) => {
    const overdue = b.tasks.filter((t) => t.dueDate && t.dueDate < todayStart);
    const oldestOverdueDays = overdue.length
      ? Math.max(
          ...overdue.map((t) =>
            Math.round((todayStart.getTime() - startOfDay(t.dueDate!).getTime()) / 86_400_000)
          )
        )
      : 0;
    return {
      business: b,
      overdue: overdue.length,
      oldestOverdueDays,
      p1DueSoon: b.tasks.filter(
        (t) => t.priority === "P1" && t.dueDate && t.dueDate <= in7days
      ).length,
      byStatus: {
        BACKLOG: b.tasks.filter((t) => t.status === "BACKLOG").length,
        THIS_WEEK: b.tasks.filter((t) => t.status === "THIS_WEEK").length,
        IN_PROGRESS: b.tasks.filter((t) => t.status === "IN_PROGRESS").length,
      },
      nextDue: b.tasks.find((t) => t.dueDate)?.dueDate ?? null,
    };
  });

  const attention = rollups
    .filter((r) => r.overdue > 0 || r.p1DueSoon > 0)
    .sort((a, b) => b.overdue - a.overdue || b.p1DueSoon - a.p1DueSoon);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-lg font-semibold tracking-tight">Mission Control</h1>
        <span className="text-xs text-ink-faint">
          {format(now, "EEEE, MMM d")} · {businesses.length} ventures · {openCount} open tasks
        </span>
      </div>

      <QuickCapture
        businesses={businesses.map((b) => ({ id: b.id, name: b.name, color: b.color }))}
      />

      {/* Fleet KPIs */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile label="Open tasks" value={openCount} href="/tasks" />
        <StatTile label="Overdue" value={overdueCount} href="/tasks?due=overdue" alert />
        <StatTile label="Due today" value={dueTodayCount} href="/tasks?due=today" />
        <StatTile label="Next 7 days" value={dueWeekCount} href="/tasks?due=week" />
        <StatTile label="P1 open" value={p1Count} href="/tasks?priority=P1" />
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
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
                    priority: t.priority,
                    dueDate: t.dueDate?.toISOString() ?? null,
                    dueText: dueLabel(t.dueDate),
                    overdue: !!t.dueDate && t.dueDate < todayStart,
                    business: t.business,
                  }}
                />
              ))}
            </ul>
          )}
        </section>

        {/* Needs attention */}
        <section className="card p-4">
          <div className="mb-3 flex items-baseline gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-dim">
              Needs attention
            </h2>
            <span className="text-xs text-ink-faint">overdue or P1 due this week</span>
          </div>
          {attention.length === 0 ? (
            <p className="text-sm text-ink-faint">All ventures clear. Nothing on fire.</p>
          ) : (
            <ul className="divide-y divide-surface-edge/60">
              {attention.map(({ business: b, overdue, oldestOverdueDays, p1DueSoon }) => (
                <li key={b.id} className="flex items-center gap-3 py-2">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: b.color }}
                  />
                  <Link
                    href={`/business/${b.slug}`}
                    className="min-w-0 flex-1 truncate text-sm hover:text-white hover:underline"
                  >
                    {b.name}
                  </Link>
                  {overdue > 0 && (
                    <span className="chip shrink-0 border-red-500/30 bg-red-500/10 text-red-400">
                      {overdue} overdue · {oldestOverdueDays}d
                    </span>
                  )}
                  {p1DueSoon > 0 && (
                    <span className="chip shrink-0 border-amber-500/30 bg-amber-500/10 text-amber-400">
                      {p1DueSoon} P1 this wk
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* 14-day calendar strip */}
      <CalendarStrip
        tasks={upcoming.map((t) => ({
          id: t.id,
          title: t.title,
          dueDate: t.dueDate!.toISOString(),
          business: t.business,
        }))}
      />

      {/* Venture board */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-dim">
          Ventures
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rollups.map(({ business: b, overdue, byStatus, nextDue }) => {
            const badge = BUSINESS_STATUS_STYLES[b.status] ?? BUSINESS_STATUS_STYLES.active;
            const open = b.tasks.length;
            const pipeline = [
              { label: "backlog", count: byStatus.BACKLOG, opacity: 0.3 },
              { label: "this week", count: byStatus.THIS_WEEK, opacity: 0.55 },
              { label: "in progress", count: byStatus.IN_PROGRESS, opacity: 1 },
            ].filter((s) => s.count > 0);
            return (
              <Link
                key={b.id}
                href={`/business/${b.slug}`}
                className="card group flex flex-col p-4 transition-colors hover:bg-surface-overlay"
                style={{ borderLeft: `3px solid ${b.color}` }}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium leading-tight group-hover:text-white">{b.name}</h3>
                  <span className={`chip shrink-0 ${badge.className}`}>{badge.label}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-ink-faint">{b.description}</p>

                <div className="mt-3 flex items-center gap-3 text-xs text-ink-dim">
                  <span>
                    <span className="font-semibold text-ink">{open}</span> open
                  </span>
                  {overdue > 0 && (
                    <span className="font-medium text-red-400">{overdue} overdue</span>
                  )}
                  {nextDue && (
                    <span>
                      next due{" "}
                      <span className="font-medium" style={{ color: b.color }}>
                        {dueLabel(nextDue)}
                      </span>
                    </span>
                  )}
                </div>

                {/* Open-task pipeline: backlog → this week → in progress */}
                {pipeline.length > 0 && (
                  <div className="mt-2.5">
                    <div className="flex h-1.5 w-full gap-[2px] overflow-hidden rounded-full">
                      {pipeline.map((s) => (
                        <span
                          key={s.label}
                          className="h-full rounded-[2px]"
                          style={{
                            flexGrow: s.count,
                            background: b.color,
                            opacity: s.opacity,
                          }}
                        />
                      ))}
                    </div>
                    <div className="mt-1.5 text-[11px] text-ink-faint">
                      {pipeline.map((s) => `${s.count} ${s.label}`).join(" · ")}
                    </div>
                  </div>
                )}

                <div className="mt-auto pt-3 text-[11px] text-ink-faint">
                  {b._count.documents} docs · {b._count.contacts} contacts
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
