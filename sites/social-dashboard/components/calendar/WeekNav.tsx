import Link from "next/link";
import { formatDate } from "@/lib/format";

export function WeekNav({
  weekStart,
  weekEnd,
  offset,
}: {
  weekStart: Date;
  weekEnd: Date;
  offset: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <Link href={`/calendar?week=${offset - 1}`} className="btn-line !p-2" aria-label="Previous week">
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </Link>
      <div className="min-w-[170px] text-center text-[13.5px] font-medium text-ink">
        {formatDate(weekStart)} – {formatDate(weekEnd)}
      </div>
      <Link href={`/calendar?week=${offset + 1}`} className="btn-line !p-2" aria-label="Next week">
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </Link>
      {offset !== 0 && (
        <Link href="/calendar" className="btn-ghost !py-2 text-[13px]">
          Today
        </Link>
      )}
    </div>
  );
}
