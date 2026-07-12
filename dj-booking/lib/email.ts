import { Booking } from "./db";
import { LOCATIONS, formatHour, formatMoney } from "./locations";
import { formatDateLong } from "./dates";

/**
 * Confirmation + admin-alert email via Resend's plain HTTP API (no SDK).
 * Optional: without RESEND_API_KEY this no-ops and the Stripe receipt
 * (receipt_email is set on the payment) is the customer's confirmation.
 */
export async function sendBookingEmails(booking: Booking): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const from = process.env.EMAIL_FROM || "Deckroom <onboarding@resend.dev>";
  const adminEmail = process.env.ADMIN_EMAIL;
  const loc = LOCATIONS[booking.location];
  const end = booking.start_hour + booking.hours;
  const when = `${formatDateLong(booking.date)}, ${formatHour(booking.start_hour)}–${formatHour(end)}`;

  const customerBody = [
    `You're booked.`,
    ``,
    `Location: ${loc.name} — ${loc.address}`,
    `When: ${when}`,
    `Session: ${booking.hours} hour${booking.hours > 1 ? "s" : ""}`,
    `Paid: ${formatMoney(booking.amount_cents)}`,
    ``,
    `The room includes a Pioneer DJ XDJ-RX3 and tuned monitors — bring USB sticks or your laptop.`,
    `Door code and arrival details will be sent the morning of your session.`,
    ``,
    `Booking ref: ${booking.id.slice(0, 8).toUpperCase()}`,
  ].join("\n");

  const send = (to: string, subject: string, text: string) =>
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, text }),
    }).catch((err) => {
      console.error("Email send failed:", err);
      return null;
    });

  const jobs: Promise<unknown>[] = [
    send(booking.email, `Booked — ${loc.name}, ${when}`, customerBody),
  ];
  if (adminEmail) {
    jobs.push(
      send(
        adminEmail,
        `New booking: ${loc.name} ${booking.date} ${formatHour(booking.start_hour)}`,
        `${booking.name} (${booking.email}, ${booking.phone})\n${when}\n${formatMoney(booking.amount_cents)} paid.\nRef ${booking.id}`
      )
    );
  }
  await Promise.all(jobs);
}
