"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/org";
import { isPlatformAdmin } from "@/lib/admin";
import { nextOccurrence } from "@/lib/dates";
import { TOOLS, TOOL_CATEGORIES } from "@/lib/tools";
import type { Recurrence } from "@/lib/constants";

function revalidateAll() {
  revalidatePath("/", "layout");
}

/**
 * Tenant safety: every mutation here resolves the caller's org and refuses
 * to touch rows outside it. By-id updates/deletes go through updateMany /
 * deleteMany with a relation filter so the ownership check and the write
 * are a single query; creates verify the target business first.
 */
async function assertBusinessInOrg(businessId: string, orgId: string): Promise<boolean> {
  const b = await prisma.business.findFirst({
    where: { id: businessId, organizationId: orgId },
    select: { id: true },
  });
  return b !== null;
}

// ---- Businesses ----

const BUSINESS_COLOR_PALETTE = [
  "#34d399", "#f472b6", "#a3e635", "#fbbf24", "#4ade80", "#fb923c",
  "#818cf8", "#38bdf8", "#2dd4bf", "#c084fc", "#f87171", "#a8a29e",
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "business";
}

export async function createBusiness(input: {
  name: string;
  description?: string;
  status?: string;
  color?: string;
  website?: string;
}) {
  const { orgId } = await requireOrg();
  const name = input.name.trim();
  if (!name) return;

  const count = await prisma.business.count({ where: { organizationId: orgId } });
  const base = slugify(name);
  // find a slug free within this org
  let slug = base;
  for (let i = 2; ; i++) {
    const clash = await prisma.business.findUnique({
      where: { organizationId_slug: { organizationId: orgId, slug } },
      select: { id: true },
    });
    if (!clash) break;
    slug = `${base}-${i}`;
  }

  await prisma.business.create({
    data: {
      organizationId: orgId,
      name,
      slug,
      description: input.description?.trim() ?? "",
      status: input.status ?? "active",
      color: input.color ?? BUSINESS_COLOR_PALETTE[count % BUSINESS_COLOR_PALETTE.length],
      website: input.website?.trim() ?? "",
      sortOrder: count + 1,
    },
  });
  revalidateAll();
  return slug;
}

export async function updateBusinessWebsite(businessId: string, website: string) {
  const { orgId } = await requireOrg();
  await prisma.business.updateMany({
    where: { id: businessId, organizationId: orgId },
    data: { website: website.trim() },
  });
  revalidateAll();
}

// Persist a new venture order from drag-and-drop. Each id's position in the
// array becomes its sortOrder. Done as a single UPDATE ... FROM (VALUES ...)
// statement — one round-trip, org-scoped in the WHERE clause — so it can't
// mis-handle Neon's pooled connection the way a transaction or many parallel
// writes can.
export async function reorderBusinesses(orderedIds: string[]) {
  const { orgId } = await requireOrg();
  if (orderedIds.length === 0) return;
  const rows = Prisma.join(orderedIds.map((id, i) => Prisma.sql`(${id}, ${i}::int)`));
  await prisma.$executeRaw(Prisma.sql`
    UPDATE "Business" AS b
    SET "sortOrder" = v.ord
    FROM (VALUES ${rows}) AS v(id, ord)
    WHERE b.id = v.id AND b."organizationId" = ${orgId}
  `);
  revalidateAll();
}

export async function deleteBusiness(id: string) {
  const { orgId } = await requireOrg();
  await prisma.business.deleteMany({ where: { id, organizationId: orgId } });
  revalidateAll();
}

// ---- Tasks ----

export async function createTask(input: {
  title: string;
  businessId: string;
  dueDate?: string | null;
  priority?: string;
  status?: string;
  notes?: string;
  recurrence?: string | null;
}) {
  const { orgId } = await requireOrg();
  const title = input.title.trim();
  if (!title) return;
  if (!(await assertBusinessInOrg(input.businessId, orgId))) return;
  await prisma.task.create({
    data: {
      title,
      businessId: input.businessId,
      dueDate: input.dueDate ? new Date(input.dueDate + "T09:00:00") : null,
      priority: input.priority ?? "P2",
      status: input.status ?? "BACKLOG",
      notes: input.notes ?? "",
      recurrence: input.recurrence || null,
    },
  });
  revalidateAll();
}

