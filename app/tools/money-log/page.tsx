import Link from "next/link";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/org";
import MoneyLogForms, { DeleteEntry } from "./MoneyLogForms";

export const metadata = { title: "Money Log — Venture HQ" };
export const dynamic = "force-dynamic";

function money(cts: number): string {
  return (cts / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: cts % 100 === 0 ? 0 : 2,
  });
}

/** Month bounds for a "YYYY-MM" key, local time. */
function monthRange(key: string): { start: Date; end: Date } {
  const [y, m] = key.split("-").map(Number);
  return { start: new Date(y, m - 1, 1), end: new Date(y, m, 1) };
}

function shiftMonth(key: string, delta: number): string {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return format(d, "yyyy-MM");
}

export default async function MoneyLogPage({
  searchParams,
}: {
  searchParams: { m?: string };
}) {
  const { orgId } = await requireOrg();
  const monthKey = /^\d{4}-\d{2}$/.test(searchParams.m ?? "")
    ? searchParams.m!
    : format(new Date(), "yyyy-MM");
  const { start, end } = monthRange(monthKey);

  const [businesses, entries] = await Promise.all([
    prisma.business.findMany({
      where: { organizationId: orgId },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, color: true },
    }),
    prisma.ledgerEntry.findMany({
      where: {
        business: { organizationId: orgId },
        date: { gte: start, lt: end },
      },
      orderBy: { date: "desc" },
      include: { business: { select: { id: true, name: true, color: true } } },
    }),
  ]);

  // Per-business rollup for the month
  const rollup = businesses
    .map((b) => {
      const rows = entries.filter((e) => e.business.id === b.id);
      const revenue = rows.filter((e) => e.type === "REVENUE").reduce((s, e) => s + e.amountCts, 0);
      const expense = rows.filter((e) => e.type === "EXPENSE").reduce((s, e) => s + e.amountCts, 0);
      return { ...b, revenue, expense, net: revenue - expense, count: rows.length };
    })
    .filter((r) => r.count > 0);

  const totalRev = rollup.reduce((s, r) => s + r.revenue, 0);
  const totalExp = rollup.reduce((s, r) => s + r.expense, 0);

  const monthLabel = format(start, "MMMM yyyy");

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <div className="text-xs text-ink-faint">
          <Link href="/tools" className="hover:text-ink-dim">Tools</Link> / Money Log
        </div>
        <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-xl font-semibold tracking-tight">Money Log</h1>
          <div className="flex items-center gap-2 text-sm">
            <Link href={`/tools/money-log?m=${shiftMonth(monthKey, -1)}`} className="btn px-2 py-1 text-xs">←</Link>
            <span className="font-medium">{monthLabel}</span>
            <Link href={`/tools/money-log?m=${shiftMonth(monthKey, 1)}`} className="btn px-2 py-1 text-xs">→</Link>
          </div>
        </div>
        <p className="mt-1 text-sm text-ink-dim">
          Quick-log what comes in and goes out, per venture. Not accounting — situational
          awareness.
        </p>
      </div>

      <MoneyLogForms businesses={businesses} />

      {/* Month rollup */}
      <section className="card p-4">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-dim">
            {monthLabel} by venture
          </h2>
          <span className="text-xs text-ink-faint">
            in {money(totalRev)} · out {money(totalExp)} ·{" "}
            <span className={totalRev - totalExp >= 0 ? "text-emerald-400" : "text-red-400"}>
              net {money(totalRev - totalExp)}
            </span>
          </span>
        </div>
        {rollup.length === 0 ? (
          <p className="text-sm text-ink-faint">Nothing logged this month yet.</p>
        ) : (
          <ul className="divide-y divide-surface-edge/60">
            {rollup.map((r) => (
              <li key={r.id} className="flex items-center gap-3 py-2 text-sm">
                <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: r.color }} />
                <span className="min-w-0 flex-1 truncate">{r.name}</span>
                <span className="text-emerald-400">{r.revenue > 0 ? `+${money(r.revenue)}` : "—"}</span>
                <span className="text-red-400">{r.expense > 0 ? `−${money(r.expense)}` : "—"}</span>
                <span className={`w-24 text-right font-medium ${r.net >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {money(r.net)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Entries */}
      <section className="card p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-dim">
          Entries — {monthLabel}
        </h2>
        {entries.length === 0 ? (
          <p className="text-sm text-ink-faint">No entries. Log the first one above.</p>
        ) : (
          <ul className="divide-y divide-surface-edge/60">
            {entries.map((e) => (
              <li key={e.id} className="flex items-center gap-3 py-2 text-sm">
                <span className="w-14 shrink-0 text-xs text-ink-faint">{format(e.date, "MMM d")}</span>
                <span
                  className={`chip shrink-0 border-transparent ${
                    e.type === "REVENUE"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-red-500/10 text-red-400"
                  }`}
                >
                  {e.type === "REVENUE" ? "in" : "out"}
                </span>
                <span className="min-w-0 flex-1 truncate">
                  {e.memo || <span className="text-ink-faint">(no memo)</span>}
                </span>
                <span className="chip hidden border-transparent sm:inline-flex" style={{ color: e.business.color, background: `${e.business.color}1a` }}>
                  {e.business.name}
                </span>
                <span className={`w-24 text-right font-medium ${e.type === "REVENUE" ? "text-emerald-400" : "text-red-400"}`}>
                  {e.type === "REVENUE" ? "+" : "−"}{money(e.amountCts)}
                </span>
                <DeleteEntry id={e.id} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
