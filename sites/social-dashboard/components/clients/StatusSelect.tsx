"use client";

import { useTransition } from "react";
import { updateClientStatus } from "@/app/actions";
import { CLIENT_STATUS_LABEL } from "@/lib/constants";

export function StatusSelect({
  clientId,
  status,
}: {
  clientId: string;
  status: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      className="select-base !w-auto !py-1.5 !text-[13px] font-medium"
      value={status}
      disabled={isPending}
      onChange={(e) =>
        startTransition(() => updateClientStatus(clientId, e.target.value))
      }
    >
      {Object.entries(CLIENT_STATUS_LABEL).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}
