"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createContact,
  createDocument,
  createLink,
  deleteBusiness,
  deleteContact,
  deleteDocument,
  deleteLink,
  setBusinessLogo,
  updateBusinessWebsite,
} from "@/app/actions";
import { DOC_CATEGORIES } from "@/lib/constants";

// Draw the chosen file onto a square canvas (center-cropped) and return a
// compact PNG data URI — keeps stored logos small, no upload server needed.
function resizeToDataUri(file: File, size = 128): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("no canvas context"));
      const scale = Math.max(size / img.width, size / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("could not load image"));
    };
    img.src = url;
  });
}

export function LogoUploader({
  businessId,
  name,
  color,
  logoUrl,
}: {
  businessId: string;
  name: string;
  color: string;
  logoUrl: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [current, setCurrent] = useState<string | null>(logoUrl);
  const [busy, setBusy] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      const dataUri = await resizeToDataUri(file);
      if (dataUri.length > 400_000) {
        alert("That image is too large after processing. Try a simpler logo.");
        return;
      }
      setCurrent(dataUri);
      await setBusinessLogo(businessId, dataUri);
      router.refresh();
    } catch {
      alert("Couldn't read that image file.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setCurrent(null);
    await setBusinessLogo(businessId, null);
    router.refresh();
    setBusy(false);
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => inputRef.current?.click()}
        title="Upload logo"
        className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg text-lg font-semibold uppercase transition-opacity hover:opacity-80"
        style={{
          background: `linear-gradient(135deg, ${color}33, ${color}14)`,
          border: `1px solid ${color}40`,
          color,
        }}
      >
        {current ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={current} alt="" className="h-full w-full object-cover" />
        ) : (
          name.charAt(0)
        )}
      </button>
      <input ref={inputRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
      <div className="flex flex-col items-start gap-0.5 text-xs">
        <button
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="text-ink-dim hover:text-ink"
        >
          {busy ? "Saving…" : current ? "Change logo" : "Upload logo"}
        </button>
        {current && !busy && (
          <button onClick={remove} className="text-ink-faint hover:text-red-400">
            Remove
          </button>
        )}
      </div>
    </div>
  );
}

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

/** Normalize a user-typed website into an href (add https:// if missing). */
function toHref(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

export function WebsiteEditor({
  businessId,
  website,
  color,
}: {
  businessId: string;
  website: string;
  color: string;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(website);
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      await updateBusinessWebsite(businessId, value);
      setEditing(false);
    });
  }

  if (editing) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") setEditing(false);
          }}
          placeholder="deckroom.com"
          className="input w-48 px-2 py-1 text-xs"
        />
        <button onClick={save} disabled={pending} className="btn px-2 py-1 text-xs">
          {pending ? "…" : "Save"}
        </button>
        <button onClick={() => setEditing(false)} className="btn px-2 py-1 text-xs text-ink-faint">
          ✕
        </button>
      </span>
    );
  }

  if (!website) {
    return (
      <button onClick={() => setEditing(true)} className="text-xs text-ink-faint hover:text-ink">
        + Add website
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded border border-surface-edge bg-surface-overlay px-2 py-1 text-xs">
      <a
        href={toHref(website)}
        target="_blank"
        rel="noreferrer"
        className="hover:underline"
        style={{ color }}
      >
        🌐 {website.replace(/^https?:\/\//i, "")} ↗
      </a>
      <button
        onClick={() => {
          setValue(website);
          setEditing(true);
        }}
        title="Edit website"
        className="text-ink-faint hover:text-ink"
      >
        ✎
      </button>
    </span>
  );
}

/** Compact delete affordance for the home dashboard venture cards. */
export function HomeCardDeleteButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [gone, setGone] = useState(false);
  if (gone) return null;
  return (
    <button
      title="Delete venture"
      disabled={pending}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!window.confirm(`Delete “${name}” and everything in it? This cannot be undone.`)) return;
        setGone(true);
        startTransition(async () => {
          await deleteBusiness(id);
          router.refresh();
        });
      }}
      className="absolute bottom-2 right-2 z-[2] rounded border border-surface-edge bg-surface-overlay px-1.5 py-0.5 text-xs text-ink-faint opacity-0 transition-opacity hover:border-red-400/50 hover:text-red-400 group-hover:opacity-100"
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
