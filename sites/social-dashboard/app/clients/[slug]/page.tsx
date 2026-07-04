import { notFound } from "next/navigation";
import Link from "next/link";
import { startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { formatDate, formatMoney, formatNumber, formatShortDate } from "@/lib/format";
import {
  CLIENT_STATUS_STYLE,
  CLIENT_STATUS_LABEL,
  CONTRACT_STATUS_STYLE,
  CONTRACT_STATUS_LABEL,
  CONTRACT_TYPE_LABEL,
  INVOICE_STATUS_STYLE,
  INVOICE_STATUS_LABEL,
  PLATFORM_LABEL,
  POST_STATUS_STYLE,
  POST_STATUS_LABEL,
  PRIORITY_STYLE,
  PRIORITY_LABEL,
} from "@/lib/constants";
import { Badge } from "@/components/ui/Badge";
import { ClientAvatar } from "@/components/ui/ClientAvatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusSelect } from "@/components/clients/StatusSelect";
import { NotesEditor } from "@/components/clients/NotesEditor";
import { AddTaskForm } from "@/components/clients/AddTaskForm";
import { EditClientInfo } from "@/components/clients/EditClientInfo";
import { TaskCheckbox } from "@/components/TaskCheckbox";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const client = await prisma.client.findUnique({
    where: { slug: params.slug },
  });
  return { title: client?.name ?? "Client" };
}

