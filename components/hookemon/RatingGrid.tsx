/** 0–3 self-rating radios per device, grouped by series. Plain form inputs, no JS needed. */
export default function RatingGrid({
  devices,
  seriesLabels,
  defaults = {},
}: {
  devices: { slug: string; name: string; series: string; color: string }[];
  seriesLabels: Record<string, string>;
  defaults?: Record<string, number>;
}) {
  const series = Array.from(new Set(devices.map((d) => d.series)));
  return (
    <div className="space-y-4">
      {series.map((s) => (
        <div key={s}>
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-ink-faint">
            {seriesLabels[s] ?? s}
          </div>
          <div className="divide-y divide-surface-edge/60">
            {devices
              .filter((d) => d.series === s)
              .map((d) => (
                <div key={d.slug} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span className="flex items-center gap-2 text-sm">
                    <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                    {d.name}
                  </span>
                  <div className="flex gap-1.5">
                    {[0, 1, 2, 3].map((n) => (
                      <label
                        key={n}
                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded border border-surface-edge text-sm has-[:checked]:border-orange-400 has-[:checked]:bg-orange-500/20 has-[:checked]:text-orange-300"
                      >
                        <input
                          type="radio"
                          name={`rating_${d.slug}`}
                          value={n}
                          required
                          defaultChecked={defaults[d.slug] === n}
                          className="sr-only"
                        />
                        {n}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
