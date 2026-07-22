import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/org";
import { TOOLS, TOOL_CATEGORIES } from "@/lib/tools";
import ToolsBoard from "@/components/ToolsBoard";

export const metadata = { title: "Tools — Venture HQ" };
export const dynamic = "force-dynamic";

export default async function ToolsPage() {
  const { orgId } = await requireOrg();
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { enabledTools: true, toolOrder: true, categoryOrder: true, favoriteTools: true },
  });
  const enabled = org?.enabledTools ?? [];
  const toolOrder = org?.toolOrder ?? [];
  const catOrder = org?.categoryOrder ?? [];
  const favorites = org?.favoriteTools ?? [];
  const favSet = new Set(favorites);

  // Empty enabledTools means no restriction — every org starts with all tools.
  const visible = enabled.length === 0 ? [...TOOLS] : TOOLS.filter((t) => enabled.includes(t.slug));

  const toolRank = (slug: string) => {
    const i = toolOrder.indexOf(slug);
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };
  const catRank = (name: string) => {
    const i = catOrder.indexOf(name);
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };

  // Categories that have at least one visible tool, saved order first then default.
  const presentCats = TOOL_CATEGORIES.filter((c) => visible.some((t) => t.category === c));
  const orderedCats = [...presentCats].sort((a, b) => {
    const ra = catRank(a);
    const rb = catRank(b);
    if (ra !== rb) return ra - rb;
    return TOOL_CATEGORIES.indexOf(a) - TOOL_CATEGORIES.indexOf(b);
  });

  const toCard = (t: (typeof TOOLS)[number]) => ({
    slug: t.slug,
    name: t.name,
    description: t.description,
    icon: t.icon,
    accent: t.accent,
  });

  // Favorites float into their own row at the top; category sections show the rest.
  const favoriteCards = visible
    .filter((t) => favSet.has(t.slug))
    .sort((a, b) => toolRank(a.slug) - toolRank(b.slug))
    .map(toCard);

  const sections = orderedCats
    .map((name) => ({
      name,
      tools: visible
        .filter((t) => t.category === name && !favSet.has(t.slug))
        .sort((a, b) => toolRank(a.slug) - toolRank(b.slug))
        .map(toCard),
    }))
    .filter((s) => s.tools.length > 0);

  const nothing = favoriteCards.length === 0 && sections.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Business Tools</h1>
        <span className="text-xs text-ink-faint">star ★ a tool to pin it up top · drag ⠿ to rearrange</span>
      </div>
      {nothing ? (
        <p className="text-sm text-ink-faint">No tools enabled for this account yet.</p>
      ) : (
        <ToolsBoard sections={sections} favorites={favorites} favoriteCards={favoriteCards} />
      )}
    </div>
  );
}
