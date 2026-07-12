import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { BOROUGHS, DISCIPLINES } from "@/lib/site";
import { todayYmd } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function CoachesPage({
  searchParams,
}: {
  searchParams?: { discipline?: string; borough?: string };
}) {
  const discipline = DISCIPLINES.includes(searchParams?.discipline ?? "")
    ? searchParams!.discipline
    : undefined;
  const borough = BOROUGHS.includes(searchParams?.borough ?? "")
    ? searchParams!.borough
    : undefined;

  const coaches = await prisma.coachProfile.findMany({
    where: { ...(discipline && { discipline }), ...(borough && { borough }) },
    include: {
      listings: { where: { status: "OPEN", date: { gte: todayYmd() } }, select: { id: true } },
      partnerships: { where: { status: "APPROVED" }, select: { id: true } },
    },
    orderBy: { yearsExperience: "desc" },
  });

  const filterLink = (params: Record<string, string | undefined>) => {
    const merged = { discipline, borough, ...params };
    const q = Object.entries(merged)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
      .join("&");
    return q ? `/coaches?${q}` : "/coaches";
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-black tracking-tight">Find a Coach</h1>
      <p className="mt-2 text-zinc-400">
        Independent combat sports coaches training out of partner gyms across NYC.
      </p>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href={filterLink({ discipline: undefined })}
          className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${
            !discipline ? "border-orange-500 bg-orange-600/20" : "border-zinc-800 text-zinc-400 hover:border-zinc-600"
          }`}
        >
          All disciplines
        </Link>
        {DISCIPLINES.map((d) => (
          <Link
            key={d}
            href={filterLink({ discipline: d })}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${
              discipline === d ? "border-orange-500 bg-orange-600/20" : "border-zinc-800 text-zinc-400 hover:border-zinc-600"
            }`}
          >
            {d}
          </Link>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <Link
          href={filterLink({ borough: undefined })}
          className={`rounded-full border px-4 py-1.5 text-sm ${
            !borough ? "border-sky-500 bg-sky-600/20" : "border-zinc-800 text-zinc-400 hover:border-zinc-600"
          }`}
        >
          All boroughs
        </Link>
        {BOROUGHS.map((b) => (
          <Link
            key={b}
            href={filterLink({ borough: b })}
            className={`rounded-full border px-4 py-1.5 text-sm ${
              borough === b ? "border-sky-500 bg-sky-600/20" : "border-zinc-800 text-zinc-400 hover:border-zinc-600"
            }`}
          >
            {b}
          </Link>
        ))}
      </div>

      {/* Results */}
      {coaches.length === 0 ? (
        <p className="mt-12 text-zinc-500">No coaches match those filters yet.</p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {coaches.map((c) => (
            <Link
              key={c.id}
              href={`/coaches/${c.id}`}
              className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5 transition hover:border-orange-500/50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-600 text-lg font-black">
                  {c.displayName.slice(0, 1)}
                </div>
                <div>
                  <div className="font-bold">{c.displayName}</div>
                  <div className="text-xs text-zinc-500">
                    {c.discipline} · {c.borough}
                  </div>
                </div>
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-zinc-400">{c.bio}</p>
              <div className="mt-3 flex gap-3 text-xs text-zinc-500">
                <span>{c.yearsExperience} yrs experience</span>
                <span>{c.partnerships.length} partner gym{c.partnerships.length === 1 ? "" : "s"}</span>
                <span className="text-orange-400">
                  {c.listings.length} open session{c.listings.length === 1 ? "" : "s"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
