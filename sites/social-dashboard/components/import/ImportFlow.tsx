"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { parseSummary, type ParsedDraft } from "@/lib/parse-summary";
import { importClientFromSummary } from "@/app/actions";
import { PLATFORM_LABEL, PLATFORM_OPTIONS } from "@/lib/constants";

const SAMPLE = `PROJECT INTAKE — Steadyhand (from call)

YOUR BUSINESS
• What does your business do?
  Riverside Dental — a two-location family dental practice.
• How many people are on your team?
  9
• Contact: Dr. Amy Rivera, amy@riversidedental.com, (718) 555-0140

THE TASK TO FIX
• Which task do you want handled?
  Customer emails and appointment reminders on Instagram + Facebook.

SCOPE
• Budget range?
  $1–3k
• Any deadline?
  Wants it running before October.`;

export function ImportFlow() {
  const router = useRouter();
  const [raw, setRaw] = useState("");
  const [draft, setDraft] = useState<ParsedDraft | null>(null);
  const [tasks, setTasks] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  function readIt() {
    const d = parseSummary(raw);
    setDraft(d);
    setTasks(d.suggestedTasks);
    setPlatforms(d.platforms);
  }

  function togglePlatform(p: string) {
    setPlatforms((cur) =>
      cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]
    );
  }

  if (!draft) {
    return (
      <div className="card p-6">
        <label className="label">Paste the call summary</label>
        <p className="mb-3 text-[13.5px] text-ink-dim">
          Paste the summary your call AI produced (the format from the
          call-notes prompt). We&apos;ll read what we can and let you confirm
          before the client is created — nothing is saved until you say so.
        </p>
        <textarea
          className="input-base min-h-64 font-mono text-[13px]"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder="Paste here…"
        />
        <div className="mt-4 flex items-center gap-2.5">
          <button
            className="btn-primary"
            disabled={!raw.trim()}
            onClick={readIt}
          >
            Read it →
          </button>
          <button
            className="btn-ghost"
            onClick={() => setRaw(SAMPLE)}
            type="button"
          >
            Try a sample
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      action={async (fd) => {
        setSubmitting(true);
        await importClientFromSummary(fd);
        router.push("/clients");
      }}
      className="card p-6"
    >
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-ink">
          Confirm &amp; create
        </h2>
        <button
          type="button"
          className="btn-ghost !py-1.5 text-[13px]"
          onClick={() => setDraft(null)}
        >
          ← Start over
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label">Client name (confirm this)</label>
          <input
            name="name"
            required
            defaultValue={draft.suggestedName}
            className="input-base"
            placeholder="Business name"
          />
        </div>
        <div>
          <label className="label">Contact email</label>
          <input name="contactEmail" defaultValue={draft.contactEmail} className="input-base" />
        </div>
        <div>
          <label className="label">Contact phone</label>
          <input name="contactPhone" defaultValue={draft.contactPhone} className="input-base" />
        </div>
        <div>
          <label className="label">Monthly retainer ($)</label>
          <input
            name="monthlyRetainer"
            type="number"
            min="0"
            step="50"
            defaultValue={draft.monthlyRetainer}
            className="input-base"
          />
        </div>
        <div>
          <label className="label">Status</label>
          <select name="status" className="select-base" defaultValue="ONBOARDING">
            <option value="ONBOARDING">Onboarding</option>
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
          </select>
        </div>
      </div>

      <div className="mt-4">
        <label className="label">Platforms detected</label>
        <div className="flex flex-wrap gap-2">
          {PLATFORM_OPTIONS.map((p) => (
            <label
              key={p}
              className="flex items-center gap-1.5 rounded-full border border-line-strong px-3 py-1.5 text-[13px] text-ink-dim has-[:checked]:border-brand has-[:checked]:bg-brand-soft has-[:checked]:text-brand-ink"
            >
              <input
                type="checkbox"
                name="platforms"
                value={p}
                checked={platforms.includes(p)}
                onChange={() => togglePlatform(p)}
                className="h-3 w-3 accent-brand"
              />
              {PLATFORM_LABEL[p]}
            </label>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <label className="label">Starter tasks</label>
        <div className="space-y-2">
          {tasks.map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                name="tasks"
                value={t}
                onChange={(e) =>
                  setTasks((cur) => cur.map((x, j) => (j === i ? e.target.value : x)))
                }
                className="input-base !py-2 text-[13.5px]"
              />
              <button
                type="button"
                aria-label="Remove task"
                className="text-ink-faint hover:text-bad"
                onClick={() => setTasks((cur) => cur.filter((_, j) => j !== i))}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn-ghost !px-0 text-[13px] text-brand-ink"
            onClick={() => setTasks((cur) => [...cur, ""])}
          >
            + Add task
          </button>
        </div>
      </div>

      <div className="mt-4">
        <label className="label">Notes (full call summary — saved to the client)</label>
        <textarea name="notes" defaultValue={draft.notes} className="input-base min-h-36 font-mono text-[12.5px]" />
      </div>

      <div className="mt-5 flex items-center gap-2.5">
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Creating…" : "Create client"}
        </button>
        <span className="text-[12.5px] text-ink-faint">
          Creates the client, saves the summary as notes, and adds the tasks above.
        </span>
      </div>
    </form>
  );
}
