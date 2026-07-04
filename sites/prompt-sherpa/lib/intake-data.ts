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

export const EMAIL = "hello@thepromptsherpa.com";
export const STORAGE_KEY = "intake_sherpa";

// Copy is preserved verbatim from the original intake site — design only.
export const SECTIONS: Section[] = [
  {
    title: "The idea",
    blurb: "Plain words.",
    q: [
      {
        id: "idea",
        label: "What's the idea, in one or two sentences?",
        type: "textarea",
        ph: "e.g. An app where dog owners find trusted last-minute walkers nearby.",
      },
      {
        id: "who",
        label: "Who is it for?",
        type: "text",
        ph: "e.g. Busy dog owners in Brooklyn.",
      },
      {
        id: "replaces",
        label: "What do they use or do instead today?",
        type: "text",
        ph: "e.g. Begging in Facebook groups or skipping the walk.",
      },
    ],
  },
  {
    title: "Version one",
    blurb: "The smallest thing worth building.",
    q: [
      {
        id: "coreaction",
        label: "What's the ONE thing a user must be able to do in v1?",
        help: "Just one. Everything else waits.",
        type: "text",
        ph: "e.g. Post a walk request and get a response.",
      },
      {
        id: "buildtype",
        label: "What are we building first?",
        type: "chips",
        opts: [
          "Landing page + waitlist",
          "Simple web app",
          "Booking / requests",
          "Marketplace",
          "Internal tool",
          "Not sure — advise me",
        ],
        other: true,
      },
      {
        id: "features",
        label: "Which of these does v1 need?",
        type: "chips",
        opts: [
          "Payments",
          "User accounts",
          "Messaging",
          "Notifications",
          "None yet",
          "Not sure",
        ],
        other: true,
      },
    ],
  },
  {
    title: "Name & look",
    blurb: "What exists already.",
    q: [
      {
        id: "assets",
        label: "Do you have a name, logo, or colors?",
        type: "text",
        ph: "e.g. Name and Instagram handle reserved. No logo.",
      },
      {
        id: "reference",
        label: "Name 1–2 products or sites that feel like what you want.",
        type: "text",
        ph: "e.g. Rover's simplicity, Airbnb's trust feel.",
      },
      {
        id: "lookfeel",
        label: "How should it feel?",
        type: "chips",
        opts: [
          "Simple & clean",
          "Friendly & fun",
          "Premium & polished",
          "Bold & loud",
          "Not sure yet",
        ],
        other: false,
      },
    ],
  },
  {
    title: "Budget & timing",
    blurb: "The practical part.",
    q: [
      {
        id: "budget",
        label: "Budget range for v1?",
        type: "chips",
        opts: ["Under $1k", "$1–3k", "$3–8k", "$8k+", "Not sure yet"],
        other: false,
      },
      {
        id: "timeline",
        label: "Any deadline?",
        type: "text",
        ph: "e.g. Pitch event in 6 weeks — or no deadline.",
      },
    ],
  },
  {
    title: "Launch",
    blurb: "Concept meets reality.",
    q: [
      {
        id: "firstusers",
        label: "Who are your first 10 users, and how will you reach them?",
        type: "textarea",
        ph: "e.g. My dog park group chat — about 30 people. I'll post it there.",
      },
      {
        id: "success",
        label: "What result makes you keep going?",
        type: "text",
        ph: "e.g. 20 sign-ups in the first month.",
      },
    ],
  },
];

export function chipDisplay(value: string): string {
  return value.split("|").filter(Boolean).join(", ");
}

export function buildSummary(data: Record<string, string>): string {
  let out = `BUILD INTAKE — The Prompt Sherpa\nSubmitted ${new Date().toLocaleDateString(
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
