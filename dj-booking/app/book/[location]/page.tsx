import Link from "next/link";
import { notFound } from "next/navigation";
import Wordmark from "@/components/Wordmark";
import BookingFlow from "@/components/BookingFlow";
import { isLocationId, LOCATIONS, formatMoney } from "@/lib/locations";
import { bookableDays } from "@/lib/dates";
import { releaseBooking } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function BookPage({
  params,
  searchParams,
}: {
  params: { location: string };
  searchParams: { released?: string };
}) {
  if (!isLocationId(params.location)) notFound();
  const loc = LOCATIONS[params.location];

  // Stripe cancel_url lands back here — free the held slots immediately
  // instead of waiting out the 30-minute hold.
  if (searchParams.released) {
    try {
      releaseBooking(searchParams.released);
    } catch {
      /* already released/expired — nothing to do */
    }
  }

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-line bg-ink-950/80 backdrop-blur-md">
        <div className="container-x flex h-16 items-center justify-between">
          <Wordmark />
          <Link href="/" className="font-mono text-xs text-fg-mid transition hover:text-fg">
            ← All rooms
          </Link>
        </div>
      </header>

      <div className="container-x max-w-3xl py-10 sm:py-14">
        <p className="kicker">Book a session</p>
        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <h1 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
            {loc.name}
          </h1>
          <p className="font-mono text-sm text-fg-mid">
            <span className="text-fg">{formatMoney(loc.hourlyRateCents)}</span>
            /hour · OPUS-QUAD + monitors included
          </p>
        </div>
        <p className="mt-2 text-sm text-fg-mid">
          {loc.address} · {loc.transit}
        </p>

        {searchParams.released && (
          <p className="mt-6 rounded-lg border border-line bg-ink-900 px-4 py-3 text-sm text-fg-mid">
            Checkout cancelled — your slots were released. Pick a time whenever
            you&apos;re ready.
          </p>
        )}

        <BookingFlow
          locationId={loc.id}
          hourlyRateCents={loc.hourlyRateCents}
          days={bookableDays()}
        />
      </div>
    </main>
  );
}
