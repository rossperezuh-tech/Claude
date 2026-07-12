"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DayOption } from "@/lib/dates";
import { MAX_HOURS, formatHour, formatMoney } from "@/lib/locations";

interface Availability {
  openHour: number;
  closeHour: number;
  minHour: number;
  bookedHours: number[];
}

export default function BookingFlow({
  locationId,
  hourlyRateCents,
  days,
}: {
  locationId: string;
  hourlyRateCents: number;
  days: DayOption[];
}) {
  const [date, setDate] = useState(days[0].date);
  const [avail, setAvail] = useState<Availability | null>(null);
  const [loadingAvail, setLoadingAvail] = useState(true);
  const [startHour, setStartHour] = useState<number | null>(null);
  const [hours, setHours] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<{ code: string; pctOff: number } | null>(null);
  const [promoStatus, setPromoStatus] = useState<"idle" | "checking" | "invalid">("idle");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const loadAvailability = useCallback(
    async (d: string) => {
      setLoadingAvail(true);
      try {
        const res = await fetch(
          `/api/availability?location=${locationId}&date=${d}`,
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error();
        setAvail(await res.json());
      } catch {
        setAvail(null);
        setError("Couldn't load availability — refresh and try again.");
      } finally {
        setLoadingAvail(false);
      }
    },
    [locationId]
  );

  useEffect(() => {
    setStartHour(null);
    loadAvailability(date);
  }, [date, loadAvailability]);

  const booked = useMemo(() => new Set(avail?.bookedHours ?? []), [avail]);

  const slotHours = useMemo(() => {
    if (!avail) return [];
    const out: { hour: number; open: boolean }[] = [];
    for (let h = avail.openHour; h <= avail.closeHour; h++) {
      out.push({ hour: h, open: h >= avail.minHour && !booked.has(h) });
    }
    return out;
  }, [avail, booked]);

  /** Longest run of free hours starting at the selected hour, capped. */
  const maxRun = useMemo(() => {
    if (startHour === null || !avail) return 1;
    let run = 0;
    for (let h = startHour; h <= avail.closeHour && run < MAX_HOURS; h++) {
      if (booked.has(h)) break;
      run++;
    }
    return Math.max(run, 1);
  }, [startHour, avail, booked]);

  useEffect(() => {
    if (hours > maxRun) setHours(maxRun);
  }, [maxRun, hours]);

  async function applyPromoCode() {
    const code = promoInput.trim();
    if (!code) return;
    setPromoStatus("checking");
    try {
      const res = await fetch(`/api/promo?code=${encodeURIComponent(code)}`);
      if (res.ok) {
        const data = await res.json();
        setPromo({ code: data.code, pctOff: data.pctOff });
        setPromoStatus("idle");
      } else {
        setPromo(null);
        setPromoStatus("invalid");
      }
    } catch {
      setPromo(null);
      setPromoStatus("invalid");
    }
  }

  const selectedDay = days.find((d) => d.date === date)!;
  const subtotal = hourlyRateCents * hours;
  const total = promo ? Math.round((subtotal * (100 - promo.pctOff)) / 100) : subtotal;
  const endHour = startHour !== null ? startHour + hours : null;
  const formValid =
    startHour !== null &&
    name.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
    phone.trim().length >= 7;

  async function pay() {
    if (!formValid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: locationId,
          date,
          startHour,
          hours,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          promoCode: promo?.code,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong — try again.");
        if (data.conflict) {
          setStartHour(null);
          loadAvailability(date);
        }
        setSubmitting(false);
        return;
      }
      window.location.assign(data.url);
    } catch {
      setError("Network hiccup — try again.");
      setSubmitting(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-line bg-ink-850 px-3.5 py-2.5 text-sm text-fg placeholder:text-fg-dim outline-none transition focus:border-fg-dim";

  return (
    <div className="mt-10 space-y-10">
      {/* 1 — day */}
      <section>
        <h2 className="kicker">1 — Pick a day</h2>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:thin]">
          {days.map((d) => {
            const active = d.date === date;
            return (
              <button
                key={d.date}
                onClick={() => setDate(d.date)}
                className={`flex min-w-[64px] shrink-0 flex-col items-center rounded-xl border px-3 py-2.5 transition ${
                  active
                    ? "border-acid/60 bg-acid/10"
                    : "border-line bg-ink-900 hover:border-fg-dim"
                }`}
              >
                <span className={`font-mono text-[10px] uppercase tracking-widest ${active ? "text-acid" : "text-fg-dim"}`}>
                  {d.isToday ? "Today" : d.weekday}
                </span>
                <span className={`mt-1 text-sm font-medium ${active ? "text-fg" : "text-fg-mid"}`}>
                  {d.monthDay}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2 — time */}
      <section>
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="kicker">2 — Pick a start time</h2>
          <p className="font-mono text-[11px] text-fg-dim">{selectedDay.weekday} {selectedDay.monthDay}</p>
        </div>
        {loadingAvail ? (
          <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-7">
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className="h-11 animate-pulse rounded-lg bg-ink-850" />
            ))}
          </div>
        ) : avail ? (
          <>
            {slotHours.every((s) => !s.open) && (
              <p className="mt-4 text-sm text-fg-mid">
                Nothing left on this day — try the next one.
              </p>
            )}
            <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-7">
              {slotHours.map(({ hour, open }) => {
                const inSelection =
                  startHour !== null && hour >= startHour && hour < startHour + hours;
                return (
                  <button
                    key={hour}
                    disabled={!open}
                    onClick={() => {
                      setStartHour(hour);
                      setTimeout(
                        () => formRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }),
                        60
                      );
                    }}
                    className={`slot ${
                      inSelection ? "slot-selected" : open ? "slot-open" : "slot-taken"
                    }`}
                  >
                    {formatHour(hour)}
                  </button>
                );
              })}
            </div>
          </>
        ) : null}

        {startHour !== null && (
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="kicker">Length</span>
            <div className="flex gap-2">
              {Array.from({ length: MAX_HOURS }, (_, i) => i + 1).map((h) => {
                const allowed = h <= maxRun;
                return (
                  <button
                    key={h}
                    disabled={!allowed}
                    onClick={() => setHours(h)}
                    className={`rounded-lg border px-3.5 py-2 font-mono text-[13px] transition ${
                      h === hours
                        ? "border-acid/60 bg-acid/10 text-acid"
                        : allowed
                          ? "border-line bg-ink-850 text-fg-mid hover:border-fg-dim hover:text-fg"
                          : "cursor-not-allowed border-transparent bg-ink-900 text-fg-dim/50"
                    }`}
                  >
                    {h} hr{h > 1 ? "s" : ""}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* 3 — details + pay */}
      <section ref={formRef}>
        <h2 className="kicker">3 — Your details</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            className={inputCls}
            placeholder="Name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className={inputCls}
            placeholder="Phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <input
            className={`${inputCls} sm:col-span-2`}
            placeholder="Email — confirmation and door code go here"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="flex gap-2 sm:col-span-2">
            <input
              className={`${inputCls} flex-1 font-mono uppercase placeholder:normal-case placeholder:font-sans`}
              placeholder="Promo code (optional)"
              value={promoInput}
              onChange={(e) => {
                setPromoInput(e.target.value);
                setPromoStatus("idle");
                if (promo) setPromo(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyPromoCode();
              }}
            />
            <button
              type="button"
              onClick={applyPromoCode}
              disabled={!promoInput.trim() || promoStatus === "checking"}
              className="btn-ghost !px-4 !py-2.5 text-[13px] disabled:opacity-40"
            >
              {promoStatus === "checking" ? "…" : "Apply"}
            </button>
          </div>
          {promoStatus === "invalid" && (
            <p className="font-mono text-xs text-red-300 sm:col-span-2">
              That code isn&apos;t valid.
            </p>
          )}
          {promo && (
            <p className="font-mono text-xs text-acid sm:col-span-2">
              {promo.code} applied — {promo.pctOff}% off
            </p>
          )}
        </div>

        <div className="card card-sheen mt-6 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">
                {startHour !== null && endHour !== null ? (
                  <>
                    {selectedDay.weekday} {selectedDay.monthDay} ·{" "}
                    <span className="font-mono">
                      {formatHour(startHour)}–{formatHour(endHour)}
                    </span>
                  </>
                ) : (
                  <span className="text-fg-mid">Pick a start time above</span>
                )}
              </p>
              <p className="mt-1 font-mono text-xs text-fg-dim">
                {hours} hr × {formatMoney(hourlyRateCents)} · room + OPUS-QUAD + monitors
                {promo && ` · ${promo.code} −${promo.pctOff}%`}
              </p>
            </div>
            <p className="text-2xl font-semibold tracking-tight">
              {promo && (
                <span className="mr-2 text-base font-normal text-fg-dim line-through">
                  {formatMoney(subtotal)}
                </span>
              )}
              {formatMoney(total)}
            </p>
          </div>
          {error && (
            <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-300">
              {error}
            </p>
          )}
          <button
            onClick={pay}
            disabled={!formValid || submitting}
            className="btn-primary mt-5 w-full"
          >
            {submitting ? "Opening checkout…" : `Pay ${formatMoney(total)} · Stripe checkout`}
          </button>
          <p className="mt-3 text-center font-mono text-[11px] text-fg-dim">
            Held for 30 minutes while you pay · full refund up to 24h before
          </p>
        </div>
      </section>
    </div>
  );
}
