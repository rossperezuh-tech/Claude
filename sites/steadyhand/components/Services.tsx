import { Reveal } from "./Reveal";

const SERVICES = [
  {
    title: "Claude workflow optimization",
    body: "We map how a task is done today — step by step — then rebuild it around Claude. Quotes drafted in your voice. Customer emails answered before coffee. Reports that write themselves from your data.",
    points: [
      "Built and tested on your real past examples",
      "Follows your pricing rules and never-say list",
      "Your team reviews; Claude does the typing",
    ],
    icon: (
      <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6zM9 12l2 2 4-4" />
    ),
  },
  {
    title: "Private, local AI setup",
    body: "Some data should never leave the building — client financials, medical records, legal files. We set up a private LLM on your own hardware, so sensitive work gets the same leverage without touching the cloud.",
    points: [
      "Runs on hardware you own and control",
      "Nothing sensitive sent to cloud tools",
      "Sized to your workload, not a data center",
    ],
    icon: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="3" />
        <path d="M9 9h6v6H9zM12 2v2M12 20v2M2 12h2M20 12h2" />
      </>
    ),
  },
];

export function Services() {
  return (
    <section id="services" className="scroll-mt-20">
      <div className="container-site py-16 sm:py-24">
        <Reveal>
          <div className="eyebrow mb-4">What we do</div>
          <h2 className="max-w-xl font-serif text-[clamp(28px,4vw,40px)] font-medium leading-[1.12] tracking-[-0.6px]">
            Two services. Both measured in hours given back.
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {SERVICES.map((s, i) => (
            <Reveal key={s.title} delay={i * 90}>
              <article className="group h-full rounded-xl2 border border-line bg-surface p-7 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift sm:p-9">
                <span className="mb-6 flex h-11 w-11 items-center justify-center rounded-[10px] bg-teal-soft">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-[22px] w-[22px] fill-none stroke-teal-ink"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {s.icon}
                  </svg>
                </span>
                <h3 className="font-serif text-[23px] font-medium tracking-[-0.3px]">
                  {s.title}
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-muted">
                  {s.body}
                </p>
                <ul className="mt-6 space-y-2.5 border-t border-line pt-6">
                  {s.points.map((p) => (
                    <li
                      key={p}
                      className="flex items-start gap-2.5 text-[14px] text-muted"
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
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
