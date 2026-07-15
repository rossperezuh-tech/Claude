"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { createPipelineItem, deletePipelineItem, updatePipelineItem } from "@/app/actions";
import {
  PIPELINE_KINDS,
  PIPELINE_STAGES,
  PIPELINE_STAGE_LABELS,
  type PipelineStage,
} from "@/lib/constants";

export interface PipelineRow {
  id: string;
  name: string;
  kind: string;
  stage: string;
  valueCts: number;
  contact: string;
  notes: string;
  businessName: string;
  businessColor: string;
}

interface BusinessOption {
  id: string;
  name: string;
  color: string;
}

const KIND_STYLES: Record<string, string> = {
  client: "text-sky-400 border-sky-500/30 bg-sky-500/10",
  order: "text-amber-400 border-amber-500/30 bg-amber-500/10",
};

function money(cts: number): string {
  if (cts === 0) return "";
  return (cts / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: cts % 100 === 0 ? 0 : 2,
  });
}

type OptimisticAction =
  | { type: "move"; id: string; stage: string }
  | { type: "remove"; id: string };

export default function PipelineClient({
  businesses,
  items,
}: {
  businesses: BusinessOption[];
  items: PipelineRow[];
}) {
  const [, startTransition] = useTransition();
  const [optimisticItems, applyOptimistic] = useOptimistic(
    items,
    (state: PipelineRow[], action: OptimisticAction) => {
      if (action.type === "remove") return state.filter((i) => i.id !== action.id);
      return state.map((i) => (i.id === action.id ? { ...i, stage: action.stage } : i));
    },
  );

  function move(id: string, stage: string) {
    startTransition(async () => {
      applyOptimistic({ type: "move", id, stage });
      await updatePipelineItem(id, { stage });
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      applyOptimistic({ type: "remove", id });
      await deletePipelineItem(id);
    });
  }

  const totalOpenCts = optimisticItems
    .filter((i) => i.stage !== "DONE")
    .reduce((sum, i) => sum + i.valueCts, 0);

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs text-ink-faint">
          <Link href="/tools" className="hover:text-ink-dim">Tools</Link> / Client &amp; Order Tracker
        </div>
        <div className="mt-1 flex items-baseline justify-between">
          <h1 className="text-xl font-semibold tracking-tight">Client &amp; Order Tracker</h1>
          {totalOpenCts > 0 && (
            <span className="text-xs text-ink-faint">
              {money(totalOpenCts)} in open pipeline
            </span>
          )}
        </div>
      </div>

      <AddItemForm businesses={businesses} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {PIPELINE_STAGES.map((stage) => {
          const col = optimisticItems.filter((i) => i.stage === stage);
          const colCts = col.reduce((sum, i) => sum + i.valueCts, 0);
          return (
            <div key={stage} className="card flex flex-col p-3">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-dim">
                  {PIPELINE_STAGE_LABELS[stage]}
                </h3>
                <span className="text-xs text-ink-faint">
                  {colCts > 0 ? money(colCts) : col.length}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-2">
                {col.map((item) => (
                  <ItemCard key={item.id} item={item} onMove={move} onRemove={remove} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ItemCard({
  item,
  onMove,
  onRemove,
}: {
  item: PipelineRow;
  onMove: (id: string, stage: string) => void;
  onRemove: (id: string) => void;
}) {
  const idx = PIPELINE_STAGES.indexOf(item.stage as PipelineStage);
  const prev = idx > 0 ? PIPELINE_STAGES[idx - 1] : null;
  const next = idx < PIPELINE_STAGES.length - 1 ? PIPELINE_STAGES[idx + 1] : null;

  return (
    <div className="group rounded-md border border-surface-edge bg-surface-overlay/60 p-2.5">
      <div className="flex items-start gap-2">
        <span className={`chip mt-0.5 shrink-0 capitalize ${KIND_STYLES[item.kind] ?? KIND_STYLES.client}`}>
          {item.kind}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-snug">{item.name}</p>
          {item.contact && <p className="mt-0.5 truncate text-xs text-ink-faint">{item.contact}</p>}
          {item.notes && <p className="mt-0.5 text-xs text-ink-faint">{item.notes}</p>}
        </div>
      </div>
      <div className="mt-1.5 flex items-center gap-2 text-[11px] text-ink-faint">
        <span
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ background: item.businessColor }}
          title={item.businessName}
        />
        {item.valueCts > 0 && <span className="font-medium text-emerald-400">{money(item.valueCts)}</span>}
        <span className="ml-auto flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {prev && (
            <button onClick={() => onMove(item.id, prev)} title={`Move to ${PIPELINE_STAGE_LABELS[prev]}`} className="btn px-1.5 py-0.5 text-[11px]">
              ←
            </button>
          )}
          {next && (
            <button onClick={() => onMove(item.id, next)} title={`Move to ${PIPELINE_STAGE_LABELS[next]}`} className="btn px-1.5 py-0.5 text-[11px]">
              →
            </button>
          )}
          <button onClick={() => onRemove(item.id)} title="Delete" className="btn px-1.5 py-0.5 text-[11px] hover:border-red-400/50 hover:text-red-400">
            ✕
          </button>
        </span>
      </div>
    </div>
  );
}

function AddItemForm({ businesses }: { businesses: BusinessOption[] }) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<string>("client");
  const [businessId, setBusinessId] = useState(businesses[0]?.id ?? "");
  const [value, setValue] = useState("");
  const [contact, setContact] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (!n || pending) return;
    startTransition(async () => {
      await createPipelineItem({
        businessId,
        name: n,
        kind,
        valueDollars: value ? Number(value) || 0 : 0,
        contact: contact.trim(),
      });
      setName("");
      setValue("");
      setContact("");
    });
  }

  return (
    <form onSubmit={submit} className="card flex flex-wrap items-center gap-2 p-3">
      <input
        className="input min-w-[180px] flex-1 text-sm"
        placeholder="New client or order…"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <select className="input text-sm capitalize" value={kind} onChange={(e) => setKind(e.target.value)}>
        {PIPELINE_KINDS.map((k) => (
          <option key={k} value={k}>{k}</option>
        ))}
      </select>
      <select className="input text-sm" value={businessId} onChange={(e) => setBusinessId(e.target.value)}>
        {businesses.map((b) => (
          <option key={b.id} value={b.id}>{b.name}</option>
        ))}
      </select>
      <input
        className="input w-24 text-sm"
        placeholder="$ value"
        inputMode="decimal"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <input
        className="input w-40 text-sm"
        placeholder="Contact (optional)"
        value={contact}
        onChange={(e) => setContact(e.target.value)}
      />
      <button
        type="submit"
        disabled={pending || !name.trim()}
        className="btn border-indigo-400/50 bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Add
      </button>
    </form>
  );
}
