"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  SECTIONS,
  EMAIL,
  STORAGE_KEY,
  buildSummary,
} from "@/lib/intake-data";
import { LogoMark } from "@/components/Logo";
import { Field } from "./Field";
import { Review } from "./Review";

const TOTAL = SECTIONS.length;
const REVIEW_STEP = TOTAL + 1;

const ArrowRight = (
  <svg
    viewBox="0 0 24 24"
    className="h-4 w-4 fill-none stroke-current"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export function IntakeFlow() {
  const [data, setData] = useState<Record<string, string>>({});
  const [step, setStep] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    try {
      const d = localStorage.getItem(STORAGE_KEY);
      if (d) setData(JSON.parse(d));
    } catch {}
    setLoaded(true);
  }, []);

  const setVal = useCallback((id: string, v: string) => {
    setData((prev) => {
      const next = { ...prev, [id]: v };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    setSavedFlash(true);
    clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSavedFlash(false), 1400);
  }, []);

  function showToast(m: string) {
    setToast(m);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }

  function go(n: number) {
    setStep(Math.max(0, Math.min(n, REVIEW_STEP)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function copySummary() {
    navigator.clipboard
      .writeText(buildSummary(data))
      .then(() => showToast("Summary copied"))
      .catch(() => showToast("Copy failed — try Download"));
  }

  function downloadSummary() {
    const b = new Blob([buildSummary(data)], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(b);
    a.download = `steadyhand-intake-${Date.now()}.txt`;
    a.click();
    showToast("Downloaded");
  }

  function emailSummary() {
    const s = encodeURIComponent("Project intake — Steadyhand");
    const b = encodeURIComponent(
      buildSummary(data) +
        "\n\n(Reminder: attach any example files mentioned above.)"
    );
    location.href = `mailto:${EMAIL}?subject=${s}&body=${b}`;
  }

  function resetAll() {
    if (confirm("Clear all your answers and start over?")) {
      setData({});
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
      go(0);
      showToast("Cleared");
    }
  }

  const sectionDone = (i: number) =>
    SECTIONS[i].q.some((q) => (data[q.id] || "").trim().length > 0);

  const progressPct =
    step === 0 ? 4 : step > TOTAL ? 100 : (step / TOTAL) * 100;
  const progLabels = [
    "Getting started",
    ...SECTIONS.map((s) => s.title),
    "Review & send",
  ];
  const progLabel = progLabels[Math.min(step, progLabels.length - 1)];

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[320px_1fr]">
      {/* ---- left rail (desktop) ---- */}
      <aside className="hidden border-r border-line bg-surface/60 lg:flex lg:flex-col">
        <div className="sticky top-0 flex h-screen flex-col p-8">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoMark />
            <span className="font-serif text-[19px] font-semibold tracking-[-0.2px]">
              Steadyhand
              <span className="block font-sans text-[10.5px] font-semibold uppercase tracking-[1.6px] text-teal-ink">
                Claude Consulting
              </span>
            </span>
          </Link>

          <nav className="mt-12 flex-1 space-y-1" aria-label="Intake steps">
            {SECTIONS.map((sec, i) => {
              const n = i + 1;
              const active = step === n;
              const done = sectionDone(i);
              return (
                <button
                  key={sec.title}
                  onClick={() => step > 0 && go(n)}
                  disabled={step === 0}
                  className={`flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-[14px] transition-colors ${
                    active
                      ? "bg-teal-soft font-medium text-teal-ink"
                      : "text-muted hover:bg-cream disabled:opacity-60"
                  }`}
                >
                  <span
                    className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors ${
                      done
                        ? "border-teal bg-teal text-white"
                        : active
                          ? "border-teal text-teal-ink"
                          : "border-line-strong text-faint"
                    }`}
                  >
                    {done ? (
                      <svg
                        viewBox="0 0 24 24"
                        className="h-3 w-3 fill-none stroke-current"
                        strokeWidth={3}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      n
                    )}
                  </span>
                  {sec.title}
                </button>
              );
            })}
            <button
              onClick={() => go(REVIEW_STEP)}
              className={`flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-[14px] transition-colors ${
                step === REVIEW_STEP
                  ? "bg-teal-soft font-medium text-teal-ink"
                  : "text-muted hover:bg-cream"
              }`}
            >
              <span
                className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold ${
                  step === REVIEW_STEP
                    ? "border-teal text-teal-ink"
                    : "border-line-strong text-faint"
                }`}
              >
                ✓
              </span>
              Review &amp; send
            </button>
          </nav>

          <div className="space-y-4 text-[12.5px] text-faint">
            <div
              className={`flex items-center gap-1.5 transition-opacity duration-300 ${
                savedFlash ? "opacity-100" : "opacity-0"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-teal" /> Saved
            </div>
            <p>Your answers save automatically as you go.</p>
            <p className="border-t border-line pt-4">
              Steadyhand · Independent Claude consulting for small business
            </p>
          </div>
        </div>
      </aside>

      {/* ---- main column ---- */}
      <div className="mx-auto w-full max-w-[720px] px-5 pb-28">
        {/* mobile top bar */}
        <div className="sticky top-0 z-20 -mx-5 bg-gradient-to-b from-cream from-[78%] to-transparent px-5 pb-4 pt-5 lg:hidden">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <LogoMark />
              <span className="font-serif text-[19px] font-semibold tracking-[-0.2px]">
                Steadyhand
                <span className="block font-sans text-[10.5px] font-semibold uppercase tracking-[1.6px] text-teal-ink">
                  Claude Consulting
                </span>
              </span>
            </Link>
            <span
              className={`flex items-center gap-1.5 text-[12.5px] text-faint transition-opacity duration-300 ${
                savedFlash ? "opacity-100" : "opacity-0"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-teal" /> Saved
            </span>
          </div>
        </div>

        {/* progress */}
        <div className="mb-8 mt-2 lg:mt-10">
          <div className="h-[3px] overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-teal transition-[width] duration-500 [transition-timing-function:cubic-bezier(.3,.8,.3,1)]"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="mt-2.5 flex justify-between text-[12.5px] text-faint">
            <span>{progLabel}</span>
            <span>
              <b className="font-medium text-muted">
                {Math.min(step, TOTAL)}
              </b>{" "}
              of {TOTAL}
            </span>
          </div>
        </div>

        {!loaded ? null : step === 0 ? (
          /* ---- intro ---- */
          <div key="intro" className="step-enter">
            <div className="pb-2 pt-5">
              <div className="eyebrow mb-4">Project Intake</div>
              <h1 className="mb-4 font-serif text-[clamp(30px,5.4vw,42px)] font-medium leading-[1.1] tracking-[-0.8px]">
                Tell us how your business{" "}
                <em className="italic text-teal-ink">really</em> runs.
              </h1>
              <p className="mb-3.5 max-w-[52ch] text-[16.5px] text-muted">
                A few focused questions before we begin. The more honestly you
                describe your day-to-day — where time goes, what frustrates
                your team — the more precisely we can put Claude to work.
              </p>
              <p className="text-[14px] text-muted">
                Takes about 5 minutes. Your answers save automatically as you
                go.
              </p>
              <div className="mt-6 flex items-start gap-3 rounded-xl2 border border-line bg-surface p-[16px_18px] text-[14px] text-muted shadow-card">
                <svg
                  viewBox="0 0 24 24"
                  className="mt-px h-[18px] w-[18px] shrink-0 fill-none stroke-teal"
                  strokeWidth={1.8}
                >
                  <path d="M12 2a10 10 0 100 20 10 10 0 000-20z" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
                <span>
                  There are no wrong answers. If a question doesn&apos;t apply
                  to your business, skip it — a short honest note beats a
                  padded one.
                </span>
              </div>
            </div>
            <div className="mt-9 flex items-center">
              <div className="flex-1" />
              <button className="btn-primary" onClick={() => go(1)}>
                Begin {ArrowRight}
              </button>
            </div>
          </div>
        ) : step <= TOTAL ? (
          /* ---- question steps ---- */
          <div key={step} className="step-enter">
            <div className="mb-7">
              <div className="mb-2 text-[12.5px] font-medium text-faint">
                Section {step} · {SECTIONS[step - 1].blurb}
              </div>
              <h2 className="font-serif text-[26px] font-medium leading-[1.15] tracking-[-0.4px]">
                {SECTIONS[step - 1].title}
              </h2>
            </div>
            {SECTIONS[step - 1].q.map((q) => (
              <Field
                key={q.id}
                q={q}
                value={data[q.id] || ""}
                onChange={(v) => setVal(q.id, v)}
              />
            ))}
            <div className="mt-9 flex items-center gap-3">
              <button className="btn-ghost" onClick={() => go(step - 1)}>
                ← Back
              </button>
              <div className="flex-1" />
              <span
                className={`flex items-center gap-1.5 text-[12.5px] text-faint transition-opacity duration-300 lg:hidden ${
                  savedFlash ? "opacity-100" : "opacity-0"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-teal" /> Saved
              </span>
              <button className="btn-primary" onClick={() => go(step + 1)}>
                {step === TOTAL ? "Review" : "Continue"} {ArrowRight}
              </button>
            </div>
          </div>
        ) : (
          /* ---- review ---- */
          <div key="review" className="step-enter">
            <div className="mb-7">
              <div className="mb-2 text-[12.5px] font-medium text-faint">
                Last step
              </div>
              <h2 className="font-serif text-[26px] font-medium leading-[1.15] tracking-[-0.4px]">
                Review &amp; send
              </h2>
              <p className="mt-2 text-[14.5px] text-muted">
                Here&apos;s everything you told us. Go back to edit anything,
                or send it over when it&apos;s ready.
              </p>
            </div>
            <div className="rounded-xl2 border border-line bg-surface p-6 shadow-card sm:p-8">
              <Review data={data} />
            </div>
            <div className="mt-7 flex flex-wrap gap-2.5">
              <button
                className="btn-line min-w-[150px] flex-1"
                onClick={copySummary}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 fill-none stroke-current"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15V5a2 2 0 012-2h10" />
                </svg>
                Copy summary
              </button>
              <button
                className="btn-line min-w-[150px] flex-1"
                onClick={downloadSummary}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 fill-none stroke-current"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
                </svg>
                Download
              </button>
              <button
                className="btn-primary min-w-[150px] flex-1"
                onClick={emailSummary}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 fill-none stroke-current"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 4h16v16H4z" />
                  <path d="M4 7l8 6 8-6" />
                </svg>
                Send it over
              </button>
            </div>
            <div className="mt-8 flex items-center gap-3">
              <button className="btn-ghost" onClick={() => go(TOTAL)}>
                ← Back
              </button>
              <div className="flex-1" />
              <button
                className="btn-ghost !text-faint hover:!text-ink"
                onClick={resetAll}
              >
                Start over
              </button>
            </div>
          </div>
        )}

        <div className="mt-10 text-center text-xs text-faint lg:hidden">
          Steadyhand · Independent Claude consulting for small business
        </div>
      </div>

      {/* toast */}
      <div
        aria-live="polite"
        className={`pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-[11px] bg-ink px-5 py-3 text-sm text-white shadow-lift transition-all duration-300 ${
          toast ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
        }`}
      >
        {toast}
      </div>
    </div>
  );
}
