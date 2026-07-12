import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createHash, timingSafeEqual } from "crypto";
import Wordmark from "@/components/Wordmark";
import { listBookings } from "@/lib/db";
import { LOCATIONS, formatHour, formatMoney } from "@/lib/locations";

export const dynamic = "force-dynamic";

/**
 * Lightweight bookings dashboard behind a single shared password
 * (ADMIN_PASSWORD env var; defaults to "deckroom" for local dev).
 * Deliberately not a full auth system — v1 just needs visibility.
 */

const COOKIE = "deckroom_admin";

function adminToken(): string {
  const pw = process.env.ADMIN_PASSWORD || "deckroom";
  return createHash("sha256").update(`deckroom-admin:${pw}`).digest("hex");
}

function isAuthed(): boolean {
  const val = cookies().get(COOKIE)?.value ?? "";
  const expected = adminToken();
  if (val.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(val), Buffer.from(expected));
}

async function login(formData: FormData) {
  "use server";
  const pw = String(formData.get("password") ?? "");
  if (pw === (process.env.ADMIN_PASSWORD || "deckroom")) {
    cookies().set(COOKIE, adminToken(), {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/admin",
    });
  }
  revalidatePath("/admin");
}

async function logout() {
  "use server";
  cookies().delete(COOKIE);
  revalidatePath("/admin");
}

export default async function AdminPage() {
  if (!isAuthed()) {
    return (
      <Shell>
        <form action={login} className="card card-sheen mx-auto mt-16 flex w-full max-w-sm flex-col gap-4 p-8">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Bookings</h1>
            <p className="mt-1 text-sm text-fg-mid">Enter the admin password.</p>
          </div>
          <input
            type="password"
            name="password"
            autoFocus
            placeholder="Password"
            className="w-full rounded-lg border border-line bg-ink-850 px-3.5 py-2.5 text-sm outline-none transition focus:border-fg-dim"
          />
          <button className="btn-primary">Unlock</button>
        </form>
      </Shell>
    );
  }

  const bookings = await listBookings();
  const confirmed = bookings.filter((b) => b.status === "confirmed");
  const revenue = confirmed.reduce((s, b) => s + b.amount_cents, 0);

  return (
    <Shell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker">Admin</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Bookings</h1>
        </div>
        <form action={logout}>
          <button className="font-mono text-xs text-fg-dim transition hover:text-fg">
            Lock ↗
          </button>
        </form>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          ["Confirmed", String(confirmed.length)],
          ["Paid revenue", formatMoney(revenue)],
          ["Pending holds", String(bookings.length - confirmed.length)],
        ].map(([k, v]) => (
          <div key={k} className="card card-sheen p-5">
            <p className="kicker">{k}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{v}</p>
          </div>
        ))}
      </div>

      <div className="card mt-8 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-line font-mono text-[11px] uppercase tracking-caps text-fg-dim">
              <th className="px-5 py-3.5 font-medium">When</th>
              <th className="px-5 py-3.5 font-medium">Room</th>
              <th className="px-5 py-3.5 font-medium">Who</th>
              <th className="px-5 py-3.5 font-medium">Contact</th>
              <th className="px-5 py-3.5 font-medium text-right">Paid</th>
              <th className="px-5 py-3.5 font-medium text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {bookings.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-fg-mid">
                  No bookings yet.
                </td>
              </tr>
            )}
            {bookings.map((b) => (
              <tr key={b.id} className="align-top">
                <td className="whitespace-nowrap px-5 py-3.5">
                  <p className="font-medium">{b.date}</p>
                  <p className="font-mono text-xs text-fg-dim">
                    {formatHour(b.start_hour)}–{formatHour(b.start_hour + b.hours)}
                  </p>
                </td>
                <td className="px-5 py-3.5">{LOCATIONS[b.location].name}</td>
                <td className="px-5 py-3.5 font-medium">{b.name}</td>
                <td className="px-5 py-3.5">
                  <p className="text-fg-mid">{b.email}</p>
                  <p className="font-mono text-xs text-fg-dim">{b.phone}</p>
                </td>
                <td className="px-5 py-3.5 text-right font-mono">
                  {formatMoney(b.amount_cents)}
                  {b.promo_code && (
                    <p className="text-[11px] text-acid/80">{b.promo_code}</p>
                  )}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <span
                    className={`inline-block rounded-full px-2.5 py-1 font-mono text-[11px] ${
                      b.status === "confirmed"
                        ? "bg-acid/10 text-acid"
                        : "bg-ink-700 text-fg-mid"
                    }`}
                  >
                    {b.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen">
      <header className="border-b border-line">
        <div className="container-x flex h-16 items-center">
          <Wordmark />
        </div>
      </header>
      <div className="container-x pb-20 pt-10">{children}</div>
    </main>
  );
}
