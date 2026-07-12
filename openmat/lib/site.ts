// Platform config — rename the brand and tune the economics here.

export const PLATFORM = {
  name: "OpenMat",
  tagline: "Where independent coaches meet gyms and clients",
  description:
    "OpenMat connects MMA, Muay Thai, boxing, and BJJ coaches who don't have their own gym with gyms that have mat space — and with clients ready to train. Gyms earn on their space, coaches keep their independence, and booking takes seconds.",
  /** Platform's cut of every booking, in percent. This is how you get paid. */
  feePct: 10,
  supportEmail: "support@openmat.example.com", // TODO: real email
};

export const BOROUGHS = ["Staten Island", "Brooklyn", "Queens", "Manhattan", "Bronx"];

export const DISCIPLINES = ["Muay Thai", "Boxing", "BJJ", "Wrestling", "MMA"];

export function formatPrice(cents: number): string {
  return cents % 100 === 0 ? `$${cents / 100}` : `$${(cents / 100).toFixed(2)}`;
}

export function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12} ${ampm}` : `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function formatYmd(ymd: string, opts?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
    ...opts,
  }).format(new Date(`${ymd}T12:00:00Z`));
}

/** Compute the three-way split for a booking. Rounds in the platform's favor last. */
export function computeSplit(priceCents: number, gymSharePct: number) {
  const gymCutCents = Math.round((priceCents * gymSharePct) / 100);
  const platformFeeCents = Math.round((priceCents * PLATFORM.feePct) / 100);
  const coachNetCents = priceCents - gymCutCents - platformFeeCents;
  return { platformFeeCents, gymCutCents, coachNetCents };
}
