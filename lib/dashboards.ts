// Home-dashboard templates. Each picks which panels show, in what order, and a
// row of "featured tools" surfaced at the top for that kind of business.
// Panels: "featured" | "today" | "ventures" | "calendar".

export type DashboardPanel = "featured" | "today" | "ventures" | "calendar";

export interface DashboardTemplate {
  id: string;
  name: string;
  blurb: string;
  featured: string[]; // tool slugs
  panels: DashboardPanel[];
}

export const DASHBOARD_TEMPLATES: DashboardTemplate[] = [
  {
    id: "command-center",
    name: "Command Center",
    blurb: "Everything — for running many ventures at once.",
    featured: [],
    panels: ["today", "ventures", "calendar"],
  },
  {
    id: "content",
    name: "Content Studio",
    blurb: "For a social / content business — content front and center.",
    featured: ["content-studio", "content-calendar", "brain-dump", "the-brain"],
    panels: ["featured", "today", "calendar", "ventures"],
  },
  {
    id: "deal-desk",
    name: "Deal Desk",
    blurb: "For real estate — deals and follow-ups first.",
    featured: ["deal-tracker", "follow-up", "outreach-writer", "the-brain"],
    panels: ["featured", "today", "calendar", "ventures"],
  },
  {
    id: "client-hq",
    name: "Client HQ",
    blurb: "For agencies & consultants — win, deliver, get paid.",
    featured: ["pipeline", "proposals", "invoice-tracker", "client-report"],
    panels: ["featured", "today", "ventures", "calendar"],
  },
  {
    id: "brand-ops",
    name: "Brand Ops",
    blurb: "For a product brand — marketing, money, and orders.",
    featured: ["content-studio", "money-log", "invoice-tracker", "pipeline"],
    panels: ["featured", "today", "calendar", "ventures"],
  },
];

export function getDashboardTemplate(id: string | undefined | null): DashboardTemplate {
  return DASHBOARD_TEMPLATES.find((t) => t.id === id) ?? DASHBOARD_TEMPLATES[0];
}
