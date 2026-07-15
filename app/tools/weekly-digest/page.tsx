"use client";

import { useState } from "react";
import Link from "next/link";
import type { WeeklyDigest } from "@/app/api/tools/weekly-digest/route";

export default function WeeklyDigestPage() {
  const [digest, setDigest] = useState<WeeklyDigest | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tools/weekly-digest", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? `Request failed (${res.status}).`);
        return;
      }
      setDigest(data.digest);
      setGeneratedAt(data.generatedAt);
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
          <Link href="/tools" className="hover:text-ink-dim">Tools</Link> / Weekly Digest
        </div>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">Weekly Digest</h1>
        <p className="mt-1 text-sm text-ink-dim">
          Your Monday briefing: what happened last week and what needs attention next, across
          every venture.
        </p>
      </div>

      <div className="card flex items-center gap-3 p-4">
        <button
          type="button"
          onClick={generate}
          disabled={loading}
          className="btn border-indigo-400/50 bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Reading the week…" : digest ? "Regenerate" : "Generate this week's digest"}
        </button>
        {generatedAt && !loading && (
          <span className="text-xs text-ink-faint">
            generated {new Date(generatedAt).toLocaleString()}
          </span>
        )}
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>

      {digest && (
        <div className="space-y-3">
          <div className="card border-indigo-400/30 p-4">
            <p className="text-sm font-medium leading-relaxed text-indigo-200">{digest.headline}</p>
          </div>

          {digest.focus.length > 0 && (
            <div className="card p-4">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-ink-dim">
                This week&apos;s focus
              </h2>
              <ol className="list-inside list-decimal space-y-1.5 text-sm leading-relaxed">
                {digest.focus.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ol>
            </div>
          )}

          {digest.businesses.map((b, i) => (
            <div key={i} className="card p-4">
              <h2 className="mb-2 text-sm font-semibold">{b.name}</h2>
              {b.what_happened.length > 0 && (
                <div className="mb-2">
                  <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                    Happened
                  </h3>
                  <ul className="list-inside list-disc space-y-0.5 text-sm text-ink-dim">
                    {b.what_happened.map((x, j) => (
                      <li key={j}>{x}</li>
                    ))}
                  </ul>
                </div>
              )}
              {b.whats_next.length > 0 && (
                <div className="mb-2">
                  <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-sky-400">
                    Next
                  </h3>
                  <ul className="list-inside list-disc space-y-0.5 text-sm text-ink-dim">
                    {b.whats_next.map((x, j) => (
                      <li key={j}>{x}</li>
                    ))}
                  </ul>
                </div>
              )}
              {b.flags.length > 0 && (
                <div>
                  <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-amber-400">
                    Flags
                  </h3>
                  <ul className="list-inside list-disc space-y-0.5 text-sm text-amber-200/80">
                    {b.flags.map((x, j) => (
                      <li key={j}>{x}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
