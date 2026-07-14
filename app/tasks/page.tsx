import Link from "next/link";
import { endOfDay, startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/org";
import TodayTaskRow from "@/components/TodayTaskRow";
import NewTaskForm from "@/components/NewTaskForm";
import { PRIORITIES, STATUS_LABELS, type TaskStatus } from "@/lib/constants";
import { dueLabel, isOverdue } from "@/lib/dates";

export const dynamic = "force-dynamic";

type Search = { business?: string; priority?: string; due?: string; done?: string };

function filterLink(current: Search, patch: Partial<Search>): string {
  const merged = { ...current, ...patch };
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v);
  const qs = params.toString();
  return qs ? `/tasks?${qs}` : "/tasks";
}

export default async function TasksPage({ searchParams }: { searchParams: Search }) {
  const { orgId } = await requireOrg();
  const now = new Date();
  const businesses = await prisma.business.findMany({
    where: { organizationId: orgId },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, slug: true, color: true },
  });

  const where: Record<string, unknown> = {
    business: { organizationId: orgId },
  };
  if (searchParams.done === "1") where.status = "DONE";
  else where.status = { not: "DONE" };
  if (searchParams.business)
    where.business = { organizationId: orgId, slug: searchParams.business };
  if (searchParams.priority) where.priority = searchParams.priority;
  if (searchParams.due === "overdue") where.dueDate = { lt: startOfDay(now) };
  else if (searchParams.due === "today") where.dueDate = { gte: startOfDay(now), lte: endOfDay(now) };
  else if (searchParams.due === "week")
    where.dueDate = { lte: new Date(now.getTime() + 7 * 86_400_000) };

  const tasks = await prisma.task.findMany({
    where,
    orderBy: [{ dueDate: "asc" }, { priority: "asc" }, { createdAt: "desc" }],
    include: { business: { select: { name: true, slug: true, color: true } } },
  });

  const activeChip = "border-indigo-400/60 bg-indigo-400/10 text-indigo-300";
  const idleChip = "border-surface-edge text-ink-dim hover:text-ink";

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-lg font-semibold">All tasks</h1>
        <span className="text-xs text-ink-faint">{tasks.length} shown</span>
      </div>

      <NewTaskForm businesses={businesses} />

      {/* Filters */}
      <div className="card flex flex-wrap items-center gap-x-4 gap-y-2 p-3 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-ink-faint">Business:</span>
          <Link href={filterLink(searchParams, { business: undefined })} className={`chip ${!searchParams.business ? activeChip : idleChip}`}>
            All
          </Link>
          {businesses.map((b) => (
            <Link
              key={b.id}
              href={filterLink(searchParams, { business: b.slug })}
              className={`chip ${searchParams.business === b.slug ? activeChip : idleChip}`}
              style={searchParams.business === b.slug ? { borderColor: b.color, color: b.color, background: `${b.color}14` } : undefined}
            >
              {b.name}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-ink-faint">Priority:</span>
          <Link href={filterLink(searchParams, { priority: undefined })} className={`chip ${!searchParams.priority ? activeChip : idleChip}`}>
            All
          </Link>
          {PRIORITIES.map((p) => (
            <Link key={p} href={filterLink(searchParams, { priority: p })} className={`chip ${searchParams.priority === p ? activeChip : idleChip}`}>
              {p}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-ink-faint">Due:</span>
          {[
            ["", "All"],
            ["overdue", "Overdue"],
            ["today", "Today"],
            ["week", "7 days"],
          ].map(([v, label]) => (
            <Link key={label} href={filterLink(searchParams, { due: v || undefined })} className={`chip ${(searchParams.due ?? "") === v ? activeChip : idleChip}`}>
              {label}
            </Link>
          ))}
        </div>
        <Link
          href={filterLink(searchParams, { done: searchParams.done === "1" ? undefined : "1" })}
          className={`chip ${searchParams.done === "1" ? activeChip : idleChip}`}
        >
          Done only
        </Link>
      </div>

      {/* Task list */}
      <div className="card p-4">
        {tasks.length === 0 ? (
          <p className="text-sm text-ink-faint">No tasks match these filters.</p>
        ) : (
          <ul className="divide-y divide-surface-edge/60">
            {tasks.map((t) =>
              t.status === "DONE" ? (
                <li key={t.id} className="flex items-center gap-3 py-2 text-ink-faint">
                  <span className="text-emerald-400">✓</span>
                  <span className="chip border-transparent bg-surface-overlay">{t.priority}</span>
                  <span className="min-w-0 flex-1 truncate text-sm line-through">{t.title}</span>
                  <span className="chip hidden border-transparent sm:inline-flex" style={{ color: t.business.color, background: `${t.business.color}1a` }}>
                    {t.business.name}
                  </span>
                </li>
              ) : (
                <TodayTaskRow
                  key={t.id}
                  task={{
                    id: t.id,
                    title: t.title,
                    priority: t.priority,
                    dueDate: t.dueDate?.toISOString() ?? null,
                    dueText: t.dueDate ? dueLabel(t.dueDate) : `· ${STATUS_LABELS[t.status as TaskStatus] ?? t.status}`,
                    overdue: isOverdue(t.dueDate),
                    business: t.business,
                  }}
                />
              )
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
