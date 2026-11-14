# VENTURE HQ — Multi-Business Command Center Dashboard

Project spec / persistent context for Claude Code.

## What this is

A personal command center for managing all of RP's ventures in one place: tasks, deadlines, documents, contacts, and pipeline status per business. Single user behind one password. Hosted on Vercel with a Neon Postgres database; also runs locally with `npm run dev`.

## Stack

- **Next.js 14+ (App Router), TypeScript**
- **Postgres via Prisma** — Neon in production, any Postgres locally. Schema changes go through migrations (`npm run db:migrate`); Vercel's build runs `prisma migrate deploy`
- **Tailwind CSS** — dark theme default
- **One-password sign-in** (`APP_PASSWORD`, at least 12 characters when deployed) via `middleware.ts` + `lib/auth.ts`. Blank locally = no sign-in. `/login` and `/api/leads` are the only public routes
- Document storage: store **file links/paths + metadata**, not the files themselves (files live in Google Drive / local folders — DB just indexes them)

## The businesses (seeded into the DB)

1. **Brooklyn Tea Cigs** — herbal tea cigarettes, consumer product (co-founders: Anna, Paulina)
2. **Penthouse Yoga** — rooftop studio, 231 Norman Ave, Greenpoint (launched July 2026)
3. **Clean Plate NYC** — organic meal delivery, glass containers
4. **Brooklyn Vintage Watches** — two-tone Rolex + lab diamond configurator
5. **Green Shoots Studio** — content production for wellness brands
6. **Nativos** — organic cotton clothing
7. **Vesta / Nexus Capital** — CRE tokenization platform (Reg D 506(c))
8. **CRE Direct Buying** — sellyourwarehousedirect.com + CommercialCashOffer, lead gen + acquisitions (incl. 6416 Conley St, Houston)
9. **Steadyhand AI Consulting** — AI consulting for established businesses
10. **The Prompt Sherpa** — Claude Code consulting for startup creators
11. **All In One Health Shop** — product site
12. **Brooklyn Tiny Farm** — microgreens DTC

Each business has: name, slug, color tag, status (active / back-burner / launching), one-line description.

## Core features (v1 — built)

1. **Home dashboard** — business card grid (open task count, next deadline, status badge), Today panel (due today/overdue across all businesses, priority-sorted), pinned quick-capture input.
2. **Business detail page** (`/business/[slug]`) — tasks kanban (Backlog / This Week / In Progress / Done), documents list, contacts, autosaving markdown scratchpad, key links.
3. **Tasks** — title, business, due date, priority (P1/P2/P3), status, notes; recurring tasks (completing one spawns the next occurrence); global `/tasks` view filterable by business, priority, due date.
4. **Documents index** — title, business, category (legal / financial / brand / operations / compliance), URL or file path, notes, date; global search at `/docs`.
5. **Deadlines strip** — horizontal 14-day strip on home, color-coded by business.
6. **Quick search** — Cmd+K palette searching tasks, docs, contacts, businesses (`/api/search`).

## CRE deal pipeline (v2 — built)

7. **Deal pipeline** (`/deals`) — board by stage (Lead / Underwriting / Offer / Title / Closed, plus Dead), each card showing ask, max offer, next step and days in stage.
8. **Deal page** (`/deals/[id]`) — seller and property details, live underwriting workbench (autosaves), activity log, per-deal documents.
9. **Underwriting engine** (`lib/underwriting.ts`) — monthly model: rent roll, lease-up and rollover, expense recoveries, loan, sale. Solves the highest price that meets every return target and gives opening / target / walk-away offers, a wholesale max, and an IRR sensitivity grid. Tested in `lib/underwriting.test.ts` (`npm test`).
10. **Generated documents** — printable deal sheet (`/deals/[id]/sheet`) and letter of intent (`/deals/[id]/loi`) built from the same numbers.
11. **Lead intake** — `POST /api/leads` (JSON or form post) creates a Lead from the seller websites. Set `LEAD_WEBHOOK_SECRET` to require a key.

## Design direction

- Dark theme, dense but clean — operator's cockpit, not a landing page
- Each business has a signature accent color used consistently (card border, tags, calendar dots)
- Mobile-responsive — must work from a phone (NY ↔ Houston)
- Fast: no loading spinners for local data, optimistic updates

## Code map

- `prisma/schema.prisma` — models; `prisma/seed.ts` — 12 businesses + sample data
- `app/actions.ts` — all server actions (mutations), including deals
- `app/page.tsx` home · `app/business/[slug]` detail · `app/tasks` · `app/docs` · `app/api/search`
- `components/` — QuickCapture, TodayTaskRow, CalendarStrip, Kanban, NotesEditor, BusinessForms, NewTaskForm, CommandPalette
- `app/deals` board · `app/deals/[id]` deal page, `sheet`, `loi` · `app/api/leads` intake
- `components/deals/` — DealBoard, NewDealForm, DealFacts, Workbench, DealTimeline, LoiDocument
- `lib/` — prisma singleton, constants (statuses/priorities/colors), date helpers, `underwriting.ts` (engine), `deals.ts`, `loi.ts`

## v2 backlog (schema is ready, do NOT build until asked)

- Revenue/expense quick-log per business — `LedgerEntry` model exists
- Google Drive API integration for live doc sync
- Weekly digest view ("what happened / what's next" per business)

## Rules for Claude Code

- Commit after each build-order step
- Keep everything in one repo, no microservices. External services: Vercel and Neon only
- Seed realistic sample data so the dashboard looks alive on first run
- `npm run db:reset` wipes and re-seeds whatever database `.env` points at — never the live one
- `npm run db:setup` applies migrations and adds only the 12 businesses (for the live database)
- `npm test` runs the underwriting engine tests — keep them passing when the model changes
