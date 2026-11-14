"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { nextOccurrence } from "@/lib/dates";
import { DEAL_STAGES, DEAL_STAGE_LABELS, type DealStage, type Recurrence } from "@/lib/constants";

function revalidateAll() {
  revalidatePath("/", "layout");
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
  const title = input.title.trim();
  if (!title) return;
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
  await prisma.task.update({ where: { id }, data: { status, completedAt: null } });
  revalidateAll();
}

/**
 * Marks a task done. If it recurs, spawns the next instance with the due
 * date advanced by the recurrence interval.
 */
export async function completeTask(id: string) {
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return;
  await prisma.task.update({
    where: { id },
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
  await prisma.task.update({
    where: { id },
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
  await prisma.task.delete({ where: { id } });
  revalidateAll();
}

// ---- Business notes scratchpad ----

export async function saveBusinessNotes(businessId: string, notes: string) {
  await prisma.business.update({ where: { id: businessId }, data: { notes } });
  // no revalidate: autosave shouldn't trigger rerenders while typing
}

// ---- Documents ----

export async function createDocument(input: {
  businessId: string;
  title: string;
  category: string;
  url: string;
  notes?: string;
  dealId?: string | null;
}) {
  if (!input.title.trim() || !input.url.trim()) return;
  await prisma.document.create({
    data: {
      businessId: input.businessId,
      title: input.title.trim(),
      category: input.category,
      url: input.url.trim(),
      notes: input.notes ?? "",
      dealId: input.dealId || null,
    },
  });
  revalidateAll();
}

export async function deleteDocument(id: string) {
  await prisma.document.delete({ where: { id } });
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
  if (!input.name.trim()) return;
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
  await prisma.contact.delete({ where: { id } });
  revalidateAll();
}

// ---- Links ----

export async function createLink(input: { businessId: string; label: string; url: string }) {
  if (!input.label.trim() || !input.url.trim()) return;
  await prisma.link.create({
    data: { businessId: input.businessId, label: input.label.trim(), url: input.url.trim() },
  });
  revalidateAll();
}

export async function deleteLink(id: string) {
  await prisma.link.delete({ where: { id } });
  revalidateAll();
}

// ---- CRE deals ----

const intOrNull = (v: number | null | undefined) =>
  v == null || !Number.isFinite(v) ? null : Math.round(v);

const dateOrNull = (v: string | null | undefined) => (v ? new Date(v + "T09:00:00") : null);

export type DealFacts = {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  propertyType?: string;
  buildingSf?: number | null;
  landAcres?: number | null;
  yearBuilt?: number | null;
  source?: string;
  strategy?: string;
  sellerName?: string;
  sellerPhone?: string;
  sellerEmail?: string;
  motivation?: string;
  askingPrice?: number | null;
  offerPrice?: number | null;
  contractPrice?: number | null;
  nextAction?: string;
  nextActionDate?: string | null;
  closingDate?: string | null;
  notes?: string;
};

function factsToData(f: DealFacts) {
  const d: Record<string, unknown> = {};
  const text = [
    "name", "address", "city", "state", "propertyType", "source", "strategy",
    "sellerName", "sellerPhone", "sellerEmail", "motivation", "nextAction", "notes",
  ] as const;
  for (const k of text) if (f[k] !== undefined) d[k] = String(f[k]).trim();
  for (const k of ["buildingSf", "yearBuilt", "askingPrice", "offerPrice", "contractPrice"] as const)
    if (f[k] !== undefined) d[k] = intOrNull(f[k]);
  if (f.landAcres !== undefined)
    d.landAcres = f.landAcres == null || !Number.isFinite(f.landAcres) ? null : f.landAcres;
  if (f.nextActionDate !== undefined) d.nextActionDate = dateOrNull(f.nextActionDate);
  if (f.closingDate !== undefined) d.closingDate = dateOrNull(f.closingDate);
  return d;
}

export async function createDeal(input: DealFacts & { businessId: string }): Promise<string | null> {
  const address = (input.address ?? "").trim();
  const name = (input.name ?? "").trim() || address;
  if (!name) return null;
  const deal = await prisma.deal.create({
    data: {
      ...(factsToData({ ...input, name, address }) as object),
      name,
      businessId: input.businessId,
      activity: { create: { kind: "SYSTEM", body: "Lead added" } },
    },
  });
  revalidateAll();
  return deal.id;
}

export async function updateDeal(id: string, facts: DealFacts) {
  await prisma.deal.update({ where: { id }, data: factsToData(facts) });
  revalidateAll();
}

export async function moveDeal(id: string, stage: string, lostReason?: string) {
  if (!DEAL_STAGES.includes(stage as DealStage)) return;
  const deal = await prisma.deal.findUnique({ where: { id }, select: { stage: true } });
  if (!deal || deal.stage === stage) return;
  const reason = (lostReason ?? "").trim();
  await prisma.deal.update({
    where: { id },
    data: {
      stage,
      stageChangedAt: new Date(),
      lostReason: stage === "DEAD" ? reason : "",
      activity: {
        create: {
          kind: "STAGE",
          body:
            `${DEAL_STAGE_LABELS[deal.stage as DealStage] ?? deal.stage} → ${DEAL_STAGE_LABELS[stage as DealStage]}` +
            (stage === "DEAD" && reason ? ` — ${reason}` : ""),
        },
      },
    },
  });
  revalidateAll();
}

/** Autosave from the underwriting workbench. */
export async function saveUnderwriting(id: string, json: string) {
  await prisma.deal.update({ where: { id }, data: { underwriting: json } });
  // no revalidate: autosave shouldn't trigger rerenders while typing
}

export async function saveLoi(id: string, json: string) {
  await prisma.deal.update({ where: { id }, data: { loi: json } });
}

export async function setDealOffer(id: string, price: number, label: string) {
  const offer = Math.round(price);
  if (!Number.isFinite(offer) || offer <= 0) return;
  await prisma.deal.update({
    where: { id },
    data: {
      offerPrice: offer,
      activity: { create: { kind: "OFFER", body: `Offer price set to $${offer.toLocaleString("en-US")} (${label})` } },
    },
  });
  revalidateAll();
}

export async function addDealActivity(dealId: string, kind: string, body: string) {
  const text = body.trim();
  if (!text) return;
  await prisma.dealActivity.create({ data: { dealId, kind: kind === "CALL" ? "CALL" : "NOTE", body: text } });
  await prisma.deal.update({ where: { id: dealId }, data: { updatedAt: new Date() } });
  revalidateAll();
}

export async function deleteDealActivity(id: string) {
  await prisma.dealActivity.delete({ where: { id } });
  revalidateAll();
}

export async function deleteDeal(id: string) {
  await prisma.deal.delete({ where: { id } });
  revalidateAll();
}
