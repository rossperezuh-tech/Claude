export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "good" | "warn" | "bad";
}) {
  const toneClass = {
    default: "text-ink",
    good: "text-good",
    warn: "text-warn",
    bad: "text-bad",
  }[tone];

  return (
    <div className="card px-5 py-5">
      <div className="section-title">{label}</div>
      <div className={`mt-2 text-[28px] font-bold tracking-[-0.5px] ${toneClass}`}>
        {value}
      </div>
      {hint && <div className="mt-1 text-[13px] text-ink-faint">{hint}</div>}
    </div>
  );
}
