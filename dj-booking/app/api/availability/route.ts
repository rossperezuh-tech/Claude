import { NextRequest, NextResponse } from "next/server";
import { getBookedHours } from "@/lib/db";
import { isLocationId, LOCATIONS } from "@/lib/locations";
import { isValidBookableDate, nyNow } from "@/lib/dates";

export const dynamic = "force-dynamic";

export function GET(req: NextRequest) {
  const location = req.nextUrl.searchParams.get("location") ?? "";
  const date = req.nextUrl.searchParams.get("date") ?? "";

  if (!isLocationId(location)) {
    return NextResponse.json({ error: "Unknown location" }, { status: 400 });
  }
  if (!isValidBookableDate(date)) {
    return NextResponse.json({ error: "Date out of range" }, { status: 400 });
  }

  const loc = LOCATIONS[location];
  const booked = getBookedHours(location, date);
  const now = nyNow();
  // On the current day, hours that already started are gone.
  const minHour = date === now.date ? now.hour + 1 : loc.openHour;

  return NextResponse.json({
    openHour: loc.openHour,
    closeHour: loc.closeHour,
    minHour: Math.max(minHour, loc.openHour),
    bookedHours: booked,
  });
}
