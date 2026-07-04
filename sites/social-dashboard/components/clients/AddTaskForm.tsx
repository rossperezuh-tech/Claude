"use client";

import { useRef, useState } from "react";
import { createClientTask } from "@/app/actions";

export function AddTaskForm({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  if (!open) {
    return (
      <button className="btn-ghost !px-0 text-brand-ink" onClick={() => setOpen(true)}>
        + Add task
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await createClientTask(clientId, formData);
        formRef.current?.reset();
      }}
      className="flex flex-wrap items-center gap-2"
    >
      <input
        name="title"
        required
        autoFocus
        placeholder="Task title"
        className="input-base flex-1 !py-2 text-[13.5px]"
        style={{ minWidth: 160 }}
      />
      <select name="priority" className="select-base !w-auto !py-2 text-[13px]" defaultValue="P2">
        <option value="P1">P1</option>
        <option value="P2">P2</option>
        <option value="P3">P3</option>
      </select>
      <input
        name="dueDate"
        type="date"
        className="input-base !w-auto !py-2 text-[13px]"
      />
      <button type="submit" className="btn-primary !py-2 text-[13px]">
        Add
      </button>
      <button
        type="button"
        className="btn-ghost !py-2 text-[13px]"
        onClick={() => setOpen(false)}
      >
        Cancel
      </button>
    </form>
  );
}
