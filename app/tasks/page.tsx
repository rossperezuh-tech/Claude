import Link from "next/link";
import { endOfDay, startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/org";
import TodayTaskRow from "@/components/TodayTaskRow";
import NewTaskForm from "@/components/NewTaskForm";
import { STATUS_LABELS, type TaskStatus } from "@/lib/constants";
import { dueLabel, isOverdue } from "@/lib/dates";

export const dynamic = "force-dynamic";

// `business` holds a comma-separated list of slugs so several ventures can be
// filtered at once (empty/absent = all).
type Search = { business?: string; due?: string; done?: string };

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

  // Parse the selected venture slugs, ignoring anything not in this org.
  const knownSlugs = new Set(businesses.map((b) => b.slug));
  const selected = (searchParams.business ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s && knownSlugs.has(s));

  // Clicking a venture chip adds/removes it from the selection.
  function toggleBusiness(slug: string): string | undefined {
    const next = selected.includes(slug)
      ? selected.filter((s) => s !== slug)
      : [...selected, slug];
    return next.length ? next.join(",") : undefined;
  }

  const where: Record<string, unknown> = {
    business: { organizationId: orgId },
  };
  if (searchParams.done === "1") where.status = "DONE";
  else where.status = { not: "DONE" };
  if (selected.length > 0)
    where.business = { organizationId: orgId, slug: { in: selected } };
  if (searchParams.due === "overdue") where.dueDate = { lt: startOfDay(now) };
  else if (searchParams.due === "today") where.dueDate = { gte: startOfDay(now), lte: endOfDay(now) };
  else if (searchParams.due === "week")
    where.dueDate = { lte: new Date(now.getTime() + 7 * 86_400_000) };

  const tasks = await prisma.task.findMany({
    where,
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
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
          <Link
            href={filterLink(searchParams, { business: undefined })}
            className={`chip ${selected.length === 0 ? activeChip : idleChip}`}
          >
            All
          </Link>
          {businesses.map((b) => {
            const on = selected.includes(b.slug);
            return (
              <Link
                key={b.id}
                href={filterLink(searchParams, { business: toggleBusiness(b.slug) })}
                className={`chip ${on ? activeChip : idleChip}`}
                style={on ? { borderColor: b.color, color: b.color, background: `${b.color}14` } : undefined}
              >
                {on && <span className="mr-1">✓</span>}
                {b.name}
              </Link>
            );
          })}
          {selected.length > 0 && (
            <span className="text-ink-faint">
              {selected.length} selected · click to add or remove
            </span>
          )}
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
