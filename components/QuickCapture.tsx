"use client";

import { useRef, useState, useTransition } from "react";
import { createTask } from "@/app/actions";

type Biz = { id: string; name: string; color: string };

export default function QuickCapture({ businesses }: { businesses: Biz[] }) {
  const [title, setTitle] = useState("");
  const [businessId, setBusinessId] = useState(businesses[0]?.id ?? "");
  const [flash, setFlash] = useState(false);
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = businesses.find((b) => b.id === businessId);

  function submit() {
    const t = title.trim();
    if (!t || !businessId) return;
    setTitle(""); // optimistic clear — keep typing the next one
    setFlash(true);
    setTimeout(() => setFlash(false), 900);
    startTransition(() => createTask({ title: t, businessId, status: "THIS_WEEK" }));
    inputRef.current?.focus();
  }

  return (
    <div className="card flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
      <input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="Quick capture — type a task, pick a business, hit Enter"
        className="input flex-1"
        autoFocus
      />
      <div className="flex items-center gap-2">
        <span
          className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ background: selected?.color ?? "#666" }}
        />
        <select
          value={businessId}
          onChange={(e) => setBusinessId(e.target.value)}
          className="input max-w-[220px] cursor-pointer"
        >
          {businesses.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <button onClick={submit} className="btn shrink-0">
          {flash ? "Added ✓" : "Add"}
        </button>
      </div>
    </div>
  );
}
