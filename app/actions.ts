"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { nextOccurrence } from "@/lib/dates";
import type { Recurrence } from "@/lib/constants";

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
}) {
  if (!input.title.trim() || !input.url.trim()) return;
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

// ---- Tools: Meeting Notes ----

export async function createTasksBulk(
  businessId: string,
  items: { title: string; notes?: string; priority?: string; dueDate?: string | null }[],
) {
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
