"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatDate, formatMoney } from "@/lib/format";
import { INVOICE_STATUS_LABEL, INVOICE_STATUS_STYLE } from "@/lib/constants";
import { Badge } from "@/components/ui/Badge";
import { ClientAvatar } from "@/components/ui/ClientAvatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { InvoiceStatusActions } from "./InvoiceStatusActions";

export type InvoiceRow = {
  id: string;
  number: string;
  periodLabel: string;
  amount: number;
  status: string;
  dueDate: Date;
  client: { name: string; slug: string; color: string };
};

const TABS = ["ALL", "DRAFT", "SENT", "OVERDUE", "PAID"] as const;

export function InvoicesList({
  invoices,
  today,
}: {
  invoices: InvoiceRow[];
  today: Date;
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("ALL");

  const filtered = useMemo(
    () => (tab === "ALL" ? invoices : invoices.filter((i) => i.status === tab)),
    [invoices, tab]
  );

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-1.5">
        {TABS.map((t) => {
          const count = t === "ALL" ? invoices.length : invoices.filter((i) => i.status === t).length;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                tab === t ? "bg-brand text-white" : "bg-surface-sunken text-ink-dim hover:text-ink"
              }`}
            >
              {t === "ALL" ? "All" : INVOICE_STATUS_LABEL[t]} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No invoices here" body="Try a different filter, or generate this month's batch." />
      ) : (
        <div className="card divide-y divide-line">
          {filtered.map((inv) => {
            const isPastDue = inv.dueDate < today;
            return (
              <div key={inv.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                <Link href={`/clients/${inv.client.slug}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <ClientAvatar name={inv.client.name} color={inv.client.color} size={32} />
                  <div className="min-w-0">
                    <div className="truncate text-[14px] font-medium text-ink">{inv.client.name}</div>
                    <div className="truncate text-[12.5px] text-ink-faint">
                      {inv.number} · {inv.periodLabel}
                    </div>
                  </div>
                </Link>

                <div className="hidden text-[12.5px] text-ink-faint sm:block">
                  Due {formatDate(inv.dueDate)}
                </div>

                <div className="w-20 shrink-0 text-right text-[13px] font-semibold text-ink">
                  {formatMoney(inv.amount)}
                </div>

                <Badge className={INVOICE_STATUS_STYLE[inv.status]}>
                  {INVOICE_STATUS_LABEL[inv.status]}
                </Badge>

                <InvoiceStatusActions id={inv.id} status={inv.status} isPastDue={isPastDue} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
