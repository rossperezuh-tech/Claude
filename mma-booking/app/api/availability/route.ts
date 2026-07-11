import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CLASS_TYPES, slotsForWeekday } from "@/lib/schedule";
import { isValidYmd, nowHm, todayYmd, weekdayOf } from "@/lib/dates";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date") ?? "";
  if (!isValidYmd(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const slots = slotsForWeekday(weekdayOf(date));
  const counts = await prisma.booking.groupBy({
    by: ["slotId"],
    where: { date, status: { not: "cancelled" } },
    _count: { _all: true },
  });
  const countBySlot = new Map(counts.map((c) => [c.slotId, c._count._all]));

  const today = todayYmd();
  const now = nowHm();

  return NextResponse.json({
    date,
    slots: slots.map((s) => {
      const type = CLASS_TYPES[s.classKey];
      const booked = countBySlot.get(s.id) ?? 0;
      const past = date < today || (date === today && s.startTime <= now);
      return {
        slotId: s.id,
        className: type.name,
        classKey: s.classKey,
        startTime: s.startTime,
        endTime: s.endTime,
        priceCents: type.priceCents,
        capacity: type.capacity,
        spotsLeft: Math.max(0, type.capacity - booked),
        bookable: !past && booked < type.capacity,
      };
    }),
  });
}
