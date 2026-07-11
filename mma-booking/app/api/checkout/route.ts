import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { BOOKING_WINDOW_DAYS, CLASS_TYPES, formatTime, getSlot } from "@/lib/schedule";
import { addDaysYmd, formatYmd, isValidYmd, nowHm, todayYmd, weekdayOf } from "@/lib/dates";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest) {
  let body: { date?: string; slotId?: string; name?: string; email?: string; phone?: string };
  try {
    body = await req.json();
  } catch {
    return bad("Invalid request body");
  }

  const date = (body.date ?? "").trim();
  const slotId = (body.slotId ?? "").trim();
  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const phone = (body.phone ?? "").trim() || null;

  if (!isValidYmd(date)) return bad("Invalid date");
  if (!name || name.length > 100) return bad("Please enter your name");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad("Please enter a valid email");

  const slot = getSlot(slotId);
  if (!slot || slot.weekday !== weekdayOf(date)) return bad("That class isn't offered on this date");

  const today = todayYmd();
  if (date < today || (date === today && slot.startTime <= nowHm())) {
    return bad("That class has already started — pick an upcoming time");
  }
  if (date > addDaysYmd(today, BOOKING_WINDOW_DAYS)) {
    return bad(`Bookings open ${BOOKING_WINDOW_DAYS} days ahead`);
  }

  const type = CLASS_TYPES[slot.classKey];

  const booked = await prisma.booking.count({
    where: { date, slotId, status: { not: "cancelled" } },
  });
  if (booked >= type.capacity) return bad("This class is full — pick another time", 409);

  const stripe = getStripe();

  let booking;
  try {
    booking = await prisma.booking.create({
      data: {
        date,
        slotId,
        className: type.name,
        startTime: slot.startTime,
        endTime: slot.endTime,
        name,
        email,
        phone,
        priceCents: type.priceCents,
        status: stripe ? "pending_payment" : "confirmed",
      },
    });
  } catch (e: unknown) {
    if (typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002") {
      return bad("You already have a booking for this class", 409);
    }
    throw e;
  }

  // Demo mode: no Stripe key configured — confirm immediately, skip payment.
  if (!stripe) {
    return NextResponse.json({ url: `/confirm?booking_id=${booking.id}` });
  }

  const origin =
    process.env.NEXT_PUBLIC_BASE_URL || req.headers.get("origin") || "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: type.priceCents,
          product_data: {
            name: `${type.name} — ${formatYmd(date)} at ${formatTime(slot.startTime)}`,
            description: `${SITE.name}, ${SITE.address}, ${SITE.city}`,
          },
        },
      },
    ],
    metadata: { bookingId: booking.id },
    success_url: `${origin}/confirm?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/book?canceled=1`,
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
  });

  await prisma.booking.update({
    where: { id: booking.id },
    data: { stripeSessionId: session.id },
  });

  return NextResponse.json({ url: session.url });
}
