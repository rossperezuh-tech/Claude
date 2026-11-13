import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SERIES_LABELS } from "@/lib/hookemon/constants";

export const dynamic = "force-dynamic";

export default async function GearPage() {
  const devices = await prisma.hkDevice.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { modules: true, tips: true } } },
  });
  const series = Array.from(new Set(devices.map((d) => d.series)));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Gear</h1>
      {series.map((s) => (
        <section key={s}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-dim">{SERIES_LABELS[s] ?? s}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {devices
              .filter((d) => d.series === s)
              .map((d) => (
                <Link
                  key={d.id}
                  href={`/hookemon/gear/${d.slug}`}
                  className="card p-4 transition-colors hover:bg-surface-overlay"
                  style={{ borderTop: `3px solid ${d.color}` }}
                >
                  <div className="font-medium">{d.name}</div>
                  <p className="mt-1 text-xs text-ink-dim">{d.oneLiner}</p>
                  <div className="mt-2 text-[11px] text-ink-faint">
                    {d._count.modules} modules · {d._count.tips} tips
                  </div>
                </Link>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
