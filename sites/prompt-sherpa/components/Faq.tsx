"use client";

import { Reveal } from "./Reveal";

const FAQS = [
  {
    q: "Do I need to be technical?",
    a: "No. The intake asks you to describe the idea the way you'd tell a friend. We translate it into a build plan, and you review real working software — not wireframes and jargon.",
  },
  {
    q: "What can you actually build?",
    a: "First versions: landing pages with waitlists, simple web apps, booking and request flows, thin marketplaces, internal tools. If v1 needs payments, accounts, messaging, or notifications, we scope exactly which ones it needs — and which can wait.",
  },
  {
    q: "How fast is 'fast'?",
    a: "A landing page is usually live within a week. A simple web app takes two to four weeks including your feedback rounds. Claude Code does the heavy lifting; the calendar time is mostly you deciding what v1 really is.",
  },
  {
    q: "What do I need to bring?",
    a: "The idea, who it's for, and honest answers in the intake. A name or logo helps but isn't required. If you have reference products you love — a Rover, an Airbnb — name them and we'll borrow the right feelings.",
  },
  {
    q: "What happens after launch?",
    a: "You own everything — code, accounts, domain. We help you get it in front of your first 10 users, watch what happens together, and quote v2 only if the results earn it.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 border-t border-line">
      <div className="container-site py-16 sm:py-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
          <Reveal>
            <div className="eyebrow mb-4">FAQ</div>
            <h2 className="font-display text-[clamp(28px,4vw,38px)] font-bold leading-[1.08] tracking-[-1px]">
              Asked by every founder. Answered straight.
            </h2>
          </Reveal>

          <div>
            {FAQS.map((f, i) => (
              <Reveal key={f.q} delay={i * 60}>
                <details className="group border-b border-line py-1 first:border-t">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[16px] font-semibold [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4 shrink-0 fill-none stroke-faint transition-transform duration-300 group-open:rotate-45"
                      strokeWidth={2}
                      strokeLinecap="round"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </summary>
                  <p className="pb-5 pr-8 text-[14.5px] leading-relaxed text-muted">
                    {f.a}
                  </p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
