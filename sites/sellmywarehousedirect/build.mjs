// Builds the whole site into ./dist.  Run: node build.mjs   (add --serve to preview at http://localhost:4173)
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as C } from './site.config.mjs';
import { metros } from './data/metros.mjs';
import { states } from './data/states.mjs';
import { types } from './data/types.mjs';
import { situations } from './data/situations.mjs';
import { submarkets } from './data/submarkets.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const DIST = join(ROOT, 'dist');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const YEAR = new Date().getFullYear();
const TODAY = new Date().toISOString().slice(0, 10);

// ── helpers ──────────────────────────────────────────────────────────────
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const list = (a) => (a.length < 2 ? a.join('') : a.length === 2 ? a.join(' and ') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`);
const url = (slug) => `${C.siteUrl}/${slug}`;
const fill = (html) => html.replaceAll('{{PHONE_TEL}}', C.phoneTel).replaceAll('{{PHONE}}', C.phone);
const partial = (name) => fill(read(`src/partials/${name}.html`));

const stateByAbbr = Object.fromEntries(states.map((s) => [s.abbr, s]));
const metrosIn = (abbr) => metros.filter((m) => m.st === abbr || m.also.includes(abbr));
const where = (m) => (m.the ? `the ${m.label}` : m.label); // "the Inland Empire, CA"
const placeName = (m) => (m.the ? `the ${m.name}` : m.name);

for (const m of metros) if (!stateByAbbr[m.st]) throw new Error(`Unknown state ${m.st} on ${m.slug}`);
const seen = new Set();
const metroBySlug = Object.fromEntries(metros.map((m) => [m.slug, m]));
const subsOf = (m) => submarkets.filter((x) => x.metro === m.slug);
for (const x of submarkets) if (!metroBySlug[x.metro]) throw new Error(`Unknown metro ${x.metro} on ${x.slug}`);
for (const p of [...metros, ...states, ...types, ...situations, ...submarkets]) {
  if (seen.has(p.slug)) throw new Error(`Duplicate page address: ${p.slug}`);
  seen.add(p.slug);
}

// ── shared pieces ────────────────────────────────────────────────────────
const P = { form: partial('form'), stats: partial('stats'), how: partial('how'), why: partial('why'), purchased: partial('purchased'), testimonials: C.showTestimonials ? partial('testimonials') : '' };

const orgSchema = {
  '@type': 'Organization',
  '@id': `${C.siteUrl}/#organization`,
  name: C.brand,
  url: C.siteUrl,
  description: 'Direct cash buyer of industrial and warehouse properties across the United States.',
  telephone: C.phoneTel,
  email: C.email,
  address: { '@type': 'PostalAddress', addressLocality: C.city, addressRegion: C.region, postalCode: C.postalCode, addressCountry: 'US' },
  areaServed: { '@type': 'Country', name: 'United States' },
  ...(C.sameAs.length ? { sameAs: C.sameAs } : {}),
};

const tracking = () => {
  const id = C.ga4Id || C.googleAdsId;
  if (!id) return '';
  const cfg = [C.ga4Id, C.googleAdsId].filter(Boolean).map((x) => `gtag('config','${x}');`).join('');
  return `<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());${cfg}</script>`;
};

const siteVars = `<script>var SITE=${JSON.stringify({
  formEndpoint: C.formEndpoint, phone: C.phone, phoneTel: C.phoneTel,
  googleAdsId: C.googleAdsId, googleAdsLeadLabel: C.googleAdsLeadLabel, googleAdsCallLabel: C.googleAdsCallLabel,
})};</script>`;

const nav = `<nav>
  <a class="logo" href="/" style="text-decoration:none;color:inherit">
    <div class="logo-icon">SW</div>
    <div class="logo-text">${esc(C.brandShort)}<span>Direct · Cash Buyer</span></div>
  </a>
  <div class="nav-links">
    <a href="/#how">How It Works</a>
    <a href="/locations">Markets</a>
    <a href="/#faq">FAQ</a>
    <a class="nav-keep" href="tel:${C.phoneTel}">${C.phone}</a>
  </div>
  <a class="nav-cta" href="#get-offer">Get a Cash Offer</a>
</nav>`;

const footer = `<footer>
  <div class="footer-grid four">
    <div>
      <div class="footer-brand">${esc(C.brand)}</div>
      <p class="footer-desc">We are a direct cash buyer of industrial and warehouse properties across the United States. No brokers, no commissions, no games — just fast, fair cash offers.</p>
      <p style="font-size:0.78rem;color:var(--steeldk);margin-top:12px">📞 <a href="tel:${C.phoneTel}" style="color:inherit;text-decoration:none">${C.phone}</a><br>✉ ${C.email}<br>📍 ${C.city}, ${C.region} ${C.postalCode}</p>
    </div>
    <div class="footer-col">
      <h4>Company</h4>
      <a href="/#how">How It Works</a>
      <a href="/#properties">Properties Purchased</a>
      <a href="/#faq">FAQ</a>
      <a href="/locations">All Markets</a>
      <a href="#get-offer">Get an Offer</a>
    </div>
    <div class="footer-col">
      <h4>What We Buy</h4>
      ${types.map((t) => `<a href="/${t.slug}">${esc(t.short)}</a>`).join('\n      ')}
    </div>
    <div class="footer-col">
      <h4>Top Markets</h4>
      ${C.featuredMetros.slice(0, 8).map((s) => metros.find((m) => m.slug === `sell-warehouse-${s}`)).map((m) => `<a href="/${m.slug}">${esc(m.name)}</a>`).join('\n      ')}
    </div>
  </div>
  <div class="footer-bottom">
    <span>© ${YEAR} ${esc(C.brand)} · All rights reserved · We are a direct buyer, not a broker</span>
    <span><a href="/privacy" style="color:inherit">Privacy</a> · <a href="/terms" style="color:inherit">Terms</a> · ${C.city}, ${C.region} · Buying Nationwide</span>
  </div>
</footer>`;

