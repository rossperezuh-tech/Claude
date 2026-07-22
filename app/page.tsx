import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, format } from "date-fns";
import { requireOrg } from "@/lib/org";
import QuickCapture from "@/components/QuickCapture";
import TodayTaskRow from "@/components/TodayTaskRow";
import CalendarStrip from "@/components/CalendarStrip";
import NewBusinessForm from "@/components/NewBusinessForm";
import VentureGrid from "@/components/VentureGrid";
import DashboardPicker from "@/components/DashboardPicker";
import {
  DealsWidget,
  StageBoardWidget,
  InvoicesWidget,
  MoneyWidget,
  ContentWeekWidget,
  ContentPipelineWidget,
} from "@/components/DashWidgets";
import { getDashboardTemplate, type DashboardWidget } from "@/lib/dashboards";
import { TOOLS } from "@/lib/tools";
import {
  PIPELINE_STAGES,
  PIPELINE_STAGE_LABELS,
  DEAL_STAGE_LABELS,
  CONTENT_STATUSES,
  CONTENT_STATUS_LABELS,
} from "@/lib/constants";
import { isActive, trialDaysLeft, billingConfigured } from "@/lib/billing";
import { dueLabel } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { orgId } = await requireOrg();
  const now = new Date();

  const [businesses, todayTasks, org, usageCount] = await Promise.all([
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
      select: {
        dashboardTemplate: true,
        enabledTools: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        onboardedAt: true,
      },
    }),
    prisma.usageEvent.count({ where: { organizationId: orgId } }),
  ]);

  // Brand-new account — send them through the one-time welcome first.
  if (org && org.onboardedAt === null) redirect("/welcome");

  const template = getDashboardTemplate(org?.dashboardTemplate);
  const need = new Set<DashboardWidget>(template.widgets);
  const daysLeft = trialDaysLeft(org?.trialEndsAt);
  const showTrialBanner =
    billingConfigured() && !isActive(org?.subscriptionStatus) && !!org?.trialEndsAt;

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

  const overdueCount = todayTasks.filter((t) => t.dueDate && t.dueDate < startOfDay(now)).length;

  // ---- Conditionally fetch widget data for the active template ----
  const monthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const [deals, pipeItems, invoices, ledger, posts, upcoming] = await Promise.all([
    need.has("deals")
      ? prisma.deal.findMany({
          where: { business: { organizationId: orgId }, stage: { not: "CLOSE" } },
          orderBy: { targetClose: "asc" },
          include: { business: { select: { color: true } } },
        })
      : Promise.resolve([]),
    need.has("client-pipeline") || need.has("orders")
      ? prisma.pipelineItem.findMany({
          where: { business: { organizationId: orgId } },
          select: { stage: true, valueCts: true, kind: true },
        })
      : Promise.resolve([]),
    need.has("invoices")
      ? prisma.invoice.findMany({
          where: { business: { organizationId: orgId } },
          select: { status: true, amountCts: true, dueDate: true },
        })
      : Promise.resolve([]),
    need.has("money")
      ? prisma.ledgerEntry.findMany({
          where: { business: { organizationId: orgId }, date: { gte: monthsAgo } },
          select: { type: true, amountCts: true, date: true },
        })
      : Promise.resolve([]),
    need.has("content-week") || need.has("content-pipeline")
      ? prisma.contentPost.findMany({
          where: { business: { organizationId: orgId } },
          include: { business: { select: { color: true, name: true } } },
        })
      : Promise.resolve([]),
    need.has("calendar")
      ? prisma.task.findMany({
          where: {
            business: { organizationId: orgId },
            status: { not: "DONE" },
            dueDate: { gte: startOfDay(now), lte: new Date(now.getTime() + 14 * 86_400_000) },
          },
          orderBy: { dueDate: "asc" },
          include: { business: { select: { name: true, slug: true, color: true } } },
        })
      : Promise.resolve([]),
  ]);

  // Derive widget view-data
  const dealRows = deals.map((d) => ({
    id: d.id,
    name: d.name,
    stageLabel: DEAL_STAGE_LABELS[d.stage as keyof typeof DEAL_STAGE_LABELS] ?? d.stage,
    askingDollars: d.askingCts / 100,
    daysToClose: d.targetClose
      ? Math.ceil((d.targetClose.getTime() - now.getTime()) / 86_400_000)
      : null,
    businessColor: d.business.color,
  }));

  function stageCols(items: { stage: string; valueCts: number }[]) {
    return PIPELINE_STAGES.map((s) => {
      const inStage = items.filter((i) => i.stage === s);
      return {
        label: PIPELINE_STAGE_LABELS[s] ?? s,
        count: inStage.length,
        valueDollars: inStage.reduce((sum, i) => sum + i.valueCts, 0) / 100,
      };
    });
  }
  const pipelineStages = stageCols(pipeItems);
  const orderStages = stageCols(pipeItems.filter((i) => i.kind === "order"));

  const inv = {
    outstanding: invoices.filter((i) => i.status !== "PAID").reduce((s, i) => s + i.amountCts, 0) / 100,
    overdue:
      invoices
        .filter((i) => i.status !== "PAID" && i.dueDate && i.dueDate.getTime() < now.getTime())
        .reduce((s, i) => s + i.amountCts, 0) / 100,
    paid: invoices.filter((i) => i.status === "PAID").reduce((s, i) => s + i.amountCts, 0) / 100,
  };

  const moneyBars = Array.from({ length: 4 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (3 - i), 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const net =
      ledger
        .filter((e) => `${e.date.getFullYear()}-${e.date.getMonth()}` === key)
        .reduce((s, e) => s + (e.type === "REVENUE" ? e.amountCts : -e.amountCts), 0) / 100;
    return { label: format(d, "MMMM"), net };
  });

  const weekEnd = new Date(now.getTime() + 7 * 86_400_000);
  const postRows = posts
    .filter((p) => p.scheduledFor && p.scheduledFor >= startOfDay(now) && p.scheduledFor <= weekEnd)
    .sort((a, b) => (a.scheduledFor!.getTime() - b.scheduledFor!.getTime()))
    .map((p) => ({
      id: p.id,
      title: p.title,
      platform: p.platform,
      dateText: format(p.scheduledFor!, "EEE d"),
      color: p.business.color,
      // Show the client name only when managing several accounts.
      client: businesses.length > 1 ? p.business.name : undefined,
    }));
  const contentCounts = CONTENT_STATUSES.map((s) => ({
    label: CONTENT_STATUS_LABELS[s] ?? s,
    count: posts.filter((p) => p.status === s).length,
  }));

  const featuredTools = template.featured
    .map((slug) => TOOLS.find((t) => t.slug === slug))
    .filter((t): t is (typeof TOOLS)[number] => !!t)
    .filter((t) => (org?.enabledTools?.length ?? 0) === 0 || org!.enabledTools.includes(t.slug));

  const widgetEls: Record<DashboardWidget, React.ReactNode> = {
    featured:
      featuredTools.length === 0 ? null : (
        <section key="featured">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-dim">Quick tools</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {featuredTools.map((t) => (
              <Link
                key={t.slug}
                href={`/tools/${t.slug}`}
                className="card flex items-center gap-2 p-3 transition-colors hover:border-amber-400/40"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg"
                  style={{ background: `linear-gradient(135deg, ${t.accent}33, ${t.accent}14)`, border: `1px solid ${t.accent}40` }}
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
          <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-dim">
            {template.id === "smm" || template.id === "client-hq" ? "Clients" : "Ventures"}
          </h2>
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
    deals: <DealsWidget key="deals" deals={dealRows} />,
    "client-pipeline": (
      <StageBoardWidget key="client-pipeline" title="Client pipeline" href="/tools/pipeline" stages={pipelineStages} />
    ),
    orders: <StageBoardWidget key="orders" title="Orders" href="/tools/pipeline" stages={orderStages} />,
    invoices: <InvoicesWidget key="invoices" outstanding={inv.outstanding} overdue={inv.overdue} paid={inv.paid} />,
    money: <MoneyWidget key="money" months={moneyBars} />,
    "content-week": <ContentWeekWidget key="content-week" posts={postRows} />,
    "content-pipeline": <ContentPipelineWidget key="content-pipeline" counts={contentCounts} />,
  };

  return (
    <div className="space-y-5">
      {showTrialBanner && (
        <Link
          href="/billing"
          className={`block rounded-lg border p-3 text-sm transition-colors ${
            daysLeft > 0
              ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-200 hover:bg-emerald-500/10"
              : "border-red-500/30 bg-red-500/5 text-red-200 hover:bg-red-500/10"
          }`}
        >
          {daysLeft > 0
            ? `✨ Free trial — ${daysLeft} day${daysLeft === 1 ? "" : "s"} left. Subscribe to keep access →`
            : "Your free trial has ended — subscribe to restore your tools →"}
        </Link>
      )}
      {usageCount === 0 && (
        <Link
          href="/start"
          className="block rounded-lg border border-indigo-400/40 bg-indigo-500/10 p-3 text-sm text-indigo-200 transition-colors hover:bg-indigo-500/15"
        >
          👋 New here? Open the Quick Start guide to get set up and meet your tools →
        </Link>
      )}
      <div className="flex items-center justify-end">
        <DashboardPicker current={template.id} />
      </div>
      <QuickCapture businesses={businesses.map((b) => ({ id: b.id, name: b.name, color: b.color }))} />
      {template.widgets.map((w) => widgetEls[w])}
    </div>
  );
}
