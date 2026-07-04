"use client";

import { useRef, useState } from "react";
import { createContentPost } from "@/app/actions";
import { PLATFORM_LABEL, PLATFORM_OPTIONS } from "@/lib/constants";

type ClientOption = { id: string; name: string };

export function AddPostForm({
  clients,
  defaultDate,
}: {
  clients: ClientOption[];
  defaultDate: string;
}) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  if (!open) {
    return (
      <button className="btn-primary" onClick={() => setOpen(true)}>
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth={2.2} strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Add post
      </button>
    );
  }

  return (
    <div className="card w-full p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-ink">New content post</h3>
        <button className="text-ink-faint hover:text-ink" onClick={() => setOpen(false)} aria-label="Close">
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth={2} strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
      <form
        ref={formRef}
        action={async (formData) => {
          await createContentPost(formData);
          formRef.current?.reset();
          setOpen(false);
        }}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <div>
          <label className="label">Client</label>
          <select name="clientId" required className="select-base" defaultValue={clients[0]?.id}>
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
          <label className="label">Scheduled date</label>
          <input name="scheduledDate" type="date" required defaultValue={defaultDate} className="input-base" />
        </div>
        <div>
          <label className="label">Status</label>
          <select name="status" className="select-base" defaultValue="IDEA">
            <option value="IDEA">Idea</option>
            <option value="DRAFTED">Drafted</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="POSTED">Posted</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label">Caption / notes</label>
          <textarea name="caption" className="input-base min-h-20" placeholder="What's the post about?" />
        </div>
        <div className="flex items-center gap-2.5 sm:col-span-2">
          <button type="submit" className="btn-primary">Add to calendar</button>
          <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
