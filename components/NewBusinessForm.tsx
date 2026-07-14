"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBusiness } from "@/app/actions";

/**
 * Create-a-business form. `compact` renders the inline "add venture" variant
 * for the dashboard grid; the default is the onboarding layout.
 */
export default function NewBusinessForm({
  compact = false,
  autoFocus = false,
}: {
  compact?: boolean;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("active");
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || pending) return;
    startTransition(async () => {
      const slug = await createBusiness({ name, description, status });
      setName("");
      setDescription("");
      if (slug) router.push(`/business/${slug}`);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      {!compact && (
        <label className="block text-xs font-medium uppercase tracking-wider text-ink-dim">
          Your first venture
        </label>
      )}
      <input
        className="input w-full text-sm"
        placeholder={compact ? "Add a venture…" : "Business name (e.g. Studio Luma Social)"}
        value={name}
        autoFocus={autoFocus}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className="input w-full text-sm"
        placeholder="One-line description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div className="flex items-center gap-2">
        <select
          className="input text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="active">Active</option>
          <option value="launching">Launching</option>
          <option value="back-burner">Back-burner</option>
        </select>
        <button
          type="submit"
          disabled={pending || !name.trim()}
          className="btn border-indigo-400/50 bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Creating…" : compact ? "Add" : "Create business"}
        </button>
      </div>
    </form>
  );
}
