import Link from "next/link";
import { getDashboardData } from "@/lib/dashboard-data";
import { formatMoney, formatNumber } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { QuickAddClient } from "@/components/dashboard/QuickAddClient";
import { WeekStrip } from "@/components/dashboard/WeekStrip";
import { RenewalsCard } from "@/components/dashboard/RenewalsCard";
import { TasksCard } from "@/components/dashboard/TasksCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ClientAvatar } from "@/components/ui/ClientAvatar";
import { PLATFORM_LABEL } from "@/lib/constants";

export default async function DashboardPage() {
  const {
    activeClientCount,
    mrr,
    invoices,
    invoicesDueAmount,
    weekPosts,
    overduePosts,
    renewals,
    tasks,
    today,
  } = await getDashboardData();

  const contentDueThisWeek = weekPosts.filter((p) => p.status !== "POSTED").length;

  return (
    <div className="page">
      <PageHeader
        title="Dashboard"
        subtitle="Everything across every client, at a glance."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active clients" value={String(activeClientCount)} />
        <StatCard label="Monthly recurring revenue" value={formatMoney(mrr)} />
        <StatCard
          label="Invoices due"
          value={formatMoney(invoicesDueAmount)}
          hint={`${invoices.length} outstanding`}
          tone={invoices.some((i) => i.status === "OVERDUE") ? "warn" : "default"}
        />
        <StatCard
          label="Content due this week"
          value={String(contentDueThisWeek)}
          hint={
            overduePosts.length > 0
              ? `${overduePosts.length} overdue`
              : "none overdue"
          }
          tone={overduePosts.length > 0 ? "bad" : "default"}
        />
      </div>

      {overduePosts.length > 0 && (
        <div className="mt-4 flex items-start gap-3 rounded-[11px] border border-bad/30 bg-bad-soft px-4 py-3.5">
          <svg
            viewBox="0 0 24 24"
            className="mt-0.5 h-[18px] w-[18px] shrink-0 fill-none stroke-bad"
            strokeWidth={1.8}
          >
            <path d="M12 9v4M12 17h.01" />
            <path d="M10.3 3.6L2.7 17a2 2 0 001.7 3h15.2a2 2 0 001.7-3L13.7 3.6a2 2 0 00-3.4 0z" />
          </svg>
          <div className="text-[13.5px] text-ink">
            <span className="font-semibold text-bad">
              {overduePosts.length} content{" "}
              {overduePosts.length === 1 ? "post is" : "posts are"} overdue
            </span>{" "}
            — past their scheduled date and not marked posted.{" "}
            <Link href="/calendar" className="font-medium underline">
              Review the calendar →
            </Link>
          </div>
        </div>
      )}

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="section-title">This week's content</h2>
            <Link href="/calendar" className="text-[13px] font-medium text-brand-ink hover:underline">
              Full calendar →
            </Link>
          </div>
          <WeekStrip posts={weekPosts} today={today} />

          <div className="mb-3 mt-8 flex items-center justify-between">
            <h2 className="section-title">Open tasks</h2>
            <Link href="/clients" className="text-[13px] font-medium text-brand-ink hover:underline">
              All clients →
            </Link>
          </div>
          <TasksCard tasks={tasks} />
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="section-title">Contract renewals</h2>
            <Link href="/contracts" className="text-[13px] font-medium text-brand-ink hover:underline">
              All contracts →
            </Link>
          </div>
          <RenewalsCard renewals={renewals} today={today} />

          <div className="mb-3 mt-8">
            <h2 className="section-title">Quick add</h2>
          </div>
          <QuickAddClient />
        </div>
      </div>
    </div>
  );
}
