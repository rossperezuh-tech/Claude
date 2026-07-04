import Link from "next/link";
import { Reveal } from "./Reveal";

const TIERS = [
  {
    name: "Prove it",
    band: "Under $1k",
    blurb:
      "A landing page + waitlist that tests the idea with real people before you spend real money building it.",
    points: [
      "Landing page in your voice",
      "Waitlist capture, ready to share",
      "Live in about a week",
    ],
    featured: false,
  },
  {
    name: "Version one",
    band: "$1–3k",
    blurb:
      "A simple web app built around the ONE thing your users must be able to do. The classic first build.",
    points: [
      "One core action, done properly",
      "Accounts, requests, or booking as needed",
      "You own the code and the keys",
    ],
    featured: true,
  },
  {
    name: "Bigger v1",
    band: "$3–8k",
    blurb:
      "Marketplaces, messaging, payments — when version one genuinely needs more moving parts to prove itself.",
    points: [
      "Multi-sided or payment flows",
      "Built to survive first real users",
      "A v2 roadmap you can act on",
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
          <h2 className="max-w-xl font-display text-[clamp(28px,4vw,42px)] font-bold leading-[1.08] tracking-[-1px]">
            Founder-sized budgets. Fixed quotes.
          </h2>
          <p className="mt-4 max-w-[54ch] text-[15.5px] text-muted">
            Every build is quoted up front after the intake. These bands cover
            most first versions — and if your idea needs less than you think,
            we&apos;ll tell you.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {TIERS.map((t, i) => (
            <Reveal key={t.name} delay={i * 90}>
              <article
                className={`flex h-full flex-col rounded-xl2 border bg-surface p-7 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift ${
                  t.featured ? "border-lime ring-1 ring-lime" : "border-line"
                }`}
              >
                <div className="flex items-baseline justify-between">
                  <h3 className="font-display text-[19px] font-bold">
                    {t.name}
                  </h3>
                  {t.featured && (
                    <span className="rounded-full bg-lime-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-lime-ink">
                      Most common
                    </span>
                  )}
                </div>
                <div className="mt-3 font-display text-[30px] font-bold tracking-[-1px] text-lime-ink">
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
                        className="mt-[3px] h-4 w-4 shrink-0 fill-none stroke-lime"
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
