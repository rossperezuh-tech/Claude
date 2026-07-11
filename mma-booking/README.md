# Muay Thai Booking Site

Booking website for Muay Thai / MMA classes at **4220 Arthur Kill Rd, Units 9 & 10, Staten Island, NY 10309**.

Clients pick a date on a 28-day calendar, choose a class slot (with live remaining capacity), enter their details, and pay via Stripe Checkout. Bookings are stored in a local SQLite database.

## Quick start

```bash
cd mma-booking
npm install
cp .env.example .env      # then edit
npm run db:push           # creates prisma/dev.db
npm run dev               # http://localhost:3000
```

Without a Stripe key the site runs in **demo mode**: bookings confirm instantly with no payment, so you can test the full flow.

## Enabling real payments (Stripe)

1. Create a Stripe account and grab your secret key from <https://dashboard.stripe.com/test/apikeys> (test mode first).
2. Set `STRIPE_SECRET_KEY` in `.env`.
3. (Recommended for production) Add a webhook endpoint in the Stripe dashboard pointing at `https://yourdomain.com/api/webhook` for the events `checkout.session.completed` and `checkout.session.expired`, and set `STRIPE_WEBHOOK_SECRET`. This confirms bookings even if the client closes the tab after paying, and frees up spots when a checkout expires.
4. Set `NEXT_PUBLIC_BASE_URL` to your deployed URL.

Test cards: `4242 4242 4242 4242`, any future expiry, any CVC.

## Mobile app (PWA)

The site is an installable Progressive Web App. Once deployed over HTTPS, clients can add it to their phone like a native app — it opens full-screen with its own icon and bottom navigation, and uses the same bookings + Stripe checkout as the website:

- **iPhone**: open the site in Safari → Share → **Add to Home Screen**
- **Android**: open in Chrome → the **Install app** prompt (or ⋮ → Add to Home screen)

App name/icon come from `app/manifest.ts` and `public/icons/`.

## Pages

| Route | What it is |
|---|---|
| `/` | Landing page: programs, weekly schedule, instructor, location |
| `/book` | Booking flow: date calendar → class slots → details → Stripe Checkout |
| `/confirm` | Post-payment confirmation (verifies the Stripe session server-side) |
| `/admin` | Instructor view of upcoming bookings — **no auth yet, protect before going live** |

## Where to edit things

- **Gym name, phone, email, instructor bio** — `lib/site.ts` (placeholders marked `TODO`)
- **Weekly schedule** — `lib/schedule.ts` (`WEEKLY_SCHEDULE`); slot `id`s are stored on bookings, so don't rename ids once live
- **Prices & class capacity** — `lib/schedule.ts` (`CLASS_TYPES`, prices in cents)
- **Booking window** — `BOOKING_WINDOW_DAYS` in `lib/schedule.ts` (default 28 days)

## Schedule (Adults Muay Thai)

| Day | Classes |
|---|---|
| Mon / Wed / Fri | All Levels 7:30–8:30 AM · All Levels 11 AM–12 PM · Intro 7 PM · Beginners 7:30 PM |
| Tue / Thu | Beginners 6 PM · Sparring 6:45–7:30 PM |
| Sat | Open Mat 11:30 AM–12:30 PM |
| Sun | Women's Only 11:30 AM–12:30 PM |

## Deploying to Vercel (recommended)

1. Push your repo to GitHub.
2. Go to [vercel.com](https://vercel.com) and import the repository.
3. Set the project root to `mma-booking/`.
4. Add environment variables:
   - `STRIPE_SECRET_KEY` — your Stripe secret key
   - `NEXT_PUBLIC_BASE_URL` — your deployed domain (e.g., `https://yourdomain.com`)
   - `ADMIN_PASSWORD` — a strong password to protect `/admin`
5. Deploy.

**Database note:** SQLite works locally; for production on Vercel, swap it for a hosted DB (Turso or Postgres) since Vercel's filesystem is ephemeral. Change `datasource` in `prisma/schema.prisma` and update `DATABASE_URL` to a connection string.
