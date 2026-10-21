# Going live on Vercel (free)

Both apps are separate Vercel projects from the same GitHub repo. Vercel can't use SQLite, so they use Postgres (free on Neon).

## 1. Database (2 min, one DB can serve both apps)
1. Sign up at https://neon.tech, create a project.
2. Copy the **Direct connection** string (turn "Pooled connection" OFF). It looks like `postgresql://user:pass@host/db?sslmode=require`.

## 2. Deploy each app (repeat twice)
1. https://vercel.com/new → import the `Claude` GitHub repo, branch `claude/mma-booking-website-rm64jl`.
2. **Root Directory**: `mma-booking` (first project) / `openmat` (second project). Framework: Next.js.
3. Environment variables:

| Var | mma-booking | openmat |
|---|---|---|
| `DATABASE_URL` | Neon string | Neon string (use a second Neon database/branch, or the same one if you accept shared tables) |
| `ADMIN_PASSWORD` | your choice | your choice |
| `SESSION_SECRET` | – | long random string |
| `STRIPE_SECRET_KEY` | blank = demo mode | blank = demo mode |
| `NEXT_PUBLIC_BASE_URL` | your `https://….vercel.app` URL (after first deploy) | same |

4. Deploy. The build creates the tables automatically.

## 3. Load demo data (openmat only, once)
From your computer, in `openmat/`:
```bash
npm install
DATABASE_URL="<your neon string>" npm run db:seed
```
Then log in with `coach.marco@example.com` / `demo1234`.

Leave Stripe keys blank to show your buddy demo mode (bookings confirm instantly, no real charges). Add test keys (`sk_test_…`) to try real checkout.
