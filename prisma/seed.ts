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
    name: "Brooklyn Grow Consulting",
    color: "#22c55e",
    status: "launching",
    description:
      "Home cannabis grow coaching for NY adults 21+ — legal home cultivation under the MRTA.",
    sortOrder: 13,
    notes: `# Brooklyn Grow Consulting — playbook

## Origin
Grew **5 Laughing Buddha plants to 6 ft** this season. People started asking how — that demand is the business.

## The offer (draft)
- **Starter session** — help someone set up a legal home grow (space, light, soil, seeds/clones) from zero.
- **Grow-along coaching** — check-ins across a full cycle: veg → flower → harvest → cure.
- **Room build** — tent/light/airflow spec + shopping list for their space.

## NY legal frame (adults 21+, MRTA)
- Up to **3 mature + 3 immature plants per adult**; **max 6 mature + 6 immature per household**.
- Consulting/coaching on someone's *own* legal home grow — no sales/distribution of product.
- TODO: confirm current OCM home-grow rules before publishing any material.

## My method (fill in — the step-by-step you ran)
1. Genetics / germination —
2. Veg (light, medium, feeding) —
3. Training to hit 6 ft —
4. Flip to flower —
5. Harvest —
6. Dry & cure —
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
      { businessId: bySlug["brooklyn-weed-consulting"], title: "Write up my Laughing Buddha grow as a step-by-step SOP", priority: "P1", status: "IN_PROGRESS", dueDate: daysFromNow(3) },
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
