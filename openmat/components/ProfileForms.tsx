"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateCoachProfile, updateGymProfile } from "@/app/actions";
import { BOROUGHS, DISCIPLINES } from "@/lib/site";

const inputCls =
  "w-full rounded-md border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm placeholder-zinc-500 focus:border-orange-500 focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      {children}
    </label>
  );
}

export function CoachProfileForm({
  profile,
}: {
  profile: {
    displayName: string;
    discipline: string;
    borough: string;
    yearsExperience: number;
    accolades: string | null;
    bio: string;
  };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    displayName: profile.displayName,
    discipline: profile.discipline,
    borough: profile.borough,
    yearsExperience: String(profile.yearsExperience),
    accolades: profile.accolades ?? "",
    bio: profile.bio,
  });
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!open) {
    return (
      <div className="flex items-center gap-3">
        <button
          onClick={() => { setOpen(true); setSaved(false); }}
          className="rounded-md border border-zinc-700 px-5 py-2.5 text-sm font-semibold hover:border-zinc-500"
        >
          Edit profile
        </button>
        {saved && <span className="text-sm text-emerald-400">Saved ✓</span>}
      </div>
    );
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        const res = await updateCoachProfile({
          ...form,
          yearsExperience: Number(form.yearsExperience),
        });
        setLoading(false);
        if (res.error) {
          setError(res.error);
        } else {
          setOpen(false);
          setSaved(true);
          router.refresh();
        }
      }}
      className="max-w-lg space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-5"
    >
      <Field label="Display name">
        <input required className={inputCls} value={form.displayName} onChange={set("displayName")} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Discipline">
          <select className={inputCls} value={form.discipline} onChange={set("discipline")}>
            {DISCIPLINES.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </Field>
        <Field label="Borough">
          <select className={inputCls} value={form.borough} onChange={set("borough")}>
            {BOROUGHS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Years of experience">
        <input type="number" min={0} max={60} className={inputCls} value={form.yearsExperience} onChange={set("yearsExperience")} />
      </Field>
      <Field label="Accolades (shown under your bio)">
        <input className={inputCls} value={form.accolades} onChange={set("accolades")} placeholder="e.g. Golden Gloves finalist · 24-3 pro record" />
      </Field>
      <Field label="Bio">
        <textarea rows={4} className={inputCls} value={form.bio} onChange={set("bio")} />
      </Field>
      {error && (
        <p className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">{error}</p>
      )}
      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="rounded-md bg-orange-600 px-5 py-2.5 text-sm font-bold hover:bg-orange-500 disabled:bg-zinc-800">
          {loading ? "Saving…" : "Save profile"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-zinc-700 px-5 py-2.5 text-sm font-semibold hover:border-zinc-500">
          Cancel
        </button>
      </div>
    </form>
  );
}

export function GymProfileForm({
  profile,
}: {
  profile: {
    gymName: string;
    address: string;
    borough: string;
    description: string;
    amenities: string;
    spaceSharePct: number;
  };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    gymName: profile.gymName,
    address: profile.address,
    borough: profile.borough,
    description: profile.description,
    amenities: profile.amenities,
    spaceSharePct: String(profile.spaceSharePct),
  });
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!open) {
    return (
      <div className="flex items-center gap-3">
        <button
          onClick={() => { setOpen(true); setSaved(false); }}
          className="rounded-md border border-zinc-700 px-5 py-2.5 text-sm font-semibold hover:border-zinc-500"
        >
          Edit gym profile
        </button>
        {saved && <span className="text-sm text-emerald-400">Saved ✓</span>}
      </div>
    );
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        const res = await updateGymProfile({
          ...form,
          spaceSharePct: Number(form.spaceSharePct),
        });
        setLoading(false);
        if (res.error) {
          setError(res.error);
        } else {
          setOpen(false);
          setSaved(true);
          router.refresh();
        }
      }}
      className="max-w-lg space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-5"
    >
      <Field label="Gym name">
        <input required className={inputCls} value={form.gymName} onChange={set("gymName")} />
      </Field>
      <Field label="Street address">
        <input required className={inputCls} value={form.address} onChange={set("address")} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Borough">
          <select className={inputCls} value={form.borough} onChange={set("borough")}>
            {BOROUGHS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </Field>
        <Field label="Space share % (5–50)">
          <input type="number" min={5} max={50} className={inputCls} value={form.spaceSharePct} onChange={set("spaceSharePct")} />
        </Field>
      </div>
      <Field label="Amenities (comma-separated)">
        <input className={inputCls} value={form.amenities} onChange={set("amenities")} />
      </Field>
      <Field label="Description">
        <textarea rows={4} className={inputCls} value={form.description} onChange={set("description")} />
      </Field>
      <p className="text-xs text-zinc-500">
        Changing your space share only affects future bookings — completed splits stay as they were.
      </p>
      {error && (
        <p className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">{error}</p>
      )}
      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="rounded-md bg-orange-600 px-5 py-2.5 text-sm font-bold hover:bg-orange-500 disabled:bg-zinc-800">
          {loading ? "Saving…" : "Save profile"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-zinc-700 px-5 py-2.5 text-sm font-semibold hover:border-zinc-500">
          Cancel
        </button>
      </div>
    </form>
  );
}
