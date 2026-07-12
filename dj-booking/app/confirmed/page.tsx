import Link from "next/link";
import Wordmark from "@/components/Wordmark";
import {
  confirmBooking,
  getBookingById,
  getBookingByStripeSession,
  Booking,
} from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { sendBookingEmails } from "@/lib/email";
import { LOCATIONS, formatHour, formatMoney } from "@/lib/locations";
import { formatDateLong } from "@/lib/dates";

export const dynamic = "force-dynamic";

/**
 * Success landing. The webhook is the authoritative confirmer, but this
 * page also verifies the Stripe session directly so local dev (no webhook
 * forwarding) and slow webhook delivery both still show a confirmed state.
 */
async function resolveBooking(searchParams: {
  session_id?: string;
  bid?: string;
}): Promise<Booking | null> {
  const { session_id, bid } = searchParams;

  if (session_id) {
    let booking = getBookingByStripeSession(session_id);
    if (booking && booking.status === "pending") {
      const stripe = getStripe();
      if (stripe) {
        try {
          const session = await stripe.checkout.sessions.retrieve(session_id);
          if (session.payment_status === "paid") {
            const confirmed = confirmBooking(booking.id, {
              paymentIntent:
                typeof session.payment_intent === "string"
                  ? session.payment_intent
                  : session.payment_intent?.id,
              amountCents: session.amount_total,
            });
            if (confirmed) {
              await sendBookingEmails(confirmed);
              booking = confirmed;
            }
          }
        } catch (err) {
          console.error("Stripe session verify failed:", err);
        }
      }
    }
    return booking;
  }

  if (bid) return getBookingById(bid);
  return null;
}

export default async function ConfirmedPage({
  searchParams,
}: {
  searchParams: { session_id?: string; bid?: string; dev?: string };
}) {
  const booking = await resolveBooking(searchParams);

  if (!booking || booking.status !== "confirmed") {
    return (
      <Shell>
        <div className="card card-sheen mx-auto max-w-lg p-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            {booking ? "Payment still processing" : "Booking not found"}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-fg-mid">
            {booking
              ? "Your payment is being confirmed — refresh in a few seconds. If you paid, your slot is safe."
              : "We couldn't find that booking. If you completed payment, check your email for the confirmation."}
          </p>
          <Link href="/" className="btn-ghost mt-6">Back to deckroom</Link>
        </div>
      </Shell>
    );
  }

  const loc = LOCATIONS[booking.location];
  const end = booking.start_hour + booking.hours;

  return (
    <Shell>
      <div className="mx-auto max-w-lg">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-acid/15 text-acid">
            ✓
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">You&apos;re booked.</h1>
            <p className="font-mono text-xs text-fg-dim">
              Ref {booking.id.slice(0, 8).toUpperCase()}
              {searchParams.dev && " · simulated payment (dev mode)"}
            </p>
          </div>
        </div>

        <div className="card card-sheen mt-6 divide-y divide-line">
          {[
            ["Room", `${loc.name} — ${loc.address}`],
            ["Date", formatDateLong(booking.date)],
            ["Time", `${formatHour(booking.start_hour)} – ${formatHour(end)} (${booking.hours} hr${booking.hours > 1 ? "s" : ""})`],
            ["Paid", formatMoney(booking.amount_cents)],
            ["Confirmation to", booking.email],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-6 px-5 py-3.5 text-sm">
              <span className="kicker !text-[10px] self-center">{k}</span>
              <span className="text-right font-medium">{v}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-line bg-ink-900/60 p-5 text-sm leading-relaxed text-fg-mid">
          <p className="kicker mb-2">What happens next</p>
          Your door code arrives by email the morning of your session. Bring
          USB sticks or a laptop — the XDJ-RX3, monitors, and cabling are
          already in the room. Need to move it? Email{" "}
          <a href="mailto:book@deckroom.nyc" className="text-fg underline decoration-fg-dim underline-offset-4">
            book@deckroom.nyc
          </a>{" "}
          up to 24h before.
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="btn-ghost">Done</Link>
        </div>
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
      <div className="container-x py-14 sm:py-20">{children}</div>
    </main>
  );
}