const hero = ({ badge, h1, sub, market }) => `<section class="hero${market ? ' hero-market' : ''}">
  <div>
    <div class="hero-badge">${badge}</div>
    <h1>${h1}</h1>
    <p class="hero-sub">${sub}</p>
    <div class="hero-checks">
      <div class="hero-check">Close in as little as 14 days</div>
      <div class="hero-check">All-cash — no financing contingencies</div>
      <div class="hero-check">We buy as-is, any condition</div>
      <div class="hero-check">Zero fees, zero commissions</div>
    </div>
    <div class="hero-phone">
      <div>
        <span class="hero-phone-label">Call Us Directly</span>
        <a class="hero-phone-num" href="tel:${C.phoneTel}" style="text-decoration:none">${C.phone}</a>
      </div>
    </div>
  </div>
  ${P.form}
</section>`;

const crumbs = (trail) => `<div class="crumbs">${trail.map(([label, href]) => (href ? `<a href="${href}">${esc(label)}</a>` : esc(label))).join('<span>›</span>')}</div>`;
const crumbSchema = (trail) => ({
  '@type': 'BreadcrumbList',
  itemListElement: trail.map(([label, href], i) => ({ '@type': 'ListItem', position: i + 1, name: label, ...(href ? { item: C.siteUrl + (href === '/' ? '/' : href) } : {}) })),
});

const faqSection = (faqs, title = 'FREQUENTLY ASKED') => `<section class="faq-sec" id="faq">
  <div class="sec-tag">Common Questions</div>
  <h2 class="sec-title">${title}</h2>
  <div class="faq-list">
${faqs.map(([q, a]) => `    <div class="faq-item">
      <div class="faq-q" onclick="toggleFaq(this)">${esc(q)}<span class="faq-toggle">+</span></div>
      <div class="faq-a">${esc(a)}</div>
    </div>`).join('\n')}
  </div>
</section>`;
const faqSchema = (faqs) => ({ '@type': 'FAQPage', mainEntity: faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });

const pills = (items) => `<div class="types-grid">${items.map((x) => `<div class="type-pill"><div class="type-pill-dot"></div><span>${esc(x)}</span></div>`).join('')}</div>`;
const linkPills = (items) => `<div class="link-grid">${items.map(([label, href]) => `<a class="type-pill" href="${href}"><div class="type-pill-dot"></div><span>${esc(label)}</span></a>`).join('')}</div>`;
const typeLinks = (heading, sub) => `<section class="types-sec">
  <div class="sec-tag">Property Types</div>
  <h2 class="sec-title">${heading}</h2>
  <p class="sec-sub" style="color:var(--steeldk)">${sub}</p>
  ${linkPills(types.map((t) => [t.name, `/${t.slug}`]))}
</section>`;

const situationLinks = () => `<section class="sec" id="situations">
  <div class="sec-tag">Seller Situations</div>
  <h2 class="sec-title">SITUATIONS WE HANDLE</h2>
  <p class="sec-sub">Most owners who call us have a reason a normal listing does not fit. These are the ones we see most.</p>
  ${linkPills(situations.map((x) => [x.short, `/${x.slug}`]))}
</section>`;

const cta = (line) => `<section class="cta-sec">
  <div class="sec-tag" style="color:var(--orange2)">Ready to Sell?</div>
  <h2 class="sec-title">GET YOUR FREE CASH OFFER TODAY</h2>
  <p class="sec-sub" style="color:rgba(255,255,255,0.6);text-align:center">${line}</p>
  <a class="cta-btn" href="#get-offer">Submit My Property →</a>
  <a class="cta-btn outline" href="tel:${C.phoneTel}">📞 Call ${C.phone}</a>
</section>`;

