import Link from "next/link";
import { Reveal } from "./Reveal";

const BUILDS = [
  {
    title: "Landing page + waitlist",
    body: "Test the idea before you build it. A sharp page that explains the product and collects the people who want it.",
    icon: <path d="M4 5h16v6H4zM4 15h9M4 19h6" />,
  },
  {
    title: "Simple web app",
    body: "The smallest version of your product that does the ONE thing users need. Live, usable, yours.",
    icon: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 9h18M8 4v5" />
      </>
    ),
  },
  {
    title: "Booking / requests",
    body: "Let customers request, book, and hear back — the core loop for service businesses and marketplaces-to-be.",
    icon: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M8 3v4M16 3v4M3 11h18" />
      </>
    ),
  },
  {
    title: "Marketplace",
    body: "Two sides, one match. Start with the thinnest possible version that proves people will meet in the middle.",
    icon: <path d="M4 7h16M4 7l2 12h12l2-12M9 11v4M15 11v4" />,
  },
  {
    title: "Internal tool",
    body: "Automate the spreadsheet-and-email mess behind your business so you can spend time on customers instead.",
    icon: (
      <>
        <path d="M14.7 6.3a5 5 0 00-6.9 6.2L3 17.3V21h3.7l4.8-4.8a5 5 0 006.2-6.9l-3.2 3.2-2.5-.5-.5-2.5z" />
      </>
    ),
  },
  {
    title: "Not sure yet?",
    body: "That's what the intake is for. Describe the idea in plain words and we'll advise on the smallest thing worth building.",
    icon: (
      <>
        <path d="M12 2a10 10 0 100 20 10 10 0 000-20z" />
        <path d="M9.5 9a2.5 2.5 0 115 0c0 1.7-2.5 2-2.5 4M12 17h.01" />
      </>
    ),
    cta: true,
  },
];

export function Builds() {
  return (
    <section id="build" className="scroll-mt-20">
      <div className="container-site py-16 sm:py-24">
        <Reveal>
          <div className="eyebrow mb-4">What we build</div>
          <h2 className="max-w-2xl font-display text-[clamp(28px,4vw,42px)] font-bold leading-[1.08] tracking-[-1px]">
            Version one, and only version one.
          </h2>
          <p className="mt-4 max-w-[54ch] text-[15.5px] text-muted">
            Everything starts with the ONE thing a user must be able to do.
            Everything else waits. Here&apos;s what a first build usually looks
            like.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {BUILDS.map((b, i) => {
            const card = (
              <article
                className={`group h-full rounded-xl2 border p-7 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift ${
                  b.cta
                    ? "border-lime bg-lime-soft"
                    : "border-line bg-surface"
                }`}
              >
                <span
                  className={`mb-5 flex h-11 w-11 items-center justify-center rounded-[10px] ${
                    b.cta ? "bg-lime" : "bg-lime-soft"
                  }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className={`h-[22px] w-[22px] fill-none ${
                      b.cta ? "stroke-white" : "stroke-lime-ink"
                    }`}
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {b.icon}
                  </svg>
                </span>
                <h3 className="font-display text-[19px] font-bold tracking-[-0.4px]">
                  {b.title}
                </h3>
                <p className="mt-2.5 text-[14px] leading-relaxed text-muted">
                  {b.body}
                </p>
                {b.cta && (
                  <span className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-semibold text-lime-ink">
                    Get advice in the intake
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4 fill-none stroke-current transition-transform duration-200 group-hover:translate-x-0.5"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </span>
                )}
              </article>
            );
            return (
              <Reveal key={b.title} delay={(i % 3) * 80}>
                {b.cta ? <Link href="/intake">{card}</Link> : card}
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
