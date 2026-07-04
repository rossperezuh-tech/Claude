import Link from "next/link";
import { Reveal } from "./Reveal";

export function Hero() {
  return (
    <section className="glow-teal relative overflow-hidden">
      <div className="container-site pb-16 pt-16 sm:pb-24 sm:pt-24">
        <div className="max-w-[46rem]">
          <Reveal>
            <div className="eyebrow mb-5">
              Claude consulting · Small business
            </div>
          </Reveal>
          <Reveal delay={60}>
            <h1 className="font-serif text-[clamp(38px,6vw,60px)] font-medium leading-[1.06] tracking-[-1.2px]">
              Put Claude to work where your business{" "}
              <em className="italic text-teal-ink">actually</em> loses time.
            </h1>
          </Reveal>
          <Reveal delay={120}>
            <p className="mt-6 max-w-[52ch] text-[17px] text-muted sm:text-lg">
              Steadyhand is an independent Claude consulting practice for
              established small businesses. We pick the one task that eats the
              most of your week (quotes, customer emails, reports) and hand it
              to Claude, trained on your real examples and following your
              rules. You keep your tools, your process, and everything we
              build.
            </p>
          </Reveal>
          <Reveal delay={180}>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/intake" className="btn-primary">
                Start the 5-minute intake
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 fill-none stroke-current"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
              <Link href="/#process" className="btn-line">
                See how it works
              </Link>
            </div>
          </Reveal>
          <Reveal delay={240}>
            <dl className="mt-14 grid max-w-xl grid-cols-3 gap-6 border-t border-line pt-7">
              {[
                ["One task", "at a time — done properly"],
                ["Your data", "private options, incl. local AI"],
                ["Yours to keep", "trained, documented, handed over"],
              ].map(([t, d]) => (
                <div key={t}>
                  <dt className="font-serif text-lg font-semibold text-ink">
                    {t}
                  </dt>
                  <dd className="mt-1 text-[13px] leading-snug text-faint">
                    {d}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
