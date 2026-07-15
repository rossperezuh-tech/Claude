"use client";

import { useState } from "react";
import Link from "next/link";

export default function ClientReportClient({
  businesses,
}: {
  businesses: { id: string; name: string }[];
}) {
  const [businessId, setBusinessId] = useState(businesses[0]?.id ?? "");
  const [clientName, setClientName] = useState("");
  const [days, setDays] = useState("30");
  const [extra, setExtra] = useState("");
  const [draft, setDraft] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function generate() {
    if (loading) return;
    setLoading(true);
    setError(null);
    setDraft(null);
    try {
      const res = await fetch("/api/tools/client-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, clientName, extra, days: Number(days) }),
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
    a.download = "client-report.md";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <div className="text-xs text-ink-faint">
          <Link href="/tools" className="hover:text-ink-dim">Tools</Link> / Client Report
        </div>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">Client Report</h1>
        <p className="mt-1 text-sm text-ink-dim">
          Generates the &quot;here&apos;s what we did for you&quot; report from a venture&apos;s
          real activity — completed work, published content, engagements in motion.
        </p>
      </div>

      <div className="card space-y-3 p-4">
        <div className="flex flex-wrap gap-3">
          <label className="block">
            <span className="mb-1 block text-xs text-ink-faint">Business</span>
            <select className="input text-sm" value={businessId} onChange={(e) => setBusinessId(e.target.value)}>
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </label>
          <label className="block min-w-[180px] flex-1">
            <span className="mb-1 block text-xs text-ink-faint">For client (optional — filters engagements)</span>
            <input
              className="input w-full text-sm"
              placeholder="e.g. GlowCo Skincare"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-ink-faint">Period</span>
            <select className="input text-sm" value={days} onChange={(e) => setDays(e.target.value)}>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </label>
        </div>
        <label className="block">
          <span className="mb-1 block text-xs text-ink-faint">
            Anything to highlight? (wins, context, numbers you want included)
          </span>
          <input
            className="input w-full text-sm"
            placeholder="e.g. the reel from July 3rd hit 40k views — mention it"
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
          />
        </label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={generate}
            disabled={loading}
            className="btn border-indigo-400/50 bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Compiling…" : "Generate report"}
          </button>
          {error && <span className="text-xs text-red-400">{error}</span>}
        </div>
      </div>

      {draft && (
        <div className="card p-4">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-dim">
              Draft report
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
            Review before sending — it only knows what&apos;s tracked in HQ.
          </p>
        </div>
      )}
    </div>
  );
}
