# OpenMat — Coach ↔ Gym ↔ Client Marketplace

A three-sided marketplace for combat sports:

- **Coaches without a gym** create a profile, partner with gyms that have mat space, and post bookable sessions.
- **Gyms** approve coaches, host their sessions, and earn a space share on every booking.
- **Clients** browse coaches by discipline/borough and book + pay online — no account needed.
- **You (the platform)** take a fee on every booking. That's the business.

## The money flow

Every booking is split three ways at payment time and recorded on the booking row:

| Party | Cut | Set where |
|---|---|---|
| Platform (you) | 10% | `PLATFORM.feePct` in `lib/site.ts` |
| Gym | its space share (default 20%, gym sets 5–50% at signup) | gym profile |
| Coach | the remainder (~70%) | — |

Example: $100 session → you $10, gym $20, coach $70.

## Quick start

```bash
cd openmat
npm install
cp .env.example .env       # then edit
npm run db:reset           # creates + seeds the database
npm run dev                # http://localhost:3000
```

### Demo accounts (all password `demo1234`)

| Role | Email |
|---|---|
| Coach (Muay Thai) | coach.marco@example.com |
| Coach (Boxing) | coach.aisha@example.com |
| Coach (BJJ) | coach.viktor@example.com |
| Gym (Staten Island) | gym.southshore@example.com |
| Gym (Brooklyn) | gym.bayridge@example.com |

The seed includes approved partnerships, upcoming sessions, one pending coach request (so the gym dashboard has something to approve), and confirmed bookings so every dashboard shows real earnings numbers.

## Pages

| Route | What it is |
|---|---|
| `/` | Landing page with the three-sided pitch and live counts |
| `/coaches` | Browse coaches, filter by discipline and borough |
| `/coaches/[id]` | Coach profile + upcoming sessions + book & pay |
| `/gyms` | Browse partner gyms |
| `/gyms/[id]` | Gym profile; coaches request partnerships here |
| `/signup`, `/login` | Coach and gym accounts (clients don't need one) |
| `/dashboard` | Role-aware: coach earnings/listings or gym requests/revenue |
| `/confirm` | Booking confirmation (verifies Stripe payment server-side) |
| `/admin` | **Your** platform earnings — protected by `ADMIN_PASSWORD` |

## Payments

Without `STRIPE_SECRET_KEY` the app runs in **demo mode** — bookings confirm instantly so you can exercise the whole flow. With a key set, clients pay through Stripe Checkout and bookings confirm on payment (via `/confirm` verification and optionally the `/api/webhook` endpoint).

**Production payouts:** today, all money lands in your Stripe account and the per-booking split is recorded in the database — you'd pay gyms and coaches out manually (weekly transfer, Zelle, etc.). The real upgrade path is **Stripe Connect** (Express accounts): coaches and gyms onboard once, and Stripe automatically routes each payment three ways using the same split fields this app already computes (`platformFeeCents`, `gymCutCents`, `coachNetCents`). The schema is ready for it.

## Config

- Platform fee % and brand name: `lib/site.ts`
- Session secret, Stripe keys, admin password: `.env` (see `.env.example`)
- Boroughs/disciplines lists: `lib/site.ts`

## Deploying

Same shape as any Next.js app (Vercel etc.). Use a hosted database in production (Turso/Postgres) — SQLite is for local dev. Set `SESSION_SECRET`, `ADMIN_PASSWORD`, `STRIPE_SECRET_KEY`, and `NEXT_PUBLIC_BASE_URL`.
