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
    description:
      "Leads, clients, and orders on one board — with public intake links that feed it scored leads.",
    status: "live",
  },
  {
    slug: "brain-dump",
    name: "Brain Dump",
    description: "Empty your head into one box — AI routes it all to the right venture.",
    status: "live",
  },
  {
    slug: "proposals",
    name: "Proposals & Invoices",
    description: "Turn a pipeline client into a ready-to-send proposal or invoice.",
    status: "live",
  },
  {
    slug: "sop-writer",
    name: "SOP Writer",
    description: "Describe how something gets done — get a procedure a new hire can follow.",
    status: "live",
  },
  {
    slug: "client-report",
    name: "Client Report",
    description: "The \"here's what we did for you\" report, generated from real activity.",
    status: "live",
  },
  {
    slug: "deal-tracker",
    name: "Deal Tracker",
    description:
      "Real estate pipeline lead-to-close, plus an AI deal analyzer for listings and seller notes.",
    status: "live",
  },
  {
    slug: "money-log",
    name: "Money Log",
    description: "Quick-log money in and out per venture, with a monthly net rollup.",
    status: "live",
  },
  {
    slug: "weekly-digest",
    name: "Weekly Digest",
    description: "Your Monday briefing: what happened, what's next, what's at risk.",
    status: "live",
  },
  {
    slug: "usage",
    name: "Usage & Billing",
    description: "Metered AI usage by tool with estimated cost, month by month.",
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
