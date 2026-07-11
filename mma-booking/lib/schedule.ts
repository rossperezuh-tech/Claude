// Weekly class schedule template + class type definitions.
// Weekday: 0 = Sunday … 6 = Saturday (matches Date.getDay()).

export type ClassTypeKey =
  | "intro"
  | "beginners"
  | "all-levels"
  | "sparring"
  | "open-mat"
  | "womens";

export interface ClassType {
  key: ClassTypeKey;
  name: string;
  description: string;
  priceCents: number;
  capacity: number;
  /** Tailwind classes for the accent chip */
  color: string;
  dot: string;
}

export const CLASS_TYPES: Record<ClassTypeKey, ClassType> = {
  intro: {
    key: "intro",
    name: "Intro Muay Thai",
    description:
      "Your first class. Learn stance, footwork, and the basic strikes in a friendly 1-on-1 style session. Comfy clothes, a water bottle, and an open mind — that's all you need.",
    priceCents: 2000,
    capacity: 10,
    color: "bg-red-500/15 text-red-400 border-red-500/30",
    dot: "bg-red-500",
  },
  beginners: {
    key: "beginners",
    name: "Beginners Muay Thai",
    description:
      "Fundamentals-focused training: punches, kicks, knees, elbows, and defense — built rep by rep with pad work and partner drills.",
    priceCents: 3000,
    capacity: 16,
    color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    dot: "bg-emerald-500",
  },
  "all-levels": {
    key: "all-levels",
    name: "All Levels Muay Thai",
    description:
      "Fast-paced technical class for every experience level. Bag work, pads, clinch, and conditioning — so fun it's addicting.",
    priceCents: 3000,
    capacity: 20,
    color: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    dot: "bg-sky-500",
  },
  sparring: {
    key: "sparring",
    name: "Sparring",
    description:
      "Controlled, coached live rounds. For students with instructor approval. Shin guards, 16oz gloves, and mouthguard required.",
    priceCents: 2500,
    capacity: 12,
    color: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    dot: "bg-blue-500",
  },
  "open-mat": {
    key: "open-mat",
    name: "Open Mat",
    description:
      "Open training time. Drill technique, hit bags, get rounds in, or work with a partner at your own pace.",
    priceCents: 1500,
    capacity: 24,
    color: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    dot: "bg-orange-500",
  },
  womens: {
    key: "womens",
    name: "Women's Only Muay Thai",
    description:
      "Women's only class — crush your fitness goals while learning real, life-saving technique in a supportive environment.",
    priceCents: 3000,
    capacity: 16,
    color: "bg-pink-500/15 text-pink-400 border-pink-500/30",
    dot: "bg-pink-500",
  },
};

export interface ScheduleSlot {
  /** Stable id used in bookings — do not change once live */
  id: string;
  weekday: number; // 0 = Sun … 6 = Sat
  classKey: ClassTypeKey;
  startTime: string; // "HH:MM" 24h
  endTime: string;
}

// Weekly template (Adults Muay Thai — Staten Island South).
export const WEEKLY_SCHEDULE: ScheduleSlot[] = [
  // Monday
  { id: "mon-0730-all", weekday: 1, classKey: "all-levels", startTime: "07:30", endTime: "08:30" },
  { id: "mon-1100-all", weekday: 1, classKey: "all-levels", startTime: "11:00", endTime: "12:00" },
  { id: "mon-1900-intro", weekday: 1, classKey: "intro", startTime: "19:00", endTime: "19:30" },
  { id: "mon-1930-beg", weekday: 1, classKey: "beginners", startTime: "19:30", endTime: "20:30" },
  // Tuesday
  { id: "tue-1800-beg", weekday: 2, classKey: "beginners", startTime: "18:00", endTime: "18:45" },
  { id: "tue-1845-spar", weekday: 2, classKey: "sparring", startTime: "18:45", endTime: "19:30" },
  // Wednesday
  { id: "wed-0730-all", weekday: 3, classKey: "all-levels", startTime: "07:30", endTime: "08:30" },
  { id: "wed-1100-all", weekday: 3, classKey: "all-levels", startTime: "11:00", endTime: "12:00" },
  { id: "wed-1900-intro", weekday: 3, classKey: "intro", startTime: "19:00", endTime: "19:30" },
  { id: "wed-1930-beg", weekday: 3, classKey: "beginners", startTime: "19:30", endTime: "20:30" },
  // Thursday
  { id: "thu-1800-beg", weekday: 4, classKey: "beginners", startTime: "18:00", endTime: "18:45" },
  { id: "thu-1845-spar", weekday: 4, classKey: "sparring", startTime: "18:45", endTime: "19:30" },
  // Friday
  { id: "fri-0730-all", weekday: 5, classKey: "all-levels", startTime: "07:30", endTime: "08:30" },
  { id: "fri-1100-all", weekday: 5, classKey: "all-levels", startTime: "11:00", endTime: "12:00" },
  { id: "fri-1900-intro", weekday: 5, classKey: "intro", startTime: "19:00", endTime: "19:30" },
  { id: "fri-1930-beg", weekday: 5, classKey: "beginners", startTime: "19:30", endTime: "20:15" },
  // Saturday
  { id: "sat-1130-open", weekday: 6, classKey: "open-mat", startTime: "11:30", endTime: "12:30" },
  // Sunday
  { id: "sun-1130-women", weekday: 0, classKey: "womens", startTime: "11:30", endTime: "12:30" },
];

/** How far ahead clients can book, in days. */
export const BOOKING_WINDOW_DAYS = 28;

export function slotsForWeekday(weekday: number): ScheduleSlot[] {
  return WEEKLY_SCHEDULE.filter((s) => s.weekday === weekday).sort((a, b) =>
    a.startTime.localeCompare(b.startTime)
  );
}

export function getSlot(slotId: string): ScheduleSlot | undefined {
  return WEEKLY_SCHEDULE.find((s) => s.id === slotId);
}

export function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12} ${ampm}` : `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function formatPrice(cents: number): string {
  return cents % 100 === 0 ? `$${cents / 100}` : `$${(cents / 100).toFixed(2)}`;
}
