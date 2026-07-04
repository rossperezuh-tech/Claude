"use client";

import { useState } from "react";

/**
 * Multi-select chips stored pipe-joined ("A|B|custom"), matching the
 * original intake's storage format so saved answers carry over.
 */
export function Chips({
  opts,
  other,
  value,
  onChange,
}: {
  opts: string[];
  other: boolean;
  value: string;
  onChange: (v: string) => void;
}) {
  const selected = value.split("|").filter(Boolean);
  const [otherText, setOtherText] = useState(() =>
    selected.filter((v) => !opts.includes(v)).join(", ")
  );

  function toggle(opt: string) {
    const cur = selected.includes(opt)
      ? selected.filter((x) => x !== opt)
      : [...selected, opt];
    onChange(cur.join("|"));
  }

  function setOther(text: string) {
    setOtherText(text);
    const preset = selected.filter((x) => opts.includes(x));
    const others = text
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
    onChange([...preset, ...others].join("|"));
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group">
        {opts.map((o) => {
          const sel = selected.includes(o);
          return (
            <button
              type="button"
              key={o}
              aria-pressed={sel}
              className={`chip ${sel ? "chip-sel" : ""}`}
              onClick={() => toggle(o)}
            >
              {o}
            </button>
          );
        })}
      </div>
      {other && (
        <input
          type="text"
          className="input-base mt-2.5"
          placeholder="Something else? Add it here"
          value={otherText}
          onChange={(e) => setOther(e.target.value)}
        />
      )}
    </div>
  );
}
