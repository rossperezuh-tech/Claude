import { addDays, diffDays, weekStart } from "./dates";

export interface Session {
  id: string;
  date: string;
  minutes: number;
  topic: string;
  notes: string;
}

export const LICENSE_DAYS = 90;

export function minutesByDay(sessions: Session[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const s of sessions) if (s.minutes > 0) m.set(s.date, (m.get(s.date) ?? 0) + s.minutes);
  return m;
}

/** Consecutive days with logged time, ending today (or yesterday if today has nothing yet). */
export function studyStreak(sessions: Session[], today: string): number {
  const byDay = minutesByDay(sessions);
  let day = byDay.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (byDay.has(day)) {
    streak++;
    day = addDays(day, -1);
  }
  return streak;
}

/** Minutes logged Monday–Sunday of the week containing today. */
export function minutesThisWeek(sessions: Session[], today: string): number {
  const start = weekStart(today);
  return sessions
    .filter((s) => diffDays(start, s.date) >= 0 && diffDays(s.date, today) >= 0)
    .reduce((a, s) => a + s.minutes, 0);
}

export function lastNDays(sessions: Session[], today: string, n: number): { date: string; minutes: number }[] {
  const byDay = minutesByDay(sessions);
  return Array.from({ length: n }, (_, i) => {
    const date = addDays(today, i - (n - 1));
    return { date, minutes: byDay.get(date) ?? 0 };
  });
}

export type LicenseLevel = "none" | "ok" | "amber" | "red" | "expired";

export function licenseStatus(purchaseDate: string | null, today: string) {
  if (!purchaseDate) return { level: "none" as LicenseLevel, daysLeft: null, expires: null };
  const expires = addDays(purchaseDate, LICENSE_DAYS);
  const daysLeft = diffDays(today, expires);
  const level: LicenseLevel = daysLeft < 0 ? "expired" : daysLeft < 14 ? "red" : daysLeft < 30 ? "amber" : "ok";
  return { level, daysLeft, expires };
}
