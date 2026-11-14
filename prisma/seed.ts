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

  // ---- CRE deal pipeline (sample data: sellers and figures are made up,
  // except 160 W Mallory, which uses the assumptions from RP's own model) ----
  await prisma.deal.deleteMany();
  const cre = bySlug["cre-direct-buying"];
  const uw = (o: object) => JSON.stringify(o);
  const vacant = (name: string, sf: number) => ({
    name, sf, status: "vacant", rentPsf: 0, escPct: 0, monthsRemaining: 0, recovery: "GROSS",
  });
  const log = (...rows: [string, string, number][]) => ({
    create: rows.map(([kind, body, daysAgo]) => ({ kind, body, createdAt: daysFromNow(-daysAgo) })),
  });

  const conley = await prisma.deal.create({
    data: {
      businessId: cre,
      name: "6416 Conley St",
      stage: "TITLE",
      address: "6416 Conley St",
      city: "Houston",
      state: "TX",
      propertyType: "warehouse",
      buildingSf: 18500,
      landAcres: 1.1,
      yearBuilt: 1978,
      source: "mail",
      strategy: "BUY_HOLD",
      sellerName: "Owner-operator (machine shop)",
      sellerPhone: "713-555-0171",
      motivation: "Retiring; wants a 24-month leaseback while winding down.",
      askingPrice: 1450000,
      offerPrice: 1360000,
      contractPrice: 1385000,
      nextAction: "Clear title curative items with title officer",
      nextActionDate: daysFromNow(0),
      closingDate: daysFromNow(21),
      stageChangedAt: daysFromNow(-9),
      createdAt: daysFromNow(-48),
      notes: "Under contract; title curative in progress.",
      underwriting: uw({
        buildingSf: 18500,
        rentRoll: [
          { name: "Seller leaseback", sf: 18500, status: "leased", rentPsf: 7.8, escPct: 3, monthsRemaining: 24, recovery: "NNN" },
        ],
        market: { rentPsf: 8.25, growthPct: 3, termYears: 5, downtimeMonths: 5, freeMonths: 1, tiPsf: 2.5, lcPct: 6, escPct: 3, recovery: "NNN", renewProbPct: 25 },
        expenses: [
          { name: "Real estate taxes", annual: 31200, grows: true, recoverable: true },
          { name: "Insurance", annual: 14800, grows: true, recoverable: true },
          { name: "Repairs & maintenance", annual: 6500, grows: true, recoverable: true },
        ],
        price: 1385000,
        capex: 45000,
        ltvPct: 65, ratePct: 7.1, amortYears: 25,
        holdYears: 5, exitCapPct: 8, sellCostPct: 3,
        targets: { yieldOnCostPct: 8.5, cashOnCashPct: 0, irrPct: 16, dscr: 1.25 },
      }),
      activity: log(
        ["SYSTEM", "Lead added", 48],
        ["CALL", "Owner called back from the second letter. Wants to stay 2 years.", 44],
        ["STAGE", "Lead → Underwriting", 43],
        ["OFFER", "Offer price set to $1,360,000 (target)", 36],
        ["STAGE", "Underwriting → Offer", 36],
        ["NOTE", "Countered at $1.40M; settled at $1.385M with leaseback at $7.80 NNN.", 20],
        ["STAGE", "Offer → Title", 9],
      ),
    },
  });
  await prisma.document.updateMany({
    where: { businessId: cre, title: { startsWith: "6416 Conley St" } },
    data: { dealId: conley.id },
  });

  await prisma.deal.create({
    data: {
      businessId: cre,
      name: "160 W Mallory Ave",
      stage: "OFFER",
      address: "160 W Mallory Ave",
      city: "Memphis",
      state: "TN",
      propertyType: "warehouse",
      buildingSf: 22100,
      source: "broker",
      strategy: "WHOLESALE",
      motivation: "Three vacant buildings on one lot; lease-up and resale play.",
      askingPrice: 650000,
      nextAction: "Follow up on LOI",
      nextActionDate: daysFromNow(2),
      stageChangedAt: daysFromNow(-12),
      createdAt: daysFromNow(-31),
      underwriting: uw({
        buildingSf: 22100,
        rentRoll: [vacant("Bldg A", 15700), vacant("Bldg B", 4000), vacant("Bldg C", 2400)],
        market: { rentPsf: 5.5, growthPct: 3, termYears: 5, downtimeMonths: 6, freeMonths: 1, tiPsf: 2, lcPct: 6, escPct: 3, recovery: "GROSS", renewProbPct: 65 },
        expenses: [
          { name: "Real estate taxes", annual: 24310, grows: true, recoverable: true },
          { name: "Insurance", annual: 15470, grows: true, recoverable: true },
          { name: "Repairs & maintenance", annual: 2250, grows: false, recoverable: true },
        ],
        expenseGrowthPct: 2, mgmtPct: 4, vacancyPct: 0, reservePsf: 0.15,
        otherIncomeMonthly: 2000, otherIncomeStartMonth: 7,
        price: 650000, closingCostPct: 2, ltvPct: 0,
        holdYears: 2, exitCapPct: 10.5, sellCostPct: 3,
        targets: { yieldOnCostPct: 12, cashOnCashPct: 0, irrPct: 20, dscr: 0 },
        buyerCapPct: 10.5, assignmentFee: 25000,
      }),
      activity: log(
        ["SYSTEM", "Lead added", 31],
        ["STAGE", "Lead → Underwriting", 28],
        ["NOTE", "Built lease-up and sale model; yard rent adds $2,000/month from month 7.", 25],
        ["STAGE", "Underwriting → Offer", 12],
      ),
    },
  });

  await prisma.deal.create({
    data: {
      businessId: cre,
      name: "7702 Wallisville Rd",
      stage: "UNDERWRITING",
      address: "7702 Wallisville Rd",
      city: "Houston",
      state: "TX",
      propertyType: "flex",
      buildingSf: 42000,
      landAcres: 2.6,
      yearBuilt: 1984,
      source: "website",
      sellerName: "D. Okafor (family partnership)",
      sellerPhone: "281-555-0142",
      sellerEmail: "seller@example.com",
      motivation: "Partners splitting up; want a clean sale without listing it.",
      askingPrice: 3400000,
      nextAction: "Get trailing-12 expenses and the three leases",
      nextActionDate: daysFromNow(1),
      stageChangedAt: daysFromNow(-3),
      createdAt: daysFromNow(-8),
      underwriting: uw({
        buildingSf: 42000,
        rentRoll: [
          { name: "HVAC distributor", sf: 18000, status: "leased", rentPsf: 8.4, escPct: 3, monthsRemaining: 38, recovery: "NNN" },
          { name: "Cabinet shop", sf: 12000, status: "leased", rentPsf: 7.2, escPct: 2.5, monthsRemaining: 9, recovery: "NNN" },
          { name: "Freight forwarder", sf: 7500, status: "leased", rentPsf: 9, escPct: 3, monthsRemaining: 52, recovery: "NNN" },
          vacant("Suite D", 4500),
        ],
        market: { rentPsf: 8.75, growthPct: 3, termYears: 5, downtimeMonths: 6, freeMonths: 2, tiPsf: 3, lcPct: 6, escPct: 3, recovery: "NNN", renewProbPct: 65 },
        expenses: [
          { name: "Real estate taxes", annual: 68500, grows: true, recoverable: true },
          { name: "Insurance", annual: 29400, grows: true, recoverable: true },
          { name: "Repairs & maintenance", annual: 21000, grows: true, recoverable: true },
        ],
        price: 3400000,
        capex: 120000,
        ltvPct: 65, ratePct: 7, amortYears: 25,
        holdYears: 5, exitCapPct: 7.75, sellCostPct: 3,
        targets: { yieldOnCostPct: 8.5, cashOnCashPct: 0, irrPct: 17, dscr: 1.25 },
      }),
      activity: log(
        ["SYSTEM", "Lead added from sellmywarehousedirect.com", 8],
        ["CALL", "30-minute call. Roof is 6 years old, two HVAC units need replacing.", 6],
        ["STAGE", "Lead → Underwriting", 3],
      ),
    },
  });

  await prisma.deal.create({
    data: {
      businessId: cre,
      name: "1120 Shaver St",
      stage: "LEAD",
      address: "1120 Shaver St",
      city: "Pasadena",
      state: "TX",
      propertyType: "warehouse",
      buildingSf: 12000,
      source: "website",
      sellerName: "M. Reyes",
      sellerPhone: "832-555-0119",
      motivation: "Inherited from her father; lives out of state.",
      nextAction: "First call — ask about condition and price expectation",
      nextActionDate: daysFromNow(0),
      createdAt: daysFromNow(-1),
      activity: log(["SYSTEM", "Lead added from sellmywarehousedirect.com", 1]),
    },
  });

  await prisma.deal.create({
    data: {
      businessId: cre,
      name: "905 N 8th St",
      stage: "LEAD",
      address: "905 N 8th St",
      city: "La Porte",
      state: "TX",
      propertyType: "manufacturing",
      buildingSf: 30000,
      landAcres: 3.2,
      source: "mail",
      sellerName: "Gulf Coast Fabrication (owner)",
      sellerPhone: "281-555-0188",
      motivation: "Behind on property taxes.",
      askingPrice: 2100000,
      nextAction: "Pull tax records and send follow-up letter",
      nextActionDate: daysFromNow(4),
      createdAt: daysFromNow(-5),
      activity: log(["SYSTEM", "Lead added", 5], ["CALL", "Left voicemail.", 3]),
    },
  });

  await prisma.deal.create({
    data: {
      businessId: cre,
      name: "2210 Center St",
      stage: "DEAD",
      address: "2210 Center St",
      city: "Deer Park",
      state: "TX",
      propertyType: "warehouse",
      buildingSf: 9600,
      source: "call",
      askingPrice: 1250000,
      lostReason: "Seller wanted full retail price; listed with a broker.",
      stageChangedAt: daysFromNow(-15),
      createdAt: daysFromNow(-40),
      activity: log(["SYSTEM", "Lead added", 40], ["STAGE", "Underwriting → Dead — Seller wanted full retail price; listed with a broker.", 15]),
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
