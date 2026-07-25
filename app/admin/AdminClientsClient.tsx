"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { setEnabledTools, deleteOrganization } from "@/app/actions";
import { TOOLS } from "@/lib/tools";

interface OrgRow {
  id: string;
  name: string;
  clerkUserId: string;
  enabledTools: string[];
  businessCount: number;
}

export default function AdminClientsClient({
  orgs,
  myOrgId,
}: {
  orgs: OrgRow[];
  myOrgId: string;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

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
        {orgs.map((org) => {
          const isMe = org.id === myOrgId;
          return (
            <div key={org.id} className="p-4">
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {org.name}
                    {isMe && (
                      <span className="ml-2 chip border-indigo-400/50 text-indigo-300">You</span>
                    )}
                  </p>
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
                  onClick={() => {
                    setOpenId(openId === org.id ? null : org.id);
                    setDeleteId(null);
                  }}
                >
                  {openId === org.id ? "Close" : "Manage tools"}
                </button>
                {!isMe && (
                  <button
                    type="button"
                    className="btn border-red-500/40 text-xs text-red-300 hover:bg-red-500/10"
                    onClick={() => {
                      setDeleteId(deleteId === org.id ? null : org.id);
                      setOpenId(null);
                    }}
                  >
                    {deleteId === org.id ? "Cancel" : "Delete"}
                  </button>
                )}
              </div>
              {openId === org.id && <ToolPicker org={org} />}
              {deleteId === org.id && (
                <DeletePanel org={org} onCancel={() => setDeleteId(null)} />
              )}
            </div>
          );
        })}
        {orgs.length === 0 && (
          <p className="p-4 text-sm text-ink-faint">No accounts yet.</p>
        )}
      </div>
    </div>
  );
}

/**
 * Type-the-name-to-confirm delete. Wiping an account is irreversible, so the
 * button stays disabled until the typed name matches exactly.
 */
function DeletePanel({ org, onCancel }: { org: OrgRow; onCancel: () => void }) {
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const matches = typed.trim() === org.name.trim();

  function run() {
    setError(null);
    startTransition(async () => {
      const res = await deleteOrganization(org.id, typed);
      if (!res?.ok) setError(res?.error ?? "Could not delete that account.");
      else onCancel();
    });
  }

  return (
    <div className="mt-3 space-y-2 rounded-md border border-red-500/30 bg-red-500/5 p-3">
      <p className="text-sm text-red-200">
        Permanently delete <span className="font-medium">{org.name}</span>?
      </p>
      <p className="text-xs text-ink-dim">
        This erases all {org.businessCount} venture{org.businessCount === 1 ? "" : "s"} and
        everything in them — tasks, documents, contacts, deals, content, invoices, money log,
        and usage history. It cannot be undone. Their login still works: if they sign in again
        they'll start over with a brand-new empty account.
      </p>
      <label className="block text-xs text-ink-dim">
        Type <span className="font-medium text-ink">{org.name}</span> to confirm:
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={org.name}
          autoFocus
          className="input mt-1 w-full text-sm"
        />
      </label>
      {error && <p className="text-xs text-red-300">{error}</p>}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          disabled={!matches || pending}
          onClick={run}
          className="btn border-red-500/50 bg-red-500/15 text-xs text-red-200 hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? "Deleting…" : "Delete this account permanently"}
        </button>
        <button type="button" className="btn text-xs" disabled={pending} onClick={onCancel}>
          Cancel
        </button>
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
