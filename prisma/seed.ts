import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function daysFromNow(n: number, hour = 9): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(hour, 0, 0, 0);
  return d;
}

const businesses = [
  {
    slug: "brooklyn-tea-cigs",
    name: "Brooklyn Tea Cigs",
    color: "#34d399",
    status: "active",
    description: "Herbal tea cigarettes — consumer product (co-founders: Anna, Paulina).",
    sortOrder: 1,
  },
  {
    slug: "penthouse-yoga",
    name: "Penthouse Yoga",
    color: "#f472b6",
    status: "active",
    description: "Rooftop studio at 231 Norman Ave, Greenpoint. Launched July 2026.",
    sortOrder: 2,
  },
  {
    slug: "clean-plate-nyc",
    name: "Clean Plate NYC",
    color: "#a3e635",
    status: "active",
    description: "Organic meal delivery in glass containers.",
    sortOrder: 3,
  },
  {
    slug: "brooklyn-vintage-watches",
    name: "Brooklyn Vintage Watches",
    color: "#fbbf24",
    status: "back-burner",
    description: "Two-tone Rolex + lab diamond configurator.",
    sortOrder: 4,
  },
  {
    slug: "green-shoots-studio",
    name: "Green Shoots Studio",
    color: "#4ade80",
    status: "active",
    description: "Content production for wellness brands.",
    sortOrder: 5,
  },
  {
    slug: "nativos",
    name: "Nativos",
    color: "#fb923c",
    status: "back-burner",
    description: "Organic cotton clothing.",
    sortOrder: 6,
  },
  {
    slug: "vesta-nexus-capital",
    name: "Vesta / Nexus Capital",
    color: "#818cf8",
    status: "launching",
    description: "CRE tokenization platform (Reg D 506(c)).",
    sortOrder: 7,
  },
  {
    slug: "cre-direct-buying",
    name: "CRE Direct Buying",
    color: "#38bdf8",
    status: "active",
    description:
      "sellyourwarehousedirect.com + CommercialCashOffer — lead gen + acquisitions (incl. 6416 Conley St, Houston).",
    sortOrder: 8,
  },
  {
    slug: "steadyhand-ai",
    name: "Steadyhand AI Consulting",
    color: "#2dd4bf",
    status: "active",
    description: "AI consulting for established businesses.",
    sortOrder: 9,
  },
  {
    slug: "prompt-sherpa",
    name: "The Prompt Sherpa",
    color: "#c084fc",
    status: "launching",
    description: "Claude Code consulting for startup creators.",
    sortOrder: 10,
  },
  {
    slug: "all-in-one-health",
    name: "All In One Health Shop",
    color: "#f87171",
    status: "back-burner",
    description: "Product site for health goods.",
    sortOrder: 11,
  },
  {
    slug: "brooklyn-tiny-farm",
    name: "Brooklyn Tiny Farm",
    color: "#a8a29e",
    status: "active",
    description: "Microgreens, direct to consumer.",
    sortOrder: 12,
  },
  {
    slug: "brooklyn-weed-consulting",
    name: "Laughing Buddha Grow Co.",
    color: "#22c55e",
    status: "launching",
    description:
      "Brooklyn home-grow coaching — get NY adults 21+ growing their own, legally, under the MRTA.",
    sortOrder: 13,
    notes: `# Laughing Buddha Grow Co. — playbook

## Origin
Grew **5 Laughing Buddha plants to 6 ft** this season. People started asking how — that demand is the business.

## Packages & pricing (draft)

**1. Starter Session — $199**
One 90-min consult (video or in-person in Brooklyn). Assess their space, pick a setup, and send them out the door with a light/medium/genetics plan + a shopping list they can order same-day. Best for the "I want to grow but don't know where to start" person.

**2. Grow-Along Coaching — $900 for a full cycle** (or $199/mo)
Soup-to-nuts coaching across one full grow (~4–5 months): check-ins at each stage (germ → veg → flip → flower → harvest → cure), text support between calls for "is this normal?" photos, and troubleshooting (nutrients, pests, light burn). The flagship — this is what turns someone into a grower.

**3. Room Build — $500 + equipment cost**
Hands-on: I spec and help set up the tent, light, and airflow in their space so day one is right. Equipment billed at cost (they buy). Add Grow-Along for $700 (save $200).

**Add-ons**
- Harvest & Cure day (in-person, dial in drying + jars) — $250
- One-off "rescue" call (something's going wrong) — $75

*Positioning: coaching on the client's own legal home grow. No product sales, no distribution.*
*TODO: sanity-check pricing against 2–3 NYC grow shops / local consultants before publishing.*

## NY legal frame (adults 21+, MRTA)
- Up to **3 mature + 3 immature plants per adult**; **max 6 mature + 6 immature per household**.
- Consulting/coaching on someone's *own* legal home grow — no sales/distribution of product.
- TODO: confirm current OCM home-grow rules before publishing any material.

## Grow SOP — the Laughing Buddha method
*Client-facing playbook, drawn from my 5-plant grow. \`[ ]\` = specifics to lock in with real numbers before publishing.*

1. **Genetics & germination** — Start from **seed** (Laughing Buddha). Pop the seed until it cracks and shows a taproot, then into the soil. \`[ ]\` germination method (paper towel / water / straight to soil) + days to sprout.

2. **Medium & feeding** — Grow in **organic soil**. Living soil does most of the feeding, so it's the beginner-friendly path — less nutrient math, much harder to burn a plant. \`[ ]\` soil brand/mix, top-dress or teas?, watering rhythm.

3. **Veg & training — keep it SHORT** — Big lesson from last run: they hit **6 ft, which is too tall** for a home tent. Fix: **top the plants** early (cut the main stem above a node) so they bush out wide instead of shooting up, and keep topping/training to hold the height down. Goal is a manageable canopy, not a tree. \`[ ]\` light (type + wattage), veg weeks before flip, how many tops.

4. **Flip to flower — don't wait** — Switch the light to **12/12 before they get too tall**. Plants roughly double in early flower ("the stretch"), so flip while they're still short. \`[ ]\` confirm 12/12 + weeks in flower.

5. **Harvest — read the trichomes** — Go by the plant, not the calendar. Harvest when the **trichomes** (frosty resin heads) turn clear → cloudy → **amber**. Amber = peak ripeness. A cheap jeweler's loupe or USB scope is all you need.

6. **Dry & cure** — Dried with a **drying machine** (controlled temp/humidity — faster and more consistent than hang-drying). \`[ ]\` machine model + temp/time, then cure in glass jars (burp daily) to finish.
`,
  },
];

