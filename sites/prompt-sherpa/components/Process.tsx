import Link from "next/link";
import { Reveal } from "./Reveal";

const STEPS = [
  {
    n: "01",
    title: "Tell us the idea",
    body: "A 5-minute intake, in plain words. Rough is fine — you don't need a business plan or any technical knowledge.",
  },
  {
    n: "02",
    title: "We map version one",
    body: "Together we find the ONE thing a user must be able to do in v1, and cut everything that can wait. This is where most ideas get unstuck.",
  },
  {
    n: "03",
    title: "Claude Code builds it",
    body: "Days, not months. You see real progress fast and steer while it's cheap to change course.",
  },
  {
    n: "04",
    title: "Launch to your first 10",
    body: "We ship it to the people you already know, watch what happens, and decide what v2 earns its way into.",
  },
];

export function Process() {
  return (
    <section id="process" className="scroll-mt-20 border-y border-line bg-surface/60">
      <div className="container-site py-16 sm:py-24">
        <Reveal>
          <div className="eyebrow mb-4">How it works</div>
          <h2 className="max-w-xl font-display text-[clamp(28px,4vw,42px)] font-bold leading-[1.08] tracking-[-1px]">
            Base camp to summit, one rope length at a time.
          </h2>
        </Reveal>

        <ol className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 80} as="li">
              <div className="flex items-center gap-3">
                <span className="font-display text-[15px] font-bold text-lime-ink">
                  {s.n}
                </span>
                <span className="h-px flex-1 bg-line" />
              </div>
              <h3 className="mt-4 font-display text-[18px] font-bold tracking-[-0.3px]">
                {s.title}
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">
                {s.body}
              </p>
            </Reveal>
          ))}
        </ol>

        <Reveal delay={200}>
          <div className="mt-14 flex flex-wrap items-center gap-4 rounded-xl2 border border-line bg-mist p-6 sm:p-7">
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 shrink-0 fill-none stroke-lime"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2a10 10 0 100 20 10 10 0 000-20z" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            <p className="flex-1 text-[14.5px] text-muted">
              Rough is fine. Describe things the way you&apos;d tell a friend —
              the intake does the sorting.
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
