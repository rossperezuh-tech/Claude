// Generates Google Ads import files in ./ads from the same market data the site is built from.
// Run: node ads.mjs      Everything is created PAUSED so nothing spends until you switch it on.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as C } from './site.config.mjs';
import { metros } from './data/metros.mjs';
import { states } from './data/states.mjs';
import { types } from './data/types.mjs';

const OUT = join(dirname(fileURLToPath(import.meta.url)), 'ads');
const DAILY_BUDGET = 20; // placeholder per campaign, in dollars. Change before enabling.
const URL_SUFFIX = 'utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_term={keyword}';

const REGION = {
  Texas: ['TX'],
  Southeast: ['GA', 'FL', 'NC', 'SC', 'TN', 'AL', 'LA', 'MS', 'AR', 'KY'],
  Northeast: ['VA', 'MD', 'PA', 'NJ', 'NY', 'MA', 'CT', 'RI'],
  Midwest: ['IL', 'IN', 'OH', 'MI', 'WI', 'MN', 'MO', 'NE', 'IA', 'KS', 'OK'],
  West: ['CO', 'UT', 'AZ', 'NV', 'NM', 'ID', 'CA', 'WA', 'OR'],
};
const regionOf = (st) => Object.keys(REGION).find((r) => REGION[r].includes(st));

// Search terms people actually type for each metro. Default: the names in the metro's title.
const TERMS = {
  'rio-grande-valley-tx': ['mcallen', 'brownsville', 'rio grande valley'],
  'midland-odessa-tx': ['midland tx', 'odessa tx'],
  'miami-fl': ['miami', 'fort lauderdale', 'south florida'],
  'tampa-fl': ['tampa'],
  'lakeland-fl': ['lakeland', 'polk county'],
  'greensboro-nc': ['greensboro', 'winston salem'],
  'greenville-spartanburg-sc': ['greenville sc', 'spartanburg'],
  'northwest-arkansas-ar': ['northwest arkansas', 'bentonville'],
  'hampton-roads-va': ['norfolk', 'virginia beach', 'hampton roads'],
  'northern-virginia-dc': ['northern virginia', 'washington dc'],
  'lehigh-valley-pa': ['lehigh valley', 'allentown'],
  'central-pennsylvania-pa': ['harrisburg', 'central pa', 'york pa'],
  'scranton-wilkes-barre-pa': ['scranton', 'wilkes barre'],
  'northern-new-jersey': ['new jersey', 'nj', 'newark nj'],
  'new-york-ny': ['nyc', 'brooklyn', 'queens', 'long island'],
  'northwest-indiana-in': ['northwest indiana', 'gary indiana'],
  'cincinnati-oh': ['cincinnati', 'northern kentucky'],
  'cleveland-oh': ['cleveland', 'akron'],
  'inland-empire-ca': ['inland empire', 'ontario ca', 'riverside ca'],
  'bay-area-ca': ['bay area', 'oakland', 'san jose'],
  'stockton-ca': ['stockton', 'modesto'],
};
const termsFor = (m) =>
  TERMS[m.slug.replace('sell-warehouse-', '')] ||
  m.name.split(/–| & /).map((x) => x.replace(/^the /i, '').replace(/\./g, '').toLowerCase().trim());

const STEMS = ['sell warehouse', 'sell my warehouse', 'sell industrial building', 'sell industrial property', 'we buy warehouses', 'warehouse buyers', 'cash buyer industrial property'];

const NEGATIVES = [
  'for sale', 'for rent', 'for lease', 'rent', 'lease', 'rental', 'listings', 'warehouse sale', 'sample sale', 'clearance', 'outlet', 'liquidation', 'wholesale',
  'jobs', 'job', 'hiring', 'salary', 'career', 'careers', 'pallet', 'pallets', 'racking', 'racks', 'shelving', 'forklift', 'equipment',
  'storage units', 'near me storage', 'furniture', 'software', 'management system', 'amazon', 'costco',
  'house', 'houses', 'home', 'homes', 'apartment', 'residential', 'loan', 'mortgage', 'course', 'license', 'how to buy', 'buy a warehouse',
];

