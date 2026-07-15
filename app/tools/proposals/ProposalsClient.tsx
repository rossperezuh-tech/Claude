"use client";

import { useState } from "react";
import Link from "next/link";

interface BusinessOption {
  id: string;
  name: string;
  color: string;
}

interface PipelineOption {
  id: string;
  name: string;
  kind: string;
  valueCts: number;
  contact: string;
  notes: string;
  businessId: string;
}

export default function ProposalsClient({
  businesses,
  pipelineItems,
}: {
  businesses: BusinessOption[];
  pipelineItems: PipelineOption[];
}) {
  const [mode, setMode] = useState<"proposal" | "invoice">("proposal");
  const [businessId, setBusinessId] = useState(businesses[0]?.id ?? "");
  const [clientName, setClientName] = useState("");
  const [details, setDetails] = useState("");
  const [draft, setDraft] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function prefill(id: string) {
    const item = pipelineItems.find((p) => p.id === id);
    if (!item) return;
    setClientName(item.name);
    setBusinessId(item.businessId);
    const parts: string[] = [];
    if (item.valueCts > 0) parts.push(`Value: $${(item.valueCts / 100).toLocaleString()}`);
    if (item.contact) parts.push(`Contact: ${item.contact}`);
    if (item.notes) parts.push(item.notes);
    if (parts.length > 0) setDetails(parts.join("\n"));
  }

  async function generate() {
    if (!clientName.trim() || !details.trim() || loading) return;
    setLoading(true);
    setError(null);
    setDraft(null);
    setCopied(false);
    try {
      const res = await fetch("/api/tools/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, businessId, clientName, details }),
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

  function download() {
    if (!draft) return;
    const blob = new Blob([draft], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${mode}-${clientName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <div className="text-xs text-ink-faint">
          <Link href="/tools" className="hover:text-ink-dim">Tools</Link> / Proposals &amp; Invoices
        </div>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">Proposals &amp; Invoices</h1>
        <p className="mt-1 text-sm text-ink-dim">
          Turn a pipeline client into a ready-to-send proposal or invoice, written in your brand
          voice.
        </p>
      </div>

      <div className="card space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex overflow-hidden rounded-md border border-surface-edge">
            <button
              type="button"
              onClick={() => setMode("proposal")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                mode === "proposal" ? "bg-indigo-500/20 text-indigo-300" : "text-ink-faint hover:text-ink"
              }`}
            >
              Proposal
            </button>
            <button
              type="button"
              onClick={() => setMode("invoice")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                mode === "invoice" ? "bg-indigo-500/20 text-indigo-300" : "text-ink-faint hover:text-ink"
              }`}
            >
              Invoice
            </button>
          </div>

          {pipelineItems.length > 0 && (
            <select
              className="input text-sm"
              defaultValue=""
              onChange={(e) => {
                prefill(e.target.value);
                e.target.value = "";
              }}
            >
              <option value="" disabled>
                Prefill from pipeline…
              </option>
              {pipelineItems.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.valueCts > 0 ? ` — $${(p.valueCts / 100).toLocaleString()}` : ""}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <label className="block min-w-[200px] flex-1">
            <span className="mb-1 block text-xs text-ink-faint">Client</span>
            <input
              className="input w-full text-sm"
              placeholder="Client or company name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-ink-faint">From business</span>
            <select className="input text-sm" value={businessId} onChange={(e) => setBusinessId(e.target.value)}>
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs text-ink-faint">
            {mode === "invoice"
              ? "What are you billing? (line items + amounts, payment instructions)"
              : "Scope, pricing, timeline — everything the proposal should cover"}
          </span>
          <textarea
            className="input min-h-[110px] w-full text-sm"
            placeholder={
              mode === "invoice"
                ? "Content package May — $1,500\n2 extra reels — $400\nPay by Zelle to…"
                : "3-month content package: 12 reels + 8 carousels/mo, monthly strategy call, $1,500/mo, can start first week of August…"
            }
            value={details}
            onChange={(e) => setDetails(e.target.value)}
          />
        </label>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={generate}
            disabled={loading || !clientName.trim() || !details.trim()}
            className="btn border-indigo-400/50 bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Drafting…" : mode === "invoice" ? "Generate invoice" : "Generate proposal"}
          </button>
          {error && <span className="text-xs text-red-400">{error}</span>}
        </div>
      </div>

      {draft && (
        <div className="card p-4">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-dim">
              Draft {mode}
            </h2>
            <span className="ml-auto flex gap-1.5">
              <button
                type="button"
                className="btn text-xs"
                onClick={async () => {
                  await navigator.clipboard.writeText(draft);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
              >
                {copied ? "Copied ✓" : "Copy"}
              </button>
              <button type="button" className="btn text-xs" onClick={download}>
                Download .md
              </button>
            </span>
          </div>
          <pre className="max-h-[32rem] overflow-y-auto whitespace-pre-wrap rounded bg-surface-raised/60 p-3 font-sans text-sm leading-relaxed">
            {draft}
          </pre>
          <p className="mt-2 text-xs text-ink-faint">
            Review before sending — amounts and terms are drafted from what you wrote above.
          </p>
        </div>
      )}
    </div>
  );
}
