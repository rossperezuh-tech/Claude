import { cookies } from "next/headers";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice, PLATFORM } from "@/lib/site";

export const dynamic = "force-dynamic";

// Platform owner view: your earnings across all bookings.
export default async function AdminPage() {
  const isAuthed = cookies().get("admin_auth")?.value === "true";

  if (!isAuthed && process.env.ADMIN_PASSWORD) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Platform Admin</h1>
        <p className="mt-3 text-zinc-400">Log in to view platform earnings.</p>
        <Link
          href="/admin/login"
          className="mt-6 inline-block rounded-md bg-orange-600 px-6 py-3 font-bold hover:bg-orange-500"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  const bookings = await prisma.booking.findMany({
    where: { status: "confirmed" },
    include: { listing: { include: { gym: true, coach: true } } },
    orderBy: { createdAt: "desc" },
  });

  const totals = bookings.reduce(
    (acc, b) => ({
      gross: acc.gross + b.priceCents,
      platform: acc.platform + b.platformFeeCents,
      gyms: acc.gyms + b.gymCutCents,
      coaches: acc.coaches + b.coachNetCents,
    }),
    { gross: 0, platform: 0, gyms: 0, coaches: 0 }
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-black tracking-tight">Platform Earnings</h1>
      <p className="mt-1 text-sm text-zinc-500">
        {PLATFORM.name} takes {PLATFORM.feePct}% of every confirmed booking.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <Stat label="Gross volume" value={formatPrice(totals.gross)} />
        <Stat label="Your revenue" value={formatPrice(totals.platform)} accent="text-orange-400" />
        <Stat label="Paid to gyms" value={formatPrice(totals.gyms)} accent="text-sky-400" />
        <Stat label="Paid to coaches" value={formatPrice(totals.coaches)} accent="text-emerald-400" />
      </div>

      <h2 className="mt-10 text-xl font-bold">Confirmed Bookings</h2>
      {bookings.length === 0 ? (
        <p className="mt-4 text-zinc-500">No confirmed bookings yet.</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-900/60 text-xs uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Session</th>
                <th className="px-4 py-2.5">Coach</th>
                <th className="px-4 py-2.5">Gym</th>
                <th className="px-4 py-2.5">Client</th>
                <th className="px-4 py-2.5 text-right">Price</th>
                <th className="px-4 py-2.5 text-right">Your fee</th>
                <th className="px-4 py-2.5">Payout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td className="whitespace-nowrap px-4 py-2.5 text-zinc-400">{b.listing.date}</td>
                  <td className="px-4 py-2.5 font-medium">{b.listing.title}</td>
                  <td className="px-4 py-2.5">{b.listing.coach.displayName}</td>
                  <td className="px-4 py-2.5">{b.listing.gym.gymName}</td>
                  <td className="px-4 py-2.5 text-zinc-400">{b.clientName}</td>
                  <td className="px-4 py-2.5 text-right">{formatPrice(b.priceCents)}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-orange-400">
                    {formatPrice(b.platformFeeCents)}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        b.payoutStatus === "transferred"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : b.payoutStatus === "partial"
                            ? "bg-amber-500/15 text-amber-400"
                            : "bg-zinc-500/15 text-zinc-400"
                      }`}
                    >
                      {b.payoutStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
      <div className={`text-2xl font-black ${accent ?? ""}`}>{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wider text-zinc-500">{label}</div>
    </div>
  );
}
