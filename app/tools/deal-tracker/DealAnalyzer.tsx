"use client";

import { useState, useTransition } from "react";
import { createTasksBulk } from "@/app/actions";
import { PRIORITY_COLORS, type Priority } from "@/lib/constants";
import type { DealAnalysis } from "@/app/api/tools/deal-analyzer/route";

interface BusinessOption {
  id: string;
  name: string;
  color: string;
}

interface DealOption {
  id: string;
  name: string;
  businessId?: string;
}

const SEVERITY_STYLES: Record<string, string> = {
  high: "text-red-400 border-red-500/30 bg-red-500/10",
  medium: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  low: "text-sky-400 border-sky-500/30 bg-sky-500/10",
};

export default function DealAnalyzer({
  businesses,
  deals,
}: {
  businesses: BusinessOption[];
  deals: DealOption[];
}) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [dealId, setDealId] = useState("");
  const [businessId, setBusinessId] = useState(businesses[0]?.id ?? "");
  const [analysis, setAnalysis] = useState<DealAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addedCount, setAddedCount] = useState<number | null>(null);
  const [adding, startTransition] = useTransition();

  async function analyze() {
    if (!notes.trim() || loading) return;
    setLoading(true);
    setError(null);
    setAnalysis(null);
    setAddedCount(null);
    try {
      const res = await fetch("/api/tools/deal-analyzer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes, dealId: dealId || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? `Request failed (${res.status}).`);
        return;
      }
      setAnalysis(data.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function addChecklist() {
    if (!analysis || adding) return;
    startTransition(async () => {
      const n = await createTasksBulk(
        businessId,
        analysis.due_diligence.map((t) => ({
          title: t.title,
          notes: t.details,
          priority: t.priority,
        })),
      );
      setAddedCount(n ?? 0);
    });
  }

  if (!open) {
    return (
      <button type="button" className="btn text-xs" onClick={() => setOpen(true)}>
        ✦ Analyze a deal with AI
      </button>
    );
  }

  return (
    <div className="card space-y-3 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-dim">
          Deal Analyzer
        </h2>
        <button type="button" className="btn px-2 py-0.5 text-xs" onClick={() => setOpen(false)}>
          ✕
        </button>
      </div>
      <p className="text-xs text-ink-faint">
        Paste a listing, seller call notes, or property details — get red flags, seller
        questions, a due-diligence checklist, and an offer read. No numbers are invented.
      </p>
      <textarea
        className="input min-h-[110px] w-full text-sm"
        placeholder="e.g. 9,600 sqft warehouse off Eastex Fwy. Owner says roof 'has a few years left'. Tenant on month-to-month at $4,200. Asking $1.45M, wants to close in 30 days, mentioned a tax issue twice…"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <div className="flex flex-wrap items-center gap-2">
        {deals.length > 0 && (
          <select className="input text-sm" value={dealId} onChange={(e) => setDealId(e.target.value)}>
            <option value="">Not linked to a tracked deal</option>
            {deals.map((d) => (
              <option key={d.id} value={d.id}>Context: {d.name}</option>
            ))}
          </select>
        )}
        <button
          type="button"
          onClick={analyze}
          disabled={loading || !notes.trim()}
          className="btn border-indigo-400/50 bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Analyzing…" : "Analyze"}
        </button>
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>

      {analysis && (
        <div className="space-y-3 border-t border-surface-edge pt-3">
          <p className="text-sm leading-relaxed text-ink-dim">{analysis.summary}</p>

          {analysis.red_flags.length > 0 && (
            <div>
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-red-400">
                Red flags
              </h3>
              <ul className="space-y-1.5">
                {analysis.red_flags.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className={`chip mt-0.5 shrink-0 ${SEVERITY_STYLES[f.severity] ?? SEVERITY_STYLES.low}`}>
                      {f.severity}
                    </span>
                    <span className="text-ink-dim">{f.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.questions_for_seller.length > 0 && (
            <div>
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-sky-400">
                Ask the seller
              </h3>
              <ul className="list-inside list-disc space-y-1 text-sm text-ink-dim">
                {analysis.questions_for_seller.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>
          )}

          {analysis.due_diligence.length > 0 && (
            <div>
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-ink-dim">
                Due diligence checklist
              </h3>
              <ul className="divide-y divide-surface-edge/60">
                {analysis.due_diligence.map((t, i) => {
                  const pColor = PRIORITY_COLORS[t.priority as Priority] ?? "#9aa5b8";
                  return (
                    <li key={i} className="flex items-start gap-2.5 py-1.5">
                      <span className="chip mt-0.5 shrink-0 border-transparent" style={{ color: pColor, background: `${pColor}1a` }}>
                        {t.priority}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-snug">{t.title}</p>
                        {t.details && <p className="mt-0.5 text-xs text-ink-faint">{t.details}</p>}
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {addedCount === null ? (
                  <>
                    <select className="input text-sm" value={businessId} onChange={(e) => setBusinessId(e.target.value)}>
                      {businesses.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={addChecklist}
                      disabled={adding}
                      className="btn text-xs disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {adding ? "Adding…" : `Add ${analysis.due_diligence.length} checklist items to backlog`}
                    </button>
                  </>
                ) : (
                  <span className="text-sm text-emerald-400">Added {addedCount} tasks to the backlog.</span>
                )}
              </div>
            </div>
          )}

          <div>
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Offer strategy
            </h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-dim">
              {analysis.offer_strategy}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
