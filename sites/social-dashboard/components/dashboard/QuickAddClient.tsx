"use client";

import { useRef, useState } from "react";
import { createClient } from "@/app/actions";
import { PLATFORM_LABEL, PLATFORM_OPTIONS } from "@/lib/constants";

export function QuickAddClient() {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  if (!open) {
    return (
      <button className="btn-primary" onClick={() => setOpen(true)}>
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4 fill-none stroke-current"
          strokeWidth={2.2}
          strokeLinecap="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        Add client
      </button>
    );
  }

  return (
    <div className="card w-full p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-ink">New client</h3>
        <button
          className="text-ink-faint hover:text-ink"
          onClick={() => setOpen(false)}
          aria-label="Close"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 fill-none stroke-current"
            strokeWidth={2}
            strokeLinecap="round"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
      <form
        ref={formRef}
        action={async (formData) => {
          await createClient(formData);
          formRef.current?.reset();
          setOpen(false);
        }}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <div className="sm:col-span-2">
          <label className="label">Business name</label>
          <input
            name="name"
            required
            className="input-base"
            placeholder="e.g. Riverside Dental"
          />
        </div>
        <div>
          <label className="label">Contact name</label>
          <input name="contactName" className="input-base" placeholder="Jane Doe" />
        </div>
        <div>
          <label className="label">Contact email</label>
          <input
            name="contactEmail"
            type="email"
            className="input-base"
            placeholder="jane@business.com"
          />
        </div>
        <div>
          <label className="label">Monthly retainer ($)</label>
          <input
            name="monthlyRetainer"
            type="number"
            min="0"
            step="50"
            className="input-base"
            placeholder="1200"
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
        <div className="sm:col-span-2">
          <label className="label">Platforms</label>
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
                  className="h-3 w-3 accent-brand"
                />
                {PLATFORM_LABEL[p]}
              </label>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2.5 sm:col-span-2">
          <button type="submit" className="btn-primary">
            Create client
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setOpen(false)}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
