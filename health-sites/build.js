#!/usr/bin/env node
/* Builds every site in /sites into its own /dist folder.

     node build.js              build all sites
     node build.js healthshop   build one site

   Each site folder needs site.json (name, colors, copy) and products.json.
   Anything in the site's /static folder is copied into /dist as is. */

const fs = require("fs");
const path = require("path");
const R = require("./template/render.js");

const ROOT = __dirname;
const TPL = path.join(ROOT, "template");
const SITES = path.join(ROOT, "sites");
const read = f => fs.readFileSync(f, "utf8");
const readJSON = f => JSON.parse(read(f));

const minCss = css => css
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\s+/g, " ")
  .replace(/\s*([{};,>])\s*/g, "$1")
  .replace(/;}/g, "}")
  .trim();

function themeCss(t) {
  return `:root{--brand:${t.brand};--brand2:${t.brand2};--accent:${t.accent};--accent-soft:${t.accentSoft};` +
    `--bg:${t.bg};--paper:${t.paper};--ink:${t.ink};--muted:${t.muted};--line:${t.line};` +
    `--font-display:${t.fontDisplay};--font-body:${t.fontBody}}`;
}

function favicon(site) {
  const t = site.theme;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="${t.brand}"/>` +
    `<g transform="translate(14 14) scale(1.5)" fill="none" stroke="${t.accent}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${site.mark}</g></svg>`;
}

function schema(site, products) {
  const catLabel = Object.fromEntries(site.categories.map(c => [c.id, c.label]));
  return [
    {
      "@context": "https://schema.org", "@type": "WebSite",
      name: site.name, url: site.url + "/", description: site.description
    },
    {
      "@context": "https://schema.org", "@type": "Organization",
      name: site.name, url: site.url + "/", logo: site.url + "/apple-touch-icon.png",
      address: { "@type": "PostalAddress", addressLocality: "Brooklyn", addressRegion: "NY", addressCountry: "US" }
    },
    {
      "@context": "https://schema.org", "@type": "ItemList",
      name: site.name + " products", numberOfItems: products.length,
      itemListElement: products.map((p, i) => ({
        "@type": "ListItem", position: i + 1,
        item: Object.assign({
          "@type": "Product", name: p.name, description: (p.what ? p.what + " " : "") + p.why.replace(/\*/g, ""),
          category: catLabel[p.cat], url: site.url + "/#" + p.id
        }, p.brand ? { brand: { "@type": "Brand", name: p.brand } } : {})
      }))
    }
  ];
}

function head(site, products, hasOg) {
  const e = R.esc, t = site.theme, url = site.url + "/";
  const og = site.url + "/og.png";
  return `<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(site.title)}</title>
<meta name="description" content="${e(site.description)}">
<link rel="canonical" href="${e(url)}">
<meta name="theme-color" content="${t.brand}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${e(site.name)}">
<meta property="og:title" content="${e(site.title)}">
<meta property="og:description" content="${e(site.description)}">
<meta property="og:url" content="${e(url)}">
${hasOg ? `<meta property="og:image" content="${e(og)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:image" content="${e(og)}">` : ""}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${e(site.title)}">
<meta name="twitter:description" content="${e(site.description)}">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${e(t.fontUrl)}" media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="${e(t.fontUrl)}"></noscript>
${schema(site, products).map(s => `<script type="application/ld+json">${JSON.stringify(s).replace(/</g, "\\u003c")}</script>`).join("\n")}`;
}

