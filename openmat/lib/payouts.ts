import type Stripe from "stripe";
import { prisma } from "./prisma";
import { getStripe } from "./stripe";

/**
 * After a booking's payment succeeds, transfer the gym's and coach's cuts to
 * their connected Stripe accounts. The platform fee stays in your balance.
 *
 * Uses Stripe's "separate charges and transfers" pattern: the client pays the
 * platform, then two transfers (tied to the charge via source_transaction)
 * route the splits. Idempotent — transfer IDs are recorded and never re-sent.
 * Recipients without a connected account are skipped (payoutStatus: "partial"
 * or "manual") and can be paid out by hand from the /admin numbers.
 */
export async function settleBookingPayouts(bookingId: string, checkoutSession?: Stripe.Checkout.Session) {
  const stripe = getStripe();
  if (!stripe) return; // demo mode

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { listing: { include: { coach: true, gym: true } } },
  });
  if (!booking || booking.status !== "confirmed") return;

  // Find the charge to anchor transfers to.
  let chargeId: string | null = null;
  try {
    let piId: string | null = null;
    if (checkoutSession?.payment_intent) {
      piId =
        typeof checkoutSession.payment_intent === "string"
          ? checkoutSession.payment_intent
          : checkoutSession.payment_intent.id;
    } else if (booking.stripeSessionId) {
      const s = await stripe.checkout.sessions.retrieve(booking.stripeSessionId);
      piId = typeof s.payment_intent === "string" ? s.payment_intent : s.payment_intent?.id ?? null;
    }
    if (piId) {
      const pi = await stripe.paymentIntents.retrieve(piId);
      chargeId = typeof pi.latest_charge === "string" ? pi.latest_charge : pi.latest_charge?.id ?? null;
    }
  } catch {
    chargeId = null;
  }
  if (!chargeId) return;

  const { coach, gym } = booking.listing;
  let coachTransferId = booking.coachTransferId;
  let gymTransferId = booking.gymTransferId;

  if (!coachTransferId && coach.stripeAccountId && booking.coachNetCents > 0) {
    try {
      const t = await stripe.transfers.create({
        amount: booking.coachNetCents,
        currency: "usd",
        destination: coach.stripeAccountId,
        source_transaction: chargeId,
        transfer_group: booking.id,
        description: `Coach payout — ${booking.listing.title} (${booking.listing.date})`,
      });
      coachTransferId = t.id;
    } catch (e) {
      console.error(`Coach transfer failed for booking ${booking.id}:`, e);
    }
  }

  if (!gymTransferId && gym.stripeAccountId && booking.gymCutCents > 0) {
    try {
      const t = await stripe.transfers.create({
        amount: booking.gymCutCents,
        currency: "usd",
        destination: gym.stripeAccountId,
        source_transaction: chargeId,
        transfer_group: booking.id,
        description: `Gym space share — ${booking.listing.title} (${booking.listing.date})`,
      });
      gymTransferId = t.id;
    } catch (e) {
      console.error(`Gym transfer failed for booking ${booking.id}:`, e);
    }
  }

  const payoutStatus =
    coachTransferId && gymTransferId ? "transferred" : coachTransferId || gymTransferId ? "partial" : "manual";

  await prisma.booking.update({
    where: { id: booking.id },
    data: { coachTransferId, gymTransferId, payoutStatus },
  });
}
