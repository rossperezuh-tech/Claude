"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

// ---------- input validation ----------
// Server actions are callable by anything that can reach the server, so
// every value coming off a FormData is treated as untrusted: statuses are
// whitelisted, numbers clamped to sane finite ranges, dates checked for
// validity, and free text length-capped.

const CLIENT_STATUSES = ["ACTIVE", "ONBOARDING", "PAUSED", "CHURNED"] as const;
const CONTRACT_TYPES = ["RETAINER", "PROJECT", "ONE_TIME"] as const;
const CONTRACT_STATUSES = ["DRAFT", "SENT", "SIGNED", "EXPIRED"] as const;
const INVOICE_STATUSES = ["DRAFT", "SENT", "PAID", "OVERDUE"] as const;
const POST_STATUSES = ["IDEA", "DRAFTED", "SCHEDULED", "POSTED"] as const;
const TASK_STATUSES = ["TODO", "IN_PROGRESS", "DONE"] as const;
const PRIORITIES = ["P1", "P2", "P3"] as const;
const PLATFORMS = [
  "INSTAGRAM", "TIKTOK", "FACEBOOK", "TWITTER",
  "LINKEDIN", "YOUTUBE", "PINTEREST", "OTHER",
] as const;

function oneOf<T extends readonly string[]>(
  allowed: T,
  value: unknown,
  fallback: T[number]
): T[number] {
  return allowed.includes(String(value) as T[number])
    ? (String(value) as T[number])
    : fallback;
}

function text(value: unknown, maxLen = 500): string {
  return String(value ?? "").slice(0, maxLen);
}

function money(value: unknown, max = 10_000_000): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, max);
}

