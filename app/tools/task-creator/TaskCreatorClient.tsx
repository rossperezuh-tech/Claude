"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createTasksBulk } from "@/app/actions";
import { MicButton } from "@/components/Voice";

type Task = { title: string; dueDate: string; notes: string };

export default function TaskCreatorClient({
  businesses,
}: {
  businesses: { id: string; name: string }[];
}) {
  const [businessId, setBusinessId] = useState(businesses[0]?.id ?? "");
  const [text, setText] = useState("");
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [excluded, setExcluded] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addedCount, setAddedCount] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  async function extract() {
    if (!text.trim() || loading) return;
    setLoading(true);
    setError(null);
    setTasks(null);
    setAddedCount(null);
    setExcluded(new Set());
    try {
      const res = await fetch("/api/tools/task-creator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? `Request failed (${res.status}).`);
        return;
      }
      setTasks(data.tasks);
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

  function addAll() {
    if (!tasks) return;
    const chosen = tasks
      .filter((_, i) => !excluded.has(i))
      .map((t) => ({ title: t.title, notes: t.notes, dueDate: t.dueDate || null }));
    if (chosen.length === 0) return;
    startTransition(async () => {
      const n = await createTasksBulk(businessId, chosen);
      setAddedCount(n ?? 0);
      setTasks(null);
      setText("");
    });
  }

  const chosenCount = tasks ? tasks.length - excluded.size : 0;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <div className="text-xs text-ink-faint">
          <Link href="/tools" className="hover:text-ink-dim">Tools</Link> / Task Creator
        </div>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">Task Creator</h1>
        <p className="mt-1 text-sm text-ink-dim">
          Paste anything — a plan, an email, notes, a to-do dump — and it pulls out all the tasks,
          with due dates, ready to add.
        </p>
      </div>

      <div className="card space-y-3 p-4">
        <label className="block">
          <span className="mb-1 block text-xs text-ink-faint">Add tasks to</span>
          <select className="input text-sm" value={businessId} onChange={(e) => setBusinessId(e.target.value)}>
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </label>
        <textarea
          className="input min-h-[160px] w-full text-sm"
          placeholder="Paste here… e.g. 'For the June launch: confirm suppliers by Friday, design packaging next week, write 3 launch posts, email the wholesale list, and set up pre-orders by the 15th.'"
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

      {tasks && (
        <div className="card space-y-3 p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-dim">
              {tasks.length} task{tasks.length === 1 ? "" : "s"} found
            </h2>
            <button
              onClick={addAll}
              disabled={chosenCount === 0}
              className="btn border-emerald-500/40 bg-emerald-500/10 text-sm text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50"
            >
              Add {chosenCount} to backlog
            </button>
          </div>
          {tasks.length === 0 ? (
            <p className="text-sm text-ink-faint">No clear tasks found. Try adding more detail.</p>
          ) : (
            <ul className="divide-y divide-surface-edge/60">
              {tasks.map((t, i) => (
                <li key={i} className="flex items-start gap-2.5 py-2">
                  <input
                    type="checkbox"
                    checked={!excluded.has(i)}
                    onChange={() => toggle(i)}
                    className="mt-1 accent-indigo-400"
                  />
                  <div className="min-w-0 flex-1">
                    <span className={`text-sm ${excluded.has(i) ? "text-ink-faint line-through" : ""}`}>
                      {t.title}
                    </span>
                    {t.notes && <p className="text-xs text-ink-faint">{t.notes}</p>}
                  </div>
                  {t.dueDate && (
                    <span className="shrink-0 text-xs text-ink-dim">
                      {new Date(t.dueDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
