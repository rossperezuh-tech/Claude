import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { confirmBooking, getBookingById, releaseBooking } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { sendBookingEmails } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * Stripe webhook: the authoritative "payment happened" signal.
 * Configure the endpoint for checkout.session.completed and
 * checkout.session.expired, and set STRIPE_WEBHOOK_SECRET.
 */
export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 501 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const payload = await req.text();
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.expired"
  ) {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.bookingId;
    if (bookingId && getBookingById(bookingId)) {
      if (event.type === "checkout.session.completed") {
        const existing = getBookingById(bookingId);
        const alreadyConfirmed = existing?.status === "confirmed";
        const booking = confirmBooking(bookingId, {
          paymentIntent:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id,
          amountCents: session.amount_total,
        });
        if (booking && !alreadyConfirmed) await sendBookingEmails(booking);
      } else {
        releaseBooking(bookingId);
      }
    }
  }

  return NextResponse.json({ received: true });
}
