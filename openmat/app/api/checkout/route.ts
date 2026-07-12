import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { computeSplit, formatTime, formatYmd } from "@/lib/site";
import { todayYmd } from "@/lib/dates";

export const dynamic = "force-dynamic";

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return bad("Invalid request");

  const listingId = String(body.listingId ?? "");
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();

  if (!name || name.length > 100) return bad("Enter your name");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad("Enter a valid email");

  const listing = await prisma.sessionListing.findUnique({
    where: { id: listingId },
    include: { gym: true, coach: true },
  });

  if (!listing || listing.status !== "OPEN") return bad("Session not found");
  if (listing.date < todayYmd()) return bad("This session already happened");

  const booked = await prisma.booking.count({
    where: { listingId, status: { not: "cancelled" } },
  });
  if (booked >= listing.capacity) return bad("This session is full", 409);

  const split = computeSplit(listing.priceCents, listing.gym.spaceSharePct);
  const stripe = getStripe();

  let booking;
  try {
    booking = await prisma.booking.create({
      data: {
        listingId,
        clientName: name,
        clientEmail: email,
        priceCents: listing.priceCents,
        ...split,
        status: stripe ? "pending_payment" : "confirmed",
      },
    });
  } catch (e: unknown) {
    if (typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002") {
      return bad("You already booked this session", 409);
    }
    throw e;
  }

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
          unit_amount: listing.priceCents,
          product_data: {
            name: `${listing.title} — ${formatYmd(listing.date)} at ${formatTime(listing.startTime)}`,
            description: `Coach ${listing.coach.displayName} at ${listing.gym.gymName}, ${listing.gym.address}`,
          },
        },
      },
    ],
    metadata: { bookingId: booking.id },
    success_url: `${origin}/confirm?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/coaches/${listing.coachId}?canceled=1`,
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
  });

  await prisma.booking.update({
    where: { id: booking.id },
    data: { stripeSessionId: session.id },
  });

  return NextResponse.json({ url: session.url });
}
