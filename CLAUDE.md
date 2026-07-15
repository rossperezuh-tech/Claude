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

## Multi-tenant + auth (built)

- **Clerk** authentication; every route (incl. tool APIs) requires a session (`middleware.ts`)
- Each user gets an **Organization** auto-provisioned on first sign-in (`lib/org.ts` → `requireOrg()`)
- ALL queries/mutations are org-scoped; business slugs unique per org; ownership verified on every mutation
- New users see a create-your-first-venture onboarding screen

## Steadyhand tools (`/tools`, all Claude-powered via `lib/claude.ts`)

1. **Document Reader** — contract/brief analysis: clauses, dates, risks
2. **Meeting Notes** — notes → action items, bulk-add to a venture's backlog
3. **Contract Manager** — analyze & track contracts (renewal alerts), draft agreements
4. **The Brain** — chat assistant with 8 org-scoped DB tools (incl. content calendar + pipeline)
5. **Content Studio** — brand-voice captions/scripts/carousels/hooks; saves drafts to calendar
6. **Content Calendar** — posts board (idea → drafted → scheduled → posted) + 7-day strip
7. **Launch Planner** — launch brief + date → phased work-back plan → bulk-add tasks
8. **Client & Order Tracker** — pipeline board (lead → done) with $ value per stage
9. **Deal Tracker** — CRE pipeline (lead → underwriting → offer → title → close): asking/offer $, seller contact, target-close urgency chips (red ≤14d, amber ≤45d), The Brain integration (`query_deals`); includes the **Deal Analyzer** panel (listing/seller notes → red flags, seller questions, DD checklist → backlog, offer strategy)
10. **Money Log** — LedgerEntry quick-log (money in/out) per venture, month nav, per-business rev/exp/net rollup; Brain tool `query_ledger`
11. **Weekly Digest** — one-click Monday briefing from a 7-day-back/7-day-forward org snapshot (tasks, deals, content, renewals, money, pipeline)
12. **Usage & Billing** — every Claude call metered per org into `UsageEvent` (via `lib/claude.ts` `recordUsage`); /tools/usage shows month-by-tool usage + est cost; `ADMIN_CLERK_USER_ID` env unlocks the all-accounts table for client billing
13. **Brain Dump** — paste unstructured thoughts → AI routes to tasks/content ideas/pipeline leads/ledger entries per business → review checkboxes → `applyBrainDump` action
14. **Proposals & Invoices** — pipeline-item prefill → brand-voice Markdown proposal or invoice (copy/download)
15. **Lead Intake** — public per-business form at /intake/[token] (nullable `intakeToken` minted on first enable, `intakeEnabled` toggle, managed from /tools/pipeline); POST /api/intake is the app's ONLY unauthenticated write: honeypot + per-IP rate limit + length caps; AI lead scoring is best-effort and never blocks the save
16. **SOP Writer** — process description → step-by-step Markdown SOP
17. **Client Report** — outward-facing "what we did for you" report from a venture's real activity (tasks/content/pipeline)

**Demo account**: `prisma/seed-demo.ts` (`npm run db:seed-demo`, needs `DEMO_CLERK_USER_ID`) fills a fictional 3-business portfolio (Harbor Social agency, Emberline Candle Co., True North Coaching) for prospect walkthroughs — never mix demo and real data in one org.

## Design direction

- Dark theme, dense but clean — operator's cockpit, not a landing page
- Each business has a signature accent color used consistently (card border, tags, calendar dots)
- Mobile-responsive — must work from a phone (NY ↔ Houston)
- Fast: no loading spinners for local data, optimistic updates

## Code map

- `prisma/schema.prisma` — models; `prisma/seed.ts` — owner org + 12 businesses + sample data
- `app/actions.ts` — all server actions (mutations, all org-scoped)
- `app/page.tsx` home · `app/business/[slug]` detail · `app/tasks` · `app/docs` · `app/api/search`
- `app/tools/*` — tool pages · `app/api/tools/*` — Claude-backed routes
- `components/` — QuickCapture, TodayTaskRow, CalendarStrip, Kanban, NotesEditor, BusinessForms, NewTaskForm, NewBusinessForm, CommandPalette
- `lib/` — prisma singleton, org helper (requireOrg), claude helper, constants, date helpers, tools registry

## v2 backlog (schema is ready, do NOT build until asked)

- Google Drive API integration for live doc sync

## Rules for Claude Code

- Commit after each build-order step
- Keep everything in one repo, no microservices, no external APIs in v1
- Seed realistic sample data so the dashboard looks alive on first run
- `npm run db:reset` wipes and re-seeds the local DB
