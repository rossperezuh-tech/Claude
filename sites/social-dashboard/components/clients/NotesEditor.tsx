"use client";

import { useEffect, useRef, useState } from "react";
import { updateClientNotes } from "@/app/actions";

export function NotesEditor({
  clientId,
  initialNotes,
}: {
  clientId: string;
  initialNotes: string;
}) {
  const [value, setValue] = useState(initialNotes);
  const [saved, setSaved] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    return () => clearTimeout(timer.current);
  }, []);

  function onChange(v: string) {
    setValue(v);
    setSaved(false);
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      await updateClientNotes(clientId, v);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }, 700);
  }

  return (
    <div>
      <textarea
        className="input-base min-h-36"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Brand voice, posting cadence, do's and don'ts, anything worth remembering..."
      />
      <div
        className={`mt-1.5 flex items-center gap-1.5 text-[12px] text-ink-faint transition-opacity duration-300 ${
          saved ? "opacity-100" : "opacity-0"
        }`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-good" /> Saved
      </div>
    </div>
  );
}
