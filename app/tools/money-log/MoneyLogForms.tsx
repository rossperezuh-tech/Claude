"use client";

import { useState, useTransition } from "react";
import { createLedgerEntry, deleteLedgerEntry } from "@/app/actions";

interface BusinessOption {
  id: string;
  name: string;
  color: string;
}

export default function MoneyLogForms({ businesses }: { businesses: BusinessOption[] }) {
  const [type, setType] = useState<"REVENUE" | "EXPENSE">("REVENUE");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [businessId, setBusinessId] = useState(businesses[0]?.id ?? "");
  const [date, setDate] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const dollars = Number(amount);
    if (!dollars || pending) return;
    startTransition(async () => {
      await createLedgerEntry({
        businessId,
        type,
        amountDollars: dollars,
        memo,
        date: date || null,
      });
      setAmount("");
      setMemo("");
    });
  }

  return (
    <form onSubmit={submit} className="card flex flex-wrap items-center gap-2 p-3">
      <div className="flex overflow-hidden rounded-md border border-surface-edge">
        <button
          type="button"
          onClick={() => setType("REVENUE")}
          className={`px-3 py-1.5 text-xs font-medium transition-colors ${
            type === "REVENUE" ? "bg-emerald-500/20 text-emerald-400" : "text-ink-faint hover:text-ink"
          }`}
        >
          Money in
        </button>
        <button
          type="button"
          onClick={() => setType("EXPENSE")}
          className={`px-3 py-1.5 text-xs font-medium transition-colors ${
            type === "EXPENSE" ? "bg-red-500/20 text-red-400" : "text-ink-faint hover:text-ink"
          }`}
        >
          Money out
        </button>
      </div>
      <input
        className="input w-28 text-sm"
        placeholder="$ amount"
        inputMode="decimal"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <input
        className="input min-w-[160px] flex-1 text-sm"
        placeholder="Memo (e.g. 'Whole Foods order', 'packaging supplier')"
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
      />
      <select className="input text-sm" value={businessId} onChange={(e) => setBusinessId(e.target.value)}>
        {businesses.map((b) => (
          <option key={b.id} value={b.id}>{b.name}</option>
        ))}
      </select>
      <input type="date" className="input text-sm" value={date} onChange={(e) => setDate(e.target.value)} />
      <button
        type="submit"
        disabled={pending || !Number(amount)}
        className="btn border-indigo-400/50 bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Log it
      </button>
    </form>
  );
}

export function DeleteEntry({ id }: { id: string }) {
  const [, startTransition] = useTransition();
  return (
    <button
      type="button"
      title="Delete entry"
      onClick={() => startTransition(() => deleteLedgerEntry(id))}
      className="btn px-1.5 py-0.5 text-[11px] opacity-40 hover:border-red-400/50 hover:text-red-400 hover:opacity-100"
    >
      ✕
    </button>
  );
}