/* Collects every link that still needs the owner's attention. */
function linkReport(site, products) {
  const todo = [], review = [], names = [];
  products.forEach(p => {
    if (p.needsName) names.push(p);
    p.links.forEach(l => {
      if (l.todo) todo.push({ p, l, note: l.todo });
      else if (l.review) review.push({ p, l, note: l.review });
    });
  });
  const row = x => `- [ ] **${x.p.name}**${x.p.brand ? ` (${x.p.brand})` : ""}: ${x.note}\n  - Current link: ${x.l.url}`;
  let md = `## ${site.name}\n\nEdit links in \`sites/${site.id}/products.json\`, then run \`node build.js\`.\n\n`;
  if (site.urlIsPlaceholder) md += `- [ ] **Site address**: \`${site.url}\` is a placeholder. Put your real domain in \`sites/${site.id}/site.json\` ("url").\n\n`;
  if (names.length) md += `### Products that need their real name (${names.length})\n\n` +
    names.map(p => `- [ ] **${p.name}**: open ${p.links[0].url} and send the real product name.`).join("\n") + "\n\n";
  if (todo.length) md += `### Links that earn no commission yet (${todo.length})\n\n` + todo.map(row).join("\n") + "\n\n";
  if (review.length) md += `### Links worth swapping for plain Amazon links (${review.length})\n\n` + review.map(row).join("\n") + "\n\n";
  return { md, counts: { names: names.length, todo: todo.length, review: review.length } };
}

function copyDir(from, to) {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(to, { recursive: true });
  for (const f of fs.readdirSync(from)) {
    const a = path.join(from, f), b = path.join(to, f);
    fs.statSync(a).isDirectory() ? copyDir(a, b) : fs.copyFileSync(a, b);
  }
}

function buildSite(id) {
  const dir = path.join(SITES, id);
  const site = readJSON(path.join(dir, "site.json"));
  const products = readJSON(path.join(dir, "products.json"));
  site.id = id;
  site.url = site.url.replace(/\/$/, "");

  const known = new Set(site.categories.map(c => c.id));
  const ids = new Set();
  products.forEach(p => {
    if (!known.has(p.cat)) throw new Error(`${id}: "${p.name}" has unknown category "${p.cat}"`);
    if (!p.links || !p.links.length) throw new Error(`${id}: "${p.name}" has no link`);
    p.id = "p-" + R.slug((p.brand ? p.brand + " " : "") + p.name);
    if (ids.has(p.id)) throw new Error(`${id}: two products share the name "${p.name}"`);
    ids.add(p.id);
  });

  const dist = path.join(dir, "dist");
  fs.rmSync(dist, { recursive: true, force: true });
  fs.mkdirSync(dist, { recursive: true });
  copyDir(path.join(dir, "static"), dist);

  const year = new Date().getFullYear();
  const css = themeCss(site.theme) + minCss(read(path.join(TPL, "styles.css")));
  const body = [
    R.header(site), R.hero(site, products), R.startHere(site, products),
    R.chipbar(site, products), R.catalog(site, products),
    R.about(site), R.signup(site), R.footer(site, year)
  ].filter(Boolean).join("\n");

  const html = read(path.join(TPL, "layout.html"))
    .replace("{{head}}", () => head(site, products, fs.existsSync(path.join(dist, "og.png"))))
    .replace("{{css}}", () => css)
    .replace("{{body}}", () => body)
    .replace("{{js}}", () => read(path.join(TPL, "app.js")));

  fs.writeFileSync(path.join(dist, "index.html"), html);
  fs.writeFileSync(path.join(dist, "favicon.svg"), favicon(site));
  fs.writeFileSync(path.join(dist, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n`);
  const today = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(path.join(dist, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `  <url><loc>${site.url}/</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>\n</urlset>\n`);

  const report = linkReport(site, products);
  const kb = (Buffer.byteLength(html) / 1024).toFixed(1);
  console.log(`✓ ${site.name}: ${products.length} products, index.html ${kb} KB → sites/${id}/dist`);
  console.log(`  needs attention: ${report.counts.names} names, ${report.counts.todo} untagged links, ${report.counts.review} links to review`);
  return report;
}

const only = process.argv[2];
const ids = fs.readdirSync(SITES).filter(d => fs.existsSync(path.join(SITES, d, "site.json")) && (!only || d === only));
if (!ids.length) { console.error(only ? `No site named "${only}" in /sites` : "No sites found in /sites"); process.exit(1); }
const reports = ids.map(buildSite);

if (!only) {
  fs.writeFileSync(path.join(ROOT, "LINKS-TODO.md"),
    `# Links to replace\n\nThis file is rewritten every time you run \`node build.js\`. ` +
    `When a link is fixed in products.json (and its "todo" or "review" note removed), it drops off this list.\n\n` +
    reports.map(r => r.md).join("\n"));
  console.log("✓ LINKS-TODO.md updated");
}
