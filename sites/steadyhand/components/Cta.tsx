import Link from "next/link";
import { Reveal } from "./Reveal";

export function Cta() {
  return (
    <section className="container-site pb-16 sm:pb-24">
      <Reveal>
        <div className="relative overflow-hidden rounded-2xl bg-teal-deep px-7 py-14 text-center sm:px-12 sm:py-20">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 90% at 50% -10%, rgba(228,242,239,.14), transparent 65%)",
            }}
          />
          <h2 className="relative mx-auto max-w-2xl font-serif text-[clamp(28px,4.4vw,44px)] font-medium leading-[1.1] tracking-[-0.8px] text-white">
            Tell us how your business{" "}
            <em className="italic text-teal-soft">really</em> runs.
          </h2>
          <p className="relative mx-auto mt-4 max-w-[46ch] text-[15.5px] text-teal-soft/80">
            Five minutes of honest answers is all it takes to find the first
            task worth handing to Claude. Your answers save as you go.
          </p>
          <div className="relative mt-9">
            <Link
              href="/intake"
              className="btn inline-flex bg-white text-teal-deep shadow-lift transition-transform hover:-translate-y-px"
            >
              Start the project intake
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
