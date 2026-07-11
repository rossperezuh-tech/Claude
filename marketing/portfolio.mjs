// Venture HQ — single-page portfolio overview (all businesses on one sheet).
// Styled after the Venture HQ dashboard: dark cockpit theme, accent-colored
// cards, status chips, one-line descriptions.
// Usage: node marketing/portfolio.mjs  → writes marketing/html/portfolio.html

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));

const CONTACT = {
  name: "Ross Perez",
  email: "rossperezinvestments@gmail.com",
  base: "Brooklyn, NY · Houston, TX",
};

// Dashboard theme (tailwind.config.ts)
const T = {
  bg: "#0b0e14",
  raised: "#121722",
  overlay: "#1a2130",
  edge: "#232c3f",
  ink: "#e6eaf2",
  dim: "#9aa5b8",
  faint: "#5c6780",
};

const STATUS = {
  active: { label: "Active", fg: "#34d399", bg: "rgba(16,185,129,.15)", bd: "rgba(16,185,129,.3)" },
  launching: { label: "Launching", fg: "#38bdf8", bg: "rgba(14,165,233,.15)", bd: "rgba(14,165,233,.3)" },
  "back-burner": { label: "Back-burner", fg: "#a1a1aa", bg: "rgba(113,113,122,.15)", bd: "rgba(113,113,122,.3)" },
};

const businesses = [
  { name: "Brooklyn Tea Cigs", color: "#34d399", status: "active", icon: "leaf",
    desc: "Herbal tea cigarettes — 100% tobacco- and nicotine-free consumer product.",
    fact: "Small-batch · Brooklyn · with Anna & Paulina", url: "https://brooklynteacigs.com" },
  { name: "Penthouse Yoga", color: "#f472b6", status: "active", icon: "sun",
    desc: "Rooftop yoga studio with open-air skyline classes.",
    fact: "231 Norman Ave, Greenpoint · opened July 2026", url: "https://penthouseyoga.example.com" },
  { name: "Clean Plate NYC", color: "#a3e635", status: "active", icon: "plate",
    desc: "Organic meal delivery in returnable glass containers — zero plastic.",
    fact: "NYC · weekly chef-prepared subscription", url: "https://cleanplatenyc.com" },
  { name: "Brooklyn Vintage Watches", color: "#fbbf24", status: "back-burner", icon: "watch",
    desc: "Curated two-tone Rolex with a lab-grown diamond configurator.",
    fact: "Datejust-first · configure online", url: "https://brooklynvintagewatches.com" },
  { name: "Green Shoots Studio", color: "#4ade80", status: "active", icon: "play",
    desc: "Content production for wellness brands — reels, brand films, social.",
    fact: "Retainer model · wellness-native", url: "https://greenshootsstudio.com" },
  { name: "Nativos", color: "#fb923c", status: "back-burner", icon: "shirt",
    desc: "Organic cotton clothing — fewer, better everyday basics.",
    fact: "Certified organic · transparent sourcing", url: "https://nativos.com" },
  { name: "Vesta / Nexus Capital", color: "#818cf8", status: "launching", icon: "tower",
    desc: "Commercial real estate tokenization platform for accredited investors.",
    fact: "SEC Reg D 506(c) · PPM finalized June 2026", url: "https://vestanexus.com" },
  { name: "CRE Direct Buying", color: "#38bdf8", status: "active", icon: "warehouse",
    desc: "Direct warehouse & commercial acquisitions — cash offers, as-is, fast close.",
    fact: "SellYourWarehouseDirect.com · CommercialCashOffer · Houston",
    url: "https://sellyourwarehousedirect.com" },
  { name: "Steadyhand AI Consulting", color: "#2dd4bf", status: "active", icon: "node",
    desc: "Practical AI adoption for established businesses — automation that pays for itself.",
    fact: "Discovery → pilot → rollout", url: "https://steadyhandai.com" },
  { name: "The Prompt Sherpa", color: "#c084fc", status: "launching", icon: "flag",
    desc: "Claude Code consulting for startup creators — from idea to shipped product.",
    fact: "1:1 sessions & small cohorts", url: "https://promptsherpa.example.com" },
  { name: "All In One Health Shop", color: "#f87171", status: "back-burner", icon: "cross",
    desc: "Curated online storefront for everyday health goods.",
    fact: "One shop, one standard, everything vetted", url: "https://allinonehealth.com" },
  { name: "Brooklyn Tiny Farm", color: "#84cc16", status: "active", icon: "sprout",
    desc: "Microgreens grown in the borough, delivered within days of harvest.",
    fact: "DTC + restaurant accounts · weekly harvest", url: "https://brooklyntinyfarm.com" },
];

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

function iconSvg(name, color, size = 22, sw = 2.8) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 48 48" fill="none" stroke="${color}" stroke-width="${sw}">${icons[name]}</svg>`;
}

function fontFace(weight, file) {
  const b64 = readFileSync(join(ROOT, "fonts", file)).toString("base64");
  return `@font-face{font-family:'Inter';font-weight:${weight};font-style:normal;src:url(data:font/woff2;base64,${b64}) format('woff2');}`;
}

