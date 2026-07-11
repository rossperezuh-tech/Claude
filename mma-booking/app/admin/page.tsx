import { prisma } from "@/lib/prisma";
import { formatPrice, formatTime } from "@/lib/schedule";
import { formatYmd, todayYmd } from "@/lib/dates";

export const dynamic = "force-dynamic";

// Simple instructor view of upcoming bookings. NOTE: no auth — do not expose
// this route publicly without adding protection (e.g. basic auth middleware).
export default async function AdminPage() {
  const today = todayYmd();
  const bookings = await prisma.booking.findMany({
    where: { date: { gte: today }, status: { not: "cancelled" } },
    orderBy: [{ date: "asc" }, { startTime: "asc" }, { createdAt: "asc" }],
  });

  const byDate = new Map<string, typeof bookings>();
  for (const b of bookings) {
    const list = byDate.get(b.date) ?? [];
    list.push(b);
    byDate.set(b.date, list);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-black tracking-tight">Upcoming Bookings</h1>
      <p className="mt-2 text-sm text-zinc-500">
        {bookings.length} booking{bookings.length === 1 ? "" : "s"} from {formatYmd(today)} onward.
      </p>

      {bookings.length === 0 ? (
        <p className="mt-10 text-zinc-400">No upcoming bookings yet.</p>
      ) : (
        <div className="mt-8 space-y-8">
          {Array.from(byDate.entries()).map(([date, list]) => (
            <div key={date}>
              <h2 className="mb-3 font-bold text-red-400">
                {formatYmd(date, { weekday: "long", year: "numeric" })}
              </h2>
              <div className="overflow-x-auto rounded-lg border border-zinc-800">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-zinc-800 bg-zinc-900/60 text-xs uppercase tracking-wider text-zinc-500">
                    <tr>
                      <th className="px-4 py-2.5">Time</th>
                      <th className="px-4 py-2.5">Class</th>
                      <th className="px-4 py-2.5">Client</th>
                      <th className="px-4 py-2.5">Contact</th>
                      <th className="px-4 py-2.5">Paid</th>
                      <th className="px-4 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {list.map((b) => (
                      <tr key={b.id}>
                        <td className="whitespace-nowrap px-4 py-2.5 text-zinc-300">
                          {formatTime(b.startTime)}
                        </td>
                        <td className="px-4 py-2.5 font-medium">{b.className}</td>
                        <td className="px-4 py-2.5">{b.name}</td>
                        <td className="px-4 py-2.5 text-zinc-400">
                          {b.email}
                          {b.phone ? ` · ${b.phone}` : ""}
                        </td>
                        <td className="px-4 py-2.5">{formatPrice(b.priceCents)}</td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                              b.status === "confirmed"
                                ? "bg-emerald-500/15 text-emerald-400"
                                : "bg-amber-500/15 text-amber-400"
                            }`}
                          >
                            {b.status === "confirmed" ? "confirmed" : "pending"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
