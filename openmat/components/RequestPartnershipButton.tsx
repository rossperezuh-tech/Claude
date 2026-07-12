"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestPartnership } from "@/app/actions";

export default function RequestPartnershipButton({ gymId }: { gymId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  if (done) {
    return (
      <p className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300">
        Request sent — the gym will review it in their dashboard.
      </p>
    );
  }

  return (
    <div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="rounded-md bg-orange-600 px-5 py-2.5 text-sm font-bold hover:bg-orange-500"
        >
          Request to coach here
        </button>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            setError("");
            const res = await requestPartnership(gymId, message);
            setLoading(false);
            if (res.error) {
              setError(res.error);
            } else {
              setDone(true);
              router.refresh();
            }
          }}
          className="space-y-3"
        >
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Introduce yourself — discipline, experience, when you'd want mat time"
            rows={3}
            className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
          />
          {error && (
            <p className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-orange-600 px-5 py-2.5 text-sm font-bold hover:bg-orange-500 disabled:bg-zinc-800 disabled:text-zinc-500"
          >
            {loading ? "Sending…" : "Send request"}
          </button>
        </form>
      )}
    </div>
  );
}
