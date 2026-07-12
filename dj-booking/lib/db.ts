import { createClient, type Client, type Row } from "@libsql/client";
import { randomUUID } from "crypto";
import path from "path";
import { LocationId } from "./locations";

/**
 * Storage on libSQL (SQLite-compatible).
 *  - Local dev / persistent-disk hosts: a local file (no env vars needed).
 *  - Vercel & other serverless: set TURSO_DATABASE_URL (+ TURSO_AUTH_TOKEN)
 *    to a hosted Turso database, since serverless filesystems are read-only.
 */
function resolveUrl(): string {
  if (process.env.TURSO_DATABASE_URL) return process.env.TURSO_DATABASE_URL;
  const dir = process.env.DATA_DIR || path.join(process.cwd(), "data");
  return `file:${path.join(dir, "bookings.db")}`;
}

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

let client: Client | null = null;
let ready: Promise<Client> | null = null;

async function getClient(): Promise<Client> {
  if (client) return client;
  if (!ready) ready = init();
  client = await ready;
  return client;
}

async function init(): Promise<Client> {
  const c = createClient({
    url: resolveUrl(),
    authToken: process.env.TURSO_AUTH_TOKEN,
    intMode: "number",
  });
  await c.batch(
    [
      `CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        location TEXT NOT NULL,
        date TEXT NOT NULL,
        start_hour INTEGER NOT NULL,
        hours INTEGER NOT NULL,
        name TEXT NOT NULL DEFAULT '',
        email TEXT NOT NULL DEFAULT '',
        phone TEXT NOT NULL DEFAULT '',
        amount_cents INTEGER NOT NULL DEFAULT 0,
        promo_code TEXT NOT NULL DEFAULT '',
        stripe_session_id TEXT,
        stripe_payment_intent TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL,
        confirmed_at TEXT,
        expires_at TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS booking_slots (
        location TEXT NOT NULL,
        date TEXT NOT NULL,
        hour INTEGER NOT NULL,
        booking_id TEXT NOT NULL REFERENCES bookings(id),
        UNIQUE (location, date, hour)
      )`,
      `CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status)`,
      `CREATE INDEX IF NOT EXISTS idx_slots_booking ON booking_slots(booking_id)`,
    ],
    "write"
  );
  return c;
}

function rowToBooking(row: Row): Booking {
  return {
    id: row.id as string,
    location: row.location as LocationId,
    date: row.date as string,
    start_hour: Number(row.start_hour),
    hours: Number(row.hours),
    name: row.name as string,
    email: row.email as string,
    phone: row.phone as string,
    amount_cents: Number(row.amount_cents),
    promo_code: (row.promo_code as string) ?? "",
    stripe_session_id: (row.stripe_session_id as string | null) ?? null,
    stripe_payment_intent: (row.stripe_payment_intent as string | null) ?? null,
    status: row.status as BookingStatus,
    created_at: row.created_at as string,
    confirmed_at: (row.confirmed_at as string | null) ?? null,
    expires_at: (row.expires_at as string | null) ?? null,
  };
}

/** Release slots held by pending bookings whose hold window has lapsed. */
async function cleanupExpired(c: Client): Promise<void> {
  const now = new Date().toISOString();
  const stale = await c.execute({
    sql: `SELECT id FROM bookings WHERE status = 'pending' AND expires_at IS NOT NULL AND expires_at < ?`,
    args: [now],
  });
  if (stale.rows.length === 0) return;
  const stmts = [];
  for (const r of stale.rows) {
    const id = r.id as string;
    stmts.push({
      sql: `DELETE FROM booking_slots WHERE booking_id = ?`,
      args: [id],
    });
    stmts.push({
      sql: `UPDATE bookings SET status = 'expired' WHERE id = ?`,
      args: [id],
    });
  }
  await c.batch(stmts, "write");
}

/** Hours already taken (paid or actively held) for a location + date. */
export async function getBookedHours(
  location: LocationId,
  date: string
): Promise<number[]> {
  const c = await getClient();
  await cleanupExpired(c);
  const res = await c.execute({
    sql: `SELECT hour FROM booking_slots WHERE location = ? AND date = ?`,
    args: [location, date],
  });
  return res.rows.map((r) => Number(r.hour));
}

