import { addDays, isSameDay, startOfDay } from "date-fns";
import Link from "next/link";
import { PLATFORM_LABEL } from "@/lib/constants";

type Post = {
  id: string;
  platform: string;
  caption: string;
  status: string;
  scheduledDate: Date;
  client: { name: string; color: string };
};

export function WeekStrip({ posts, today }: { posts: Post[]; today: Date }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(startOfDay(today), i));

  return (
    <div className="scroll-thin -mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
      {days.map((day) => {
        const dayPosts = posts.filter((p) => isSameDay(p.scheduledDate, day));
        const isToday = isSameDay(day, today);
        return (
          <div
            key={day.toISOString()}
            className={`w-[160px] shrink-0 rounded-[11px] border p-3 ${
              isToday
                ? "border-brand bg-brand-soft/40"
                : "border-line bg-surface"
            }`}
          >
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-[12.5px] font-semibold text-ink">
                {day.toLocaleDateString("en-US", { weekday: "short" })}
              </span>
              <span className="text-[12px] text-ink-faint">
                {day.toLocaleDateString("en-US", { month: "numeric", day: "numeric" })}
              </span>
            </div>
            <div className="space-y-1.5">
              {dayPosts.length === 0 && (
                <div className="text-[12px] text-ink-faint">—</div>
              )}
              {dayPosts.slice(0, 4).map((p) => (
                <Link
                  key={p.id}
                  href="/calendar"
                  className="block truncate rounded-[6px] px-1.5 py-1 text-[11.5px] font-medium text-white"
                  style={{ background: p.client.color }}
                  title={`${p.client.name} · ${PLATFORM_LABEL[p.platform]}`}
                >
                  {p.client.name}
                </Link>
              ))}
              {dayPosts.length > 4 && (
                <div className="text-[11px] text-ink-faint">
                  +{dayPosts.length - 4} more
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
