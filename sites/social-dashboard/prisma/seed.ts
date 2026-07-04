import { PrismaClient } from "@prisma/client";
import {
  addDays,
  addMonths,
  startOfMonth,
  subDays,
  subMonths,
} from "date-fns";
import { colorForIndex } from "../lib/constants";

const prisma = new PrismaClient();

const CLIENTS = [
  {
    name: "Sunroot Coffee Co.",
    slug: "sunroot-coffee",
    status: "ACTIVE" as const,
    platforms: "INSTAGRAM,TIKTOK",
    contactName: "Mia Torres",
    contactEmail: "mia@sunrootcoffee.com",
    contactPhone: "(347) 555-0142",
    monthlyRetainer: 1200,
    monthsActive: 8,
  },
  {
    name: "Marlowe & Finch Law",
    slug: "marlowe-finch-law",
    status: "ACTIVE" as const,
    platforms: "LINKEDIN,FACEBOOK",
    contactName: "David Finch",
    contactEmail: "david@marlowefinch.com",
    contactPhone: "(212) 555-0198",
    monthlyRetainer: 2200,
    monthsActive: 14,
  },
  {
    name: "The Bright Bark Dog Co.",
    slug: "bright-bark-dog-co",
    status: "ACTIVE" as const,
    platforms: "INSTAGRAM,FACEBOOK,TIKTOK",
    contactName: "Priya Anand",
    contactEmail: "priya@brightbark.com",
    contactPhone: "(718) 555-0113",
    monthlyRetainer: 950,
    monthsActive: 5,
  },
  {
    name: "Halo Skin Studio",
    slug: "halo-skin-studio",
    status: "ACTIVE" as const,
    platforms: "INSTAGRAM,TIKTOK",
    contactName: "Renee Cho",
    contactEmail: "renee@haloskinstudio.com",
    contactPhone: "(646) 555-0177",
    monthlyRetainer: 1800,
    monthsActive: 11,
  },
  {
    name: "Ember Fitness Loft",
    slug: "ember-fitness-loft",
    status: "ACTIVE" as const,
    platforms: "INSTAGRAM,TIKTOK,YOUTUBE",
    contactName: "Jordan Blake",
    contactEmail: "jordan@emberfitnessloft.com",
    contactPhone: "(917) 555-0164",
    monthlyRetainer: 1500,
    monthsActive: 6,
  },
  {
    name: "Nolan Realty Group",
    slug: "nolan-realty-group",
    status: "PAUSED" as const,
    platforms: "INSTAGRAM,FACEBOOK,LINKEDIN",
    contactName: "Carla Nolan",
    contactEmail: "carla@nolanrealtygroup.com",
    contactPhone: "(203) 555-0129",
    monthlyRetainer: 1600,
    monthsActive: 9,
  },
  {
    name: "Petal & Stone Jewelry",
    slug: "petal-stone-jewelry",
    status: "ACTIVE" as const,
    platforms: "INSTAGRAM,PINTEREST",
    contactName: "Ines Moreau",
    contactEmail: "ines@petalandstone.com",
    contactPhone: "(929) 555-0155",
    monthlyRetainer: 1100,
    monthsActive: 4,
  },
  {
    name: "Fielder's Kitchen",
    slug: "fielders-kitchen",
    status: "ONBOARDING" as const,
    platforms: "INSTAGRAM,FACEBOOK",
    contactName: "Tom Fielder",
    contactEmail: "tom@fielderskitchen.com",
    contactPhone: "(631) 555-0186",
    monthlyRetainer: 1000,
    monthsActive: 0,
  },
];

const CAPTION_BANK = [
  "Behind-the-scenes reel — how it's made",
  "Customer spotlight + testimonial quote card",
  "New drop announcement teaser",
  "Weekly tip / how-to carousel",
  "Staff pick of the week",
  "UGC repost with credit",
  "Before/after transformation post",
  "Limited-time offer countdown",
  "Meet the team reel",
  "FAQ answered in a carousel",
];

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

