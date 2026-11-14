"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createDeal } from "@/app/actions";
import { LEAD_SOURCES, PROPERTY_TYPES } from "@/lib/constants";

const toNum = (s: string) => {
  const n = parseFloat(s.replace(/[$,\s]/g, ""));
  return Number.isFinite(n) ? n : null;
};

export default function NewDealForm({
  businesses,
}: {
  businesses: { id: string; name: string; color: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [f, setF] = useState({
    address: "",
    city: "",
    state: "TX",
    propertyType: "warehouse",
    buildingSf: "",
    askingPrice: "",
    sellerName: "",
    sellerPhone: "",
    source: "website",
    motivation: "",
    businessId: businesses[0]?.id ?? "",
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  if (businesses.length === 0) return null;

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn">
        + New lead
      </button>
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.address.trim()) return;
    startTransition(async () => {
      const id = await createDeal({
        businessId: f.businessId,
        address: f.address,
        city: f.city,
        state: f.state,
        propertyType: f.propertyType,
        buildingSf: toNum(f.buildingSf),
        askingPrice: toNum(f.askingPrice),
        sellerName: f.sellerName,
        sellerPhone: f.sellerPhone,
        source: f.source,
        motivation: f.motivation,
      });
      if (id) router.push(`/deals/${id}`);
    });
  }

  return (
    <form onSubmit={submit} className="card space-y-2 p-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
        <input autoFocus value={f.address} onChange={set("address")} placeholder="Street address" className="input col-span-2 sm:col-span-3" />
        <input value={f.city} onChange={set("city")} placeholder="City" className="input sm:col-span-2" />
        <input value={f.state} onChange={set("state")} placeholder="State" maxLength={2} className="input uppercase" />
        <select value={f.propertyType} onChange={set("propertyType")} className="input cursor-pointer capitalize sm:col-span-2">
          {PROPERTY_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <input value={f.buildingSf} onChange={set("buildingSf")} inputMode="numeric" placeholder="Building SF" className="input sm:col-span-2" />
        <input value={f.askingPrice} onChange={set("askingPrice")} inputMode="numeric" placeholder="Asking price (if any)" className="input col-span-2" />
        <input value={f.sellerName} onChange={set("sellerName")} placeholder="Seller name" className="input sm:col-span-2" />
        <input value={f.sellerPhone} onChange={set("sellerPhone")} inputMode="tel" placeholder="Seller phone" className="input sm:col-span-2" />
        <select value={f.source} onChange={set("source")} className="input cursor-pointer capitalize sm:col-span-2">
          {LEAD_SOURCES.map((s) => (
            <option key={s} value={s}>Source: {s}</option>
          ))}
        </select>
        <input value={f.motivation} onChange={set("motivation")} placeholder="Why are they selling?" className="input col-span-2 sm:col-span-4" />
        {businesses.length > 1 && (
          <select value={f.businessId} onChange={set("businessId")} className="input col-span-2 cursor-pointer">
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        )}
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={pending || !f.address.trim()} className="btn text-xs disabled:opacity-50">
          {pending ? "Saving…" : "Add lead"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn text-xs text-ink-faint">
          Cancel
        </button>
      </div>
    </form>
  );
}