const title = (s) => s.replace(/\b[a-z]/g, (c) => c.toUpperCase()).replace(/\b(Tx|Sc|Pa|Nj|Ca|Dc|Nyc)\b/g, (x) => x.toUpperCase());
const fit = (max, ...options) => options.find((o) => o.length <= max);

const HEADLINES = ['Cash Offer in 24 Hours', 'Close in as Little as 14 Days', 'No Agents. No Commissions.', 'We Buy As-Is, Any Condition', 'Direct Industrial Buyer', 'Sell Your Warehouse Fast', 'All-Cash, No Financing Risk', 'Free, No-Obligation Offer', 'Vacant Building? We Buy It', 'Skip the Listing. Sell Direct'];
const DESCRIPTIONS = [
  'Direct cash buyer of warehouses & industrial buildings. Written offer within 24 hours.',
  'No agents, no commissions, no repairs. We buy as-is and close in as little as 14 days.',
  'Vacant, tenanted or needs work, we make an offer on your building as it sits today.',
  'Tell us about your property in 2 minutes. Free, confidential, no-obligation cash offer.',
];
for (const h of HEADLINES) if (h.length > 30) throw new Error(`Headline too long: ${h}`);
for (const d of DESCRIPTIONS) if (d.length > 90) throw new Error(`Description too long: ${d}`);

// ── build the account ────────────────────────────────────────────────────
const groups = []; // { campaign, adGroup, url, keywords[], localHeadlines[], path2 }
const camp = (name) => `Warehouse Sellers - ${name}`;

groups.push({ campaign: camp('National'), adGroup: 'General', url: `${C.siteUrl}/`, path2: 'cash-offer', localHeadlines: ['We Buy Warehouses for Cash', 'Buying in All 50 States'],
  keywords: [...STEMS, 'sell warehouse fast', 'sell warehouse for cash', 'sell my warehouse fast', 'cash offer for warehouse', 'sell industrial building fast', 'sell warehouse without realtor', 'sell warehouse as is', 'industrial property cash buyer'] });

const TYPE_KW = {
  'sell-warehouse-distribution-center': ['sell distribution center', 'sell my distribution center', 'distribution center buyers'],
  'sell-manufacturing-facility': ['sell manufacturing facility', 'sell manufacturing building', 'sell my factory building', 'manufacturing building buyers'],
  'sell-flex-light-industrial': ['sell flex industrial building', 'sell light industrial building', 'sell industrial park'],
  'sell-cold-storage-facility': ['sell cold storage facility', 'sell cold storage warehouse', 'cold storage warehouse buyers'],
  'sell-truck-terminal': ['sell truck terminal', 'sell truck yard', 'sell industrial outdoor storage', 'truck terminal buyers'],
  'sell-self-storage-facility': ['sell self storage facility', 'sell my self storage facility', 'self storage facility buyers', 'sell storage facility fast'],
  'sell-industrial-land': ['sell industrial land', 'sell industrial lot', 'industrial land buyers', 'sell industrial zoned land'],
  'sell-vacant-industrial-building': ['sell vacant warehouse', 'sell vacant industrial building', 'sell abandoned warehouse', 'sell distressed industrial property'],
};
for (const t of types) {
  groups.push({ campaign: camp('National'), adGroup: `Type - ${t.short}`, url: `${C.siteUrl}/${t.slug}`, path2: fit(15, t.short.toLowerCase().replace(/[^a-z]+/g, '-'), 'industrial'),
    localHeadlines: [fit(30, `We Buy ${t.name}`, `We Buy ${t.short}`), fit(30, `Sell Your ${t.short} Property`, `Sell ${t.short} Fast`)], keywords: TYPE_KW[t.slug] });
}
for (const s of states) {
  const n = s.name.toLowerCase();
  groups.push({ campaign: camp('States'), adGroup: s.name, url: `${C.siteUrl}/${s.slug}`, path2: fit(15, n.replace(/ /g, '-'), s.abbr.toLowerCase()),
    localHeadlines: [fit(30, `Sell Your ${s.name} Warehouse`, `Sell Warehouse in ${s.name}`, `${s.name} Warehouse Buyer`, 'Local Warehouse Cash Buyer'), fit(30, `We Buy Warehouses in ${s.name}`, `We Buy in ${s.name}`, `Buying in ${s.name}`, 'We Buy Warehouses for Cash')],
    keywords: STEMS.map((k) => `${k} ${n}`) });
}
for (const m of metros) {
  const terms = termsFor(m);
  const T = title(terms[0]);
  groups.push({ campaign: camp(regionOf(m.st)), adGroup: m.label, url: `${C.siteUrl}/${m.slug}`, path2: fit(15, terms[0].replace(/ /g, '-'), m.st.toLowerCase()),
    localHeadlines: [fit(30, `Sell Your ${T} Warehouse`, `Sell Warehouse in ${T}`, `${T} Warehouse Buyer`, 'Local Warehouse Cash Buyer'), fit(30, `We Buy Warehouses in ${T}`, `We Buy in ${T}`, `Buying in ${T}`, 'We Buy Warehouses for Cash')],
    keywords: terms.flatMap((t) => STEMS.map((k) => `${k} ${t}`)) });
}
for (const g of groups) {
  if (!g.path2 || g.localHeadlines.some((h) => !h)) throw new Error(`Ad text does not fit for ${g.adGroup}`);
  if (g.campaign.endsWith('undefined')) throw new Error(`No region for ${g.adGroup}`);
}