const fontsCss = [400, 500, 600, 700, 800]
  .map((w) => fontFace(w, `inter-latin-${w}-normal.woff2`))
  .join("\n");

const counts = businesses.reduce((m, b) => ((m[b.status] = (m[b.status] || 0) + 1), m), {});

const cards = businesses
  .map((b) => {
    const s = STATUS[b.status];
    return `
    <a href="${b.url}" class="card" style="border-left:3px solid ${b.color}">
      <div class="card-top">
        <div class="card-icon" style="background:${b.color}1f;border:1px solid ${b.color}45">${iconSvg(b.icon, b.color)}</div>
        <div class="card-name">${b.name}</div>
        <span class="chip" style="color:${s.fg};background:${s.bg};border-color:${s.bd}">${s.label}</span>
      </div>
      <p class="card-desc">${b.desc}</p>
      <div class="card-fact" style="color:${b.color}">${b.fact}</div>
    </a>`;
  })
  .join("");

const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>RP Venture Portfolio</title>
<style>
${fontsCss}
*{margin:0;padding:0;box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
@page{size:letter;margin:0;}
html,body{width:8.5in;height:11in;}
body{font-family:'Inter',sans-serif;background:${T.bg};color:${T.ink};display:flex;flex-direction:column;overflow:hidden;}

.head{padding:34px 44px 22px;display:flex;align-items:flex-end;justify-content:space-between;gap:20px;}
.eyebrow{font-size:10.5px;font-weight:700;letter-spacing:2.2px;text-transform:uppercase;color:${T.faint};margin-bottom:8px;}
h1{font-size:30px;font-weight:800;letter-spacing:-.6px;line-height:1.1;}
h1 .accent{background:linear-gradient(90deg,#818cf8,#38bdf8);-webkit-background-clip:text;background-clip:text;color:transparent;}
.head-sub{font-size:12px;color:${T.dim};margin-top:8px;}
.head-contact{text-align:right;flex-shrink:0;}
.hc-name{font-size:14px;font-weight:700;}
.hc-line{font-size:11px;color:${T.dim};margin-top:3px;}

.stats{display:flex;gap:10px;padding:0 44px 20px;}
.stat{background:${T.raised};border:1px solid ${T.edge};border-radius:8px;padding:10px 16px;display:flex;align-items:baseline;gap:7px;}
.stat b{font-size:17px;font-weight:800;}
.stat span{font-size:10px;font-weight:600;letter-spacing:1.2px;text-transform:uppercase;color:${T.dim};}
.stat .dot{width:7px;height:7px;border-radius:99px;align-self:center;}

.grid{flex:1;min-height:0;display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(4,1fr);gap:12px;padding:0 44px;}
.card{background:${T.raised};border:1px solid ${T.edge};border-radius:9px;padding:14px 15px;display:flex;flex-direction:column;text-decoration:none;color:inherit;cursor:pointer;transition:background .2s;}
.card-top{display:flex;align-items:center;gap:9px;}
.card-icon{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.card-name{font-size:13px;font-weight:700;line-height:1.2;flex:1;}
.chip{font-size:9px;font-weight:600;line-height:1;border:1px solid;border-radius:4px;padding:3.5px 6px;flex-shrink:0;letter-spacing:.3px;}
.card-desc{font-size:11px;line-height:1.5;color:${T.dim};margin-top:9px;flex:1;}
.card-fact{font-size:10px;font-weight:600;margin-top:8px;}

.foot{padding:18px 44px 26px;display:flex;align-items:center;justify-content:space-between;}
.foot-l{font-size:10px;font-weight:600;letter-spacing:1.4px;text-transform:uppercase;color:${T.faint};}
.foot-r{font-size:10px;color:${T.faint};}
</style></head>
<body>
  <div class="head">
    <div>
      <div class="eyebrow">RP Venture Portfolio · July 2026</div>
      <h1>Twelve ventures. <span class="accent">One operator.</span></h1>
      <div class="head-sub">Consumer products, wellness, real estate, and AI — built and run from Brooklyn &amp; Houston.</div>
    </div>
    <div class="head-contact">
      <div class="hc-name">${CONTACT.name}</div>
      <div class="hc-line">${CONTACT.email}</div>
      <div class="hc-line">${CONTACT.base}</div>
    </div>
  </div>
  <div class="stats">
    <div class="stat"><b>${businesses.length}</b><span>Ventures</span></div>
    <div class="stat"><span class="dot" style="background:#34d399"></span><b>${counts.active}</b><span>Active</span></div>
    <div class="stat"><span class="dot" style="background:#38bdf8"></span><b>${counts.launching}</b><span>Launching</span></div>
    <div class="stat"><span class="dot" style="background:#a1a1aa"></span><b>${counts["back-burner"]}</b><span>Back-burner</span></div>
  </div>
  <div class="grid">${cards}</div>
  <div class="foot">
    <div class="foot-l">Venture HQ — Command Center</div>
    <div class="foot-r">Prepared July 2026 · ${CONTACT.email}</div>
  </div>
</body></html>`;

mkdirSync(join(ROOT, "html"), { recursive: true });
writeFileSync(join(ROOT, "html", "portfolio.html"), html);
console.log("wrote html/portfolio.html");
