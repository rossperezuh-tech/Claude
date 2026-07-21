"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { reorderBusinesses } from "@/app/actions";
import { HomeCardDeleteButton } from "@/components/BusinessForms";
import NewBusinessForm from "@/components/NewBusinessForm";

export type VentureCard = {
  id: string;
  name: string;
  slug: string;
  color: string;
  description: string;
  logoUrl: string | null;
  openCount: number;
  nextDueLabel: string | null;
};

/**
 * Home dashboard venture grid with press-and-drag reordering that works on
 * both desktop (mouse) and phone (touch). Dragging starts from the grip
 * handle only (so normal touches scroll and taps open the venture). Cards are
 * tracked by id and the drag is driven by window-level Pointer Events, so it
 * keeps working across the re-render that follows each saved reorder.
 */
export default function VentureGrid({ businesses }: { businesses: VentureCard[] }) {
  const [items, setItems] = useState(businesses);
  const [dragId, setDragId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Latest order, readable from the window listeners without stale closures.
  const itemsRef = useRef(items);
  itemsRef.current = items;

  // Re-sync when the server sends a genuinely different list (after add /
  // delete). Comparing ids avoids clobbering an in-progress reorder or looping.
  useEffect(() => {
    setItems((cur) => {
      const same =
        cur.length === businesses.length && cur.every((b, i) => b.id === businesses[i].id);
      return same ? cur : businesses;
    });
  }, [businesses]);

  // While a drag is active, follow the pointer on the whole window.
  useEffect(() => {
    if (!dragId) return;

    function onMove(e: PointerEvent) {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const card = el?.closest("[data-venture-id]") as HTMLElement | null;
      const overId = card?.dataset.ventureId;
      if (!overId || overId === dragId) return;
      setItems((prev) => {
        const from = prev.findIndex((b) => b.id === dragId);
        const over = prev.findIndex((b) => b.id === overId);
        if (from === -1 || over === -1 || from === over) return prev;
        const next = [...prev];
        const [moved] = next.splice(from, 1);
        next.splice(over, 0, moved);
        return next;
      });
    }

    function onUp() {
      setDragId(null);
      startTransition(() => reorderBusinesses(itemsRef.current.map((b) => b.id)));
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [dragId, startTransition]);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((b) => (
        <div
          key={b.id}
          data-venture-id={b.id}
          className={`card group relative p-4 transition-colors hover:bg-surface-overlay ${
            dragId === b.id ? "opacity-50 ring-1 ring-amber-400/40" : ""
          }`}
          style={{ borderLeft: `3px solid ${b.color}` }}
        >
          <Link
            href={`/business/${b.slug}`}
            aria-label={b.name}
            draggable={false}
            className="absolute inset-0 z-0 rounded-lg"
          />

          {/* Drag handle — press and drag (mouse or touch) to reorder */}
          <button
            type="button"
            aria-label="Drag to reorder"
            title="Drag to reorder"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragId(b.id);
            }}
            className="absolute right-2 top-2 z-[2] touch-none cursor-grab select-none rounded px-1.5 py-0.5 text-sm leading-none text-ink-faint hover:bg-surface-overlay hover:text-ink active:cursor-grabbing"
          >
            ⠿
          </button>

          <div className="pointer-events-none relative z-[1] flex gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg text-base font-semibold uppercase"
              style={{
                background: `linear-gradient(135deg, ${b.color}33, ${b.color}14)`,
                border: `1px solid ${b.color}40`,
                color: b.color,
              }}
            >
              {b.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={b.logoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                b.name.charAt(0)
              )}
            </div>
            <div className="min-w-0 flex-1 pr-6">
              <h3 className="font-medium leading-tight group-hover:text-white">{b.name}</h3>
              <p className="mt-1 line-clamp-2 text-xs text-ink-faint">{b.description}</p>
              <div className="mt-3 flex items-center gap-3 text-xs text-ink-dim">
                <span>
                  <span className="font-semibold text-ink">{b.openCount}</span> open
                </span>
                {b.nextDueLabel && (
                  <span>
                    next due{" "}
                    <span className="font-medium" style={{ color: b.color }}>
                      {b.nextDueLabel}
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>
          <HomeCardDeleteButton id={b.id} name={b.name} />
        </div>
      ))}
      <div className="card border-dashed p-4">
        <NewBusinessForm compact />
      </div>
    </div>
  );
}
