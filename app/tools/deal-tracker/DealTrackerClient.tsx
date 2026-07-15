"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { createDeal, deleteDeal, updateDeal } from "@/app/actions";
import { DEAL_STAGES, DEAL_STAGE_LABELS, type DealStage } from "@/lib/constants";

export interface DealRow {
  id: string;
  name: string;
  stage: string;
  address: string;
  askingCts: number;
  offerCts: number;
  contact: string;
  targetClose: string | null; // YYYY-MM-DD
  notes: string;
  businessName: string;
  businessColor: string;
}

interface BusinessOption {
  id: string;
  name: string;
  color: string;
}

function money(cts: number): string {
  if (cts === 0) return "";
  const dollars = cts / 100;
  if (dollars >= 1_000_000) return `$${(dollars / 1_000_000).toFixed(dollars % 1_000_000 === 0 ? 0 : 1)}M`;
  if (dollars >= 10_000) return `$${Math.round(dollars / 1000)}K`;
  return dollars.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

/** Days until target close: red ≤14d, amber ≤45d. */
function closeChip(targetClose: string | null): { text: string; className: string } | null {
  if (!targetClose) return null;
  const days = Math.round(
    (new Date(targetClose + "T09:00:00").getTime() - Date.now()) / 86_400_000,
  );
  const text = days < 0 ? `close ${-days}d overdue` : `close in ${days}d`;
  if (days <= 14) return { text, className: "text-red-400 border-red-500/30 bg-red-500/10" };
  if (days <= 45) return { text, className: "text-amber-400 border-amber-500/30 bg-amber-500/10" };
  return { text, className: "text-ink-dim border-surface-edge" };
}

type OptimisticAction =
  | { type: "move"; id: string; stage: string }
  | { type: "remove"; id: string };

export default function DealTrackerClient({
  businesses,
  deals,
}: {
  businesses: BusinessOption[];
  deals: DealRow[];
}) {
  const [, startTransition] = useTransition();
  const [optimisticDeals, applyOptimistic] = useOptimistic(
    deals,
    (state: DealRow[], action: OptimisticAction) => {
      if (action.type === "remove") return state.filter((d) => d.id !== action.id);
      return state.map((d) => (d.id === action.id ? { ...d, stage: action.stage } : d));
    },
  );

  function move(id: string, stage: string) {
    startTransition(async () => {
      applyOptimistic({ type: "move", id, stage });
      await updateDeal(id, { stage });
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      applyOptimistic({ type: "remove", id });
      await deleteDeal(id);
    });
  }

  const openDeals = optimisticDeals.filter((d) => d.stage !== "CLOSE");
  const openValueCts = openDeals.reduce((sum, d) => sum + (d.offerCts || d.askingCts), 0);

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs text-ink-faint">
          <Link href="/tools" className="hover:text-ink-dim">Tools</Link> / Deal Tracker
        </div>
        <div className="mt-1 flex items-baseline justify-between">
          <h1 className="text-xl font-semibold tracking-tight">Deal Tracker</h1>
          <span className="text-xs text-ink-faint">
            {openDeals.length} open{openValueCts > 0 && ` · ${money(openValueCts)} in play`}
          </span>
        </div>
        <p className="mt-1 text-sm text-ink-dim">
          Every property from first call to closing table — offers, contacts, and close dates in
          one pipeline.
        </p>
      </div>

      <AddDealForm businesses={businesses} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {DEAL_STAGES.map((stage) => {
          const col = optimisticDeals.filter((d) => d.stage === stage);
          const colCts = col.reduce((sum, d) => sum + (d.offerCts || d.askingCts), 0);
          return (
            <div key={stage} className="card flex flex-col p-3">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-dim">
                  {DEAL_STAGE_LABELS[stage]}
                </h3>
                <span className="text-xs text-ink-faint">
                  {colCts > 0 ? money(colCts) : col.length}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-2">
                {col.map((deal) => (
                  <DealCard key={deal.id} deal={deal} onMove={move} onRemove={remove} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DealCard({
  deal,
  onMove,
  onRemove,
}: {
  deal: DealRow;
  onMove: (id: string, stage: string) => void;
  onRemove: (id: string) => void;
}) {
  const idx = DEAL_STAGES.indexOf(deal.stage as DealStage);
  const prev = idx > 0 ? DEAL_STAGES[idx - 1] : null;
  const next = idx < DEAL_STAGES.length - 1 ? DEAL_STAGES[idx + 1] : null;
  const chip = deal.stage !== "CLOSE" ? closeChip(deal.targetClose) : null;

  return (
    <div className="group rounded-md border border-surface-edge bg-surface-overlay/60 p-2.5">
      <p className="text-sm font-medium leading-snug">{deal.name}</p>
      {deal.address && <p className="mt-0.5 truncate text-xs text-ink-faint">{deal.address}</p>}

      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        {deal.askingCts > 0 && (
          <span className="text-ink-dim">
            ask <span className="font-medium text-ink">{money(deal.askingCts)}</span>
          </span>
        )}
        {deal.offerCts > 0 && (
          <span className="text-ink-dim">
            offer <span className="font-medium text-emerald-400">{money(deal.offerCts)}</span>
          </span>
        )}
      </div>

      {(chip || deal.contact) && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
          {chip && <span className={`chip ${chip.className}`}>{chip.text}</span>}
          {deal.contact && <span className="truncate text-ink-faint">{deal.contact}</span>}
        </div>
      )}

      {deal.notes && (
        <details className="mt-1.5">
          <summary className="cursor-pointer text-[11px] text-ink-faint hover:text-ink-dim">
            notes
          </summary>
          <p className="mt-1 whitespace-pre-wrap rounded bg-surface-raised/60 p-2 text-xs leading-relaxed text-ink-dim">
            {deal.notes}
          </p>
        </details>
      )}

      <div className="mt-1.5 flex items-center gap-2 text-[11px] text-ink-faint">
        <span
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ background: deal.businessColor }}
          title={deal.businessName}
        />
        <span className="ml-auto flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {prev && (
            <button onClick={() => onMove(deal.id, prev)} title={`Move to ${DEAL_STAGE_LABELS[prev]}`} className="btn px-1.5 py-0.5 text-[11px]">
              ←
            </button>
          )}
          {next && (
            <button onClick={() => onMove(deal.id, next)} title={`Move to ${DEAL_STAGE_LABELS[next]}`} className="btn px-1.5 py-0.5 text-[11px]">
              →
            </button>
          )}
          <button onClick={() => onRemove(deal.id)} title="Delete" className="btn px-1.5 py-0.5 text-[11px] hover:border-red-400/50 hover:text-red-400">
            ✕
          </button>
        </span>
      </div>
    </div>
  );
}

function AddDealForm({ businesses }: { businesses: BusinessOption[] }) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [businessId, setBusinessId] = useState(businesses[0]?.id ?? "");
  const [asking, setAsking] = useState("");
  const [contact, setContact] = useState("");
  const [targetClose, setTargetClose] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (!n || pending) return;
    startTransition(async () => {
      await createDeal({
        businessId,
        name: n,
        address: address.trim(),
        askingDollars: asking ? Number(asking) || 0 : 0,
        contact: contact.trim(),
        targetClose: targetClose || null,
      });
      setName("");
      setAddress("");
      setAsking("");
      setContact("");
      setTargetClose("");
    });
  }

  return (
    <form onSubmit={submit} className="card flex flex-wrap items-center gap-2 p-3">
      <input
        className="input min-w-[160px] flex-1 text-sm"
        placeholder="Deal name (e.g. 6416 Conley St)…"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className="input min-w-[160px] flex-1 text-sm"
        placeholder="Address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />
      <select className="input text-sm" value={businessId} onChange={(e) => setBusinessId(e.target.value)}>
        {businesses.map((b) => (
          <option key={b.id} value={b.id}>{b.name}</option>
        ))}
      </select>
      <input
        className="input w-28 text-sm"
        placeholder="$ asking"
        inputMode="decimal"
        value={asking}
        onChange={(e) => setAsking(e.target.value)}
      />
      <input
        className="input w-36 text-sm"
        placeholder="Contact"
        value={contact}
        onChange={(e) => setContact(e.target.value)}
      />
      <label className="flex items-center gap-1.5 text-xs text-ink-faint">
        close
        <input
          type="date"
          className="input text-sm"
          value={targetClose}
          onChange={(e) => setTargetClose(e.target.value)}
        />
      </label>
      <button
        type="submit"
        disabled={pending || !name.trim()}
        className="btn border-indigo-400/50 bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Add deal
      </button>
    </form>
  );
}
