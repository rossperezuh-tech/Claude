"use client";

import { useState, useTransition } from "react";
import { createTask } from "@/app/actions";
import { PRIORITIES, RECURRENCES, RECURRENCE_LABELS, TASK_STATUSES, STATUS_LABELS } from "@/lib/constants";

type Biz = { id: string; name: string; color: string };

/** Full task creation form: business, due date, priority, status, recurrence. */
export default function NewTaskForm({ businesses }: { businesses: Biz[] }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [businessId, setBusinessId] = useState(businesses[0]?.id ?? "");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("P2");
  const [status, setStatus] = useState("THIS_WEEK");
  const [recurrence, setRecurrence] = useState("");
  const [, startTransition] = useTransition();

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn text-xs">
        + New task (with due date / recurrence)
      </button>
    );
  }

  function submit() {
    const t = title.trim();
    if (!t || !businessId) return;
    startTransition(() =>
      createTask({
        title: t,
        businessId,
        dueDate: dueDate || null,
        priority,
        status,
        recurrence: recurrence || null,
      })
    );
    setTitle("");
    setDueDate("");
    setRecurrence("");
    setOpen(false);
  }

  return (
    <div className="card space-y-2 p-3">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="Task title"
        className="input w-full"
      />
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <select value={businessId} onChange={(e) => setBusinessId(e.target.value)} className="input cursor-pointer">
          {businesses.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input" />
        <select value={priority} onChange={(e) => setPriority(e.target.value)} className="input cursor-pointer">
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input cursor-pointer">
          {TASK_STATUSES.filter((s) => s !== "DONE").map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <select value={recurrence} onChange={(e) => setRecurrence(e.target.value)} className="input cursor-pointer">
          <option value="">No repeat</option>
          {RECURRENCES.map((r) => (
            <option key={r} value={r}>↻ {RECURRENCE_LABELS[r]}</option>
          ))}
        </select>
        <button onClick={submit} className="btn">Create</button>
        <button onClick={() => setOpen(false)} className="btn text-ink-faint">Cancel</button>
      </div>
    </div>
  );
}
