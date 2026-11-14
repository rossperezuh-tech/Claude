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

Everything lives in `prisma/venturehq.db` (gitignored). The schema also carries v2-ready tables — `Deal` (CRE pipeline stages lead → underwriting → offer → title → close) and `LedgerEntry` (revenue/expense quick-log) — with no UI yet.
