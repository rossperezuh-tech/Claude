"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createTestimonial, updateTestimonialStatus, deleteTestimonial } from "@/app/actions";

type Biz = { id: string; name: string; color: string };
type Testimonial = {
  id: string;
  author: string;
  role: string;
  quote: string;
  rating: number;
  source: string;
  status: string;
  business: { name: string; color: string };
};

const STATUSES = ["REQUESTED", "RECEIVED", "PUBLISHED"] as const;
const STATUS_LABEL: Record<string, string> = {
  REQUESTED: "Requested",
  RECEIVED: "Received",
  PUBLISHED: "Published",
};
const STATUS_STYLE: Record<string, string> = {
  REQUESTED: "border-surface-edge text-ink-dim",
  RECEIVED: "border-sky-500/40 bg-sky-500/10 text-sky-300",
  PUBLISHED: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
};

function Stars({ n }: { n: number }) {
  if (!n) return null;
  return <span className="text-amber-300">{"★".repeat(n)}<span className="text-ink-faint">{"★".repeat(5 - n)}</span></span>;
}

export default function TestimonialsClient({
  businesses,
  testimonials,
}: {
  businesses: Biz[];
  testimonials: Testimonial[];
}) {
  const [open, setOpen] = useState(false);
  const [businessId, setBusinessId] = useState(businesses[0]?.id ?? "");
  const [author, setAuthor] = useState("");
  const [role, setRole] = useState("");
  const [quote, setQuote] = useState("");
  const [rating, setRating] = useState(0);
  const [source, setSource] = useState("");
  const [status, setStatus] = useState("RECEIVED");
  const [, startTransition] = useTransition();

  function add() {
    if (!author.trim() || !businessId) return;
    startTransition(() =>
      createTestimonial({ businessId, author, role, quote, rating, source, status }),
    );
    setAuthor(""); setRole(""); setQuote(""); setRating(0); setSource(""); setOpen(false);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <div className="text-xs text-ink-faint">
          <Link href="/tools" className="hover:text-ink-dim">Tools</Link> / Testimonial Collector
        </div>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">Testimonial Collector</h1>
        <p className="mt-1 text-sm text-ink-dim">Store reviews and testimonials, and track which you've published.</p>
      </div>

      {!open ? (
        <button onClick={() => setOpen(true)} className="btn text-sm">+ Add testimonial</button>
      ) : (
        <div className="card space-y-2 p-3">
          <div className="flex flex-wrap gap-2">
            <select className="input text-sm" value={businessId} onChange={(e) => setBusinessId(e.target.value)}>
              {businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <input className="input flex-1 text-sm" placeholder="Author name" value={author} onChange={(e) => setAuthor(e.target.value)} />
            <input className="input flex-1 text-sm" placeholder="Role / company (optional)" value={role} onChange={(e) => setRole(e.target.value)} />
          </div>
          <textarea className="input min-h-[70px] w-full text-sm" placeholder="What they said…" value={quote} onChange={(e) => setQuote(e.target.value)} />
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <select className="input text-sm" value={rating} onChange={(e) => setRating(Number(e.target.value))}>
              <option value={0}>No rating</option>
              {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{"★".repeat(r)} ({r})</option>)}
            </select>
            <input className="input w-32 text-sm" placeholder="Source (Google…)" value={source} onChange={(e) => setSource(e.target.value)} />
            <select className="input text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
            <button onClick={add} disabled={!author.trim()} className="btn border-indigo-400/50 bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 disabled:opacity-50">Save</button>
            <button onClick={() => setOpen(false)} className="btn text-ink-faint">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {testimonials.length === 0 ? (
          <p className="card p-4 text-sm text-ink-faint">No testimonials yet.</p>
        ) : (
          testimonials.map((t) => (
            <div key={t.id} className="card p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="chip shrink-0 border-transparent" style={{ color: t.business.color, background: `${t.business.color}1a` }}>{t.business.name}</span>
                <span className="text-sm font-medium">{t.author}</span>
                {t.role && <span className="text-xs text-ink-faint">{t.role}</span>}
                <Stars n={t.rating} />
                {t.source && <span className="text-xs text-ink-faint">· {t.source}</span>}
                <span className="ml-auto flex items-center gap-2">
                  <select
                    value={t.status}
                    onChange={(e) => startTransition(() => updateTestimonialStatus(t.id, e.target.value))}
                    className={`chip cursor-pointer ${STATUS_STYLE[t.status] ?? STATUS_STYLE.REQUESTED}`}
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                  </select>
                  <button onClick={() => startTransition(() => deleteTestimonial(t.id))} title="Delete" className="text-xs text-ink-faint hover:text-red-400">✕</button>
                </span>
              </div>
              {t.quote && <p className="mt-1.5 text-sm italic text-ink-dim">“{t.quote}”</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
