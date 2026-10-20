import { useEffect, useRef, useState } from "react";
import { formatDate } from "../lib/dates";

/** Single-series bar chart of minutes per day. Tap or hover a bar to read its value. */
export default function MinutesChart({ data, today }: { data: { date: string; minutes: number }[]; today: string }) {
  const [sel, setSel] = useState<number | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(340);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(240, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const max = Math.max(60, ...data.map((d) => d.minutes));
  const step = max <= 120 ? 30 : max <= 240 ? 60 : 120;
  const top = Math.ceil(max / step) * step;
  const ticks = Array.from({ length: top / step + 1 }, (_, i) => i * step);

  const H = 220, padL = 40, padR = 4, padT = 10, padB = 30;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const slot = plotW / data.length;
  const barW = Math.min(28, slot - 2);
  const y = (m: number) => padT + plotH - (m / top) * plotH;

  const shown = sel ?? data.length - 1;
  const d = data[shown];

  return (
    <div ref={box}>
      <div className="flex items-baseline justify-between gap-2 min-h-[28px] mb-2" aria-live="polite">
        <span className="text-dim text-[15px]">{d.date === today ? "Today" : formatDate(d.date, { weekday: "short", month: "short", day: "numeric" })}</span>
        <span className="num font-semibold text-lg">{d.minutes} min</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="block select-none" role="img" aria-label="Minutes studied per day, last 14 days" onMouseLeave={() => setSel(null)}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke="rgb(var(--edge))" strokeWidth={1} />
            <text x={padL - 8} y={y(t)} dy="0.35em" textAnchor="end" className="num" fontSize={13} fill="rgb(var(--faint))">
              {t}
            </text>
          </g>
        ))}
        {data.map((p, i) => {
          const x = padL + i * slot + (slot - barW) / 2;
          const h = plotH - (y(p.minutes) - padT);
          const r = Math.min(4, h / 2, barW / 2);
          const yy = y(p.minutes);
          const isSel = i === shown;
          return (
            <g key={p.date} onMouseEnter={() => setSel(i)} onClick={() => setSel(i)} style={{ cursor: "pointer" }}>
              {/* Hit target spans the full slot height, larger than the bar itself. */}
              <rect x={padL + i * slot} y={padT} width={slot} height={plotH + padB} fill="transparent" />
              {p.minutes > 0 && (
                <path
                  d={`M${x},${yy + h} V${yy + r} Q${x},${yy} ${x + r},${yy} H${x + barW - r} Q${x + barW},${yy} ${x + barW},${yy + r} V${yy + h} Z`}
                  fill="rgb(var(--accent))"
                  opacity={isSel ? 1 : 0.72}
                />
              )}
              <text
                x={padL + i * slot + slot / 2}
                y={H - 9}
                textAnchor="middle"
                className="num"
                fontSize={13}
                fontWeight={isSel ? 700 : 400}
                fill={isSel ? "rgb(var(--ink))" : "rgb(var(--faint))"}
              >
                {Number(p.date.slice(8))}
              </text>
            </g>
          );
        })}
        <line x1={padL} x2={W - padR} y1={y(0)} y2={y(0)} stroke="rgb(var(--faint))" strokeWidth={1} />
      </svg>
    </div>
  );
}
