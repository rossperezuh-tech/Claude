import Database from "better-sqlite3";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs";
import { LocationId } from "./locations";

const DB_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "bookings.db");

/** Minutes a checkout hold keeps slots reserved before payment. */
const HOLD_MINUTES = 30;

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "expired";

export interface Booking {
  id: string;
  location: LocationId;
  date: string; // YYYY-MM-DD, America/New_York
  start_hour: number;
  hours: number;
  name: string;
  email: string;
  phone: string;
  amount_cents: number;
  promo_code: string;
  stripe_session_id: string | null;
  stripe_payment_intent: string | null;
  status: BookingStatus;
  created_at: string;
  confirmed_at: string | null;
  expires_at: string | null;
}

export class SlotTakenError extends Error {
  constructor() {
    super("One or more selected hours were just booked by someone else.");
    this.name = "SlotTakenError";
  }
}

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (db) return db;
  fs.mkdirSync(DB_DIR, { recursive: true });
  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      location TEXT NOT NULL,
      date TEXT NOT NULL,
      start_hour INTEGER NOT NULL,
      hours INTEGER NOT NULL,
      name TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      amount_cents INTEGER NOT NULL DEFAULT 0,
      stripe_session_id TEXT,
      stripe_payment_intent TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      confirmed_at TEXT,
      expires_at TEXT
    );
    CREATE TABLE IF NOT EXISTS booking_slots (
      location TEXT NOT NULL,
      date TEXT NOT NULL,
      hour INTEGER NOT NULL,
      booking_id TEXT NOT NULL REFERENCES bookings(id),
      UNIQUE (location, date, hour)
    );
    CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
    CREATE INDEX IF NOT EXISTS idx_slots_booking ON booking_slots(booking_id);
  `);
  try {
    db.exec(`ALTER TABLE bookings ADD COLUMN promo_code TEXT NOT NULL DEFAULT ''`);
  } catch {
    /* column already exists */
  }
  return db;
}

/** Release slots held by pending bookings whose hold window has lapsed. */
function cleanupExpired(d: Database.Database) {
  const now = new Date().toISOString();
  const stale = d
    .prepare(
      `SELECT id FROM bookings WHERE status = 'pending' AND expires_at IS NOT NULL AND expires_at < ?`
    )
    .all(now) as { id: string }[];
  if (stale.length === 0) return;
  const delSlots = d.prepare(`DELETE FROM booking_slots WHERE booking_id = ?`);
  const expire = d.prepare(`UPDATE bookings SET status = 'expired' WHERE id = ?`);
  for (const { id } of stale) {
    delSlots.run(id);
    expire.run(id);
  }
}

/** Hours already taken (paid or actively held) for a location + date. */
export function getBookedHours(location: LocationId, date: string): number[] {
  const d = getDb();
  const tx = d.transaction(() => {
    cleanupExpired(d);
    return d
      .prepare(`SELECT hour FROM booking_slots WHERE location = ? AND date = ?`)
      .all(location, date) as { hour: number }[];
  });
  return tx().map((r) => r.hour);
}

export function createPendingBooking(input: {
  location: LocationId;
  date: string;
  startHour: number;
  hours: number;
  name: string;
  email: string;
  phone: string;
  amountCents: number;
  promoCode?: string;
}): Booking {
  const d = getDb();
  const id = randomUUID();
  const now = new Date();
  const expires = new Date(now.getTime() + HOLD_MINUTES * 60 * 1000);

  const tx = d.transaction(() => {
    cleanupExpired(d);
    d.prepare(
      `INSERT INTO bookings (id, location, date, start_hour, hours, name, email, phone, amount_cents, promo_code, status, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`
    ).run(
      id,
      input.location,
      input.date,
      input.startHour,
      input.hours,
      input.name,
      input.email,
      input.phone,
      input.amountCents,
      input.promoCode ?? "",
      now.toISOString(),
      expires.toISOString()
    );
    const insSlot = d.prepare(
      `INSERT INTO booking_slots (location, date, hour, booking_id) VALUES (?, ?, ?, ?)`
    );
    for (let h = input.startHour; h < input.startHour + input.hours; h++) {
      insSlot.run(input.location, input.date, h, id);
    }
  });

  try {
    tx();
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      err.message.includes("UNIQUE constraint failed")
    ) {
      throw new SlotTakenError();
    }
    throw err;
  }
  return getBookingById(id)!;
}

export function attachStripeSession(bookingId: string, sessionId: string) {
  getDb()
    .prepare(`UPDATE bookings SET stripe_session_id = ? WHERE id = ?`)
    .run(sessionId, bookingId);
}

export function confirmBooking(
  bookingId: string,
  opts: { paymentIntent?: string | null; amountCents?: number | null } = {}
): Booking | null {
  const d = getDb();
  d.prepare(
    `UPDATE bookings
     SET status = 'confirmed',
         confirmed_at = COALESCE(confirmed_at, ?),
         expires_at = NULL,
         stripe_payment_intent = COALESCE(?, stripe_payment_intent),
         amount_cents = COALESCE(?, amount_cents)
     WHERE id = ? AND status IN ('pending', 'confirmed')`
  ).run(
    new Date().toISOString(),
    opts.paymentIntent ?? null,
    opts.amountCents ?? null,
    bookingId
  );
  return getBookingById(bookingId);
}

export function releaseBooking(bookingId: string) {
  const d = getDb();
  const tx = d.transaction(() => {
    const b = getBookingById(bookingId);
    if (!b || b.status !== "pending") return;
    d.prepare(`DELETE FROM booking_slots WHERE booking_id = ?`).run(bookingId);
    d.prepare(`UPDATE bookings SET status = 'cancelled' WHERE id = ?`).run(
      bookingId
    );
  });
  tx();
}

export function getBookingById(id: string): Booking | null {
  return (getDb()
    .prepare(`SELECT * FROM bookings WHERE id = ?`)
    .get(id) ?? null) as Booking | null;
}

export function getBookingByStripeSession(sessionId: string): Booking | null {
  return (getDb()
    .prepare(`SELECT * FROM bookings WHERE stripe_session_id = ?`)
    .get(sessionId) ?? null) as Booking | null;
}

export function listBookings(limit = 200): Booking[] {
  const d = getDb();
  cleanupExpired(d);
  return d
    .prepare(
      `SELECT * FROM bookings
       WHERE status IN ('confirmed', 'pending')
       ORDER BY date DESC, start_hour DESC
       LIMIT ?`
    )
    .all(limit) as Booking[];
}
