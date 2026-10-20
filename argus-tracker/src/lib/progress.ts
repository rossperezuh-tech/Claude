import type { Task } from "./store";

/** The first week that still has open tasks (or the last week once everything is done). */
export function currentWeek(tasks: Task[]): number {
  const open = tasks.filter((t) => !t.done).map((t) => t.week);
  return open.length ? Math.min(...open) : 6;
}
