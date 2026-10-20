import { useState } from "react";
import { Check, ChevronDown, Pencil, Plus, Trash2, X } from "lucide-react";
import { Checkbox } from "../components/ui";
import { WEEKS, type WeekMeta } from "../data/program";
import { currentWeek } from "../lib/progress";
import { uid, useStore, type Task } from "../lib/store";

export default function Plan() {
  const { state } = useStore();
  const [open, setOpen] = useState<Set<number>>(() => new Set([currentWeek(state.tasks)]));
  const toggle = (n: number) =>
    setOpen((s) => {
      const next = new Set(s);
      next.has(n) ? next.delete(n) : next.add(n);
      return next;
    });

  return (
    <div className="grid gap-3">
      <div className="flex justify-end gap-2">
        <button className="btn-ghost" onClick={() => setOpen(new Set(WEEKS.map((w) => w.n)))}>Expand all</button>
        <button className="btn-ghost" onClick={() => setOpen(new Set())}>Collapse all</button>
      </div>
      {WEEKS.map((w) => (
        <Week key={w.n} week={w} tasks={state.tasks.filter((t) => t.week === w.n)} open={open.has(w.n)} onToggle={() => toggle(w.n)} />
      ))}
    </div>
  );
}

function Week({ week, tasks, open, onToggle }: { week: WeekMeta; tasks: Task[]; open: boolean; onToggle: () => void }) {
  const { update } = useStore();
  const [draft, setDraft] = useState("");
  const done = tasks.filter((t) => t.done).length;
  const complete = tasks.length > 0 && done === tasks.length;

  const add = () => {
    const text = draft.trim();
    if (!text) return;
    update((s) => ({ ...s, tasks: [...s.tasks, { id: uid(), week: week.n, text, done: false }] }));
    setDraft("");
  };

  return (
    <section className={`card p-0 overflow-hidden ${complete ? "opacity-80" : ""}`}>
      <button onClick={onToggle} aria-expanded={open} className="w-full flex items-center gap-3 p-4 text-left min-h-[72px] hover:bg-raised/50">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-[17px]">Week {week.n}</span>
            <span className={`badge ${week.tag === "Free" ? "bg-raised text-dim border border-edge" : "bg-accent-soft text-accent"}`}>
              {week.tag}
            </span>
          </div>
          <div className="text-dim text-[15px] mt-0.5 leading-snug">{week.title}</div>
        </div>
        <span className={`num text-[15px] font-semibold ${complete ? "text-good" : "text-dim"}`}>
          {done}/{tasks.length}
        </span>
        <ChevronDown size={22} className={`text-faint transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>

      {open && (
        <div className="border-t border-edge px-2 pb-3">
          <ul className="py-1">
            {tasks.map((t) => (
              <TaskRow key={t.id} task={t} />
            ))}
          </ul>
          <form
            className="flex gap-2 px-2 pt-1"
            onSubmit={(e) => {
              e.preventDefault();
              add();
            }}
          >
            <input className="input" placeholder={`Add a task to Week ${week.n}`} value={draft} onChange={(e) => setDraft(e.target.value)} />
            <button type="submit" className="btn-primary px-3" aria-label="Add task" disabled={!draft.trim()}>
              <Plus size={22} aria-hidden />
            </button>
          </form>
        </div>
      )}
    </section>
  );
}

function TaskRow({ task }: { task: Task }) {
  const { update } = useStore();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(task.text);
  const patch = (p: Partial<Task>) => update((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === task.id ? { ...t, ...p } : t)) }));

  if (editing) {
    return (
      <li className="flex items-center gap-1 py-1 px-1">
        <form
          className="flex flex-1 gap-1"
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim()) patch({ text: text.trim() });
            setEditing(false);
          }}
        >
          <input className="input" value={text} onChange={(e) => setText(e.target.value)} autoFocus aria-label="Task text" />
          <button type="submit" className="icon-btn text-accent" aria-label="Save">
            <Check size={22} aria-hidden />
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-label="Cancel"
            onClick={() => {
              setText(task.text);
              setEditing(false);
            }}
          >
            <X size={22} aria-hidden />
          </button>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-start gap-1 group">
      <Checkbox checked={task.done} onChange={() => patch({ done: !task.done })} label={task.text} />
      <span className={`flex-1 py-3 text-[16px] leading-snug ${task.done ? "line-through text-faint" : ""}`}>{task.text}</span>
      <button className="icon-btn" aria-label="Edit task" onClick={() => setEditing(true)}>
        <Pencil size={19} aria-hidden />
      </button>
      <button
        className="icon-btn hover:text-danger"
        aria-label="Delete task"
        onClick={() => {
          if (confirm(`Delete this task?\n\n${task.text}`)) update((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== task.id) }));
        }}
      >
        <Trash2 size={19} aria-hidden />
      </button>
    </li>
  );
}
