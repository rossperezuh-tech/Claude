import Link from "next/link";
import { startOfDay, subDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import TodayTaskRow from "@/components/TodayTaskRow";
import TodoAdd from "@/components/TodoAdd";
import { BUSINESS_STATUS_STYLES } from "@/lib/constants";
import { dueLabel, isOverdue } from "@/lib/dates";

export const dynamic = "force-dynamic";

type Search = { hide?: string };

const STATUS_RANK: Record<string, number> = { IN_PROGRESS: 0, THIS_WEEK: 1, BACKLOG: 2 };

/**
 * One to-do list across every venture: open tasks grouped by business,
 * each group sorted P1 → P3, then in-progress first, then soonest due.
 */
export default async function TodoPage({ searchParams }: { searchParams: Search }) {
  const hideBackBurner = searchParams.hide === "backburner";
  const today = startOfDay(new Date());

  const businesses = await prisma.business.findMany({
    where: hideBackBurner ? { status: { not: "back-burner" } } : undefined,
    orderBy: { sortOrder: "asc" },
    include: {
      tasks: { where: { status: { not: "DONE" } } },
      _count: { select: { tasks: { where: { status: "DONE", completedAt: { gte: subDays(today, 7) } } } } },
    },
  });

  for (const b of businesses) {
    b.tasks.sort(
      (a, c) =>
        a.priority.localeCompare(c.priority) ||
        (STATUS_RANK[a.status] ?? 9) - (STATUS_RANK[c.status] ?? 9) ||
        (a.dueDate?.getTime() ?? Infinity) - (c.dueDate?.getTime() ?? Infinity) ||
        a.createdAt.getTime() - c.createdAt.getTime()
    );
  }

  const withTasks = businesses.filter((b) => b.tasks.length > 0);
  const clear = businesses.filter((b) => b.tasks.length === 0);
  const all = businesses.flatMap((b) => b.tasks);
  const p1 = all.filter((t) => t.priority === "P1").length;
  const overdue = all.filter((t) => isOverdue(t.dueDate)).length;
  const doneWeek = businesses.reduce((n, b) => n + b._count.tasks, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-lg font-semibold">To-do — all ventures</h1>
        <div className="flex flex-wrap items-center gap-3 text-xs text-ink-faint">
          <span><b className="text-ink">{all.length}</b> open</span>
          <span><b className="text-red-400">{p1}</b> P1</span>
          <span><b className={overdue ? "text-red-400" : "text-ink"}>{overdue}</b> overdue</span>
          <span><b className="text-emerald-400">{doneWeek}</b> done in 7d</span>
          <Link
            href={hideBackBurner ? "/todo" : "/todo?hide=backburner"}
            className={`chip ${hideBackBurner ? "border-indigo-400/60 bg-indigo-400/10 text-indigo-300" : "border-surface-edge text-ink-dim hover:text-ink"}`}
          >
            Hide back-burner
          </Link>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {withTasks.map((b) => {
          const status = BUSINESS_STATUS_STYLES[b.status];
          return (
            <section key={b.id} className="card min-w-0 p-4" style={{ borderTop: `3px solid ${b.color}` }}>
              <header className="mb-1 flex items-center gap-2">
                <Link href={`/business/${b.slug}`} className="font-medium hover:underline" style={{ color: b.color }}>
                  {b.name}
                </Link>
                {status && <span className={`chip ${status.className}`}>{status.label}</span>}
                <span className="ml-auto text-xs text-ink-faint">
                  {b.tasks.length} open{b._count.tasks ? ` · ${b._count.tasks} done 7d` : ""}
                </span>
              </header>
              <ul className="divide-y divide-surface-edge/60">
                {b.tasks.map((t) => (
                  <TodayTaskRow
                    key={t.id}
                    hideBusiness
                    task={{
                      id: t.id,
                      title: t.title,
                      priority: t.priority,
                      dueDate: t.dueDate?.toISOString() ?? null,
                      dueText: t.dueDate ? dueLabel(t.dueDate) : t.status === "IN_PROGRESS" ? "in progress" : "",
                      overdue: isOverdue(t.dueDate),
                      business: { name: b.name, slug: b.slug, color: b.color },
                    }}
                  />
                ))}
              </ul>
              <TodoAdd businessId={b.id} color={b.color} />
            </section>
          );
        })}
      </div>

      {clear.length > 0 && (
        <div className="card p-4">
          <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-faint">All clear — add something</h2>
          <div className="grid gap-x-6 gap-y-1 md:grid-cols-2">
            {clear.map((b) => (
              <div key={b.id} className="min-w-0">
                <Link href={`/business/${b.slug}`} className="text-sm hover:underline" style={{ color: b.color }}>
                  {b.name}
                </Link>
                <TodoAdd businessId={b.id} color={b.color} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
