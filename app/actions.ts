"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/org";
import { nextOccurrence } from "@/lib/dates";
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
      sortOrder: count + 1,
    },
  });
  revalidateAll();
  return slug;
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
