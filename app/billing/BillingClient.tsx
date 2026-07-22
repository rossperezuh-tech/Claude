"use client";

import { useState } from "react";
import Link from "next/link";

type PlanCard = { id: string; name: string; priceDollars: number; blurb: string };

export default function BillingClient({
  configured,
  isOwner,
  status,
  active,
  trialDaysLeft,
  currentPlan,
  hasCustomer,
  periodEnd,
  plans,
}: {
  configured: boolean;
  isOwner: boolean;
  status: string;
  active: boolean;
  trialDaysLeft: number;
  currentPlan: string;
  hasCustomer: boolean;
  periodEnd: string | null;
  plans: PlanCard[];
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function subscribe(planId: string) {
    setBusy(planId);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error ?? "Couldn't start checkout.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  async function manage() {
    setBusy("portal");
    setError(null);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error ?? "Couldn't open the billing portal.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  const statusLabel: Record<string, string> = {
    none: "No subscription",
    trialing: "Free trial",
    active: "Active",
    past_due: "Payment past due",
    canceled: "Canceled",
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Billing</h1>
        <p className="mt-1 text-sm text-ink-dim">
          Your first 30 days are free — no card needed. Subscribe any time to keep access after that.
        </p>
      </div>

      {isOwner && (
        <div className="card border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-200">
          You're the account owner — you always have full access regardless of subscription.
        </div>
      )}

      {!active && !isOwner && (
        <div
          className={`card p-3 text-sm ${
            trialDaysLeft > 0
              ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-200"
              : "border-red-500/30 bg-red-500/5 text-red-200"
          }`}
        >
          {trialDaysLeft > 0
            ? `You're on your free trial — ${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} left. Subscribe any time to keep access.`
            : "Your free trial has ended. Subscribe to a plan below to restore access to the tools."}
        </div>
      )}

      {!configured && (
        <div className="card border-red-500/30 bg-red-500/5 p-3 text-sm text-red-300">
          Billing isn't finished setting up yet. Check back soon.
        </div>
      )}

      {/* Current status */}
      <div className="card flex flex-wrap items-center gap-3 p-4">
        <div>
          <div className="text-xs text-ink-faint">Current status</div>
          <div className="text-sm font-medium">
            {statusLabel[status] ?? status}
            {currentPlan && ` · ${plans.find((p) => p.id === currentPlan)?.name ?? currentPlan}`}
          </div>
          {periodEnd && (
            <div className="text-xs text-ink-faint">
              {active ? "Renews / trial ends" : "Ends"} {new Date(periodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </div>
          )}
        </div>
        {hasCustomer && (
          <button onClick={manage} disabled={busy !== null} className="btn ml-auto text-sm">
            {busy === "portal" ? "Opening…" : "Manage billing"}
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {/* Plans */}
      <div className="grid gap-3 sm:grid-cols-3">
        {plans.map((p) => {
          const isCurrent = active && currentPlan === p.id;
          return (
            <div key={p.id} className={`card flex flex-col gap-2 p-4 ${isCurrent ? "border-indigo-400/50" : ""}`}>
              <div className="flex items-baseline justify-between">
                <h2 className="font-medium">{p.name}</h2>
                {isCurrent && <span className="chip border-indigo-400/50 text-indigo-300">Current</span>}
              </div>
              <div className="text-2xl font-semibold">
                ${p.priceDollars}
                <span className="text-sm font-normal text-ink-faint">/mo</span>
              </div>
              <p className="text-xs text-ink-dim">{p.blurb}</p>
              <button
                onClick={() => subscribe(p.id)}
                disabled={!configured || busy !== null || isCurrent}
                className="btn mt-auto border-indigo-400/50 bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCurrent ? "Your plan" : busy === p.id ? "Starting…" : "Subscribe"}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-ink-faint">
        Have a promo code? You can enter it at checkout.{" "}
        <Link href="/" className="hover:text-ink-dim">Back to dashboard</Link>
      </p>
    </div>
  );
}
