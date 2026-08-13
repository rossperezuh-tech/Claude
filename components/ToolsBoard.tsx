"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { setCategoryOrder, setToolOrder, toggleFavoriteTool } from "@/app/actions";

type BoardTool = {
  slug: string;
  name: string;
  description: string;
  icon: string;
  accent: string;
};
type Section = { name: string; tools: BoardTool[] };

type Drag =
  | { kind: "row"; cat: string }
  | { kind: "item"; cat: string; tool: string };

const sig = (arr: Section[]) =>
  arr.map((s) => `${s.name}:${s.tools.map((t) => t.slug).join(",")}`).join("|");

/**
 * Tools page with two levels of drag-to-reorder: whole category rows, and
 * tools within a row. Dragging starts from a grip handle only (so taps still
 * open a tool), tracked by name/slug and driven by window Pointer Events so it
 * survives the re-render after each saved change. Works with mouse and touch.
 */
export default function ToolsBoard({
  sections: initial,
  favorites,
  favoriteCards,
}: {
  sections: Section[];
  favorites: string[];
  favoriteCards: BoardTool[];
}) {
  const [sections, setSections] = useState(initial);
  const [favs, setFavs] = useState<Set<string>>(new Set(favorites));
  const [drag, setDrag] = useState<Drag | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setFavs(new Set(favorites));
  }, [favorites]);

  function toggleFav(slug: string) {
    setFavs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
    startTransition(() => toggleFavoriteTool(slug));
  }

  const sectionsRef = useRef(sections);
  sectionsRef.current = sections;

  // Re-sync when the server sends a genuinely different arrangement.
  useEffect(() => {
    setSections((cur) => (sig(cur) === sig(initial) ? cur : initial));
  }, [initial]);

  useEffect(() => {
    if (!drag) return;

    function onMove(e: PointerEvent) {
      const target = document.elementFromPoint(e.clientX, e.clientY);
      if (!target) return;

      if (drag!.kind === "row") {
        const sec = target.closest("[data-section]") as HTMLElement | null;
        const overCat = sec?.dataset.section;
        if (!overCat || overCat === drag!.cat) return;
        setSections((prev) => {
          const from = prev.findIndex((s) => s.name === drag!.cat);
          const over = prev.findIndex((s) => s.name === overCat);
          if (from === -1 || over === -1 || from === over) return prev;
          const next = [...prev];
          const [moved] = next.splice(from, 1);
          next.splice(over, 0, moved);
          return next;
        });
        return;
      }

      // item drag — only reorder within the same category
      const card = target.closest("[data-tool]") as HTMLElement | null;
      const overTool = card?.dataset.tool;
      const overCat = card?.dataset.toolCat;
      if (!overTool || overCat !== drag!.cat || overTool === drag!.tool) return;
      setSections((prev) =>
        prev.map((s) => {
          if (s.name !== drag!.cat) return s;
          const from = s.tools.findIndex((t) => t.slug === drag!.tool);
          const over = s.tools.findIndex((t) => t.slug === overTool);
          if (from === -1 || over === -1 || from === over) return s;
          const tools = [...s.tools];
          const [moved] = tools.splice(from, 1);
          tools.splice(over, 0, moved);
          return { ...s, tools };
        }),
      );
    }

    function onUp() {
      const kind = drag!.kind;
      setDrag(null);
      if (kind === "row") {
        startTransition(() => setCategoryOrder(sectionsRef.current.map((s) => s.name)));
      } else {
        startTransition(() =>
          setToolOrder(sectionsRef.current.flatMap((s) => s.tools.map((t) => t.slug))),
        );
      }
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [drag, startTransition]);

  const handleClass =
    "touch-none cursor-grab select-none rounded px-1 leading-none text-ink-faint hover:text-ink active:cursor-grabbing";

  return (
    <div className="space-y-6">
      {favoriteCards.length > 0 && (
        <section className="space-y-2.5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-300">
            ★ Favorites
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {favoriteCards.map((tool) => (
              <div
                key={tool.slug}
                className="card group relative flex h-full items-start gap-3 overflow-hidden p-4 transition-colors hover:border-amber-400/40"
              >
                <Link href={`/tools/${tool.slug}`} className="absolute inset-0 z-0 rounded-lg" />
                <div
                  className="pointer-events-none absolute inset-x-0 -top-16 h-24 opacity-0 blur-2xl transition-opacity group-hover:opacity-40"
                  style={{ background: `radial-gradient(circle at 30% 100%, ${tool.accent}, transparent 70%)` }}
                />
                <button
                  type="button"
                  aria-label="Remove from favorites"
                  title="Remove from favorites"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleFav(tool.slug);
                  }}
                  className="absolute right-2 top-2 z-[2] rounded px-1 text-sm leading-none text-amber-300 hover:text-amber-200"
                >
                  ★
                </button>
                <div
                  className="pointer-events-none relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xl"
                  style={{
                    background: `linear-gradient(135deg, ${tool.accent}33, ${tool.accent}14)`,
                    border: `1px solid ${tool.accent}40`,
                  }}
                >
                  {tool.icon}
                </div>
                <div className="pointer-events-none relative min-w-0 pr-8">
                  <h3 className="font-medium leading-tight">{tool.name}</h3>
                  <p className="mt-1 text-sm text-ink-dim">{tool.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      {sections.map((s) => (
        <section
          key={s.name}
          data-section={s.name}
          className={`space-y-2.5 rounded-lg ${
            drag?.kind === "row" && drag.cat === s.name ? "opacity-50 ring-1 ring-amber-400/40" : ""
          }`}
        >
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Drag to reorder section"
              title="Drag to reorder section"
              onPointerDown={(e) => {
                e.preventDefault();
                setDrag({ kind: "row", cat: s.name });
              }}
              className={`${handleClass} text-sm`}
            >
              ⠿
            </button>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-ink">
              {s.name}
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {s.tools.map((tool) => (
              <div
                key={tool.slug}
                data-tool={tool.slug}
                data-tool-cat={s.name}
                className={`card group relative flex h-full items-start gap-3 overflow-hidden p-4 transition-colors hover:border-amber-400/40 ${
                  drag?.kind === "item" && drag.tool === tool.slug
                    ? "opacity-50 ring-1 ring-amber-400/40"
                    : ""
                }`}
              >
                <Link
                  href={`/tools/${tool.slug}`}
                  draggable={false}
                  className="absolute inset-0 z-0 rounded-lg"
                />
                {/* glow */}
                <div
                  className="pointer-events-none absolute inset-x-0 -top-16 h-24 opacity-0 blur-2xl transition-opacity group-hover:opacity-40"
                  style={{ background: `radial-gradient(circle at 30% 100%, ${tool.accent}, transparent 70%)` }}
                />

                {/* favorite + drag handle */}
                <div className="absolute right-2 top-2 z-[2] flex items-center gap-0.5">
                  <button
                    type="button"
                    aria-label={favs.has(tool.slug) ? "Unfavorite" : "Favorite"}
                    title={favs.has(tool.slug) ? "Remove from favorites" : "Favorite (pin to top)"}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleFav(tool.slug);
                    }}
                    className={`rounded px-1 text-sm leading-none ${
                      favs.has(tool.slug) ? "text-amber-300" : "text-ink-faint hover:text-ink"
                    }`}
                  >
                    {favs.has(tool.slug) ? "★" : "☆"}
                  </button>
                  <button
                    type="button"
                    aria-label="Drag to reorder tool"
                    title="Drag to reorder tool"
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDrag({ kind: "item", cat: s.name, tool: tool.slug });
                    }}
                    className={`text-sm ${handleClass}`}
                  >
                    ⠿
                  </button>
                </div>

                <div
                  className="pointer-events-none relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xl"
                  style={{
                    background: `linear-gradient(135deg, ${tool.accent}33, ${tool.accent}14)`,
                    border: `1px solid ${tool.accent}40`,
                  }}
                >
                  {tool.icon}
                </div>
                <div className="pointer-events-none relative min-w-0 pr-12">
                  <h3 className="font-medium leading-tight">{tool.name}</h3>
                  <p className="mt-1 text-sm text-ink-dim">{tool.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
