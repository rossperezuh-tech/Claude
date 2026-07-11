"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CLASS_TYPES, formatPrice, formatTime, type ClassTypeKey } from "@/lib/schedule";

interface SlotAvailability {
  slotId: string;
  className: string;
  classKey: ClassTypeKey;
  startTime: string;
  endTime: string;
  priceCents: number;
  capacity: number;
  spotsLeft: number;
  bookable: boolean;
}

interface Props {
  /** YYYY-MM-DD dates the client may pick from (today → booking window). */
  dates: string[];
  /** Weekdays (0–6) that have at least one class. */
  activeWeekdays: number[];
  canceled?: boolean;
}

function weekdayOf(ymd: string): number {
  return new Date(`${ymd}T12:00:00Z`).getUTCDay();
}

function labelOf(ymd: string): { dow: string; day: number; month: string } {
  const d = new Date(`${ymd}T12:00:00Z`);
  return {
    dow: d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }),
    day: d.getUTCDate(),
    month: d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }),
  };
}

export default function BookingWidget({ dates, activeWeekdays, canceled }: Props) {
  const firstActive = useMemo(
    () => dates.find((d) => activeWeekdays.includes(weekdayOf(d))) ?? dates[0],
    [dates, activeWeekdays]
  );

  const [selectedDate, setSelectedDate] = useState(firstActive);
  const [slots, setSlots] = useState<SlotAvailability[] | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(canceled ? "Payment was canceled — your spot was not booked." : null);

  const loadSlots = useCallback(async (date: string) => {
    setSlots(null);
    setSelectedSlot(null);
    const res = await fetch(`/api/availability?date=${date}`);
    const data = await res.json();
    setSlots(data.slots ?? []);
  }, []);

  useEffect(() => {
    loadSlots(selectedDate);
  }, [selectedDate, loadSlots]);

  const chosen = slots?.find((s) => s.slotId === selectedSlot) ?? null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!chosen) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDate, slotId: chosen.slotId, name, email, phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong — please try again.");
        setSubmitting(false);
        loadSlots(selectedDate);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error — please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Step 1: date */}
      <div>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-zinc-400">
          1 · Pick a date
        </h2>
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {dates.map((d) => {
            const hasClasses = activeWeekdays.includes(weekdayOf(d));
            const { dow, day, month } = labelOf(d);
            const selected = d === selectedDate;
            return (
              <button
                key={d}
                type="button"
                disabled={!hasClasses}
                onClick={() => setSelectedDate(d)}
                className={`flex flex-col items-center rounded-md border py-2 text-xs transition sm:text-sm ${
                  selected
                    ? "border-red-500 bg-red-600/20 text-white"
                    : hasClasses
                      ? "border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-600"
                      : "cursor-not-allowed border-zinc-900 text-zinc-700"
                }`}
              >
                <span className="text-[10px] uppercase sm:text-xs">{dow}</span>
                <span className="text-base font-bold sm:text-lg">{day}</span>
                <span className="text-[10px] text-zinc-500 sm:text-xs">{month}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: class slot */}
      <div>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-zinc-400">
          2 · Pick a class
        </h2>
        {slots === null ? (
          <p className="text-sm text-zinc-500">Loading classes…</p>
        ) : slots.length === 0 ? (
          <p className="text-sm text-zinc-500">No classes on this day — pick another date.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {slots.map((s) => {
              const c = CLASS_TYPES[s.classKey];
              const selected = s.slotId === selectedSlot;
              return (
                <button
                  key={s.slotId}
                  type="button"
                  disabled={!s.bookable}
                  onClick={() => setSelectedSlot(s.slotId)}
                  className={`flex items-center justify-between rounded-lg border p-4 text-left transition ${
                    selected
                      ? "border-red-500 bg-red-600/15"
                      : s.bookable
                        ? "border-zinc-800 bg-zinc-900/60 hover:border-zinc-600"
                        : "cursor-not-allowed border-zinc-900 opacity-40"
                  }`}
                >
                  <span>
                    <span className="flex items-center gap-2 font-semibold">
                      <span className={`h-2 w-2 rounded-full ${c.dot}`} />
                      {s.className}
                    </span>
                    <span className="mt-1 block text-sm text-zinc-400">
                      {formatTime(s.startTime)} – {formatTime(s.endTime)}
                    </span>
                    <span className="mt-1 block text-xs text-zinc-500">
                      {s.bookable
                        ? `${s.spotsLeft} spot${s.spotsLeft === 1 ? "" : "s"} left`
                        : s.spotsLeft === 0
                          ? "Full"
                          : "Started"}
                    </span>
                  </span>
                  <span className="text-lg font-bold">{formatPrice(s.priceCents)}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Step 3: details + pay */}
      <div>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-zinc-400">
          3 · Your details
        </h2>
        <form onSubmit={submit} className="max-w-md space-y-3">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            maxLength={100}
            className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm placeholder-zinc-500 focus:border-red-500 focus:outline-none"
          />
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm placeholder-zinc-500 focus:border-red-500 focus:outline-none"
          />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone (optional)"
            maxLength={25}
            className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm placeholder-zinc-500 focus:border-red-500 focus:outline-none"
          />

          {error && (
            <p className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!chosen || submitting}
            className="w-full rounded-md bg-red-600 px-6 py-3 font-bold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
          >
            {submitting
              ? "Redirecting to payment…"
              : chosen
                ? `Pay ${formatPrice(chosen.priceCents)} & Book`
                : "Select a class above"}
          </button>
          <p className="text-xs text-zinc-500">
            Secure checkout powered by Stripe. You&apos;ll get a confirmation right after payment.
          </p>
        </form>
      </div>
    </div>
  );
}
