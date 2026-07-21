"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createInvoice, updateInvoiceStatus, deleteInvoice } from "@/app/actions";

type Biz = { id: string; name: string; color: string };
type Invoice = {
  id: string;
  client: string;
  amountDollars: number;
  status: string;
  dueDate: string | null;
  overdue: boolean;
  notes: string;
  business: { name: string; color: string };
};

const STATUSES = ["DRAFT", "SENT", "PAID"] as const;
const STATUS_LABEL: Record<string, string> = { DRAFT: "Draft", SENT: "Sent", PAID: "Paid" };
const STATUS_STYLE: Record<string, string> = {
  DRAFT: "border-surface-edge text-ink-dim",
  SENT: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  PAID: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
};

function money(n: number) {
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export default function InvoiceTrackerClient({
  businesses,
  invoices,
}: {
  businesses: Biz[];
  invoices: Invoice[];
}) {
  const [businessId, setBusinessId] = useState(businesses[0]?.id ?? "");
  const [client, setClient] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [, startTransition] = useTransition();

  const outstanding = invoices
    .filter((i) => i.status !== "PAID")
    .reduce((s, i) => s + i.amountDollars, 0);
  const overdue = invoices.filter((i) => i.overdue).reduce((s, i) => s + i.amountDollars, 0);
  const paid = invoices.filter((i) => i.status === "PAID").reduce((s, i) => s + i.amountDollars, 0);

  function add() {
    if (!client.trim() || !businessId) return;
    startTransition(() =>
      createInvoice({
        businessId,
        client: client.trim(),
        amountDollars: parseFloat(amount) || 0,
        status: "SENT",
        dueDate: dueDate || null,
      }),
    );
    setClient("");
    setAmount("");
    setDueDate("");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <div className="text-xs text-ink-faint">
          <Link href="/tools" className="hover:text-ink-dim">Tools</Link> / Invoice &amp; Payment Tracker
        </div>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">Invoice &amp; Payment Tracker</h1>
        <p className="mt-1 text-sm text-ink-dim">Track who owes what, what's been paid, and what's overdue.</p>
      </div>

      {/* Rollup */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-3">
          <div className="text-xs text-ink-faint">Outstanding</div>
          <div className="text-lg font-semibold">{money(outstanding)}</div>
        </div>
        <div className="card p-3">
          <div className="text-xs text-ink-faint">Overdue</div>
          <div className="text-lg font-semibold text-red-400">{money(overdue)}</div>
        </div>
        <div className="card p-3">
          <div className="text-xs text-ink-faint">Paid</div>
          <div className="text-lg font-semibold text-emerald-400">{money(paid)}</div>
        </div>
      </div>

      {/* Add */}
      <div className="card flex flex-wrap items-end gap-2 p-3">
        <select className="input text-sm" value={businessId} onChange={(e) => setBusinessId(e.target.value)}>
          {businesses.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <input
          className="input flex-1 text-sm"
          placeholder="Who owes (client)"
          value={client}
          onChange={(e) => setClient(e.target.value)}
        />
        <input
          className="input w-28 text-sm"
          placeholder="$ amount"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <input type="date" className="input text-sm" value={dueDate} onChange={(e) => setDueDate(e.target.value)} title="Due date" />
        <button onClick={add} disabled={!client.trim()} className="btn border-indigo-400/50 bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 disabled:opacity-50">
          Add invoice
        </button>
      </div>

      {/* List */}
      <div className="card p-2">
        {invoices.length === 0 ? (
          <p className="p-3 text-sm text-ink-faint">No invoices yet. Add one above.</p>
        ) : (
          <ul className="divide-y divide-surface-edge/60">
            {invoices.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center gap-2 px-2 py-2.5">
                <span className="chip shrink-0 border-transparent" style={{ color: i.business.color, background: `${i.business.color}1a` }}>
                  {i.business.name}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{i.client}</span>
                <span className="shrink-0 text-sm font-semibold">{money(i.amountDollars)}</span>
                {i.dueDate && (
                  <span className={`shrink-0 text-xs ${i.overdue ? "font-medium text-red-400" : "text-ink-faint"}`}>
                    due {new Date(i.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    {i.overdue ? " · overdue" : ""}
                  </span>
                )}
                <select
                  value={i.status}
                  onChange={(e) => startTransition(() => updateInvoiceStatus(i.id, e.target.value))}
                  className={`chip cursor-pointer ${STATUS_STYLE[i.status] ?? STATUS_STYLE.DRAFT}`}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                  ))}
                </select>
                <button
                  onClick={() => startTransition(() => deleteInvoice(i.id))}
                  title="Delete"
                  className="shrink-0 text-xs text-ink-faint hover:text-red-400"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
