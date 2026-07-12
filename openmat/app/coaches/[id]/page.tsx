import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { todayYmd } from "@/lib/dates";
import BookSessionCard from "@/components/BookSessionCard";

export const dynamic = "force-dynamic";

export default async function CoachPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { canceled?: string };
}) {
  const coach = await prisma.coachProfile.findUnique({
    where: { id: params.id },
    include: {
      partnerships: { where: { status: "APPROVED" }, include: { gym: true } },
      listings: {
        where: { status: "OPEN", date: { gte: todayYmd() } },
        include: {
          gym: true,
          bookings: { where: { status: { not: "cancelled" } }, select: { id: true } },
        },
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
      },
    },
  });
  if (!coach) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {searchParams?.canceled === "1" && (
        <p className="mb-6 rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-300">
          Payment was canceled — your spot was not booked.
        </p>
      )}

      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-600 text-3xl font-black">
          {coach.displayName.slice(0, 1)}
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight">{coach.displayName}</h1>
          <p className="text-zinc-400">
            {coach.discipline} · {coach.borough} · {coach.yearsExperience} yrs experience
          </p>
        </div>
      </div>

      <p className="mt-6 max-w-2xl leading-relaxed text-zinc-300">{coach.bio}</p>
      {coach.accolades && (
        <p className="mt-2 text-sm font-semibold text-orange-400">{coach.accolades}</p>
      )}

      {coach.partnerships.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">Trains out of</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {coach.partnerships.map((p) => (
              <Link
                key={p.id}
                href={`/gyms/${p.gym.id}`}
                className="rounded-full border border-zinc-800 px-4 py-1.5 text-sm text-zinc-300 hover:border-zinc-600"
              >
                {p.gym.gymName} · {p.gym.borough}
              </Link>
            ))}
          </div>
        </div>
      )}

      <h2 className="mt-10 text-xl font-bold">Upcoming Sessions</h2>
      {coach.listings.length === 0 ? (
        <p className="mt-4 text-zinc-500">No open sessions right now — check back soon.</p>
      ) : (
        <div className="mt-4 space-y-4">
          {coach.listings.map((l) => (
            <BookSessionCard
              key={l.id}
              listing={{
                id: l.id,
                title: l.title,
                description: l.description,
                discipline: l.discipline,
                date: l.date,
                startTime: l.startTime,
                endTime: l.endTime,
                priceCents: l.priceCents,
                spotsLeft: Math.max(0, l.capacity - l.bookings.length),
                gymName: l.gym.gymName,
                gymAddress: `${l.gym.address}, ${l.gym.borough}`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
