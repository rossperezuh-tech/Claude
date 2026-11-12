export const TASK_STATUSES = ["BACKLOG", "THIS_WEEK", "IN_PROGRESS", "DONE"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  BACKLOG: "Backlog",
  THIS_WEEK: "This Week",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

export const PRIORITIES = ["P1", "P2", "P3"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const PRIORITY_COLORS: Record<Priority, string> = {
  P1: "#f87171", // red
  P2: "#fbbf24", // amber
  P3: "#60a5fa", // blue
};

export const DOC_CATEGORIES = ["legal", "financial", "brand", "operations", "compliance"] as const;
export type DocCategory = (typeof DOC_CATEGORIES)[number];

export const MEDIA_KINDS = ["album", "photo", "video"] as const;
export type MediaKind = (typeof MEDIA_KINDS)[number];

export const MEDIA_KIND_STYLES: Record<string, string> = {
  album: "text-indigo-300 border-indigo-500/30 bg-indigo-500/10",
  photo: "text-teal-300 border-teal-500/30 bg-teal-500/10",
  video: "text-rose-300 border-rose-500/30 bg-rose-500/10",
};

export const RECURRENCES = ["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY"] as const;
export type Recurrence = (typeof RECURRENCES)[number];

export const RECURRENCE_LABELS: Record<Recurrence, string> = {
  DAILY: "daily",
  WEEKLY: "weekly",
  BIWEEKLY: "every 2 weeks",
  MONTHLY: "monthly",
};

export const BUSINESS_STATUS_STYLES: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  launching: { label: "Launching", className: "bg-sky-500/15 text-sky-400 border-sky-500/30" },
  "back-burner": { label: "Back-burner", className: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30" },
};
