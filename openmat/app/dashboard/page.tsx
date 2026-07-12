import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatPrice, formatTime, formatYmd } from "@/lib/site";
import { todayYmd } from "@/lib/dates";
import {
  CancelListingButton,
  CreateListingForm,
  PartnershipActions,
} from "@/components/DashboardActions";
import { CoachProfileForm, GymProfileForm } from "@/components/ProfileForms";
import ConnectPayoutsButton from "@/components/ConnectPayoutsButton";
import type { CoachProfile, GymProfile } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return user.coachProfile ? (
    <CoachDashboard profile={user.coachProfile} />
  ) : user.gymProfile ? (
    <GymDashboard profile={user.gymProfile} />
  ) : (
    <div className="mx-auto max-w-4xl px-4 py-10">No profile found for this account.</div>
  );
}

// ---------- Coach ----------

async function CoachDashboard({ profile }: { profile: CoachProfile }) {
  const coachId = profile.id;
  const name = profile.displayName;
  const [partnerships, listings] = await Promise.all([
    prisma.partnership.findMany({
      where: { coachId },
      include: { gym: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.sessionListing.findMany({
      where: { coachId },
      include: { gym: true, bookings: { where: { status: "confirmed" } } },
      orderBy: [{ date: "desc" }, { startTime: "asc" }],
    }),
  ]);

  const approvedGyms = partnerships
    .filter((p) => p.status === "APPROVED")
    .map((p) => ({ id: p.gym.id, gymName: p.gym.gymName, spaceSharePct: p.gym.spaceSharePct }));

  const allBookings = listings.flatMap((l) => l.bookings);
  const totalEarnedCents = allBookings.reduce((s, b) => s + b.coachNetCents, 0);
  const today = todayYmd();
  const upcoming = listings.filter((l) => l.status === "OPEN" && l.date >= today);
  const past = listings.filter((l) => l.status !== "OPEN" || l.date < today);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-black tracking-tight">Coach Dashboard</h1>
      <p className="mt-1 text-zinc-400">{name}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Your earnings (confirmed)" value={formatPrice(totalEarnedCents)} accent="text-emerald-400" />
        <Stat label="Confirmed bookings" value={String(allBookings.length)} />
        <Stat label="Partner gyms" value={String(approvedGyms.length)} />
      </div>

      <Section title="Your Profile">
        <div className="space-y-4">
          <CoachProfileForm profile={profile} />
          <ConnectPayoutsButton connected={!!profile.stripeAccountId} />
        </div>
      </Section>

      <Section title="Post a Session">
        <CreateListingForm gyms={approvedGyms} />
      </Section>

      <Section title="Your Sessions">
        {upcoming.length === 0 && past.length === 0 ? (
          <p className="text-sm text-zinc-500">No sessions yet.</p>
        ) : (
          <div className="space-y-3">
            {[...upcoming, ...past].map((l) => {
              const gross = l.bookings.reduce((s, b) => s + b.priceCents, 0);
              const net = l.bookings.reduce((s, b) => s + b.coachNetCents, 0);
              return (
                <div key={l.id} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-bold">
                        {l.title}{" "}
                        {l.status === "CANCELLED" && (
                          <span className="text-xs font-semibold text-red-400">(cancelled)</span>
                        )}
                      </div>
                      <div className="text-sm text-zinc-400">
                        {formatYmd(l.date)} · {formatTime(l.startTime)}–{formatTime(l.endTime)} ·{" "}
                        {l.gym.gymName}
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">
                        {l.bookings.length}/{l.capacity} booked · gross {formatPrice(gross)} · you
                        earn <span className="text-emerald-400">{formatPrice(net)}</span>
                      </div>
                    </div>
                    {l.status === "OPEN" && l.date >= today && (
                      <CancelListingButton listingId={l.id} />
                    )}
                  </div>
                  {l.bookings.length > 0 && (
                    <div className="mt-2 border-t border-zinc-800 pt-2 text-xs text-zinc-500">
                      {l.bookings.map((b) => `${b.clientName} (${b.clientEmail})`).join(" · ")}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Section>

      <Section title="Gym Partnerships">
        {partnerships.length === 0 ? (
          <p className="text-sm text-zinc-500">
            None yet —{" "}
            <Link href="/gyms" className="font-semibold text-orange-400">
              browse gyms
            </Link>{" "}
            and request mat time.
          </p>
        ) : (
          <ul className="space-y-2">
            {partnerships.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm"
              >
                <span>
                  <Link href={`/gyms/${p.gym.id}`} className="font-semibold hover:text-orange-400">
                    {p.gym.gymName}
                  </Link>{" "}
                  <span className="text-zinc-500">
                    · {p.gym.borough} · {p.gym.spaceSharePct}% space share
                  </span>
                </span>
                <StatusBadge status={p.status} />
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

// ---------- Gym ----------

async function GymDashboard({ profile }: { profile: GymProfile }) {
  const gymId = profile.id;
  const name = profile.gymName;
  const [requests, listings] = await Promise.all([
    prisma.partnership.findMany({
      where: { gymId },
      include: { coach: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.sessionListing.findMany({
      where: { gymId },
      include: { coach: true, bookings: { where: { status: "confirmed" } } },
      orderBy: [{ date: "desc" }, { startTime: "asc" }],
    }),
  ]);

  const allBookings = listings.flatMap((l) => l.bookings);
  const totalEarnedCents = allBookings.reduce((s, b) => s + b.gymCutCents, 0);
  const pending = requests.filter((r) => r.status === "PENDING");
  const today = todayYmd();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-black tracking-tight">Gym Dashboard</h1>
      <p className="mt-1 text-zinc-400">{name}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Space revenue (confirmed)" value={formatPrice(totalEarnedCents)} accent="text-sky-400" />
        <Stat label="Sessions hosted" value={String(listings.length)} />
        <Stat label="Pending coach requests" value={String(pending.length)} accent={pending.length ? "text-amber-400" : undefined} />
      </div>

      <Section title="Your Profile">
        <div className="space-y-4">
          <GymProfileForm profile={profile} />
          <ConnectPayoutsButton connected={!!profile.stripeAccountId} />
        </div>
      </Section>

      <Section title="Coach Requests">
        {requests.length === 0 ? (
          <p className="text-sm text-zinc-500">No requests yet.</p>
        ) : (
          <ul className="space-y-2">
            {requests.map((r) => (
              <li key={r.id} className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm">
                    <Link href={`/coaches/${r.coach.id}`} className="font-semibold hover:text-orange-400">
                      {r.coach.displayName}
                    </Link>{" "}
                    <span className="text-zinc-500">
                      · {r.coach.discipline} · {r.coach.yearsExperience} yrs
                    </span>
                  </span>
                  {r.status === "PENDING" ? (
                    <PartnershipActions partnershipId={r.id} />
                  ) : (
                    <StatusBadge status={r.status} />
                  )}
                </div>
                {r.message && <p className="mt-2 text-xs text-zinc-500">&ldquo;{r.message}&rdquo;</p>}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Sessions at Your Gym">
        {listings.length === 0 ? (
          <p className="text-sm text-zinc-500">No sessions scheduled yet.</p>
        ) : (
          <div className="space-y-2">
            {listings.map((l) => {
              const cut = l.bookings.reduce((s, b) => s + b.gymCutCents, 0);
              return (
                <div
                  key={l.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm"
                >
                  <span>
                    <span className="font-semibold">{l.title}</span>
                    <span className="text-zinc-500"> — {l.coach.displayName}</span>
                    {l.status === "CANCELLED" && (
                      <span className="ml-2 text-xs text-red-400">cancelled</span>
                    )}
                  </span>
                  <span className="text-zinc-400">
                    {formatYmd(l.date)} · {formatTime(l.startTime)} · {l.bookings.length}/{l.capacity}{" "}
                    booked · your cut <span className="text-sky-400">{formatPrice(cut)}</span>
                    {l.date >= today && l.status === "OPEN" && (
                      <span className="ml-2 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-400">
                        upcoming
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Section>
    </div>
  );
}

// ---------- shared ----------

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
      <div className={`text-2xl font-black ${accent ?? ""}`}>{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wider text-zinc-500">{label}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-10">
      <h2 className="mb-4 text-xl font-bold">{title}</h2>
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "APPROVED"
      ? "bg-emerald-500/15 text-emerald-400"
      : status === "PENDING"
        ? "bg-amber-500/15 text-amber-400"
        : "bg-red-500/15 text-red-400";
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {status.toLowerCase()}
    </span>
  );
}