export async function updateTaskStatus(id: string, status: string) {
  if (status === "DONE") {
    await completeTask(id);
    return;
  }
  const { orgId } = await requireOrg();
  await prisma.task.updateMany({
    where: { id, business: { organizationId: orgId } },
    data: { status, completedAt: null },
  });
  revalidateAll();
}

/**
 * Marks a task done. If it recurs, spawns the next instance with the due
 * date advanced by the recurrence interval.
 */
export async function completeTask(id: string) {
  const { orgId } = await requireOrg();
  const task = await prisma.task.findFirst({
    where: { id, business: { organizationId: orgId } },
  });
  if (!task) return;
  await prisma.task.update({
    where: { id: task.id },
    data: { status: "DONE", completedAt: new Date() },
  });
  if (task.recurrence && task.dueDate) {
    await prisma.task.create({
      data: {
        title: task.title,
        notes: task.notes,
        priority: task.priority,
        status: "THIS_WEEK",
        dueDate: nextOccurrence(task.dueDate, task.recurrence as Recurrence),
        recurrence: task.recurrence,
        businessId: task.businessId,
      },
    });
  }
  revalidateAll();
}

export async function updateTask(
  id: string,
  data: { title?: string; priority?: string; dueDate?: string | null; notes?: string; recurrence?: string | null }
) {
  const { orgId } = await requireOrg();
  await prisma.task.updateMany({
    where: { id, business: { organizationId: orgId } },
    data: {
      ...(data.title !== undefined ? { title: data.title.trim() } : {}),
      ...(data.priority !== undefined ? { priority: data.priority } : {}),
      ...(data.dueDate !== undefined
        ? { dueDate: data.dueDate ? new Date(data.dueDate + "T09:00:00") : null }
        : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
      ...(data.recurrence !== undefined ? { recurrence: data.recurrence || null } : {}),
    },
  });
  revalidateAll();
}

export async function deleteTask(id: string) {
  const { orgId } = await requireOrg();
  await prisma.task.deleteMany({ where: { id, business: { organizationId: orgId } } });
  revalidateAll();
}

// ---- Business notes scratchpad ----

export async function saveBusinessNotes(businessId: string, notes: string) {
  const { orgId } = await requireOrg();
  await prisma.business.updateMany({
    where: { id: businessId, organizationId: orgId },
    data: { notes },
  });
  // no revalidate: autosave shouldn't trigger rerenders while typing
}

// Logo is a small square data URI produced by resizing the file in the
// browser. Pass null to clear it. We cap the size and require a data URI so a
// malformed or oversized payload can't be stored.
export async function setBusinessLogo(businessId: string, dataUri: string | null) {
  const { orgId } = await requireOrg();
  let logoUrl: string | null = null;
  if (dataUri) {
    if (!dataUri.startsWith("data:image/") || dataUri.length > 400_000) return;
    logoUrl = dataUri;
  }
  await prisma.business.updateMany({
    where: { id: businessId, organizationId: orgId },
    data: { logoUrl },
  });
  revalidateAll();
}

// ---- Documents ----

export async function createDocument(input: {
  businessId: string;
  title: string;
  category: string;
  url: string;
  notes?: string;
}) {
  const { orgId } = await requireOrg();
  if (!input.title.trim() || !input.url.trim()) return;
  if (!(await assertBusinessInOrg(input.businessId, orgId))) return;
  await prisma.document.create({
    data: {
      businessId: input.businessId,
      title: input.title.trim(),
      category: input.category,
      url: input.url.trim(),
      notes: input.notes ?? "",
    },
  });
  revalidateAll();
}

export async function deleteDocument(id: string) {
  const { orgId } = await requireOrg();
  await prisma.document.deleteMany({ where: { id, business: { organizationId: orgId } } });
  revalidateAll();
}

// ---- Contacts ----

export async function createContact(input: {
  businessId: string;
  name: string;
  role?: string;
  phone?: string;
  email?: string;
  notes?: string;
}) {
  const { orgId } = await requireOrg();
  if (!input.name.trim()) return;
  if (!(await assertBusinessInOrg(input.businessId, orgId))) return;
  await prisma.contact.create({
    data: {
      businessId: input.businessId,
      name: input.name.trim(),
      role: input.role ?? "",
      phone: input.phone ?? "",
      email: input.email ?? "",
      notes: input.notes ?? "",
    },
  });
  revalidateAll();
}

export async function deleteContact(id: string) {
  const { orgId } = await requireOrg();
  await prisma.contact.deleteMany({ where: { id, business: { organizationId: orgId } } });
  revalidateAll();
}

// ---- Links ----

export async function createLink(input: { businessId: string; label: string; url: string }) {
  const { orgId } = await requireOrg();
  if (!input.label.trim() || !input.url.trim()) return;
  if (!(await assertBusinessInOrg(input.businessId, orgId))) return;
  await prisma.link.create({
    data: { businessId: input.businessId, label: input.label.trim(), url: input.url.trim() },
  });
  revalidateAll();
}

export async function deleteLink(id: string) {
  const { orgId } = await requireOrg();
  await prisma.link.deleteMany({ where: { id, business: { organizationId: orgId } } });
  revalidateAll();
}

// ---- Tools: Meeting Notes ----

export async function createTasksBulk(
  businessId: string,
  items: { title: string; notes?: string; priority?: string; dueDate?: string | null }[],
) {
  const { orgId } = await requireOrg();
  if (!(await assertBusinessInOrg(businessId, orgId))) return 0;
  const data = items
    .map((item) => ({
      title: item.title.trim(),
      businessId,
      notes: item.notes ?? "",
      priority: item.priority ?? "P2",
      dueDate: item.dueDate ? new Date(item.dueDate + "T09:00:00") : null,
    }))
    .filter((item) => item.title);
  if (data.length === 0) return 0;
  await prisma.task.createMany({ data });
  revalidateAll();
  return data.length;
}

// ---- Tools: Contract Manager ----

export async function createContract(input: {
  businessId: string;
  title: string;
  counterparty?: string;
  effectiveDate?: string | null;
  endDate?: string | null;
  autoRenews?: boolean;
  renewalNoticeDate?: string | null;
  summary?: string;
  notes?: string;
}) {
  const { orgId } = await requireOrg();
  const title = input.title.trim();
  if (!title) return;
  if (!(await assertBusinessInOrg(input.businessId, orgId))) return;
  const toDate = (d?: string | null) => (d ? new Date(d + "T09:00:00") : null);
  await prisma.contract.create({
    data: {
      businessId: input.businessId,
      title,
      counterparty: input.counterparty ?? "",
      effectiveDate: toDate(input.effectiveDate),
      endDate: toDate(input.endDate),
      autoRenews: input.autoRenews ?? false,
      renewalNoticeDate: toDate(input.renewalNoticeDate),
      summary: input.summary ?? "",
      notes: input.notes ?? "",
    },
  });
  revalidateAll();
}

export async function deleteContract(id: string) {
  const { orgId } = await requireOrg();
  await prisma.contract.deleteMany({ where: { id, business: { organizationId: orgId } } });
  revalidateAll();
}

// ---- Tools: Content Studio ----

export async function updateBrandVoice(businessId: string, brandVoice: string) {
  const { orgId } = await requireOrg();
  await prisma.business.updateMany({
    where: { id: businessId, organizationId: orgId },
    data: { brandVoice },
  });
}

// ---- Tools: Content Calendar ----

export async function createContentPost(input: {
  businessId: string;
  title: string;
  platform?: string;
  status?: string;
  scheduledFor?: string | null;
  content?: string;
  hashtags?: string;
  notes?: string;
}) {
  const { orgId } = await requireOrg();
  const title = input.title.trim();
  if (!title) return;
  if (!(await assertBusinessInOrg(input.businessId, orgId))) return;
  await prisma.contentPost.create({
    data: {
      businessId: input.businessId,
      title,
      platform: input.platform ?? "instagram",
      status: input.status ?? "IDEA",
      scheduledFor: input.scheduledFor ? new Date(input.scheduledFor + "T09:00:00") : null,
      content: input.content ?? "",
      hashtags: input.hashtags ?? "",
      notes: input.notes ?? "",
    },
  });
  revalidateAll();
}

export async function updateContentPost(
  id: string,
  data: {
    title?: string;
    platform?: string;
    status?: string;
    scheduledFor?: string | null;
    content?: string;
    hashtags?: string;
    notes?: string;
  },
) {
  const { orgId } = await requireOrg();
  await prisma.contentPost.updateMany({
    where: { id, business: { organizationId: orgId } },
    data: {
      ...(data.title !== undefined ? { title: data.title.trim() } : {}),
      ...(data.platform !== undefined ? { platform: data.platform } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.scheduledFor !== undefined
        ? { scheduledFor: data.scheduledFor ? new Date(data.scheduledFor + "T09:00:00") : null }
        : {}),
      ...(data.content !== undefined ? { content: data.content } : {}),
      ...(data.hashtags !== undefined ? { hashtags: data.hashtags } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
    },
  });
  revalidateAll();
}

export async function deleteContentPost(id: string) {
  const { orgId } = await requireOrg();
  await prisma.contentPost.deleteMany({ where: { id, business: { organizationId: orgId } } });
  revalidateAll();
}

// ---- Tools: Client & Order Tracker ----

export async function createPipelineItem(input: {
  businessId: string;
  name: string;
  kind?: string;
  stage?: string;
  valueDollars?: number;
  contact?: string;
  notes?: string;
}) {
  const { orgId } = await requireOrg();
  const name = input.name.trim();
  if (!name) return;
  if (!(await assertBusinessInOrg(input.businessId, orgId))) return;
  await prisma.pipelineItem.create({
    data: {
      businessId: input.businessId,
      name,
      kind: input.kind === "order" ? "order" : "client",
      stage: input.stage ?? "LEAD",
      valueCts: Math.max(0, Math.round((input.valueDollars ?? 0) * 100)),
      contact: input.contact ?? "",
      notes: input.notes ?? "",
    },
  });
  revalidateAll();
}

export async function updatePipelineItem(
  id: string,
  data: { name?: string; kind?: string; stage?: string; valueDollars?: number; contact?: string; notes?: string },
) {
  const { orgId } = await requireOrg();
  await prisma.pipelineItem.updateMany({
    where: { id, business: { organizationId: orgId } },
    data: {
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.kind !== undefined ? { kind: data.kind === "order" ? "order" : "client" } : {}),
      ...(data.stage !== undefined ? { stage: data.stage } : {}),
      ...(data.valueDollars !== undefined
        ? { valueCts: Math.max(0, Math.round(data.valueDollars * 100)) }
        : {}),
      ...(data.contact !== undefined ? { contact: data.contact } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
    },
  });
  revalidateAll();
}

export async function deletePipelineItem(id: string) {
  const { orgId } = await requireOrg();
  await prisma.pipelineItem.deleteMany({ where: { id, business: { organizationId: orgId } } });
  revalidateAll();
}

// ---- Tools: Invoice & Payment Tracker ----

export async function createInvoice(input: {
  businessId: string;
  client: string;
  amountDollars?: number;
  status?: string;
  dueDate?: string | null;
  notes?: string;
}) {
  const { orgId } = await requireOrg();
  const client = input.client.trim();
  if (!client) return;
  if (!(await assertBusinessInOrg(input.businessId, orgId))) return;
  await prisma.invoice.create({
    data: {
      businessId: input.businessId,
      client,
      amountCts: Math.max(0, Math.round((input.amountDollars ?? 0) * 100)),
      status: input.status ?? "DRAFT",
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      notes: input.notes?.trim() ?? "",
    },
  });
  revalidateAll();
}

export async function updateInvoiceStatus(id: string, status: string) {
  const { orgId } = await requireOrg();
  await prisma.invoice.updateMany({
    where: { id, business: { organizationId: orgId } },
    data: { status },
  });
  revalidateAll();
}

export async function deleteInvoice(id: string) {
  const { orgId } = await requireOrg();
  await prisma.invoice.deleteMany({ where: { id, business: { organizationId: orgId } } });
  revalidateAll();
}

// ---- Tools: Review & Testimonial Collector ----

export async function createTestimonial(input: {
  businessId: string;
  author: string;
  role?: string;
  quote?: string;
  rating?: number;
  source?: string;
  status?: string;
}) {
  const { orgId } = await requireOrg();
  const author = input.author.trim();
  if (!author) return;
  if (!(await assertBusinessInOrg(input.businessId, orgId))) return;
  await prisma.testimonial.create({
    data: {
      businessId: input.businessId,
      author,
      role: input.role?.trim() ?? "",
      quote: input.quote?.trim() ?? "",
      rating: Math.min(5, Math.max(0, Math.round(input.rating ?? 0))),
      source: input.source?.trim() ?? "",
      status: input.status ?? "REQUESTED",
    },
  });
  revalidateAll();
}

export async function updateTestimonialStatus(id: string, status: string) {
  const { orgId } = await requireOrg();
  await prisma.testimonial.updateMany({
    where: { id, business: { organizationId: orgId } },
    data: { status },
  });
  revalidateAll();
}

export async function deleteTestimonial(id: string) {
  const { orgId } = await requireOrg();
  await prisma.testimonial.deleteMany({ where: { id, business: { organizationId: orgId } } });
  revalidateAll();
}

// ---- Tools: Goals / KPI Tracker ----

export async function createGoal(input: {
  businessId: string;
  title: string;
  targetNum?: number;
  currentNum?: number;
  unit?: string;
  dueDate?: string | null;
}) {
  const { orgId } = await requireOrg();
  const title = input.title.trim();
  if (!title) return;
  if (!(await assertBusinessInOrg(input.businessId, orgId))) return;
  await prisma.goal.create({
    data: {
      businessId: input.businessId,
      title,
      targetNum: input.targetNum ?? 0,
      currentNum: input.currentNum ?? 0,
      unit: input.unit?.trim() ?? "",
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
    },
  });
  revalidateAll();
}

export async function updateGoal(
  id: string,
  data: { currentNum?: number; status?: string },
) {
  const { orgId } = await requireOrg();
  await prisma.goal.updateMany({
    where: { id, business: { organizationId: orgId } },
    data: {
      ...(data.currentNum !== undefined ? { currentNum: data.currentNum } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
    },
  });
  revalidateAll();
}

export async function deleteGoal(id: string) {
  const { orgId } = await requireOrg();
  await prisma.goal.deleteMany({ where: { id, business: { organizationId: orgId } } });
  revalidateAll();
}

// ---- Tools: Deal Tracker (CRE pipeline) ----

export async function createDeal(input: {
  businessId: string;
  name: string;
  address?: string;
  askingDollars?: number;
  offerDollars?: number;
  contact?: string;
  targetClose?: string | null;
  notes?: string;
}) {
  const { orgId } = await requireOrg();
  const name = input.name.trim();
  if (!name) return;
  if (!(await assertBusinessInOrg(input.businessId, orgId))) return;
  await prisma.deal.create({
    data: {
      businessId: input.businessId,
      name,
      address: input.address?.trim() ?? "",
      askingCts: Math.max(0, Math.round((input.askingDollars ?? 0) * 100)),
      offerCts: Math.max(0, Math.round((input.offerDollars ?? 0) * 100)),
      contact: input.contact?.trim() ?? "",
      targetClose: input.targetClose ? new Date(input.targetClose + "T09:00:00") : null,
      notes: input.notes ?? "",
    },
  });
  revalidateAll();
}

export async function updateDeal(
  id: string,
  data: {
    name?: string;
    stage?: string;
    address?: string;
    askingDollars?: number;
    offerDollars?: number;
    contact?: string;
    targetClose?: string | null;
    notes?: string;
  },
) {
  const { orgId } = await requireOrg();
  await prisma.deal.updateMany({
    where: { id, business: { organizationId: orgId } },
    data: {
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.stage !== undefined ? { stage: data.stage } : {}),
      ...(data.address !== undefined ? { address: data.address.trim() } : {}),
      ...(data.askingDollars !== undefined
        ? { askingCts: Math.max(0, Math.round(data.askingDollars * 100)) }
        : {}),
      ...(data.offerDollars !== undefined
        ? { offerCts: Math.max(0, Math.round(data.offerDollars * 100)) }
        : {}),
      ...(data.contact !== undefined ? { contact: data.contact.trim() } : {}),
      ...(data.targetClose !== undefined
        ? { targetClose: data.targetClose ? new Date(data.targetClose + "T09:00:00") : null }
        : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
    },
  });
  revalidateAll();
}

export async function deleteDeal(id: string) {
  const { orgId } = await requireOrg();
  await prisma.deal.deleteMany({ where: { id, business: { organizationId: orgId } } });
  revalidateAll();
}

// ---- Admin: per-client tool access ----

/**
 * Admin-only mutation of ANOTHER org's settings — intentionally does not
 * go through requireOrg()'s "caller can only touch their own org" pattern,
 * since the whole point is letting the platform admin curate every
 * client's tool list. Gated on isPlatformAdmin() instead.
 */
export async function setEnabledTools(orgId: string, tools: string[]) {
  if (!(await isPlatformAdmin())) return;
  const validSlugs = new Set(TOOLS.map((t) => t.slug));
  const cleaned = Array.from(new Set(tools.filter((t) => validSlugs.has(t))));
  await prisma.organization.update({
    where: { id: orgId },
    data: { enabledTools: cleaned },
  });
  revalidateAll();
}

// Save the caller's own tools-page ordering (drag-to-reorder). Not admin-
// gated: each account arranges its own tools page.
export async function setToolOrder(slugs: string[]) {
  const { orgId } = await requireOrg();
  const validSlugs = new Set(TOOLS.map((t) => t.slug));
  const cleaned = Array.from(new Set(slugs.filter((s) => validSlugs.has(s))));
  await prisma.organization.update({
    where: { id: orgId },
    data: { toolOrder: cleaned },
  });
  revalidatePath("/tools");
}

// Set the caller's account branding (header name / color / logo).
export async function setOrgBranding(input: {
  brandName?: string;
  brandColor?: string;
  brandLogoUrl?: string | null;
}) {
  const { orgId } = await requireOrg();
  const data: { brandName?: string; brandColor?: string; brandLogoUrl?: string | null } = {};
  if (input.brandName !== undefined) data.brandName = input.brandName.trim().slice(0, 60);
  if (input.brandColor !== undefined) data.brandColor = input.brandColor.trim().slice(0, 20);
  if (input.brandLogoUrl !== undefined) {
    if (input.brandLogoUrl === null) data.brandLogoUrl = null;
    else if (input.brandLogoUrl.startsWith("data:image/") && input.brandLogoUrl.length <= 400_000)
      data.brandLogoUrl = input.brandLogoUrl;
  }
  await prisma.organization.update({ where: { id: orgId }, data });
  revalidatePath("/", "layout");
}

// Choose the home-dashboard template/layout for the caller's account.
export async function setDashboardTemplate(id: string) {
  const { orgId } = await requireOrg();
  await prisma.organization.update({
    where: { id: orgId },
    data: { dashboardTemplate: id },
  });
  revalidatePath("/");
}

// Toggle a tool as a favorite for the caller's own tools page.
export async function toggleFavoriteTool(slug: string) {
  const { orgId } = await requireOrg();
  if (!TOOLS.some((t) => t.slug === slug)) return;
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { favoriteTools: true },
  });
  const current = org?.favoriteTools ?? [];
  const next = current.includes(slug)
    ? current.filter((s) => s !== slug)
    : [...current, slug];
  await prisma.organization.update({
    where: { id: orgId },
    data: { favoriteTools: next },
  });
  revalidatePath("/tools");
}

export async function setCategoryOrder(categories: string[]) {
  const { orgId } = await requireOrg();
  const valid = new Set<string>(TOOL_CATEGORIES);
  const cleaned = Array.from(new Set(categories.filter((c) => valid.has(c))));
  await prisma.organization.update({
    where: { id: orgId },
    data: { categoryOrder: cleaned },
  });
  revalidatePath("/tools");
}

// ---- Tools: Lead Intake ----

export async function toggleIntake(businessId: string, enabled: boolean) {
  const { orgId } = await requireOrg();
  const business = await prisma.business.findFirst({
    where: { id: businessId, organizationId: orgId },
    select: { id: true, intakeToken: true },
  });
  if (!business) return;
  await prisma.business.update({
    where: { id: business.id },
    data: {
      intakeEnabled: enabled,
      // token is minted once, on first enable, and stays stable thereafter
      ...(enabled && !business.intakeToken ? { intakeToken: randomUUID() } : {}),
    },
  });
  revalidateAll();
}

// ---- Tools: Brain Dump ----

export interface BrainDumpItems {
  tasks: { business_slug: string; title: string; details: string; due_date: string; priority: string }[];
  content_ideas: { business_slug: string; title: string; platform: string }[];
  leads: { business_slug: string; name: string; kind: string; value_dollars: number; contact: string; notes: string }[];
  money: { business_slug: string; type: string; amount_dollars: number; memo: string }[];
}

/**
 * Applies a reviewed brain-dump routing in one shot. Every business slug is
 * resolved within the caller's org; items pointing anywhere else are
 * silently dropped. Returns how many records were created.
 */
export async function applyBrainDump(items: BrainDumpItems): Promise<number> {
  const { orgId } = await requireOrg();
  const businesses = await prisma.business.findMany({
    where: { organizationId: orgId },
    select: { id: true, slug: true },
  });
  const idBySlug = new Map(businesses.map((b) => [b.slug, b.id]));
  let created = 0;

  const tasks = (items.tasks ?? [])
    .filter((t) => idBySlug.has(t.business_slug) && t.title.trim())
    .map((t) => ({
      businessId: idBySlug.get(t.business_slug)!,
      title: t.title.trim(),
      notes: t.details ?? "",
      priority: ["P1", "P2", "P3"].includes(t.priority) ? t.priority : "P2",
      dueDate: /^\d{4}-\d{2}-\d{2}$/.test(t.due_date) ? new Date(t.due_date + "T09:00:00") : null,
    }));
  if (tasks.length > 0) {
    await prisma.task.createMany({ data: tasks });
    created += tasks.length;
  }

  const posts = (items.content_ideas ?? [])
    .filter((p) => idBySlug.has(p.business_slug) && p.title.trim())
    .map((p) => ({
      businessId: idBySlug.get(p.business_slug)!,
      title: p.title.trim(),
      platform: p.platform || "instagram",
      status: "IDEA",
    }));
  if (posts.length > 0) {
    await prisma.contentPost.createMany({ data: posts });
    created += posts.length;
  }

  const leads = (items.leads ?? [])
    .filter((l) => idBySlug.has(l.business_slug) && l.name.trim())
    .map((l) => ({
      businessId: idBySlug.get(l.business_slug)!,
      name: l.name.trim(),
      kind: l.kind === "order" ? "order" : "client",
      stage: "LEAD",
      valueCts: Math.max(0, Math.round((l.value_dollars ?? 0) * 100)),
      contact: l.contact ?? "",
      notes: l.notes ?? "",
    }));
  if (leads.length > 0) {
    await prisma.pipelineItem.createMany({ data: leads });
    created += leads.length;
  }

  const money = (items.money ?? [])
    .filter((m) => idBySlug.has(m.business_slug) && Math.round(Math.abs(m.amount_dollars) * 100) > 0)
    .map((m) => ({
      businessId: idBySlug.get(m.business_slug)!,
      type: m.type === "EXPENSE" ? "EXPENSE" : "REVENUE",
      amountCts: Math.round(Math.abs(m.amount_dollars) * 100),
      memo: m.memo ?? "",
    }));
  if (money.length > 0) {
    await prisma.ledgerEntry.createMany({ data: money });
    created += money.length;
  }

  revalidateAll();
  return created;
}

// ---- Tools: Money Log ----

export async function createLedgerEntry(input: {
  businessId: string;
  type: string; // REVENUE | EXPENSE
  amountDollars: number;
  memo?: string;
  date?: string | null; // YYYY-MM-DD, default today
}) {
  const { orgId } = await requireOrg();
  const amountCts = Math.round(Math.abs(input.amountDollars) * 100);
  if (amountCts === 0) return;
  if (!(await assertBusinessInOrg(input.businessId, orgId))) return;
  await prisma.ledgerEntry.create({
    data: {
      businessId: input.businessId,
      type: input.type === "EXPENSE" ? "EXPENSE" : "REVENUE",
      amountCts,
      memo: input.memo?.trim() ?? "",
      date: input.date ? new Date(input.date + "T12:00:00") : new Date(),
    },
  });
  revalidateAll();
}

export async function deleteLedgerEntry(id: string) {
  const { orgId } = await requireOrg();
  await prisma.ledgerEntry.deleteMany({ where: { id, business: { organizationId: orgId } } });
  revalidateAll();
}
