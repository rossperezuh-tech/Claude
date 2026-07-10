// Venture HQ — one-page marketing sheet generator
// Usage: node marketing/generate.mjs   (writes HTML to marketing/html/)
// Then render each HTML to PDF with headless Chromium (see marketing/build-pdfs.sh).

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));

const CONTACT = {
  name: "Ross Perez",
  email: "rossperezinvestments@gmail.com",
  base: "Brooklyn, NY · Houston, TX",
};

// ---------------------------------------------------------------------------
// Per-business content
// ---------------------------------------------------------------------------

const businesses = [
  {
    slug: "brooklyn-tea-cigs",
    name: "Brooklyn Tea Cigs",
    color: "#0e9f6e",
    accent2: "#34d399",
    status: "Active",
    tagline: "The ritual, without the tobacco.",
    category: "Consumer Product · Herbal Goods",
    about:
      "Brooklyn Tea Cigs makes herbal tea cigarettes — a 100% tobacco-free, nicotine-free alternative built around blended teas and botanicals. It keeps the ritual and the hand-feel of a cigarette while replacing what's inside with ingredients you can actually read. Every batch is rolled in small runs in Brooklyn by a three-person founding team.",
    highlights: [
      ["Tobacco & nicotine free", "Blended tea and botanical fills — nothing addictive, nothing synthetic, supplier COAs on file for every ingredient."],
      ["Small-batch, made in Brooklyn", "Weekly production runs keep product fresh and quality tight, with packaging designed in-house."],
      ["Built for retail & DTC", "Trademark registered, Shopify storefront live, and packaging dielines print-ready for wholesale shelves."],
    ],
    facts: [
      ["Category", "Herbal consumer product"],
      ["Team", "Ross Perez with co-founders Anna (production) & Paulina (brand + retail)"],
      ["Production", "Small-batch, weekly runs — Brooklyn, NY"],
      ["Channels", "DTC via Shopify · boutique retail"],
    ],
    icon: "leaf",
  },
  {
    slug: "penthouse-yoga",
    name: "Penthouse Yoga",
    color: "#db2777",
    accent2: "#f472b6",
    status: "Active",
    tagline: "Practice above the city.",
    category: "Wellness · Studio",
    about:
      "Penthouse Yoga is a rooftop yoga studio at 231 Norman Ave in Greenpoint, Brooklyn — open-air classes with the Manhattan skyline as the backdrop. Launched in July 2026 with a sold-out open house, the studio runs a weekly schedule of vinyasa, restorative, and sunrise sessions led by a hand-picked instructor team.",
    highlights: [
      ["A one-of-a-kind space", "Open-air rooftop practice in Greenpoint with unobstructed skyline views — an experience no ground-floor studio can offer."],
      ["Curated instructor roster", "A lead instructor owns the weekend schedule; every teacher is vetted for both skill and presence."],
      ["Simple online booking", "Class booking, waivers, and schedules handled online — show up with a mat, everything else is ready."],
    ],
    facts: [
      ["Location", "231 Norman Ave, Greenpoint, Brooklyn"],
      ["Opened", "July 2026"],
      ["Format", "Rooftop open-air classes, all levels"],
      ["Insurance & waivers", "Fully insured; digital + front-desk waivers"],
    ],
    icon: "sun",
  },
  {
    slug: "clean-plate-nyc",
    name: "Clean Plate NYC",
    color: "#65a30d",
    accent2: "#a3e635",
    status: "Active",
    tagline: "Organic meals. Glass containers. Zero plastic.",
    category: "Food · Meal Delivery",
    about:
      "Clean Plate NYC delivers organic, chef-prepared meals across New York City in returnable glass containers — no single-use plastic anywhere in the loop. Meals are prepped fresh every Sunday and routed for delivery the same day; empty containers are collected on the next drop-off, washed, and reused.",
    highlights: [
      ["Certified-organic sourcing", "Menus are built around organic produce and clean proteins, prepared in a DOH-permitted kitchen."],
      ["Closed-loop glass packaging", "Every meal ships in glass, gets picked up, sanitized, and reused — the packaging never becomes trash."],
      ["Weekly rhythm", "One weekly prep-and-delivery cycle keeps food fresh, routes efficient, and the subscription dead simple."],
    ],
    facts: [
      ["Service area", "New York City"],
      ["Model", "Weekly subscription, chef-prepared"],
      ["Packaging", "Returnable glass — zero single-use plastic"],
      ["Compliance", "NYC DOH food handling permit"],
    ],
    icon: "plate",
  },
  {
    slug: "brooklyn-vintage-watches",
    name: "Brooklyn Vintage Watches",
    color: "#b45309",
    accent2: "#fbbf24",
    status: "In Development",
    tagline: "Two-tone Rolex, set your way.",
    category: "Luxury Goods · E-commerce",
    about:
      "Brooklyn Vintage Watches pairs curated two-tone vintage Rolex — Datejust-first — with lab-grown diamond customization through an online configurator. Pick the reference, pick the dial, choose your stone setting, and see the finished piece before committing. Vintage character, modern stones, transparent pricing.",
    highlights: [
      ["Curated vintage inventory", "Hand-selected two-tone Rolex references, photographed in-house and verified before listing."],
      ["Lab diamond configurator", "Customize bezels and dials with lab-grown diamonds — the look of high jewelry at a fraction of mined-stone cost."],
      ["See it before you buy it", "The online configurator renders your exact build, so there are no surprises at the unboxing."],
    ],
    facts: [
      ["Focus", "Two-tone Rolex · Datejust"],
      ["Stones", "Lab-grown diamonds, customer-configured"],
      ["Channel", "Online configurator + direct sales"],
      ["Based in", "Brooklyn, NY"],
    ],
    icon: "watch",
  },
  {
    slug: "green-shoots-studio",
    name: "Green Shoots Studio",
    color: "#16a34a",
    accent2: "#4ade80",
    status: "Active",
    tagline: "Content that grows wellness brands.",
    category: "Media · Content Production",
    about:
      "Green Shoots Studio is a content production shop built for wellness brands — studios, supplements, food, and mindful consumer products. We handle the full pipeline from concept to cut: short-form reels, brand films, and always-on social content, delivered on retainer so brands never run dry.",
    highlights: [
      ["Wellness-native storytelling", "We work exclusively in wellness, so the tone, pacing, and aesthetics are right on the first cut."],
      ["Short-form first", "Reels and vertical video built for how wellness audiences actually discover brands today."],
      ["Retainer model", "Quarterly retainers with a steady delivery calendar — predictable output, predictable cost."],
    ],
    facts: [
      ["Clients", "Wellness & lifestyle brands"],
      ["Deliverables", "Reels, brand films, social content"],
      ["Engagement", "Quarterly retainers or per-project"],
      ["Based in", "Brooklyn, NY"],
    ],
    icon: "play",
  },
  {
    slug: "nativos",
    name: "Nativos",
    color: "#c2410c",
    accent2: "#fb923c",
    status: "In Development",
    tagline: "Organic cotton, honestly made.",
    category: "Apparel · Sustainable Clothing",
    about:
      "Nativos is an organic cotton clothing line built on a simple premise: fewer, better basics. Certified organic cotton, transparent sourcing, and cuts designed to last years instead of seasons. The line is currently in fabric development, with supplier sampling underway.",
    highlights: [
      ["100% organic cotton", "Every fabric is sampled and vetted for certification, hand-feel, and durability before it enters the line."],
      ["Essentials, not trends", "A tight collection of everyday staples — designed once, worn constantly."],
      ["Transparent supply chain", "Sourcing documented from farm to finished garment, so the label means something."],
    ],
    facts: [
      ["Material", "Certified organic cotton"],
      ["Stage", "Fabric sampling & supplier selection"],
      ["Positioning", "Sustainable everyday essentials"],
      ["Based in", "Brooklyn, NY"],
    ],
    icon: "shirt",
  },
  {
    slug: "vesta-nexus-capital",
    name: "Vesta / Nexus Capital",
    color: "#4f46e5",
    accent2: "#818cf8",
    status: "Launching",
    tagline: "Commercial real estate, tokenized.",
    category: "FinTech · Real Estate Investment",
    about:
      "Vesta (Nexus Capital) is a commercial real estate tokenization platform that opens institutional-grade CRE deals to accredited investors through fractional, blockchain-recorded ownership. Offerings are structured under SEC Regulation D Rule 506(c), with a finalized private placement memorandum and Form D filing prepared by securities counsel.",
    highlights: [
      ["Fractional CRE access", "Accredited investors participate in commercial deals at check sizes traditional syndications can't offer."],
      ["Compliance-first structure", "Reg D 506(c) offerings with counsel-reviewed PPM, Form D filings, and accredited-investor verification built in."],
      ["Transparent token ownership", "Each investor position is recorded on-chain — clean cap tables, clear records, simpler transfers."],
    ],
    facts: [
      ["Structure", "SEC Reg D 506(c) private offerings"],
      ["Investors", "Accredited investors only"],
      ["Documentation", "PPM finalized & counsel-signed, June 2026"],
      ["Asset class", "Commercial real estate"],
    ],
    icon: "tower",
    footnote:
      "This material is for informational purposes only and is not an offer to sell or a solicitation of an offer to buy any security. Any offering is made only to accredited investors pursuant to official offering documents.",
  },
  {
    slug: "cre-direct-buying",
    name: "CRE Direct Buying",
    color: "#0284c7",
    accent2: "#38bdf8",
    status: "Active",
    tagline: "Sell your commercial property directly. Cash. As-is. Fast.",
    category: "Real Estate · Acquisitions",
    about:
      "CRE Direct Buying acquires warehouses and commercial properties directly from owners through two lead-generation brands — SellYourWarehouseDirect.com and CommercialCashOffer. Owners skip brokers, commissions, repairs, and financing contingencies: we evaluate, make a cash offer, and close on the seller's timeline. Currently active in the Houston market, with 6416 Conley St under contract and in title.",
    highlights: [
      ["Direct cash offers", "No financing contingencies and no broker commissions — a straight cash number, typically within days of walkthrough."],
      ["As-is means as-is", "Vacant, dated, tenant headaches, deferred maintenance — we buy the property in its current condition."],
      ["Close on your timeline", "Title opened immediately after contract; sellers pick the closing date that works for them."],
    ],
    facts: [
      ["Brands", "SellYourWarehouseDirect.com · CommercialCashOffer"],
      ["Focus", "Warehouses & commercial property"],
      ["Active market", "Houston, TX (expanding)"],
      ["Current pipeline", "6416 Conley St, Houston — under contract, in title"],
    ],
    icon: "warehouse",
  },
  {
    slug: "steadyhand-ai",
    name: "Steadyhand AI Consulting",
    color: "#0d9488",
    accent2: "#2dd4bf",
    status: "Active",
    tagline: "Practical AI for businesses that already work.",
    category: "Consulting · Artificial Intelligence",
    about:
      "Steadyhand AI Consulting helps established businesses adopt AI without the hype cycle. We start with discovery — how the business actually runs — then design and implement automations, AI-assisted workflows, and internal tools that pay for themselves in saved hours. Built for operators in logistics, services, and other real-economy industries, not startups chasing demos.",
    highlights: [
      ["Discovery before tools", "Every engagement starts with a working session on your operations — the tech is chosen to fit the business, never the reverse."],
      ["Implementation, not slideware", "We build and ship the workflows: document automation, customer response, reporting, and internal copilots."],
      ["Measured in hours saved", "Success is defined up front in operational terms — time recovered, errors reduced, throughput gained."],
    ],
    facts: [
      ["Clients", "Established SMBs & mid-market operators"],
      ["Services", "AI strategy, workflow automation, internal tools"],
      ["Engagement", "Discovery → pilot → rollout"],
      ["Current work", "Logistics-sector engagements"],
    ],
    icon: "node",
  },
  {
    slug: "prompt-sherpa",
    name: "The Prompt Sherpa",
    color: "#9333ea",
    accent2: "#c084fc",
    status: "Launching",
    tagline: "Your guide up the Claude Code mountain.",
    category: "Consulting · Developer Tools",
    about:
      "The Prompt Sherpa teaches startup creators to build real products with Claude Code — Anthropic's agentic coding tool. Founders who can describe what they want but can't (yet) engineer it get a guided path: environment setup, prompting patterns that actually ship features, and hands-on sessions taking an idea from empty repo to deployed app.",
    highlights: [
      ["From idea to shipped", "Hands-on sessions that end with working software, not just notes — you ship during the engagement."],
      ["Prompting as a craft", "Learn the patterns that make agentic coding reliable: specs, guardrails, iteration loops, and review habits."],
      ["Built for non-engineers", "Designed for founders and creators — no CS degree assumed, no condescension included."],
    ],
    facts: [
      ["Audience", "Startup founders & creators"],
      ["Format", "1:1 guided sessions & small cohorts"],
      ["Focus", "Claude Code · agentic development"],
      ["Status", "Launching — landing page live soon"],
    ],
    icon: "flag",
  },
  {
    slug: "all-in-one-health",
    name: "All In One Health Shop",
    color: "#dc2626",
    accent2: "#f87171",
    status: "In Development",
    tagline: "Everything for your health, one storefront.",
    category: "E-commerce · Health Goods",
    about:
      "All In One Health Shop is a curated online storefront for everyday health goods — supplements, home wellness gear, and clean personal care — organized so people can find trustworthy products without wading through marketplace noise. One shop, one standard, everything vetted before it's listed.",
    highlights: [
      ["Curation over catalog", "Every listing is reviewed before it goes live — quality and sourcing checked, dead weight cut."],
      ["One-stop convenience", "Supplements, wellness tools, and personal care in a single cart instead of five different sites."],
      ["Honest product pages", "Plain-language descriptions of what each product does and doesn't do."],
    ],
    facts: [
      ["Category", "Health & wellness e-commerce"],
      ["Model", "Curated online storefront"],
      ["Stage", "Catalog audit & relaunch prep"],
      ["Based in", "Brooklyn, NY"],
    ],
    icon: "cross",
  },
  {
    slug: "brooklyn-tiny-farm",
    name: "Brooklyn Tiny Farm",
    color: "#57534e",
    accent2: "#84cc16",
    status: "Active",
    tagline: "Microgreens grown in the borough, delivered in days.",
    category: "Urban Agriculture · Food",
    about:
      "Brooklyn Tiny Farm grows microgreens — sunflower, pea shoots, radish, broccoli, and specialty mixes — inside the borough and delivers them direct to consumers and restaurant kitchens within days of harvest. Trays are seeded weekly on a rolling schedule, so every delivery is cut fresh, never warehoused.",
    highlights: [
      ["Hyper-local & hyper-fresh", "Grown in Brooklyn and delivered across the borough within days of cutting — flavor supermarket greens can't match."],
      ["Restaurant-grade quality", "Standing weekly accounts with local kitchens, with a published price sheet and consistent supply."],
      ["Rolling weekly harvest", "New trays seeded every week means year-round availability, independent of season or weather."],
    ],
    facts: [
      ["Products", "Microgreens — shoots, brassicas, specialty mixes"],
      ["Customers", "DTC subscriptions + restaurant accounts"],
      ["Cycle", "Weekly seeding & delivery schedule"],
      ["Grown in", "Brooklyn, NY"],
    ],
    icon: "sprout",
  },
];

