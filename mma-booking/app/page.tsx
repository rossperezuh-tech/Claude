import Link from "next/link";
import { SITE } from "@/lib/site";
import {
  CLASS_TYPES,
  WEEKLY_SCHEDULE,
  formatPrice,
  formatTime,
  slotsForWeekday,
} from "@/lib/schedule";

const WEEKDAYS = [
  { day: 1, label: "Monday" },
  { day: 2, label: "Tuesday" },
  { day: 3, label: "Wednesday" },
  { day: 4, label: "Thursday" },
  { day: 5, label: "Friday" },
  { day: 6, label: "Saturday" },
  { day: 0, label: "Sunday" },
];

export default function HomePage() {
  const classKeys = Array.from(new Set(WEEKLY_SCHEDULE.map((s) => s.classKey)));

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-zinc-800 bg-gradient-to-b from-red-950/40 via-zinc-950 to-zinc-950">
        <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:py-28">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-red-500">
            Adults Muay Thai · Staten Island South
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">
            Train Muay Thai. <span className="text-red-500">Book in seconds.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-zinc-400">
            {SITE.description}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/book"
              className="w-full rounded-md bg-red-600 px-8 py-3 text-lg font-bold text-white hover:bg-red-500 sm:w-auto"
            >
              Book a Class
            </Link>
            <a
              href="#schedule"
              className="w-full rounded-md border border-zinc-700 px-8 py-3 text-lg font-semibold text-zinc-200 hover:border-zinc-500 sm:w-auto"
            >
              View Schedule
            </a>
          </div>
          <p className="mt-6 text-sm text-zinc-500">
            First time? Book an{" "}
            <span className="font-semibold text-red-400">Intro Muay Thai</span> class —{" "}
            {formatPrice(CLASS_TYPES.intro.priceCents)}. Comfy clothes, a water bottle, and an
            open mind is all you need.
          </p>
        </div>
      </section>

      {/* Classes */}
      <section id="classes" className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Classes</h2>
        <p className="mt-2 text-zinc-400">Every level, every goal — pay per class, no contracts.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classKeys.map((key) => {
            const c = CLASS_TYPES[key];
            return (
              <div
                key={key}
                className="flex flex-col rounded-lg border border-zinc-800 bg-zinc-900/50 p-5"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${c.color}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
                    {c.name}
                  </span>
                  <span className="text-lg font-bold">{formatPrice(c.priceCents)}</span>
                </div>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-zinc-400">{c.description}</p>
                <Link
                  href="/book"
                  className="mt-4 text-sm font-semibold text-red-400 hover:text-red-300"
                >
                  Book this class →
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* Weekly schedule */}
      <section id="schedule" className="border-y border-zinc-800 bg-zinc-900/30">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Weekly Schedule</h2>
          <p className="mt-2 text-zinc-400">
            Adults Muay Thai — pick a class, then choose your date on the booking page.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {WEEKDAYS.map(({ day, label }) => {
              const slots = slotsForWeekday(day);
              return (
                <div key={day} className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-zinc-300">
                    {label}
                  </h3>
                  {slots.length === 0 ? (
                    <p className="text-sm text-zinc-600">No classes</p>
                  ) : (
                    <ul className="space-y-2">
                      {slots.map((s) => {
                        const c = CLASS_TYPES[s.classKey];
                        return (
                          <li key={s.id} className="flex items-start gap-2 text-sm">
                            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${c.dot}`} />
                            <span>
                              <span className="font-medium text-zinc-200">{c.name}</span>
                              <br />
                              <span className="text-zinc-500">
                                {formatTime(s.startTime)} – {formatTime(s.endTime)}
                              </span>
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/book"
              className="inline-block rounded-md bg-red-600 px-8 py-3 font-bold text-white hover:bg-red-500"
            >
              Book a Class
            </Link>
          </div>
        </div>
      </section>

      {/* Instructor + location */}
      <section className="mx-auto grid max-w-5xl gap-8 px-4 py-16 md:grid-cols-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Your Instructor</h2>
          <p className="mt-1 font-semibold text-red-400">{SITE.instructor.name}</p>
          <p className="mt-3 leading-relaxed text-zinc-400">{SITE.instructor.blurb}</p>
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Find Us</h2>
          <p className="mt-3 text-zinc-300">
            {SITE.address}
            <br />
            {SITE.city}
          </p>
          <p className="mt-2 text-zinc-400">
            {SITE.phone}
            <br />
            {SITE.email}
          </p>
          <a
            href={SITE.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block rounded-md border border-zinc-700 px-5 py-2 text-sm font-semibold hover:border-zinc-500"
          >
            Open in Google Maps →
          </a>
        </div>
      </section>
    </div>
  );
}