// ── write CSVs ───────────────────────────────────────────────────────────
const csv = (rows) => rows.map((r) => r.map((v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : v)).join(',')).join('\n') + '\n';
const campaigns = [...new Set(groups.map((g) => g.campaign))];
mkdirSync(OUT, { recursive: true });

writeFileSync(join(OUT, '1-campaigns.csv'), csv([
  ['Campaign', 'Campaign Type', 'Networks', 'Budget', 'Budget type', 'Bid Strategy Type', 'Location', 'Final URL suffix', 'Campaign Status'],
  ...campaigns.map((c) => [c, 'Search', 'Google search', DAILY_BUDGET, 'Daily', 'Maximize clicks', 'United States', URL_SUFFIX, 'Paused']),
]));
writeFileSync(join(OUT, '2-ad-groups.csv'), csv([
  ['Campaign', 'Ad Group', 'Ad Group Status'],
  ...groups.map((g) => [g.campaign, g.adGroup, 'Enabled']),
]));
writeFileSync(join(OUT, '3-keywords.csv'), csv([
  ['Campaign', 'Ad Group', 'Keyword', 'Criterion Type', 'Final URL'],
  ...groups.flatMap((g) => g.keywords.flatMap((k) => [[g.campaign, g.adGroup, k, 'Phrase', g.url], [g.campaign, g.adGroup, k, 'Exact', g.url]])),
]));
writeFileSync(join(OUT, '4-ads.csv'), csv([
  ['Campaign', 'Ad Group', 'Ad type', ...Array.from({ length: 12 }, (_, i) => `Headline ${i + 1}`), ...DESCRIPTIONS.map((_, i) => `Description ${i + 1}`), 'Path 1', 'Path 2', 'Final URL'],
  ...groups.map((g) => [g.campaign, g.adGroup, 'Responsive search ad', ...g.localHeadlines, ...HEADLINES, ...DESCRIPTIONS, 'sell-warehouse', g.path2, g.url]),
]));
writeFileSync(join(OUT, '5-negative-keywords.csv'), csv([
  ['Campaign', 'Keyword', 'Criterion Type'],
  ...campaigns.flatMap((c) => NEGATIVES.map((n) => [c, n, 'Campaign Negative Phrase'])),
]));

const kw = groups.reduce((n, g) => n + g.keywords.length * 2, 0);
console.log(`${campaigns.length} campaigns, ${groups.length} ad groups, ${kw} keywords, ${groups.length} ads, ${NEGATIVES.length} negatives per campaign → ads/`);
for (const c of campaigns) console.log(`  ${c}: ${groups.filter((g) => g.campaign === c).length} ad groups`);
