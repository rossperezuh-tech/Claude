"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteDeal, moveDeal, updateDeal, type DealFacts as Facts } from "@/app/actions";
import {
  DEAL_STAGES,
  DEAL_STAGE_COLORS,
  DEAL_STAGE_LABELS,
  DEAL_STRATEGIES,
  DEAL_STRATEGY_LABELS,
  LEAD_SOURCES,
  PROPERTY_TYPES,
  type DealStage,
} from "@/lib/constants";
import { money } from "@/lib/underwriting";

export type DealView = {
  id: string;
  name: string;
  stage: string;
  address: string;
  city: string;
  state: string;
  propertyType: string;
  buildingSf: number | null;
  landAcres: number | null;
  yearBuilt: number | null;
  source: string;
  strategy: string;
  sellerName: string;
  sellerPhone: string;
  sellerEmail: string;
  motivation: string;
  askingPrice: number | null;
  offerPrice: number | null;
  contractPrice: number | null;
  nextAction: string;
  nextActionDate: string; // yyyy-mm-dd or ""
  closingDate: string;
  lostReason: string;
  notes: string;
  nextDue: string;
  nextOverdue: boolean;
  color: string;
  businessName: string;
};

const numStr = (v: number | null) => (v == null ? "" : String(v));
const toNum = (s: string) => {
  const n = parseFloat(s.replace(/[$,\s]/g, ""));
  return Number.isFinite(n) ? n : null;
};

