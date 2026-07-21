import { prisma } from "@/lib/prisma";
import { requireOrg, assertToolEnabled } from "@/lib/org";
import InvoiceTrackerClient from "./InvoiceTrackerClient";

export const metadata = { title: "Invoice & Payment Tracker — Venture HQ" };
export const dynamic = "force-dynamic";

export default async function InvoiceTrackerPage() {
  const { orgId } = await requireOrg();
  await assertToolEnabled(orgId, "invoice-tracker");
  const [businesses, invoices] = await Promise.all([
    prisma.business.findMany({
      where: { organizationId: orgId },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, color: true },
    }),
    prisma.invoice.findMany({
      where: { business: { organizationId: orgId } },
      orderBy: [{ createdAt: "desc" }],
      include: { business: { select: { name: true, color: true } } },
    }),
  ]);

  const now = Date.now();
  const rows = invoices.map((i) => ({
    id: i.id,
    client: i.client,
    amountDollars: i.amountCts / 100,
    status: i.status,
    dueDate: i.dueDate ? i.dueDate.toISOString() : null,
    overdue: i.status !== "PAID" && !!i.dueDate && i.dueDate.getTime() < now,
    notes: i.notes,
    business: i.business,
  }));

  return <InvoiceTrackerClient businesses={businesses} invoices={rows} />;
}
