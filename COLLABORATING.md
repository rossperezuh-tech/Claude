# Working together on this repo

Two people (Ross + partner), each using their own Claude, both writing
code in this one repo. This is the shared workflow so nobody ever
overwrites anyone else's work. Both people — and both Claudes — follow it.

## The one rule

**Never work directly on `main`. Always work on your own branch.**

Think of `main` as the clean, shared master copy. Each person edits a
private copy (a "branch"), then merges it back in through a Pull Request
that the other person clicks to approve.

## Branch names

Prefix your branches with your name so it's obvious whose work is whose:

- Ross → `ross/<what-youre-doing>` (e.g. `ross/pricing-update`)
- Partner → `partner/<what-youre-doing>` (e.g. `partner/call-intake-import`)

## The loop (say this to your Claude)

1. **Start:** "Pull the latest `main`, then make a new branch called
   `ross/<thing>`." — always start from the newest shared code.
2. **Work:** build the feature, commit as you go, push the branch.
3. **Finish:** "Open a Pull Request from this branch into `main`."
4. **Review:** the *other* person looks at the Pull Request on GitHub and
   clicks **Merge** when it looks good.
5. **Sync:** after a merge, both people tell their Claude "pull the latest
   `main`" so you're both current again.

## If two edits collide (a "merge conflict")

If you both changed the same lines, GitHub will say there's a conflict
when merging. Don't panic — tell your Claude: *"there's a merge conflict
on this branch, pull `main` and resolve it."* It handles the fix; you just
re-merge.

## Rules of thumb

- Pull before you start. Branch while you work. Merge when you're done.
- Small, frequent Pull Requests beat one giant one — easier to review,
  fewer collisions.
- Don't both take on the exact same file at the same time if you can help
  it. Quick "I've got the dashboard, you take the intake" beats untangling
  it later.
