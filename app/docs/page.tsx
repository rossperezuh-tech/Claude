import Link from "next/link";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/org";
import { DOC_CATEGORIES } from "@/lib/constants";
import { DeleteButton } from "@/components/BusinessForms";

export const dynamic = "force-dynamic";

const CATEGORY_COLORS: Record<string, string> = {
  legal: "text-violet-400 border-violet-500/30 bg-violet-500/10",
  financial: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  brand: "text-pink-400 border-pink-500/30 bg-pink-500/10",
  operations: "text-sky-400 border-sky-500/30 bg-sky-500/10",
  compliance: "text-amber-400 border-amber-500/30 bg-amber-500/10",
};

// `business` and `category` each hold a comma-separated list so several can be
// filtered at once (empty/absent = all).
type Search = { q?: string; category?: string; business?: string };

// Toggle one value in/out of a comma-separated filter list.
function toggleInList(selected: string[], value: string): string | undefined {
  const next = selected.includes(value)
    ? selected.filter((s) => s !== value)
    : [...selected, value];
  return next.length ? next.join(",") : undefined;
}

function filterLink(current: Search, patch: Partial<Search>): string {
  const merged = { ...current, ...patch };
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v);
  const qs = params.toString();
  return qs ? `/docs?${qs}` : "/docs";
}

export default async function DocsPage({ searchParams }: { searchParams: Search }) {
  const { orgId } = await requireOrg();
  const q = (searchParams.q ?? "").trim();

  // Fetched first so the selected slugs can be validated against this org.
  const businesses = await prisma.business.findMany({
    where: { organizationId: orgId },
    orderBy: { sortOrder: "asc" },
    select: { name: true, slug: true, color: true },
  });

  const knownSlugs = new Set(businesses.map((b) => b.slug));
  const selected = (searchParams.business ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s && knownSlugs.has(s));

  const knownCategories = new Set<string>(DOC_CATEGORIES);
  const selectedCats = (searchParams.category ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s && knownCategories.has(s));

  const where: Record<string, unknown> = {
    business: { organizationId: orgId },
  };
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { notes: { contains: q, mode: "insensitive" } },
      { url: { contains: q, mode: "insensitive" } },
    ];
  }
  if (selectedCats.length > 0) where.category = { in: selectedCats };
  if (selected.length > 0)
    where.business = { organizationId: orgId, slug: { in: selected } };

  const docs = await prisma.document.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { business: { select: { name: true, slug: true, color: true } } },
  });

  const activeChip = "border-indigo-400/60 bg-indigo-400/10 text-indigo-300";
  const idleChip = "border-surface-edge text-ink-dim hover:text-ink";

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-lg font-semibold">Documents</h1>
        <span className="text-xs text-ink-faint">{docs.length} indexed</span>
      </div>

      {/* Search */}
      <form method="GET" action="/docs" className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search all documents — title, notes, URL…"
          className="input flex-1"
          autoFocus
        />
        {searchParams.category && <input type="hidden" name="category" value={searchParams.category} />}
        {searchParams.business && <input type="hidden" name="business" value={searchParams.business} />}
        <button type="submit" className="btn">Search</button>
      </form>

      {/* Filters */}
      <div className="card flex flex-wrap items-center gap-x-4 gap-y-2 p-3 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-ink-faint">Category:</span>
          <Link
            href={filterLink(searchParams, { category: undefined })}
            className={`chip ${selectedCats.length === 0 ? activeChip : idleChip}`}
          >
            All
          </Link>
          {DOC_CATEGORIES.map((c) => {
            const on = selectedCats.includes(c);
            return (
              <Link
                key={c}
                href={filterLink(searchParams, { category: toggleInList(selectedCats, c) })}
                className={`chip capitalize ${on ? activeChip : idleChip}`}
              >
                {on && <span className="mr-1">✓</span>}
                {c}
              </Link>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-ink-faint">Business:</span>
          <Link
            href={filterLink(searchParams, { business: undefined })}
            className={`chip ${selected.length === 0 ? activeChip : idleChip}`}
          >
            All
          </Link>
          {businesses.map((b) => {
            const on = selected.includes(b.slug);
            return (
              <Link
                key={b.slug}
                href={filterLink(searchParams, { business: toggleInList(selected, b.slug) })}
                className={`chip ${on ? activeChip : idleChip}`}
                style={on ? { borderColor: b.color, color: b.color, background: `${b.color}14` } : undefined}
              >
                {on && <span className="mr-1">✓</span>}
                {b.name}
              </Link>
            );
          })}
          {selected.length > 0 && (
            <span className="text-ink-faint">
              {selected.length} selected · click to add or remove
            </span>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="card p-4">
        {docs.length === 0 ? (
          <p className="text-sm text-ink-faint">No documents found.</p>
        ) : (
          <ul className="divide-y divide-surface-edge/60">
            {docs.map((d) => (
              <li key={d.id} className="flex items-center gap-2.5 py-2">
                <span className={`chip shrink-0 capitalize ${CATEGORY_COLORS[d.category] ?? CATEGORY_COLORS.operations}`}>
                  {d.category}
                </span>
                <div className="min-w-0 flex-1">
                  <a href={d.url} target="_blank" rel="noreferrer" className="block truncate text-sm hover:underline">
                    {d.title}
                  </a>
                  {d.notes && <p className="truncate text-xs text-ink-faint">{d.notes}</p>}
                </div>
                <Link
                  href={`/business/${d.business.slug}`}
                  className="chip hidden shrink-0 border-transparent hover:underline sm:inline-flex"
                  style={{ color: d.business.color, background: `${d.business.color}1a` }}
                >
                  {d.business.name}
                </Link>
                <span className="shrink-0 text-xs text-ink-faint">{format(d.createdAt, "MMM d")}</span>
                <DeleteButton kind="document" id={d.id} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
