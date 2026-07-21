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
 * both desktop (mouse) and phone (touch), driven by Pointer Events. Dragging
 * is started from the grip handle only, so normal touches still scroll the
 * page and tapping a card still opens it. The new order saves on release.
 */
export default function VentureGrid({ businesses }: { businesses: VentureCard[] }) {
  const [items, setItems] = useState(businesses);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const fromRef = useRef<number | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  // Re-sync when the server sends a genuinely different list (after add /
  // delete). Comparing ids first avoids clobbering an in-progress reorder or
  // looping on every render.
  useEffect(() => {
    setItems((cur) => {
      const same =
        cur.length === businesses.length && cur.every((b, i) => b.id === businesses[i].id);
      return same ? cur : businesses;
    });
  }, [businesses]);

  function startDrag(e: React.PointerEvent, i: number) {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    fromRef.current = i;
    setDragging(i);
  }

  function moveDrag(e: React.PointerEvent) {
    if (fromRef.current === null) return;
    e.preventDefault();
    const { clientX: x, clientY: y } = e;
    let over = -1;
    for (let idx = 0; idx < cardRefs.current.length; idx++) {
      const el = cardRefs.current[idx];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
        over = idx;
        break;
      }
    }
    if (over === -1 || over === fromRef.current) return;
    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromRef.current!, 1);
      next.splice(over, 0, moved);
      return next;
    });
    fromRef.current = over;
    setDragging(over);
  }

  function endDrag() {
    if (fromRef.current === null) return;
    fromRef.current = null;
    setDragging(null);
    startTransition(() => reorderBusinesses(items.map((b) => b.id)));
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((b, i) => (
        <div
          key={b.id}
          ref={(el) => {
            cardRefs.current[i] = el;
          }}
          className={`card group relative p-4 transition-colors hover:bg-surface-overlay ${
            dragging === i ? "opacity-50" : ""
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
            onPointerDown={(e) => startDrag(e, i)}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            className="absolute right-2 top-2 z-[2] touch-none cursor-grab rounded px-1.5 py-0.5 text-sm leading-none text-ink-faint hover:bg-surface-overlay hover:text-ink active:cursor-grabbing"
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
