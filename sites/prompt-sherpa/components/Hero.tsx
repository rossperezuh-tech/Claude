import Link from "next/link";
import { Reveal } from "./Reveal";

export function Hero() {
  return (
    <section className="glow-lime relative overflow-hidden">
      <div className="container-site pb-16 pt-16 sm:pb-24 sm:pt-24">
        <div className="max-w-[46rem]">
          <Reveal>
            <div className="eyebrow mb-5">
              Claude consulting · Claude Code builds
            </div>
          </Reveal>
          <Reveal delay={60}>
            <h1 className="font-display text-[clamp(38px,6.2vw,64px)] font-bold leading-[1.02] tracking-[-2px]">
              You&apos;ve got the idea.
              <br />
              Let&apos;s make it{" "}
              <em className="not-italic text-lime-ink">real.</em>
            </h1>
          </Reveal>
          <Reveal delay={120}>
            <p className="mt-6 max-w-[52ch] text-[17px] text-muted sm:text-lg">
              The Prompt Sherpa takes early-stage entrepreneurs from idea to
              working product with Claude Code. Landing pages, MVPs,
              prototypes. Most first versions ship in two to four weeks, and
              you don&apos;t need a technical co-founder to get there.
            </p>
          </Reveal>
          <Reveal delay={180}>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/intake" className="btn-primary">
                Start the build intake
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
              <Link href="/#build" className="btn-line">
                See what we build
              </Link>
            </div>
          </Reveal>
          <Reveal delay={240}>
            <dl className="mt-14 grid max-w-xl grid-cols-3 gap-6 border-t border-line pt-7">
              {[
                ["Idea → Concept", "one clear path, mapped for you"],
                ["Weeks, not months", "Claude Code moves fast"],
                ["Plain words", "describe it like you'd tell a friend"],
              ].map(([t, d]) => (
                <div key={t}>
                  <dt className="font-display text-[17px] font-bold text-ink">
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
