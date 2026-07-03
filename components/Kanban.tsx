"use client";

import { useOptimistic, useState, useTransition } from "react";
import { createTask, deleteTask, updateTaskStatus } from "@/app/actions";
import {
  PRIORITY_COLORS,
  RECURRENCE_LABELS,
  STATUS_LABELS,
  TASK_STATUSES,
  type Priority,
  type Recurrence,
  type TaskStatus,
} from "@/lib/constants";

export type KanbanTask = {
  id: string;
  title: string;
  priority: string;
  status: string;
  dueText: string;
  overdue: boolean;
  recurrence: string | null;
};

type OptimisticAction =
  | { type: "move"; id: string; status: string }
  | { type: "remove"; id: string };

export default function Kanban({
  tasks,
  businessId,
  accent,
}: {
  tasks: KanbanTask[];
  businessId: string;
  accent: string;
}) {
  const [, startTransition] = useTransition();
  const [optimisticTasks, applyOptimistic] = useOptimistic(
    tasks,
    (state: KanbanTask[], action: OptimisticAction) => {
      if (action.type === "remove") return state.filter((t) => t.id !== action.id);
      return state.map((t) => (t.id === action.id ? { ...t, status: action.status } : t));
    }
  );

  function move(id: string, status: string) {
    startTransition(async () => {
      applyOptimistic({ type: "move", id, status });
      await updateTaskStatus(id, status);
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      applyOptimistic({ type: "remove", id });
      await deleteTask(id);
    });
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {TASK_STATUSES.map((status) => {
        const col = optimisticTasks.filter((t) => t.status === status);
        return (
          <div key={status} className="card flex flex-col p-3">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-dim">
                {STATUS_LABELS[status]}
              </h3>
              <span className="text-xs text-ink-faint">{col.length}</span>
            </div>
            <div className="flex flex-1 flex-col gap-2">
              {col.map((t) => (
                <TaskCard key={t.id} task={t} onMove={move} onRemove={remove} />
              ))}
              {status !== "DONE" && (
                <AddTaskInline businessId={businessId} status={status} accent={accent} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TaskCard({
  task,
  onMove,
  onRemove,
}: {
  task: KanbanTask;
  onMove: (id: string, status: string) => void;
  onRemove: (id: string) => void;
}) {
  const idx = TASK_STATUSES.indexOf(task.status as TaskStatus);
  const prev = idx > 0 ? TASK_STATUSES[idx - 1] : null;
  const next = idx < TASK_STATUSES.length - 1 ? TASK_STATUSES[idx + 1] : null;
  const pColor = PRIORITY_COLORS[task.priority as Priority] ?? "#9aa5b8";

  return (
    <div className="group rounded-md border border-surface-edge bg-surface-overlay/60 p-2.5">
      <div className="flex items-start gap-2">
        <span
          className="chip mt-0.5 shrink-0 border-transparent"
          style={{ color: pColor, background: `${pColor}1a` }}
        >
          {task.priority}
        </span>
        <span
          className={`min-w-0 flex-1 text-sm leading-snug ${
            task.status === "DONE" ? "text-ink-faint line-through" : ""
          }`}
        >
          {task.title}
        </span>
      </div>
      <div className="mt-1.5 flex items-center gap-2 text-[11px] text-ink-faint">
        {task.dueText && (
          <span className={task.overdue ? "font-medium text-red-400" : ""}>{task.dueText}</span>
        )}
        {task.recurrence && (
          <span title="Recurring">↻ {RECURRENCE_LABELS[task.recurrence as Recurrence]}</span>
        )}
        <span className="ml-auto flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {prev && (
            <button onClick={() => onMove(task.id, prev)} title={`Move to ${STATUS_LABELS[prev]}`} className="btn px-1.5 py-0.5 text-[11px]">
              ←
            </button>
          )}
          {next && (
            <button onClick={() => onMove(task.id, next)} title={`Move to ${STATUS_LABELS[next]}`} className="btn px-1.5 py-0.5 text-[11px]">
              →
            </button>
          )}
          <button onClick={() => onRemove(task.id)} title="Delete" className="btn px-1.5 py-0.5 text-[11px] hover:border-red-400/50 hover:text-red-400">
            ✕
          </button>
        </span>
      </div>
    </div>
  );
}

function AddTaskInline({
  businessId,
  status,
  accent,
}: {
  businessId: string;
  status: TaskStatus;
  accent: string;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [, startTransition] = useTransition();

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="rounded-md border border-dashed border-surface-edge px-2 py-1.5 text-left text-xs text-ink-faint transition-colors hover:text-ink"
        style={{ borderColor: undefined }}
      >
        + Add task
      </button>
    );
  }

  function submit() {
    const t = title.trim();
    setEditing(false);
    setTitle("");
    if (!t) return;
    startTransition(() => createTask({ title: t, businessId, status }));
  }

  return (
    <input
      autoFocus
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") submit();
        if (e.key === "Escape") {
          setEditing(false);
          setTitle("");
        }
      }}
      onBlur={submit}
      placeholder="Task title…"
      className="input text-xs"
      style={{ borderColor: `${accent}66` }}
    />
  );
}
