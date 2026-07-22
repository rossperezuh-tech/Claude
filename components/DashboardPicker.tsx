"use client";

import { useTransition } from "react";
import { setDashboardTemplate } from "@/app/actions";
import { DASHBOARD_TEMPLATES } from "@/lib/dashboards";

export default function DashboardPicker({ current }: { current: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <label className="flex items-center gap-1.5 text-xs text-ink-faint">
      <span className="hidden sm:inline">Dashboard</span>
      <select
        value={current}
        disabled={pending}
        onChange={(e) => startTransition(() => setDashboardTemplate(e.target.value))}
        className="input cursor-pointer py-1 text-xs"
        title="Switch dashboard layout"
      >
        {DASHBOARD_TEMPLATES.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </label>
  );
}
