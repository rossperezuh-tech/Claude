"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { completeTask } from "@/app/actions";

type Props = {
  task: {
    id: string;
    title: string;
    dueDate: string | null;
    dueText: string;
    overdue: boolean;
    business: { name: string; slug: string; color: string };
  };
};

export default function TodayTaskRow({ task }: Props) {
  const [done, setDone] = useState(false);
  const [, startTransition] = useTransition();

  if (done) return null; // optimistic removal

  return (
    <li className="flex items-center gap-3 py-2">
      <button
        aria-label="Mark done"
        onClick={() => {
          setDone(true);
          startTransition(() => completeTask(task.id));
        }}
        className="h-4 w-4 shrink-0 rounded border border-surface-edge transition-colors hover:border-emerald-400 hover:bg-emerald-400/20"
      />
      <span className="min-w-0 flex-1 truncate text-sm">{task.title}</span>
      <span className={`shrink-0 text-xs ${task.overdue ? "font-medium text-red-400" : "text-ink-faint"}`}>
        {task.dueText}
      </span>
      <Link
        href={`/business/${task.business.slug}`}
        className="chip hidden shrink-0 border-transparent hover:underline sm:inline-flex"
        style={{ color: task.business.color, background: `${task.business.color}1a` }}
      >
        {task.business.name}
      </Link>
    </li>
  );
}
