"use client";

import { useTransition } from "react";
import { updatePostStatus } from "@/app/actions";
import { POST_STATUS_LABEL, POST_STATUS_STYLE } from "@/lib/constants";

const ORDER = ["IDEA", "DRAFTED", "SCHEDULED", "POSTED"];

export function PostStatusCycle({ id, status }: { id: string; status: string }) {
  const [isPending, startTransition] = useTransition();

  function advance(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = ORDER[(ORDER.indexOf(status) + 1) % ORDER.length];
    startTransition(() => updatePostStatus(id, next));
  }

  return (
    <button
      onClick={advance}
      disabled={isPending}
      title="Click to advance status"
      className={`badge w-full justify-center ${POST_STATUS_STYLE[status]} ${
        isPending ? "opacity-50" : "hover:opacity-80"
      }`}
    >
      {POST_STATUS_LABEL[status]}
    </button>
  );
}
