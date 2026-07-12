import { NextRequest, NextResponse } from "next/server";
import {
  attachStripeSession,
  confirmBooking,
  createPendingBooking,
  releaseBooking,
  SlotTakenError,
} from "@/lib/db";
import { isLocationId, LOCATIONS, MAX_HOURS, formatHour } from "@/lib/locations";
import { isValidBookableDate, formatDateLong, nyNow } from "@/lib/dates";
import { getStripe } from "@/lib/stripe";
import { sendBookingEmails } from "@/lib/email";
import { applyPromo, lookupPromo } from "@/lib/promo";

export const dynamic = "force-dynamic";

interface CheckoutBody {
  location?: string;
  date?: string;
  startHour?: number;
  hours?: number;
  name?: string;
  email?: string;
  phone?: string;
  promoCode?: string;
}

export async function POST(req: NextRequest) {
  let body: CheckoutBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const { location = "", date = "", startHour, hours, name, email, phone, promoCode } = body;

  if (!isLocationId(location))
    return NextResponse.json({ error: "Unknown location" }, { status: 400 });
  if (!isValidBookableDate(date))
    return NextResponse.json({ error: "That date is out of the booking window" }, { status: 400 });

  const loc = LOCATIONS[location];
  const nHours = Number(hours);
  const start = Number(startHour);
  if (!Number.isInteger(nHours) || nHours < 1 || nHours > MAX_HOURS)
    return NextResponse.json({ error: "Session length must be 1–4 hours" }, { status: 400 });
  if (
    !Number.isInteger(start) ||
    start < loc.openHour ||
    start + nHours - 1 > loc.closeHour
  )
    return NextResponse.json({ error: "That time is outside opening hours" }, { status: 400 });

  const now = nyNow();
  if (date === now.date && start <= now.hour)
    return NextResponse.json({ error: "That start time has already passed" }, { status: 400 });

  const cleanName = String(name ?? "").trim().slice(0, 120);
  const cleanEmail = String(email ?? "").trim().slice(0, 200);
  const cleanPhone = String(phone ?? "").trim().slice(0, 40);
  if (cleanName.length < 2)
    return NextResponse.json({ error: "Please enter your name" }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail))
    return NextResponse.json({ error: "Please enter a valid email" }, { status: 400 });
  if (cleanPhone.length < 7)
    return NextResponse.json({ error: "Please enter a phone number" }, { status: 400 });

  // A mistyped code is rejected rather than silently charged full price.
  if (promoCode && String(promoCode).trim() !== "" && !lookupPromo(String(promoCode))) {
    return NextResponse.json({ error: "That promo code isn't valid" }, { status: 400 });
  }
  const promo = lookupPromo(promoCode ? String(promoCode) : null);
  const amountCents = applyPromo(loc.hourlyRateCents * nHours, promo);

  let booking;
  try {
    booking = createPendingBooking({
      location,
      date,
      startHour: start,
      hours: nHours,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      amountCents,
      promoCode: promo?.code,
    });
  } catch (err) {
    if (err instanceof SlotTakenError) {
      return NextResponse.json(
        { error: "That time was just taken — pick another slot", conflict: true },
        { status: 409 }
      );
    }
    throw err;
  }

  const origin = req.nextUrl.origin;
  const stripe = getStripe();

  // No Stripe key (local dev): simulate a successful payment so the whole
  // flow — hold, confirm, email, admin view — still works end to end.
  if (!stripe) {
    confirmBooking(booking.id);
    await sendBookingEmails({ ...booking, status: "confirmed" });
    return NextResponse.json({
      url: `${origin}/confirmed?bid=${booking.id}&dev=1`,
    });
  }

  const endHour = start + nHours;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: cleanEmail,
      payment_intent_data: { receipt_email: cleanEmail },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: amountCents,
            product_data: {
              name: `${loc.name} session — ${formatDateLong(date)}`,
              description: `${formatHour(start)}–${formatHour(endHour)} · XDJ-RX3 + monitors included${promo ? ` · ${promo.label}` : ""}`,
            },
          },
        },
      ],
      metadata: { bookingId: booking.id },
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      success_url: `${origin}/confirmed?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/book/${location}?released=${booking.id}`,
    });
    attachStripeSession(booking.id, session.id);
    return NextResponse.json({ url: session.url });
  } catch (err) {
    releaseBooking(booking.id);
    console.error("Stripe checkout failed:", err);
    return NextResponse.json(
      { error: "Payment could not be started — try again in a moment" },
      { status: 502 }
    );
  }
}
