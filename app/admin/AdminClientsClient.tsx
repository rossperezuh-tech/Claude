"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { setEnabledTools } from "@/app/actions";
import { TOOLS } from "@/lib/tools";

interface OrgRow {
  id: string;
  name: string;
  clerkUserId: string;
  enabledTools: string[];
  businessCount: number;
}

export default function AdminClientsClient({ orgs }: { orgs: OrgRow[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <div className="text-xs text-ink-faint">
          <Link href="/tools" className="hover:text-ink-dim">Tools</Link> / Admin
        </div>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">Client Accounts</h1>
        <p className="mt-1 text-sm text-ink-dim">
          Every account on the platform. Curate which tools each one can see — leave all
          checked to show everything (the default for new accounts).
        </p>
      </div>

      <div className="card divide-y divide-surface-edge/60">
        {orgs.map((org) => (
          <div key={org.id} className="p-4">
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{org.name}</p>
                <p className="truncate text-xs text-ink-faint">
                  {org.businessCount} venture{org.businessCount === 1 ? "" : "s"} ·{" "}
                  {org.enabledTools.length === 0
                    ? "all tools enabled"
                    : `${org.enabledTools.length} of ${TOOLS.length} tools enabled`}
                </p>
              </div>
              <button
                type="button"
                className="btn text-xs"
                onClick={() => setOpenId(openId === org.id ? null : org.id)}
              >
                {openId === org.id ? "Close" : "Manage tools"}
              </button>
            </div>
            {openId === org.id && <ToolPicker org={org} />}
          </div>
        ))}
        {orgs.length === 0 && (
          <p className="p-4 text-sm text-ink-faint">No accounts yet.</p>
        )}
      </div>
    </div>
  );
}

function ToolPicker({ org }: { org: OrgRow }) {
  // Empty stored list means "all enabled" — start the picker fully checked
  // in that case so unchecking one tool is the first real narrowing action.
  const [selected, setSelected] = useState<Set<string>>(
    new Set(org.enabledTools.length > 0 ? org.enabledTools : TOOLS.map((t) => t.slug)),
  );
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function toggle(slug: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
    setSaved(false);
  }

  function save(tools: string[]) {
    startTransition(async () => {
      await setEnabledTools(org.id, tools);
      setSaved(true);
    });
  }

  return (
    <div className="mt-3 space-y-2 rounded-md border border-surface-edge bg-surface-overlay/50 p-3">
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {TOOLS.map((tool) => (
          <label key={tool.slug} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selected.has(tool.slug)}
              onChange={() => toggle(tool.slug)}
              className="accent-indigo-400"
            />
            {tool.name}
          </label>
        ))}
      </div>
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          className="btn text-xs"
          disabled={pending}
          onClick={() => save(Array.from(selected))}
        >
          {pending ? "Saving…" : saved ? "Saved ✓" : "Save"}
        </button>
        <button
          type="button"
          className="btn text-xs"
          disabled={pending}
          onClick={() => {
            setSelected(new Set(TOOLS.map((t) => t.slug)));
            save([]); // explicit "all enabled" — store as empty, not a full list
          }}
        >
          Enable all
        </button>
      </div>
    </div>
  );
}
