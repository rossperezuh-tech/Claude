"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createLedgerEntry } from "@/app/actions";

type Receipt = {
  vendor: string;
  amountDollars: number;
  date: string;
  type: string;
  memo: string;
};

export default function ReceiptSnapClient({
  businesses,
}: {
  businesses: { id: string; name: string }[];
}) {
  const [businessId, setBusinessId] = useState(businesses[0]?.id ?? "");
  const [preview, setPreview] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [, startTransition] = useTransition();

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setReceipt(null);
    setSaved(false);

    const dataUrl: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("read failed"));
      reader.readAsDataURL(file);
    });
    setPreview(dataUrl);

    const [meta, b64] = dataUrl.split(",");
    const mediaType = meta.slice(meta.indexOf(":") + 1, meta.indexOf(";"));

    setLoading(true);
    try {
      const res = await fetch("/api/tools/receipt-snap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: b64, mediaType }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? `Request failed (${res.status}).`);
        return;
      }
      setReceipt(data.receipt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function save() {
    if (!receipt || !businessId) return;
    startTransition(() =>
      createLedgerEntry({
        businessId,
        type: receipt.type === "REVENUE" ? "REVENUE" : "EXPENSE",
        amountDollars: receipt.amountDollars,
        memo: receipt.memo,
        date: receipt.date || null,
      }),
    );
    setSaved(true);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <div className="text-xs text-ink-faint">
          <Link href="/tools" className="hover:text-ink-dim">Tools</Link> / Receipt Snap
        </div>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">Receipt Snap</h1>
        <p className="mt-1 text-sm text-ink-dim">
          Photograph a receipt — it reads the vendor, amount, and date and logs it to your Money Log.
        </p>
      </div>

      <div className="card space-y-3 p-4">
        <label className="btn inline-flex cursor-pointer text-sm">
          📸 Choose / take a photo
          <input type="file" accept="image/*" capture="environment" onChange={onFile} className="hidden" />
        </label>
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="receipt" className="max-h-56 rounded-md border border-surface-edge" />
        )}
        {loading && <p className="text-xs text-ink-faint">Reading the receipt…</p>}
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>

      {receipt && (
        <div className="card space-y-3 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-dim">Review &amp; save</h2>
          <div className="flex flex-wrap items-end gap-2">
            <label className="block">
              <span className="mb-1 block text-xs text-ink-faint">Business</span>
              <select className="input text-sm" value={businessId} onChange={(e) => setBusinessId(e.target.value)}>
                {businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-ink-faint">Type</span>
              <select className="input text-sm" value={receipt.type} onChange={(e) => setReceipt({ ...receipt, type: e.target.value })}>
                <option value="EXPENSE">Expense</option>
                <option value="REVENUE">Income</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-ink-faint">Amount ($)</span>
              <input
                className="input w-28 text-sm"
                inputMode="decimal"
                value={receipt.amountDollars}
                onChange={(e) => setReceipt({ ...receipt, amountDollars: parseFloat(e.target.value) || 0 })}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-ink-faint">Date</span>
              <input type="date" className="input text-sm" value={receipt.date} onChange={(e) => setReceipt({ ...receipt, date: e.target.value })} />
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-xs text-ink-faint">Memo</span>
            <input className="input w-full text-sm" value={receipt.memo} onChange={(e) => setReceipt({ ...receipt, memo: e.target.value })} />
          </label>
          <button
            onClick={save}
            disabled={saved || !receipt.amountDollars}
            className="btn border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50"
          >
            {saved ? "Logged ✓" : "Add to Money Log"}
          </button>
        </div>
      )}
    </div>
  );
}