// ---------------------------------------------------------------------------
// Icon library (inline SVG paths, drawn on a 48x48 grid, stroke-based)
// ---------------------------------------------------------------------------

const icons = {
  leaf: `<path d="M38 10C24 10 12 18 12 34c0 2 .3 3.5.8 5C14 26 22 18 34 14c-9 6-16 14-18.5 25C17 40 19.5 40.5 22 40.5 36 40.5 38 24 38 10z"/>`,
  sun: `<circle cx="24" cy="26" r="8"/><path d="M24 10v4M35.3 14.7l-2.8 2.8M40 26h-4M12 26H8M15.5 17.5l-2.8-2.8M6 38h36M12 44h24" stroke-linecap="round"/>`,
  plate: `<circle cx="24" cy="24" r="16"/><circle cx="24" cy="24" r="9"/><path d="M24 20c2.5 1 4 3.5 3 6-2.5-1-4-3.5-3-6z"/>`,
  watch: `<circle cx="24" cy="24" r="12"/><path d="M24 17v7l5 3" stroke-linecap="round"/><path d="M18 12l1.5-7h9L30 12M18 36l1.5 7h9L30 36" stroke-linejoin="round"/>`,
  play: `<rect x="8" y="10" width="32" height="24" rx="4"/><path d="M21 17v10l8-5-8-5z" stroke-linejoin="round"/><path d="M16 40h16" stroke-linecap="round"/>`,
  shirt: `<path d="M17 8l-9 6 4 7 4-2v21h16V19l4 2 4-7-9-6c0 3-3 5-7 5s-7-2-7-5z" stroke-linejoin="round"/>`,
  tower: `<path d="M14 42V12l10-6 10 6v30" stroke-linejoin="round"/><path d="M8 42h32M20 16h8M20 22h8M20 28h8M20 34h8"/>`,
  warehouse: `<path d="M6 42V18L24 8l18 10v24" stroke-linejoin="round"/><path d="M4 42h40M14 42V26h20v16M14 32h20M14 37h20"/>`,
  node: `<circle cx="24" cy="24" r="7"/><circle cx="8" cy="10" r="3"/><circle cx="40" cy="10" r="3"/><circle cx="8" cy="38" r="3"/><circle cx="40" cy="38" r="3"/><path d="M19 19l-8.5-6.5M29 19l8.5-6.5M19 29l-8.5 6.5M29 29l8.5 6.5"/>`,
  flag: `<path d="M10 44L24 8l5 12 9-4-4 12 8 4-28 12z" stroke-linejoin="round"/>`,
  cross: `<circle cx="24" cy="24" r="17"/><path d="M24 15v18M15 24h18" stroke-linecap="round"/>`,
  sprout: `<path d="M24 42V24M24 24c0-8 5-13 14-13 0 9-5 13-14 13zM24 30c0-6-4-10-11-10 0 7 4 10 11 10z" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 42h28" stroke-linecap="round"/>`,
};

