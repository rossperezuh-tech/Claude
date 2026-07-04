import { formatNumber } from "@/lib/format";

type Point = { label: string; value: number; fullLabel: string };

/**
 * Single-series bar trend. Identity comes from `color` (the client's
 * assigned accent, reused from avatars/calendar — never a generated hue).
 * Only the most recent bar gets a direct label, per mark spec.
 */
export function TrendBars({ points, color }: { points: Point[]; color: string }) {
  const max = Math.max(...points.map((p) => p.value), 1);
  const width = 220;
  const height = 64;
  const gap = 3;
  const barWidth = (width - gap * (points.length - 1)) / points.length;

  return (
    <svg viewBox={`0 0 ${width} ${height + 16}`} className="w-full" role="img" aria-label="Follower trend, last 4 months">
      {points.map((p, i) => {
        const barHeight = Math.max((p.value / max) * height, 3);
        const x = i * (barWidth + gap);
        const y = height - barHeight;
        const isLast = i === points.length - 1;
        return (
          <g key={p.fullLabel}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={3}
              fill={isLast ? color : `${color}55`}
            >
              <title>{`${p.fullLabel}: ${formatNumber(p.value)} followers`}</title>
            </rect>
            {isLast && (
              <text
                x={x + barWidth / 2}
                y={y - 5}
                textAnchor="middle"
                fontSize="10.5"
                fontWeight="700"
                fill="#12141A"
              >
                {formatNumber(p.value)}
              </text>
            )}
            <text
              x={x + barWidth / 2}
              y={height + 13}
              textAnchor="middle"
              fontSize="9.5"
              fill="#767D8F"
            >
              {p.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
