"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { setDashboardTemplate, finishOnboardingWith } from "@/app/actions";

export default function DashboardChooser({
  current,
  templates,
  onboarding = false,
}: {
  current: string;
  templates: { id: string; name: string; blurb: string }[];
  onboarding?: boolean;
}) {
  const [sel, setSel] = useState(current);
  const [opening, setOpening] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Normal (settings) flow: choosing just saves the template.
  function choose(id: string) {
    setSel(id);
    startTransition(() => setDashboardTemplate(id));
  }

  // Onboarding: choosing a card saves the template, finishes onboarding, and
  // drops the user straight onto that dashboard — one click.
  function pickAndOpen(id: string) {
    setSel(id);
    setOpening(id);
    startTransition(() => finishOnboardingWith(id));
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {templates.map((t) => {
          const active = sel === t.id;

          if (onboarding) {
            return (
              <div
                key={t.id}
                className={`card flex flex-col gap-2 p-4 ${active ? "border-indigo-400/60 ring-1 ring-indigo-400/30" : ""}`}
              >
                <h3 className="font-medium">{t.name}</h3>
                <p className="text-xs text-ink-dim">{t.blurb}</p>
                <button
                  onClick={() => pickAndOpen(t.id)}
                  disabled={pending}
                  className="btn mt-auto border-indigo-400/50 bg-indigo-500/15 text-xs text-indigo-300 hover:bg-indigo-500/25 disabled:opacity-60"
                >
                  {opening === t.id ? "Opening…" : "Start with this →"}
                </button>
              </div>
            );
          }

          return (
            <div
              key={t.id}
              className={`card flex flex-col gap-2 p-4 ${active ? "border-indigo-400/60 ring-1 ring-indigo-400/30" : ""}`}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-medium">{t.name}</h3>
                {active && <span className="chip border-indigo-400/50 text-indigo-300">Selected</span>}
              </div>
              <p className="text-xs text-ink-dim">{t.blurb}</p>
              <button
                onClick={() => choose(t.id)}
                disabled={pending || active}
                className={`btn mt-auto text-xs ${
                  active
                    ? "border-indigo-400/40 text-indigo-300"
                    : "border-indigo-400/50 bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25"
                } disabled:cursor-default`}
              >
                {active ? "This is your dashboard ✓" : "Use this"}
              </button>
            </div>
          );
        })}
      </div>
      {!onboarding && (
        <Link
          href="/"
          className="inline-block rounded-md border border-indigo-400/50 bg-indigo-500/15 px-3 py-1.5 text-sm text-indigo-300 hover:bg-indigo-500/25"
        >
          Go to my dashboard →
        </Link>
      )}
    </div>
  );
}
