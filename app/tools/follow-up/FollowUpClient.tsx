"use client";

import { useState } from "react";
import Link from "next/link";
import { SpeakButton } from "@/components/Voice";

export default function FollowUpClient() {
  const [draft, setDraft] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (loading) return;
    setLoading(true);
    setError(null);
    setDraft(null);
    try {
      const res = await fetch("/api/tools/follow-up", { method: "POST" });
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
          <Link href="/tools" className="hover:text-ink-dim">Tools</Link> / Follow-Up Assistant
        </div>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">Follow-Up Assistant</h1>
        <p className="mt-1 text-sm text-ink-dim">
          Finds the clients, leads, and deals that have gone quiet, and drafts the nudge to send.
        </p>
      </div>

      <div className="card flex items-center gap-3 p-4">
        <button
          type="button"
          onClick={run}
          disabled={loading}
          className="btn border-indigo-400/50 bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Checking…" : "Who should I follow up with?"}
        </button>
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>

      {draft && (
        <div className="card p-4">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-dim">Follow-ups</h2>
            <span className="ml-auto">
              <SpeakButton text={draft} />
            </span>
          </div>
          <pre className="whitespace-pre-wrap rounded bg-surface-raised/60 p-3 font-sans text-sm leading-relaxed">
            {draft}
          </pre>
        </div>
      )}
    </div>
  );
}
