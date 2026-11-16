/* Shared page sections. Every site is rendered with these functions.
   Each function takes the site's settings (site.json) and products (products.json)
   and returns HTML. Sections a site has no content for are skipped. */

const ICONS = {
  drop: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
  wind: '<path d="M3 8h11a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h7"/>',
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  spray: '<path d="M9 8h6v13H9zM10 8V5h4v3M14 4h3M16 2v4"/>',
  jar: '<path d="M7 7h10v12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2zM8 3h8v4H8z"/>',
  tooth: '<path d="M7 3c-2 0-3 2-3 4 0 3 1 5 2 8s1 6 3 6 2-5 3-5 1 5 3 5 2-3 3-6 2-5 2-8c0-2-1-4-3-4s-3 1-5 1-3-1-5-1z"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  snow: '<path d="M12 2v20M4 6l16 12M20 6L4 18M12 6l-2-2M12 6l2-2M12 18l-2 2M12 18l2 2"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  leaf: '<path d="M5 19c0-9 5-14 15-14 0 10-5 15-14 15"/><path d="M5 19c3-5 6-8 10-10"/>',
  cup: '<path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM17 10h2a2 2 0 0 1 0 5h-2M8 3v2M12 3v2"/>',
  gut: '<circle cx="12" cy="12" r="9"/><path d="M8 10c1.5-2 3 2 4.5 0s2.5 2 3.5 0M8 15c1.5-2 3 2 4.5 0s2.5 2 3.5 0"/>',
  bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  out: '<path d="M7 17L17 7M9 7h8v8"/>',
  chevron: '<path d="M6 9l6 6 6-6"/>',
  cross: '<path d="M12 5v14M5 12h14"/>'
};

const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const ico = (k, cls = "ico") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[k] || k}</svg>`;
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/* Works out the button text from where a link goes. */
function linkLabel(link) {
  if (link.label) return link.label;
  let host = "";
  try { host = new URL(link.url).hostname; } catch (e) {}
  if (/amazon\.|amzn\.to|a\.co|amzlink\.to/.test(host)) return "Shop on Amazon";
  if (/ebay\./.test(host)) return "Find on eBay";
  return "Buy direct";
}

function mark(site) {
  return `<span class="mark">${ico(site.mark)}</span>`;
}

function header(site, base = "") {
  const nav = site.nav.map((n, i) =>
    `<a href="${esc(n.href[0] === "#" ? base + n.href : n.href)}"${n.label === "Shop" || n.cta ? ' class="cta"' : ""}>${esc(n.label)}</a>`).join("");
  return `<header class="top"><div class="wrap">
  <a class="brand" href="${base}#top" aria-label="${esc(site.name)} home">${mark(site)}<b>${esc(site.name)}</b></a>
  <nav class="nav" aria-label="Main">${nav}</nav>
</div></header>`;
}

function hero(site, products) {
  const h = site.hero;
  const tiles = site.categories.map((c, i) => {
    const n = products.filter(p => p.cat === c.id).length;
    return `<button class="tile" type="button" data-cat="${c.id}" style="--i:${i}">
      <span class="tile-ico">${ico(c.icon)}</span>
      <b>${esc(c.short || c.label)}</b><span class="n">${n} ${n === 1 ? "pick" : "picks"}</span>
    </button>`;
  }).join("");
  return `<section class="hero" id="top"><div class="wrap hero-grid">
  <div>
    <span class="eyebrow">${esc(h.eyebrow)}</span>
    <h1>${h.title}</h1>
    <p class="hero-text">${esc(h.text)}</p>
    <div class="search" role="search">
      ${ico("search")}
      <input id="q" type="search" placeholder="${esc(h.searchPlaceholder)}" autocomplete="off" aria-label="Search products">
    </div>
  </div>
  <div class="scene"><div class="tiles" aria-label="Browse by category">${tiles}</div></div>
</div></section>`;
}

function startHere(site, products) {
  const picks = products.filter(p => p.start).sort((a, b) => a.start.order - b.start.order);
  if (!site.start || !picks.length) return "";
  const cards = picks.map((p, i) => `<a class="swap" href="#${p.id}">
      <span class="num">${String(i + 1).padStart(2, "0")}</span>
      <span class="from">${esc(p.start.swap)}</span>
      <h3>${esc(p.start.title || p.name)}</h3>
      <p>${esc(p.why)}</p>
      <span class="go"><span>See the pick</span><i>${ico("arrow")}</i></span>
    </a>`).join("");
  return `<section class="band" id="start"><div class="wrap">
  <div class="band-head"><h2>${esc(site.start.title)}</h2><p>${esc(site.start.text)}</p></div>
  <div class="swaps">${cards}</div>
</div></section>`;
}

