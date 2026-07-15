/**
 * Demo-account seeder. Creates (or refreshes) a fully fictional portfolio
 * under the Clerk user id in DEMO_CLERK_USER_ID, so prospects can click
 * around a lived-in workspace without ever touching real data.
 *
 * Usage:
 *   1. Create a demo login in Clerk (e.g. demo@yourdomain.com)
 *   2. Copy its user id from the Clerk dashboard (starts with "user_")
 *   3. DEMO_CLERK_USER_ID=user_xxx npm run db:seed-demo
 *
 * Re-running wipes and re-creates only the demo org's data.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function daysFromNow(n: number, hour = 9): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(hour, 0, 0, 0);
  return d;
}

async function main() {
  const clerkUserId = process.env.DEMO_CLERK_USER_ID ?? "demo-seed-user";
  console.log(`Seeding demo org for ${clerkUserId}…`);

  const org = await prisma.organization.upsert({
    where: { clerkUserId },
    update: { name: "Demo HQ" },
    create: { clerkUserId, name: "Demo HQ" },
  });

  // Fresh slate for the demo org only
  await prisma.business.deleteMany({ where: { organizationId: org.id } });

  const agency = await prisma.business.create({
    data: {
      organizationId: org.id,
      slug: "harbor-social",
      name: "Harbor Social",
      color: "#38bdf8",
      status: "active",
      description: "Boutique social media agency for food & wellness brands.",
      brandVoice:
        "Confident and warm, like a sharp friend who happens to run marketing. Short sentences. No corporate jargon, no hype words ('game-changer'). One emoji max per post.",
      sortOrder: 1,
    },
  });
  const candleCo = await prisma.business.create({
    data: {
      organizationId: org.id,
      slug: "emberline",
      name: "Emberline Candle Co.",
      color: "#fb923c",
      status: "active",
      description: "Small-batch soy candles, seasonal drops, sold DTC + 6 retail stockists.",
      brandVoice:
        "Cozy, sensory, a little poetic — describe scent and mood. Lowercase-friendly. Never salesy.",
      sortOrder: 2,
    },
  });
  const studio = await prisma.business.create({
    data: {
      organizationId: org.id,
      slug: "true-north-coaching",
      name: "True North Coaching",
      color: "#2dd4bf",
      status: "launching",
      description: "1:1 business coaching program launching this fall.",
      sortOrder: 3,
    },
  });

  await prisma.task.createMany({
    data: [
      // Harbor Social
      { businessId: agency.id, title: "Deliver June reels batch to GlowCo", priority: "P1", status: "IN_PROGRESS", dueDate: daysFromNow(1) },
      { businessId: agency.id, title: "Monthly strategy call — Fern & Fig Cafe", priority: "P2", status: "THIS_WEEK", dueDate: daysFromNow(3) },
      { businessId: agency.id, title: "Send Q3 renewal proposal to GlowCo", priority: "P1", status: "BACKLOG", dueDate: daysFromNow(6) },
      { businessId: agency.id, title: "Weekly content batching day", priority: "P2", status: "THIS_WEEK", dueDate: daysFromNow(2), recurrence: "WEEKLY" },
      { businessId: agency.id, title: "Onboard new video editor", priority: "P2", status: "DONE", completedAt: daysFromNow(-3) },
      // Emberline
      { businessId: candleCo.id, title: "Pour autumn-drop test batch", priority: "P1", status: "IN_PROGRESS", dueDate: daysFromNow(2) },
      { businessId: candleCo.id, title: "Order 500 amber jars", priority: "P1", status: "THIS_WEEK", dueDate: daysFromNow(4) },
      { businessId: candleCo.id, title: "Photograph fall collection", priority: "P2", status: "BACKLOG", dueDate: daysFromNow(10) },
      { businessId: candleCo.id, title: "Confirm holiday market booth", priority: "P3", status: "BACKLOG", dueDate: daysFromNow(20) },
      { businessId: candleCo.id, title: "Restock Maple & Main stockist", priority: "P2", status: "DONE", completedAt: daysFromNow(-2) },
      // True North
      { businessId: studio.id, title: "Finish coaching program curriculum outline", priority: "P1", status: "IN_PROGRESS", dueDate: daysFromNow(5) },
      { businessId: studio.id, title: "Set up waitlist landing page", priority: "P2", status: "BACKLOG", dueDate: daysFromNow(12) },
    ],
  });

  await prisma.contentPost.createMany({
    data: [
      { businessId: agency.id, title: "GlowCo: 5 skincare myths carousel", platform: "instagram", status: "SCHEDULED", scheduledFor: daysFromNow(1) },
      { businessId: agency.id, title: "Fern & Fig: latte art reel", platform: "instagram", status: "SCHEDULED", scheduledFor: daysFromNow(2) },
      { businessId: agency.id, title: "Agency BTS: batching day timelapse", platform: "tiktok", status: "DRAFTED" },
      { businessId: agency.id, title: "Client win breakdown (with GlowCo permission)", platform: "linkedin", status: "IDEA" },
      { businessId: candleCo.id, title: "Autumn drop teaser — first pour", platform: "instagram", status: "SCHEDULED", scheduledFor: daysFromNow(3) },
      { businessId: candleCo.id, title: "Scent notes story series", platform: "instagram", status: "DRAFTED" },
      { businessId: candleCo.id, title: "How we pick seasonal scents", platform: "tiktok", status: "IDEA" },
      { businessId: agency.id, title: "GlowCo: June results recap", platform: "instagram", status: "POSTED" },
    ],
  });

  await prisma.pipelineItem.createMany({
    data: [
      { businessId: agency.id, name: "GlowCo Skincare — Q3 renewal", kind: "client", stage: "IN_TALKS", valueCts: 450000, contact: "maya@glowco.com", notes: "Happy with June numbers; wants reels-heavy package." },
      { businessId: agency.id, name: "Fern & Fig Cafe — monthly", kind: "client", stage: "IN_PROGRESS", valueCts: 180000, contact: "owner@fernandfig.com" },
      { businessId: agency.id, name: "Juniper Yoga — inbound lead", kind: "client", stage: "LEAD", valueCts: 0, contact: "hello@juniperyoga.com", notes: "AI: Wants IG management + launch support · WARM · score 7/10\n---\nFound us through GlowCo's page. Asking about monthly management." },
      { businessId: candleCo.id, name: "Maple & Main — fall wholesale order", kind: "order", stage: "COMMITTED", valueCts: 96000, contact: "buyer@mapleandmain.com" },
      { businessId: candleCo.id, name: "Hotel Verde — lobby candle inquiry", kind: "order", stage: "IN_TALKS", valueCts: 240000, notes: "Wants custom scent; MOQ discussion next week." },
      { businessId: studio.id, name: "Beta cohort — 4 committed founders", kind: "client", stage: "COMMITTED", valueCts: 800000 },
    ],
  });

  await prisma.ledgerEntry.createMany({
    data: [
      { businessId: agency.id, type: "REVENUE", amountCts: 450000, memo: "GlowCo — June retainer", date: daysFromNow(-6, 12) },
      { businessId: agency.id, type: "REVENUE", amountCts: 180000, memo: "Fern & Fig — June", date: daysFromNow(-5, 12) },
      { businessId: agency.id, type: "EXPENSE", amountCts: 90000, memo: "Editor contractor payout", date: daysFromNow(-2, 12) },
      { businessId: candleCo.id, type: "REVENUE", amountCts: 68400, memo: "Web orders, week of 7/7", date: daysFromNow(-3, 12) },
      { businessId: candleCo.id, type: "EXPENSE", amountCts: 32000, memo: "Soy wax + wicks restock", date: daysFromNow(-4, 12) },
      { businessId: candleCo.id, type: "REVENUE", amountCts: 96000, memo: "Maple & Main wholesale deposit", date: daysFromNow(-1, 12) },
    ],
  });

  await prisma.contract.create({
    data: {
      businessId: agency.id,
      title: "GlowCo Skincare — services agreement",
      counterparty: "GlowCo Skincare LLC",
      status: "active",
      effectiveDate: daysFromNow(-90),
      endDate: daysFromNow(40),
      autoRenews: true,
      renewalNoticeDate: daysFromNow(10),
      summary: "Monthly social management retainer; auto-renews quarterly unless 30-day notice.",
    },
  });

  await prisma.contact.createMany({
    data: [
      { businessId: agency.id, name: "Maya Lin", role: "GlowCo — founder", email: "maya@glowco.com" },
      { businessId: agency.id, name: "Sam Torres", role: "Video editor (contract)", phone: "555-0142" },
      { businessId: candleCo.id, name: "Maple & Main", role: "Wholesale buyer", email: "buyer@mapleandmain.com" },
    ],
  });

  await prisma.document.createMany({
    data: [
      { businessId: agency.id, title: "GlowCo services agreement", category: "legal", url: "https://example.com/demo/glowco-msa", notes: "Renewal notice due soon" },
      { businessId: agency.id, title: "Content approval workflow", category: "operations", url: "https://example.com/demo/workflow" },
      { businessId: candleCo.id, title: "Fall collection scent briefs", category: "brand", url: "https://example.com/demo/scents" },
      { businessId: candleCo.id, title: "Insurance — product liability", category: "compliance", url: "https://example.com/demo/insurance" },
    ],
  });

  console.log("Demo org seeded: Harbor Social, Emberline Candle Co., True North Coaching.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
