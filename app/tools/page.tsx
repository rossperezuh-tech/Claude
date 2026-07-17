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
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Steadyhand Tools</h1>
        <p className="mt-1 text-sm text-ink-dim">
          AI tools from the Steadyhand menu, built into HQ. Powered by Claude.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => {
          const status = TOOL_STATUS_STYLES[tool.status];
          const card = (
            <div
              className={`card flex h-full flex-col gap-2 p-4 ${
                tool.status === "live"
                  ? "transition-colors hover:border-indigo-400/50"
                  : "opacity-60"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-medium">{tool.name}</h2>
                <span className={`chip ${status.className}`}>{status.label}</span>
              </div>
              <p className="text-sm text-ink-dim">{tool.description}</p>
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
