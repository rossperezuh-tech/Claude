"use client";

import { useState, useTransition } from "react";
import { createTask } from "@/app/actions";
import { PRIORITIES } from "@/lib/constants";

/** Inline "add a to-do" input scoped to one venture. Enter to add, keeps focus for the next one. */
export default function TodoAdd({ businessId, color }: { businessId: string; color: string }) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("P2");
  const [, startTransition] = useTransition();

  function submit() {
    const t = title.trim();
    if (!t) return;
    setTitle(""); // optimistic clear
    startTransition(() => createTask({ title: t, businessId, priority, status: "THIS_WEEK" }));
  }

  return (
    <div className="flex min-w-0 items-center gap-2 pt-2">
      <span className="h-4 w-4 shrink-0 rounded border border-dashed" style={{ borderColor: `${color}80` }} />
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="Add a to-do…"
        className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-ink-faint focus:outline-none"
      />
      <select
        value={priority}
        onChange={(e) => setPriority(e.target.value)}
        className="cursor-pointer bg-transparent text-xs text-ink-faint focus:outline-none"
        aria-label="Priority"
      >
        {PRIORITIES.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
    </div>
  );
}