async function main() {
  await prisma.clientTask.deleteMany();
  await prisma.performanceMetric.deleteMany();
  await prisma.contentPost.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.contractTemplate.deleteMany();
  await prisma.client.deleteMany();

  const today = new Date();
  let invoiceCounter = 1;

  for (let i = 0; i < CLIENTS.length; i++) {
    const c = CLIENTS[i];
    const startDate = subMonths(today, c.monthsActive);

    const client = await prisma.client.create({
      data: {
        name: c.name,
        slug: c.slug,
        color: colorForIndex(i),
        status: c.status,
        platforms: c.platforms,
        contactName: c.contactName,
        contactEmail: c.contactEmail,
        contactPhone: c.contactPhone,
        monthlyRetainer: c.monthlyRetainer,
        startDate,
        notes:
          c.status === "ONBOARDING"
            ? "New client — kickoff call done, waiting on brand assets (logo files, brand guide) before first content batch.\n\nGoals: build local awareness, drive weekend reservations."
            : `Voice: ${
                i % 2 === 0 ? "warm, casual, a little playful" : "polished, confident, informative"
              }.\nPosting cadence: ${3 + (i % 3)}x/week.\nAlways tag location in captions.`,
      },
    });

    // --- Contract ---
    const contractEnd =
      i === 2
        ? addDays(today, 12) // renewal due soon — Bright Bark
        : addMonths(startDate, 12);
    await prisma.contract.create({
      data: {
        clientId: client.id,
        title: `${client.name} — Monthly Retainer Agreement`,
        type: "RETAINER",
        status: c.status === "ONBOARDING" ? "SENT" : "SIGNED",
        startDate,
        endDate: contractEnd,
        autoRenew: i % 2 === 0,
        value: c.monthlyRetainer * 12,
        content: `SOCIAL MEDIA MANAGEMENT AGREEMENT\n\nClient: ${client.name}\nContact: ${c.contactName}\nStart date: ${startDate.toDateString()}\nTerm: 12 months, auto-renewing unless cancelled with 30 days notice.\nMonthly retainer: $${c.monthlyRetainer}/mo, due on the 1st.\nScope: content calendar, ${c.platforms.split(",").length} platform(s), monthly performance report.\n`,
        sentAt: subDays(startDate, 3),
        signedAt: c.status === "ONBOARDING" ? null : startDate,
      },
    });

    // --- Invoices: last 3 months + current ---
    for (let m = 3; m >= 0; m--) {
      const period = startOfMonth(subMonths(today, m));
      if (period < startOfMonth(startDate)) continue;
      const due = addDays(period, 5);
      let status: "PAID" | "SENT" | "OVERDUE" | "DRAFT";
      if (m === 0) status = i === 4 ? "OVERDUE" : "SENT";
      else status = "PAID";
      if (c.status === "ONBOARDING") status = "DRAFT";

      await prisma.invoice.create({
        data: {
          clientId: client.id,
          number: `INV-${period.getFullYear()}${String(
            period.getMonth() + 1
          ).padStart(2, "0")}-${String(invoiceCounter++).padStart(3, "0")}`,
          periodLabel: period.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          }),
          amount: c.monthlyRetainer,
          status,
          issueDate: period,
          dueDate: due,
          paidDate: status === "PAID" ? addDays(due, -2) : null,
        },
      });
    }

    // --- Content posts: 4 past (posted), a few this/next week, one overdue idea ---
    const platforms = c.platforms.split(",");
    for (let p = -6; p <= 8; p++) {
      const day = addDays(today, p);
      if (p % 2 !== 0) continue; // roughly every other day
      const platform = pick(platforms, p + 6) as any;
      let status: "POSTED" | "SCHEDULED" | "DRAFTED" | "IDEA";
      if (p < 0) status = "POSTED";
      else if (p === 0) status = i === 5 ? "IDEA" : "SCHEDULED"; // one overdue for Nolan (paused)
      else if (p <= 3) status = "SCHEDULED";
      else status = pick(["DRAFTED", "IDEA"], p) as any;

      await prisma.contentPost.create({
        data: {
          clientId: client.id,
          platform,
          caption: pick(CAPTION_BANK, p + i),
          status,
          scheduledDate: day,
          postedAt: status === "POSTED" ? day : null,
        },
      });
    }

    // --- Performance metrics: monthly snapshot per platform, last 4 months ---
    for (let pIdx = 0; pIdx < platforms.length; pIdx++) {
      const platform = platforms[pIdx];
      let followers = 600 + i * 350 + pIdx * 480;
      for (let m = 3; m >= 0; m--) {
        const date = startOfMonth(subMonths(today, m));
        followers += 30 + i * 9 + pIdx * 14;
        await prisma.performanceMetric.create({
          data: {
            clientId: client.id,
            platform: platform as any,
            date,
            followers,
            engagementRate:
              Math.round((1.8 + ((i + pIdx) % 4) * 0.6 + m * 0.1) * 100) / 100,
            reach: followers * (5 + ((i + pIdx) % 4)),
            impressions: followers * (8 + ((i + pIdx) % 5)),
          },
        });
      }
    }

    // --- Tasks ---
    const engagementTasks = [
      "Reply to unanswered DMs / comments",
      "Follow up on last week's UGC reposts",
      "Respond to review on Google / Yelp",
      "Approve comment-reply templates for the month",
    ];
    const taskSets: Array<[string, "TODO" | "IN_PROGRESS" | "DONE", "P1" | "P2" | "P3", number | null]> = [
      c.status === "ONBOARDING"
        ? ["Collect brand assets (logo, fonts, brand guide)", "IN_PROGRESS", "P1", 2]
        : ["Send next month's content calendar for approval", "TODO", "P2", 5],
      [pick(engagementTasks, i), "TODO", "P2", 1 + (i % 3)],
      i % 3 === 0
        ? ["Book photo/video shoot for next batch", "TODO", "P1", 9]
        : ["Review last month's performance report together", "DONE", "P3", null],
    ];
    for (const [title, status, priority, due] of taskSets) {
      await prisma.clientTask.create({
        data: {
          clientId: client.id,
          title,
          status,
          priority,
          dueDate: due != null ? addDays(today, due) : null,
        },
      });
    }
  }

  await prisma.contractTemplate.createMany({
    data: [
      {
        name: "Monthly Retainer Agreement",
        type: "RETAINER",
        body: `SOCIAL MEDIA MANAGEMENT AGREEMENT

Client: {{clientName}}
Contact: {{contactName}}
Effective date: {{startDate}}
Term: 12 months, auto-renewing unless cancelled with 30 days written notice.

Scope of work:
- Content calendar planning and execution across: {{platforms}}
- {{postsPerWeek}} posts per week per platform
- Monthly performance report and strategy check-in call

Fees:
- Monthly retainer: {{retainer}}/month, due on the 1st of each month
- Late payments after 10 days incur a 5% fee

Termination:
- Either party may terminate with 30 days written notice.

Signed:
_____________________________          _____________________________
{{clientName}}                          Agency Representative
Date: ______________                    Date: ______________
`,
      },
      {
        name: "One-Time Project Agreement",
        type: "ONE_TIME",
        body: `PROJECT AGREEMENT

Client: {{clientName}}
Contact: {{contactName}}
Project: {{projectName}}
Delivery date: {{dueDate}}

Scope of work:
{{scopeDescription}}

Fee: {{projectFee}}, due 50% upfront and 50% on delivery.

Signed:
_____________________________          _____________________________
{{clientName}}                          Agency Representative
Date: ______________                    Date: ______________
`,
      },
    ],
  });

  console.log(`Seeded ${CLIENTS.length} clients with contracts, invoices, content, metrics, and tasks.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
