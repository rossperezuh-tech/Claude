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

export const RECURRENCES = ["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY"] as const;
export type Recurrence = (typeof RECURRENCES)[number];

export const RECURRENCE_LABELS: Record<Recurrence, string> = {
  DAILY: "daily",
  WEEKLY: "weekly",
  BIWEEKLY: "every 2 weeks",
  MONTHLY: "monthly",
};

// ---- Content Calendar / Content Studio ----

export const CONTENT_PLATFORMS = [
  "instagram",
  "tiktok",
  "youtube",
  "linkedin",
  "x",
  "facebook",
  "pinterest",
  "email",
  "other",
] as const;
export type ContentPlatform = (typeof CONTENT_PLATFORMS)[number];

export const PLATFORM_LABELS: Record<ContentPlatform, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  x: "X",
  facebook: "Facebook",
  pinterest: "Pinterest",
  email: "Email",
  other: "Other",
};

export const PLATFORM_COLORS: Record<ContentPlatform, string> = {
  instagram: "#e1637c",
  tiktok: "#5eead4",
  youtube: "#f87171",
  linkedin: "#60a5fa",
  x: "#a1a1aa",
  facebook: "#818cf8",
  pinterest: "#fb7185",
  email: "#fbbf24",
  other: "#9aa5b8",
};

export const CONTENT_STATUSES = ["IDEA", "DRAFTED", "SCHEDULED", "POSTED"] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const CONTENT_STATUS_LABELS: Record<ContentStatus, string> = {
  IDEA: "Ideas",
  DRAFTED: "Drafted",
  SCHEDULED: "Scheduled",
  POSTED: "Posted",
};

export const CONTENT_FORMATS = ["caption", "reel_script", "carousel", "story", "hooks"] as const;
export type ContentFormat = (typeof CONTENT_FORMATS)[number];

export const CONTENT_FORMAT_LABELS: Record<ContentFormat, string> = {
  caption: "Caption",
  reel_script: "Reel / video script",
  carousel: "Carousel",
  story: "Story",
  hooks: "Hook ideas",
};

// ---- Pipeline (Client & Order Tracker) ----

export const PIPELINE_STAGES = ["LEAD", "IN_TALKS", "COMMITTED", "IN_PROGRESS", "DONE"] as const;
export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export const PIPELINE_STAGE_LABELS: Record<PipelineStage, string> = {
  LEAD: "Lead",
  IN_TALKS: "In Talks",
  COMMITTED: "Committed",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

export const PIPELINE_KINDS = ["client", "order"] as const;
export type PipelineKind = (typeof PIPELINE_KINDS)[number];

export const BUSINESS_STATUS_STYLES: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  launching: { label: "Launching", className: "bg-sky-500/15 text-sky-400 border-sky-500/30" },
  "back-burner": { label: "Back-burner", className: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30" },
};