function chipbar(site, products) {
  const all = [{ id: "all", label: "All", n: products.length }]
    .concat(site.categories.map(c => ({ id: c.id, label: c.label, n: products.filter(p => p.cat === c.id).length })));
  return `<div class="chipbar" id="catalog"><div class="wrap"><div class="chips" role="group" aria-label="Filter by category">
  ${all.map(c => `<button class="chip" type="button" data-id="${c.id}" aria-pressed="${c.id === "all"}">${esc(c.label)}<span class="n">${c.n}</span></button>`).join("")}
</div></div></div>`;
}

function evidenceLabel(site, p) {
  const levels = (site.evidence && site.evidence.levels) || {};
  return "Evidence: " + (p.evidence.label || (levels[p.evidence.level] || {}).label || p.evidence.level);
}

function card(site, p, cat) {
  const badge = p.badge ? `<span class="badge ${slug(p.badge)}">${esc(p.badge)}</span>` : "";
  const links = p.links.map((l, i) =>
    `<a class="btn ${i === 0 ? "primary" : "ghost"}" href="${esc(l.url)}" target="_blank" rel="sponsored nofollow noopener">${esc(linkLabel(l))}${ico("out")}</a>`).join("");
  const search = [p.name, p.brand, p.why, p.what, cat.label, p.badge].filter(Boolean).join(" ").toLowerCase();
  /* PRODUCT PHOTO: add "image": "img/your-file.jpg" to the product in products.json
     and put the file in the site's static/img folder. Square photos look best. */
  const media = p.image
    ? `<div class="media has-img"><img src="${esc(p.image)}" alt="${esc((p.brand ? p.brand + " " : "") + p.name)}" loading="lazy" width="400" height="400"></div>`
    : `<div class="media" aria-hidden="true">${ico(cat.icon)}</div>`;
  return `<article class="card" id="${p.id}" data-cat="${p.cat}" data-search="${esc(search)}">
    ${media}
    <div class="info">
      <div class="card-top"><div>${p.brand ? `<div class="by">${esc(p.brand)}</div>` : ""}<h3>${esc(p.name)}</h3></div>${badge}</div>
      ${p.what ? `<p class="what">${esc(p.what)}</p>` : ""}
      <p class="why">${ico("check")}<span>${site.catalog.whyVisible ? `<b>${esc(site.catalog.whyLabel)}:</b> ` : `<span class="sr">${esc(site.catalog.whyLabel)}: </span>`}${esc(p.why)}</span></p>
    </div>
    ${p.evidence ? `<div class="ev ev-${p.evidence.level}"><span class="ev-pill">${esc(evidenceLabel(site, p))}</span><span class="ev-note">${esc(p.evidence.note)} <a href="sources.html#${p.id}">Sources</a></span></div>` : ""}
    ${p.caution ? `<p class="caution"><b>${esc(site.catalog.cautionLabel || "Heads up")}:</b> ${esc(p.caution)}</p>` : ""}
    <div class="acts">${links}</div>
  </article>`;
}

function catalog(site, products) {
  const secs = site.categories.map(c => {
    const items = products.filter(p => p.cat === c.id);
    if (!items.length) return "";
    const starred = items.some(p => /\*/.test(p.why));
    return `<details class="sec" id="${c.id}">
    <summary class="sec-head"><span class="sec-ico">${ico(c.icon)}</span><div class="sec-txt"><h2>${esc(c.label)}</h2><p><span class="count">${items.length} products</span> · ${esc(c.blurb)}</p></div><span class="chev">${ico("chevron")}</span></summary>
    <div class="sec-body">
      <div class="grid">${items.map(p => card(site, p, c)).join("")}</div>
      ${(starred || site.sectionDisclaimer) && site.footer.fda ? `<p class="sec-note">${esc(site.footer.fda)}</p>` : ""}
    </div>
  </details>`;
  }).join("");
  return `<main class="wrap catalog">
  <h2 class="sr">${esc(site.catalog.title)}</h2>
  ${notice(site)}
  ${legend(site)}
  ${secs}
  <div class="empty" id="empty" hidden><strong>No matches found</strong>Try another word, or clear your search to see everything.</div>
</main>`;
}

/* Visible "talk to your doctor" notice (health sites). */
function notice(site) {
  if (!site.notice) return "";
  return `<aside class="notice" role="note">${ico("shield")}<p><b>${esc(site.notice.title)}</b> ${esc(site.notice.text)}</p></aside>`;
}

