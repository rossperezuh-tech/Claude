import { useEffect, useState } from "react";
import { BookOpen, Calculator, ClipboardList, Home as HomeIcon, PlayCircle, Settings as SettingsIcon, Timer, type LucideIcon } from "lucide-react";
import Home from "./screens/Home";
import Plan from "./screens/Plan";
import Videos from "./screens/Videos";
import Study from "./screens/Study";
import Log from "./screens/Log";
import Practice from "./screens/Practice";
import Settings from "./screens/Settings";
import type { Route } from "./lib/nav";


const TABS: { id: Route; label: string; title: string; icon: LucideIcon }[] = [
  { id: "home", label: "Home", title: "Overview", icon: HomeIcon },
  { id: "plan", label: "Plan", title: "6-Week Plan", icon: ClipboardList },
  { id: "videos", label: "Videos", title: "Videos", icon: PlayCircle },
  { id: "study", label: "Study", title: "Study", icon: BookOpen },
  { id: "log", label: "Log", title: "Study Log", icon: Timer },
  { id: "case", label: "Case", title: "Practice Case · 120 Kent", icon: Calculator },
];

const ROUTES: Route[] = [...TABS.map((t) => t.id), "settings"];
const readHash = (): Route => {
  const h = window.location.hash.replace(/^#\/?/, "") as Route;
  return ROUTES.includes(h) ? h : "home";
};

export default function App() {
  const [route, setRoute] = useState<Route>(readHash);
  useEffect(() => {
    const on = () => {
      setRoute(readHash());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);

  const title = route === "settings" ? "Settings" : TABS.find((t) => t.id === route)!.title;

  return (
    <div className="min-h-screen md:flex">
      {/* Desktop sidebar */}
      <nav className="hidden md:flex md:flex-col md:w-60 md:shrink-0 md:sticky md:top-0 md:h-screen border-r border-edge bg-surface px-3 py-5 gap-1" aria-label="Main">
        <div className="px-3 pb-5">
          <div className="text-lg font-bold tracking-tight">ARGUS Prep</div>
          <div className="text-sm text-faint">Enterprise certification</div>
        </div>
        {[...TABS, { id: "settings" as Route, label: "Settings", title: "Settings", icon: SettingsIcon }].map((t) => (
          <a
            key={t.id}
            href={`#/${t.id}`}
            aria-current={route === t.id ? "page" : undefined}
            className={`flex items-center gap-3 min-h-[48px] px-3 rounded-xl font-semibold transition-colors ${
              route === t.id ? "bg-accent-soft text-accent" : "text-dim hover:bg-raised hover:text-ink"
            } ${t.id === "settings" ? "mt-auto" : ""}`}
          >
            <t.icon size={22} strokeWidth={2} aria-hidden />
            {t.id === "case" ? "Practice Case" : t.label}
          </a>
        ))}
      </nav>

      <div className="flex-1 min-w-0">
        <header
          className="sticky top-0 z-20 bg-bg/90 backdrop-blur border-b border-edge md:border-none md:bg-transparent md:backdrop-blur-none md:static"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-2 px-4 md:px-8 h-16 md:h-20">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight truncate">{title}</h1>
            <a href="#/settings" className="icon-btn md:hidden" aria-label="Settings">
              <SettingsIcon size={24} aria-hidden />
            </a>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 md:px-8 pt-4 pb-32 md:pb-12">
          {route === "home" && <Home />}
          {route === "plan" && <Plan />}
          {route === "videos" && <Videos />}
          {route === "study" && <Study />}
          {route === "log" && <Log />}
          {route === "case" && <Practice />}
          {route === "settings" && <Settings />}
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-surface/95 backdrop-blur border-t border-edge"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Main"
      >
        <div className="grid grid-cols-6">
          {TABS.map((t) => (
            <a
              key={t.id}
              href={`#/${t.id}`}
              aria-current={route === t.id ? "page" : undefined}
              className={`flex flex-col items-center justify-center gap-1 h-16 text-[13px] font-semibold ${
                route === t.id ? "text-accent" : "text-faint"
              }`}
            >
              <t.icon size={24} strokeWidth={route === t.id ? 2.4 : 2} aria-hidden />
              {t.label}
            </a>
          ))}
        </div>
      </nav>
    </div>
  );
}
