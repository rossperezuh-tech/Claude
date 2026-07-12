import type { Metadata } from "next";
import Link from "next/link";
import Wordmark from "@/components/Wordmark";
import { LOCATIONS, formatMoney } from "@/lib/locations";

export const metadata: Metadata = {
  title: "How to Learn to DJ in NYC (2026) — a straight answer | Deckroom",
  description:
    "The honest path to learning to DJ in New York: what gear actually matters, what to skip, where to practice on club-standard equipment in Brooklyn and Manhattan, and what it costs.",
  alternates: { canonical: "/learn-to-dj-nyc" },
  openGraph: {
    title: "How to Learn to DJ in NYC — a straight answer",
    description:
      "What gear matters, what to skip, and where to practice on club-standard equipment in Brooklyn and Manhattan.",
  },
};

const STEPS: { title: string; body: string }[] = [
  {
    title: "Learn the concepts free, at home",
    body: "Beatmatching, phrasing, EQing, and song structure are ideas before they're muscle memory. A laptop with free DJ software (rekordbox or Serato in demo mode) is enough to understand what a mix is supposed to do. Spend two or three weeks here. Spend zero dollars here.",
  },
  {
    title: "Skip the $300 starter controller",
    body: "The classic mistake: buy a plastic controller, learn its quirks for a year, then freeze the first time you stand in front of club gear because nothing is where your hands learned it. Club-standard players and mixers behave differently — bigger jogs, real pitch faders, a screen you navigate under pressure. If you might ever play out, practice on what venues actually run.",
  },
  {
    title: "Book hours on club-standard gear",
    body: "This is the step NYC makes easy. Instead of $3,000+ for your own OPUS-QUAD, book a private room that has one wired into tuned monitors. An hour or two a week compounds fast because every minute is on the real interface — loading tracks from USB, setting cues on the touchscreen, riding real faders across four decks at volume.",
  },
  {
    title: "Record every session and listen back",
    body: "The OPUS-QUAD records your mix to the same USB stick your music lives on. Play a 30-minute set, ride the train home, listen to it. You'll hear every rushed transition and every EQ clash. Nothing improves a DJ faster than being their own harshest listener.",
  },
  {
    title: "Play for people as soon as you're not embarrassing",
    body: "House parties, open decks nights, a friend's birthday. NYC has open-format nights across Brooklyn where beginners play three-track sets. You'll learn more in one nervous 20-minute slot than a month alone — but only if the gear doesn't surprise you. That's what the practice hours were for.",
  },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "How long does it take to learn to DJ?",
    a: "With 1–2 focused hours a week on real gear, most people can hold a clean 30-minute mix in two to three months. Getting good enough to play out — reading a room, recovering from mistakes calmly — usually takes six months to a year of consistent practice.",
  },
  {
    q: "Do I need to buy DJ equipment to learn?",
    a: "No. In NYC it's cheaper to rent time on professional equipment than to buy a flagship you'll only run a few hours a week. A Pioneer DJ OPUS-QUAD costs around $3,299 new; at Deckroom you practice on one for $45–60/hour, monitors and room included.",
  },
  {
    q: "How much does it cost to learn to DJ in NYC?",
    a: "Software is free to start. Practice space with pro gear runs $45–60/hour. One or two hours a week means roughly $180–480/month — less than most people's bar tab, and far less than buying and re-selling starter equipment.",
  },
  {
    q: "Where can I practice DJing in NYC if I live in an apartment?",
    a: "Sound-treated practice rooms exist exactly for this. Deckroom has two — Greenpoint (Brooklyn) and the Lower East Side (Manhattan) — private, treated, and bookable by the hour with no membership. You can play at performance volume, which you'll never do in a walk-up.",
  },
  {
    q: "Should I learn on CDJs or a controller?",
    a: "Learn on whatever standalone club-style gear you can get hands on. An all-in-one like the OPUS-QUAD uses the same layout, screen logic, and workflow as the CDJ + mixer booths in clubs, so everything transfers. A laptop-tethered controller teaches you a layout most venues don't have.",
  },
];

export default function LearnToDjPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  return (
    <main className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <header className="sticky top-0 z-40 border-b border-line bg-ink-950/80 backdrop-blur-md">
        <div className="container-x flex h-16 items-center justify-between">
          <Wordmark />
          <Link href="/#spaces" className="btn-primary !px-4 !py-2 text-[13px]">
            Book a room
          </Link>
        </div>
      </header>

      <article className="container-x max-w-3xl py-14 sm:py-20">
        <p className="kicker">Guide · Updated July 2026</p>
        <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.03em] sm:text-5xl">
          How to learn to DJ in NYC — a straight answer
        </h1>
        <p className="mt-6 text-base leading-relaxed text-fg-mid sm:text-lg">
          Most "learn to DJ" advice is written to sell you a controller or a
          12-week course. Here&apos;s the shorter, cheaper path New Yorkers
          actually take: learn the ideas free, then put your hours into
          club-standard gear so nothing surprises you the night it matters.
        </p>

        <ol className="mt-12 space-y-10">
          {STEPS.map(({ title, body }, i) => (
            <li key={title}>
              <p className="font-mono text-sm text-acid">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight">{title}</h2>
              <p className="mt-3 leading-relaxed text-fg-mid">{body}</p>
            </li>
          ))}
        </ol>

        <div className="card card-sheen mt-14 p-6 sm:p-8">
          <p className="kicker">Where step 3 happens</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">
            Private rooms, real gear, by the hour
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-fg-mid">
            Deckroom is two sound-treated practice rooms — Greenpoint, Brooklyn
            ({formatMoney(LOCATIONS.greenpoint.hourlyRateCents)}/hr) and the
            Lower East Side, Manhattan (
            {formatMoney(LOCATIONS.manhattan.hourlyRateCents)}/hr) — each with a
            Pioneer DJ OPUS-QUAD and tuned monitors. No membership, no gear to
            carry, book in under a minute.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/book/greenpoint" className="btn-primary !py-2.5">
              Book Greenpoint
            </Link>
            <Link href="/book/manhattan" className="btn-ghost !py-2.5">
              Book Manhattan
            </Link>
          </div>
        </div>

        <section className="mt-16">
          <h2 className="text-2xl font-semibold tracking-tight">
            Common questions
          </h2>
          <div className="mt-4 divide-y divide-line">
            {FAQ.map(({ q, a }) => (
              <details key={q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-medium">
                  {q}
                  <span aria-hidden className="font-mono text-fg-dim transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-fg-mid">{a}</p>
              </details>
            ))}
          </div>
        </section>
      </article>

      <footer className="border-t border-line">
        <div className="container-x flex flex-col items-start justify-between gap-4 py-8 sm:flex-row sm:items-center">
          <Wordmark />
          <p className="font-mono text-xs text-fg-dim">
            <Link href="/dj-practice-space-brooklyn" className="hover:text-fg-mid">
              DJ practice space in Brooklyn
            </Link>{" "}
            · <a href="mailto:book@deckroom.nyc" className="hover:text-fg-mid">book@deckroom.nyc</a>
          </p>
        </div>
      </footer>
    </main>
  );
}
