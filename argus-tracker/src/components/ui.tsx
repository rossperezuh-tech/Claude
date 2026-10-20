import { useEffect, useState, type ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`card ${className}`}>{children}</section>;
}

export function CardHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 mb-3 min-h-[28px]">
      <h2 className="section-title">{title}</h2>
      {action}
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-xl bg-raised p-1 gap-1 border border-edge">
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`flex-1 min-w-0 min-h-[42px] px-1.5 rounded-lg text-[15px] leading-tight font-semibold transition-colors ${
            value === o.value ? "bg-surface text-accent shadow-sm border border-edge" : "text-dim hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className="w-12 h-12 shrink-0 inline-flex items-center justify-center rounded-xl hover:bg-raised"
    >
      <span
        className={`w-7 h-7 rounded-lg border-2 inline-flex items-center justify-center transition-colors ${
          checked ? "bg-accent border-accent text-accent-ink" : "border-faint"
        }`}
      >
        {checked && (
          <svg viewBox="0 0 20 20" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={3}>
            <path d="M4.5 10.5l3.5 3.5 7.5-8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
    </button>
  );
}

export function ProgressRing({ value, size = 120, stroke = 12, children }: { value: number; size?: number; stroke?: number; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(var(--raised))" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgb(var(--accent))"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          style={{ transition: "stroke-dashoffset 400ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

export function Bar({ value, tone = "accent" }: { value: number; tone?: "accent" | "good" }) {
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className="h-3 rounded-full bg-raised overflow-hidden">
      <div className={`h-full rounded-full ${tone === "good" ? "bg-good" : "bg-accent"}`} style={{ width: `${v * 100}%`, transition: "width 400ms ease" }} />
    </div>
  );
}

/** Numeric input that allows a temporarily empty/partial value while typing. */
export function NumberInput({
  value,
  onChange,
  step = "any",
  min,
  max,
  id,
  className = "",
  ariaLabel,
}: {
  value: number;
  onChange: (v: number) => void;
  step?: string;
  min?: number;
  max?: number;
  id?: string;
  className?: string;
  ariaLabel?: string;
}) {
  const [text, setText] = useState(String(value));
  useEffect(() => {
    if (Number(text) !== value) setText(String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <input
      id={id}
      aria-label={ariaLabel}
      type="number"
      inputMode="decimal"
      step={step}
      min={min}
      max={max}
      className={`input num ${className}`}
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        const n = Number(e.target.value);
        if (e.target.value.trim() !== "" && Number.isFinite(n)) onChange(n);
      }}
      onBlur={() => {
        if (text.trim() === "" || !Number.isFinite(Number(text))) {
          onChange(0);
          setText("0");
        }
      }}
    />
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="text-dim text-[15px] py-6 text-center">{children}</p>;
}
