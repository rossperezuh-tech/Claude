"use client";

import { useTransition } from "react";
import { updateContractStatus } from "@/app/actions";

const NEXT_STATUS: Record<string, { label: string; status: string } | null> = {
  DRAFT: { label: "Mark sent", status: "SENT" },
  SENT: { label: "Mark signed", status: "SIGNED" },
  SIGNED: { label: "Mark expired", status: "EXPIRED" },
  EXPIRED: null,
};

export function ContractStatusActions({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const [isPending, startTransition] = useTransition();
  const next = NEXT_STATUS[status];
  if (!next) return null;

  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(() => updateContractStatus(id, next.status))}
      className="btn-line !py-1.5 text-[12.5px] disabled:opacity-50"
    >
      {next.label}
    </button>
  );
}