const GENERAL_FAQ = [
  ['Do I have to make any repairs before selling?', "No — we buy industrial properties completely as-is. Whether it's deferred maintenance, aging roof systems, environmental issues, or anything else, we factor the condition into our offer so you don't spend a dime before closing."],
  ['How do you determine the offer price?', "We analyze recent comparable industrial sales, market cap rates, building condition, location, occupancy, and any existing leases. We're transparent about our analysis and happy to walk you through how we arrived at our number."],
  ['Is there any obligation when I submit the form?', 'None whatsoever. Submitting your information is completely free and places you under zero obligation to accept any offer or proceed in any way. We simply want to understand your property and situation.'],
  ["What's the minimum property size or value you consider?", "We typically look at industrial properties with a value of $500,000 or more. If you're unsure, just submit the form and we'll let you know quickly if it's a fit for us."],
  ['What states do you purchase in?', 'We purchase industrial properties in all 50 states. We have established relationships with local title companies and legal counsel nationwide to ensure smooth closings wherever your property is located.'],
  ['Do I need a broker or attorney?', "You don't need a broker — you'll save that commission. You're always welcome to have an attorney represent you, especially on larger transactions, and we encourage it. We use a licensed title company to handle all closing documents."],
  ['What if my property has tenants or leases?', "Tenanted properties are fine — we purchase occupied industrial buildings regularly. We'll review the existing leases as part of our due diligence. In many cases, having a strong tenant actually improves the offer."],
];

// ── page shell ───────────────────────────────────────────────────────────
function page({ slug, title, description, body, schema = [], attrs = {}, noindex = false }) {
  // Pages without the offer form send their "Get an offer" links to the form on the home page.
  const hasForm = body.includes('id="get-offer"');
  const fix = (html) => (hasForm ? html : html.replaceAll('href="#get-offer"', 'href="/#get-offer"'));
  const canonical = slug === '' ? `${C.siteUrl}/` : url(slug);
  const graph = { '@context': 'https://schema.org', '@graph': [orgSchema, { '@type': 'WebPage', '@id': `${canonical}#webpage`, url: canonical, name: title, description, isPartOf: { '@id': `${C.siteUrl}/#organization` } }, ...schema] };
  const data = Object.entries(attrs).filter(([, v]) => v).map(([k, v]) => ` data-${k}="${esc(v)}"`).join('');
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
<meta name="robots" content="${noindex ? 'noindex, follow' : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'}">
<meta property="og:type" content="website">
<meta property="og:url" content="${canonical}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${C.ogImage}">
<meta property="og:site_name" content="${esc(C.brand)}">
<meta property="og:locale" content="en_US">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${C.ogImage}">
<script type="application/ld+json">${JSON.stringify(graph).replace(/</g, '\\u003c')}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/styles.css">
${tracking()}
</head>
<body${data}>
${fix(nav)}
${fix(body)}
${fix(footer)}
${siteVars}
<script src="/app.js" defer></script>
</body>
</html>
`;
}

// ── home ─────────────────────────────────────────────────────────────────
function homePage() {
  const featured = C.featuredMetros.map((s) => {
    const m = metros.find((x) => x.slug === `sell-warehouse-${s}`);
    if (!m) throw new Error(`featuredMetros: no metro "${s}"`);
    return [m.label, `/${m.slug}`];
  });
  const body = `${hero({
    badge: 'Industrial · Warehouse · Direct Cash Buyer',
    h1: 'WE BUY<br>INDUSTRIAL<br><em>PROPERTIES</em><br>FOR CASH',
    sub: 'No agents. No commissions. No repairs. We make all-cash offers on warehouses, distribution centers, and industrial facilities across the United States.',
  })}
${P.stats}
${P.how}
${P.purchased}
${P.why}
${typeLinks('WHAT WE BUY', 'We purchase all types of industrial and warehouse properties, occupied or vacant, any condition, anywhere in the US.')}
<section class="sec" id="markets">
  <div class="sec-tag">Where We Buy</div>
  <h2 class="sec-title">MARKETS WE BUY IN</h2>
  <p class="sec-sub">We buy industrial property in all 50 states. These are some of the markets we look at most.</p>
  ${linkPills(featured)}
  <a class="more-link" href="/locations">See all ${metros.length} markets and all 50 states →</a>
</section>
${situationLinks()}
${P.testimonials}
${faqSection(GENERAL_FAQ)}
${cta('No agents. No fees. No repairs. Just a fair, fast, all-cash offer for your industrial property.')}`;
  return page({
    slug: '',
    title: 'Sell Your Warehouse Fast for Cash | Direct Industrial Property Buyer',
    description: 'Sell your warehouse or industrial property fast for cash. We are a direct buyer — no agents, no commissions, no repairs. All-cash offers in 24 hours. Close in 14 days. All 50 states.',
    body,
    schema: [
      { '@type': 'Service', name: 'Cash Purchase of Industrial & Warehouse Properties', provider: { '@id': `${C.siteUrl}/#organization` }, areaServed: 'United States', serviceType: 'Industrial real estate cash buyer' },
      faqSchema(GENERAL_FAQ),
    ],
  });
}

