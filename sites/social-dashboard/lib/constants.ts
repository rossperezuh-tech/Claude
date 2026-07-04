// Validated categorical palette (scripts/validate_palette.js, light mode: all pass).
// Client name/initials always accompany the color, so identity is never
// carried by hue alone — required given the one WARN-band adjacent pair.
export const CLIENT_COLORS = [
  "#3454D1", // blue
  "#158A5A", // green
  "#B4740E", // amber
  "#8B3FD1", // violet
  "#C4342F", // red
  "#0E8FA8", // teal
  "#D1349B", // pink
  "#B4570E", // orange
  "#3D7A2E", // olive
  "#A13D6B", // mauve
];

export function colorForIndex(i: number) {
  return CLIENT_COLORS[i % CLIENT_COLORS.length];
}

export const CLIENT_STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Active",
  ONBOARDING: "Onboarding",
  PAUSED: "Paused",
  CHURNED: "Churned",
};

export const CLIENT_STATUS_STYLE: Record<string, string> = {
  ACTIVE: "bg-good-soft text-good",
  ONBOARDING: "bg-brand-soft text-brand-ink",
  PAUSED: "bg-warn-soft text-warn",
  CHURNED: "bg-bad-soft text-bad",
};

export const CONTRACT_STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  SIGNED: "Signed",
  EXPIRED: "Expired",
};

export const CONTRACT_STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-surface-sunken text-ink-dim",
  SENT: "bg-brand-soft text-brand-ink",
  SIGNED: "bg-good-soft text-good",
  EXPIRED: "bg-bad-soft text-bad",
};

export const CONTRACT_TYPE_LABEL: Record<string, string> = {
  RETAINER: "Retainer",
  PROJECT: "Project",
  ONE_TIME: "One-time",
};

export const INVOICE_STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  PAID: "Paid",
  OVERDUE: "Overdue",
};

export const INVOICE_STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-surface-sunken text-ink-dim",
  SENT: "bg-brand-soft text-brand-ink",
  PAID: "bg-good-soft text-good",
  OVERDUE: "bg-bad-soft text-bad",
};

export const PLATFORM_LABEL: Record<string, string> = {
  INSTAGRAM: "Instagram",
  TIKTOK: "TikTok",
  FACEBOOK: "Facebook",
  TWITTER: "X / Twitter",
  LINKEDIN: "LinkedIn",
  YOUTUBE: "YouTube",
  PINTEREST: "Pinterest",
  OTHER: "Other",
};

export const POST_STATUS_LABEL: Record<string, string> = {
  IDEA: "Idea",
  DRAFTED: "Drafted",
  SCHEDULED: "Scheduled",
  POSTED: "Posted",
};

export const POST_STATUS_STYLE: Record<string, string> = {
  IDEA: "bg-surface-sunken text-ink-dim",
  DRAFTED: "bg-warn-soft text-warn",
  SCHEDULED: "bg-brand-soft text-brand-ink",
  POSTED: "bg-good-soft text-good",
};

export const TASK_STATUS_LABEL: Record<string, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  DONE: "Done",
};

export const PRIORITY_LABEL: Record<string, string> = {
  P1: "P1 · Urgent",
  P2: "P2 · Normal",
  P3: "P3 · Low",
};

export const PRIORITY_STYLE: Record<string, string> = {
  P1: "bg-bad-soft text-bad",
  P2: "bg-brand-soft text-brand-ink",
  P3: "bg-surface-sunken text-ink-dim",
};

export const PLATFORM_OPTIONS = Object.keys(PLATFORM_LABEL);
