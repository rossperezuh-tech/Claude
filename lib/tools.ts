export type ToolStatus = "live" | "soon";

export const TOOLS: readonly {
  slug: string;
  name: string;
  description: string;
  status: ToolStatus;
}[] = [
  {
    slug: "document-reader",
    name: "Document Reader",
    description: "Upload a contract or brief, get a summary with the key clauses highlighted.",
    status: "live",
  },
  {
    slug: "contract-manager",
    name: "The Contract Manager",
    description: "Drafts agreements, tracks dates, flags renewals and deadlines early.",
    status: "live",
  },
  {
    slug: "meeting-notes",
    name: "Meeting Notes",
    description: "Turns meeting and deposition notes into a simple to-do list.",
    status: "live",
  },
  {
    slug: "the-brain",
    name: "The Brain",
    description: "Your private HQ assistant. It sees your tasks, contracts, docs, and contacts.",
    status: "live",
  },
  {
    slug: "content-studio",
    name: "Content Studio",
    description: "Captions, reel scripts, carousels, and hooks — written in your brand voice.",
    status: "live",
  },
  {
    slug: "content-calendar",
    name: "Content Calendar",
    description: "Plan posts per platform and move them from idea to posted.",
    status: "live",
  },
  {
    slug: "launch-planner",
    name: "Launch Planner",
    description: "Describe a launch, get a dated work-back plan dropped into your backlog.",
    status: "live",
  },
  {
    slug: "pipeline",
    name: "Client & Order Tracker",
    description: "Leads, clients, and orders on one board with pipeline value per stage.",
    status: "live",
  },
] as const;

export const TOOL_STATUS_STYLES: Record<ToolStatus, { label: string; className: string }> = {
  live: { label: "Live", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  soon: { label: "Coming soon", className: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30" },
};

// ---- Document Reader result shape (mirrors the JSON schema in the API route) ----

export type ClauseImportance = "high" | "medium" | "low";

export interface DocumentAnalysis {
  document_type: string;
  parties: string[];
  summary: string;
  key_clauses: {
    title: string;
    importance: ClauseImportance;
    quote: string;
    explanation: string;
  }[];
  key_dates: {
    date: string;
    description: string;
  }[];
  risks: {
    severity: ClauseImportance;
    description: string;
  }[];
  unusual_or_missing: string[];
}
