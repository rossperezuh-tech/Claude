import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/org";
import { TOOLS, TOOL_CATEGORIES, TOOL_STATUS_STYLES } from "@/lib/tools";

export const metadata = { title: "Tools — Venture HQ" };
export const dynamic = "force-dynamic";

type Tool = (typeof TOOLS)[number];

function ToolCard({ tool }: { tool: Tool }) {
  const status = TOOL_STATUS_STYLES[tool.status];
  const card = (
    <div
      className={`card group relative flex h-full items-start gap-3 overflow-hidden p-4 ${
        tool.status === "live" ? "transition-colors hover:border-amber-400/40" : "opacity-60"
      }`}
    >
      {/* accent glow on hover */}
      <div
        className="pointer-events-none absolute inset-x-0 -top-16 h-24 opacity-0 blur-2xl transition-opacity group-hover:opacity-40"
        style={{ background: `radial-gradient(circle at 30% 100%, ${tool.accent}, transparent 70%)` }}
      />
      <div
        className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xl"
        style={{
          background: `linear-gradient(135deg, ${tool.accent}33, ${tool.accent}14)`,
          border: `1px solid ${tool.accent}40`,
        }}
      >
        {tool.icon}
      </div>
      <div className="relative min-w-0">
        <div className="flex items-center gap-1.5">
          <h2 className="font-medium leading-tight">{tool.name}</h2>
          {tool.status === "soon" && (
            <span className={`chip ${status.className}`}>{status.label}</span>
          )}
        </div>
        <p className="mt-1 text-sm text-ink-dim">{tool.description}</p>
      </div>
    </div>
  );
  return tool.status === "live" ? (
    <Link href={`/tools/${tool.slug}`}>{card}</Link>
  ) : (
    <div>{card}</div>
  );
}

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
      {/* Header */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Business Tools</h1>
      </div>

      {tools.length === 0 && (
        <p className="text-sm text-ink-faint">No tools enabled for this account yet.</p>
      )}

      {TOOL_CATEGORIES.map((category) => {
        const inCategory = tools.filter((t) => t.category === category);
        if (inCategory.length === 0) return null;
        return (
          <section key={category} className="space-y-2.5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
              {category}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {inCategory.map((tool) => (
                <ToolCard key={tool.slug} tool={tool} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
