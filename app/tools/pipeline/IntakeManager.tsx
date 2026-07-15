"use client";

import { useState, useTransition } from "react";
import { toggleIntake } from "@/app/actions";

export interface IntakeBusiness {
  id: string;
  name: string;
  color: string;
  intakeToken: string | null;
  intakeEnabled: boolean;
}

export default function IntakeManager({ businesses }: { businesses: IntakeBusiness[] }) {
  const [open, setOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button type="button" className="btn text-xs" onClick={() => setOpen(true)}>
        ⚲ Lead intake links
      </button>
    );
  }

  return (
    <div className="card space-y-2 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-dim">
          Lead intake links
        </h2>
        <button type="button" className="btn px-2 py-0.5 text-xs" onClick={() => setOpen(false)}>
          ✕
        </button>
      </div>
      <p className="text-xs text-ink-faint">
        Each business can have a public form — anyone with the link can submit, and every
        submission lands in this pipeline as a scored lead. Turn a link off any time; the URL
        stays the same when re-enabled.
      </p>
      <ul className="divide-y divide-surface-edge/60">
        {businesses.map((b) => {
          const url =
            b.intakeToken && typeof window !== "undefined"
              ? `${window.location.origin}/intake/${b.intakeToken}`
              : null;
          return (
            <li key={b.id} className="flex flex-wrap items-center gap-2 py-2">
              <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: b.color }} />
              <span className="min-w-0 flex-1 truncate text-sm">{b.name}</span>
              {b.intakeEnabled && url && (
                <button
                  type="button"
                  className="btn text-xs"
                  onClick={async () => {
                    await navigator.clipboard.writeText(url);
                    setCopiedId(b.id);
                    setTimeout(() => setCopiedId(null), 1500);
                  }}
                >
                  {copiedId === b.id ? "Copied ✓" : "Copy link"}
                </button>
              )}
              <button
                type="button"
                disabled={pending}
                onClick={() => startTransition(() => toggleIntake(b.id, !b.intakeEnabled))}
                className={`btn text-xs ${
                  b.intakeEnabled
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                    : "text-ink-faint"
                }`}
              >
                {b.intakeEnabled ? "On" : "Off"}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
