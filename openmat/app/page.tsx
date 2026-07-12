import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PLATFORM } from "@/lib/site";
import { todayYmd } from "@/lib/dates";

export default async function HomePage() {
  const [coachCount, gymCount, sessionCount] = await Promise.all([
    prisma.coachProfile.count(),
    prisma.gymProfile.count(),
    prisma.sessionListing.count({ where: { status: "OPEN", date: { gte: todayYmd() } } }),
  ]);

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-zinc-800 bg-gradient-to-b from-orange-950/30 via-zinc-950 to-zinc-950">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:py-28">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-orange-500">
            Coaches · Gyms · Clients
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">
            No gym? <span className="text-orange-500">No problem.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-zinc-400">{PLATFORM.description}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/coaches"
              className="w-full rounded-md bg-orange-600 px-8 py-3 text-lg font-bold text-white hover:bg-orange-500 sm:w-auto"
            >
              Find a Coach
            </Link>
            <Link
              href="/signup"
              className="w-full rounded-md border border-zinc-700 px-8 py-3 text-lg font-semibold hover:border-zinc-500 sm:w-auto"
            >
              I&apos;m a Coach or Gym
            </Link>
          </div>
          <div className="mx-auto mt-12 grid max-w-lg grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xl font-black text-orange-500">{coachCount}</div>
              <div className="text-xs uppercase tracking-wider text-zinc-500">Coaches</div>
            </div>
            <div>
              <div className="text-3xl font-black text-orange-500">{gymCount}</div>
              <div className="text-xs uppercase tracking-wider text-zinc-500">Gyms</div>
            </div>
            <div>
              <div className="text-3xl font-black text-orange-500">{sessionCount}</div>
              <div className="text-xs uppercase tracking-wider text-zinc-500">Open Sessions</div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
          How it works
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
            <div className="text-sm font-bold uppercase tracking-wider text-orange-500">
              For Coaches
            </div>
            <h3 className="mt-2 text-lg font-bold">Teach without the overhead</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Create a profile, partner with gyms in your area, and post sessions. No lease, no
              build-out — just show up and coach. You keep the majority of every booking.
            </p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
            <div className="text-sm font-bold uppercase tracking-wider text-orange-500">
              For Gyms
            </div>
            <h3 className="mt-2 text-lg font-bold">Monetize your empty mat time</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Approve vetted coaches to run sessions in your space during off-peak hours. You set
              your space share and earn on every booking automatically.
            </p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
            <div className="text-sm font-bold uppercase tracking-wider text-orange-500">
              For Clients
            </div>
            <h3 className="mt-2 text-lg font-bold">Train with the best, anywhere</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Browse independent coaches by discipline and borough, book a session in seconds, and
              pay securely online. No membership required.
            </p>
          </div>
        </div>
      </section>

      {/* Economics */}
      <section className="border-y border-zinc-800 bg-zinc-900/30">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Everyone gets paid, automatically
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-zinc-400">
            Every booking splits three ways the moment a client pays. Example on a $100 session at
            a gym with a 20% space share:
          </p>
          <div className="mx-auto mt-8 grid max-w-2xl gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5">
              <div className="text-3xl font-black text-emerald-400">$70</div>
              <div className="mt-1 text-sm font-semibold">Coach</div>
              <div className="text-xs text-zinc-500">the remainder</div>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5">
              <div className="text-3xl font-black text-sky-400">$20</div>
              <div className="mt-1 text-sm font-semibold">Gym</div>
              <div className="text-xs text-zinc-500">space share (gym sets %)</div>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5">
              <div className="text-3xl font-black text-orange-400">$10</div>
              <div className="mt-1 text-sm font-semibold">{PLATFORM.name}</div>
              <div className="text-xs text-zinc-500">{PLATFORM.feePct}% platform fee</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16 text-center">
        <h2 className="text-2xl font-bold">Ready to get on the mats?</h2>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/signup?role=COACH"
            className="w-full rounded-md bg-orange-600 px-8 py-3 font-bold hover:bg-orange-500 sm:w-auto"
          >
            Join as a Coach
          </Link>
          <Link
            href="/signup?role=GYM"
            className="w-full rounded-md border border-zinc-700 px-8 py-3 font-semibold hover:border-zinc-500 sm:w-auto"
          >
            List Your Gym
          </Link>
        </div>
      </section>
    </div>
  );
}
