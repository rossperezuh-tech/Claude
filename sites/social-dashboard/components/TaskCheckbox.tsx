"use client";

import { useTransition } from "react";
import { updateTaskStatus } from "@/app/actions";

export function TaskCheckbox({ id, status }: { id: string; status: string }) {
  const [isPending, startTransition] = useTransition();
  const done = status === "DONE";

  function toggle() {
    startTransition(() => {
      updateTaskStatus(id, done ? "TODO" : "DONE");
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      aria-label={done ? "Mark as not done" : "Mark as done"}
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border-2 transition-colors ${
        done
          ? "border-good bg-good text-white"
          : "border-line-strong text-transparent hover:border-brand"
      } ${isPending ? "opacity-50" : ""}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-3 w-3 fill-none stroke-current"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 13l4 4L19 7" />
      </svg>
    </button>
  );
}
