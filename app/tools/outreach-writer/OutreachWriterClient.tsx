"use client";

import { useState } from "react";
import Link from "next/link";
import { MicButton, SpeakButton } from "@/components/Voice";

const TYPES = [
  { value: "cold", label: "Cold intro" },
  { value: "followup", label: "Follow-up" },
  { value: "pitch", label: "Pitch" },
  { value: "reengage", label: "Re-engage" },
  { value: "sequence", label: "3-email sequence" },
];

export default function OutreachWriterClient({
  businesses,
}: {
  businesses: { id: string; name: string }[];
}) {
  const [businessId, setBusinessId] = useState(businesses[0]?.id ?? "");
  const [type, setType] = useState("cold");
  const [context, setContext] = useState("");
  const [draft, setDraft] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function generate() {
    if (!context.trim() || loading) return;
    setLoading(true);
    setError(null);
    setDraft(null);
    try {
      const res = await fetch("/api/tools/outreach-writer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, type, context }),
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
          <Link href="/tools" className="hover:text-ink-dim">Tools</Link> / Outreach Writer
        </div>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">Outreach Writer</h1>
        <p className="mt-1 text-sm text-ink-dim">
          Cold intros, follow-ups, pitches, and re-engagement emails — written in your brand voice.
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
          <label className="block">
            <span className="mb-1 block text-xs text-ink-faint">Type</span>
            <select className="input text-sm" value={type} onChange={(e) => setType(e.target.value)}>
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="block">
          <span className="mb-1 block text-xs text-ink-faint">
            Who are you writing to, and what do you want from them?
          </span>
          <textarea
            className="input min-h-[120px] w-full text-sm"
            placeholder="e.g. A boutique gym owner in Greenpoint who posts inconsistently. I run social content and want to offer a free audit call to land a monthly retainer. We met once at a networking event in June."
            value={context}
            onChange={(e) => setContext(e.target.value)}
          />
        </label>
        <div className="flex items-center gap-3">
          <MicButton onText={(t) => setContext((v) => (v ? v + " " : "") + t)} />
          <button
            type="button"
            onClick={generate}
            disabled={loading || !context.trim()}
            className="btn border-indigo-400/50 bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Writing…" : "Write it"}
          </button>
          {error && <span className="text-xs text-red-400">{error}</span>}
        </div>
      </div>

      {draft && (
        <div className="card p-4">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-dim">Draft</h2>
            <span className="ml-auto flex gap-1.5">
              <SpeakButton text={draft} />
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
