export type LocationId = "greenpoint" | "manhattan";

export interface SpaceLocation {
  id: LocationId;
  name: string;
  borough: string;
  address: string;
  neighborhood: string;
  hourlyRateCents: number;
  /** First bookable hour, 24h clock */
  openHour: number;
  /** Last bookable hour START — a session starting here ends at closeHour+1 */
  closeHour: number;
  blurb: string;
  details: string[];
  transit: string;
}

export const LOCATIONS: Record<LocationId, SpaceLocation> = {
  greenpoint: {
    id: "greenpoint",
    name: "Greenpoint",
    borough: "Brooklyn",
    address: "Greenpoint, Brooklyn",
    neighborhood: "Off Manhattan Ave, near the G",
    hourlyRateCents: 4500,
    openHour: 9,
    closeHour: 22,
    blurb:
      "A quiet, treated room on a side street off Manhattan Ave. Book it, close the door, play as loud as the monitors go.",
    details: [
      "Pioneer DJ OPUS-QUAD 4-channel all-in-one system",
      "10.1\" touchscreen, touch jog wheels, 16 hot cues",
      "Pair of powered monitors, tuned to the room",
      "Sound-treated walls, no daytime noise limits",
      "Keypad entry — no front desk, no waiting",
    ],
    transit: "G at Greenpoint Ave · 5 min walk",
  },
  manhattan: {
    id: "manhattan",
    name: "Manhattan",
    borough: "Manhattan",
    address: "Lower East Side, Manhattan",
    neighborhood: "Lower East Side",
    hourlyRateCents: 6000,
    openHour: 9,
    closeHour: 23,
    blurb:
      "A below-grade room on the Lower East Side. Dark, cold-air quiet, and built for late sessions before a set.",
    details: [
      "Pioneer DJ OPUS-QUAD 4-channel all-in-one system",
      "10.1\" touchscreen, touch jog wheels, 16 hot cues",
      "Pair of powered monitors, tuned to the room",
      "Below street level — naturally isolated",
      "Keypad entry — no front desk, no waiting",
    ],
    transit: "F/J/M/Z at Delancey–Essex · 4 min walk",
  },
};

export const LOCATION_IDS = Object.keys(LOCATIONS) as LocationId[];

export function isLocationId(v: string): v is LocationId {
  return v in LOCATIONS;
}

/** How many days ahead a session can be booked. */
export const BOOKING_WINDOW_DAYS = 21;

/** Max session length in hours. */
export const MAX_HOURS = 4;

export function formatMoney(cents: number): string {
  return `$${(cents / 100) % 1 === 0 ? cents / 100 : (cents / 100).toFixed(2)}`;
}

export function formatHour(h: number): string {
  const hr = h % 24;
  if (hr === 0) return "12 AM";
  if (hr === 12) return "12 PM";
  return hr < 12 ? `${hr} AM` : `${hr - 12} PM`;
}
