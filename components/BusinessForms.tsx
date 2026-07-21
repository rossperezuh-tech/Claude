"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createContact,
  createDocument,
  createLink,
  deleteBusiness,
  deleteContact,
  deleteDocument,
  deleteLink,
} from "@/app/actions";
import { DOC_CATEGORIES } from "@/lib/constants";

export function DeleteBusinessButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="btn text-xs text-ink-faint hover:border-red-400/50 hover:text-red-400"
      >
        Delete venture
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span className="text-ink-dim">Delete “{name}” and everything in it?</span>
      <button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await deleteBusiness(id);
            router.push("/");
          })
        }
        className="btn border-red-500/40 bg-red-500/10 px-2 py-1 text-red-300 hover:bg-red-500/20"
      >
        {pending ? "Deleting…" : "Yes, delete"}
      </button>
      <button
        disabled={pending}
        onClick={() => setConfirming(false)}
        className="btn px-2 py-1 text-ink-faint"
      >
        Cancel
      </button>
    </span>
  );
}

export function DeleteButton({
  kind,
  id,
}: {
  kind: "document" | "contact" | "link";
  id: string;
}) {
  const [, startTransition] = useTransition();
  const [gone, setGone] = useState(false);
  if (gone) return null;
  return (
    <button
      title="Delete"
      onClick={() => {
        setGone(true);
        startTransition(() => {
          if (kind === "document") return deleteDocument(id);
          if (kind === "contact") return deleteContact(id);
          return deleteLink(id);
        });
      }}
      className="text-xs text-ink-faint transition-colors hover:text-red-400"
    >
      ✕
    </button>
  );
}

export function AddDocumentForm({ businessId }: { businessId: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("operations");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [, startTransition] = useTransition();

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn text-xs">
        + Add document
      </button>
    );
  }

  function submit() {
    if (!title.trim() || !url.trim()) return;
    startTransition(() => createDocument({ businessId, title, category, url, notes }));
    setTitle("");
    setUrl("");
    setNotes("");
    setOpen(false);
  }

  return (
    <div className="space-y-2 rounded-md border border-surface-edge p-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="input flex-1" />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="input cursor-pointer capitalize">
          {DOC_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="URL or file path (Drive link, /Volumes/…, etc.)" className="input w-full" />
      <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" className="input w-full" />
      <div className="flex gap-2">
        <button onClick={submit} className="btn text-xs">Save</button>
        <button onClick={() => setOpen(false)} className="btn text-xs text-ink-faint">Cancel</button>
      </div>
    </div>
  );
}

export function AddContactForm({ businessId }: { businessId: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [, startTransition] = useTransition();

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn text-xs">
        + Add contact
      </button>
    );
  }

  function submit() {
    if (!name.trim()) return;
    startTransition(() => createContact({ businessId, name, role, phone, email, notes }));
    setName(""); setRole(""); setPhone(""); setEmail(""); setNotes("");
    setOpen(false);
  }

  return (
    <div className="space-y-2 rounded-md border border-surface-edge p-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="input flex-1" />
        <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role (attorney, supplier…)" className="input flex-1" />
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="input flex-1" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="input flex-1" />
      </div>
      <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" className="input w-full" />
      <div className="flex gap-2">
        <button onClick={submit} className="btn text-xs">Save</button>
        <button onClick={() => setOpen(false)} className="btn text-xs text-ink-faint">Cancel</button>
      </div>
    </div>
  );
}

export function AddLinkForm({ businessId }: { businessId: string }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [, startTransition] = useTransition();

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs text-ink-faint hover:text-ink">
        + link
      </button>
    );
  }

  function submit() {
    if (!label.trim() || !url.trim()) return;
    startTransition(() => createLink({ businessId, label, url }));
    setLabel("");
    setUrl("");
    setOpen(false);
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <input autoFocus value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label" className="input w-28 px-2 py-1 text-xs" />
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="https://…"
        className="input w-44 px-2 py-1 text-xs"
      />
      <button onClick={submit} className="btn px-2 py-1 text-xs">Add</button>
      <button onClick={() => setOpen(false)} className="btn px-2 py-1 text-xs text-ink-faint">✕</button>
    </span>
  );
}
