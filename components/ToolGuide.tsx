"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export type GuideTool = {
  slug: string;
  name: string;
  description: string;
  icon: string;
  accent: string;
  category: string;
};

export default function ToolGuide({
  tools,
  categories,
}: {
  tools: GuideTool[];
  categories: string[];
}) {
  const [active, setActive] = useState<string>("All");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tools.filter((t) => {
      const inCat = active === "All" || t.category === active;
      const inQuery =
        q === "" ||
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q);
      return inCat && inQuery;
    });
  }, [tools, active, query]);

  // Count per category for the filter chips.
  const counts = useMemo(() => {
    const map: Record<string, number> = { All: tools.length };
    for (const c of categories) map[c] = tools.filter((t) => t.category === c).length;
    return map;
  }, [tools, categories]);

  const tabs = ["All", ...categories.filter((c) => (counts[c] ?? 0) > 0)];

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint">
          🔍
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tools — e.g. invoice, content, deal…"
          className="input w-full pl-9 text-sm"
        />
      </div>

      {/* Category filter chips */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((c) => {
          const on = active === c;
          return (
            <button
              key={c}
              onClick={() => setActive(c)}
              className={`chip transition-colors ${
                on
                  ? "border-indigo-400/60 bg-indigo-500/15 text-indigo-200"
                  : "border-surface-edge text-ink-dim hover:text-ink"
              }`}
            >
              {c}
              <span className={`ml-1.5 ${on ? "text-indigo-300/70" : "text-ink-faint"}`}>
                {counts[c] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tool grid */}
      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink-faint">
          No tools match “{query}”. Try another word.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((t) => (
            <Link
              key={t.slug}
              href={`/tools/${t.slug}`}
              className="card group flex items-start gap-3 p-4 transition-colors hover:border-amber-400/40"
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xl"
                style={{
                  background: `linear-gradient(135deg, ${t.accent}33, ${t.accent}14)`,
                  border: `1px solid ${t.accent}40`,
                }}
              >
                {t.icon}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium">{t.name}</h3>
                  <span className="text-xs text-ink-faint opacity-0 transition-opacity group-hover:opacity-100">
                    Open →
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-ink-dim">{t.description}</p>
                <span className="mt-1.5 inline-block text-[10px] uppercase tracking-wide text-ink-faint">
                  {t.category}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
