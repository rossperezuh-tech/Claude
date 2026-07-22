// Home-dashboard templates. Each is a business-type layout that renders a set
// of live widgets in order. Widgets read the account's real data (deals,
// pipeline, invoices, money log, content calendar) so each dashboard feels
// built for that kind of operator.

export type DashboardWidget =
  | "featured"
  | "today"
  | "ventures"
  | "calendar"
  | "content-week"
  | "content-pipeline"
  | "deals"
  | "client-pipeline"
  | "invoices"
  | "money"
  | "orders";

export interface DashboardTemplate {
  id: string;
  name: string;
  blurb: string;
  featured: string[]; // tool slugs for the Quick tools row
  widgets: DashboardWidget[];
}

export const DASHBOARD_TEMPLATES: DashboardTemplate[] = [
  {
    id: "command-center",
    name: "Command Center",
    blurb: "Everything — for running many ventures at once.",
    featured: [],
    widgets: ["today", "ventures", "calendar"],
  },
  {
    id: "content",
    name: "Creator / Social",
    blurb: "Content front and center — for a single social / content brand.",
    featured: ["content-studio", "content-calendar", "brain-dump", "the-brain"],
    widgets: ["featured", "content-week", "content-pipeline", "today"],
  },
  {
    id: "smm",
    name: "Social Media Manager",
    blurb: "Content across all your client accounts — for managing many brands.",
    featured: ["content-studio", "content-calendar", "client-report", "pipeline"],
    widgets: ["featured", "content-week", "ventures", "content-pipeline", "client-pipeline", "today"],
  },
  {
    id: "deal-desk",
    name: "Real Estate",
    blurb: "Deals and closings first — for real estate.",
    featured: ["deal-tracker", "follow-up", "outreach-writer"],
    widgets: ["featured", "deals", "client-pipeline", "calendar", "today"],
  },
  {
    id: "client-hq",
    name: "Agency / Consulting",
    blurb: "Win, deliver, get paid — for agencies & consultants.",
    featured: ["pipeline", "proposals", "client-report"],
    widgets: ["featured", "client-pipeline", "invoices", "today"],
  },
  {
    id: "brand-ops",
    name: "Product / E-commerce",
    blurb: "Money, orders, and marketing — for a product brand.",
    featured: ["content-studio", "money-log", "invoice-tracker"],
    widgets: ["featured", "money", "orders", "content-week", "today"],
  },
];

export function getDashboardTemplate(id: string | undefined | null): DashboardTemplate {
  return DASHBOARD_TEMPLATES.find((t) => t.id === id) ?? DASHBOARD_TEMPLATES[0];
}