function iconSvg(name, color, size = 26, sw = 2.6) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 48 48" fill="none" stroke="${color}" stroke-width="${sw}">${icons[name]}</svg>`;
}

// ---------------------------------------------------------------------------
// Fonts (embedded so PDFs render identically anywhere)
// ---------------------------------------------------------------------------

function fontFace(weight, file) {
  const b64 = readFileSync(join(ROOT, "fonts", file)).toString("base64");
  return `@font-face{font-family:'Inter';font-weight:${weight};font-style:normal;src:url(data:font/woff2;base64,${b64}) format('woff2');}`;
}

const fontsCss = [
  fontFace(400, "inter-latin-400-normal.woff2"),
  fontFace(500, "inter-latin-500-normal.woff2"),
  fontFace(600, "inter-latin-600-normal.woff2"),
  fontFace(700, "inter-latin-700-normal.woff2"),
  fontFace(800, "inter-latin-800-normal.woff2"),
].join("\n");

// ---------------------------------------------------------------------------
// Template
// ---------------------------------------------------------------------------

function heroArt(b) {
  // Abstract geometric band: soft tinted shapes + large icon watermark.
  return `
  <svg class="hero-art" viewBox="0 0 816 150" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${b.color}"/><stop offset="1" stop-color="${b.accent2}"/>
      </linearGradient>
      <linearGradient id="g2" x1="0" y1="1" x2="1" y2="0">
        <stop offset="0" stop-color="${b.accent2}" stop-opacity=".35"/><stop offset="1" stop-color="${b.color}" stop-opacity=".08"/>
      </linearGradient>
    </defs>
    <rect width="816" height="150" fill="url(#g1)"/>
    <circle cx="700" cy="20" r="130" fill="#ffffff" opacity="0.10"/>
    <circle cx="640" cy="150" r="80" fill="#ffffff" opacity="0.08"/>
    <circle cx="90" cy="160" r="110" fill="#000000" opacity="0.10"/>
    <path d="M0 150 L816 30 L816 150 Z" fill="#000000" opacity="0.12"/>
    <path d="M0 150 L816 92 L816 150 Z" fill="#ffffff" opacity="0.07"/>
    <g transform="translate(688,26) scale(2.1)" opacity="0.5">
      <g fill="none" stroke="#ffffff" stroke-width="2.2">${icons[b.icon]}</g>
    </g>
  </svg>`;
}

