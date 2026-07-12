# Deckroom — DJ session booking site

Booking site for two private DJ practice/performance rooms (Greenpoint,
Brooklyn and Lower East Side, Manhattan), each with an Pioneer DJ OPUS-QUAD and
tuned monitors bundled into the room. Book by the hour, pay with Stripe, no
account needed.

**"Deckroom"** is a placeholder wordmark — swap the name in
`components/Wordmark.tsx`, `app/layout.tsx` metadata, and the copy when
branding is finalized. The accent color lives in `tailwind.config.ts`
(`acid`) and `app/globals.css`.

## Stack

- **Next.js 14 (App Router) + TypeScript + Tailwind** — one project, pages +
  API routes together
- **SQLite via better-sqlite3** — bookings + slot locks in `data/bookings.db`
- **Stripe Checkout** — real payment at booking time; simulated automatically
  in local dev when no key is set
- **Resend (optional)** — confirmation + admin-alert emails via plain HTTP

## Run it

```bash
npm install
npm run dev
```

That's it. With no env vars set, checkout is **simulated** (marked "dev mode"
on the confirmation page) so the entire flow — hold, confirm, slot-blocking,
admin view — works locally without Stripe keys.

## Going live

Copy `.env.example` to `.env` and set:

| Var | What |
| --- | --- |
| `STRIPE_SECRET_KEY` | Enables real Stripe Checkout |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for `/api/webhook` — subscribe it to `checkout.session.completed` and `checkout.session.expired` |
| `ADMIN_PASSWORD` | Password for `/admin` (defaults to `deckroom` in dev — change it) |
| `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_EMAIL` | Optional: confirmation email + per-booking admin alert. Without Resend, the Stripe receipt (sent to the customer's email) is the confirmation. |

Rates, opening hours, addresses, and copy per location:
`lib/locations.ts` (currently Greenpoint $45/hr 9am–11pm, Manhattan $60/hr
9am–12am, 21-day booking window, 4-hour max session — all placeholders,
edit freely).

## How double-booking is prevented

Every held hour is a row in `booking_slots` with a
`UNIQUE(location, date, hour)` constraint, inserted in the same transaction
as the booking. A concurrent checkout for an overlapping hour fails the
constraint and returns 409 to the client, which refreshes availability.
Unpaid holds expire after 30 minutes (Stripe checkout session is set to
expire in lockstep); cancelling checkout releases the slots immediately.

The webhook is the authoritative payment confirmation; the `/confirmed` page
also verifies the session directly with Stripe as a fallback so the flow
works even before webhooks are configured.

## Deploying

Built to deploy on **Vercel** (set the project root to `dj-booking/`) or any
Node host. One caveat: **SQLite needs a persistent disk.** On Vercel's
serverless runtime the filesystem is ephemeral, so before real traffic swap
the store in `lib/db.ts` for Turso (SQLite-compatible, has a free tier) or
Vercel Postgres — the data layer is isolated in that one file on purpose.
Alternatively deploy to a small VM/Fly.io/Railway instance where the
`data/` directory persists, and it works as-is.

## Map

```
app/
  page.tsx              landing
  book/[location]/      booking flow (day → slot → details → Stripe)
  confirmed/            post-payment confirmation
  admin/                password-protected bookings table
  api/availability      free/taken hours per day
  api/checkout          validates, holds slots, creates Stripe session
  api/webhook           Stripe events → confirm/release
components/
  BookingFlow.tsx       client-side booking UI
  DeckVisual.tsx        animated SVG model of the OPUS-QUAD (unused — hero now
                        uses a photo/video)
```

## Hero media

The homepage hero auto-detects its media (server-side `fs.existsSync`):
- When **`public/hero.mp4`** exists it renders an autoplaying, muted, looping,
  inline `<video>` with `public/hero.webm` as the first source and
  `public/hero-poster.jpg` as the poster. Currently a real clip of the
  OPUS-QUAD (encoded from the owner's screen recording, audio stripped).
- With no `hero.mp4`, it falls back to the still image (`public/xdj-rx3.png`).

No code change needed to switch — just add or remove the file. To refresh the
clip: re-encode with ffmpeg to MP4 (H.264) + WebM (VP9), strip audio (`-an`),
keep it short and small, and replace the three `hero.*` files.

```
  RoomScene.tsx         abstract room illustration (photo placeholder)
lib/
  locations.ts          ← rates, hours, copy (edit me)
  db.ts                 SQLite layer + slot locking
  dates.ts              America/New_York date handling
  stripe.ts, email.ts   integrations (both optional in dev)
```
