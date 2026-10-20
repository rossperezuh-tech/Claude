// Local-calendar date helpers. Dates are stored as "YYYY-MM-DD" strings.

const pad = (n: number) => String(n).padStart(2, "0");

export function toISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayISO(now: Date = new Date()): string {
  return toISO(now);
}

function parts(iso: string): [number, number, number] {
  const [y, m, d] = iso.split("-").map(Number);
  return [y, m, d];
}

/** Day number since epoch; DST-safe because it goes through UTC. */
export function dayNumber(iso: string): number {
  const [y, m, d] = parts(iso);
  return Math.round(Date.UTC(y, m - 1, d) / 86_400_000);
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = parts(iso);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

export function diffDays(fromISO: string, toISO_: string): number {
  return dayNumber(toISO_) - dayNumber(fromISO);
}

/** Monday of the week containing iso. */
export function weekStart(iso: string): string {
  const [y, m, d] = parts(iso);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = Sun
  return addDays(iso, -((dow + 6) % 7));
}

export function isValidISO(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(dayNumber(v));
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }): string {
  const [y, m, d] = parts(iso);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, opts);
}
