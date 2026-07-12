# Deckroom — Client Acquisition Plan
### Capturing people Googling "how to DJ in NYC / Brooklyn"

The funnel, in one line: **Google search → SEO page or ad → booking page →
paid session → REFER20 turns them into a recruiter.**

---

## 1. What's already built (on the site, live in this repo)

| Asset | URL | Job |
|---|---|---|
| Guide page | `/learn-to-dj-nyc` | Ranks for "learn to DJ NYC", "how to DJ" searches. Real advice, FAQ schema markup so Google can show it as rich results, CTA into booking. |
| Location page | `/dj-practice-space-brooklyn` | Ranks for "DJ practice space Brooklyn / NYC". Honest cost-comparison table, LocalBusiness schema, CTA into booking. |
| Refer-a-friend section | `/#refer` | Public **REFER20** code — 20% off first session, wired into checkout for real. |
| Promo code at checkout | booking flow | Code field applies the discount live; admin table shows which bookings used it, so referral revenue is measurable. |
| Sitemap + robots | `/sitemap.xml`, `/robots.txt` | So Google indexes the money pages and skips admin/API. |

**Do these once the domain is live (day 1, ~2 hours, all free):**
1. **Google Search Console** — verify deckroom.nyc, submit `/sitemap.xml`. This is how you see which queries you rank for.
2. **Google Business Profile** — one per location ("Deckroom Greenpoint", "Deckroom LES"), category *Recording studio / Rehearsal space*, photos of the room + OPUS-QUAD, hours, booking link. **This is the single highest-leverage free thing you can do** — "DJ practice space near me" searches show the map pack first.
3. Ask every early customer for a Google review. 10 reviews with the word "DJ" in them beats $500 of ads for map-pack ranking.

---

## 2. SEO content roadmap (one page every 1–2 weeks)

Priority order, by search intent:

| Target query | Page to build | Intent |
|---|---|---|
| ~~learn to dj nyc~~ | ✅ built | Learner, early |
| ~~dj practice space brooklyn~~ | ✅ built | Ready to book |
| dj practice space manhattan / les | `/dj-practice-space-manhattan` (mirror of Brooklyn page) | Ready to book |
| opus-quad rental nyc | short page: "Practice on an OPUS-QUAD in NYC" | Gear-specific, high intent |
| how to practice djing in an apartment | guide: apartment problem → treated room answer | Learner, pain-point |
| open decks nyc / where to play first dj set | guide: list real open-decks nights, position Deckroom as the prep step | Learner, community — earns backlinks |
| dj lessons brooklyn | guide comparing lessons vs. self-taught + practice hours; later, partner page with an instructor | Learner, commercial |

Rules that keep Google happy: every page answers the query honestly before
pitching, no thin duplicate pages, one page per intent, internal links
between guides and booking pages (already in the footers).

---

## 3. Google Ads (search) — the high-intent channel

