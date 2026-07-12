"use client";

import { useState } from "react";

export default function ConnectPayoutsButton({ connected }: { connected: boolean }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function start() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/connect/onboard", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't start onboarding");
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-bold">Payouts</div>
          <p className="mt-1 text-sm text-zinc-400">
            {connected
              ? "Your Stripe account is connected — your cut of each booking transfers automatically."
              : "Connect a Stripe account to get your cut of every booking deposited automatically. Until then, payouts are handled manually."}
          </p>
        </div>
        <button
          onClick={start}
          disabled={loading}
          className={`rounded-md px-5 py-2.5 text-sm font-bold disabled:opacity-50 ${
            connected
              ? "border border-zinc-700 hover:border-zinc-500"
              : "bg-emerald-600 hover:bg-emerald-500"
          }`}
        >
          {loading ? "Opening…" : connected ? "Manage payout account" : "Connect payouts"}
        </button>
      </div>
      {error && (
        <p className="mt-3 rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-300">
          {error}
        </p>
      )}
    </div>
  );
}
