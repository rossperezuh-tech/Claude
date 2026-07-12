/**
 * Promo / referral codes. v1 keeps this as a simple static map — a code is
 * shared word-of-mouth ("refer a friend"), applied at checkout, and stored
 * on the booking so the admin view shows which bookings came from referrals.
 * If this outgrows a hardcoded list, move codes into the DB with usage caps.
 */
export interface PromoCode {
  code: string;
  pctOff: number;
  label: string;
}

const CODES: Record<string, PromoCode> = {
  REFER20: {
    code: "REFER20",
    pctOff: 20,
    label: "Refer-a-friend — 20% off",
  },
};

export function lookupPromo(raw: string | undefined | null): PromoCode | null {
  if (!raw) return null;
  const code = raw.trim().toUpperCase();
  return CODES[code] ?? null;
}

export function applyPromo(amountCents: number, promo: PromoCode | null): number {
  if (!promo) return amountCents;
  return Math.round((amountCents * (100 - promo.pctOff)) / 100);
}
