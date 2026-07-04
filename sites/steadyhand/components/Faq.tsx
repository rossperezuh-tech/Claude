"use client";

import { Reveal } from "./Reveal";

const FAQS = [
  {
    q: "Do we need to be technical?",
    a: "No. The intake asks you to describe your work the way you'd tell a friend. We handle everything technical, and the handover is written for the people who'll actually use it day to day.",
  },
  {
    q: "What happens to our data?",
    a: "You tell us in the intake if anything is sensitive. Ordinary workflows run on Claude with sensible data hygiene; anything that can't touch cloud tools — client financials, medical records — runs on a private model on your own hardware instead.",
  },
  {
    q: "Which tasks are a good fit?",
    a: "Repetitive, rule-following work with words in it: customer emails, quotes and proposals, invoices and follow-ups, scheduling, reports and paperwork, marketing content. If your team does it twenty times a week from a template, it's a candidate.",
  },
  {
    q: "How long does an engagement take?",
    a: "A pilot is usually working within a week. Core workflows run two to four weeks including testing on your real examples and training your team. We don't start a second task until the first one sticks.",
  },
  {
    q: "Is there a retainer or subscription?",
    a: "No. You own what we build — prompts, documentation, setup — and it keeps working without us. Some clients come back for the next task; that's the whole business model.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 border-t border-line">
      <div className="container-site py-16 sm:py-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
          <Reveal>
            <div className="eyebrow mb-4">FAQ</div>
            <h2 className="font-serif text-[clamp(28px,4vw,38px)] font-medium leading-[1.12] tracking-[-0.6px]">
              Fair questions, straight answers.
            </h2>
          </Reveal>

          <div>
            {FAQS.map((f, i) => (
              <Reveal key={f.q} delay={i * 60}>
                <details className="group border-b border-line py-1 first:border-t">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[16px] font-medium [&::-webkit-details-marker]:hidden">
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