/* Explains what each evidence level means. */
function legend(site) {
  const e = site.evidence;
  if (!e) return "";
  return `<div class="legend"><b>${esc(e.title)}</b><ul>${Object.keys(e.levels).map(k =>
    `<li class="ev-${k}"><span class="ev-pill">${esc(e.levels[k].label)}</span><span>${esc(e.levels[k].text)}</span></li>`).join("")}</ul></div>`;
}

/* "When to see a doctor" box. */
function doctorBox(site) {
  const d = site.doctorBox;
  if (!d) return "";
  return `<section class="band" id="doctor"><div class="wrap"><div class="doc">
  <div class="doc-head"><span class="doc-ico">${ico("cross")}</span><div><h2>${esc(d.title)}</h2><p>${esc(d.text)}</p></div></div>
  <ul>${d.items.map(t => `<li>${ico("check")}<span>${esc(t)}</span></li>`).join("")}</ul>
  <p class="doc-911">${esc(d.emergency)}</p>
</div></div></section>`;
}

/* The /sources page: every product with its evidence level and references. */
function sourcesPage(site, products) {
  const s = site.sourcesPage;
  const secs = site.categories.map(c => {
    const items = products.filter(p => p.cat === c.id);
    if (!items.length) return "";
    return `<section class="src-sec"><h2>${esc(c.label)}</h2>${items.map(p => `<article class="src" id="${p.id}">
      <h3>${esc(p.name)}</h3>
      ${p.evidence ? `<p class="ev ev-${p.evidence.level}"><span class="ev-pill">${esc(evidenceLabel(site, p))}</span><span class="ev-note">${esc(p.evidence.note)}</span></p>` : ""}
      <ol>${(p.sources || []).map(x => `<li><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.title)}</a>${x.note ? `<span> ${esc(x.note)}</span>` : ""}</li>`).join("")}</ol>
    </article>`).join("")}</section>`;
  }).join("");
  return `<main class="wrap page">
  <a class="back" href="index.html#catalog">${ico("arrow")}<span>Back to all products</span></a>
  <h1>${esc(s.title)}</h1>
  ${s.paragraphs.map(t => `<p class="lead">${esc(t)}</p>`).join("")}
  ${legend(site)}
  ${secs}
  <p class="sec-note">${esc(site.footer.fda)}</p>
</main>`;
}

function about(site) {
  const a = site.about;
  if (!a) return "";
  return `<section class="band about" id="about"><div class="wrap about-grid">
  <div class="about-copy">
    <span class="kicker">${esc(a.eyebrow)}</span>
    <div class="band-head"><h2>${esc(a.title)}</h2></div>
    ${a.paragraphs.map(t => `<p>${esc(t)}</p>`).join("")}
  </div>
  <ul class="points">${a.points.map(pt => `<li><span class="dot">${ico("check")}</span><div><b>${esc(pt.title)}</b><span>${esc(pt.text)}</span></div></li>`).join("")}</ul>
</div></section>`;
}

function signup(site) {
  const s = site.signup;
  if (!s) return "";
  return `<section class="band" id="signup"><div class="wrap"><div class="signup-card">
  <div><h2>${esc(s.title)}</h2><p>${esc(s.text)}</p></div>
  <div>
    <!-- EMAIL SIGNUP: UI only for now. To connect a provider (Beehiiv, ConvertKit, Mailchimp...),
         paste its form URL into "signup.action" in this site's site.json, then rebuild. -->
    <form class="signup-form" id="signup-form" data-action="${esc(s.action)}" data-pending="${esc(s.pendingMessage)}" novalidate>
      <label class="sr" for="signup-email">Email address</label>
      <input id="signup-email" name="email" type="email" inputmode="email" autocomplete="email" placeholder="${esc(s.placeholder)}" required>
      <button type="submit">${esc(s.button)}</button>
    </form>
    <p class="signup-msg" id="signup-msg" role="status" aria-live="polite"></p>
  </div>
</div></div></section>`;
}

function footer(site, year, base = "") {
  const f = site.footer;
  const links = site.nav.concat(site.footerLinks || []);
  return `<footer class="foot"><div class="wrap">
  <div class="brand">${mark(site)}<b>${esc(site.name)}</b></div>
  <p>${esc(f.disclosure)} ${esc(f.disclaimer)}</p>
  ${f.fda ? `<p>${esc(f.fda)}</p>` : ""}
  <div class="foot-links">${links.map(n => `<a href="${esc(n.href[0] === "#" ? base + n.href : n.href)}">${esc(n.label)}</a>`).join("")}</div>
  <div class="foot-bottom"><span>© ${year} ${esc(site.name)}</span><span>${esc(f.tagline)}</span></div>
</div></footer>`;
}

module.exports = { ICONS, esc, ico, slug, linkLabel, header, hero, startHere, chipbar, catalog, doctorBox, sourcesPage, about, signup, footer };
