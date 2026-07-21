"use client";

import { useState } from "react";
import Link from "next/link";
import { MicButton, SpeakButton } from "@/components/Voice";

export default function MarketResearchClient({
  businesses,
}: {
  businesses: { id: string; name: string }[];
}) {
  const [businessId, setBusinessId] = useState("");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (!query.trim() || loading) return;
    setLoading(true);
    setError(null);
    setDraft(null);
    try {
      const res = await fetch("/api/tools/market-research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: businessId || undefined, query }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? `Request failed (${res.status}).`);
        return;
      }
      setDraft(data.draft);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <div className="text-xs text-ink-faint">
          <Link href="/tools" className="hover:text-ink-dim">Tools</Link> / Market Research
        </div>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">Market &amp; Competitor Research</h1>
        <p className="mt-1 text-sm text-ink-dim">
          Searches the live web and writes a briefing — competitors, pricing, trends, opportunities.
        </p>
      </div>

      <div className="card space-y-3 p-4">
        <label className="block">
          <span className="mb-1 block text-xs text-ink-faint">Business context (optional)</span>
          <select className="input text-sm" value={businessId} onChange={(e) => setBusinessId(e.target.value)}>
            <option value="">None</option>
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-ink-faint">What do you want researched?</span>
          <textarea
            className="input min-h-[90px] w-full text-sm"
            placeholder="e.g. Who are the main manifestation / self-care subscription box competitors, what do they charge, and what's trending in that niche right now?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="flex items-center gap-3">
          <MicButton onText={(t) => setQuery((v) => (v ? v + " " : "") + t)} />
          <button
            type="button"
            onClick={run}
            disabled={loading || !query.trim()}
            className="btn border-indigo-400/50 bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Researching…" : "Research"}
          </button>
          {error && <span className="text-xs text-red-400">{error}</span>}
        </div>
        {loading && <p className="text-xs text-ink-faint">Searching the web — this can take up to a minute.</p>}
      </div>

      {draft && (
        <div className="card p-4">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-dim">Briefing</h2>
            <span className="ml-auto"><SpeakButton text={draft} /></span>
          </div>
          <pre className="whitespace-pre-wrap rounded bg-surface-raised/60 p-3 font-sans text-sm leading-relaxed">
            {draft}
          </pre>
        </div>
      )}
    </div>
  );
}
