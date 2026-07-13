"use client";

import { useState } from "react";
import Link from "next/link";
import { createTasksBulk } from "@/app/actions";
import { PRIORITY_COLORS, type Priority } from "@/lib/constants";

interface Business {
  id: string;
  name: string;
  color: string;
}

interface ActionItem {
  title: string;
  details: string;
  owner: string;
  due_date: string;
  due_hint: string;
  priority: Priority;
}

interface NotesResult {
  summary: string;
  decisions: string[];
  action_items: ActionItem[];
  open_questions: string[];
}

type State =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "done"; result: NotesResult };

export default function MeetingNotesClient({ businesses }: { businesses: Business[] }) {
  const [notes, setNotes] = useState("");
  const [state, setState] = useState<State>({ phase: "idle" });
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [businessId, setBusinessId] = useState(businesses[0]?.id ?? "");
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  async function analyze() {
    setState({ phase: "loading" });
    setExportStatus(null);
    try {
      const res = await fetch("/api/tools/meeting-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState({ phase: "error", message: data.error ?? `Request failed (${res.status}).` });
        return;
      }
      const result: NotesResult = data.result;
      setSelected(new Set(result.action_items.map((_, i) => i)));
      setState({ phase: "done", result });
    } catch (err) {
      setState({
        phase: "error",
        message: err instanceof Error ? err.message : "Something went wrong.",
      });
    }
  }

  function toggle(i: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  async function exportTasks() {
    if (state.phase !== "done" || !businessId) return;
    setExporting(true);
    setExportStatus(null);
    try {
      const items = state.result.action_items
        .filter((_, i) => selected.has(i))
        .map((item) => ({
          title: item.owner ? `${item.title} (${item.owner})` : item.title,
          notes: [item.details, item.due_hint && `Due: ${item.due_hint}`]
            .filter(Boolean)
            .join("\n"),
          priority: item.priority,
          dueDate: item.due_date || null,
        }));
      const count = await createTasksBulk(businessId, items);
      const name = businesses.find((b) => b.id === businessId)?.name ?? "business";
      setExportStatus(`Added ${count} task${count === 1 ? "" : "s"} to ${name}.`);
    } catch {
      setExportStatus("Failed to create tasks — try again.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <div className="text-xs text-ink-faint">
          <Link href="/tools" className="hover:text-ink-dim">
            Tools
          </Link>{" "}
          / Meeting Notes
        </div>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">Meeting Notes</h1>
        <p className="mt-1 text-sm text-ink-dim">
          Paste raw meeting or call notes — get a summary, decisions, and a to-do list you can push
          straight into a business&apos;s tasks.
        </p>
      </div>

      <div className="card space-y-3 p-4">
        <textarea
          className="input min-h-[180px] w-full resize-y text-sm leading-relaxed"
          placeholder="Paste meeting notes, call transcript, or voice-note dump here…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <div className="flex items-center gap-3">
          <button
            className="btn border-indigo-400/50 bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={state.phase === "loading" || !notes.trim()}
            onClick={analyze}
            type="button"
          >
            {state.phase === "loading" ? "Processing…" : "Extract to-dos"}
          </button>
          {state.phase === "loading" && (
            <span className="text-xs text-ink-faint">Reading the notes…</span>
          )}
        </div>
        {state.phase === "error" && (
          <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {state.message}
          </p>
        )}
      </div>

      {state.phase === "done" && (
        <div className="space-y-4">
          <section className="card space-y-2 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-dim">Summary</h2>
            <p className="text-sm leading-relaxed">{state.result.summary}</p>
            {state.result.decisions.length > 0 && (
              <>
                <h3 className="pt-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                  Decisions
                </h3>
                <ul className="list-inside list-disc space-y-1 text-sm text-ink-dim">
                  {state.result.decisions.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </>
            )}
          </section>

          {state.result.action_items.length > 0 && (
            <section className="card space-y-3 p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-dim">
                Action items
              </h2>
              <ul className="space-y-2">
                {state.result.action_items.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1 accent-indigo-400"
                      checked={selected.has(i)}
                      onChange={() => toggle(i)}
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">{item.title}</span>
                        <span
                          className="chip border-transparent"
                          style={{
                            color: PRIORITY_COLORS[item.priority],
                            backgroundColor: `${PRIORITY_COLORS[item.priority]}22`,
                          }}
                        >
                          {item.priority}
                        </span>
                        {item.owner && (
                          <span className="chip border-surface-edge bg-surface-overlay text-ink-dim">
                            {item.owner}
                          </span>
                        )}
                        {(item.due_date || item.due_hint) && (
                          <span className="text-xs text-amber-400">
                            {item.due_date || item.due_hint}
                          </span>
                        )}
                      </div>
                      {item.details && (
                        <p className="mt-0.5 text-xs text-ink-faint">{item.details}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap items-center gap-2 border-t border-surface-edge pt-3">
                <select
                  className="input"
                  value={businessId}
                  onChange={(e) => setBusinessId(e.target.value)}
                >
                  {businesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <button
                  className="btn border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={exporting || selected.size === 0 || !businessId}
                  onClick={exportTasks}
                  type="button"
                >
                  {exporting
                    ? "Adding…"
                    : `Add ${selected.size} task${selected.size === 1 ? "" : "s"} to backlog`}
                </button>
                {exportStatus && <span className="text-xs text-ink-dim">{exportStatus}</span>}
              </div>
            </section>
          )}

          {state.result.open_questions.length > 0 && (
            <section className="card p-4">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-dim">
                Open questions
              </h2>
              <ul className="list-inside list-disc space-y-1 text-sm text-ink-dim">
                {state.result.open_questions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
