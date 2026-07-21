"use client";

import { useMemo, useState, useTransition } from "react";
import { MicButton } from "@/components/Voice";
import Link from "next/link";
import { applyBrainDump } from "@/app/actions";
import {
  PLATFORM_COLORS,
  PLATFORM_LABELS,
  PRIORITY_COLORS,
  type ContentPlatform,
  type Priority,
} from "@/lib/constants";
import type { BrainDumpResult } from "@/app/api/tools/brain-dump/route";

interface BusinessOption {
  slug: string;
  name: string;
  color: string;
}

const PLACEHOLDER = `ok so today — need to pay the yoga rent tomorrow it's late, and someone named Dana emailed about a 3-month content package for her skincare brand, maybe $4.5k, dana@glowco.com. sold 6 microgreen trays to the new thai place ($90). idea: reel about how we harvest at 5am. also MUST file the form D amendment this week, P1…`;

export default function BrainDumpClient({ businesses }: { businesses: BusinessOption[] }) {
  const [text, setText] = useState("");
  const [result, setResult] = useState<BrainDumpResult | null>(null);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedCount, setAppliedCount] = useState<number | null>(null);
  const [applying, startTransition] = useTransition();

  const bizBySlug = useMemo(
    () => new Map(businesses.map((b) => [b.slug, b])),
    [businesses],
  );

  async function sort() {
    if (!text.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setAppliedCount(null);
    setExcluded(new Set());
    try {
      const res = await fetch("/api/tools/brain-dump", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? `Request failed (${res.status}).`);
        return;
      }
      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function toggle(key: string) {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const included = useMemo(() => {
    if (!result) return null;
    return {
      tasks: result.tasks.filter((_, i) => !excluded.has(`t${i}`)),
      content_ideas: result.content_ideas.filter((_, i) => !excluded.has(`c${i}`)),
      leads: result.leads.filter((_, i) => !excluded.has(`l${i}`)),
      money: result.money.filter((_, i) => !excluded.has(`m${i}`)),
    };
  }, [result, excluded]);

  const includedCount = included
    ? included.tasks.length + included.content_ideas.length + included.leads.length + included.money.length
    : 0;

  function apply() {
    if (!included || includedCount === 0 || applying) return;
    startTransition(async () => {
      const n = await applyBrainDump(included);
      setAppliedCount(n);
    });
  }

  function BizDot({ slug }: { slug: string }) {
    const b = bizBySlug.get(slug);
    return (
      <span
        className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ background: b?.color ?? "#9aa5b8" }}
        title={b?.name ?? slug}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <div className="text-xs text-ink-faint">
          <Link href="/tools" className="hover:text-ink-dim">Tools</Link> / Brain Dump
        </div>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">Brain Dump</h1>
        <p className="mt-1 text-sm text-ink-dim">
          Empty your head into one box — tasks, ideas, leads, and money get sorted to the right
          venture automatically. You approve before anything is saved.
        </p>
      </div>

      <div className="card space-y-3 p-4">
        <textarea
          className="input min-h-[140px] w-full text-sm"
          placeholder={PLACEHOLDER}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex items-center gap-3">
          <MicButton onText={(t) => setText((v) => (v ? v + " " : "") + t)} />
          <button
            type="button"
            onClick={sort}
            disabled={loading || !text.trim()}
            className="btn border-indigo-400/50 bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Sorting…" : "Sort it out"}
          </button>
          {error && <span className="text-xs text-red-400">{error}</span>}
        </div>
      </div>

      {result && (
        <div className="space-y-3">
          {result.tasks.length > 0 && (
            <section className="card p-4">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-dim">
                Tasks · {result.tasks.length}
              </h2>
              <ul className="divide-y divide-surface-edge/60">
                {result.tasks.map((t, i) => {
                  const key = `t${i}`;
                  const on = !excluded.has(key);
                  const pColor = PRIORITY_COLORS[t.priority as Priority] ?? "#9aa5b8";
                  return (
                    <li key={key} className="flex items-start gap-2.5 py-2">
                      <input type="checkbox" checked={on} onChange={() => toggle(key)} className="mt-1 accent-indigo-400" />
                      <span className="chip mt-0.5 shrink-0 border-transparent" style={{ color: pColor, background: `${pColor}1a` }}>
                        {t.priority}
                      </span>
                      <div className={`min-w-0 flex-1 ${on ? "" : "opacity-40"}`}>
                        <p className="text-sm leading-snug">{t.title}</p>
                        {t.details && <p className="mt-0.5 text-xs text-ink-faint">{t.details}</p>}
                      </div>
                      <span className="flex shrink-0 items-center gap-1.5 text-xs text-ink-faint">
                        {t.due_date && <span>{t.due_date}</span>}
                        <BizDot slug={t.business_slug} />
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {result.content_ideas.length > 0 && (
            <section className="card p-4">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-dim">
                Content ideas · {result.content_ideas.length}
              </h2>
              <ul className="divide-y divide-surface-edge/60">
                {result.content_ideas.map((c, i) => {
                  const key = `c${i}`;
                  const on = !excluded.has(key);
                  const color = PLATFORM_COLORS[c.platform as ContentPlatform] ?? "#9aa5b8";
                  return (
                    <li key={key} className="flex items-start gap-2.5 py-2">
                      <input type="checkbox" checked={on} onChange={() => toggle(key)} className="mt-1 accent-indigo-400" />
                      <span className="chip mt-0.5 shrink-0 border-transparent" style={{ color, background: `${color}1a` }}>
                        {PLATFORM_LABELS[c.platform as ContentPlatform] ?? c.platform}
                      </span>
                      <span className={`min-w-0 flex-1 text-sm leading-snug ${on ? "" : "opacity-40"}`}>
                        {c.title}
                      </span>
                      <BizDot slug={c.business_slug} />
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {result.leads.length > 0 && (
            <section className="card p-4">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-dim">
                Pipeline leads · {result.leads.length}
              </h2>
              <ul className="divide-y divide-surface-edge/60">
                {result.leads.map((l, i) => {
                  const key = `l${i}`;
                  const on = !excluded.has(key);
                  return (
                    <li key={key} className="flex items-start gap-2.5 py-2">
                      <input type="checkbox" checked={on} onChange={() => toggle(key)} className="mt-1 accent-indigo-400" />
                      <span className="chip mt-0.5 shrink-0 border-sky-500/30 bg-sky-500/10 capitalize text-sky-400">
                        {l.kind}
                      </span>
                      <div className={`min-w-0 flex-1 ${on ? "" : "opacity-40"}`}>
                        <p className="text-sm leading-snug">{l.name}</p>
                        {(l.contact || l.notes) && (
                          <p className="mt-0.5 text-xs text-ink-faint">
                            {[l.contact, l.notes].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </div>
                      <span className="flex shrink-0 items-center gap-1.5 text-xs">
                        {l.value_dollars > 0 && (
                          <span className="font-medium text-emerald-400">
                            ${l.value_dollars.toLocaleString()}
                          </span>
                        )}
                        <BizDot slug={l.business_slug} />
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {result.money.length > 0 && (
            <section className="card p-4">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-dim">
                Money · {result.money.length}
              </h2>
              <ul className="divide-y divide-surface-edge/60">
                {result.money.map((m, i) => {
                  const key = `m${i}`;
                  const on = !excluded.has(key);
                  const isRev = m.type === "REVENUE";
                  return (
                    <li key={key} className="flex items-start gap-2.5 py-2">
                      <input type="checkbox" checked={on} onChange={() => toggle(key)} className="mt-1 accent-indigo-400" />
                      <span className={`chip mt-0.5 shrink-0 border-transparent ${isRev ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                        {isRev ? "in" : "out"}
                      </span>
                      <span className={`min-w-0 flex-1 text-sm leading-snug ${on ? "" : "opacity-40"}`}>
                        {m.memo || "(no memo)"}
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5 text-xs">
                        <span className={`font-medium ${isRev ? "text-emerald-400" : "text-red-400"}`}>
                          {isRev ? "+" : "−"}${Math.abs(m.amount_dollars).toLocaleString()}
                        </span>
                        <BizDot slug={m.business_slug} />
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {result.unrouted.length > 0 && (
            <section className="card border-amber-500/30 p-4">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
                Couldn&apos;t place these
              </h2>
              <ul className="list-inside list-disc space-y-1 text-sm text-ink-dim">
                {result.unrouted.map((u, i) => (
                  <li key={i}>{u}</li>
                ))}
              </ul>
            </section>
          )}

          <div className="card flex items-center gap-3 p-4">
            {appliedCount === null ? (
              <>
                <button
                  type="button"
                  onClick={apply}
                  disabled={applying || includedCount === 0}
                  className="btn border-indigo-400/50 bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {applying ? "Saving…" : `Save ${includedCount} item${includedCount === 1 ? "" : "s"}`}
                </button>
                <span className="text-xs text-ink-faint">Uncheck anything that got routed wrong.</span>
              </>
            ) : (
              <p className="text-sm text-emerald-400">
                Saved {appliedCount} items across your ventures.{" "}
                <Link href="/" className="underline hover:text-emerald-300">Back to HQ →</Link>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
