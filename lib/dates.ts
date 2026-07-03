import { addDays, addMonths, format, isBefore, isToday, startOfDay } from "date-fns";
import type { Recurrence } from "./constants";

export function isOverdue(due: Date | null): boolean {
  if (!due) return false;
  return isBefore(due, startOfDay(new Date())) && !isToday(due);
}

export function isDueToday(due: Date | null): boolean {
  if (!due) return false;
  return isToday(due);
}

/** "Today", "Tomorrow", "Mon Jul 6", or "3d overdue" */
export function dueLabel(due: Date | null): string {
  if (!due) return "";
  const today = startOfDay(new Date());
  const d = startOfDay(due);
  const diffDays = Math.round((d.getTime() - today.getTime()) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays < 0) return `${-diffDays}d overdue`;
  return format(due, "EEE MMM d");
}

export function nextOccurrence(due: Date, recurrence: Recurrence): Date {
  switch (recurrence) {
    case "DAILY":
      return addDays(due, 1);
    case "WEEKLY":
      return addDays(due, 7);
    case "BIWEEKLY":
      return addDays(due, 14);
    case "MONTHLY":
      return addMonths(due, 1);
  }
}
