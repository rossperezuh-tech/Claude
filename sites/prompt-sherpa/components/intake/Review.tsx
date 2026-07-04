"use client";

import { SECTIONS, chipDisplay } from "@/lib/intake-data";

export function Review({ data }: { data: Record<string, string> }) {
  return (
    <div>
      {SECTIONS.map((sec) => (
        <div key={sec.title}>
          <div className="mb-1 mt-7 font-display text-[16px] font-bold text-lime-ink first:mt-0">
            {sec.title}
          </div>
          {sec.q.map((q, qi) => {
            let a = data[q.id] || "";
            if (q.type === "chips") a = chipDisplay(a);
            return (
              <div
                key={q.id}
                className={`py-4 ${qi === 0 ? "" : "border-t border-line"}`}
              >
                <div className="mb-1 text-[13px] text-faint">{q.label}</div>
                <div
                  className={`whitespace-pre-wrap text-[15px] ${
                    a ? "" : "italic text-faint"
                  }`}
                >
                  {a || "— skipped —"}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
