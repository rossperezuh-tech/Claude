import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/org";
import { TOOLS, TOOL_STATUS_STYLES } from "@/lib/tools";

export const metadata = { title: "Tools — Venture HQ" };
export const dynamic = "force-dynamic";

export default async function ToolsPage() {
  const { orgId } = await requireOrg();
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { enabledTools: true },
  });
  // Empty list means no restriction — every org starts with all tools visible.
  const enabled = org?.enabledTools ?? [];
  const tools = enabled.length === 0 ? TOOLS : TOOLS.filter((t) => enabled.includes(t.slug));

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-xl border border-surface-edge bg-surface-raised p-6">
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, #fbbf24, transparent 70%)" }}
        />
        <div className="relative">
          <span className="chip border-amber-500/30 bg-amber-500/15 text-amber-300">
            Powered by Claude
          </span>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">Steadyhand Tools</h1>
          <p className="mt-1 max-w-xl text-sm text-ink-dim">
            A menu of AI tools built into HQ — drafting, planning, tracking, and reporting across
            every venture. Pick one to get started.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => {
          const status = TOOL_STATUS_STYLES[tool.status];
          const card = (
            <div
              className={`card group relative flex h-full flex-col gap-3 overflow-hidden p-4 ${
                tool.status === "live" ? "transition-all hover:-translate-y-0.5" : "opacity-60"
              }`}
              style={tool.status === "live" ? { ["--accent" as string]: tool.accent } : undefined}
            >
              {/* accent glow on hover */}
              <div
                className="pointer-events-none absolute inset-x-0 -top-16 h-24 opacity-0 blur-2xl transition-opacity group-hover:opacity-40"
                style={{ background: `radial-gradient(circle at 30% 100%, ${tool.accent}, transparent 70%)` }}
              />
              <div className="relative flex items-center justify-between gap-2">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-lg text-xl shadow-inner"
                  style={{
                    background: `linear-gradient(135deg, ${tool.accent}33, ${tool.accent}14)`,
                    border: `1px solid ${tool.accent}40`,
                  }}
                >
                  {tool.icon}
                </div>
                <span className={`chip ${status.className}`}>{status.label}</span>
              </div>
              <div className="relative">
                <h2 className="font-medium">{tool.name}</h2>
                <p className="mt-1 text-sm text-ink-dim">{tool.description}</p>
              </div>
            </div>
          );
          return tool.status === "live" ? (
            <Link key={tool.slug} href={`/tools/${tool.slug}`}>
              {card}
            </Link>
          ) : (
            <div key={tool.slug}>{card}</div>
          );
        })}
        {tools.length === 0 && (
          <p className="text-sm text-ink-faint">No tools enabled for this account yet.</p>
        )}
      </div>
    </div>
  );
}
