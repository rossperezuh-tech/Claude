"use client";

import { useState } from "react";
import { formatPrice, formatTime, formatYmd } from "@/lib/site";

interface Props {
  listing: {
    id: string;
    title: string;
    description: string;
    discipline: string;
    date: string;
    startTime: string;
    endTime: string;
    priceCents: number;
    spotsLeft: number;
    gymName: string;
    gymAddress: string;
  };
}

const inputCls =
  "w-full rounded-md border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm placeholder-zinc-500 focus:border-orange-500 focus:outline-none";

export default function BookSessionCard({ listing }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const full = listing.spotsLeft <= 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id, name, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error — try again");
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-bold">{listing.title}</div>
          <div className="mt-1 text-sm text-zinc-400">
            {formatYmd(listing.date, { weekday: "long" })} · {formatTime(listing.startTime)}–
            {formatTime(listing.endTime)}
          </div>
          <div className="mt-1 text-xs text-zinc-500">
            {listing.gymName} · {listing.gymAddress}
          </div>
          {listing.description && (
            <p className="mt-2 text-sm text-zinc-400">{listing.description}</p>
          )}
          <div className={`mt-2 text-xs ${full ? "text-red-400" : "text-zinc-500"}`}>
            {full ? "Full" : `${listing.spotsLeft} spot${listing.spotsLeft === 1 ? "" : "s"} left`}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-black">{formatPrice(listing.priceCents)}</div>
          {!full && (
            <button
              onClick={() => setOpen((o) => !o)}
              className="mt-2 rounded-md bg-orange-600 px-4 py-2 text-sm font-bold hover:bg-orange-500"
            >
              {open ? "Close" : "Book"}
            </button>
          )}
        </div>
      </div>

      {open && !full && (
        <form onSubmit={submit} className="mt-4 space-y-3 border-t border-zinc-800 pt-4">
          <input required placeholder="Your name" maxLength={100} className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
          <input required type="email" placeholder="Email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
          {error && (
            <p className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-orange-600 px-6 py-2.5 font-bold hover:bg-orange-500 disabled:bg-zinc-800 disabled:text-zinc-500"
          >
            {loading ? "Redirecting…" : `Pay ${formatPrice(listing.priceCents)} & Book`}
          </button>
          <p className="text-xs text-zinc-500">Secure checkout powered by Stripe.</p>
        </form>
      )}
    </div>
  );
}
