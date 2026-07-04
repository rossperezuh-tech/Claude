import { BOOKING_WINDOW_DAYS } from "./locations";

const NY_TZ = "America/New_York";

/** Current date parts in America/New_York regardless of server timezone. */
export function nyNow(): { date: string; hour: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: NY_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    hour: parseInt(get("hour"), 10) % 24,
  };
}

export interface DayOption {
  date: string; // YYYY-MM-DD
  weekday: string; // Mon
  monthDay: string; // Jul 4
  isToday: boolean;
}

/** The bookable window of days, starting today (NY time). */
export function bookableDays(): DayOption[] {
  const { date: todayStr } = nyNow();
  const [y, m, d] = todayStr.split("-").map(Number);
  const days: DayOption[] = [];
  for (let i = 0; i < BOOKING_WINDOW_DAYS; i++) {
    // Noon UTC avoids DST edge cases when adding days
    const dt = new Date(Date.UTC(y, m - 1, d + i, 12));
    const iso = dt.toISOString().slice(0, 10);
    days.push({
      date: iso,
      weekday: dt.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }),
      monthDay: dt.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
      isToday: i === 0,
    });
  }
  return days;
}

export function isValidBookableDate(date: string): boolean {
  return bookableDays().some((d) => d.date === date);
}

/** Long human form: "Friday, July 4". */
export function formatDateLong(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
