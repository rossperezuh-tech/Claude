import BookingWidget from "@/components/BookingWidget";
import { BOOKING_WINDOW_DAYS, WEEKLY_SCHEDULE } from "@/lib/schedule";
import { addDaysYmd, todayYmd } from "@/lib/dates";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

export default function BookPage({
  searchParams,
}: {
  searchParams?: { canceled?: string };
}) {
  const today = todayYmd();
  const dates = Array.from({ length: BOOKING_WINDOW_DAYS }, (_, i) => addDaysYmd(today, i));
  const activeWeekdays = Array.from(new Set(WEEKLY_SCHEDULE.map((s) => s.weekday)));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-black tracking-tight">Book a Class</h1>
      <p className="mt-2 text-zinc-400">
        {SITE.address}, {SITE.city} · Pay per class, no contracts.
      </p>
      <div className="mt-8">
        <BookingWidget
          dates={dates}
          activeWeekdays={activeWeekdays}
          canceled={searchParams?.canceled === "1"}
        />
      </div>
    </div>
  );
}