function page(b) {
  const highlights = b.highlights
    .map(
      ([t, d]) => `
      <div class="hl">
        <div class="hl-icon">${iconSvg(b.icon, b.color, 18, 3)}</div>
        <div>
          <div class="hl-title">${t}</div>
          <div class="hl-body">${d}</div>
        </div>
      </div>`
    )
    .join("");

  const facts = b.facts
    .map(
      ([k, v]) => `
      <div class="fact">
        <div class="fact-k">${k}</div>
        <div class="fact-v">${v}</div>
      </div>`
    )
    .join("");

  return `<!doctype html>
<html><head><meta charset="utf-8"><title>${b.name} — One-Pager</title>
<style>
${fontsCss}
*{margin:0;padding:0;box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
@page{size:letter;margin:0;}
html,body{width:8.5in;height:11in;}
body{font-family:'Inter',sans-serif;color:#1c1c1e;background:#ffffff;display:flex;flex-direction:column;overflow:hidden;}

.topbar{height:8px;background:linear-gradient(90deg,${b.color},${b.accent2});}

.head{display:flex;align-items:center;gap:16px;padding:26px 48px 20px;}
.badge{width:58px;height:58px;border-radius:14px;background:${b.color};display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.head-name{font-size:27px;font-weight:800;letter-spacing:-.5px;}
.head-sub{font-size:11.5px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:1.4px;margin-top:3px;}
.status{margin-left:auto;font-size:10.5px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${b.color};border:1.5px solid ${b.color};border-radius:99px;padding:5px 14px;}

.hero{position:relative;height:175px;overflow:hidden;}
.hero-art{position:absolute;inset:0;width:100%;height:100%;}
.hero-tag{position:absolute;left:48px;bottom:26px;right:260px;color:#fff;font-size:26px;font-weight:800;letter-spacing:-.4px;line-height:1.15;text-shadow:0 1px 8px rgba(0,0,0,.25);}

.body{flex:1;min-height:0;display:flex;gap:36px;padding:36px 48px 0;}
.main{flex:1.62;}
.side{flex:1;}

h2{font-size:11px;font-weight:800;letter-spacing:1.8px;text-transform:uppercase;color:${b.color};margin-bottom:10px;}
.rule{height:2px;width:34px;background:${b.color};margin-bottom:12px;border-radius:2px;}
.about{font-size:13.5px;line-height:1.68;color:#374151;margin-bottom:32px;}

.hl{display:flex;gap:13px;margin-bottom:22px;}
.hl-icon{width:34px;height:34px;border-radius:9px;background:${b.color}14;border:1px solid ${b.color}33;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;}
.hl-title{font-size:13.5px;font-weight:700;margin-bottom:4px;}
.hl-body{font-size:12px;line-height:1.55;color:#4b5563;}

.panel{background:#f8f9fa;border:1px solid #e5e7eb;border-radius:14px;padding:22px 24px;margin-bottom:20px;}
.fact{padding:11px 0;border-bottom:1px solid #e5e7eb;}
.fact:last-child{border-bottom:none;}
.fact-k{font-size:9.5px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#9ca3af;margin-bottom:2px;}
.fact-v{font-size:12px;font-weight:500;color:#1f2937;line-height:1.4;}

.contact{background:${b.color};border-radius:14px;padding:22px 24px;color:#fff;}
.contact h3{font-size:10px;font-weight:800;letter-spacing:1.8px;text-transform:uppercase;opacity:.85;margin-bottom:10px;}
.contact .c-name{font-size:15px;font-weight:700;}
.contact .c-line{font-size:11.5px;font-weight:500;opacity:.92;margin-top:4px;}

.foot{padding:12px 48px 16px;display:flex;align-items:center;justify-content:space-between;border-top:1px solid #e5e7eb;margin-top:10px;}
.foot-l{font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#9ca3af;}
.foot-r{font-size:10px;color:#9ca3af;}
.footnote{font-size:8.5px;color:#9ca3af;line-height:1.45;padding:10px 48px 0;}
</style></head>
<body>
  <div class="topbar"></div>
  <div class="head">
    <div class="badge">${iconSvg(b.icon, "#ffffff", 32, 2.8)}</div>
    <div>
      <div class="head-name">${b.name}</div>
      <div class="head-sub">${b.category}</div>
    </div>
    <div class="status">${b.status}</div>
  </div>
  <div class="hero">${heroArt(b)}<div class="hero-tag">${b.tagline}</div></div>
  <div class="body">
    <div class="main">
      <h2>The Business</h2><div class="rule"></div>
      <p class="about">${b.about}</p>
      <h2>Why It Wins</h2><div class="rule"></div>
      ${highlights}
    </div>
    <div class="side">
      <div class="panel">
        <h2>At a Glance</h2><div class="rule"></div>
        ${facts}
      </div>
      <div class="contact">
        <h3>Contact</h3>
        <div class="c-name">${CONTACT.name}</div>
        <div class="c-line">${CONTACT.email}</div>
        <div class="c-line">${CONTACT.base}</div>
      </div>
    </div>
  </div>
  ${b.footnote ? `<div class="footnote">${b.footnote}</div>` : ""}
  <div class="foot">
    <div class="foot-l">RP Venture Portfolio</div>
    <div class="foot-r">Prepared July 2026</div>
  </div>
</body></html>`;
}

// ---------------------------------------------------------------------------

mkdirSync(join(ROOT, "html"), { recursive: true });
for (const b of businesses) {
  writeFileSync(join(ROOT, "html", `${b.slug}.html`), page(b));
  console.log(`wrote html/${b.slug}.html`);
}
