import { addDays, startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";

export async function getDashboardData() {
  const today = startOfDay(new Date());
  const weekEnd = addDays(today, 6);
  const renewalWindow = addDays(today, 30);

  const [clients, invoices, weekPosts, overduePosts, renewals, tasks] =
    await Promise.all([
      prisma.client.findMany({ orderBy: { name: "asc" } }),
      prisma.invoice.findMany({
        where: { status: { in: ["SENT", "OVERDUE"] } },
        include: { client: true },
      }),
      prisma.contentPost.findMany({
        where: {
          scheduledDate: { gte: today, lte: addDays(weekEnd, 1) },
        },
        include: { client: true },
        orderBy: { scheduledDate: "asc" },
      }),
      prisma.contentPost.findMany({
        where: {
          scheduledDate: { lt: today },
          status: { not: "POSTED" },
        },
        include: { client: true },
        orderBy: { scheduledDate: "asc" },
      }),
      prisma.contract.findMany({
        where: {
          endDate: { gte: today, lte: renewalWindow },
          status: { not: "EXPIRED" },
        },
        include: { client: true },
        orderBy: { endDate: "asc" },
      }),
      prisma.clientTask.findMany({
        where: { status: { not: "DONE" } },
        include: { client: true },
        orderBy: [{ dueDate: "asc" }],
        take: 8,
      }),
    ]);

  const activeClients = clients.filter((c) => c.status === "ACTIVE");
  const mrr = activeClients.reduce((sum, c) => sum + c.monthlyRetainer, 0);
  const invoicesDueAmount = invoices.reduce((sum, i) => sum + i.amount, 0);

  return {
    clients,
    activeClientCount: activeClients.length,
    mrr,
    invoices,
    invoicesDueAmount,
    weekPosts,
    overduePosts,
    renewals,
    tasks,
    today,
    weekEnd,
  };
}
