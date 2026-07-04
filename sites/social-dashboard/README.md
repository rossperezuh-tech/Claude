# Social Dashboard

A client, contract, invoice, content calendar, and performance command
center for a social media management business.

- **Home dashboard** — active clients, MRR, invoices due, content due this
  week, this week's content strip, open tasks, contract renewals
- **Clients** (`/clients`) — grid of every client; detail page per client
  with editable status/contact info, autosaving notes, upcoming content,
  tasks, contracts, invoices, and a performance snapshot
- **Contracts** (`/contracts`) — every agreement, filterable by status,
  template-based generator that autofills client details, renewal flagging
  inside 30 days
- **Invoices** (`/invoices`) — one-click "Generate this month's invoices"
  for every active client, status tracking (draft → sent → paid/overdue)
- **Content Calendar** (`/calendar`) — cross-client weekly view,
  click-to-advance post status (idea → drafted → scheduled → posted)
- **Performance** (`/performance`) — follower/engagement/reach trends per
  client and platform, plus an accessible table view

## Stack

Next.js 14 (App Router) + TypeScript, Prisma + SQLite (local file DB),
Tailwind CSS. No auth — single-user local tool, same pattern as the other
projects in this repo.

## Run

```bash
npm install
npm run db:push    # create the local SQLite DB
npm run db:seed    # 8 sample clients with contracts, invoices, content, tasks
npm run dev        # http://localhost:3003
```

`npm run db:reset` wipes and reseeds the local DB.

## Design

Clean, high-contrast light theme — built for readability over decoration.
Each client gets a fixed accent color (validated colorblind-safe palette,
`lib/constants.ts`) reused consistently across avatars, the calendar, and
performance charts, so identity is never carried by color alone.
