# Venture HQ

Local-first command center for managing all 12 ventures in one place — tasks, deadlines, documents, contacts, and notes per business. Single user, no auth, dark theme.

## Stack

Next.js 14 (App Router) · TypeScript · SQLite via Prisma · Tailwind CSS

## Run it

```bash
npm install          # also runs `prisma generate`
npm run db:push      # create prisma/venturehq.db
npm run db:seed      # load the 12 businesses + sample data
npm run dev          # http://localhost:3000
```

To wipe and re-seed the database at any point:

```bash
npm run db:reset
```

## Using it

- **Home** — Today panel (due today + overdue across every business), quick-capture input (type a task, pick a business, Enter), 14-day deadline strip color-coded by business, and the ventures grid.
- **`/business/[slug]`** — per-business kanban (Backlog / This Week / In Progress / Done), documents index, contacts, key links, and an autosaving markdown scratchpad.
- **`/tasks`** — every task, filterable by business / priority / due window, plus a full creation form with due date and recurrence (daily, weekly, biweekly, monthly). Completing a recurring task automatically spawns the next occurrence.
- **`/docs`** — global document search with category and business filters. Documents store links/paths + metadata only; the files themselves live in Drive or local folders.

### Keyboard

- `⌘K` / `Ctrl+K` — command palette: search tasks, docs, contacts, businesses
- `/` — jump to quick capture (home page)
- `Enter` / `Esc` — save / cancel inline forms

## Data

Everything lives in `prisma/venturehq.db` (gitignored). The schema also carries v2-ready tables — `Deal` (CRE pipeline stages lead → underwriting → offer → title → close) and `LedgerEntry` (revenue/expense quick-log) — with no UI yet.

## Hookemon University (`/hookemon`)

Gear training + certification for the Field series (OP-1 field, TX-6, TP-7, CM-15) and EP series (EP-133, EP-1320, EP-40). Lives in this app; trainees use it from their phones on the same Wi-Fi.

- **`/hookemon/survey`** — intake survey (role, music background, 0–3 self-rating per device, goals). Submitting takes the trainee to their card.
- **`/hookemon/card/[id]`** — the trainee's skill card: top-3 focus devices, before/after ratings, badges (Operator / Performer / Instructor), homework with a link-submit box, and a personal curriculum built from the gap between their rating and what their role needs. Post-session survey at `/hookemon/card/[id]/post`.
- **`/hookemon`** (instructor) — roster skill matrix, before/after averages, station groups, homework to review, hard questions from the room.
- **`/hookemon/gear/[slug]`** — modules per level (use + sell tracks), tips. As instructor, type the exact button steps into each module; they show up in every trainee's curriculum.

### Running a session

```bash
npm run db:reset                         # loads gear, curriculum and 3 demo trainees
npm run hk:clear                         # remove trainees (keeps gear + any steps you wrote)
HOOKEMON_KEY=pick-a-secret npm run dev:lan   # serve on the local network
```

Then open `http://localhost:3000/hookemon/unlock?key=pick-a-secret` on your laptop once. The roster shows the URL to give the room (your laptop's LAN address + `/hookemon/survey`).

With `HOOKEMON_KEY` set, everyone else can only reach the survey, their own card and the gear pages — Venture HQ and the roster stay locked. Without it, there's no lock (solo use).

Note: `db:reset` wipes everything, including steps you typed into modules. Use `hk:clear` between sessions instead.

Curriculum content: `lib/hookemon/content.ts`. Ranking logic: `lib/hookemon/curriculum.ts`.
