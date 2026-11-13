"use client";

import { useEffect, useRef, useState } from "react";

/** Textarea with debounced autosave through a bound server action. */
export default function AutosaveText({
  initial,
  save,
  placeholder,
  rows = 4,
}: {
  initial: string;
  save: (value: string) => Promise<void>;
  placeholder?: string;
  rows?: number;
}) {
  const [value, setValue] = useState(initial);
  const [state, setState] = useState<"idle" | "dirty" | "saved" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(timer.current), []);

  function onChange(v: string) {
    setValue(v);
    setState("dirty");
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        await save(v);
        setState("saved");
      } catch {
        setState("error");
      }
    }, 600);
  }

  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="input w-full resize-y font-mono text-[13px] leading-relaxed"
      />
      <span className="absolute bottom-2.5 right-3 text-[10px] text-ink-faint">
        {state === "dirty" ? "typing…" : state === "saved" ? "saved ✓" : state === "error" ? "not saved" : ""}
      </span>
    </div>
  );
}