async function main() {
  console.log("Seeding Venture HQ…");

  for (const b of businesses) {
    await prisma.business.upsert({
      where: { slug: b.slug },
      update: b,
      create: b,
    });
  }

  const bySlug: Record<string, string> = {};
  for (const b of await prisma.business.findMany()) bySlug[b.slug] = b.id;

  // Wipe non-business data so re-seeding stays clean
  await prisma.task.deleteMany();
  await prisma.document.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.link.deleteMany();

  await prisma.task.createMany({
    data: [
      // Brooklyn Tea Cigs
      { businessId: bySlug["brooklyn-tea-cigs"], title: "Weekly batch production run", priority: "P1", status: "THIS_WEEK", dueDate: daysFromNow(0), recurrence: "WEEKLY" },
      { businessId: bySlug["brooklyn-tea-cigs"], title: "Review packaging proofs with Anna & Paulina", priority: "P2", status: "IN_PROGRESS", dueDate: daysFromNow(2) },
      { businessId: bySlug["brooklyn-tea-cigs"], title: "Order rolling papers restock", priority: "P3", status: "BACKLOG", dueDate: daysFromNow(9) },
      // Penthouse Yoga
      { businessId: bySlug["penthouse-yoga"], title: "Pay studio rent — 231 Norman Ave", priority: "P1", status: "THIS_WEEK", dueDate: daysFromNow(-1), recurrence: "MONTHLY" },
      { businessId: bySlug["penthouse-yoga"], title: "Confirm July class schedule with instructors", priority: "P1", status: "IN_PROGRESS", dueDate: daysFromNow(0) },
      { businessId: bySlug["penthouse-yoga"], title: "Print new waiver forms", priority: "P2", status: "BACKLOG", dueDate: daysFromNow(4) },
      // Clean Plate NYC
      { businessId: bySlug["clean-plate-nyc"], title: "Sunday meal prep + delivery routing", priority: "P1", status: "THIS_WEEK", dueDate: daysFromNow(3), recurrence: "WEEKLY" },
      { businessId: bySlug["clean-plate-nyc"], title: "Source backup glass container supplier", priority: "P2", status: "BACKLOG" },
      // Brooklyn Vintage Watches
      { businessId: bySlug["brooklyn-vintage-watches"], title: "Photograph new two-tone Datejust inventory", priority: "P3", status: "BACKLOG", dueDate: daysFromNow(12) },
      // Green Shoots Studio
      { businessId: bySlug["green-shoots-studio"], title: "Deliver reel edits to wellness client", priority: "P1", status: "IN_PROGRESS", dueDate: daysFromNow(1) },
      { businessId: bySlug["green-shoots-studio"], title: "Send Q3 retainer proposal", priority: "P2", status: "THIS_WEEK", dueDate: daysFromNow(5) },
      // Nativos
      { businessId: bySlug["nativos"], title: "Review organic cotton fabric samples", priority: "P3", status: "BACKLOG" },
      // Vesta / Nexus
      { businessId: bySlug["vesta-nexus-capital"], title: "File Form D amendment with securities attorney", priority: "P1", status: "THIS_WEEK", dueDate: daysFromNow(1) },
      { businessId: bySlug["vesta-nexus-capital"], title: "Investor deck v3 — tokenization economics slide", priority: "P2", status: "IN_PROGRESS", dueDate: daysFromNow(6) },
      // CRE Direct Buying
      { businessId: bySlug["cre-direct-buying"], title: "Follow up: 6416 Conley St title company", priority: "P1", status: "IN_PROGRESS", dueDate: daysFromNow(0) },
      { businessId: bySlug["cre-direct-buying"], title: "Review week's warehouse seller leads", priority: "P2", status: "THIS_WEEK", dueDate: daysFromNow(2), recurrence: "WEEKLY" },
      { businessId: bySlug["cre-direct-buying"], title: "Renew CommercialCashOffer ad campaign", priority: "P2", status: "BACKLOG", dueDate: daysFromNow(8) },
      // Steadyhand
      { businessId: bySlug["steadyhand-ai"], title: "Client discovery call prep — logistics firm", priority: "P1", status: "THIS_WEEK", dueDate: daysFromNow(1) },
      // Prompt Sherpa
      { businessId: bySlug["prompt-sherpa"], title: "Publish launch post + landing page copy", priority: "P2", status: "IN_PROGRESS", dueDate: daysFromNow(3) },
      // All In One Health
      { businessId: bySlug["all-in-one-health"], title: "Audit product listings for dead links", priority: "P3", status: "BACKLOG" },
      // Tiny Farm
      { businessId: bySlug["brooklyn-tiny-farm"], title: "Seed new microgreen trays", priority: "P2", status: "THIS_WEEK", dueDate: daysFromNow(1), recurrence: "WEEKLY" },
      { businessId: bySlug["brooklyn-tiny-farm"], title: "Deliver to restaurant accounts", priority: "P1", status: "THIS_WEEK", dueDate: daysFromNow(2), recurrence: "WEEKLY" },
      // Brooklyn Grow Consulting
      { businessId: bySlug["brooklyn-weed-consulting"], title: "Confirm current NY OCM home-grow rules (plant counts, adults 21+)", priority: "P1", status: "THIS_WEEK", dueDate: daysFromNow(1) },
      { businessId: bySlug["brooklyn-weed-consulting"], title: "Write up my Laughing Buddha grow as a step-by-step SOP", priority: "P1", status: "DONE", completedAt: daysFromNow(0) },
      { businessId: bySlug["brooklyn-weed-consulting"], title: "Fill in SOP specifics (light wattage, veg weeks, feed, dry machine settings)", priority: "P2", status: "THIS_WEEK", dueDate: daysFromNow(5) },
      { businessId: bySlug["brooklyn-weed-consulting"], title: "Define packages + pricing (starter session / grow-along / room build)", priority: "P2", status: "THIS_WEEK", dueDate: daysFromNow(4) },
      { businessId: bySlug["brooklyn-weed-consulting"], title: "Build tent + light shopping-list template for client rooms", priority: "P2", status: "BACKLOG", dueDate: daysFromNow(7) },
      { businessId: bySlug["brooklyn-weed-consulting"], title: "Landing page + intake form for consult bookings", priority: "P2", status: "BACKLOG", dueDate: daysFromNow(10) },
      { businessId: bySlug["brooklyn-weed-consulting"], title: "Photograph the 6ft plants for before/after portfolio", priority: "P3", status: "BACKLOG" },
      // A couple of done items so the board looks lived-in
      { businessId: bySlug["penthouse-yoga"], title: "Launch day open house", priority: "P1", status: "DONE", completedAt: daysFromNow(-2) },
      { businessId: bySlug["brooklyn-tea-cigs"], title: "Register trademark application", priority: "P2", status: "DONE", completedAt: daysFromNow(-5) },
    ],
  });

  await prisma.document.createMany({
    data: [
      { businessId: bySlug["vesta-nexus-capital"], title: "Reg D 506(c) PPM — final", category: "compliance", url: "https://drive.google.com/vesta/ppm-final", notes: "Signed by counsel 06/2026" },
      { businessId: bySlug["vesta-nexus-capital"], title: "Form D filing receipt", category: "compliance", url: "https://drive.google.com/vesta/form-d", notes: "" },
      { businessId: bySlug["penthouse-yoga"], title: "Liability waiver template", category: "legal", url: "https://drive.google.com/py/waiver", notes: "Print copies kept at front desk" },
      { businessId: bySlug["penthouse-yoga"], title: "Studio insurance policy", category: "compliance", url: "https://drive.google.com/py/insurance", notes: "Renews annually in June" },
      { businessId: bySlug["penthouse-yoga"], title: "Lease — 231 Norman Ave", category: "legal", url: "https://drive.google.com/py/lease", notes: "" },
      { businessId: bySlug["brooklyn-tea-cigs"], title: "Packaging dieline v4", category: "brand", url: "https://drive.google.com/btc/dieline-v4", notes: "Latest from printer" },
      { businessId: bySlug["brooklyn-tea-cigs"], title: "Ingredient supplier COAs", category: "compliance", url: "https://drive.google.com/btc/coas", notes: "" },
      { businessId: bySlug["cre-direct-buying"], title: "6416 Conley St — title commitment", category: "legal", url: "https://drive.google.com/cre/conley-title", notes: "Waiting on curative items" },
      { businessId: bySlug["cre-direct-buying"], title: "6416 Conley St — purchase agreement", category: "legal", url: "https://drive.google.com/cre/conley-psa", notes: "" },
      { businessId: bySlug["clean-plate-nyc"], title: "DOH food handling permit", category: "compliance", url: "https://drive.google.com/cp/doh-permit", notes: "" },
      { businessId: bySlug["green-shoots-studio"], title: "Client services agreement template", category: "legal", url: "https://drive.google.com/gs/msa", notes: "" },
      { businessId: bySlug["steadyhand-ai"], title: "Consulting engagement letter template", category: "legal", url: "https://drive.google.com/sh/engagement", notes: "" },
      { businessId: bySlug["brooklyn-tiny-farm"], title: "Restaurant account price sheet", category: "operations", url: "https://drive.google.com/btf/prices", notes: "Update quarterly" },
      { businessId: bySlug["brooklyn-weed-consulting"], title: "NY OCM adult-use home cultivation guidance", category: "compliance", url: "https://cannabis.ny.gov/adult-use-cannabis", notes: "Confirm current plant limits before publishing anything" },
      { businessId: bySlug["brooklyn-weed-consulting"], title: "Laughing Buddha grow SOP (veg→flower→cure)", category: "operations", url: "https://drive.google.com/bgc/grow-sop", notes: "My method from the 6ft grow — client-facing playbook" },
      { businessId: bySlug["brooklyn-weed-consulting"], title: "Client consulting agreement template", category: "legal", url: "https://drive.google.com/bgc/agreement", notes: "Coaching-only; no product sales/distribution" },
      { businessId: bySlug["brooklyn-weed-consulting"], title: "Packages & pricing (draft)", category: "operations", url: "https://drive.google.com/bgc/pricing", notes: "Starter $199 / Grow-Along $900 / Room Build $500+equip — see scratchpad" },
    ],
  });

  await prisma.contact.createMany({
    data: [
      { businessId: bySlug["brooklyn-tea-cigs"], name: "Anna", role: "Co-founder", email: "anna@brooklynteacigs.com", notes: "Handles production" },
      { businessId: bySlug["brooklyn-tea-cigs"], name: "Paulina", role: "Co-founder", email: "paulina@brooklynteacigs.com", notes: "Handles brand + retail" },
      { businessId: bySlug["vesta-nexus-capital"], name: "Securities attorney", role: "Counsel — Reg D", email: "counsel@lawfirm.com", notes: "Form D + PPM work" },
      { businessId: bySlug["cre-direct-buying"], name: "Houston title officer", role: "Title company", phone: "713-555-0134", notes: "6416 Conley St file" },
      { businessId: bySlug["penthouse-yoga"], name: "Lead instructor", role: "Instructor", phone: "917-555-0182", notes: "Owns the weekend schedule" },
      { businessId: bySlug["clean-plate-nyc"], name: "Glass container supplier", role: "Supplier", email: "orders@glasspack.com", notes: "2-week lead time" },
      { businessId: bySlug["brooklyn-weed-consulting"], name: "Local hydro/grow shop", role: "Supplier — tents, lights, medium", notes: "Client shopping-list fulfillment" },
    ],
  });

  await prisma.link.createMany({
    data: [
      { businessId: bySlug["cre-direct-buying"], label: "sellyourwarehousedirect.com", url: "https://sellyourwarehousedirect.com" },
      { businessId: bySlug["cre-direct-buying"], label: "CommercialCashOffer", url: "https://commercialcashoffer.com" },
      { businessId: bySlug["penthouse-yoga"], label: "Booking page", url: "https://penthouseyoga.example.com" },
      { businessId: bySlug["brooklyn-tea-cigs"], label: "Shopify admin", url: "https://admin.shopify.com" },
      { businessId: bySlug["prompt-sherpa"], label: "Landing page draft", url: "https://promptsherpa.example.com" },
    ],
  });

  // v2 structural sample: one deal in the CRE pipeline
  await prisma.deal.deleteMany();
  await prisma.deal.create({
    data: {
      businessId: bySlug["cre-direct-buying"],
      name: "6416 Conley St",
      stage: "TITLE",
      address: "6416 Conley St, Houston, TX",
      notes: "Under contract; title curative in progress.",
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
