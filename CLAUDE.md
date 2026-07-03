# VENTURE HQ — Multi-Business Command Center Dashboard

Project spec / persistent context for Claude Code.

## What this is

A local-first personal command center for managing all of RP's ventures in one place: tasks, deadlines, documents, contacts, and pipeline status per business. Single user, no auth. Runs locally with `npm run dev`, deployable to Vercel later.

## Stack

- **Next.js 14+ (App Router), TypeScript**
- **SQLite via Prisma** (local file DB — simple, portable, no external services)
- **Tailwind CSS** — dark theme default
- **No login/auth** for v1 (single user, local)
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

## Design direction

- Dark theme, dense but clean — operator's cockpit, not a landing page
- Each business has a signature accent color used consistently (card border, tags, calendar dots)
- Mobile-responsive — must work from a phone (NY ↔ Houston)
- Fast: no loading spinners for local data, optimistic updates

## Code map

- `prisma/schema.prisma` — models; `prisma/seed.ts` — 12 businesses + sample data
- `app/actions.ts` — all server actions (mutations)
- `app/page.tsx` home · `app/business/[slug]` detail · `app/tasks` · `app/docs` · `app/api/search`
- `components/` — QuickCapture, TodayTaskRow, CalendarStrip, Kanban, NotesEditor, BusinessForms, NewTaskForm, CommandPalette
- `lib/` — prisma singleton, constants (statuses/priorities/colors), date helpers

## v2 backlog (schema is ready, do NOT build until asked)

- CRE deal pipeline module (lead → underwriting → offer → title → close) with per-deal docs — `Deal` model exists
- Revenue/expense quick-log per business — `LedgerEntry` model exists
- Google Drive API integration for live doc sync
- Weekly digest view ("what happened / what's next" per business)

## Rules for Claude Code

- Commit after each build-order step
- Keep everything in one repo, no microservices, no external APIs in v1
- Seed realistic sample data so the dashboard looks alive on first run
- `npm run db:reset` wipes and re-seeds the local DB
