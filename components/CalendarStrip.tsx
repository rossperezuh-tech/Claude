import Link from "next/link";
import { addDays, format, isSameDay, startOfDay } from "date-fns";

type StripTask = {
  id: string;
  title: string;
  dueDate: string;
  business: { name: string; slug: string; color: string };
};

/** Two-week calendar grid (7 columns × 2 rows), color-coded by business. */
export default function CalendarStrip({ tasks }: { tasks: StripTask[] }) {
  const today = startOfDay(new Date());
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i));

  return (
    <section className="card p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-dim">
        Next 14 days
      </h2>
      <div className="overflow-x-auto pb-1">
        <div className="grid min-w-[680px] grid-cols-7 gap-2">
          {days.map((day, i) => {
            const dayTasks = tasks.filter((t) => isSameDay(new Date(t.dueDate), day));
            const isToday = i === 0;
            const isWeekend = [0, 6].includes(day.getDay());
            return (
              <div
                key={day.toISOString()}
                className={`flex min-h-[104px] flex-col rounded-lg border p-2 ${
                  isToday
                    ? "border-indigo-400/50 bg-indigo-400/[0.07]"
                    : `border-surface-edge ${isWeekend ? "bg-surface-overlay/20" : "bg-surface-overlay/40"}`
                }`}
              >
                <div className="flex items-baseline justify-between">
                  <span
                    className={`text-[10px] font-medium uppercase tracking-wide ${
                      isToday ? "text-indigo-300" : "text-ink-faint"
                    }`}
                  >
                    {format(day, "EEE")}
                  </span>
                  <span
                    className={`text-sm font-semibold leading-none ${
                      isToday ? "text-indigo-300" : "text-ink-dim"
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                </div>
                <div className="mt-2 space-y-1">
                  {dayTasks.slice(0, 4).map((t) => (
                    <Link
                      key={t.id}
                      href={`/business/${t.business.slug}`}
                      title={`${t.business.name}: ${t.title}`}
                      className="flex items-center gap-1.5 rounded px-1 py-0.5 hover:bg-surface-overlay"
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: t.business.color }}
                      />
                      <span className="truncate text-[11px] leading-tight text-ink-dim hover:text-ink">
                        {t.title}
                      </span>
                    </Link>
                  ))}
                  {dayTasks.length > 4 && (
                    <div className="pl-1 text-[10px] text-ink-faint">+{dayTasks.length - 4} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
