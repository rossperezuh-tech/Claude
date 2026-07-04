import type { Metadata } from "next";
import { startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { GenerateInvoicesButton } from "@/components/invoices/GenerateInvoicesButton";
import { InvoicesList } from "@/components/invoices/InvoicesList";

export const metadata: Metadata = { title: "Invoices" };

export default async function InvoicesPage() {
  const today = startOfDay(new Date());

  const invoices = await prisma.invoice.findMany({
    include: { client: true },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
  });

  const outstanding = invoices.filter((i) => i.status === "SENT" || i.status === "OVERDUE");
  const paidThisMonth = invoices.filter(
    (i) => i.status === "PAID" && i.paidDate && i.paidDate.getMonth() === today.getMonth()
  );
  const overdueAmount = invoices
    .filter((i) => i.status === "OVERDUE")
    .reduce((s, i) => s + i.amount, 0);

  return (
    <div className="page">
      <PageHeader
        title="Invoices"
        subtitle="Monthly billing across every client, generated in one click."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Outstanding"
          value={formatMoney(outstanding.reduce((s, i) => s + i.amount, 0))}
          hint={`${outstanding.length} invoice${outstanding.length === 1 ? "" : "s"}`}
        />
        <StatCard
          label="Overdue"
          value={formatMoney(overdueAmount)}
          tone={overdueAmount > 0 ? "bad" : "default"}
        />
        <StatCard
          label="Paid this month"
          value={formatMoney(paidThisMonth.reduce((s, i) => s + i.amount, 0))}
          tone="good"
        />
      </div>

      <div className="my-8">
        <GenerateInvoicesButton />
      </div>

      <InvoicesList invoices={invoices} today={today} />
    </div>
  );
}
