"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createTasksBulk } from "@/app/actions";
import { MicButton } from "@/components/Voice";

type Biz = { id: string; name: string; slug: string; color: string };
type Task = { title: string; business: string; dueDate: string; notes: string };
// A task with a resolved businessId the user can change.
type Row = { title: string; businessId: string; dueDate: string; notes: string };

export default function TaskCreatorClient({ businesses }: { businesses: Biz[] }) {
  const [text, setText] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [excluded, setExcluded] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addedCount, setAddedCount] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  const bySlug = new Map(businesses.map((b) => [b.slug, b.id]));
  const bizById = new Map(businesses.map((b) => [b.id, b]));
  const fallbackId = businesses[0]?.id ?? "";

  async function extract() {
    if (!text.trim() || loading) return;
    setLoading(true);
    setError(null);
    setRows(null);
    setAddedCount(null);
    setExcluded(new Set());
    try {
      const res = await fetch("/api/tools/task-creator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? `Request failed (${res.status}).`);
        return;
      }
      const mapped: Row[] = (data.tasks as Task[]).map((t) => ({
        title: t.title,
        businessId: bySlug.get(t.business) ?? fallbackId,
        dueDate: t.dueDate,
        notes: t.notes,
      }));
      setRows(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function toggle(i: number) {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  function setRowBiz(i: number, businessId: string) {
    setRows((prev) => prev && prev.map((r, idx) => (idx === i ? { ...r, businessId } : r)));
  }

  function addAll() {
    if (!rows) return;
    const chosen = rows.filter((_, i) => !excluded.has(i));
    if (chosen.length === 0) return;
    // Group by business, then bulk-create per business.
    const groups = new Map<string, Row[]>();
    for (const r of chosen) {
      const arr = groups.get(r.businessId) ?? [];
      arr.push(r);
      groups.set(r.businessId, arr);
    }
    startTransition(async () => {
      let total = 0;
      for (const [businessId, items] of Array.from(groups.entries())) {
        const n = await createTasksBulk(
          businessId,
          items.map((r) => ({ title: r.title, notes: r.notes, dueDate: r.dueDate || null })),
        );
        total += n ?? 0;
      }
      setAddedCount(total);
      setRows(null);
      setText("");
    });
  }

  const chosenCount = rows ? rows.length - excluded.size : 0;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <div className="text-xs text-ink-faint">
          <Link href="/tools" className="hover:text-ink-dim">Tools</Link> / Task Creator
        </div>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">Task Creator</h1>
        <p className="mt-1 text-sm text-ink-dim">
          Paste anything — a plan, an email, notes, a to-do dump. It pulls out all the tasks, sets
          due dates, and routes each one to the right business.
        </p>
      </div>

      <div className="card space-y-3 p-4">
        <textarea
          className="input min-h-[160px] w-full text-sm"
          placeholder="Paste here… e.g. 'For Brooklyn Tea Cigs, confirm suppliers by Friday and write 3 launch posts. For Penthouse Yoga, print new waivers and email the June schedule next week.'"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex items-center gap-3">
          <MicButton onText={(t) => setText((v) => (v ? v + " " : "") + t)} />
          <button
            type="button"
            onClick={extract}
            disabled={loading || !text.trim()}
            className="btn border-indigo-400/50 bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Reading…" : "Find the tasks"}
          </button>
          {error && <span className="text-xs text-red-400">{error}</span>}
        </div>
      </div>

      {addedCount !== null && (
        <div className="card border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-200">
          Added {addedCount} task{addedCount === 1 ? "" : "s"} ✓
        </div>
      )}

      {rows && (
        <div className="card space-y-3 p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-dim">
              {rows.length} task{rows.length === 1 ? "" : "s"} found
            </h2>
            <button
              onClick={addAll}
              disabled={chosenCount === 0}
              className="btn border-emerald-500/40 bg-emerald-500/10 text-sm text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50"
            >
              Add {chosenCount}
            </button>
          </div>
          {rows.length === 0 ? (
            <p className="text-sm text-ink-faint">No clear tasks found. Try adding more detail.</p>
          ) : (
            <ul className="divide-y divide-surface-edge/60">
              {rows.map((r, i) => {
                const biz = bizById.get(r.businessId);
                return (
                  <li key={i} className="flex flex-wrap items-start gap-2.5 py-2">
                    <input
                      type="checkbox"
                      checked={!excluded.has(i)}
                      onChange={() => toggle(i)}
                      className="mt-1 accent-indigo-400"
                    />
                    <div className="min-w-0 flex-1">
                      <span className={`text-sm ${excluded.has(i) ? "text-ink-faint line-through" : ""}`}>
                        {r.title}
                      </span>
                      {r.notes && <p className="text-xs text-ink-faint">{r.notes}</p>}
                    </div>
                    {r.dueDate && (
                      <span className="shrink-0 self-center text-xs text-ink-dim">
                        {new Date(r.dueDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    )}
                    <select
                      value={r.businessId}
                      onChange={(e) => setRowBiz(i, e.target.value)}
                      className="input shrink-0 py-1 text-xs"
                      style={biz ? { color: biz.color } : undefined}
                    >
                      {businesses.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
