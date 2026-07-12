"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cancelListing, createListing, respondPartnership } from "@/app/actions";
import { DISCIPLINES } from "@/lib/site";

const inputCls =
  "w-full rounded-md border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm placeholder-zinc-500 focus:border-orange-500 focus:outline-none";

export function PartnershipActions({ partnershipId }: { partnershipId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function act(approve: boolean) {
    setLoading(true);
    await respondPartnership(partnershipId, approve);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => act(true)}
        disabled={loading}
        className="rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-bold hover:bg-emerald-500 disabled:opacity-50"
      >
        Approve
      </button>
      <button
        onClick={() => act(false)}
        disabled={loading}
        className="rounded-md border border-zinc-700 px-4 py-1.5 text-sm font-semibold hover:border-zinc-500 disabled:opacity-50"
      >
        Decline
      </button>
    </div>
  );
}

export function CancelListingButton({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <button
      onClick={async () => {
        if (!confirm("Cancel this session? All bookings will be cancelled too.")) return;
        setLoading(true);
        await cancelListing(listingId);
        router.refresh();
      }}
      disabled={loading}
      className="text-xs font-semibold text-red-400 hover:text-red-300 disabled:opacity-50"
    >
      {loading ? "Cancelling…" : "Cancel session"}
    </button>
  );
}

export function CreateListingForm({
  gyms,
}: {
  gyms: { id: string; gymName: string; spaceSharePct: number }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    gymId: gyms[0]?.id ?? "",
    title: "",
    description: "",
    discipline: DISCIPLINES[0],
    date: "",
    startTime: "18:00",
    endTime: "19:00",
    priceDollars: "60",
    capacity: "10",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (gyms.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Get a partnership approved with a gym first — then you can post sessions there.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-orange-600 px-5 py-2.5 text-sm font-bold hover:bg-orange-500"
      >
        + Post a session
      </button>
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
        const res = await createListing({
          ...form,
          priceDollars: Number(form.priceDollars),
          capacity: Number(form.capacity),
        });
        setLoading(false);
        if (res.error) {
          setError(res.error);
        } else {
          setOpen(false);
          router.refresh();
        }
      }}
      className="max-w-lg space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-5"
    >
      <select className={inputCls} value={form.gymId} onChange={set("gymId")}>
        {gyms.map((g) => (
          <option key={g.id} value={g.id}>
            {g.gymName} ({g.spaceSharePct}% space share)
          </option>
        ))}
      </select>
      <input required placeholder="Session title (e.g. Muay Thai Pads & Sparring)" className={inputCls} value={form.title} onChange={set("title")} />
      <textarea placeholder="What you'll cover, who it's for" rows={2} className={inputCls} value={form.description} onChange={set("description")} />
      <div className="grid grid-cols-2 gap-3">
        <select className={inputCls} value={form.discipline} onChange={set("discipline")}>
          {DISCIPLINES.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <input required type="date" className={inputCls} value={form.date} onChange={set("date")} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input required type="time" className={inputCls} value={form.startTime} onChange={set("startTime")} />
        <input required type="time" className={inputCls} value={form.endTime} onChange={set("endTime")} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input required type="number" min={5} max={1000} placeholder="Price ($)" className={inputCls} value={form.priceDollars} onChange={set("priceDollars")} />
        <input required type="number" min={1} max={100} placeholder="Capacity" className={inputCls} value={form.capacity} onChange={set("capacity")} />
      </div>
      {error && (
        <p className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">{error}</p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-orange-600 px-5 py-2.5 text-sm font-bold hover:bg-orange-500 disabled:bg-zinc-800"
        >
          {loading ? "Posting…" : "Post session"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md border border-zinc-700 px-5 py-2.5 text-sm font-semibold hover:border-zinc-500"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
