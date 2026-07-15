import Link from "next/link";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/org";
import { TOOLS } from "@/lib/tools";

export const metadata = { title: "Usage & Billing — Venture HQ" };
export const dynamic = "force-dynamic";

// claude-opus-4-8 per-million-token pricing
const RATES = {
  input: 5,
  output: 25,
  cacheRead: 0.5, // 0.1x input
  cacheWrite: 6.25, // 1.25x input
};

interface Tokens {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
}

function estCostUsd(t: Tokens): number {
  return (
    (t.input / 1_000_000) * RATES.input +
    (t.output / 1_000_000) * RATES.output +
    (t.cacheRead / 1_000_000) * RATES.cacheRead +
    (t.cacheWrite / 1_000_000) * RATES.cacheWrite
  );
}

function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function fmtUsd(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}

const TOOL_NAMES = new Map(TOOLS.map((t) => [t.slug, t.name]));

export default async function UsagePage() {
  const { orgId, userId } = await requireOrg();
  const isAdmin = !!process.env.ADMIN_CLERK_USER_ID && userId === process.env.ADMIN_CLERK_USER_ID;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const byTool = await prisma.usageEvent.groupBy({
    by: ["tool"],
    where: { organizationId: orgId, createdAt: { gte: monthStart } },
    _sum: { inputTokens: true, outputTokens: true, cacheReadTokens: true, cacheWriteTokens: true },
    _count: true,
  });

  const rows = byTool
    .map((r) => ({
      tool: r.tool,
      calls: r._count,
      tokens: {
        input: r._sum.inputTokens ?? 0,
        output: r._sum.outputTokens ?? 0,
        cacheRead: r._sum.cacheReadTokens ?? 0,
        cacheWrite: r._sum.cacheWriteTokens ?? 0,
      },
    }))
    .sort((a, b) => estCostUsd(b.tokens) - estCostUsd(a.tokens));

  const totalCost = rows.reduce((s, r) => s + estCostUsd(r.tokens), 0);
  const totalCalls = rows.reduce((s, r) => s + r.calls, 0);

  // Admin: per-organization rollup for billing clients
  let orgRows: { name: string; calls: number; tokens: Tokens }[] = [];
  if (isAdmin) {
    const byOrg = await prisma.usageEvent.groupBy({
      by: ["organizationId"],
      where: { createdAt: { gte: monthStart } },
      _sum: { inputTokens: true, outputTokens: true, cacheReadTokens: true, cacheWriteTokens: true },
      _count: true,
    });
    const orgs = await prisma.organization.findMany({
      where: { id: { in: byOrg.map((r) => r.organizationId) } },
      select: { id: true, name: true },
    });
    const nameOf = new Map(orgs.map((o) => [o.id, o.name]));
    orgRows = byOrg
      .map((r) => ({
        name: nameOf.get(r.organizationId) ?? r.organizationId,
        calls: r._count,
        tokens: {
          input: r._sum.inputTokens ?? 0,
          output: r._sum.outputTokens ?? 0,
          cacheRead: r._sum.cacheReadTokens ?? 0,
          cacheWrite: r._sum.cacheWriteTokens ?? 0,
        },
      }))
      .sort((a, b) => estCostUsd(b.tokens) - estCostUsd(a.tokens));
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <div className="text-xs text-ink-faint">
          <Link href="/tools" className="hover:text-ink-dim">Tools</Link> / Usage &amp; Billing
        </div>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">Usage &amp; Billing</h1>
        <p className="mt-1 text-sm text-ink-dim">
          AI usage for {format(monthStart, "MMMM yyyy")} — every tool call is metered. Costs are
          estimates at Claude list pricing.
        </p>
      </div>

      <section className="card p-4">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-dim">
            Your usage by tool
          </h2>
          <span className="text-xs text-ink-faint">
            {totalCalls} calls · est. {fmtUsd(totalCost)}
          </span>
        </div>
        {rows.length === 0 ? (
          <p className="text-sm text-ink-faint">No AI usage yet this month.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-ink-faint">
                  <th className="pb-2 font-medium">Tool</th>
                  <th className="pb-2 text-right font-medium">Calls</th>
                  <th className="pb-2 text-right font-medium">In</th>
                  <th className="pb-2 text-right font-medium">Out</th>
                  <th className="pb-2 text-right font-medium">Est. cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-edge/60">
                {rows.map((r) => (
                  <tr key={r.tool}>
                    <td className="py-2">{TOOL_NAMES.get(r.tool) ?? r.tool}</td>
                    <td className="py-2 text-right text-ink-dim">{r.calls}</td>
                    <td className="py-2 text-right text-ink-dim">
                      {fmtTokens(r.tokens.input + r.tokens.cacheRead + r.tokens.cacheWrite)}
                    </td>
                    <td className="py-2 text-right text-ink-dim">{fmtTokens(r.tokens.output)}</td>
                    <td className="py-2 text-right font-medium">{fmtUsd(estCostUsd(r.tokens))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {isAdmin && (
        <section className="card border-indigo-400/30 p-4">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-indigo-300">
              All accounts (admin) — {format(monthStart, "MMM yyyy")}
            </h2>
            <span className="text-xs text-ink-faint">for client billing</span>
          </div>
          {orgRows.length === 0 ? (
            <p className="text-sm text-ink-faint">No usage across any account this month.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-ink-faint">
                    <th className="pb-2 font-medium">Account</th>
                    <th className="pb-2 text-right font-medium">Calls</th>
                    <th className="pb-2 text-right font-medium">In</th>
                    <th className="pb-2 text-right font-medium">Out</th>
                    <th className="pb-2 text-right font-medium">Est. cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-edge/60">
                  {orgRows.map((r, i) => (
                    <tr key={i}>
                      <td className="py-2">{r.name}</td>
                      <td className="py-2 text-right text-ink-dim">{r.calls}</td>
                      <td className="py-2 text-right text-ink-dim">
                        {fmtTokens(r.tokens.input + r.tokens.cacheRead + r.tokens.cacheWrite)}
                      </td>
                      <td className="py-2 text-right text-ink-dim">{fmtTokens(r.tokens.output)}</td>
                      <td className="py-2 text-right font-medium">{fmtUsd(estCostUsd(r.tokens))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-3 text-xs text-ink-faint">
            Visible only to you (ADMIN_CLERK_USER_ID). Bill clients off this table with your
            margin applied.
          </p>
        </section>
      )}
    </div>
  );
}
