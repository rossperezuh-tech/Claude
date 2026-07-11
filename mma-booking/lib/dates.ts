// All class times are local to the gym (America/New_York).
const TZ = "America/New_York";

/** Today's date in the gym's timezone as YYYY-MM-DD. */
export function todayYmd(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

/** Current time in the gym's timezone as "HH:MM". */
export function nowHm(): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

export function isValidYmd(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/** Weekday (0 = Sun … 6 = Sat) for a YYYY-MM-DD string, timezone-safe. */
export function weekdayOf(ymd: string): number {
  return new Date(`${ymd}T12:00:00Z`).getUTCDay();
}

export function addDaysYmd(ymd: string, days: number): string {
  const d = new Date(`${ymd}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** "Mon, Jul 13" style label for a YYYY-MM-DD string. */
export function formatYmd(ymd: string, opts?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
    ...opts,
  }).format(new Date(`${ymd}T12:00:00Z`));
}
