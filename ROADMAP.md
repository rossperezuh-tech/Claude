# Venture HQ — Product & Business Roadmap

Game plan for turning Venture HQ into a subscription SaaS. This is a living
planning doc — nothing here is built yet unless noted. Prices are placeholders.

---

## The vision

A subscription SaaS where clients pay monthly for a **tailored, branded command
center** with just the tools they need. Each client gets their own isolated
account, their own dashboard layout, their own branding, and only the tools
their plan unlocks.

### What already exists (the hard parts, done)
- **Isolated account per client** (Clerk auth + per-org data scoping)
- **Per-client tool access** (Admin panel → `enabledTools`)
- **Usage metering** (per-client AI cost visibility via the Usage & Billing tool)
- **Per-venture logos** (logo uploader — feeds future client branding)

---

## Pricing tiers (draft)

Additive — each tier includes everything in the tier below. Final prices should
sit **above** each client's monthly API cost (see the Usage & Billing tool).

### 🟢 Starter — ~$99/mo
*The AI HQ core — for a solo operator.*
- The Brain, Brain Dump, Weekly Digest
- Money Log, Meeting Notes

### 🔵 Growth — ~$249/mo *(most popular)*
*Everything to market & sell — for an active business.*
- **Everything in Starter, plus:**
- Content Studio, Content Calendar, Launch Planner
- Client & Order Tracker, Proposals & Invoices, Client Report
- SOP Writer

### 🟣 Full Suite — ~$499/mo
*The whole platform + the client's own branding.*
- **Everything in Growth, plus:**
- Deal Tracker, Document Reader, Contract Manager
- **Custom branding** (their logo/name/color)

**Notes**
- Usage & Billing stays **admin-only** (it's the owner's cost-tracking tool).
- Social-media clients = **Growth** buyers. Real-estate clients = **Full Suite**
  (Deal Tracker lives there).

---

## Build roadmap

### Phase 1 — Billing core *(do first; everything depends on it)*
- Hook up payments (Stripe, or Clerk Billing if it supports the current Clerk version)
- Define the 3 tiers, checkout, and the paywall (no active subscription = no access)
- Each tier auto-sets the client's `enabledTools` bundle
- **You provide:** a Stripe account + final tier names/prices/tool bundles

### Phase 2 — Trial + promo codes *(quick wins right after billing)*
- **Free trial OR 30-day money-back guarantee** (both easy; a free trial is the
  cleaner default — no refund friction)
- **Promo codes** — native Stripe feature (coupons + promotion codes). Create
  codes like `LAUNCH` = 100% off first month in the Stripe dashboard; enable the
  "Have a promo code?" box at checkout.

### Phase 3 — Customizable dashboards *(the big feature)*
- Per-client **dashboard config**: which panels show, in what order
- Per-client **branding**: logo, name, accent color (gate to higher tiers as an upsell)
- Ships with **templates** (below) so onboarding a client = pick a template + tweak

---

## Dashboard templates (for Phase 3)

Templates = a preset of **panels + order + tools + branding**. Picking one is the
fast path to onboarding a client.

**Panel library (building blocks):** Branded header · Quick Capture · Today ·
Ventures grid · 14-day Calendar · Content Calendar strip · Pipeline snapshot ·
Deal Tracker snapshot · Money rollup · Weekly Digest · Tool launcher

### 🎬 Content Studio — social media / content client *(Growth)*
- **Branding:** warm pink/purple, their logo
- **Layout:** Header → Quick Capture → **Content Calendar (hero)** → Today → Tools
- **Tools:** Content Studio, Content Calendar, Launch Planner, Brain Dump, The Brain
- **Hidden:** Deal Tracker, ventures grid, contracts

### 🏢 Deal Desk — real estate investor / wholesaler *(Full Suite)*
- **Branding:** navy + gold, their logo
- **Layout:** Header → **Deal Tracker snapshot (hero, urgency chips)** → Today →
  Seller-lead pipeline → Calendar (closings)
- **Tools:** Deal Tracker, Document Reader, Contract Manager, The Brain
- **Hidden:** all content/marketing tools

### 🤝 Client HQ — service agency / consultant / coach *(Growth)*
- **Branding:** clean, their accent color
- **Layout:** Header → Today + Quick Capture → **Pipeline (hero)** → Money rollup → Calendar
- **Tools:** Client & Order Tracker, Proposals & Invoices, Client Report, SOP Writer, The Brain

### 🛍️ Brand Ops — product / e-commerce brand *(Growth)*
- **Branding:** the product's brand colors + logo
- **Layout:** Header → **Content Calendar** → **Money rollup** → Orders pipeline → Today + Calendar
- **Tools:** Content Studio, Content Calendar, Money Log, Client & Order Tracker, The Brain

### 🎛️ Command Center — multi-venture operator *(Full Suite)*
- **Branding:** Venture HQ / owner brand
- **Layout:** everything — **Ventures grid (hero)**, Today, full Calendar, all snapshots
- **Tools:** all 16

**Why this design is strong**
- Templates tie to tiers (e.g. Deal Desk needs Full Suite) → upgrade incentive
- Reuses existing home-page panels + the logo uploader
- One decision to onboard a client instead of building from scratch

---

## Business / legal setup

> ⚠️ **Not legal or tax advice.** For real money + client data, a short paid
> consult with a CPA and/or attorney is worth it. Below is the practical picture.

### EIN vs LLC — don't confuse them
- **EIN** = a free tax ID from the IRS (~10 min online). It is **just an ID
  number**. It does **not** create an LLC or provide liability protection.
- **LLC** = a **state** filing (not the IRS) that costs money and provides the
  liability shield. Fee varies by state; **NY additionally has a newspaper
  publication requirement** that adds a few hundred dollars.

### Free-first, LLC-later launch path
**Phase 0 (≈ $0 upfront):**
1. Get an **EIN** as a sole proprietor — free
2. Open **Stripe** — free to create; they take ~2.9% + 30¢ only when you get paid
3. Start charging clients

**Then, once revenue justifies it:**
4. **Form the LLC** (state filing) for liability protection
5. Open a **business bank account** (keep business money separate)
6. Move Stripe onto the LLC + EIN

**Trade-off:** the free sole-prop route means **no liability shield** — personal
assets aren't separated from the business. Acceptable to many when starting with
a few clients; upgrade to the LLC as it grows.

### Don't-forget list (before/soon after taking real money)
- **Terms of Service + Privacy Policy** — important here; you store client
  business data and run it through AI. Use a reputable template service or a lawyer.
- **Sales tax** — SaaS is taxable in some states with "economic nexus"
  thresholds. **Stripe Tax** can automate this.
- *(Optional)* **Professional liability / E&O insurance** — modest cost, sensible as you grow.

### Shortcut to check
If **Steadyhand AI Consulting is already an LLC**, this SaaS may be able to run
under it (it's arguably a Steadyhand product) instead of forming a new entity.

**Open questions to resolve:**
- Is there already an LLC (e.g. Steadyhand) to run this under, or a fresh formation?
- Primary operating state (NY / TX / other)?

---

## What's needed to move from planning → building
1. **Final tiers** — names, monthly prices, and which tools in each (only you can decide)
2. **A Stripe account** (when Phase 1 starts)
3. **Confirm** whether to use Clerk Billing (pending version check) or Stripe directly

The natural first build step is **Phase 1 (Billing core)**.
