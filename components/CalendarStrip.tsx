import Link from "next/link";
import { addDays, format, isSameDay, startOfDay } from "date-fns";

type StripTask = {
  id: string;
  title: string;
  dueDate: string;
  business: { name: string; slug: string; color: string };
};

/** Horizontal 14-day deadline strip, color-coded by business. */
export default function CalendarStrip({ tasks }: { tasks: StripTask[] }) {
  const today = startOfDay(new Date());
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i));

  return (
    <section className="card p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-dim">
        Next 14 days
      </h2>
      <div className="overflow-x-auto pb-1">
        <div className="flex min-w-max gap-1.5">
          {days.map((day, i) => {
            const dayTasks = tasks.filter((t) => isSameDay(new Date(t.dueDate), day));
            const isToday = i === 0;
            return (
              <div
                key={day.toISOString()}
                className={`w-[92px] shrink-0 rounded-md border p-2 ${
                  isToday
                    ? "border-indigo-400/50 bg-indigo-400/5"
                    : "border-surface-edge bg-surface-overlay/40"
                }`}
              >
                <div className={`text-[11px] font-medium ${isToday ? "text-indigo-300" : "text-ink-faint"}`}>
                  {isToday ? "Today" : format(day, "EEE d")}
                </div>
                <div className="mt-1.5 space-y-1">
                  {dayTasks.length === 0 && <div className="h-1.5" />}
                  {dayTasks.slice(0, 4).map((t) => (
                    <Link
                      key={t.id}
                      href={`/business/${t.business.slug}`}
                      title={`${t.business.name}: ${t.title}`}
                      className="flex items-center gap-1"
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: t.business.color }}
                      />
                      <span className="truncate text-[10px] leading-tight text-ink-dim hover:text-ink">
                        {t.title}
                      </span>
                    </Link>
                  ))}
                  {dayTasks.length > 4 && (
                    <div className="text-[10px] text-ink-faint">+{dayTasks.length - 4} more</div>
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
