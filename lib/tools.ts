export type ToolStatus = "live" | "soon";

export const TOOLS: readonly {
  slug: string;
  name: string;
  description: string;
  status: ToolStatus;
  icon: string;
  accent: string;
}[] = [
  {
    slug: "document-reader",
    name: "Document Reader",
    description: "Upload a contract or brief, get a summary with the key clauses highlighted.",
    status: "live",
    icon: "📄",
    accent: "#60a5fa",
  },
  {
    slug: "contract-manager",
    name: "The Contract Manager",
    description: "Drafts agreements, tracks dates, flags renewals and deadlines early.",
    status: "live",
    icon: "✍️",
    accent: "#818cf8",
  },
  {
    slug: "meeting-notes",
    name: "Meeting Notes",
    description: "Turns meeting and deposition notes into a simple to-do list.",
    status: "live",
    icon: "🗒️",
    accent: "#34d399",
  },
  {
    slug: "the-brain",
    name: "The Brain",
    description: "Your private HQ assistant. It sees your tasks, contracts, docs, and contacts.",
    status: "live",
    icon: "🧠",
    accent: "#f472b6",
  },
  {
    slug: "content-studio",
    name: "Content Studio",
    description: "Captions, reel scripts, carousels, and hooks — written in your brand voice.",
    status: "live",
    icon: "🎬",
    accent: "#fb7185",
  },
  {
    slug: "content-calendar",
    name: "Content Calendar",
    description: "Plan posts per platform and move them from idea to posted.",
    status: "live",
    icon: "🗓️",
    accent: "#22d3ee",
  },
  {
    slug: "launch-planner",
    name: "Launch Planner",
    description: "Describe a launch, get a dated work-back plan dropped into your backlog.",
    status: "live",
    icon: "🚀",
    accent: "#fbbf24",
  },
  {
    slug: "pipeline",
    name: "Client & Order Tracker",
    description:
      "Leads, clients, and orders on one board — with public intake links that feed it scored leads.",
    status: "live",
    icon: "📊",
    accent: "#4ade80",
  },
  {
    slug: "brain-dump",
    name: "Brain Dump",
    description: "Empty your head into one box — AI routes it all to the right venture.",
    status: "live",
    icon: "💭",
    accent: "#a78bfa",
  },
  {
    slug: "proposals",
    name: "Proposals & Invoices",
    description: "Turn a pipeline client into a ready-to-send proposal or invoice.",
    status: "live",
    icon: "🧾",
    accent: "#38bdf8",
  },
  {
    slug: "sop-writer",
    name: "SOP Writer",
    description: "Describe how something gets done — get a procedure a new hire can follow.",
    status: "live",
    icon: "📋",
    accent: "#2dd4bf",
  },
  {
    slug: "client-report",
    name: "Client Report",
    description: "The \"here's what we did for you\" report, generated from real activity.",
    status: "live",
    icon: "📈",
    accent: "#a3e635",
  },
  {
    slug: "deal-tracker",
    name: "Deal Tracker",
    description:
      "Real estate pipeline lead-to-close, plus an AI deal analyzer for listings and seller notes.",
    status: "live",
    icon: "🏢",
    accent: "#f59e0b",
  },
  {
    slug: "money-log",
    name: "Money Log",
    description: "Quick-log money in and out per venture, with a monthly net rollup.",
    status: "live",
    icon: "💰",
    accent: "#facc15",
  },
  {
    slug: "weekly-digest",
    name: "Weekly Digest",
    description: "Your Monday briefing: what happened, what's next, what's at risk.",
    status: "live",
    icon: "📰",
    accent: "#fb923c",
  },
  {
    slug: "usage",
    name: "Usage & Billing",
    description: "Metered AI usage by tool with estimated cost, month by month.",
    status: "live",
    icon: "⚡",
    accent: "#c084fc",
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
