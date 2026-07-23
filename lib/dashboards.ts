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
    blurb: "Everything — for running several businesses at once.",
    featured: [],
    widgets: ["today", "ventures", "calendar"],
  },
  {
    id: "single-business",
    name: "Single Business",
    blurb: "One business, all in one place — tasks, pipeline, and money.",
    featured: ["the-brain", "content-studio", "money-log"],
    widgets: ["featured", "today", "calendar", "client-pipeline", "money"],
  },
  {
    id: "smm",
    name: "Brand Manager",
    blurb: "Content across all your client brands — for managing many brands at once.",
    featured: ["content-studio", "content-calendar", "client-report", "pipeline"],
    widgets: ["featured", "content-week", "ventures", "content-pipeline", "client-pipeline", "today"],
  },
];

export function getDashboardTemplate(id: string | undefined | null): DashboardTemplate {
  return DASHBOARD_TEMPLATES.find((t) => t.id === id) ?? DASHBOARD_TEMPLATES[0];
}