export default function DealFacts({ deal }: { deal: DealView }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [, startTransition] = useTransition();
  const [stage, setStage] = useState(deal.stage);
  const [f, setF] = useState(() => ({
    name: deal.name,
    address: deal.address,
    city: deal.city,
    state: deal.state,
    propertyType: deal.propertyType,
    buildingSf: numStr(deal.buildingSf),
    landAcres: numStr(deal.landAcres),
    yearBuilt: numStr(deal.yearBuilt),
    source: deal.source,
    strategy: deal.strategy,
    sellerName: deal.sellerName,
    sellerPhone: deal.sellerPhone,
    sellerEmail: deal.sellerEmail,
    motivation: deal.motivation,
    askingPrice: numStr(deal.askingPrice),
    offerPrice: numStr(deal.offerPrice),
    contractPrice: numStr(deal.contractPrice),
    nextAction: deal.nextAction,
    nextActionDate: deal.nextActionDate,
    closingDate: deal.closingDate,
    notes: deal.notes,
  }));
  const bind = (k: keyof typeof f) => ({
    value: f[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setF((p) => ({ ...p, [k]: e.target.value })),
  });

  function changeStage(next: string) {
    let reason: string | undefined;
    if (next === "DEAD") {
      const r = window.prompt("Why is this deal dead? (optional)");
      if (r === null) return;
      reason = r;
    }
    setStage(next);
    startTransition(() => moveDeal(deal.id, next, reason));
  }

  function save() {
    const facts: Facts = {
      ...f,
      buildingSf: toNum(f.buildingSf),
      landAcres: toNum(f.landAcres),
      yearBuilt: toNum(f.yearBuilt),
      askingPrice: toNum(f.askingPrice),
      offerPrice: toNum(f.offerPrice),
      contractPrice: toNum(f.contractPrice),
      nextActionDate: f.nextActionDate || null,
      closingDate: f.closingDate || null,
    };
    setEditing(false);
    startTransition(() => updateDeal(deal.id, facts));
  }

  function remove() {
    if (!window.confirm(`Delete ${deal.name} and its underwriting? This cannot be undone.`)) return;
    startTransition(async () => {
      await deleteDeal(deal.id);
      router.push("/deals");
    });
  }

  const stageColor = DEAL_STAGE_COLORS[stage as DealStage] ?? "#9aa5b8";
  const place = [deal.address, [deal.city, deal.state].filter(Boolean).join(", ")].filter(Boolean).join(", ");
  const facts = [
    deal.propertyType,
    deal.buildingSf ? `${deal.buildingSf.toLocaleString("en-US")} SF` : "",
    deal.landAcres ? `${deal.landAcres} acres` : "",
    deal.yearBuilt ? `built ${deal.yearBuilt}` : "",
    DEAL_STRATEGY_LABELS[deal.strategy] ?? "",
    deal.source ? `source: ${deal.source}` : "",
  ].filter(Boolean);

  return (
    <div className="card p-4" style={{ borderLeft: `3px solid ${deal.color}` }}>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-lg font-semibold">{deal.name}</h1>
        <select
          value={stage}
          onChange={(e) => changeStage(e.target.value)}
          className="cursor-pointer rounded border px-2 py-1 text-xs font-medium focus:outline-none"
          style={{ color: stageColor, borderColor: `${stageColor}55`, background: `${stageColor}1a` }}
          aria-label="Stage"
        >
          {DEAL_STAGES.map((s) => (
            <option key={s} value={s} className="bg-surface-raised text-ink">
              {DEAL_STAGE_LABELS[s]}
            </option>
          ))}
        </select>
        <span className="text-xs text-ink-faint">{deal.businessName}</span>
        <span className="ml-auto flex gap-2">
          <button onClick={() => (editing ? save() : setEditing(true))} className="btn text-xs">
            {editing ? "Save" : "Edit details"}
          </button>
          {editing && (
            <button onClick={() => setEditing(false)} className="btn text-xs text-ink-faint">
              Cancel
            </button>
          )}
        </span>
      </div>

      {!editing ? (
        <>
          <p className="mt-1 text-sm text-ink-dim">
            {place}
            {facts.length > 0 && <span className="text-ink-faint"> · {facts.join(" · ")}</span>}
          </p>
          {stage === "DEAD" && deal.lostReason && (
            <p className="mt-1 text-sm text-ink-faint">Dead: {deal.lostReason}</p>
          )}
          <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-ink-faint">Seller</div>
              <div>{deal.sellerName || <span className="text-ink-faint">Unknown</span>}</div>
              <div className="flex flex-wrap gap-x-3 text-xs text-ink-dim">
                {deal.sellerPhone && <a href={`tel:${deal.sellerPhone}`} className="hover:underline">{deal.sellerPhone}</a>}
                {deal.sellerEmail && <a href={`mailto:${deal.sellerEmail}`} className="hover:underline">{deal.sellerEmail}</a>}
              </div>
              {deal.motivation && <p className="mt-0.5 text-xs text-ink-faint">{deal.motivation}</p>}
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-ink-faint">Prices</div>
              <dl className="grid grid-cols-2 gap-x-3 tabular-nums">
                <dt className="text-ink-faint">Asking</dt>
                <dd className="text-right">{money(deal.askingPrice)}</dd>
                <dt className="text-ink-faint">Your offer</dt>
                <dd className="text-right">{money(deal.offerPrice)}</dd>
                {deal.contractPrice != null && (
                  <>
                    <dt className="text-ink-faint">Contract</dt>
                    <dd className="text-right">{money(deal.contractPrice)}</dd>
                  </>
                )}
              </dl>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-ink-faint">Next step</div>
              <div>{deal.nextAction || <span className="text-ink-faint">None set</span>}</div>
              {deal.nextDue && (
                <div className={`text-xs font-medium ${deal.nextOverdue ? "text-red-400" : "text-ink-dim"}`}>
                  {deal.nextDue}
                </div>
              )}
              {deal.closingDate && <div className="text-xs text-ink-faint">Closing {deal.closingDate}</div>}
            </div>
          </div>
          {deal.notes && (
            <p className="mt-3 whitespace-pre-line border-t border-surface-edge/60 pt-2 text-xs text-ink-dim">
              {deal.notes}
            </p>
          )}
        </>
      ) : (
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
            <L label="Deal name" span="col-span-2 sm:col-span-2"><input {...bind("name")} className="input w-full" /></L>
            <L label="Street address" span="col-span-2 sm:col-span-2"><input {...bind("address")} className="input w-full" /></L>
            <L label="City"><input {...bind("city")} className="input w-full" /></L>
            <L label="State"><input {...bind("state")} maxLength={2} className="input w-full uppercase" /></L>
            <L label="Type">
              <select {...bind("propertyType")} className="input w-full cursor-pointer capitalize">
                {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </L>
            <L label="Building SF"><input {...bind("buildingSf")} inputMode="numeric" className="input w-full" /></L>
            <L label="Land acres"><input {...bind("landAcres")} inputMode="decimal" className="input w-full" /></L>
            <L label="Year built"><input {...bind("yearBuilt")} inputMode="numeric" className="input w-full" /></L>
            <L label="Source">
              <select {...bind("source")} className="input w-full cursor-pointer capitalize">
                <option value="">—</option>
                {LEAD_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </L>
            <L label="Plan">
              <select {...bind("strategy")} className="input w-full cursor-pointer">
                {DEAL_STRATEGIES.map((s) => <option key={s} value={s}>{DEAL_STRATEGY_LABELS[s]}</option>)}
              </select>
            </L>
            <L label="Seller name" span="col-span-2"><input {...bind("sellerName")} className="input w-full" /></L>
            <L label="Seller phone" span="col-span-2"><input {...bind("sellerPhone")} inputMode="tel" className="input w-full" /></L>
            <L label="Seller email" span="col-span-2"><input {...bind("sellerEmail")} inputMode="email" className="input w-full" /></L>
            <L label="Why are they selling?" span="col-span-2 sm:col-span-6"><input {...bind("motivation")} className="input w-full" /></L>
            <L label="Asking price" span="col-span-2"><input {...bind("askingPrice")} inputMode="numeric" className="input w-full" /></L>
            <L label="Your offer" span="col-span-2"><input {...bind("offerPrice")} inputMode="numeric" className="input w-full" /></L>
            <L label="Contract price" span="col-span-2"><input {...bind("contractPrice")} inputMode="numeric" className="input w-full" /></L>
            <L label="Next step" span="col-span-2 sm:col-span-2"><input {...bind("nextAction")} className="input w-full" /></L>
            <L label="Next step due" span="col-span-1 sm:col-span-2"><input type="date" {...bind("nextActionDate")} className="input w-full" /></L>
            <L label="Closing date" span="col-span-1 sm:col-span-2"><input type="date" {...bind("closingDate")} className="input w-full" /></L>
            <L label="Notes" span="col-span-2 sm:col-span-6"><textarea {...bind("notes")} rows={3} className="input w-full" /></L>
          </div>
          <button onClick={remove} className="text-xs text-ink-faint hover:text-red-400">
            Delete this deal
          </button>
        </div>
      )}
    </div>
  );
}

function L({ label, span = "", children }: { label: string; span?: string; children: React.ReactNode }) {
  return (
    <label className={`block min-w-0 ${span}`}>
      <span className="mb-0.5 block text-[11px] text-ink-faint">{label}</span>
      {children}
    </label>
  );
}
