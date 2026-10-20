export type Route = "home" | "plan" | "videos" | "study" | "log" | "case" | "settings";

export function go(r: Route) {
  window.location.hash = `/${r}`;
}
