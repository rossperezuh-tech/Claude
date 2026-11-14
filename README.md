# Venture HQ

Command center for managing all 12 ventures in one place — tasks, deadlines, documents, contacts, notes and the CRE deal pipeline. Single user behind one password, dark theme, works on a phone.

## Stack

Next.js 14 (App Router) · TypeScript · Postgres via Prisma · Tailwind CSS · hosted on Vercel with a Neon database

## Put it online (Vercel + Neon)

1. **Merge this branch** into the branch Vercel will deploy.
2. In Vercel: **Add New → Project →** import `rossperezuh-tech/Claude`. Leave Root Directory as the repo root. Don't deploy yet.
3. In the project, open **Storage → Create Database → Neon** (free plan) and connect it. This sets `DATABASE_URL` and `DATABASE_URL_UNPOOLED` for you.
4. In **Settings → Environment Variables** add `APP_PASSWORD`: a password of at least 12 characters that you don't use anywhere else.
5. **Deploy.** The build creates the tables automatically.
6. Load the 12 businesses once. On your computer, copy the two Neon connection strings from Vercel into a `.env` file, then run `npm run db:setup`. That adds the businesses and nothing else: no sample tasks or deals.
7. Open the site, sign in, and add it to your phone's home screen.

To send the warehouse website's leads here, set the site's Venture HQ address to `https://<your-project>.vercel.app/api/leads`. Each lead lands in the pipeline as a Lead with "Call the seller" due the next day.

Optional settings: `AUTH_SECRET` (change it to sign out every device) and `LEAD_WEBHOOK_SECRET` (makes `/api/leads` require `?key=<value>`; it only stops casual bots, since the key is visible in the website's code).

## Run it on your computer

You need Postgres. Either install it, or create a second free Neon database for testing.

```bash
cp .env.example .env     # then put your database address in it
npm install              # also runs `prisma generate`
npm run db:reset         # create the tables + load the 12 businesses and sample data
npm run dev              # http://localhost:3000
```

Leave `APP_PASSWORD` blank locally to skip the sign-in page. `npm run db:reset` wipes the database you point it at, so never run it against the live one.

When you change `prisma/schema.prisma`, run `npm run db:migrate` to create a migration; Vercel applies it on the next deploy.

## Using it

- **Home** — Today panel (due today + overdue across every business), quick-capture input (type a task, pick a business, Enter), 14-day deadline strip color-coded by business, and the ventures grid.
- **`/business/[slug]`** — per-business kanban (Backlog / This Week / In Progress / Done), documents index, contacts, key links, and an autosaving markdown scratchpad.
- **`/tasks`** — every task, filterable by business / priority / due window, plus a full creation form with due date and recurrence (daily, weekly, biweekly, monthly). Completing a recurring task automatically spawns the next occurrence.
- **`/docs`** — global document search with category and business filters. Documents store links/paths + metadata only; the files themselves live in Drive or local folders.

### Deal pipeline

- **Deals** in the top bar opens the board. **+ New lead** adds a property; the arrows on a card move it between stages.
- Open a deal to underwrite it. Enter the rent roll, expenses, loan and sale assumptions and the page shows the **max offer** your targets allow, with opening, target and walk-away prices. Changes save as you type.
- **Use as offer** records the price on the deal. **Letter of intent** and **Deal sheet** build printable documents from the same numbers (print to PDF from the browser).
- The seller websites can send leads straight in by posting their form to `/api/leads` once this app is hosted. Set `LEAD_WEBHOOK_SECRET` and add `?key=…` to the form address to keep strangers out.
- `npm test` checks the underwriting math.

### Keyboard

- `⌘K` / `Ctrl+K` — command palette: search tasks, docs, contacts, businesses
- `/` — jump to quick capture (home page)
- `Enter` / `Esc` — save / cancel inline forms

## Data

Everything lives in Postgres. Migrations are in `prisma/migrations`. The schema also carries a v2-ready `LedgerEntry` table (revenue/expense quick-log) with no UI yet.
