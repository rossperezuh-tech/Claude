"use client";

import { useState } from "react";
import { updateClientDetails } from "@/app/actions";
import { PLATFORM_LABEL, PLATFORM_OPTIONS } from "@/lib/constants";

export function EditClientInfo({
  client,
}: {
  client: {
    id: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    monthlyRetainer: number;
    platforms: string;
  };
}) {
  const [open, setOpen] = useState(false);
  const selected = client.platforms.split(",").filter(Boolean);

  if (!open) {
    return (
      <button className="btn-line !py-1.5 text-[13px]" onClick={() => setOpen(true)}>
        Edit info
      </button>
    );
  }

  return (
    <form
      action={async (formData) => {
        await updateClientDetails(client.id, formData);
        setOpen(false);
      }}
      className="card mt-4 grid grid-cols-1 gap-4 p-5 sm:grid-cols-2"
    >
      <div>
        <label className="label">Contact name</label>
        <input
          name="contactName"
          defaultValue={client.contactName}
          className="input-base"
        />
      </div>
      <div>
        <label className="label">Contact email</label>
        <input
          name="contactEmail"
          type="email"
          defaultValue={client.contactEmail}
          className="input-base"
        />
      </div>
      <div>
        <label className="label">Contact phone</label>
        <input
          name="contactPhone"
          defaultValue={client.contactPhone}
          className="input-base"
        />
      </div>
      <div>
        <label className="label">Monthly retainer ($)</label>
        <input
          name="monthlyRetainer"
          type="number"
          min="0"
          step="50"
          defaultValue={client.monthlyRetainer}
          className="input-base"
        />
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
                defaultChecked={selected.includes(p)}
                className="h-3 w-3 accent-brand"
              />
              {PLATFORM_LABEL[p]}
            </label>
          ))}
        </div>
      </div>
      <div className="flex gap-2.5 sm:col-span-2">
        <button type="submit" className="btn-primary !py-2 text-[13px]">
          Save
        </button>
        <button
          type="button"
          className="btn-ghost !py-2 text-[13px]"
          onClick={() => setOpen(false)}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
