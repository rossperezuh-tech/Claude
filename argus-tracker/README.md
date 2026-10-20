# ARGUS Prep Tracker

Mobile-first dashboard for a 6-week ARGUS Enterprise learning program. React + Vite + TypeScript + Tailwind.
All data lives in the browser's `localStorage`. There's no backend and no login. Installable as a PWA.

## Run

```bash
cd argus-tracker
npm install
npm run dev        # http://localhost:5173
npm run dev:host   # also reachable from your phone on the same Wi-Fi
npm test           # unit tests (calculator, streak, license countdown)
npm run build      # production build to dist/
```

## Screens

Home · Plan · Videos · Study (flashcards + interview) · Log · Case (120 Kent calculator) · Settings (gear icon).

## Data & backup

Settings → **Export JSON** downloads a full backup. **Import JSON** restores it, which is also how you move data
between your phone and laptop. Storage key: `argus-tracker:v1`.

## Deploy (Vercel)

This app lives in the `argus-tracker/` subfolder of the repo, so set **Root Directory = `argus-tracker`** when you
import the project. Vercel detects Vite automatically (build `npm run build`, output `dist`). `vercel.json` sets
no-cache headers on the service worker.

## Code map

- `src/data/program.ts`: weeks, tasks, videos, concepts, interview questions (seed data)
- `src/lib/calc.ts`: practice case calculator (+ `calc.test.ts`)
- `src/lib/stats.ts`: streak, weekly minutes, 14-day series, license countdown (+ tests)
- `src/lib/store.tsx`: app state, localStorage persistence, import normalization
- `src/screens/*`: one file per screen
- `public/sw.js`, `public/manifest.webmanifest`, `public/icons/`: PWA (regenerate icons with `npm run icons`)