export default async function ClientDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const today = startOfDay(new Date());

  const client = await prisma.client.findUnique({
    where: { slug: params.slug },
    include: {
      contracts: { orderBy: { startDate: "desc" } },
      invoices: { orderBy: { issueDate: "desc" }, take: 6 },
      tasks: { orderBy: [{ status: "asc" }, { dueDate: "asc" }] },
      posts: {
        where: { scheduledDate: { gte: today }, status: { not: "POSTED" } },
        orderBy: { scheduledDate: "asc" },
        take: 8,
      },
      metrics: { orderBy: { date: "desc" } },
    },
  });

  if (!client) notFound();

  const recentPosts = await prisma.contentPost.findMany({
    where: { clientId: client.id, status: "POSTED" },
    orderBy: { scheduledDate: "desc" },
    take: 4,
  });

  const platforms = client.platforms.split(",").filter(Boolean);

  const latestMetricByPlatform = new Map<string, (typeof client.metrics)[number]>();
  for (const m of client.metrics) {
    if (!latestMetricByPlatform.has(m.platform)) latestMetricByPlatform.set(m.platform, m);
  }

  return (
    <div className="page">
      <Link href="/clients" className="mb-5 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-ink-dim hover:text-ink">
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        All clients
      </Link>

      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-5">
        <div className="flex items-start gap-4">
          <ClientAvatar name={client.name} color={client.color} size={52} />
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-[24px] font-bold tracking-[-0.4px] text-ink">
                {client.name}
              </h1>
              <StatusSelect clientId={client.id} status={client.status} />
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {platforms.map((p) => (
                <span key={p} className="rounded-full bg-surface-sunken px-2.5 py-1 text-[11.5px] font-medium text-ink-dim">
                  {PLATFORM_LABEL[p]}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[22px] font-bold text-ink">
            {formatMoney(client.monthlyRetainer)}
            <span className="text-[14px] font-medium text-ink-faint">/mo</span>
          </div>
          <div className="text-[12.5px] text-ink-faint">
            Client since {formatDate(client.startDate)}
          </div>
        </div>
      </div>

      <div className="mb-10 card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-[13.5px]">
            <div>
              <span className="text-ink-faint">Contact </span>
              <span className="font-medium text-ink">{client.contactName || "—"}</span>
            </div>
            <div>
              <span className="text-ink-faint">Email </span>
              {client.contactEmail ? (
                <a href={`mailto:${client.contactEmail}`} className="font-medium text-brand-ink hover:underline">
                  {client.contactEmail}
                </a>
              ) : (
                <span className="text-ink-faint">—</span>
              )}
            </div>
            <div>
              <span className="text-ink-faint">Phone </span>
              <span className="font-medium text-ink">{client.contactPhone || "—"}</span>
            </div>
          </div>
          <EditClientInfo
            client={{
              id: client.id,
              contactName: client.contactName,
              contactEmail: client.contactEmail,
              contactPhone: client.contactPhone,
              monthlyRetainer: client.monthlyRetainer,
              platforms: client.platforms,
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* left column */}
        <div className="space-y-10 lg:col-span-2">
          <section>
            <h2 className="section-title mb-3">Notes &amp; brand guide</h2>
            <NotesEditor clientId={client.id} initialNotes={client.notes} />
          </section>

          <section>
            <h2 className="section-title mb-3">Upcoming content</h2>
            {client.posts.length === 0 ? (
              <EmptyState title="Nothing scheduled" body="Add posts to this client from the Content Calendar." />
            ) : (
              <div className="card divide-y divide-line">
                {client.posts.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="w-14 shrink-0 text-[12.5px] font-medium text-ink-dim">
                      {formatShortDate(p.scheduledDate)}
                    </div>
                    <div className="min-w-0 flex-1 truncate text-[14px] text-ink">
                      {p.caption || "(no caption yet)"}
                    </div>
                    <span className="shrink-0 text-[11.5px] text-ink-faint">
                      {PLATFORM_LABEL[p.platform]}
                    </span>
                    <Badge className={POST_STATUS_STYLE[p.status]}>
                      {POST_STATUS_LABEL[p.status]}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
            {recentPosts.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2 text-[12.5px] text-ink-faint">
                <span>Recently posted:</span>
                {recentPosts.map((p) => (
                  <span key={p.id}>{formatShortDate(p.scheduledDate)}</span>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="section-title">Tasks</h2>
              <AddTaskForm clientId={client.id} />
            </div>
            {client.tasks.length === 0 ? (
              <EmptyState title="No tasks yet" />
            ) : (
              <div className="card divide-y divide-line">
                {client.tasks.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 px-5 py-3.5">
                    <TaskCheckbox id={t.id} status={t.status} />
                    <div
                      className={`min-w-0 flex-1 truncate text-[14px] ${
                        t.status === "DONE" ? "text-ink-faint line-through" : "text-ink"
                      }`}
                    >
                      {t.title}
                    </div>
                    <Badge className={PRIORITY_STYLE[t.priority]}>
                      {PRIORITY_LABEL[t.priority].split(" · ")[0]}
                    </Badge>
                    {t.dueDate && (
                      <span className="w-14 shrink-0 text-right text-[12px] text-ink-faint">
                        {formatShortDate(t.dueDate)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* right column */}
        <div className="space-y-10">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="section-title">Contracts</h2>
              <Link href="/contracts" className="text-[13px] font-medium text-brand-ink hover:underline">
                Manage →
              </Link>
            </div>
            {client.contracts.length === 0 ? (
              <EmptyState title="No contract yet" />
            ) : (
              <div className="card divide-y divide-line">
                {client.contracts.map((c) => (
                  <div key={c.id} className="px-5 py-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[13.5px] font-medium text-ink">
                        {CONTRACT_TYPE_LABEL[c.type]}
                      </span>
                      <Badge className={CONTRACT_STATUS_STYLE[c.status]}>
                        {CONTRACT_STATUS_LABEL[c.status]}
                      </Badge>
                    </div>
                    <div className="mt-1 text-[12px] text-ink-faint">
                      {formatDate(c.startDate)}
                      {c.endDate ? ` – ${formatDate(c.endDate)}` : ""}
                      {c.autoRenew ? " · auto-renews" : ""}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="section-title">Invoices</h2>
              <Link href="/invoices" className="text-[13px] font-medium text-brand-ink hover:underline">
                Manage →
              </Link>
            </div>
            {client.invoices.length === 0 ? (
              <EmptyState title="No invoices yet" />
            ) : (
              <div className="card divide-y divide-line">
                {client.invoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between gap-2 px-5 py-3.5">
                    <div>
                      <div className="text-[13.5px] font-medium text-ink">{inv.periodLabel}</div>
                      <div className="text-[12px] text-ink-faint">{formatMoney(inv.amount)}</div>
                    </div>
                    <Badge className={INVOICE_STATUS_STYLE[inv.status]}>
                      {INVOICE_STATUS_LABEL[inv.status]}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="section-title mb-3">Performance snapshot</h2>
            {latestMetricByPlatform.size === 0 ? (
              <EmptyState title="No metrics logged yet" />
            ) : (
              <div className="card divide-y divide-line">
                {Array.from(latestMetricByPlatform.entries()).map(([platform, m]) => (
                  <div key={platform} className="px-5 py-3.5">
                    <div className="mb-1.5 text-[13px] font-semibold text-ink">
                      {PLATFORM_LABEL[platform]}
                    </div>
                    <div className="flex gap-5 text-[12.5px] text-ink-faint">
                      <span>
                        <b className="font-semibold text-ink">{formatNumber(m.followers)}</b> followers
                      </span>
                      <span>
                        <b className="font-semibold text-ink">{m.engagementRate}%</b> engagement
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
