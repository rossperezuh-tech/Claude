#!/usr/bin/env node
/* Makes the social share image (og.png) and phone home-screen icon
   (apple-touch-icon.png) for each site, from the colors in site.json.
   Only needed when a site's name or colors change:  node tools/make-images.js
   Requires Playwright (a dev tool; the normal build does not need it). */
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");
const SITES = path.join(__dirname, "..", "sites");

(async () => {
  const browser = await chromium.launch();
  for (const id of fs.readdirSync(SITES)) {
    const f = path.join(SITES, id, "site.json");
    if (!fs.existsSync(f)) continue;
    const site = JSON.parse(fs.readFileSync(f, "utf8"));
    const t = site.theme;
    const out = path.join(SITES, id, "static");
    fs.mkdirSync(out, { recursive: true });
    const mark = size => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${t.brand}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${site.mark}</svg>`;
    const fonts = `<link rel="stylesheet" href="${t.fontUrl}">`;

    const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
    await page.setContent(`<!DOCTYPE html><html><head>${fonts}<style>
      *{margin:0;box-sizing:border-box}
      body{width:1200px;height:630px;background:${t.brand};color:#fff;font-family:${t.fontBody};padding:72px 80px;display:flex;flex-direction:column;justify-content:space-between;position:relative;overflow:hidden}
      body:before{content:"";position:absolute;right:-180px;top:-220px;width:760px;height:760px;border-radius:50%;background:radial-gradient(circle,${t.accent}55,transparent 68%)}
      .b{display:flex;align-items:center;gap:20px;font:700 34px ${t.fontDisplay};position:relative}
      .m{width:68px;height:68px;border-radius:20px;background:${t.accent};display:grid;place-items:center}
      h1{font:800 96px/1 ${t.fontDisplay};letter-spacing:-.035em;max-width:13ch;position:relative}
      h1 em{font-style:normal;color:${t.accent}}
      p{font-size:30px;color:rgba(255,255,255,.78);position:relative}
    </style></head><body>
      <div class="b"><span class="m">${mark(38)}</span>${site.name}</div>
      <h1>${site.hero.title}</h1>
      <p>${site.hero.eyebrow}</p>
    </body></html>`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(out, "og.png") });
    await page.close();

    const icon = await browser.newPage({ viewport: { width: 180, height: 180 } });
    await icon.setContent(`<!DOCTYPE html><html><body style="margin:0;width:180px;height:180px;background:${t.brand};display:grid;place-items:center">
      <div style="width:120px;height:120px;border-radius:36px;background:${t.accent};display:grid;place-items:center">${mark(70)}</div></body></html>`);
    await icon.screenshot({ path: path.join(out, "apple-touch-icon.png") });
    await icon.close();
    console.log("✓ images for", site.name);
  }
  await browser.close();
})();
