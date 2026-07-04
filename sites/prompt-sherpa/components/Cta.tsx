import Link from "next/link";
import { Reveal } from "./Reveal";

export function Cta() {
  return (
    <section className="container-site pb-16 sm:pb-24">
      <Reveal>
        <div className="relative overflow-hidden rounded-2xl bg-lime-deep px-7 py-14 text-center sm:px-12 sm:py-20">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 90% at 50% -10%, rgba(237,246,221,.14), transparent 65%)",
            }}
          />
          <h2 className="relative mx-auto max-w-2xl font-display text-[clamp(28px,4.6vw,46px)] font-bold leading-[1.06] tracking-[-1.4px] text-white">
            Rough is fine. Tell us the idea.
          </h2>
          <p className="relative mx-auto mt-4 max-w-[46ch] text-[15.5px] text-lime-soft/85">
            Five minutes, plain words, no business plan. Your answers save as
            you go — and the next step is a real build plan, not a sales call.
          </p>
          <div className="relative mt-9">
            <Link
              href="/intake"
              className="btn inline-flex bg-white font-semibold text-lime-deep shadow-lift transition-transform hover:-translate-y-px"
            >
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
          </div>
        </div>
      </Reveal>
    </section>
  );
}
