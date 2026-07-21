export type ToolStatus = "live" | "soon";

// Section headings shown on the tools page, in display order.
export const TOOL_CATEGORIES = [
  "Assistant",
  "Content & Marketing",
  "Sales & Clients",
  "Real Estate",
  "Documents & Contracts",
  "Operations & Money",
] as const;
export type ToolCategory = (typeof TOOL_CATEGORIES)[number];

export const TOOLS: readonly {
  slug: string;
  name: string;
  description: string;
  status: ToolStatus;
  icon: string;
  accent: string;
  category: ToolCategory;
}[] = [
  {
    slug: "the-brain",
    name: "The Brain",
    description: "Your private HQ assistant. It sees your tasks, contracts, docs, and contacts.",
    status: "live",
    icon: "🧠",
    accent: "#f472b6",
    category: "Assistant",
  },
  {
    slug: "brain-dump",
    name: "Brain Dump",
    description: "Empty your head into one box — AI routes it all to the right venture.",
    status: "live",
    icon: "💭",
    accent: "#a78bfa",
    category: "Assistant",
  },
  {
    slug: "weekly-digest",
    name: "Weekly Digest",
    description: "Your Monday briefing: what happened, what's next, what's at risk.",
    status: "live",
    icon: "📰",
    accent: "#fb923c",
    category: "Assistant",
  },
  {
    slug: "content-studio",
    name: "Content Studio",
    description: "Captions, reel scripts, carousels, and hooks — written in your brand voice.",
    status: "live",
    icon: "🎬",
    accent: "#fb7185",
    category: "Content & Marketing",
  },
  {
    slug: "content-calendar",
    name: "Content Calendar",
    description: "Plan posts per platform and move them from idea to posted.",
    status: "live",
    icon: "🗓️",
    accent: "#22d3ee",
    category: "Content & Marketing",
  },
  {
    slug: "launch-planner",
    name: "Launch Planner",
    description: "Describe a launch, get a dated work-back plan dropped into your backlog.",
    status: "live",
    icon: "🚀",
    accent: "#fbbf24",
    category: "Content & Marketing",
  },
  {
    slug: "pipeline",
    name: "Client & Order Tracker",
    description:
      "Leads, clients, and orders on one board — with public intake links that feed it scored leads.",
    status: "live",
    icon: "📊",
    accent: "#4ade80",
    category: "Sales & Clients",
  },
  {
    slug: "follow-up",
    name: "Follow-Up Assistant",
    description: "Finds clients, leads, and deals gone quiet — and drafts the nudge to send.",
    status: "live",
    icon: "🔔",
    accent: "#fb7185",
    category: "Sales & Clients",
  },
  {
    slug: "outreach-writer",
    name: "Outreach Writer",
    description: "Cold intros, follow-ups, pitches, and re-engagement emails in your brand voice.",
    status: "live",
    icon: "✉️",
    accent: "#38bdf8",
    category: "Sales & Clients",
  },
  {
    slug: "proposals",
    name: "Proposals & Invoices",
    description: "Turn a pipeline client into a ready-to-send proposal or invoice.",
    status: "live",
    icon: "🧾",
    accent: "#38bdf8",
    category: "Sales & Clients",
  },
  {
    slug: "client-report",
    name: "Client Report",
    description: "The \"here's what we did for you\" report, generated from real activity.",
    status: "live",
    icon: "📈",
    accent: "#a3e635",
    category: "Sales & Clients",
  },
  {
    slug: "testimonials",
    name: "Testimonial Collector",
    description: "Store reviews and testimonials, and track which you've published.",
    status: "live",
    icon: "🌟",
    accent: "#fbbf24",
    category: "Sales & Clients",
  },
  {
    slug: "deal-tracker",
    name: "Deal Tracker",
    description:
      "Real estate pipeline lead-to-close, plus an AI deal analyzer for listings and seller notes.",
    status: "live",
    icon: "🏢",
    accent: "#f59e0b",
    category: "Real Estate",
  },
  {
    slug: "document-reader",
    name: "Document Reader",
    description: "Upload a contract or brief, get a summary with the key clauses highlighted.",
    status: "live",
    icon: "📄",
    accent: "#60a5fa",
    category: "Documents & Contracts",
  },
  {
    slug: "contract-manager",
    name: "The Contract Manager",
    description: "Drafts agreements, tracks dates, flags renewals and deadlines early.",
    status: "live",
    icon: "✍️",
    accent: "#818cf8",
    category: "Documents & Contracts",
  },
  {
    slug: "meeting-notes",
    name: "Meeting Notes",
    description: "Turns meeting and deposition notes into a simple to-do list.",
    status: "live",
    icon: "🗒️",
    accent: "#34d399",
    category: "Documents & Contracts",
  },
  {
    slug: "sop-writer",
    name: "SOP Writer",
    description: "Describe how something gets done — get a procedure a new hire can follow.",
    status: "live",
    icon: "📋",
    accent: "#2dd4bf",
    category: "Operations & Money",
  },
  {
    slug: "onboarding-kit",
    name: "Onboarding Kit",
    description: "A welcome doc + checklist for a new client or a new hire, ready to send.",
    status: "live",
    icon: "🎒",
    accent: "#34d399",
    category: "Operations & Money",
  },
  {
    slug: "cash-flow",
    name: "Cash Flow Forecaster",
    description: "Reads your Money Log and projects the next few months — trend, net, runway.",
    status: "live",
    icon: "📉",
    accent: "#22d3ee",
    category: "Operations & Money",
  },
  {
    slug: "invoice-tracker",
    name: "Invoice & Payment Tracker",
    description: "Track who owes what, what's paid, and what's overdue.",
    status: "live",
    icon: "💵",
    accent: "#4ade80",
    category: "Operations & Money",
  },
  {
    slug: "goals",
    name: "Goals & KPI Tracker",
    description: "Set targets per venture and track progress toward them.",
    status: "live",
    icon: "🎯",
    accent: "#f472b6",
    category: "Operations & Money",
  },
  {
    slug: "money-log",
    name: "Money Log",
    description: "Quick-log money in and out per venture, with a monthly net rollup.",
    status: "live",
    icon: "💰",
    accent: "#facc15",
    category: "Operations & Money",
  },
  {
    slug: "usage",
    name: "Usage & Billing",
    description: "Metered AI usage by tool with estimated cost, month by month.",
    status: "live",
    icon: "⚡",
    accent: "#c084fc",
    category: "Operations & Money",
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
