import Link from "next/link";
import { Reveal } from "./Reveal";

const STEPS = [
  {
    n: "01",
    title: "Tell us how it really runs",
    body: "A 5-minute intake — plain questions about your day-to-day, where time goes, and the one task you want off your plate. No wrong answers.",
  },
  {
    n: "02",
    title: "We diagnose the workflow",
    body: "We walk the task step by step with you, gather 3–5 real examples, and pin down the rules it must never break.",
  },
  {
    n: "03",
    title: "Claude does the heavy lifting",
    body: "We build the workflow, tune it on your examples until the output sounds like you, and test it against real cases side by side.",
  },
  {
    n: "04",
    title: "Handover, training, done",
    body: "Your team learns to run it in an afternoon. Everything is documented and yours to keep — no retainer required to keep it working.",
  },
];

export function Process() {
  return (
    <section id="process" className="scroll-mt-20 border-y border-line bg-surface/60">
      <div className="container-site py-16 sm:py-24">
        <Reveal>
          <div className="eyebrow mb-4">How it works</div>
          <h2 className="max-w-xl font-serif text-[clamp(28px,4vw,40px)] font-medium leading-[1.12] tracking-[-0.6px]">
            One task at a time, start to finish.
          </h2>
        </Reveal>

        <ol className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 80} as="li">
              <div className="flex items-center gap-3">
                <span className="font-serif text-[15px] font-semibold text-teal-ink">
                  {s.n}
                </span>
                <span className="h-px flex-1 bg-line" />
              </div>
              <h3 className="mt-4 font-serif text-[19px] font-medium tracking-[-0.2px]">
                {s.title}
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">
                {s.body}
              </p>
            </Reveal>
          ))}
        </ol>

        <Reveal delay={200}>
          <div className="mt-14 flex flex-wrap items-center gap-4 rounded-xl2 border border-line bg-cream p-6 sm:p-7">
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 shrink-0 fill-none stroke-teal"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2a10 10 0 100 20 10 10 0 000-20z" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            <p className="flex-1 text-[14.5px] text-muted">
              Not sure which task to start with? That&apos;s what the intake is
              for — describe your week and we&apos;ll point at the best
              candidate.
            </p>
            <Link href="/intake" className="btn-line !py-2.5 text-sm">
              Open the intake
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
