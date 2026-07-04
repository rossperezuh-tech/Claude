export type Question = {
  id: string;
  label: string;
  type: "text" | "textarea" | "chips";
  ph?: string;
  help?: string;
  opts?: string[];
  other?: boolean;
};

export type Section = {
  title: string;
  blurb: string;
  q: Question[];
};

export const EMAIL = "hello@steadyhand.ai";
export const STORAGE_KEY = "intake_steadyhand";

// Copy is preserved verbatim from the original intake site — design only.
export const SECTIONS: Section[] = [
  {
    title: "Your business",
    blurb: "The basics.",
    q: [
      {
        id: "business",
        label: "What does your business do?",
        type: "text",
        ph: "e.g. Property management — 40 buildings in Brooklyn.",
      },
      {
        id: "teamsize",
        label: "How many people are on your team?",
        type: "text",
        ph: "e.g. 6",
      },
      {
        id: "systems",
        label: "What tools do you run on day to day?",
        type: "text",
        ph: "e.g. Gmail, QuickBooks, Google Drive, Jobber.",
      },
    ],
  },
  {
    title: "The task to fix",
    blurb: "One task at a time.",
    q: [
      {
        id: "task",
        label: "Which task do you want handled?",
        type: "chips",
        opts: [
          "Customer emails",
          "Quotes & proposals",
          "Invoices & follow-ups",
          "Scheduling",
          "Reports & paperwork",
          "Marketing content",
        ],
        other: true,
      },
      {
        id: "current",
        label: "How is it done today, step by step?",
        type: "textarea",
        ph: "e.g. Customer emails us → we copy an old quote → edit prices by hand → send.",
      },
      {
        id: "volume",
        label: "How often, and how long does it take?",
        type: "text",
        ph: "e.g. ~20 times a week, 15 minutes each.",
      },
    ],
  },
  {
    title: "Examples",
    blurb: "What Claude learns from.",
    q: [
      {
        id: "examples",
        label: "What real examples can you send?",
        help: "Past emails, quotes, documents — 3 to 5 is plenty. Attach them when you submit.",
        type: "textarea",
        ph: "e.g. Three recent quotes and our email template.",
      },
      {
        id: "goodlooks",
        label: "What does a good result look like?",
        type: "text",
        ph: "e.g. Sounds like me, correct pricing, ready to send with one quick read.",
      },
    ],
  },
  {
    title: "Requirements",
    blurb: "The rules it must follow.",
    q: [
      {
        id: "tone",
        label: "How should it sound?",
        type: "chips",
        opts: ["Professional", "Friendly", "Straight-talking", "Warm & local"],
        other: true,
      },
      {
        id: "rules",
        label: "Any rules it must follow?",
        help: "Pricing rules, legal or industry requirements, things it must never say.",
        type: "textarea",
        ph: "e.g. Never quote below our minimum. All medical info stays HIPAA-safe.",
      },
      {
        id: "privacy",
        label: "Any data that can't go into cloud tools?",
        help: "If yes, we set up private AI on your own hardware instead.",
        type: "text",
        ph: "e.g. Client financials — or no, nothing sensitive.",
      },
    ],
  },
  {
    title: "Scope",
    blurb: "Budget, timing, success.",
    q: [
      {
        id: "budget",
        label: "Budget range?",
        type: "chips",
        opts: ["Under $1k", "$1–3k", "$3–8k", "$8k+", "Not sure yet"],
        other: false,
      },
      {
        id: "timeline",
        label: "Any deadline?",
        type: "text",
        ph: "e.g. Before October — or no rush.",
      },
      {
        id: "success",
        label: "What result makes this a win?",
        type: "text",
        ph: "e.g. My team gets 5+ hours back a week.",
      },
    ],
  },
];

export function chipDisplay(value: string): string {
  return value.split("|").filter(Boolean).join(", ");
}

export function buildSummary(data: Record<string, string>): string {
  let out = `PROJECT INTAKE — Steadyhand\nSubmitted ${new Date().toLocaleDateString(
    "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  )}\n${"=".repeat(48)}\n`;
  SECTIONS.forEach((sec) => {
    out += `\n${sec.title.toUpperCase()}\n`;
    sec.q.forEach((q) => {
      let a = data[q.id] || "";
      if (q.type === "chips") a = chipDisplay(a);
      out += `\n• ${q.label}\n  ${a || "(skipped)"}\n`;
    });
  });
  return out;
}
