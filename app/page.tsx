import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";
import { requireOrg } from "@/lib/org";
import QuickCapture from "@/components/QuickCapture";
import TodayTaskRow from "@/components/TodayTaskRow";
import CalendarStrip from "@/components/CalendarStrip";
import NewBusinessForm from "@/components/NewBusinessForm";
import VentureGrid from "@/components/VentureGrid";
import DashboardPicker from "@/components/DashboardPicker";
import { getDashboardTemplate, type DashboardPanel } from "@/lib/dashboards";
import { TOOLS } from "@/lib/tools";
import { dueLabel } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { orgId } = await requireOrg();
  const now = new Date();
  const [businesses, todayTasks, org] = await Promise.all([
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
    prisma.organization.findUnique({
      where: { id: orgId },
      select: { dashboardTemplate: true, enabledTools: true },
    }),
  ]);

  const template = getDashboardTemplate(org?.dashboardTemplate);
  const enabled = org?.enabledTools ?? [];
  const featuredTools = template.featured
    .map((slug) => TOOLS.find((t) => t.slug === slug))
    .filter((t): t is (typeof TOOLS)[number] => !!t)
    .filter((t) => enabled.length === 0 || enabled.includes(t.slug));

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

  const panels: Record<DashboardPanel, React.ReactNode> = {
    featured:
      featuredTools.length === 0 ? null : (
        <section key="featured">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-dim">
            Quick tools
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {featuredTools.map((t) => (
              <Link
                key={t.slug}
                href={`/tools/${t.slug}`}
                className="card flex items-center gap-2 p-3 transition-colors hover:border-amber-400/40"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg"
                  style={{
                    background: `linear-gradient(135deg, ${t.accent}33, ${t.accent}14)`,
                    border: `1px solid ${t.accent}40`,
                  }}
                >
                  {t.icon}
                </span>
                <span className="text-sm font-medium leading-tight">{t.name}</span>
              </Link>
            ))}
          </div>
        </section>
      ),
    today: (
      <section key="today" className="card p-4">
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
    ),
    ventures: (
      <section key="ventures">
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
    ),
    calendar: (
      <CalendarStrip
        key="calendar"
        tasks={upcoming.map((t) => ({
          id: t.id,
          title: t.title,
          dueDate: t.dueDate!.toISOString(),
          business: t.business,
        }))}
      />
    ),
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-end">
        <DashboardPicker current={template.id} />
      </div>
      <QuickCapture
        businesses={businesses.map((b) => ({ id: b.id, name: b.name, color: b.color }))}
      />
      {template.panels.map((p) => panels[p])}
    </div>
  );
}
