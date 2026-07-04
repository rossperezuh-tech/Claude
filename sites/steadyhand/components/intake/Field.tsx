"use client";

import type { Question } from "@/lib/intake-data";
import { Chips } from "./Chips";

export function Field({
  q,
  value,
  onChange,
}: {
  q: Question;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="mb-6">
      <label htmlFor={q.id} className="mb-1 block text-[14.5px] font-medium">
        {q.label}
      </label>
      {q.help && (
        <div className="mb-2.5 text-[13px] text-faint">{q.help}</div>
      )}
      {q.type === "textarea" && (
        <textarea
          id={q.id}
          className="input-base min-h-24 resize-y"
          placeholder={q.ph || ""}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {q.type === "text" && (
        <input
          type="text"
          id={q.id}
          className="input-base"
          placeholder={q.ph || ""}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {q.type === "chips" && (
        <Chips
          opts={q.opts || []}
          other={!!q.other}
          value={value}
          onChange={onChange}
        />
      )}
    </div>
  );
}
