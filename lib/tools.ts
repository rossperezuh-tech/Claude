export const TOOLS = [
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
    description: "Your private AI and voice-note bot. Everything plugs into it.",
    status: "soon",
  },
] as const;

export type ToolStatus = (typeof TOOLS)[number]["status"];

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
