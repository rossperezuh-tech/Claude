import Link from "next/link";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { MEDIA_KINDS, MEDIA_KIND_STYLES } from "@/lib/constants";
import { AddMediaForm, DeleteButton } from "@/components/BusinessForms";

export const dynamic = "force-dynamic";

type Search = { q?: string; kind?: string; business?: string; tag?: string };

function filterLink(current: Search, patch: Partial<Search>): string {
  const merged = { ...current, ...patch };
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v);
  const qs = params.toString();
  return qs ? `/media?${qs}` : "/media";
}

const isLink = (url: string) => /^https?:\/\//i.test(url);

export default async function MediaPage({ searchParams }: { searchParams: Search }) {
  const q = (searchParams.q ?? "").trim();

  const where: Record<string, unknown> = {};
  if (q) {
    where.OR = [{ title: { contains: q } }, { tags: { contains: q } }, { notes: { contains: q } }];
  }
  if (searchParams.kind) where.kind = searchParams.kind;
  if (searchParams.tag) where.tags = { contains: searchParams.tag };
  if (searchParams.business === "personal") where.businessId = null;
  else if (searchParams.business) where.business = { slug: searchParams.business };

  const [items, businesses] = await Promise.all([
    prisma.mediaItem.findMany({
      where,
      orderBy: [{ takenAt: "desc" }, { createdAt: "desc" }],
      include: { business: { select: { name: true, slug: true, color: true } } },
    }),
    prisma.business.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true, color: true },
    }),
  ]);
  // Undated items go to the end regardless of how the DB orders nulls
  items.sort((a, b) => Number(!a.takenAt) - Number(!b.takenAt));

  const activeChip = "border-indigo-400/60 bg-indigo-400/10 text-indigo-300";
  const idleChip = "border-surface-edge text-ink-dim hover:text-ink";

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-lg font-semibold">Media</h1>
        <span className="text-xs text-ink-faint">{items.length} indexed</span>
      </div>

      <form method="GET" action="/media" className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search albums, clips, tags…"
          className="input flex-1"
          autoFocus
        />
        {searchParams.kind && <input type="hidden" name="kind" value={searchParams.kind} />}
        {searchParams.business && <input type="hidden" name="business" value={searchParams.business} />}
        <button type="submit" className="btn">Search</button>
      </form>

      <div className="card flex flex-wrap items-center gap-x-4 gap-y-2 p-3 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-ink-faint">Type:</span>
          <Link href={filterLink(searchParams, { kind: undefined })} className={`chip ${!searchParams.kind ? activeChip : idleChip}`}>
            All
          </Link>
          {MEDIA_KINDS.map((k) => (
            <Link key={k} href={filterLink(searchParams, { kind: k })} className={`chip capitalize ${searchParams.kind === k ? activeChip : idleChip}`}>
              {k}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-ink-faint">Business:</span>
          <Link href={filterLink(searchParams, { business: undefined })} className={`chip ${!searchParams.business ? activeChip : idleChip}`}>
            All
          </Link>
          <Link href={filterLink(searchParams, { business: "personal" })} className={`chip ${searchParams.business === "personal" ? activeChip : idleChip}`}>
            Personal
          </Link>
          {businesses.map((b) => (
            <Link
              key={b.slug}
              href={filterLink(searchParams, { business: b.slug })}
              className={`chip ${searchParams.business === b.slug ? activeChip : idleChip}`}
              style={searchParams.business === b.slug ? { borderColor: b.color, color: b.color, background: `${b.color}14` } : undefined}
            >
              {b.name}
            </Link>
          ))}
        </div>
        {searchParams.tag && (
          <div className="flex items-center gap-1.5">
            <span className="text-ink-faint">Tag:</span>
            <Link href={filterLink(searchParams, { tag: undefined })} className={`chip ${activeChip}`}>
              #{searchParams.tag} ✕
            </Link>
          </div>
        )}
      </div>

      <div className="card space-y-3 p-4">
        {items.length === 0 ? (
          <p className="text-sm text-ink-faint">No media found.</p>
        ) : (
          <ul className="divide-y divide-surface-edge/60">
            {items.map((m) => (
              <li key={m.id} className="flex items-start gap-2.5 py-2">
                <span className={`chip mt-0.5 shrink-0 capitalize ${MEDIA_KIND_STYLES[m.kind] ?? MEDIA_KIND_STYLES.album}`}>
                  {m.kind}
                </span>
                <div className="min-w-0 flex-1">
                  {isLink(m.url) ? (
                    <a href={m.url} target="_blank" rel="noreferrer" className="block truncate text-sm hover:underline">
                      {m.title}
                    </a>
                  ) : (
                    <>
                      <span className="block truncate text-sm">{m.title}</span>
                      <p className="truncate font-mono text-xs text-ink-dim">{m.url}</p>
                    </>
                  )}
                  {m.notes && <p className="truncate text-xs text-ink-faint">{m.notes}</p>}
                  {m.tags && (
                    <div className="mt-1 flex flex-wrap gap-x-2 text-xs text-ink-dim">
                      {m.tags.split(", ").map((t) => (
                        <Link key={t} href={filterLink(searchParams, { tag: t })} className="hover:text-ink hover:underline">
                          #{t}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
                {m.business ? (
                  <Link
                    href={`/business/${m.business.slug}#media`}
                    className="chip hidden shrink-0 border-transparent hover:underline sm:inline-flex"
                    style={{ color: m.business.color, background: `${m.business.color}1a` }}
                  >
                    {m.business.name}
                  </Link>
                ) : (
                  <span className="chip hidden shrink-0 border-surface-edge text-ink-dim sm:inline-flex">Personal</span>
                )}
                <span className="w-16 shrink-0 text-right text-xs text-ink-faint">
                  {m.takenAt ? format(m.takenAt, "MMM yyyy") : "—"}
                </span>
                <DeleteButton kind="media" id={m.id} />
              </li>
            ))}
          </ul>
        )}
        <AddMediaForm businesses={businesses.map((b) => ({ id: b.id, name: b.name }))} />
      </div>
    </div>
  );
}
