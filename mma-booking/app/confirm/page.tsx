import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { formatPrice, formatTime } from "@/lib/schedule";
import { formatYmd } from "@/lib/dates";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

async function resolveBooking(searchParams: { session_id?: string; booking_id?: string }) {
  const { session_id, booking_id } = searchParams;

  if (session_id) {
    const stripe = getStripe();
    if (!stripe) return null;
    const session = await stripe.checkout.sessions.retrieve(session_id);
    const bookingId = session.metadata?.bookingId;
    if (!bookingId) return null;
    if (session.payment_status === "paid") {
      await prisma.booking.updateMany({
        where: { id: bookingId, status: "pending_payment" },
        data: { status: "confirmed" },
      });
    }
    return prisma.booking.findUnique({ where: { id: bookingId } });
  }

  if (booking_id) {
    return prisma.booking.findUnique({ where: { id: booking_id } });
  }

  return null;
}

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: { session_id?: string; booking_id?: string };
}) {
  let booking = null;
  try {
    booking = await resolveBooking(searchParams);
  } catch {
    booking = null;
  }

  if (!booking) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Booking not found</h1>
        <p className="mt-3 text-zinc-400">
          We couldn&apos;t locate that booking. If you were charged, contact us at {SITE.email} and
          we&apos;ll sort it out.
        </p>
        <Link
          href="/book"
          className="mt-6 inline-block rounded-md bg-red-600 px-6 py-3 font-bold hover:bg-red-500"
        >
          Back to Booking
        </Link>
      </div>
    );
  }

  const confirmed = booking.status === "confirmed";

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
        <div
          className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full text-2xl ${
            confirmed ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
          }`}
        >
          {confirmed ? "✓" : "…"}
        </div>
        <h1 className="mt-4 text-2xl font-black">
          {confirmed ? "You're booked!" : "Payment processing"}
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          {confirmed
            ? `See you on the mats, ${booking.name.split(" ")[0]}.`
            : "Your payment is still processing — this page will reflect it shortly. If it doesn't, contact us."}
        </p>

        <div className="mt-6 space-y-2 rounded-lg border border-zinc-800 bg-zinc-950 p-5 text-left text-sm">
          <Row label="Class" value={booking.className} />
          <Row label="Date" value={formatYmd(booking.date, { weekday: "long", year: "numeric" })} />
          <Row
            label="Time"
            value={`${formatTime(booking.startTime)} – ${formatTime(booking.endTime)}`}
          />
          <Row label="Where" value={`${SITE.address}, ${SITE.city}`} />
          <Row label="Paid" value={formatPrice(booking.priceCents)} />
          <Row label="Booked by" value={`${booking.name} (${booking.email})`} />
        </div>

        <p className="mt-5 text-xs text-zinc-500">
          Arrive 10 minutes early. Bring water and comfortable workout clothes — gloves and pads
          are available for your first classes.
        </p>

        <Link
          href="/book"
          className="mt-6 inline-block rounded-md border border-zinc-700 px-6 py-2.5 text-sm font-semibold hover:border-zinc-500"
        >
          Book another class
        </Link>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="shrink-0 text-zinc-500">{label}</span>
      <span className="text-right font-medium text-zinc-200">{value}</span>
    </div>
  );
}
