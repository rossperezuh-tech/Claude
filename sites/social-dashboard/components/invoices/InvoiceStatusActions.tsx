"use client";

import { useTransition } from "react";
import { updateInvoiceStatus } from "@/app/actions";

export function InvoiceStatusActions({
  id,
  status,
  isPastDue,
}: {
  id: string;
  status: string;
  isPastDue: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function set(next: string) {
    startTransition(() => updateInvoiceStatus(id, next));
  }

  if (status === "PAID") return null;

  return (
    <div className="flex gap-2">
      {status === "DRAFT" && (
        <button disabled={isPending} onClick={() => set("SENT")} className="btn-line !py-1.5 text-[12.5px]">
          Mark sent
        </button>
      )}
      {(status === "SENT" || status === "OVERDUE") && (
        <button disabled={isPending} onClick={() => set("PAID")} className="btn-line !py-1.5 text-[12.5px]">
          Mark paid
        </button>
      )}
      {status === "SENT" && isPastDue && (
        <button disabled={isPending} onClick={() => set("OVERDUE")} className="btn-line !py-1.5 text-[12.5px] !text-bad">
          Mark overdue
        </button>
      )}
    </div>
  );
}
