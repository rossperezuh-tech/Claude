"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createGoal, updateGoal, deleteGoal } from "@/app/actions";

type Biz = { id: string; name: string; color: string };
type Goal = {
  id: string;
  title: string;
  targetNum: number;
  currentNum: number;
  unit: string;
  dueDate: string | null;
  status: string;
  business: { name: string; color: string };
};

export default function GoalsClient({ businesses, goals }: { businesses: Biz[]; goals: Goal[] }) {
  const [open, setOpen] = useState(false);
  const [businessId, setBusinessId] = useState(businesses[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("");
  const [unit, setUnit] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [, startTransition] = useTransition();

  function add() {
    if (!title.trim() || !businessId) return;
    startTransition(() =>
      createGoal({
        businessId,
        title,
        targetNum: parseFloat(target) || 0,
        currentNum: parseFloat(current) || 0,
        unit,
        dueDate: dueDate || null,
      }),
    );
    setTitle(""); setTarget(""); setCurrent(""); setUnit(""); setDueDate(""); setOpen(false);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <div className="text-xs text-ink-faint">
          <Link href="/tools" className="hover:text-ink-dim">Tools</Link> / Goals &amp; KPI Tracker
        </div>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">Goals &amp; KPI Tracker</h1>
        <p className="mt-1 text-sm text-ink-dim">Set targets per venture and track progress toward them.</p>
      </div>

      {!open ? (
        <button onClick={() => setOpen(true)} className="btn text-sm">+ Add goal</button>
      ) : (
        <div className="card flex flex-wrap items-end gap-2 p-3">
          <select className="input text-sm" value={businessId} onChange={(e) => setBusinessId(e.target.value)}>
            {businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <input className="input flex-1 text-sm" placeholder="Goal (e.g. Monthly revenue)" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input className="input w-24 text-sm" placeholder="Now" inputMode="decimal" value={current} onChange={(e) => setCurrent(e.target.value)} />
          <span className="text-ink-faint">/</span>
          <input className="input w-24 text-sm" placeholder="Target" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} />
          <input className="input w-24 text-sm" placeholder="Unit ($, %)" value={unit} onChange={(e) => setUnit(e.target.value)} />
          <input type="date" className="input text-sm" value={dueDate} onChange={(e) => setDueDate(e.target.value)} title="Target date" />
          <button onClick={add} disabled={!title.trim()} className="btn border-indigo-400/50 bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 disabled:opacity-50">Save</button>
          <button onClick={() => setOpen(false)} className="btn text-ink-faint">Cancel</button>
        </div>
      )}

      <div className="space-y-2">
        {goals.length === 0 ? (
          <p className="card p-4 text-sm text-ink-faint">No goals yet. Add one above.</p>
        ) : (
          goals.map((g) => {
            const pct = g.targetNum > 0 ? Math.min(100, Math.round((g.currentNum / g.targetNum) * 100)) : 0;
            const done = g.status === "DONE" || (g.targetNum > 0 && g.currentNum >= g.targetNum);
            return (
              <div key={g.id} className="card p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="chip shrink-0 border-transparent" style={{ color: g.business.color, background: `${g.business.color}1a` }}>{g.business.name}</span>
                  <span className="text-sm font-medium">{g.title}</span>
                  {done && <span className="chip border-emerald-500/40 bg-emerald-500/10 text-emerald-300">Hit ✓</span>}
                  {g.dueDate && <span className="text-xs text-ink-faint">by {new Date(g.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
                  <span className="ml-auto flex items-center gap-2">
                    <input
                      type="number"
                      defaultValue={g.currentNum}
                      onBlur={(e) => {
                        const v = parseFloat(e.target.value);
                        if (!Number.isNaN(v) && v !== g.currentNum) startTransition(() => updateGoal(g.id, { currentNum: v }));
                      }}
                      className="input w-20 text-xs"
                      title="Update current"
                    />
                    <span className="text-xs text-ink-faint">/ {g.targetNum}{g.unit ? ` ${g.unit}` : ""}</span>
                    <button onClick={() => startTransition(() => deleteGoal(g.id))} title="Delete" className="text-xs text-ink-faint hover:text-red-400">✕</button>
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-overlay">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: done ? "#34d399" : g.business.color }} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
