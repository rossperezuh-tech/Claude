# Import from call — handoff notes

A starter feature so a call handled by the call-listening AI can become a
client in the dashboard without re-typing everything. Built as a working
v1 with obvious room to extend — it's yours to pick up.

## What works today

- New page at **`/import`** (also in the left sidebar, "Import from call").
- Paste the call summary → **Read it** → the parser pre-fills a form
  (name guess, contact email/phone, retainer from the budget band,
  platforms mentioned, starter tasks, and the full summary as notes).
- Human confirms/edits everything, clicks **Create client** → it creates
  the client with those notes and tasks and lands on `/clients`.
- Nothing is saved until the human confirms (human-in-the-loop by design).

## Files

| File | What it does |
|------|--------------|
| `lib/parse-summary.ts` | Pure parser: text → draft. **Start here.** |
| `components/import/ImportFlow.tsx` | The paste → confirm → create UI. |
| `app/import/page.tsx` | The page wrapper. |
| `app/actions.ts` → `importClientFromSummary` | Server action that creates the client + tasks. |
| `components/Sidebar.tsx` | Added the nav link. |

## Your turn — good next steps (roughly easiest first)

1. **Better name detection.** The intake questions don't ask for a
   business name directly, so today the human confirms it. Try pulling a
   cleaner name from the summary.
2. **Real deadline → task due date.** Parse "Any deadline?" into an actual
   date and set it on the "confirm the timeline" task.
3. **Handle the Prompt Sherpa "Build Intake" shape too**, not just
   Steadyhand — detect which one was pasted and adjust.
4. **Direct hook from the call AI.** Instead of paste, accept a POST from
   the AI (an API route at `app/api/import/route.ts`) so calls flow in
   automatically. Keep the same human-confirm step, or add an
   auto-create mode behind a clearly-labeled toggle.

## Try it

```bash
npm run dev        # http://localhost:3003/import
```
Click **Try a sample** to see it end to end without a real call.

## Working agreement

This is on branch `partner/call-intake-import`. See `COLLABORATING.md` at
the repo root — pull `main`, keep work on your `partner/…` branch, and
open a Pull Request when it's ready for Ross to merge.
