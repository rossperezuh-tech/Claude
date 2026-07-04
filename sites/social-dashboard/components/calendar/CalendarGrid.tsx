import { addDays, isSameDay, isToday } from "date-fns";
import { PLATFORM_LABEL } from "@/lib/constants";
import { PostStatusCycle } from "./PostStatusCycle";

type Post = {
  id: string;
  platform: string;
  caption: string;
  status: string;
  scheduledDate: Date;
  client: { name: string; color: string };
};

export function CalendarGrid({
  weekStart,
  posts,
}: {
  weekStart: Date;
  posts: Post[];
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="scroll-thin -mx-1 grid grid-cols-7 gap-3 overflow-x-auto px-1 pb-2 max-lg:min-w-[900px]">
      {days.map((day) => {
        const dayPosts = posts
          .filter((p) => isSameDay(p.scheduledDate, day))
          .sort((a, b) => a.client.name.localeCompare(b.client.name));
        return (
          <div
            key={day.toISOString()}
            className={`min-h-[220px] rounded-[11px] border p-3 ${
              isToday(day) ? "border-brand bg-brand-soft/30" : "border-line bg-surface"
            }`}
          >
            <div className="mb-2.5 border-b border-line pb-2">
              <div className="text-[13px] font-semibold text-ink">
                {day.toLocaleDateString("en-US", { weekday: "short" })}
              </div>
              <div className="text-[11.5px] text-ink-faint">
                {day.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </div>
            </div>
            <div className="space-y-2">
              {dayPosts.length === 0 && (
                <div className="text-[12px] text-ink-faint">No posts</div>
              )}
              {dayPosts.map((p) => (
                <div
                  key={p.id}
                  className="rounded-[8px] border border-line bg-canvas p-2"
                  style={{ borderLeftColor: p.client.color, borderLeftWidth: 3 }}
                >
                  <div className="truncate text-[12.5px] font-semibold text-ink">
                    {p.client.name}
                  </div>
                  <div className="mb-1.5 truncate text-[11.5px] text-ink-faint">
                    {PLATFORM_LABEL[p.platform]}
                    {p.caption ? ` · ${p.caption}` : ""}
                  </div>
                  <PostStatusCycle id={p.id} status={p.status} />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