Note: **Google "Local Services Ads" doesn't cover this business category**
(it's for plumbers, lawyers, etc.). The equivalent for Deckroom is a
standard **Search campaign with tight geo-targeting** — same effect: show
up the moment someone searches.

### Campaign setup (do this in ads.google.com, ~1 hour)
- **Campaign type:** Search · **Geo:** NYC metro, radius around each room
- **Budget:** start $15/day (~$450/mo) · **Bidding:** Maximize clicks for 2 weeks → switch to Maximize conversions once you have ~10 bookings tracked
- **Conversion tracking:** count a pageview of `/confirmed` as the conversion (it only renders on a paid booking — no extra code needed, add the URL rule in Google Ads)

### Ad group 1 — "practice space" (highest intent, most budget)
Keywords (phrase match): `dj practice space nyc`, `dj practice room brooklyn`,
`dj rehearsal space nyc`, `dj studio rental brooklyn`, `rent cdj time nyc`,
`opus quad rental nyc`
→ Landing page: `/dj-practice-space-brooklyn`

**Ad copy:**
- H: *DJ Practice Room — Brooklyn* / *OPUS-QUAD + Monitors Included* / *$45/hr, No Membership*
- D: *Private, sound-treated room in Greenpoint. Book online in under a minute, keypad entry, play loud. 20% off your first session with code REFER20.*

### Ad group 2 — "learn to dj" (bigger volume, lower intent, smaller budget)
Keywords: `learn to dj nyc`, `dj lessons brooklyn`, `how to learn dj`,
`dj classes nyc alternative`
→ Landing page: `/learn-to-dj-nyc`

**Ad copy:**
- H: *Learning to DJ in NYC?* / *Practice on Club Gear, $45/hr* / *Skip the Toy Controller*
- D: *An hour a week on a real OPUS-QUAD beats a year on a starter controller. Private treated room in Greenpoint. Book by the hour.*

### Negative keywords (add day 1, saves real money)
`free`, `jobs`, `hire a dj`, `dj for party`, `dj for wedding`, `equipment
for sale`, `virtual dj download`, `dj software`, `dj name generator`

---

## 4. Instagram / Meta ads — the demand-creation channel

Start **after** the account has 2–3 weeks of organic posts (ads from an
empty account convert badly).

- **Budget:** $10/day to start ($300/mo) · **Objective:** Sales (website conversions), fallback Traffic
- **Audience:** NYC + 10mi, ages 20–45, interests: DJing, Pioneer DJ, rekordbox, Serato, Boiler Room, house/techno
- **Placement:** Reels + Stories only (skip feed/audience network)
- **Creative (use the assets in this repo + phone video):**
  1. **Room reveal** — keypad → door opens → lights → OPUS-QUAD on. Text: "Private DJ room. $45/hr. Greenpoint." *(strongest hook, film this first)*
  2. Hero product shot (`public/opus-quad.png`) + "Practice on the real thing — book by the hour"
  3. POV: hands on jogs at volume. Text: "Your apartment can't do this."
- **Retargeting** (once pixel has data): anyone who visited `/book/*` but no `/confirmed` in 7 days → "Your slot's still open. REFER20 gets you 20% off."

Full ad-copy variants live in `marketing/paid-ads.md`.

---

## 5. The referral engine (built)

- **REFER20** = 20% off, promoted on the site's refer section and applied at checkout.
- Every confirmed booking's promo code shows in `/admin` — that's your tracker: **if >25% of new bookings carry REFER20 after month 1, the flywheel works; feed it** (mention the code in the confirmation email, drop a card in the room).
- v2 option when volume justifies it: per-person codes (MAYA20) so you can reward the referrer with a free hour. The promo system in `lib/promo.ts` is one line per new code.

---

## 6. 30-day launch calendar

| Week | Do |
|---|---|
| 1 | Domain live → Search Console + sitemap submitted → both Google Business Profiles created with photos → Google Ads "practice space" ad group ON ($15/day) |
| 2 | 3 IG reels posted (room reveal, gear close-up, booking-flow screen recording) · DM 20 NYC DJs offering a free first hour · email 25 promoters/booking agents (template in `email-templates.md`) |
| 3 | Meta ads ON ($10/day, room-reveal reel) · publish `/dj-practice-space-manhattan` · ask first customers for Google reviews |
| 4 | Read the numbers (below) · kill losing keywords · double the winning channel · publish next SEO page |

### The only numbers that matter
- **Cost per booking** by channel (Google Ads spend ÷ conversions; target < $20)
- **% of bookings with REFER20** (referral engine health)
- **Repeat rate** (same email booking twice in 30 days — this is the business)
- Search Console: impressions for "dj practice space" terms (SEO compounding)

### Expected math at steady state (conservative)
$450 Google + $300 Meta = **$750/mo spend** → ~25–40 first bookings
→ at $90 avg booking that's break-even-ish on first visits — **the profit
is the repeat rate and referrals**, which cost $0. If repeat + referral
bookings don't exceed paid bookings by month 3, revisit pricing or rooms
before spending more on ads.
