"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useTransition } from "react";
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
 * Home dashboard venture grid with click-and-drag reordering (desktop).
 * Cards live-reorder as you drag; the new order is saved on drop.
 */
export default function VentureGrid({ businesses }: { businesses: VentureCard[] }) {
  const [items, setItems] = useState(businesses);
  const dragFrom = useRef<number | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  // Re-sync when the server sends a new list (after add / delete / save).
  useEffect(() => {
    setItems(businesses);
  }, [businesses]);

  function onDragStart(i: number) {
    dragFrom.current = i;
    setDragging(i);
  }

  function onDragOver(e: React.DragEvent, over: number) {
    e.preventDefault();
    const from = dragFrom.current;
    if (from === null || from === over) return;
    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(over, 0, moved);
      return next;
    });
    dragFrom.current = over;
    setDragging(over);
  }

  function onDragEnd() {
    dragFrom.current = null;
    setDragging(null);
    setItems((cur) => {
      startTransition(() => reorderBusinesses(cur.map((b) => b.id)));
      return cur;
    });
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((b, i) => (
        <div
          key={b.id}
          draggable
          onDragStart={() => onDragStart(i)}
          onDragOver={(e) => onDragOver(e, i)}
          onDragEnd={onDragEnd}
          className={`card group relative cursor-grab p-4 transition-colors hover:bg-surface-overlay active:cursor-grabbing ${
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
            <div className="min-w-0 flex-1">
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
