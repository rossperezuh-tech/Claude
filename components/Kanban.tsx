"use client";

import { useOptimistic, useState, useTransition } from "react";
import { createTask, deleteTask, updateTaskStatus } from "@/app/actions";
import {
  RECURRENCE_LABELS,
  STATUS_LABELS,
  TASK_STATUSES,
  type Recurrence,
  type TaskStatus,
} from "@/lib/constants";

export type KanbanTask = {
  id: string;
  title: string;
  status: string;
  dueText: string;
  overdue: boolean;
  recurrence: string | null;
};

// Board columns (Backlog removed; Done isn't a column — moving there completes).
const MOVE_ORDER = TASK_STATUSES.filter((s) => s !== "BACKLOG"); // THIS_WEEK, IN_PROGRESS, DONE
const BOARD_COLUMNS = MOVE_ORDER.filter((s) => s !== "DONE"); // THIS_WEEK, IN_PROGRESS

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
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {BOARD_COLUMNS.map((status) => {
        // "This Week" also absorbs any legacy Backlog tasks.
        const col = optimisticTasks.filter(
          (t) => t.status === status || (status === "THIS_WEEK" && t.status === "BACKLOG"),
        );
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
              <AddTaskInline businessId={businessId} status={status} accent={accent} />
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
  // Move order excludes Backlog; a legacy Backlog task behaves like This Week.
  let idx = MOVE_ORDER.indexOf(task.status as (typeof MOVE_ORDER)[number]);
  if (idx === -1) idx = MOVE_ORDER.indexOf("THIS_WEEK");
  const prev = idx > 0 ? MOVE_ORDER[idx - 1] : null;
  const next = idx < MOVE_ORDER.length - 1 ? MOVE_ORDER[idx + 1] : null;

  return (
    <div className="group rounded-md border border-surface-edge bg-surface-overlay/60 p-2.5">
      <div className="flex items-start gap-2">
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
  const [dueDate, setDueDate] = useState("");
  const [, startTransition] = useTransition();

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="rounded-md border border-dashed border-surface-edge px-2 py-1.5 text-left text-xs text-ink-faint transition-colors hover:text-ink"
      >
        + Add task
      </button>
    );
  }

  function cancel() {
    setEditing(false);
    setTitle("");
    setDueDate("");
  }

  function submit() {
    const t = title.trim();
    if (!t) {
      cancel();
      return;
    }
    startTransition(() => createTask({ title: t, businessId, status, dueDate: dueDate || null }));
    cancel();
  }

  return (
    <div
      className="flex flex-col gap-1.5 rounded-md border p-2"
      style={{ borderColor: `${accent}66` }}
    >
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") cancel();
        }}
        placeholder="Task title…"
        className="input text-xs"
      />
      <div className="flex items-center gap-1.5">
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          title="Due date (optional)"
          className="input flex-1 cursor-pointer text-xs"
        />
        <button onClick={submit} className="btn px-2 py-1 text-xs">
          Add
        </button>
        <button onClick={cancel} className="btn px-2 py-1 text-xs text-ink-faint">
          ✕
        </button>
      </div>
    </div>
  );
}
