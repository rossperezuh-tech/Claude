"use client";

import { useState, useTransition } from "react";
import { generateMonthlyInvoices } from "@/app/actions";

export function GenerateInvoicesButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<number | null>(null);

  function run() {
    startTransition(async () => {
      const created = await generateMonthlyInvoices();
      setResult(created);
      setTimeout(() => setResult(null), 4000);
    });
  }

  return (
    <div className="flex items-center gap-3">
      <button className="btn-primary" onClick={run} disabled={isPending}>
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a9 9 0 11-3-6.7M21 3v5h-5" />
        </svg>
        {isPending ? "Generating…" : "Generate this month's invoices"}
      </button>
      {result !== null && (
        <span className="text-[13px] font-medium text-good">
          {result === 0
            ? "Already up to date — nothing new to create."
            : `Created ${result} new invoice${result === 1 ? "" : "s"}.`}
        </span>
      )}
    </div>
  );
}
