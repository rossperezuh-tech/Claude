import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatTime, formatYmd } from "@/lib/site";
import { todayYmd } from "@/lib/dates";
import RequestPartnershipButton from "@/components/RequestPartnershipButton";

export const dynamic = "force-dynamic";

export default async function GymPage({ params }: { params: { id: string } }) {
  const gym = await prisma.gymProfile.findUnique({
    where: { id: params.id },
    include: {
      partnerships: { where: { status: "APPROVED" }, include: { coach: true } },
      listings: {
        where: { status: "OPEN", date: { gte: todayYmd() } },
        include: { coach: true },
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
      },
    },
  });
  if (!gym) notFound();

  const user = await getCurrentUser();
  const viewerCoachId = user?.coachProfile?.id;
  const existingRequest = viewerCoachId
    ? await prisma.partnership.findUnique({
        where: { coachId_gymId: { coachId: viewerCoachId, gymId: gym.id } },
      })
    : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-black tracking-tight">{gym.gymName}</h1>
      <p className="mt-1 text-zinc-400">
        {gym.address} · {gym.borough}
      </p>
      <p className="mt-4 max-w-2xl leading-relaxed text-zinc-300">{gym.description}</p>

      {gym.amenities && (
        <div className="mt-4 flex flex-wrap gap-2">
          {gym.amenities.split(",").map((a) => (
            <span
              key={a}
              className="rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-400"
            >
              {a.trim()}
            </span>
          ))}
        </div>
      )}

      <div className="mt-6 rounded-lg border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-sm text-sky-300">
        This gym takes a <b>{gym.spaceSharePct}% space share</b> of sessions hosted here.
      </div>

      {/* Coach CTA */}
      <div className="mt-6">
        {viewerCoachId ? (
          existingRequest ? (
            <p className="text-sm text-zinc-400">
              Partnership status:{" "}
              <span
                className={
                  existingRequest.status === "APPROVED"
                    ? "font-bold text-emerald-400"
                    : existingRequest.status === "PENDING"
                      ? "font-bold text-amber-400"
                      : "font-bold text-red-400"
                }
              >
                {existingRequest.status.toLowerCase()}
              </span>
            </p>
          ) : (
            <RequestPartnershipButton gymId={gym.id} />
          )
        ) : (
          <p className="text-sm text-zinc-500">
            Are you a coach looking for mat time here?{" "}
            <Link href="/signup?role=COACH" className="font-semibold text-orange-400">
              Join as a coach
            </Link>{" "}
            and request a partnership.
          </p>
        )}
      </div>

      {/* Resident coaches */}
      {gym.partnerships.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-bold">Resident Coaches</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {gym.partnerships.map((p) => (
              <Link
                key={p.id}
                href={`/coaches/${p.coach.id}`}
                className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 hover:border-orange-500/50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-600 font-black">
                  {p.coach.displayName.slice(0, 1)}
                </div>
                <div>
                  <div className="font-semibold">{p.coach.displayName}</div>
                  <div className="text-xs text-zinc-500">{p.coach.discipline}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming sessions */}
      <div className="mt-10">
        <h2 className="text-xl font-bold">Upcoming Sessions Here</h2>
        {gym.listings.length === 0 ? (
          <p className="mt-3 text-zinc-500">Nothing scheduled yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {gym.listings.map((l) => (
              <li key={l.id}>
                <Link
                  href={`/coaches/${l.coachId}`}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm hover:border-orange-500/50"
                >
                  <span>
                    <span className="font-semibold">{l.title}</span>
                    <span className="text-zinc-500"> — {l.coach.displayName}</span>
                  </span>
                  <span className="text-zinc-400">
                    {formatYmd(l.date)} · {formatTime(l.startTime)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
