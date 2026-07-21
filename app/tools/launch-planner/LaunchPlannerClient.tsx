"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { createTasksBulk } from "@/app/actions";
import { MicButton } from "@/components/Voice";
import { PRIORITY_COLORS, type Priority } from "@/lib/constants";
import type { LaunchPlan } from "@/app/api/tools/launch-planner/route";

interface BusinessOption {
  id: string;
  name: string;
  slug: string;
  color: string;
}

export default function LaunchPlannerClient({ businesses }: { businesses: BusinessOption[] }) {
  const [businessId, setBusinessId] = useState(businesses[0]?.id ?? "");
  const [description, setDescription] = useState("");
  const [launchDate, setLaunchDate] = useState("");
  const [plan, setPlan] = useState<LaunchPlan | null>(null);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addedCount, setAddedCount] = useState<number | null>(null);
  const [adding, startTransition] = useTransition();

  const business = businesses.find((b) => b.id === businessId);

  const allTasks = useMemo(
    () =>
      (plan?.phases ?? []).flatMap((phase, pi) =>
        phase.tasks.map((t, ti) => ({ ...t, key: `${pi}-${ti}`, phase: phase.name })),
      ),
    [plan],
  );
  const selectedTasks = allTasks.filter((t) => !excluded.has(t.key));

  async function generate() {
    if (!description.trim() || !launchDate || loading) return;
    setLoading(true);
    setError(null);
    setPlan(null);
    setAddedCount(null);
    setExcluded(new Set());
    try {
      const res = await fetch("/api/tools/launch-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, description, launchDate }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? `Request failed (${res.status}).`);
        return;
      }
      setPlan(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function toggleTask(key: string) {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function addToBacklog() {
    if (selectedTasks.length === 0 || adding) return;
    startTransition(async () => {
      const n = await createTasksBulk(
        businessId,
        selectedTasks.map((t) => ({
          title: t.title,
          notes: t.details ? `${t.phase}: ${t.details}` : t.phase,
          priority: t.priority,
          dueDate: t.due_date || null,
        })),
      );
      setAddedCount(n ?? 0);
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <div className="text-xs text-ink-faint">
          <Link href="/tools" className="hover:text-ink-dim">Tools</Link> / Launch Planner
        </div>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">Launch Planner</h1>
        <p className="mt-1 text-sm text-ink-dim">
          Describe a launch and a date — get a phased work-back plan you can drop straight into
          the venture&apos;s backlog with due dates set.
        </p>
      </div>

      <div className="card space-y-3 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="mb-1 block text-xs text-ink-faint">Business</span>
            <select className="input text-sm" value={businessId} onChange={(e) => setBusinessId(e.target.value)}>
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-ink-faint">Launch date</span>
            <input
              type="date"
              className="input text-sm"
              value={launchDate}
              onChange={(e) => setLaunchDate(e.target.value)}
            />
          </label>
        </div>
        <label className="block">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="block text-xs text-ink-faint">What are you launching?</span>
            <MicButton
              onText={(t) => setDescription((v) => (v ? v + " " : "") + t)}
              className="px-2 py-0.5 text-xs"
            />
          </div>
          <textarea
            className="input min-h-[110px] w-full text-sm"
            placeholder="e.g. First run of the manifestation box — 100 units, includes journal, candle, and crystal set. Selling through the website with pre-orders 2 weeks before ship date. Need suppliers confirmed, packaging designed, and a 3-week content ramp."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <button
          type="button"
          onClick={generate}
          disabled={loading || !description.trim() || !launchDate}
          className="btn border-indigo-400/50 bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Planning…" : "Build the plan"}
        </button>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>

      {plan && (
        <div className="space-y-3">
          <div className="card p-4">
            <p className="text-sm leading-relaxed text-ink-dim">{plan.summary}</p>
          </div>

          {plan.phases.map((phase, pi) => (
            <div key={pi} className="card p-4">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-ink-dim">
                {phase.name}
              </h2>
              <ul className="divide-y divide-surface-edge/60">
                {phase.tasks.map((t, ti) => {
                  const key = `${pi}-${ti}`;
                  const included = !excluded.has(key);
                  const pColor = PRIORITY_COLORS[t.priority as Priority] ?? "#9aa5b8";
                  return (
                    <li key={key} className="flex items-start gap-2.5 py-2">
                      <input
                        type="checkbox"
                        checked={included}
                        onChange={() => toggleTask(key)}
                        className="mt-1 accent-indigo-400"
                      />
                      <span className="chip mt-0.5 shrink-0 border-transparent" style={{ color: pColor, background: `${pColor}1a` }}>
                        {t.priority}
                      </span>
                      <div className={`min-w-0 flex-1 ${included ? "" : "opacity-40"}`}>
                        <p className="text-sm leading-snug">{t.title}</p>
                        {t.details && <p className="mt-0.5 text-xs text-ink-faint">{t.details}</p>}
                      </div>
                      <span className="shrink-0 text-xs text-ink-faint">{t.due_date}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {plan.watchouts.length > 0 && (
            <div className="card border-amber-500/30 p-4">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-amber-400">
                Watch out for
              </h2>
              <ul className="list-inside list-disc space-y-1 text-sm text-ink-dim">
                {plan.watchouts.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="card flex items-center gap-3 p-4">
            {addedCount === null ? (
              <>
                <button
                  type="button"
                  onClick={addToBacklog}
                  disabled={adding || selectedTasks.length === 0}
                  className="btn border-indigo-400/50 bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {adding
                    ? "Adding…"
                    : `Add ${selectedTasks.length} task${selectedTasks.length === 1 ? "" : "s"} to ${business?.name ?? "backlog"}`}
                </button>
                <span className="text-xs text-ink-faint">
                  Uncheck anything you don&apos;t want before adding.
                </span>
              </>
            ) : (
              <p className="text-sm text-emerald-400">
                Added {addedCount} tasks.{" "}
                <Link href={`/business/${business?.slug}`} className="underline hover:text-emerald-300">
                  Open {business?.name} →
                </Link>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