// ── metro pages ──────────────────────────────────────────────────────────
function metroPage(m) {
  const st = stateByAbbr[m.st];
  const W = where(m);
  const trail = [['Home', '/'], ['Markets', '/locations'], [st.name, `/${st.slug}`], [m.name, null]];
  const nearby = metros.filter((x) => x !== m && (x.st === m.st || m.also.includes(x.st) || x.also.includes(m.st))).slice(0, 11);
  const faqs = [
    [`How fast can I sell my warehouse in ${m.label}?`, `We send a written cash offer within 24 hours of receiving your property details and can close in as little as 14 days through a licensed title company. If you need more time, we close on your schedule.`],
    [`Which parts of ${placeName(m)} do you buy in?`, `All of it. That includes ${list(m.areas)}, and anywhere else in our coverage area: ${m.counties.join(', ')}.`],
    [`Will you buy a vacant or run-down industrial building in ${placeName(m)}?`, `Yes. We buy as-is, whether the building is vacant, needs a roof, has deferred maintenance or has environmental questions. We factor the condition into the offer, so you spend nothing before closing.`],
    [`Do I need a broker to sell an industrial property in ${st.name}?`, `No. We are the buyer, so there is no listing and no commission. You are welcome to have an attorney represent you, and a licensed title company handles the closing documents.`],
    [`What does it cost me to sell to you?`, `Nothing. There are no fees and no commissions, and we cover closing costs on our side.`],
    [`What if my ${m.name} property has a tenant?`, `Tenanted buildings are fine. We review the lease during due diligence, and a solid tenant often improves the offer.`],
    GENERAL_FAQ[3],
  ];
  const body = `${crumbs(trail)}
${hero({
    market: true,
    badge: `${esc(m.label)} · Direct Cash Buyer`,
    h1: `SELL YOUR<br>WAREHOUSE FAST IN<br><em>${esc(m.label).toUpperCase()}</em>`,
    sub: `We buy warehouses and industrial buildings in ${esc(W)} directly from owners. No agents, no commissions, no repairs — a written all-cash offer within 24 hours.`,
  })}
${P.stats}
<section class="sec" id="areas">
  <div class="sec-tag">${esc(m.label)}</div>
  <h2 class="sec-title">WHERE WE BUY IN ${esc(placeName(m)).toUpperCase()}</h2>
  <p class="prose">We buy warehouses, distribution buildings, manufacturing plants and flex industrial property throughout ${esc(W)}. Occupied or vacant, one building or several, we make an offer on the property as it sits today.</p>
  ${pills(m.areas)}
  <p class="prose"><strong>Coverage area:</strong> ${esc(m.counties.join(', '))}.</p>
  ${subsOf(m).length ? `<p class="prose"><strong>Local pages:</strong></p>${linkPills(subsOf(m).map((x) => [x.name, `/${x.slug}`]))}` : ''}
  <p class="prose">Freight in this market moves on ${esc(list(m.infra))}. Buildings close to those routes are what we look for first, but we will make an offer on any industrial property in the area.</p>
</section>
${P.how}
${typeLinks(`WHAT WE BUY IN ${esc(placeName(m)).toUpperCase()}`, `Every type of industrial property in ${esc(W)}, occupied or vacant, in any condition.`)}
${P.why}
${situationLinks()}
${faqSection(faqs, `SELLING IN ${esc(placeName(m)).toUpperCase()}`)}
<section class="sec">
  <div class="sec-tag">Nearby Markets</div>
  <h2 class="sec-title">MORE MARKETS WE BUY IN</h2>
  ${linkPills([[`All of ${st.name}`, `/${st.slug}`], ...nearby.map((x) => [x.label, `/${x.slug}`])])}
  <a class="more-link" href="/locations">See every market →</a>
</section>
${cta(`No agents. No fees. No repairs. Just a fair, fast, all-cash offer for your ${esc(m.name)} industrial property.`)}`;
  return page({
    slug: m.slug,
    title: `Sell Your Warehouse Fast in ${m.label} | Cash Offer in 24 Hours`,
    description: `Sell your warehouse or industrial building in ${W} directly to a cash buyer. No agents, no commissions, no repairs. Written offer in 24 hours, close in as little as 14 days.`,
    body,
    attrs: { state: st.name, city: m.areas[0].split(/ \/ | \(/)[0], market: m.label },
    schema: [
      crumbSchema(trail),
      { '@type': 'Service', name: `Cash purchase of warehouses and industrial property in ${m.label}`, provider: { '@id': `${C.siteUrl}/#organization` }, serviceType: 'Industrial real estate cash buyer', areaServed: { '@type': 'Place', name: m.label, containedInPlace: { '@type': 'State', name: st.name } } },
      faqSchema(faqs),
    ],
  });
}

// ── state pages ──────────────────────────────────────────────────────────
function statePage(s) {
  const local = metrosIn(s.abbr);
  const trail = [['Home', '/'], ['Markets', '/locations'], [s.name, null]];
  const faqs = [
    [`How fast can I sell my warehouse in ${s.name}?`, `We send a written cash offer within 24 hours of receiving your property details and can close in as little as 14 days through a licensed title company. If you need more time, we close on your schedule.`],
    [`Where in ${s.name} do you buy industrial property?`, `Statewide. That includes ${list([...local.map((m) => m.name), ...s.cities])}, and smaller markets in between.`],
    [`Do I need a broker to sell an industrial property in ${s.name}?`, `No. We are the buyer, so there is no listing and no commission. You are welcome to have an attorney represent you, and a licensed title company handles the closing documents.`],
    [`Will you buy a vacant or run-down industrial building?`, `Yes. We buy as-is, whether the building is vacant, needs a roof, has deferred maintenance or has environmental questions. We factor the condition into the offer, so you spend nothing before closing.`],
    [`What does it cost me to sell to you?`, `Nothing. There are no fees and no commissions, and we cover closing costs on our side.`],
    GENERAL_FAQ[3],
  ];
  const body = `${crumbs(trail)}
${hero({
    market: true,
    badge: `${esc(s.name)} · Direct Cash Buyer`,
    h1: `SELL YOUR<br>WAREHOUSE FAST IN<br><em>${esc(s.name).toUpperCase()}</em>`,
    sub: `We buy warehouses and industrial buildings across ${esc(s.name)} directly from owners. No agents, no commissions, no repairs — a written all-cash offer within 24 hours.`,
  })}
${P.stats}
<section class="sec" id="areas">
  <div class="sec-tag">${esc(s.name)}</div>
  <h2 class="sec-title">WHERE WE BUY IN ${esc(s.name).toUpperCase()}</h2>
  <p class="prose">We buy warehouses, distribution buildings, manufacturing plants and flex industrial property anywhere in ${esc(s.name)}. Occupied or vacant, one building or several, we make an offer on the property as it sits today.</p>
  ${local.length ? `${linkPills(local.map((m) => [m.label, `/${m.slug}`]))}
  <p class="prose"><strong>We also buy in:</strong> ${esc(s.cities.join(', '))}, and the rest of the state.</p>` : `${pills(s.cities)}
  <p class="prose">Those are the industrial markets we see most often in ${esc(s.name)}, and we buy in the rest of the state too.</p>`}
  <p class="prose">Freight in ${esc(s.name)} moves on ${esc(list(s.infra))}. Buildings close to those routes are what we look for first, but we will make an offer on any industrial property in the state.</p>
</section>
${P.how}
${typeLinks(`WHAT WE BUY IN ${esc(s.name).toUpperCase()}`, `Every type of industrial property in ${esc(s.name)}, occupied or vacant, in any condition.`)}
${P.why}
${situationLinks()}
${faqSection(faqs, `SELLING IN ${esc(s.name).toUpperCase()}`)}
${cta(`No agents. No fees. No repairs. Just a fair, fast, all-cash offer for your ${esc(s.name)} industrial property.`)}`;
  return page({
    slug: s.slug,
    title: `Sell Your Warehouse Fast in ${s.name} | Direct Cash Buyer`,
    description: `Sell your warehouse or industrial building in ${s.name} directly to a cash buyer. No agents, no commissions, no repairs. Written offer in 24 hours, close in as little as 14 days.`,
    body,
    attrs: { state: s.name, market: s.name },
    schema: [
      crumbSchema(trail),
      { '@type': 'Service', name: `Cash purchase of warehouses and industrial property in ${s.name}`, provider: { '@id': `${C.siteUrl}/#organization` }, serviceType: 'Industrial real estate cash buyer', areaServed: { '@type': 'State', name: s.name } },
      faqSchema(faqs),
    ],
  });
}

// ── property-type pages ──────────────────────────────────────────────────
function typePage(t) {
  const trail = [['Home', '/'], ['What We Buy', '/#get-offer'], [t.name, null]];
  const featured = C.featuredMetros.map((s) => metros.find((x) => x.slug === `sell-warehouse-${s}`));
  const faqs = [
    [`How fast can I sell my ${t.noun}?`, `We send a written cash offer within 24 hours of receiving your property details and can close in as little as 14 days through a licensed title company. If you need more time, we close on your schedule.`],
    ...GENERAL_FAQ,
  ];
  const body = `${crumbs(trail)}
${hero({
    market: true,
    badge: `${esc(t.short)} · Direct Cash Buyer`,
    h1: `WE BUY<br><em>${esc(t.name).toUpperCase()}</em><br>FOR CASH`,
    sub: `${esc(t.intro)} No agents, no commissions, no repairs — a written all-cash offer within 24 hours.`,
  })}
${P.stats}
<section class="sec">
  <div class="sec-tag">${esc(t.short)}</div>
  <h2 class="sec-title">WHAT WE LOOK AT</h2>
  <p class="prose">You do not need a full package to get an offer. These are the things that shape our number on a ${esc(t.noun)}, and we can work with whatever you have on hand.</p>
  <ul class="check-list">${t.looks.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
</section>
<section class="types-sec">
  <div class="sec-tag">Common Situations</div>
  <h2 class="sec-title">WHEN OWNERS CALL US</h2>
  <ul class="check-list">${t.situations.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
</section>
${P.how}
${P.why}
<section class="sec" id="markets">
  <div class="sec-tag">Where We Buy</div>
  <h2 class="sec-title">MARKETS WE BUY IN</h2>
  <p class="sec-sub">We buy ${esc(t.name.toLowerCase())} in all 50 states.</p>
  ${linkPills(featured.map((m) => [m.label, `/${m.slug}`]))}
  <a class="more-link" href="/locations">See all ${metros.length} markets and all 50 states →</a>
</section>
${faqSection(faqs)}
${cta(`No agents. No fees. No repairs. Just a fair, fast, all-cash offer for your ${esc(t.noun)}.`)}`;
  return page({
    slug: t.slug,
    title: `We Buy ${t.name} for Cash | Direct Buyer, No Commissions`,
    description: `Sell your ${t.noun} directly to a cash buyer. As-is, no agents, no commissions. Written offer in 24 hours, close in as little as 14 days. All 50 states.`,
    body,
    attrs: { ptype: t.formValue, market: t.name },
    schema: [
      crumbSchema(trail),
      { '@type': 'Service', name: `Cash purchase of ${t.name.toLowerCase()}`, provider: { '@id': `${C.siteUrl}/#organization` }, serviceType: 'Industrial real estate cash buyer', areaServed: 'United States' },
      faqSchema(faqs),
    ],
  });
}

// ── submarket (city) pages ───────────────────────────────────────────────
function submarketPage(x) {
  const m = metroBySlug[x.metro];
  const st = stateByAbbr[x.st];
  const trail = [['Home', '/'], ['Markets', '/locations'], [st.name, `/${st.slug}`], [m.name, `/${m.slug}`], [x.name, null]];
  const siblings = subsOf(m).filter((y) => y !== x);
  const faqs = [
    [`How fast can I sell my warehouse in ${x.label}?`, `We send a written cash offer within 24 hours of receiving your property details and can close in as little as 14 days through a licensed title company. If you need more time, we close on your schedule.`],
    [`Do you buy industrial property all over ${x.name}?`, `Yes. We buy throughout ${x.name} and the rest of ${x.county}, including buildings along ${list(x.roads)}.`],
    [`Will you buy a vacant or run-down building in ${x.name}?`, `Yes. We buy as-is, whether the building is vacant, needs a roof, has deferred maintenance or has environmental questions. We factor the condition into the offer, so you spend nothing before closing.`],
    [`What does it cost me to sell to you?`, `Nothing. There are no fees and no commissions, and we cover closing costs on our side.`],
    [`What if my ${x.name} property has a tenant?`, `Tenanted buildings are fine. We review the lease during due diligence, and a solid tenant often improves the offer.`],
    GENERAL_FAQ[3],
  ];
  const body = `${crumbs(trail)}
${hero({
    market: true,
    badge: `${esc(x.label)} · Direct Cash Buyer`,
    h1: `SELL YOUR<br>WAREHOUSE FAST IN<br><em>${esc(x.label).toUpperCase()}</em>`,
    sub: `We buy warehouses and industrial buildings in ${esc(x.label)} directly from owners. No agents, no commissions, no repairs — a written all-cash offer within 24 hours.`,
  })}
${P.stats}
<section class="sec" id="areas">
  <div class="sec-tag">${esc(x.label)}</div>
  <h2 class="sec-title">INDUSTRIAL PROPERTY WE BUY IN ${esc(x.name).toUpperCase()}</h2>
  <p class="prose">We buy warehouses, shops, manufacturing buildings, yards and flex industrial property in ${esc(x.name)} and across ${esc(x.county)}. Occupied or vacant, we make an offer on the property as it sits today.</p>
  <p class="prose">Industrial property in ${esc(x.name)} sits along ${esc(list(x.roads))}, close to ${esc(x.near)}. If your building is anywhere in that area, we want to see it.</p>
  <p class="prose">${esc(x.name)} is part of our <a href="/${m.slug}" style="color:var(--orange2)">${esc(m.label)}</a> buying area.</p>
</section>
${P.how}
${typeLinks(`WHAT WE BUY IN ${esc(x.name).toUpperCase()}`, `Every type of industrial property in ${esc(x.label)}, occupied or vacant, in any condition.`)}
${P.why}
${situationLinks()}
${faqSection(faqs, `SELLING IN ${esc(x.name).toUpperCase()}`)}
<section class="sec">
  <div class="sec-tag">Nearby</div>
  <h2 class="sec-title">MORE OF ${esc(placeName(m)).toUpperCase()}</h2>
  ${linkPills([[`All of ${m.name}`, `/${m.slug}`], ...siblings.map((y) => [y.name, `/${y.slug}`])])}
</section>
${cta(`No agents. No fees. No repairs. Just a fair, fast, all-cash offer for your ${esc(x.name)} industrial property.`)}`;
  return page({
    slug: x.slug,
    title: `Sell Your Warehouse Fast in ${x.label} | Cash Offer in 24 Hours`,
    description: `Sell your warehouse or industrial building in ${x.label} directly to a cash buyer. No agents, no commissions, no repairs. Written offer in 24 hours, close in as little as 14 days.`,
    body,
    attrs: { state: st.name, city: x.name.split(' & ')[0], market: x.label },
    schema: [
      crumbSchema(trail),
      { '@type': 'Service', name: `Cash purchase of warehouses and industrial property in ${x.label}`, provider: { '@id': `${C.siteUrl}/#organization` }, serviceType: 'Industrial real estate cash buyer', areaServed: { '@type': 'Place', name: x.label, containedInPlace: { '@type': 'State', name: st.name } } },
      faqSchema(faqs),
    ],
  });
}

// ── seller-situation pages ───────────────────────────────────────────────
function situationPage(x) {
  const trail = [['Home', '/'], ['Situations', '/#situations'], [x.short, null]];
  const featured = C.featuredMetros.map((s) => metroBySlug[`sell-warehouse-${s}`]);
  const faqs = [...x.faqs, GENERAL_FAQ[0], GENERAL_FAQ[1], GENERAL_FAQ[2], GENERAL_FAQ[5]];
  const body = `${crumbs(trail)}
${hero({
    market: true,
    badge: `${esc(x.short)} · Direct Cash Buyer`,
    h1: x.h1,
    sub: esc(x.intro),
  })}
${P.stats}
<section class="sec">
  <div class="sec-tag">${esc(x.short)}</div>
  <h2 class="sec-title">HOW WE HANDLE IT</h2>
  <p class="prose">${esc(x.body)}</p>
  <ul class="check-list">${x.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
  <p class="prose" style="font-size:0.85rem">This page is general information, not legal or tax advice. Talk to your own attorney or CPA about your situation.</p>
</section>
${P.how}
${typeLinks('WHAT WE BUY', 'Every type of industrial property, occupied or vacant, in any condition.')}
${P.why}
<section class="sec" id="markets">
  <div class="sec-tag">Where We Buy</div>
  <h2 class="sec-title">MARKETS WE BUY IN</h2>
  <p class="sec-sub">We buy industrial property in all 50 states.</p>
  ${linkPills(featured.map((m) => [m.label, `/${m.slug}`]))}
  <a class="more-link" href="/locations">See all ${metros.length} markets and all 50 states →</a>
</section>
${faqSection(faqs)}
${cta('No agents. No fees. No repairs. Just a fair, fast, all-cash offer for your industrial property.')}`;
  return page({
    slug: x.slug,
    title: x.title,
    description: x.intro.length > 158 ? `${x.intro.slice(0, 155).replace(/\s+\S*$/, '')}…` : x.intro,
    body,
    attrs: { market: x.short },
    schema: [crumbSchema(trail), faqSchema(faqs)],
  });
}

// ── privacy and terms ────────────────────────────────────────────────────
const legalPage = (slug, heading, title, description, sections) => page({
  slug, title, description,
  body: `<section class="sec">
  <div class="sec-tag">${esc(C.brand)}</div>
  <h1 class="sec-title">${heading}</h1>
  <p class="prose">Last updated ${TODAY}.</p>
  ${sections.map(([h, ps]) => `<h2 class="legal-h">${esc(h)}</h2>${ps.map((p) => `<p class="prose">${p}</p>`).join('')}`).join('\n  ')}
</section>`,
});
const contactLine = `${esc(C.brand)}, ${C.city}, ${C.region} ${C.postalCode} · <a href="tel:${C.phoneTel}" style="color:var(--orange2)">${C.phone}</a> · ${C.email}`;
const privacyPage = () => legalPage('privacy', 'PRIVACY POLICY', `Privacy Policy | ${C.brand}`, `How ${C.brand} collects, uses and protects the information you send us.`, [
  ['What we collect', ['When you submit the offer form or contact us, we collect what you give us: your name, phone number, email address, and details about your property such as its address, size, condition, occupancy and asking price.', 'Like most websites, we also receive basic technical information such as the page you visited, the page or ad that referred you, your browser type and an approximate location derived from your IP address.']],
  ['How we use it', ['We use your information to evaluate your property, prepare an offer, and contact you about it by phone, text message or email. We also use it to understand which pages and advertisements bring people to us so we can improve the site.']],
  ['Who we share it with', ['We do not sell your personal information.', 'We share it only with service providers who help us run the site and respond to you, such as our form-processing, analytics and advertising providers, and, if a sale moves forward, with the title company, attorneys and other professionals involved in the closing. We may also disclose information when the law requires it.']],
  ['Cookies and advertising', ['We may use cookies and similar tools from providers such as Google to measure visits and the performance of our advertising. You can control cookies through your browser settings.']],
  ['Calls, texts and email', ['If you give us your phone number or email, we may contact you about your property. Message and data rates may apply to texts. You can ask us to stop at any time by replying STOP to a text, telling us on a call, or emailing us, and we will stop.']],
  ['Your choices', ['You can ask us what information we hold about you, ask us to correct it, or ask us to delete it. Contact us using the details below and we will respond.']],
  ['Contact', [contactLine]],
]);
const termsPage = () => legalPage('terms', 'TERMS OF USE', `Terms of Use | ${C.brand}`, `Terms that apply to using the ${C.brand} website.`, [
  ['Who we are', [`${esc(C.brand)} buys industrial real estate for its own account. We are a principal buyer. We are not acting as a real estate broker or agent for you, and nothing on this site creates an agency relationship.`]],
  ['Offers', ['Submitting a property does not obligate you to sell or us to buy. Any figure we discuss is an indication only. A purchase is binding only when both parties sign a written purchase agreement, and it is subject to the terms of that agreement, including our review of the property and its title.', 'Timeframes on this site, such as how quickly we make offers and close, describe what we aim for and what is possible in many cases. Actual timing depends on the property, title work and third parties.']],
  ['No professional advice', ['Nothing on this site is legal, tax, financial or real estate brokerage advice. Talk to your own attorney, CPA or other adviser before making a decision about your property.']],
  ['Using the site', ['Please give us accurate information and use the site only for lawful purposes. The content of this site belongs to us and may not be copied for commercial use without permission.']],
  ['Contact', [contactLine]],
]);

// ── all markets ──────────────────────────────────────────────────────────
function locationsPage() {
  const trail = [['Home', '/'], ['Markets', null]];
  const groups = states.map((s) => {
    const local = metros.filter((m) => m.st === s.abbr);
    const cities = local.flatMap((m) => subsOf(m));
    return `<div class="state-group"><h3><a href="/${s.slug}">${esc(s.name)} →</a></h3>${local.length ? linkPills([...local.map((m) => [m.name, `/${m.slug}`]), ...cities.map((x) => [x.name, `/${x.slug}`])]) : ''}</div>`;
  });
  const body = `${crumbs(trail)}
${hero({
    market: true,
    badge: 'All 50 States · Direct Cash Buyer',
    h1: 'MARKETS<br>WHERE WE BUY<br><em>INDUSTRIAL PROPERTY</em>',
    sub: 'We buy warehouses and industrial buildings in every state. Pick your market below, or send us the property and we will get back to you within 24 hours.',
  })}
<section class="sec">
  <div class="sec-tag">By State</div>
  <h2 class="sec-title">ALL 50 STATES</h2>
  ${linkPills(states.map((s) => [s.name, `/${s.slug}`]))}
</section>
<section class="types-sec">
  <div class="sec-tag">By Market</div>
  <h2 class="sec-title">${metros.length} INDUSTRIAL MARKETS</h2>
  ${groups.join('\n  ')}
</section>
${cta('No agents. No fees. No repairs. Just a fair, fast, all-cash offer for your industrial property.')}`;
  return page({
    slug: 'locations',
    title: 'Markets Where We Buy Warehouses & Industrial Property | All 50 States',
    description: `We buy warehouses and industrial buildings for cash in all 50 states, including ${metros.length} major industrial markets. Find your market and get a written offer in 24 hours.`,
    body,
    schema: [crumbSchema(trail)],
  });
}

function notFoundPage() {
  return page({
    slug: '404',
    noindex: true,
    title: 'Page Not Found | ' + C.brand,
    description: 'That page does not exist.',
    body: `<section class="sec notfound">
  <div class="sec-tag">404</div>
  <h1 class="sec-title">WE COULDN'T FIND THAT PAGE</h1>
  <p class="sec-sub">The page may have moved. You can still get a cash offer on your industrial property.</p>
  <a class="more-link" href="/">Go to the home page →</a>
  <a class="more-link" href="/locations">See all markets →</a>
</section>`,
  });
}

// ── write everything ─────────────────────────────────────────────────────
function build() {
  rmSync(DIST, { recursive: true, force: true });
  mkdirSync(DIST, { recursive: true });
  const out = (name, content) => writeFileSync(join(DIST, name), content);

  const pages = [
    ['', homePage(), 1.0],
    ['locations', locationsPage(), 0.8],
    ...types.map((t) => [t.slug, typePage(t), 0.8]),
    ...states.map((s) => [s.slug, statePage(s), 0.7]),
    ...metros.map((m) => [m.slug, metroPage(m), 0.9]),
    ...submarkets.map((x) => [x.slug, submarketPage(x), 0.8]),
    ...situations.map((x) => [x.slug, situationPage(x), 0.8]),
    ['privacy', privacyPage(), 0.2],
    ['terms', termsPage(), 0.2],
  ];
  for (const [slug, html] of pages) out(slug === '' ? 'index.html' : `${slug}.html`, html);
  out('404.html', notFoundPage());
  out('styles.css', read('src/styles.css'));
  out('app.js', read('src/app.js'));
  out('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${C.siteUrl}/sitemap.xml\n`);
  out('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(([slug, , pr]) => `  <url><loc>${slug === '' ? `${C.siteUrl}/` : url(slug)}</loc><lastmod>${TODAY}</lastmod><priority>${pr.toFixed(1)}</priority></url>`).join('\n')}
</urlset>
`);
  console.log(`Built ${pages.length} pages: home, markets index, ${types.length} property types, ${states.length} states, ${metros.length} metros, ${submarkets.length} city pages, ${situations.length} situations, privacy, terms → dist/`);
}

build();

// ── local preview ────────────────────────────────────────────────────────
if (process.argv.includes('--serve')) {
  const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.xml': 'application/xml', '.txt': 'text/plain' };
  const port = Number(process.env.PORT) || 4173;
  createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/\.\./g, '');
    if (p === '/') p = '/index.html';
    let file = join(DIST, p);
    if (!extname(file)) file += '.html'; // same clean addresses Vercel serves
    const ok = existsSync(file);
    if (!ok) file = join(DIST, '404.html');
    res.writeHead(ok ? 200 : 404, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
    res.end(readFileSync(file));
  }).listen(port, () => console.log(`Preview: http://localhost:${port}`));
}