export async function createPendingBooking(input: {
  location: LocationId;
  date: string;
  startHour: number;
  hours: number;
  name: string;
  email: string;
  phone: string;
  amountCents: number;
  promoCode?: string;
}): Promise<Booking> {
  const c = await getClient();
  await cleanupExpired(c);

  const id = randomUUID();
  const now = new Date();
  const expires = new Date(now.getTime() + HOLD_MINUTES * 60 * 1000);

  const tx = await c.transaction("write");
  try {
    await tx.execute({
      sql: `INSERT INTO bookings (id, location, date, start_hour, hours, name, email, phone, amount_cents, promo_code, status, created_at, expires_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      args: [
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
        expires.toISOString(),
      ],
    });
    for (let h = input.startHour; h < input.startHour + input.hours; h++) {
      await tx.execute({
        sql: `INSERT INTO booking_slots (location, date, hour, booking_id) VALUES (?, ?, ?, ?)`,
        args: [input.location, input.date, h, id],
      });
    }
    await tx.commit();
  } catch (err: unknown) {
    await tx.rollback().catch(() => {});
    if (
      err instanceof Error &&
      /UNIQUE constraint failed/i.test(err.message)
    ) {
      throw new SlotTakenError();
    }
    throw err;
  }
  return (await getBookingById(id))!;
}

export async function attachStripeSession(
  bookingId: string,
  sessionId: string
): Promise<void> {
  const c = await getClient();
  await c.execute({
    sql: `UPDATE bookings SET stripe_session_id = ? WHERE id = ?`,
    args: [sessionId, bookingId],
  });
}

export async function confirmBooking(
  bookingId: string,
  opts: { paymentIntent?: string | null; amountCents?: number | null } = {}
): Promise<Booking | null> {
  const c = await getClient();
  await c.execute({
    sql: `UPDATE bookings
          SET status = 'confirmed',
              confirmed_at = COALESCE(confirmed_at, ?),
              expires_at = NULL,
              stripe_payment_intent = COALESCE(?, stripe_payment_intent),
              amount_cents = COALESCE(?, amount_cents)
          WHERE id = ? AND status IN ('pending', 'confirmed')`,
    args: [
      new Date().toISOString(),
      opts.paymentIntent ?? null,
      opts.amountCents ?? null,
      bookingId,
    ],
  });
  return getBookingById(bookingId);
}

export async function releaseBooking(bookingId: string): Promise<void> {
  const c = await getClient();
  const existing = await getBookingById(bookingId);
  if (!existing || existing.status !== "pending") return;
  await c.batch(
    [
      {
        sql: `DELETE FROM booking_slots WHERE booking_id = ?`,
        args: [bookingId],
      },
      {
        sql: `UPDATE bookings SET status = 'cancelled' WHERE id = ?`,
        args: [bookingId],
      },
    ],
    "write"
  );
}

export async function getBookingById(id: string): Promise<Booking | null> {
  const c = await getClient();
  const res = await c.execute({
    sql: `SELECT * FROM bookings WHERE id = ?`,
    args: [id],
  });
  return res.rows[0] ? rowToBooking(res.rows[0]) : null;
}

export async function getBookingByStripeSession(
  sessionId: string
): Promise<Booking | null> {
  const c = await getClient();
  const res = await c.execute({
    sql: `SELECT * FROM bookings WHERE stripe_session_id = ?`,
    args: [sessionId],
  });
  return res.rows[0] ? rowToBooking(res.rows[0]) : null;
}

export async function listBookings(limit = 200): Promise<Booking[]> {
  const c = await getClient();
  await cleanupExpired(c);
  const res = await c.execute({
    sql: `SELECT * FROM bookings
          WHERE status IN ('confirmed', 'pending')
          ORDER BY date DESC, start_hour DESC
          LIMIT ?`,
    args: [limit],
  });
  return res.rows.map(rowToBooking);
}
