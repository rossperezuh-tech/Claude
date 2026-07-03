"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Biz = { id: string; name: string; slug: string; color: string };

type Result = {
  kind: "business" | "task" | "document" | "contact";
  id: string;
  title: string;
  subtitle: string;
  href: string;
  color: string;
};

export default function CommandPalette({ businesses }: { businesses: Biz[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const baseResults: Result[] = businesses.map((b) => ({
    kind: "business",
    id: b.id,
    title: b.name,
    subtitle: "Business",
    href: `/business/${b.slug}`,
    color: b.color,
  }));

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults(baseResults);
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (!q) {
      setResults(baseResults);
      setActive(0);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        const data: Result[] = await res.json();
        setResults(data);
        setActive(0);
      } catch {
        /* aborted */
      }
    }, 120);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, open]);

  const go = useCallback(
    (r: Result | undefined) => {
      if (!r) return;
      setOpen(false);
      router.push(r.href);
    },
    [router]
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-[12vh]"
      onClick={() => setOpen(false)}
    >
      <div
        className="card w-full max-w-xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter") {
              go(results[active]);
            }
          }}
          placeholder="Search tasks, docs, contacts, businesses…"
          className="w-full border-b border-surface-edge bg-transparent px-4 py-3 text-sm outline-none placeholder:text-ink-faint"
        />
        <ul className="max-h-[50vh] overflow-y-auto py-1">
          {results.length === 0 && (
            <li className="px-4 py-3 text-sm text-ink-faint">No matches.</li>
          )}
          {results.map((r, i) => (
            <li key={`${r.kind}-${r.id}`}>
              <button
                onClick={() => go(r)}
                onMouseEnter={() => setActive(i)}
                className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm ${
                  i === active ? "bg-surface-overlay" : ""
                }`}
              >
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: r.color }} />
                <span className="min-w-0 flex-1 truncate">{r.title}</span>
                <span className="shrink-0 text-xs capitalize text-ink-faint">{r.subtitle}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
