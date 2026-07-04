import Link from "next/link";
import { Reveal } from "./Reveal";

const TIERS = [
  {
    name: "Pilot",
    band: "Under $1k",
    blurb:
      "One well-defined task, automated end to end. The fastest way to see what Claude can do with your real work.",
    points: [
      "One task, e.g. quotes or email replies",
      "Tuned on 3–5 of your real examples",
      "Working in about a week",
    ],
    featured: false,
  },
  {
    name: "Core workflow",
    band: "$1–3k",
    blurb:
      "A full workflow rebuilt around Claude — multiple steps, your rules baked in, your team trained to run it.",
    points: [
      "Full workflow, not just one step",
      "Pricing rules & compliance built in",
      "Team training + written handover",
    ],
    featured: true,
  },
  {
    name: "Private AI",
    band: "$3–8k",
    blurb:
      "A private LLM on your own hardware for work that can't touch the cloud, plus the workflows to use it.",
    points: [
      "Local model on hardware you own",
      "Sensitive data never leaves the office",
      "Includes one core workflow build",
    ],
    featured: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-20">
      <div className="container-site py-16 sm:py-24">
        <Reveal>
          <div className="eyebrow mb-4">Pricing</div>
          <h2 className="max-w-xl font-serif text-[clamp(28px,4vw,40px)] font-medium leading-[1.12] tracking-[-0.6px]">
            Fixed scope, plain numbers.
          </h2>
          <p className="mt-4 max-w-[54ch] text-[15.5px] text-muted">
            Every engagement is quoted up front after the intake. These bands
            cover most projects — if yours doesn&apos;t fit, we&apos;ll say so
            before any money moves.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {TIERS.map((t, i) => (
            <Reveal key={t.name} delay={i * 90}>
              <article
                className={`flex h-full flex-col rounded-xl2 border bg-surface p-7 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift ${
                  t.featured ? "border-teal ring-1 ring-teal" : "border-line"
                }`}
              >
                <div className="flex items-baseline justify-between">
                  <h3 className="font-serif text-[20px] font-medium">
                    {t.name}
                  </h3>
                  {t.featured && (
                    <span className="rounded-full bg-teal-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-teal-ink">
                      Most common
                    </span>
                  )}
                </div>
                <div className="mt-3 font-serif text-[30px] font-medium tracking-[-0.5px] text-teal-ink">
                  {t.band}
                </div>
                <p className="mt-3 text-[14px] leading-relaxed text-muted">
                  {t.blurb}
                </p>
                <ul className="mt-6 flex-1 space-y-2.5 border-t border-line pt-6">
                  {t.points.map((p) => (
                    <li
                      key={p}
                      className="flex items-start gap-2.5 text-[13.5px] text-muted"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="mt-[3px] h-4 w-4 shrink-0 fill-none stroke-teal"
                        strokeWidth={2.2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                      {p}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/intake"
                  className={`${t.featured ? "btn-primary" : "btn-line"} mt-7 w-full`}
                >
                  Start with the intake
                </Link>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