function dateOrNull(value: unknown): Date | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function cleanPlatforms(values: unknown[]): string {
  return values
    .map(String)
    .filter((p) => (PLATFORMS as readonly string[]).includes(p))
    .join(",");
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ---------- Clients ----------

export async function createClient(formData: FormData) {
  const name = text(formData.get("name"), 120).trim();
  if (!name) return;

  const count = await prisma.client.count();
  const colors = [
    "#3454D1", "#158A5A", "#B4740E", "#8B3FD1", "#C4342F",
    "#0E8FA8", "#D1349B", "#B4570E", "#3D7A2E", "#A13D6B",
  ];

  let slug = slugify(name) || "client";
  const existing = await prisma.client.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Date.now().toString(36)}`;

  await prisma.client.create({
    data: {
      name,
      slug,
      color: colors[count % colors.length],
      status: oneOf(CLIENT_STATUSES, formData.get("status"), "ONBOARDING"),
      platforms: cleanPlatforms(formData.getAll("platforms")),
      contactName: text(formData.get("contactName"), 120),
      contactEmail: text(formData.get("contactEmail"), 254),
      contactPhone: text(formData.get("contactPhone"), 40),
      monthlyRetainer: money(formData.get("monthlyRetainer")),
    },
  });

  revalidatePath("/");
  revalidatePath("/clients");
}

export async function updateClientNotes(clientId: string, notes: string) {
  await prisma.client.update({
    where: { id: clientId },
    data: { notes: text(notes, 20_000) },
  });
  revalidatePath(`/clients`);
}

export async function updateClientStatus(clientId: string, status: string) {
  await prisma.client.update({
    where: { id: clientId },
    data: { status: oneOf(CLIENT_STATUSES, status, "ACTIVE") },
  });
  revalidatePath("/");
  revalidatePath("/clients");
}

export async function updateClientDetails(
  clientId: string,
  formData: FormData
) {
  await prisma.client.update({
    where: { id: clientId },
    data: {
      contactName: text(formData.get("contactName"), 120),
      contactEmail: text(formData.get("contactEmail"), 254),
      contactPhone: text(formData.get("contactPhone"), 40),
      monthlyRetainer: money(formData.get("monthlyRetainer")),
      platforms: cleanPlatforms(formData.getAll("platforms")),
    },
  });

  revalidatePath("/clients");
  revalidatePath("/");
}

// ---------- Contracts ----------

export async function createContract(clientId: string, formData: FormData) {
  const title = text(formData.get("title"), 200).trim();
  const startDate = dateOrNull(formData.get("startDate"));
  if (!title || !startDate) return;

  await prisma.contract.create({
    data: {
      clientId,
      title,
      type: oneOf(CONTRACT_TYPES, formData.get("type"), "RETAINER"),
      status: oneOf(CONTRACT_STATUSES, formData.get("status"), "DRAFT"),
      startDate,
      endDate: dateOrNull(formData.get("endDate")),
      autoRenew: formData.get("autoRenew") === "on",
      value: money(formData.get("value")),
      content: text(formData.get("content"), 50_000),
    },
  });

  revalidatePath("/contracts");
  revalidatePath(`/clients`);
}

export async function updateContractStatus(id: string, status: string) {
  const next = oneOf(CONTRACT_STATUSES, status, "DRAFT");
  const data: Record<string, unknown> = { status: next };
  if (next === "SENT") data.sentAt = new Date();
  if (next === "SIGNED") data.signedAt = new Date();
  await prisma.contract.update({ where: { id }, data });
  revalidatePath("/contracts");
  revalidatePath("/clients");
}

// ---------- Invoices ----------

export async function generateMonthlyInvoices() {
  const clients = await prisma.client.findMany({
    where: { status: "ACTIVE" },
  });

  const now = new Date();
  const period = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodLabel = period.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const dueDate = new Date(now.getFullYear(), now.getMonth(), 6);
  const prefix = `INV-${period.getFullYear()}${String(
    period.getMonth() + 1
  ).padStart(2, "0")}`;

  // Derive the next sequence from the highest existing number rather than
  // a row count, so deletions can't cause unique-constraint collisions.
  const last = await prisma.invoice.findFirst({
    orderBy: { number: "desc" },
    select: { number: true },
  });
  let counter = last ? parseInt(last.number.slice(-3), 10) + 1 : 1;
  if (!Number.isFinite(counter)) counter = 1;
  let created = 0;

  for (const client of clients) {
    const already = await prisma.invoice.findFirst({
      where: { clientId: client.id, periodLabel },
    });
    if (already) continue;

    await prisma.invoice.create({
      data: {
        clientId: client.id,
        number: `${prefix}-${String(counter++).padStart(3, "0")}`,
        periodLabel,
        amount: client.monthlyRetainer,
        status: "DRAFT",
        issueDate: period,
        dueDate,
      },
    });
    created++;
  }

  revalidatePath("/invoices");
  revalidatePath("/");
  return created;
}

export async function updateInvoiceStatus(id: string, status: string) {
  const next = oneOf(INVOICE_STATUSES, status, "DRAFT");
  const data: Record<string, unknown> = { status: next };
  if (next === "PAID") data.paidDate = new Date();
  await prisma.invoice.update({ where: { id }, data });
  revalidatePath("/invoices");
  revalidatePath("/");
}

// ---------- Content posts ----------

export async function createContentPost(formData: FormData) {
  const clientId = text(formData.get("clientId"), 64);
  const scheduledDate = dateOrNull(formData.get("scheduledDate"));
  if (!clientId || !scheduledDate) return;

  await prisma.contentPost.create({
    data: {
      clientId,
      platform: oneOf(PLATFORMS, formData.get("platform"), "INSTAGRAM"),
      caption: text(formData.get("caption"), 5_000),
      status: oneOf(POST_STATUSES, formData.get("status"), "IDEA"),
      scheduledDate,
    },
  });

  revalidatePath("/calendar");
  revalidatePath("/");
  revalidatePath("/clients");
}

export async function updatePostStatus(id: string, status: string) {
  const next = oneOf(POST_STATUSES, status, "IDEA");
  const data: Record<string, unknown> = { status: next };
  if (next === "POSTED") data.postedAt = new Date();
  await prisma.contentPost.update({ where: { id }, data });
  revalidatePath("/calendar");
  revalidatePath("/");
  revalidatePath("/clients");
}

// ---------- Tasks ----------

export async function createClientTask(clientId: string, formData: FormData) {
  const title = text(formData.get("title"), 300).trim();
  if (!title) return;

  await prisma.clientTask.create({
    data: {
      clientId,
      title,
      priority: oneOf(PRIORITIES, formData.get("priority"), "P2"),
      dueDate: dateOrNull(formData.get("dueDate")),
    },
  });

  revalidatePath("/clients");
  revalidatePath("/");
}

export async function updateTaskStatus(id: string, status: string) {
  await prisma.clientTask.update({
    where: { id },
    data: { status: oneOf(TASK_STATUSES, status, "TODO") },
  });
  revalidatePath("/clients");
  revalidatePath("/");
}

// ---------- Import from call summary ----------
// Creates a client from a confirmed import draft, storing the full call
// summary as the client's notes and spinning up the starter tasks the
// human kept. Same validation rules as createClient.

export async function importClientFromSummary(formData: FormData) {
  const name = text(formData.get("name"), 120).trim();
  if (!name) return;

  const count = await prisma.client.count();
  const colors = [
    "#3454D1", "#158A5A", "#B4740E", "#8B3FD1", "#C4342F",
    "#0E8FA8", "#D1349B", "#B4570E", "#3D7A2E", "#A13D6B",
  ];

  let slug = slugify(name) || "client";
  const existing = await prisma.client.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Date.now().toString(36)}`;

  const tasks = formData
    .getAll("tasks")
    .map((t) => text(t, 300).trim())
    .filter(Boolean)
    .slice(0, 20);

  await prisma.client.create({
    data: {
      name,
      slug,
      color: colors[count % colors.length],
      status: oneOf(CLIENT_STATUSES, formData.get("status"), "ONBOARDING"),
      platforms: cleanPlatforms(formData.getAll("platforms")),
      contactName: text(formData.get("contactName"), 120),
      contactEmail: text(formData.get("contactEmail"), 254),
      contactPhone: text(formData.get("contactPhone"), 40),
      monthlyRetainer: money(formData.get("monthlyRetainer")),
      notes: text(formData.get("notes"), 20_000),
      tasks: {
        create: tasks.map((title) => ({ title, priority: "P2" })),
      },
    },
  });

  revalidatePath("/");
  revalidatePath("/clients");
}

// ---------- Performance ----------

export async function addPerformanceMetric(
  clientId: string,
  formData: FormData
) {
  const date = dateOrNull(formData.get("date")) ?? new Date();

  await prisma.performanceMetric.create({
    data: {
      clientId,
      platform: oneOf(PLATFORMS, formData.get("platform"), "INSTAGRAM"),
      date,
      followers: Math.round(money(formData.get("followers"), 2_000_000_000)),
      engagementRate: Math.min(money(formData.get("engagementRate"), 100), 100),
      reach: Math.round(money(formData.get("reach"), 2_000_000_000)),
      impressions: Math.round(money(formData.get("impressions"), 2_000_000_000)),
    },
  });

  revalidatePath("/performance");
  revalidatePath("/clients");
}
