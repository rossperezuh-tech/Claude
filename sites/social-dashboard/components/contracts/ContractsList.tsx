"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { differenceInCalendarDays } from "date-fns";
import { formatDate, formatMoney } from "@/lib/format";
import {
  CONTRACT_STATUS_LABEL,
  CONTRACT_STATUS_STYLE,
  CONTRACT_TYPE_LABEL,
} from "@/lib/constants";
import { Badge } from "@/components/ui/Badge";
import { ClientAvatar } from "@/components/ui/ClientAvatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { ContractStatusActions } from "./ContractStatusActions";

export type ContractRow = {
  id: string;
  title: string;
  type: string;
  status: string;
  startDate: Date;
  endDate: Date | null;
  autoRenew: boolean;
  value: number;
  client: { name: string; slug: string; color: string };
};

const TABS = ["ALL", "DRAFT", "SENT", "SIGNED", "EXPIRED"] as const;

export function ContractsList({
  contracts,
  today,
}: {
  contracts: ContractRow[];
  today: Date;
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("ALL");

  const filtered = useMemo(
    () => (tab === "ALL" ? contracts : contracts.filter((c) => c.status === tab)),
    [contracts, tab]
  );

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-1.5">
        {TABS.map((t) => {
          const count =
            t === "ALL" ? contracts.length : contracts.filter((c) => c.status === t).length;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                tab === t
                  ? "bg-brand text-white"
                  : "bg-surface-sunken text-ink-dim hover:text-ink"
              }`}
            >
              {t === "ALL" ? "All" : CONTRACT_STATUS_LABEL[t]} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No contracts here" body="Try a different filter, or create one." />
      ) : (
        <div className="card divide-y divide-line">
          {filtered.map((c) => {
            const daysLeft = c.endDate ? differenceInCalendarDays(c.endDate, today) : null;
            const renewalSoon =
              c.status !== "EXPIRED" && daysLeft !== null && daysLeft <= 30 && daysLeft >= 0;
            return (
              <div key={c.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                <Link href={`/clients/${c.client.slug}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <ClientAvatar name={c.client.name} color={c.client.color} size={32} />
                  <div className="min-w-0">
                    <div className="truncate text-[14px] font-medium text-ink">{c.client.name}</div>
                    <div className="truncate text-[12.5px] text-ink-faint">
                      {c.title} · {CONTRACT_TYPE_LABEL[c.type]}
                    </div>
                  </div>
                </Link>

                <div className="hidden text-[12.5px] text-ink-faint sm:block">
                  {formatDate(c.startDate)}
                  {c.endDate ? ` – ${formatDate(c.endDate)}` : ""}
                </div>

                <div className="w-20 shrink-0 text-right text-[13px] font-semibold text-ink">
                  {formatMoney(c.value)}
                </div>

                {renewalSoon && (
                  <Badge className="bg-warn-soft text-warn">
                    Renews in {daysLeft}d
                  </Badge>
                )}

                <Badge className={CONTRACT_STATUS_STYLE[c.status]}>
                  {CONTRACT_STATUS_LABEL[c.status]}
                </Badge>

                <ContractStatusActions id={c.id} status={c.status} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
