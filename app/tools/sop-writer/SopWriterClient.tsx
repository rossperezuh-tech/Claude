"use client";

import { useState } from "react";
import Link from "next/link";

export default function SopWriterClient({
  businesses,
}: {
  businesses: { id: string; name: string }[];
}) {
  const [businessId, setBusinessId] = useState(businesses[0]?.id ?? "");
  const [process, setProcess] = useState("");
  const [draft, setDraft] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function generate() {
    if (!process.trim() || loading) return;
    setLoading(true);
    setError(null);
    setDraft(null);
    try {
      const res = await fetch("/api/tools/sop-writer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, process }),
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
    a.download = "sop.md";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <div className="text-xs text-ink-faint">
          <Link href="/tools" className="hover:text-ink-dim">Tools</Link> / SOP Writer
        </div>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">SOP Writer</h1>
        <p className="mt-1 text-sm text-ink-dim">
          Describe how something gets done in your business — get a step-by-step procedure a new
          hire could follow on day one.
        </p>
      </div>

      <div className="card space-y-3 p-4">
        <label className="block">
          <span className="mb-1 block text-xs text-ink-faint">Business</span>
          <select className="input text-sm" value={businessId} onChange={(e) => setBusinessId(e.target.value)}>
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-ink-faint">
            How does it work today? Ramble is fine — steps, tools, who does what, what goes wrong.
          </span>
          <textarea
            className="input min-h-[140px] w-full text-sm"
            placeholder="e.g. When a new wholesale order comes in: check the tray inventory sheet, confirm delivery day with the restaurant on WhatsApp, harvest morning-of at 5am, pack in the branded clamshells, print invoice from the template, driver drops by 10am…"
            value={process}
            onChange={(e) => setProcess(e.target.value)}
          />
        </label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={generate}
            disabled={loading || !process.trim()}
            className="btn border-indigo-400/50 bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Writing…" : "Write the SOP"}
          </button>
          {error && <span className="text-xs text-red-400">{error}</span>}
        </div>
      </div>

      {draft && (
        <div className="card p-4">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-dim">Draft SOP</h2>
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
        </div>
      )}
    </div>
  );
}
