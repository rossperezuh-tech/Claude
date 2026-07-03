"use client";

import { useEffect, useRef, useState } from "react";
import { saveBusinessNotes } from "@/app/actions";

/** Markdown scratchpad with debounced autosave. */
export default function NotesEditor({
  businessId,
  initialNotes,
}: {
  businessId: string;
  initialNotes: string;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [state, setState] = useState<"idle" | "dirty" | "saved">("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => clearTimeout(timer.current);
  }, []);

  function onChange(value: string) {
    setNotes(value);
    setState("dirty");
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      await saveBusinessNotes(businessId, value);
      setState("saved");
    }, 600);
  }

  return (
    <div className="relative">
      <textarea
        value={notes}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Scratchpad — markdown welcome. Autosaves as you type."
        rows={10}
        className="input w-full resize-y font-mono text-[13px] leading-relaxed"
      />
      <span className="absolute bottom-2.5 right-3 text-[10px] text-ink-faint">
        {state === "dirty" ? "typing…" : state === "saved" ? "saved ✓" : ""}
      </span>
    </div>
  );
}
