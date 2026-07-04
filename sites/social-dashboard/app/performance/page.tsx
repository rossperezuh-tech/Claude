import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatNumber } from "@/lib/format";
import { PLATFORM_LABEL } from "@/lib/constants";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { ClientAvatar } from "@/components/ui/ClientAvatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { TrendBars } from "@/components/performance/TrendBars";
import { LogMetricForm } from "@/components/performance/LogMetricForm";

export const metadata: Metadata = { title: "Performance" };

export default async function PerformancePage() {
  const clients = await prisma.client.findMany({
    where: { status: { not: "CHURNED" } },
    orderBy: { name: "asc" },
    include: { metrics: { orderBy: { date: "asc" } } },
  });

  type Group = {
    clientName: string;
    clientColor: string;
    platform: string;
    points: { label: string; value: number; fullLabel: string }[];
    latestEngagement: number;
    latestReach: number;
  };

  const groups: Group[] = [];
  for (const client of clients) {
    const byPlatform = new Map<string, typeof client.metrics>();
    for (const m of client.metrics) {
      if (!byPlatform.has(m.platform)) byPlatform.set(m.platform, []);
      byPlatform.get(m.platform)!.push(m);
    }
    for (const [platform, metrics] of Array.from(byPlatform.entries())) {
      const last4 = metrics.slice(-4);
      const latest = last4[last4.length - 1];
      groups.push({
        clientName: client.name,
        clientColor: client.color,
        platform,
        points: last4.map((m) => ({
          label: m.date.toLocaleDateString("en-US", { month: "short" }),
          fullLabel: m.date.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
          value: m.followers,
        })),
        latestEngagement: latest.engagementRate,
        latestReach: latest.reach,
      });
    }
  }

  const totalFollowers = groups.reduce(
    (s, g) => s + (g.points[g.points.length - 1]?.value ?? 0),
    0
  );
  const totalReach = groups.reduce((s, g) => s + g.latestReach, 0);
  const avgEngagement =
    groups.length > 0
      ? groups.reduce((s, g) => s + g.latestEngagement, 0) / groups.length
      : 0;

  const clientOptions = clients.map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="page">
      <PageHeader
        title="Performance"
        subtitle="Follower growth, engagement, and reach — across every client and platform."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total followers" value={formatNumber(totalFollowers)} />
        <StatCard label="Avg. engagement rate" value={`${avgEngagement.toFixed(1)}%`} />
        <StatCard label="Total monthly reach" value={formatNumber(totalReach)} />
      </div>

      <div className="my-8">
        <LogMetricForm clients={clientOptions} />
      </div>

      {groups.length === 0 ? (
        <EmptyState title="No metrics logged yet" body="Log your first snapshot above to start tracking growth." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {groups.map((g) => (
            <div key={`${g.clientName}-${g.platform}`} className="card p-5">
              <div className="mb-1 flex items-center gap-2.5">
                <ClientAvatar name={g.clientName} color={g.clientColor} size={26} />
                <div className="min-w-0">
                  <div className="truncate text-[13.5px] font-semibold text-ink">{g.clientName}</div>
                  <div className="text-[11.5px] text-ink-faint">{PLATFORM_LABEL[g.platform]}</div>
                </div>
              </div>
              <div className="mt-3">
                <TrendBars points={g.points} color={g.clientColor} />
              </div>
              <div className="mt-1 flex justify-between text-[11.5px] text-ink-faint">
                <span>{g.latestEngagement}% engagement</span>
                <span>{formatNumber(g.latestReach)} reach</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* accessible table view of the same data */}
      {groups.length > 0 && (
        <div className="mt-10">
          <h2 className="section-title mb-3">Table view</h2>
          <div className="card overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-line text-ink-faint">
                  <th className="px-5 py-3 font-medium">Client</th>
                  <th className="px-5 py-3 font-medium">Platform</th>
                  <th className="px-5 py-3 font-medium">Followers</th>
                  <th className="px-5 py-3 font-medium">Engagement</th>
                  <th className="px-5 py-3 font-medium">Reach</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((g) => (
                  <tr key={`${g.clientName}-${g.platform}-row`} className="border-b border-line last:border-0">
                    <td className="px-5 py-3 font-medium text-ink">{g.clientName}</td>
                    <td className="px-5 py-3 text-ink-dim">{PLATFORM_LABEL[g.platform]}</td>
                    <td className="px-5 py-3 text-ink-dim">
                      {formatNumber(g.points[g.points.length - 1]?.value ?? 0)}
                    </td>
                    <td className="px-5 py-3 text-ink-dim">{g.latestEngagement}%</td>
                    <td className="px-5 py-3 text-ink-dim">{formatNumber(g.latestReach)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
