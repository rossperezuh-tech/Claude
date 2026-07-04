"use client";

import { useRef, useState } from "react";
import { addPerformanceMetric } from "@/app/actions";
import { PLATFORM_LABEL, PLATFORM_OPTIONS } from "@/lib/constants";

type ClientOption = { id: string; name: string };

export function LogMetricForm({ clients }: { clients: ClientOption[] }) {
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const formRef = useRef<HTMLFormElement>(null);

  if (!open) {
    return (
      <button className="btn-primary" onClick={() => setOpen(true)}>
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth={2.2} strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Log metrics
      </button>
    );
  }

  return (
    <div className="card w-full p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-ink">Log performance metrics</h3>
        <button className="text-ink-faint hover:text-ink" onClick={() => setOpen(false)} aria-label="Close">
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth={2} strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
      <form
        ref={formRef}
        action={async (formData) => {
          await addPerformanceMetric(clientId, formData);
          formRef.current?.reset();
          setOpen(false);
        }}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <div>
          <label className="label">Client</label>
          <select className="select-base" value={clientId} onChange={(e) => setClientId(e.target.value)}>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Platform</label>
          <select name="platform" className="select-base" defaultValue="INSTAGRAM">
            {PLATFORM_OPTIONS.map((p) => (
              <option key={p} value={p}>{PLATFORM_LABEL[p]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Date</label>
          <input name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className="input-base" />
        </div>
        <div>
          <label className="label">Followers</label>
          <input name="followers" type="number" min="0" required className="input-base" />
        </div>
        <div>
          <label className="label">Engagement rate (%)</label>
          <input name="engagementRate" type="number" min="0" step="0.1" className="input-base" />
        </div>
        <div>
          <label className="label">Reach</label>
          <input name="reach" type="number" min="0" className="input-base" />
        </div>
        <div className="flex items-center gap-2.5 sm:col-span-2">
          <button type="submit" className="btn-primary">Save metrics</button>
          <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
