"use client";

import { useState, useTransition } from "react";
import { addDealActivity, deleteDealActivity } from "@/app/actions";

export type TimelineItem = { id: string; kind: string; body: string; when: string };

const KIND_STYLE: Record<string, string> = {
  NOTE: "text-ink-dim border-surface-edge",
  CALL: "text-sky-400 border-sky-500/30 bg-sky-500/10",
  STAGE: "text-violet-400 border-violet-500/30 bg-violet-500/10",
  OFFER: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  SYSTEM: "text-ink-faint border-surface-edge",
};

export default function DealTimeline({ dealId, items }: { dealId: string; items: TimelineItem[] }) {
  const [body, setBody] = useState("");
  const [kind, setKind] = useState("NOTE");
  const [, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    setBody("");
    startTransition(() => addDealActivity(dealId, kind, text));
  }

  return (
    <div>
      <form onSubmit={submit} className="mb-3 flex gap-2">
        <select value={kind} onChange={(e) => setKind(e.target.value)} className="input cursor-pointer text-xs">
          <option value="NOTE">Note</option>
          <option value="CALL">Call</option>
        </select>
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What happened?"
          className="input min-w-0 flex-1"
        />
        <button type="submit" className="btn text-xs">Log</button>
      </form>
      <ul className="divide-y divide-surface-edge/60">
        {items.length === 0 && <li className="py-2 text-sm text-ink-faint">Nothing logged yet.</li>}
        {items.map((a) => (
          <li key={a.id} className="group flex items-start gap-2.5 py-2">
            <span className={`chip mt-0.5 shrink-0 capitalize ${KIND_STYLE[a.kind] ?? KIND_STYLE.NOTE}`}>
              {a.kind.toLowerCase()}
            </span>
            <p className="min-w-0 flex-1 text-sm leading-snug">{a.body}</p>
            <span className="shrink-0 text-xs text-ink-faint">{a.when}</span>
            {(a.kind === "NOTE" || a.kind === "CALL") && (
              <button
                onClick={() => startTransition(() => deleteDealActivity(a.id))}
                title="Delete"
                className="text-xs text-ink-faint opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
              >
                ✕
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
