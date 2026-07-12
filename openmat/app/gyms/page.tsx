import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { BOROUGHS } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function GymsPage({
  searchParams,
}: {
  searchParams?: { borough?: string };
}) {
  const borough = BOROUGHS.includes(searchParams?.borough ?? "")
    ? searchParams!.borough
    : undefined;

  const gyms = await prisma.gymProfile.findMany({
    where: borough ? { borough } : undefined,
    include: { partnerships: { where: { status: "APPROVED" }, select: { id: true } } },
    orderBy: { gymName: "asc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-black tracking-tight">Partner Gyms</h1>
      <p className="mt-2 text-zinc-400">
        Gyms with mat space available to independent coaches. Coaches: request a partnership from
        any gym page.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href="/gyms"
          className={`rounded-full border px-4 py-1.5 text-sm ${
            !borough ? "border-sky-500 bg-sky-600/20" : "border-zinc-800 text-zinc-400 hover:border-zinc-600"
          }`}
        >
          All boroughs
        </Link>
        {BOROUGHS.map((b) => (
          <Link
            key={b}
            href={`/gyms?borough=${encodeURIComponent(b)}`}
            className={`rounded-full border px-4 py-1.5 text-sm ${
              borough === b ? "border-sky-500 bg-sky-600/20" : "border-zinc-800 text-zinc-400 hover:border-zinc-600"
            }`}
          >
            {b}
          </Link>
        ))}
      </div>

      {gyms.length === 0 ? (
        <p className="mt-12 text-zinc-500">No gyms in this borough yet.</p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {gyms.map((g) => (
            <Link
              key={g.id}
              href={`/gyms/${g.id}`}
              className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5 transition hover:border-sky-500/50"
            >
              <div className="font-bold">{g.gymName}</div>
              <div className="mt-1 text-sm text-zinc-500">
                {g.address} · {g.borough}
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-zinc-400">{g.description}</p>
              <div className="mt-3 flex gap-3 text-xs text-zinc-500">
                <span>{g.partnerships.length} partner coach{g.partnerships.length === 1 ? "" : "es"}</span>
                <span className="text-sky-400">{g.spaceSharePct}% space share</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
