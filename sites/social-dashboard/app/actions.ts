"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ---------- Clients ----------

export async function createClient(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) return;

  const platforms = formData.getAll("platforms").map(String);
  const count = await prisma.client.count();
  const colors = [
    "#3454D1", "#158A5A", "#B4740E", "#8B3FD1", "#C4342F",
    "#0E8FA8", "#D1349B", "#5B6470", "#B4570E", "#3F6ED1",
  ];

  let slug = slugify(name);
  const existing = await prisma.client.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Date.now().toString(36)}`;

  await prisma.client.create({
    data: {
      name,
      slug,
      color: colors[count % colors.length],
      status: String(formData.get("status") || "ONBOARDING"),
      platforms: platforms.join(","),
      contactName: String(formData.get("contactName") || ""),
      contactEmail: String(formData.get("contactEmail") || ""),
      contactPhone: String(formData.get("contactPhone") || ""),
      monthlyRetainer: Number(formData.get("monthlyRetainer") || 0),
    },
  });

  revalidatePath("/");
  revalidatePath("/clients");
}

export async function updateClientNotes(clientId: string, notes: string) {
  await prisma.client.update({ where: { id: clientId }, data: { notes } });
  revalidatePath(`/clients`);
}

export async function updateClientStatus(clientId: string, status: string) {
  await prisma.client.update({ where: { id: clientId }, data: { status } });
  revalidatePath("/");
  revalidatePath("/clients");
}

export async function updateClientDetails(
  clientId: string,
  formData: FormData
) {
  const platforms = formData.getAll("platforms").map(String);

  await prisma.client.update({
    where: { id: clientId },
    data: {
      contactName: String(formData.get("contactName") || ""),
      contactEmail: String(formData.get("contactEmail") || ""),
      contactPhone: String(formData.get("contactPhone") || ""),
      monthlyRetainer: Number(formData.get("monthlyRetainer") || 0),
      platforms: platforms.join(","),
    },
  });

  revalidatePath("/clients");
  revalidatePath("/");
}

// ---------- Contracts ----------

export async function createContract(clientId: string, formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  if (!title) return;

  const startDate = new Date(String(formData.get("startDate")));
  const endDateRaw = String(formData.get("endDate") || "");

  await prisma.contract.create({
    data: {
      clientId,
      title,
      type: String(formData.get("type") || "RETAINER"),
      status: String(formData.get("status") || "DRAFT"),
      startDate,
      endDate: endDateRaw ? new Date(endDateRaw) : null,
      autoRenew: formData.get("autoRenew") === "on",
      value: Number(formData.get("value") || 0),
      content: String(formData.get("content") || ""),
    },
  });

  revalidatePath("/contracts");
  revalidatePath(`/clients`);
}

export async function updateContractStatus(id: string, status: string) {
  const data: Record<string, unknown> = { status };
  if (status === "SENT") data.sentAt = new Date();
  if (status === "SIGNED") data.signedAt = new Date();
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

  const existingCount = await prisma.invoice.count();
  let counter = existingCount + 1;
  let created = 0;

  for (const client of clients) {
    const already = await prisma.invoice.findFirst({
      where: { clientId: client.id, periodLabel },
    });
    if (already) continue;

    await prisma.invoice.create({
      data: {
        clientId: client.id,
        number: `INV-${period.getFullYear()}${String(
          period.getMonth() + 1
        ).padStart(2, "0")}-${String(counter++).padStart(3, "0")}`,
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
  const data: Record<string, unknown> = { status };
  if (status === "PAID") data.paidDate = new Date();
  await prisma.invoice.update({ where: { id }, data });
  revalidatePath("/invoices");
  revalidatePath("/");
}

// ---------- Content posts ----------

export async function createContentPost(formData: FormData) {
  const clientId = String(formData.get("clientId") || "");
  const scheduledDateRaw = String(formData.get("scheduledDate") || "");
  if (!clientId || !scheduledDateRaw) return;

  await prisma.contentPost.create({
    data: {
      clientId,
      platform: String(formData.get("platform") || "INSTAGRAM"),
      caption: String(formData.get("caption") || ""),
      status: String(formData.get("status") || "IDEA"),
      scheduledDate: new Date(scheduledDateRaw),
    },
  });

  revalidatePath("/calendar");
  revalidatePath("/");
  revalidatePath("/clients");
}

export async function updatePostStatus(id: string, status: string) {
  const data: Record<string, unknown> = { status };
  if (status === "POSTED") data.postedAt = new Date();
  await prisma.contentPost.update({ where: { id }, data });
  revalidatePath("/calendar");
  revalidatePath("/");
  revalidatePath("/clients");
}

// ---------- Tasks ----------

export async function createClientTask(clientId: string, formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  if (!title) return;
  const dueDateRaw = String(formData.get("dueDate") || "");

  await prisma.clientTask.create({
    data: {
      clientId,
      title,
      priority: String(formData.get("priority") || "P2"),
      dueDate: dueDateRaw ? new Date(dueDateRaw) : null,
    },
  });

  revalidatePath("/clients");
  revalidatePath("/");
}

export async function updateTaskStatus(id: string, status: string) {
  await prisma.clientTask.update({ where: { id }, data: { status } });
  revalidatePath("/clients");
  revalidatePath("/");
}

// ---------- Performance ----------

export async function addPerformanceMetric(
  clientId: string,
  formData: FormData
) {
  await prisma.performanceMetric.create({
    data: {
      clientId,
      platform: String(formData.get("platform") || "INSTAGRAM"),
      date: new Date(String(formData.get("date") || new Date())),
      followers: Number(formData.get("followers") || 0),
      engagementRate: Number(formData.get("engagementRate") || 0),
      reach: Number(formData.get("reach") || 0),
      impressions: Number(formData.get("impressions") || 0),
    },
  });

  revalidatePath("/performance");
  revalidatePath("/clients");
}
